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
import { PromptEngine } from './PromptEngine'
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

  async cleanup(): Promise<void> {
    // Clean up expired entries
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key)
      }
    }
    console.log(
      `🧹 Cache cleanup completed. Remaining entries: ${this.cache.size}`
    )
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
  private _promptEngine: PromptEngine
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
  private rateLimiters = new Map<string, RateLimiter>()
  private requestQueue = new RequestQueue()
  private performanceMonitor = new PerformanceMonitor()
  private isProcessingQueue = false

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
    this._promptEngine = new PromptEngine()
    this.cacheManager = new SimpleCache()
    this.costOptimizer = new CostOptimizer()
    this.initializeUsageStats()
    this.setupCircuitBreakers()
    this.setupRateLimiters()
  }

  private initializeProviders(config: ProviderConfig) {
    console.log('🔧 Initializing AI Providers...')
    console.log('API Key available:', !!config.claude.apiKey)
    console.log(
      'API Key format:',
      config.claude.apiKey?.substring(0, 10) + '...'
    )

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
    console.log(
      `📋 Available providers: ${Array.from(this.providers.keys()).join(', ')}`
    )
  }

  private setupCircuitBreakers() {
    for (const name of this.providers.keys()) {
      const breaker = new CircuitBreaker(name, this.circuitBreakerConfig)
      this.circuitBreakers.set(name, breaker)
    }
  }

  private setupRateLimiters() {
    for (const name of this.providers.keys()) {
      // Get rate limits from provider config or use defaults
      const rateLimits =
        name === 'claude'
          ? {
              requestsPerMinute: 50,
              tokensPerMinute: 100000,
              dailyTokenLimit: 1000000,
            }
          : {
              requestsPerMinute: 100,
              tokensPerMinute: 500000,
              dailyTokenLimit: 5000000,
            }

      const limiter = new RateLimiter(name, rateLimits)
      this.rateLimiters.set(name, limiter)
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
  async generateResponse(
    request: AIRequest,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<AIResponse> {
    const startTime = Date.now()

    try {
      // Enhance request with optimized prompt
      const enhancedRequest = this.enhanceRequestWithPrompt(request)

      // Optimize the request (prompt compression, context pruning)
      const optimizedRequest =
        this.costOptimizer.optimizePrompt(enhancedRequest)

      // Add request to queue with priority
      const queuedRequest: QueuedRequest = {
        ...optimizedRequest,
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        priority,
        timestamp: Date.now(),
        startTime,
      }

      // Check if we can process immediately or need to queue
      if (await this.canProcessImmediately()) {
        return await this.processRequest(queuedRequest)
      } else {
        return await this.queueRequest(queuedRequest)
      }
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
        const requestStartTime = Date.now()
        const response = await this.executeWithRetry(provider, request)
        const requestEndTime = Date.now()

        // Record performance metrics
        this.performanceMonitor.recordRequest(providerName, {
          responseTime: requestEndTime - requestStartTime,
          tokensUsed: response.tokensUsed,
          success: true,
          timestamp: requestStartTime,
        })

        console.log(`✅ ${providerName} responded successfully`)
        circuitBreaker.recordSuccess()
        return response
      } catch (error) {
        const aiError = error as AIProviderError
        lastError = aiError
        circuitBreaker.recordFailure()

        // Record failure metrics
        this.performanceMonitor.recordRequest(providerName, {
          responseTime: Date.now() - Date.now(), // This will be overridden with actual time
          tokensUsed: 0,
          success: false,
          timestamp: Date.now(),
          error: aiError.code,
        })

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
   * Enhance request with optimized prompt using PromptEngine
   */
  private enhanceRequestWithPrompt(request: AIRequest): AIRequest {
    try {
      // Build system prompt using PromptEngine
      const systemPrompt = this._promptEngine.buildPrompt(request.context)

      // Add system message if not already present
      const hasSystemMessage = request.messages.some(
        msg => msg.role === 'system'
      )

      if (!hasSystemMessage) {
        return {
          ...request,
          messages: [
            { role: 'system', content: systemPrompt, timestamp: Date.now() },
            ...request.messages,
          ],
        }
      }

      return request
    } catch (error) {
      console.warn('⚠️ Failed to enhance request with PromptEngine:', error)
      return request
    }
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

    return `${messagesHash}:${contextHash}:${optionsHash}`
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
   * Get performance metrics for all providers
   */
  getPerformanceMetrics(): Record<string, any> {
    return this.performanceMonitor.getMetrics()
  }

  /**
   * Get rate limiter status for all providers
   */
  getRateLimiterStatus(): Record<string, any> {
    const status: Record<string, any> = {}
    for (const [name, limiter] of this.rateLimiters) {
      status[name] = limiter.getStatus()
    }
    return status
  }

  /**
   * Get request queue status
   */
  getQueueStatus() {
    return {
      ...this.requestQueue.getStatus(),
      isProcessing: this.isProcessingQueue,
    }
  }

  /**
   * Clear request queue (emergency use)
   */
  clearQueue() {
    this.requestQueue.clear()
    console.log('🧹 Request queue cleared')
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
   * Get detailed health status of all providers
   */
  async getHealthStatus(): Promise<Record<string, boolean>> {
    const healthStatus: Record<string, boolean> = {}

    for (const [name, provider] of this.providers) {
      try {
        healthStatus[name] = await provider.isHealthy()
      } catch (error) {
        console.warn(`❌ Health check failed for ${name}:`, error)
        healthStatus[name] = false
      }
    }

    return healthStatus
  }

  /**
   * Check overall health of AI Manager
   */
  async isHealthy(): Promise<boolean> {
    try {
      const healthStatus = await this.getHealthStatus()

      // Consider healthy if at least one provider is healthy
      const healthyProviders = Object.values(healthStatus).filter(
        status => status === true
      )
      const isHealthy = healthyProviders.length > 0

      console.log('🏥 AI Manager Health Status:', {
        totalProviders: Object.keys(healthStatus).length,
        healthyProviders: healthyProviders.length,
        overallHealth: isHealthy,
        providerStatus: healthStatus,
      })

      return isHealthy
    } catch (error) {
      console.error('❌ Health check failed:', error)
      return false
    }
  }

  /**
   * Check if request can be processed immediately
   */
  private async canProcessImmediately(): Promise<boolean> {
    // Check if queue is empty and no rate limits are hit
    return this.requestQueue.isEmpty() && !this.isProcessingQueue
  }

  /**
   * Process a request directly
   */
  private async processRequest(
    queuedRequest: QueuedRequest
  ): Promise<AIResponse> {
    const { startTime, ...request } = queuedRequest

    // Check rate limits before processing
    await this.checkRateLimits(request)

    // Check cache first
    const cacheKey = this.generateCacheKey(request)
    const cachedResponse = await this.cacheManager.get(cacheKey)

    if (cachedResponse && this.costOptimizer.shouldUseCache(request)) {
      this.updateUsageStats(cachedResponse, startTime, true)
      return {
        ...cachedResponse,
        cached: true,
        processingTime: Date.now() - startTime,
      }
    }

    // Select best provider
    const providerName = await this.costOptimizer.selectProvider(request)
    const response = await this.executeWithFallback(request, providerName)

    // Cache successful response
    if (response.confidence > 0.7) {
      await this.cacheManager.set(cacheKey, response)
    }

    this.updateUsageStats(response, startTime, false)
    return response
  }

  /**
   * Queue a request for later processing
   */
  private async queueRequest(
    queuedRequest: QueuedRequest
  ): Promise<AIResponse> {
    return new Promise((resolve, reject) => {
      this.requestQueue.enqueue({
        ...queuedRequest,
        resolve,
        reject,
      })

      // Start processing queue if not already running
      if (!this.isProcessingQueue) {
        this.processQueue()
      }
    })
  }

  /**
   * Process queued requests
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue) return
    this.isProcessingQueue = true

    try {
      while (!this.requestQueue.isEmpty()) {
        const queuedRequest = this.requestQueue.dequeue()
        if (!queuedRequest) break

        try {
          const response = await this.processRequest(queuedRequest)
          queuedRequest.resolve(response)
        } catch (error) {
          queuedRequest.reject(error)
        }

        // Small delay between requests to avoid overwhelming providers
        await this.sleep(100)
      }
    } finally {
      this.isProcessingQueue = false
    }
  }

  /**
   * Check rate limits for all providers before processing request
   */
  private async checkRateLimits(request: AIRequest): Promise<void> {
    const estimatedTokens = this.estimateTokens(request)

    for (const [providerName, rateLimiter] of this.rateLimiters) {
      if (!rateLimiter.canMakeRequest(estimatedTokens)) {
        const delay = rateLimiter.getRetryDelay()
        if (delay > 0) {
          console.warn(
            `⏱️ Rate limit reached for ${providerName}, waiting ${delay}ms`
          )
          await this.sleep(delay)
        } else {
          throw new Error(`Daily quota exceeded for ${providerName}`)
        }
      }
    }
  }

  /**
   * Estimate token usage for a request
   */
  private estimateTokens(request: AIRequest): number {
    const messageText = request.messages.map(msg => msg.content).join(' ')

    // Rough estimation: 1 token ≈ 4 characters for English, 1-2 for Korean
    const avgCharsPerToken = 3
    return Math.ceil(messageText.length / avgCharsPerToken)
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

    // Reset rate limiters
    for (const rateLimiter of this.rateLimiters.values()) {
      rateLimiter.reset()
    }
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

/**
 * Rate Limiter implementation
 */
class RateLimiter {
  private requestCount = 0
  private tokenCount = 0
  private dailyTokens = 0
  private lastReset = Date.now()
  private dailyReset = Date.now()

  constructor(
    private name: string,
    private limits: {
      requestsPerMinute: number
      tokensPerMinute: number
      dailyTokenLimit: number
    }
  ) {}

  canMakeRequest(estimatedTokens: number): boolean {
    const now = Date.now()

    // Reset counters if a minute has passed
    if (now - this.lastReset > 60000) {
      this.requestCount = 0
      this.tokenCount = 0
      this.lastReset = now
    }

    // Reset daily counter if a day has passed
    if (now - this.dailyReset > 86400000) {
      this.dailyTokens = 0
      this.dailyReset = now
    }

    // Check all limits
    const canMakeRequest =
      this.requestCount < this.limits.requestsPerMinute &&
      this.tokenCount + estimatedTokens <= this.limits.tokensPerMinute &&
      this.dailyTokens + estimatedTokens <= this.limits.dailyTokenLimit

    if (canMakeRequest) {
      this.requestCount++
      this.tokenCount += estimatedTokens
      this.dailyTokens += estimatedTokens
    }

    return canMakeRequest
  }

  getRetryDelay(): number {
    const now = Date.now()
    const timeUntilReset = 60000 - (now - this.lastReset)

    // If daily limit exceeded, return 0 (can't retry)
    if (this.dailyTokens >= this.limits.dailyTokenLimit) {
      return 0
    }

    return Math.max(0, timeUntilReset)
  }

  reset() {
    this.requestCount = 0
    this.tokenCount = 0
    this.dailyTokens = 0
    this.lastReset = Date.now()
    this.dailyReset = Date.now()
  }

  getStatus() {
    const now = Date.now()
    return {
      requests: {
        current: this.requestCount,
        limit: this.limits.requestsPerMinute,
        resetIn: Math.max(0, 60000 - (now - this.lastReset)),
      },
      tokens: {
        current: this.tokenCount,
        limit: this.limits.tokensPerMinute,
        resetIn: Math.max(0, 60000 - (now - this.lastReset)),
      },
      dailyTokens: {
        current: this.dailyTokens,
        limit: this.limits.dailyTokenLimit,
        resetIn: Math.max(0, 86400000 - (now - this.dailyReset)),
      },
    }
  }
}

/**
 * Performance Monitor implementation
 */
class PerformanceMonitor {
  private metrics = new Map<string, PerformanceMetric[]>()
  private readonly maxMetrics = 1000 // Keep last 1000 requests per provider

  recordRequest(
    provider: string,
    metric: {
      responseTime: number
      tokensUsed: number
      success: boolean
      timestamp: number
      error?: string
    }
  ) {
    if (!this.metrics.has(provider)) {
      this.metrics.set(provider, [])
    }

    const providerMetrics = this.metrics.get(provider)!
    providerMetrics.push({
      ...metric,
      id: `${provider}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    })

    // Keep only the most recent metrics
    if (providerMetrics.length > this.maxMetrics) {
      providerMetrics.shift()
    }
  }

  getMetrics(): Record<string, ProviderPerformanceMetrics> {
    const result: Record<string, ProviderPerformanceMetrics> = {}

    for (const [provider, metrics] of this.metrics) {
      if (metrics.length === 0) {
        result[provider] = {
          totalRequests: 0,
          successRate: 0,
          averageResponseTime: 0,
          medianResponseTime: 0,
          p95ResponseTime: 0,
          totalTokens: 0,
          errorsByType: {},
          recentPerformance: [],
        }
        continue
      }

      const successfulRequests = metrics.filter(m => m.success)
      const failedRequests = metrics.filter(m => !m.success)

      const responseTimes = successfulRequests
        .map(m => m.responseTime)
        .sort((a, b) => a - b)

      const errorsByType: Record<string, number> = {}
      failedRequests.forEach(request => {
        if (request.error) {
          errorsByType[request.error] = (errorsByType[request.error] || 0) + 1
        }
      })

      result[provider] = {
        totalRequests: metrics.length,
        successRate: successfulRequests.length / metrics.length,
        averageResponseTime:
          responseTimes.length > 0
            ? responseTimes.reduce((sum, time) => sum + time, 0) /
              responseTimes.length
            : 0,
        medianResponseTime:
          responseTimes.length > 0
            ? responseTimes[Math.floor(responseTimes.length / 2)]
            : 0,
        p95ResponseTime:
          responseTimes.length > 0
            ? responseTimes[Math.floor(responseTimes.length * 0.95)]
            : 0,
        totalTokens: metrics.reduce((sum, m) => sum + m.tokensUsed, 0),
        errorsByType,
        recentPerformance: metrics.slice(-10), // Last 10 requests
      }
    }

    return result
  }

  reset() {
    this.metrics.clear()
  }
}

interface PerformanceMetric {
  id: string
  responseTime: number
  tokensUsed: number
  success: boolean
  timestamp: number
  error?: string
}

interface ProviderPerformanceMetrics {
  totalRequests: number
  successRate: number
  averageResponseTime: number
  medianResponseTime: number
  p95ResponseTime: number
  totalTokens: number
  errorsByType: Record<string, number>
  recentPerformance: PerformanceMetric[]
}

/**
 * Request Queue implementation with priority handling
 */
class RequestQueue {
  private queues = {
    high: [] as QueuedRequestWithCallbacks[],
    normal: [] as QueuedRequestWithCallbacks[],
    low: [] as QueuedRequestWithCallbacks[],
  }

  enqueue(request: QueuedRequestWithCallbacks) {
    this.queues[request.priority].push(request)
  }

  dequeue(): QueuedRequestWithCallbacks | null {
    // Process high priority first, then normal, then low
    if (this.queues.high.length > 0) {
      return this.queues.high.shift()!
    }
    if (this.queues.normal.length > 0) {
      return this.queues.normal.shift()!
    }
    if (this.queues.low.length > 0) {
      return this.queues.low.shift()!
    }
    return null
  }

  isEmpty(): boolean {
    return (
      this.queues.high.length === 0 &&
      this.queues.normal.length === 0 &&
      this.queues.low.length === 0
    )
  }

  getStatus() {
    return {
      high: this.queues.high.length,
      normal: this.queues.normal.length,
      low: this.queues.low.length,
      total:
        this.queues.high.length +
        this.queues.normal.length +
        this.queues.low.length,
    }
  }

  clear() {
    this.queues.high = []
    this.queues.normal = []
    this.queues.low = []
  }
}

interface QueuedRequest extends AIRequest {
  id: string
  priority: 'high' | 'normal' | 'low'
  timestamp: number
  startTime: number
}

interface QueuedRequestWithCallbacks extends QueuedRequest {
  resolve: (response: AIResponse) => void
  reject: (error: Error) => void
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
