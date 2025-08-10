import {
  AIProvider,
  AIRequest,
  AIResponse,
  AIProviderError,
  ProviderConfig,
  AIUsageStats,
  RetryStrategy,
  CircuitBreakerConfig,
} from './types'
import { ClaudeProvider } from './providers/ClaudeProvider'
import { MockProvider } from './providers/MockProvider'
// import { PromptEngine } from './PromptEngine' // Temporarily disabled
// Simple in-memory cache to replace CacheManager
class SimpleCache {
  private cache = new Map<string, { data: any; expires: number }>()
  
  async get(key: string): Promise<any> {
    const item = this.cache.get(key)
    if (!item || Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }
    return item.data
  }
  
  async set(key: string, data: any, ttl = 300000): Promise<void> {
    this.cache.set(key, { data, expires: Date.now() + ttl })
  }
  
  getStats() {
    return { size: this.cache.size, hitRate: 0 }
  }
}
import { CostOptimizer } from './CostOptimizer'
import { ENV } from '@config/env'

/**
 * AI Manager - Central orchestrator for all AI provider interactions
 * Features:
 * - Multi-provider support with intelligent fallback
 * - Response caching for cost optimization
 * - Circuit breaker for reliability
 * - Usage analytics and cost tracking
 * - Prompt optimization and template management
 */
export class AIManager {
  private providers = new Map<string, AIProvider>()
  // private _promptEngine: PromptEngine // Temporarily disabled
  private cacheManager: SimpleCache
  private costOptimizer: CostOptimizer
  private usageStats: AIUsageStats = {
    totalRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    errorRate: 0,
    providerUsage: {},
    cacheStats: {
      hits: 0,
      misses: 0,
      hitRate: 0,
    },
  }
  private circuitBreakers = new Map<string, CircuitBreaker>()

  private readonly retryStrategy: RetryStrategy = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryableErrors: [
      'RATE_LIMIT_EXCEEDED',
      'NETWORK_ERROR',
      'TIMEOUT',
      'SERVER_ERROR',
    ],
  }

  private readonly circuitBreakerConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    recoveryTimeout: 30000,
    monitoringPeriod: 60000,
  }

  constructor(config: ProviderConfig) {
    this.initializeProviders(config)
    // this._promptEngine = new PromptEngine() // Temporarily disabled
    this.cacheManager = new SimpleCache()
    this.costOptimizer = new CostOptimizer()
    this.initializeUsageStats()
    this.setupCircuitBreakers()
  }

  private initializeProviders(config: ProviderConfig) {
    console.log('🔧 Initializing AI Providers...')
    console.log('API Key available:', !!config.claude.apiKey)
    console.log('API Key format:', config.claude.apiKey?.substring(0, 10) + '...')
    
    // Initialize Claude provider (primary)
    if (config.claude.apiKey) {
      try {
        const claudeProvider = new ClaudeProvider(config.claude)
        this.providers.set('claude', claudeProvider)
        console.log('✅ Claude provider initialized successfully')
      } catch (error) {
        console.error('❌ Failed to initialize Claude provider:', error)
      }
    } else {
      console.warn('⚠️ No Claude API key provided')
    }

    // Always initialize mock provider for development/testing
    const mockProvider = new MockProvider()
    this.providers.set('mock', mockProvider)
    console.log('✅ Mock provider initialized')

    // Validate at least one provider is available
    if (this.providers.size === 1 && this.providers.has('mock')) {
      console.warn('⚠️ Only mock provider available - check API keys')
    }
    
    console.log(`📊 Total providers initialized: ${this.providers.size}`)
    console.log(`📋 Available providers: ${Array.from(this.providers.keys()).join(', ')}`)
  }

  private setupCircuitBreakers() {
    for (const name of this.providers.keys()) {
      const breaker = new CircuitBreaker(name, this.circuitBreakerConfig)
      this.circuitBreakers.set(name, breaker)
    }
  }

  private initializeUsageStats() {
    this.usageStats = {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      errorRate: 0,
      providerUsage: {},
      dailyUsage: [],
    }
  }

  /**
   * Generate AI response with intelligent provider selection and fallback
   */
  async generateResponse(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now()

    try {
      // Optimize the request (prompt compression, context pruning)
      const optimizedRequest = this.costOptimizer.optimizePrompt(request)

      // Check cache first
      const cacheKey = this.generateCacheKey(optimizedRequest)
      const cachedResponse = await this.cacheManager.get(cacheKey)

      if (
        cachedResponse &&
        this.costOptimizer.shouldUseCache(optimizedRequest)
      ) {
        this.updateUsageStats(cachedResponse, startTime, true)
        return {
          ...cachedResponse,
          cached: true,
          processingTime: Date.now() - startTime,
        }
      }

      // Select best provider
      const providerName =
        await this.costOptimizer.selectProvider(optimizedRequest)
      const response = await this.executeWithFallback(
        optimizedRequest,
        providerName
      )

      // Cache successful response
      if (response.confidence > 0.7) {
        await this.cacheManager.set(cacheKey, response)
      }

      this.updateUsageStats(response, startTime, false)
      return response
    } catch (error) {
      const errorResponse = this.handleError(
        error as AIProviderError,
        startTime
      )
      this.updateUsageStats(errorResponse, startTime, false)
      throw error
    }
  }

  /**
   * Execute request with intelligent fallback strategy
   */
  private async executeWithFallback(
    request: AIRequest,
    preferredProvider: string
  ): Promise<AIResponse> {
    const providers = this.getProvidersInOrder(preferredProvider)
    let lastError: AIProviderError | null = null

    for (const providerName of providers) {
      const provider = this.providers.get(providerName)
      const circuitBreaker = this.circuitBreakers.get(providerName)

      if (!provider || !circuitBreaker) continue

      // Skip if circuit breaker is open
      if (circuitBreaker.isOpen()) {
        console.warn(`⚠️ Circuit breaker open for ${providerName}`)
        continue
      }

      try {
        console.log(`🤖 Attempting request with ${providerName}`)
        const response = await this.executeWithRetry(provider, request)
        console.log(`✅ ${providerName} responded successfully`)
        circuitBreaker.recordSuccess()
        return response
      } catch (error) {
        const aiError = error as AIProviderError
        lastError = aiError
        circuitBreaker.recordFailure()

        console.warn(`❌ ${providerName} failed:`, aiError.message)

        // If not recoverable, don't try other providers
        if (!aiError.recoverable) {
          break
        }
      }
    }

    // All providers failed
    throw lastError || new Error('All AI providers are unavailable')
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry(
    provider: AIProvider,
    request: AIRequest
  ): Promise<AIResponse> {
    let attempt = 0
    let lastError: AIProviderError | null = null

    while (attempt <= this.retryStrategy.maxRetries) {
      try {
        return await provider.generateResponse(request)
      } catch (error) {
        const aiError = error as AIProviderError
        lastError = aiError
        attempt++

        // Don't retry if error is not retryable
        if (!this.retryStrategy.retryableErrors.includes(aiError.code)) {
          break
        }

        // Don't retry if we've hit max attempts
        if (attempt > this.retryStrategy.maxRetries) {
          break
        }

        // Calculate backoff delay
        const delay = Math.min(
          this.retryStrategy.baseDelay *
            Math.pow(this.retryStrategy.backoffMultiplier, attempt - 1),
          this.retryStrategy.maxDelay
        )

        console.log(
          `🔄 Retrying in ${delay}ms (attempt ${attempt}/${this.retryStrategy.maxRetries})`
        )
        await this.sleep(delay)
      }
    }

    throw lastError
  }

  /**
   * Get providers in order of preference
   */
  private getProvidersInOrder(preferredProvider: string): string[] {
    const availableProviders = Array.from(this.providers.keys())
      .filter(name => name !== 'mock') // Mock is last resort
      .sort((a, b) => {
        const providerA = this.providers.get(a)!
        const providerB = this.providers.get(b)!
        return providerA.priority - providerB.priority
      })

    // Put preferred provider first
    const ordered = [preferredProvider]
    availableProviders.forEach(name => {
      if (name !== preferredProvider) {
        ordered.push(name)
      }
    })

    // Add mock provider as last resort if available
    if (this.providers.has('mock')) {
      ordered.push('mock')
    }

    return ordered
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: AIRequest): string {
    const messagesHash = this.hashString(JSON.stringify(request.messages))
    const contextHash = this.hashString(
      JSON.stringify({
        companionName: request.context.companionName,
        relationshipLevel: request.context.relationshipLevel,
        companionEmotion: request.context.companionEmotion,
        currentScene: request.context.currentScene,
      })
    )
    const optionsHash = this.hashString(JSON.stringify(request.options || {}))

    return {
      messages: messagesHash,
      context: contextHash,
      options: optionsHash,
    }
  }

  /**
   * Simple string hashing function
   */
  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash.toString(36)
  }

  /**
   * Update usage statistics
   */
  private updateUsageStats(
    response: AIResponse,
    startTime: number,
    cached: boolean
  ) {
    this.usageStats.totalRequests++
    if (!cached) {
      this.usageStats.totalTokens += response.tokensUsed
      this.usageStats.totalCost += response.metadata?.totalCost || 0
    }

    const responseTime = Date.now() - startTime
    this.usageStats.averageResponseTime =
      (this.usageStats.averageResponseTime + responseTime) / 2

    // Update cache hit rate
    const cacheHits = cached ? 1 : 0
    this.usageStats.cacheHitRate =
      (this.usageStats.cacheHitRate + cacheHits) / this.usageStats.totalRequests

    // Update provider-specific stats
    const providerStats = this.usageStats.providerUsage[response.provider] || {
      requests: 0,
      tokens: 0,
      cost: 0,
      errors: 0,
      averageResponseTime: 0,
    }

    providerStats.requests++
    if (!cached) {
      providerStats.tokens += response.tokensUsed
      providerStats.cost += response.metadata?.totalCost || 0
    }
    providerStats.averageResponseTime =
      (providerStats.averageResponseTime + responseTime) / 2

    this.usageStats.providerUsage[response.provider] = providerStats
  }

  /**
   * Handle errors and create error responses
   */
  private handleError(error: AIProviderError, startTime: number): AIResponse {
    console.error('❌ AI Manager Error:', error)

    // Update error rate
    this.usageStats.totalRequests++
    const errorRate = this.usageStats.errorRate
    this.usageStats.errorRate = (errorRate + 1) / this.usageStats.totalRequests

    // Return fallback response
    return {
      content: '죄송해요, 지금 대답하기가 어려워요. 잠시 후 다시 말해보세요.',
      emotion: 'confused',
      confidence: 0.1,
      tokensUsed: 0,
      provider: 'error-handler',
      processingTime: Date.now() - startTime,
      cached: false,
      metadata: {
        model: 'error-fallback',
        finishReason: 'error',
        totalCost: 0,
        promptTokens: 0,
        completionTokens: 0,
        cacheHit: false,
        retryCount: 0,
      },
    }
  }

  /**
   * Get current usage statistics
   */
  getUsageStats(): AIUsageStats {
    return { ...this.usageStats }
  }

  /**
   * Check health of all providers
   */
  async checkHealth(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {}

    for (const [name, provider] of this.providers) {
      try {
        health[name] = await provider.isHealthy()
      } catch (error) {
        health[name] = false
      }
    }

    return health
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Shutdown - cleanup resources
   */
  async shutdown() {
    console.log('🛑 Shutting down AI Manager...')
    await this.cacheManager.cleanup()
  }
}

/**
 * Circuit Breaker implementation
 */
class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'

  constructor(
    private name: string,
    private config: CircuitBreakerConfig
  ) {}

  isOpen(): boolean {
    if (this.state === 'closed') return false
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.config.recoveryTimeout) {
        this.state = 'half-open'
        return false
      }
      return true
    }
    return false // half-open
  }

  recordSuccess() {
    this.failures = 0
    this.state = 'closed'
  }

  recordFailure() {
    this.failures++
    this.lastFailureTime = Date.now()

    if (this.failures >= this.config.failureThreshold) {
      this.state = 'open'
      console.warn(`🚨 Circuit breaker opened for ${this.name}`)
    }
  }
}

// Export singleton instance
let aiManagerInstance: AIManager | null = null

export const getAIManager = (): AIManager => {
  if (!aiManagerInstance) {
    const config: ProviderConfig = {
      claude: {
        apiKey: ENV.CLAUDE_API_KEY,
        baseUrl: 'https://api.anthropic.com',
        model: 'claude-3-haiku-20240307',
        maxTokens: 2048,
        defaultTemperature: 0.7,
        rateLimits: {
          requestsPerMinute: 50,
          tokensPerMinute: 100000,
          dailyTokenLimit: 1000000,
        },
      },
      fallback: {
        enabled: true,
        providers: ['claude', 'mock'],
        maxRetries: 3,
        retryDelay: 1000,
      },
    }

    aiManagerInstance = new AIManager(config)
  }

  return aiManagerInstance
}
