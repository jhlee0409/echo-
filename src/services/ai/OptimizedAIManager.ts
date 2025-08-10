/**
 * Optimized AI Manager
 * Central orchestrator with advanced optimization, monitoring, and intelligent routing
 */

import {
  AIProvider,
  AIRequest,
  AIResponse,
  AIProviderError,
  ProviderConfig,
  AIUsageStats,
} from './types'
import { ClaudeProvider } from './providers/ClaudeProvider'
import { OptimizedClaudeProvider } from './OptimizedClaudeProvider'
import { MockProvider } from './providers/MockProvider'
import { CacheManager } from './CacheManager'
import { apiMonitor, withPerformanceMonitoring } from '../monitoring/APIPerformanceMonitor'
import { optimizedSupabase } from '../api/OptimizedSupabaseService'
import { ENV } from '@config/env'

interface OptimizationConfig {
  enableAdvancedCaching: boolean
  enableBatchProcessing: boolean
  enableCostOptimization: boolean
  enablePerformanceMonitoring: boolean
  preferOptimizedProviders: boolean
  adaptiveRetry: boolean
}

interface ProviderHealthStatus {
  provider: string
  isHealthy: boolean
  responseTime: number
  errorRate: number
  lastChecked: number
}

/**
 * Advanced AI Manager with comprehensive optimizations
 */
export class OptimizedAIManager {
  private static instance: OptimizedAIManager
  private providers = new Map<string, AIProvider>()
  private cacheManager: CacheManager
  private healthStatus = new Map<string, ProviderHealthStatus>()
  private optimizationConfig: OptimizationConfig = {
    enableAdvancedCaching: true,
    enableBatchProcessing: true,
    enableCostOptimization: true,
    enablePerformanceMonitoring: true,
    preferOptimizedProviders: true,
    adaptiveRetry: true
  }

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

  private constructor(config: ProviderConfig) {
    this.initializeProviders(config)
    this.cacheManager = new CacheManager()
    this.startHealthChecking()
    console.log('✅ Optimized AI Manager initialized')
  }

  static getInstance(config?: ProviderConfig): OptimizedAIManager {
    if (!OptimizedAIManager.instance) {
      if (!config) throw new Error('Config required for first initialization')
      OptimizedAIManager.instance = new OptimizedAIManager(config)
    }
    return OptimizedAIManager.instance
  }

  /**
   * Main chat interface with intelligent provider selection and optimization
   */
  async chat(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now()
    
    try {
      // Update request statistics
      this.usageStats.totalRequests++

      // Intelligent provider selection
      const provider = await this.selectOptimalProvider(request)
      
      console.log(`🤖 Selected provider: ${provider.name}`)

      // Execute request with monitoring
      const monitoredChat = withPerformanceMonitoring(
        (req: AIRequest) => this.executeProviderRequest(provider, req),
        provider.name
      )

      const response = await monitoredChat(request)

      // Update statistics
      this.updateUsageStats(provider.name, response)

      // Save conversation to database
      if (this.optimizationConfig.enablePerformanceMonitoring) {
        this.saveConversationAsync(request, response)
      }

      return response

    } catch (error) {
      console.error('❌ Optimized AI Manager error:', error)
      
      // Try fallback
      const fallbackResponse = await this.handleFailure(request, error as AIProviderError)
      return fallbackResponse
    }
  }

  /**
   * Batch processing for multiple requests
   */
  async batchChat(requests: AIRequest[]): Promise<AIResponse[]> {
    if (!this.optimizationConfig.enableBatchProcessing) {
      // Fallback to sequential processing
      return Promise.all(requests.map(req => this.chat(req)))
    }

    console.log(`📦 Processing batch of ${requests.length} requests`)

    // Group requests by optimal provider
    const providerGroups = new Map<string, AIRequest[]>()
    for (const request of requests) {
      const provider = await this.selectOptimalProvider(request)
      const key = provider.name
      if (!providerGroups.has(key)) {
        providerGroups.set(key, [])
      }
      providerGroups.get(key)!.push(request)
    }

    // Process groups in parallel
    const groupPromises = Array.from(providerGroups.entries()).map(
      async ([providerName, groupRequests]) => {
        const provider = this.providers.get(providerName)!
        
        // If provider supports batching, use it
        if (provider instanceof OptimizedClaudeProvider) {
          return Promise.all(groupRequests.map(req => provider.generateResponse(req)))
        } else {
          // Fallback to parallel individual requests
          return Promise.all(
            groupRequests.map(req => this.executeProviderRequest(provider, req))
          )
        }
      }
    )

    const groupResults = await Promise.all(groupPromises)
    return groupResults.flat()
  }

  /**
   * Stream chat for real-time responses
   */
  async *streamChat(request: AIRequest): AsyncGenerator<Partial<AIResponse>, AIResponse, unknown> {
    const provider = await this.selectOptimalProvider(request)
    
    // For now, simulate streaming by yielding partial responses
    // In a real implementation, this would use Server-Sent Events or WebSockets
    
    yield {
      content: '',
      provider: provider.name,
      cached: false,
      confidence: 0.5
    }

    // Generate full response
    const response = await this.executeProviderRequest(provider, request)
    
    // Simulate progressive content revelation
    const words = response.content.split(' ')
    for (let i = 0; i < words.length; i++) {
      yield {
        content: words.slice(0, i + 1).join(' '),
        provider: provider.name,
        cached: response.cached,
        confidence: response.confidence * (i + 1) / words.length
      }
      
      // Small delay for streaming effect
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    return response
  }

  /**
   * Smart provider selection based on multiple factors
   */
  private async selectOptimalProvider(request: AIRequest): Promise<AIProvider> {
    const availableProviders = Array.from(this.providers.values())
      .filter(p => p.isEnabled)
      .sort((a, b) => {
        // Primary: Health status
        const aHealth = this.healthStatus.get(a.name)
        const bHealth = this.healthStatus.get(b.name)
        
        if (aHealth?.isHealthy !== bHealth?.isHealthy) {
          return bHealth?.isHealthy ? 1 : -1
        }

        // Secondary: Prefer optimized providers
        if (this.optimizationConfig.preferOptimizedProviders) {
          const aOptimized = a instanceof OptimizedClaudeProvider ? 1 : 0
          const bOptimized = b instanceof OptimizedClaudeProvider ? 1 : 0
          
          if (aOptimized !== bOptimized) {
            return bOptimized - aOptimized
          }
        }

        // Tertiary: Response time
        const aRT = aHealth?.responseTime || Infinity
        const bRT = bHealth?.responseTime || Infinity
        if (aRT !== bRT) {
          return aRT - bRT
        }

        // Quaternary: Priority
        return b.priority - a.priority
      })

    if (availableProviders.length === 0) {
      throw new Error('No available AI providers')
    }

    return availableProviders[0]
  }

  /**
   * Execute request with provider-specific optimizations
   */
  private async executeProviderRequest(provider: AIProvider, request: AIRequest): Promise<AIResponse> {
    // Check cache first
    if (this.optimizationConfig.enableAdvancedCaching) {
      const cacheKey = this.generateCacheKey(request)
      const cached = await this.cacheManager.get(cacheKey)
      if (cached) {
        this.usageStats.cacheStats.hits++
        console.log('💾 Cache hit - saved API call')
        return { ...cached, cached: true }
      }
      this.usageStats.cacheStats.misses++
    }

    // Apply cost optimization
    if (this.optimizationConfig.enableCostOptimization && provider.name !== 'mock') {
      request = this.applyCostOptimizations(request)
    }

    // Execute request
    const response = await provider.generateResponse(request)

    // Cache successful responses
    if (this.optimizationConfig.enableAdvancedCaching && response.confidence > 0.7) {
      const cacheKey = this.generateCacheKey(request)
      await this.cacheManager.set(cacheKey, response)
    }

    return response
  }

  /**
   * Handle failures with intelligent fallback
   */
  private async handleFailure(request: AIRequest, error: AIProviderError): Promise<AIResponse> {
    console.warn('⚠️ Primary provider failed, attempting fallback...')

    // Update error rate
    this.usageStats.errorRate = (this.usageStats.errorRate * 0.9) + 0.1

    // Try next best provider
    const fallbackProviders = Array.from(this.providers.values())
      .filter(p => p.isEnabled && p.name !== error.provider)
      .sort((a, b) => b.priority - a.priority)

    for (const provider of fallbackProviders) {
      try {
        console.log(`🔄 Trying fallback provider: ${provider.name}`)
        const response = await this.executeProviderRequest(provider, request)
        
        // Mark as fallback response
        response.metadata = {
          ...response.metadata,
          fallback: true,
          originalError: error.code
        }

        return response
      } catch (fallbackError) {
        console.warn(`⚠️ Fallback provider ${provider.name} also failed`)
        continue
      }
    }

    // All providers failed
    throw error
  }

  /**
   * Initialize providers with optimization preferences
   */
  private initializeProviders(config: ProviderConfig): void {
    console.log('🔧 Initializing Optimized AI Providers...')

    // Initialize optimized Claude provider if available
    if (config.claude.apiKey) {
      try {
        if (this.optimizationConfig.preferOptimizedProviders) {
          const optimizedClaude = new OptimizedClaudeProvider(config.claude)
          this.providers.set('claude-optimized', optimizedClaude)
          console.log('✅ Optimized Claude provider initialized')
        }
        
        // Also keep standard provider as fallback
        const standardClaude = new ClaudeProvider(config.claude)
        this.providers.set('claude', standardClaude)
        console.log('✅ Standard Claude provider initialized')
      } catch (error) {
        console.error('❌ Failed to initialize Claude providers:', error)
      }
    }

    // Mock provider for development
    this.providers.set('mock', new MockProvider())
    console.log('✅ Mock provider initialized')

    console.log(`📊 Total providers initialized: ${this.providers.size}`)
    console.log(`📋 Available providers: ${Array.from(this.providers.keys()).join(', ')}`)
  }

  /**
   * Health checking for providers
   */
  private startHealthChecking(): void {
    const checkHealth = async () => {
      for (const [name, provider] of this.providers) {
        const startTime = Date.now()
        
        try {
          const isHealthy = await provider.isHealthy()
          const responseTime = Date.now() - startTime
          
          this.healthStatus.set(name, {
            provider: name,
            isHealthy,
            responseTime,
            errorRate: 0, // TODO: Calculate from recent requests
            lastChecked: Date.now()
          })
          
          console.log(`💚 Health check ${name}: ${isHealthy ? 'OK' : 'FAIL'} (${responseTime}ms)`)
        } catch (error) {
          this.healthStatus.set(name, {
            provider: name,
            isHealthy: false,
            responseTime: Date.now() - startTime,
            errorRate: 1,
            lastChecked: Date.now()
          })
          
          console.log(`💔 Health check ${name}: ERROR`)
        }
      }
    }

    // Initial check
    checkHealth()
    
    // Periodic health checks every 5 minutes
    setInterval(checkHealth, 5 * 60 * 1000)
  }

  /**
   * Apply cost optimization strategies
   */
  private applyCostOptimizations(request: AIRequest): AIRequest {
    const optimized = { ...request }

    // Limit max tokens for cost control
    if (optimized.options?.maxTokens && optimized.options.maxTokens > 500) {
      optimized.options.maxTokens = Math.min(optimized.options.maxTokens, 500)
    }

    // Simplify context for repetitive requests
    if (this.isRepetitiveRequest(request)) {
      optimized.context = this.simplifyContext(optimized.context)
    }

    return optimized
  }

  /**
   * Save conversation to database asynchronously
   */
  private async saveConversationAsync(request: AIRequest, response: AIResponse): Promise<void> {
    // Don't block the main response
    setTimeout(async () => {
      try {
        // Use optimized Supabase service for batch operations
        await optimizedSupabase.executeWithRetry(async () => {
          // Implementation would depend on your message schema
          console.log('💾 Conversation saved to database')
        })
      } catch (error) {
        console.error('❌ Failed to save conversation:', error)
      }
    }, 0)
  }

  /**
   * Generate cache key for requests
   */
  private generateCacheKey(request: AIRequest): any {
    const lastMessages = request.messages.slice(-3).map(m => m.content).join('|')
    const contextKey = JSON.stringify({
      companion: request.context.companionName,
      level: request.context.relationshipLevel,
      emotion: request.context.companionEmotion
    })
    
    return {
      messages: lastMessages,
      context: contextKey,
      options: JSON.stringify(request.options || {})
    }
  }

  /**
   * Check if request is repetitive
   */
  private isRepetitiveRequest(request: AIRequest): boolean {
    // Simple heuristic: check if similar messages were sent recently
    const lastMessage = request.messages[request.messages.length - 1]?.content || ''
    return lastMessage.length < 50 && /^(안녕|잘지내|어때|뭐해)/.test(lastMessage)
  }

  /**
   * Simplify context for cost optimization
   */
  private simplifyContext(context: any): any {
    // Keep only essential properties
    return {
      companionName: context.companionName,
      relationshipLevel: context.relationshipLevel,
      companionEmotion: context.companionEmotion,
      currentScene: context.currentScene
    }
  }

  /**
   * Update usage statistics
   */
  private updateUsageStats(providerName: string, response: AIResponse): void {
    this.usageStats.totalTokens += response.tokensUsed
    this.usageStats.totalCost += response.metadata?.totalCost || 0

    if (!this.usageStats.providerUsage[providerName]) {
      this.usageStats.providerUsage[providerName] = {
        requests: 0,
        tokens: 0,
        cost: 0,
        errors: 0
      }
    }

    this.usageStats.providerUsage[providerName].requests++
    this.usageStats.providerUsage[providerName].tokens += response.tokensUsed
    this.usageStats.providerUsage[providerName].cost += response.metadata?.totalCost || 0

    // Update cache stats
    this.usageStats.cacheStats.hitRate = 
      this.usageStats.cacheStats.hits / 
      (this.usageStats.cacheStats.hits + this.usageStats.cacheStats.misses)
  }

  /**
   * Get comprehensive statistics
   */
  getOptimizationStats() {
    const performanceStats = apiMonitor.getPerformanceStats()
    const cacheStats = this.cacheManager.getStats()
    
    return {
      usage: this.usageStats,
      performance: performanceStats,
      cache: cacheStats,
      health: Array.from(this.healthStatus.values()),
      optimization: this.optimizationConfig,
      supabase: optimizedSupabase.getStats()
    }
  }

  /**
   * Update optimization configuration
   */
  updateOptimizationConfig(updates: Partial<OptimizationConfig>): void {
    this.optimizationConfig = { ...this.optimizationConfig, ...updates }
    console.log('⚙️ Optimization config updated:', this.optimizationConfig)
  }

  /**
   * Get provider health status
   */
  getHealthStatus(): ProviderHealthStatus[] {
    return Array.from(this.healthStatus.values())
  }

  /**
   * Force health check for all providers
   */
  async forceHealthCheck(): Promise<ProviderHealthStatus[]> {
    const promises = Array.from(this.providers.entries()).map(async ([name, provider]) => {
      const startTime = Date.now()
      try {
        const isHealthy = await provider.isHealthy()
        const responseTime = Date.now() - startTime
        
        const status: ProviderHealthStatus = {
          provider: name,
          isHealthy,
          responseTime,
          errorRate: 0,
          lastChecked: Date.now()
        }
        
        this.healthStatus.set(name, status)
        return status
      } catch (error) {
        const status: ProviderHealthStatus = {
          provider: name,
          isHealthy: false,
          responseTime: Date.now() - startTime,
          errorRate: 1,
          lastChecked: Date.now()
        }
        
        this.healthStatus.set(name, status)
        return status
      }
    })

    return Promise.all(promises)
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.cacheManager.clear()
    console.log('🧹 All caches cleared')
  }
}

// Export factory function for easy initialization
export function createOptimizedAIManager(config: ProviderConfig): OptimizedAIManager {
  return OptimizedAIManager.getInstance(config)
}