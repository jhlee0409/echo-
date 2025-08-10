/**
 * Optimized Claude API Provider
 * Implements token optimization, response caching, smart batching, and cost management
 */

import {
  AIProvider,
  AIRequest,
  AIResponse,
  AIProviderError,
  ClaudeConfig,
} from './types'
import { EmotionType } from '@types'
import { CacheManager } from './CacheManager'

interface TokenOptimizationStrategy {
  compressSystemPrompt: boolean
  truncateContext: boolean
  useAbbreviations: boolean
  removeRedundancy: boolean
  maxContextWindow: number
}

interface CostOptimizationConfig {
  enableCaching: boolean
  enableBatching: boolean
  preferShorterResponses: boolean
  maxTokensPerRequest: number
  dailyTokenBudget: number
  enableSmartTruncation: boolean
}

interface BatchRequest {
  id: string
  request: AIRequest
  resolve: (response: AIResponse) => void
  reject: (error: AIProviderError) => void
  timestamp: number
}

/**
 * Optimized Claude Provider with advanced cost and performance optimizations
 */
export class OptimizedClaudeProvider implements AIProvider {
  name = 'claude-optimized'
  priority = 1
  isEnabled = true
  maxTokens: number
  costPerToken: number = 0.00025 // Claude-3 Haiku pricing

  private baseUrl: string
  private apiKey: string
  private model: string
  private defaultTemperature: number
  private cacheManager: CacheManager
  private batchQueue: BatchRequest[] = []
  private batchTimer: NodeJS.Timeout | null = null
  private dailyTokenUsage = 0
  private tokenResetTime = Date.now() + 24 * 60 * 60 * 1000

  // Optimization configurations
  private tokenOptimization: TokenOptimizationStrategy = {
    compressSystemPrompt: true,
    truncateContext: true,
    useAbbreviations: true,
    removeRedundancy: true,
    maxContextWindow: 4000
  }

  private costOptimization: CostOptimizationConfig = {
    enableCaching: true,
    enableBatching: true,
    preferShorterResponses: true,
    maxTokensPerRequest: 500,
    dailyTokenBudget: 100000,
    enableSmartTruncation: true
  }

  constructor(config: ClaudeConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl
    this.model = config.model
    this.maxTokens = Math.min(config.maxTokens, this.costOptimization.maxTokensPerRequest)
    this.defaultTemperature = config.defaultTemperature
    this.cacheManager = new CacheManager()

    if (!this.apiKey) {
      throw new Error('Claude API key is required')
    }

    // Start daily token reset timer
    this.startDailyTokenReset()
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    // Check daily token budget
    if (this.dailyTokenUsage >= this.costOptimization.dailyTokenBudget) {
      throw {
        code: 'DAILY_LIMIT_EXCEEDED',
        message: 'Daily token budget exceeded',
        provider: this.name,
        recoverable: false,
      }
    }

    // Check cache first
    if (this.costOptimization.enableCaching) {
      const cacheKey = this.generateCacheKey(request)
      const cachedResponse = await this.cacheManager.get(cacheKey)
      if (cachedResponse) {
        console.log('💰 Saved API call with cached response')
        return { ...cachedResponse, cached: true }
      }
    }

    // Batch small requests
    if (this.costOptimization.enableBatching && this.shouldBatch(request)) {
      return this.addToBatch(request)
    }

    // Process single request
    return this.processSingleRequest(request)
  }

  private async processSingleRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now()

    try {
      // Optimize request
      const optimizedRequest = this.optimizeRequest(request)
      
      // Build optimized system prompt
      const systemPrompt = this.buildOptimizedSystemPrompt(optimizedRequest.context)

      // Convert and compress messages
      const claudeMessages = this.convertAndCompressMessages(optimizedRequest.messages)

      // Estimate token usage
      const estimatedTokens = this.estimateTokenUsage(systemPrompt, claudeMessages)
      
      if (estimatedTokens > this.tokenOptimization.maxContextWindow) {
        // Apply smart truncation
        const truncated = this.smartTruncate(claudeMessages, systemPrompt)
        claudeMessages.length = 0
        claudeMessages.push(...truncated)
      }

      // Build request
      const claudeRequest = {
        model: this.model,
        max_tokens: Math.min(
          optimizedRequest.options?.maxTokens || this.maxTokens,
          this.costOptimization.maxTokensPerRequest
        ),
        messages: claudeMessages,
        temperature: optimizedRequest.options?.temperature || this.defaultTemperature,
        system: systemPrompt,
      }

      console.log(`💰 Optimized Claude request: ${estimatedTokens} estimated tokens`)

      // Make API call
      const response = await this.makeApiCall(claudeRequest)
      
      // Process response
      const processedResponse = this.processResponse(response, request, Date.now() - startTime)
      
      // Update token usage
      this.dailyTokenUsage += processedResponse.tokensUsed

      // Cache response
      if (this.costOptimization.enableCaching && processedResponse.confidence > 0.7) {
        const cacheKey = this.generateCacheKey(request)
        await this.cacheManager.set(cacheKey, processedResponse, 3600000) // 1 hour
      }

      return processedResponse
    } catch (error) {
      console.error('❌ Optimized Claude API Error:', error)
      throw this.createAIError(error, Date.now() - startTime)
    }
  }

  private optimizeRequest(request: AIRequest): AIRequest {
    const optimized = { ...request }

    // Remove redundant messages
    if (this.tokenOptimization.removeRedundancy) {
      optimized.messages = this.removeRedundantMessages(request.messages)
    }

    // Compress context
    if (this.tokenOptimization.compressSystemPrompt) {
      optimized.context = this.compressContext(request.context)
    }

    return optimized
  }

  private buildOptimizedSystemPrompt(context: any): string {
    const safe = <T>(value: T | null | undefined, defaultValue: T): T => {
      return value !== null && value !== undefined ? value : defaultValue
    }

    // Use abbreviations and compressed format
    const traits = context.companionPersonality
      ? Object.entries(context.companionPersonality)
          .filter(([_, v]) => typeof v === 'number' && v > 0.5)
          .map(([t, v]) => `${t.slice(0, 3)}:${Math.round((v as number) * 10)}`)
          .join(',')
      : 'balanced'

    const name = safe(context.companionName, 'AI')
    const level = safe(context.relationshipLevel, 5)
    const emotion = safe(context.companionEmotion, 'neutral')

    if (this.tokenOptimization.useAbbreviations) {
      return `AI컴패니언:${name}
성격:${traits}
관계Lv:${level}/10
감정:${emotion}

규칙:
- 한국어대화
- 50-100자응답
- 감정표현포함
- 자연스러운대화`
    }

    // Fallback to standard format
    return `당신은 "${name}"라는 AI 컴패니언입니다.
성격: ${traits}
관계 레벨: ${level}/10
현재 감정: ${emotion}

응답 규칙:
- 한국어로 자연스럽게 대화
- 50-100자 내외로 응답
- 감정이 드러나는 표현 사용`
  }

  private convertAndCompressMessages(messages: any[]): any[] {
    return messages
      .filter(msg => msg.role !== 'system')
      .slice(-10) // Keep only last 10 messages
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: this.compressMessage(msg.content)
      }))
  }

  private compressMessage(content: string): string {
    if (!this.tokenOptimization.useAbbreviations) return content

    // Common Korean abbreviations
    return content
      .replace(/그런데/g, '근데')
      .replace(/그렇지만/g, '하지만')
      .replace(/이것은/g, '이건')
      .replace(/그것은/g, '그건')
      .replace(/어떻게/g, '어떡')
      .replace(/이야기/g, '얘기')
      .slice(0, 200) // Limit message length
  }

  private removeRedundantMessages(messages: any[]): any[] {
    const filtered: any[] = []
    let lastContent = ''

    for (const msg of messages) {
      // Skip duplicate messages
      if (msg.content === lastContent) continue
      
      // Skip very short messages
      if (msg.content.length < 3) continue

      filtered.push(msg)
      lastContent = msg.content
    }

    return filtered
  }

  private compressContext(context: any): any {
    // Remove non-essential context properties
    const compressed = { ...context }
    
    // Keep only essential properties
    const essentialProps = [
      'companionName',
      'companionPersonality',
      'relationshipLevel',
      'companionEmotion',
      'currentScene'
    ]

    Object.keys(compressed).forEach(key => {
      if (!essentialProps.includes(key)) {
        delete compressed[key]
      }
    })

    return compressed
  }

  private estimateTokenUsage(systemPrompt: string, messages: any[]): number {
    // Rough estimation: 1 token ≈ 4 characters for English, 2 for Korean
    const systemTokens = Math.ceil(systemPrompt.length / 2)
    const messageTokens = messages.reduce((sum, msg) => 
      sum + Math.ceil(msg.content.length / 2), 0
    )
    
    return systemTokens + messageTokens + 100 // Buffer for response
  }

  private smartTruncate(messages: any[], systemPrompt: string): any[] {
    const maxTokens = this.tokenOptimization.maxContextWindow
    const systemTokens = Math.ceil(systemPrompt.length / 2)
    const availableForMessages = maxTokens - systemTokens - 200 // Reserve for response

    const truncated: any[] = []
    let currentTokens = 0

    // Keep messages from most recent, but ensure we have context
    for (let i = messages.length - 1; i >= 0; i--) {
      const msgTokens = Math.ceil(messages[i].content.length / 2)
      
      if (currentTokens + msgTokens > availableForMessages) {
        break
      }

      truncated.unshift(messages[i])
      currentTokens += msgTokens
    }

    // Ensure at least one user message
    if (truncated.length === 0 && messages.length > 0) {
      const lastUserMsg = messages.findLast(m => m.role === 'user')
      if (lastUserMsg) {
        truncated.push({
          ...lastUserMsg,
          content: lastUserMsg.content.slice(0, 100) + '...'
        })
      }
    }

    return truncated
  }

  private shouldBatch(request: AIRequest): boolean {
    // Don't batch if:
    // - Request has high priority
    // - Context indicates urgent response needed
    // - Already too many in queue
    
    if (request.options?.priority === 'high') return false
    if (this.batchQueue.length >= 5) return false
    if (request.context?.urgency === 'high') return false

    // Batch if it's a simple conversation
    const messageCount = request.messages.length
    const lastMessage = request.messages[messageCount - 1]
    
    return messageCount < 5 && lastMessage.content.length < 100
  }

  private addToBatch(request: AIRequest): Promise<AIResponse> {
    return new Promise((resolve, reject) => {
      const batchRequest: BatchRequest = {
        id: Math.random().toString(36).substr(2, 9),
        request,
        resolve,
        reject,
        timestamp: Date.now()
      }

      this.batchQueue.push(batchRequest)

      // Start batch timer if not running
      if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => this.processBatch(), 500)
      }

      // Process immediately if queue is full
      if (this.batchQueue.length >= 3) {
        this.processBatch()
      }
    })
  }

  private async processBatch() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }

    if (this.batchQueue.length === 0) return

    const batch = this.batchQueue.splice(0, 3)
    console.log(`📦 Processing batch of ${batch.length} requests`)

    // Combine requests into single context
    const combinedRequest = this.combineBatchRequests(batch.map(b => b.request))
    
    try {
      const response = await this.processSingleRequest(combinedRequest)
      const responses = this.splitBatchResponse(response, batch.length)

      // Resolve individual promises
      batch.forEach((batchReq, index) => {
        batchReq.resolve(responses[index])
      })
    } catch (error) {
      // Reject all promises in batch
      batch.forEach(batchReq => {
        batchReq.reject(error as AIProviderError)
      })
    }
  }

  private combineBatchRequests(requests: AIRequest[]): AIRequest {
    // Combine multiple requests into one with numbered sections
    const combinedMessages = requests.flatMap((req, index) => [
      { role: 'system', content: `[요청 ${index + 1}]` },
      ...req.messages.slice(-2) // Last 2 messages from each
    ])

    return {
      messages: combinedMessages,
      context: requests[0].context, // Use first request's context
      options: {
        maxTokens: this.maxTokens * requests.length,
        temperature: this.defaultTemperature
      }
    }
  }

  private splitBatchResponse(response: AIResponse, count: number): AIResponse[] {
    // Split single response into multiple
    const sections = response.content.split(/\[응답 \d+\]/).filter(s => s.trim())
    
    return Array(count).fill(null).map((_, index) => ({
      ...response,
      content: sections[index] || '죄송해요, 응답을 생성하지 못했어요.',
      tokensUsed: Math.floor(response.tokensUsed / count),
      metadata: {
        ...response.metadata,
        batched: true,
        batchIndex: index
      }
    }))
  }

  private async makeApiCall(request: any): Promise<any> {
    const apiUrl = import.meta.env.DEV 
      ? '/api/claude/v1/messages'
      : `${this.baseUrl}/v1/messages`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    if (!import.meta.env.DEV) {
      headers['X-API-Key'] = this.apiKey
      headers['anthropic-version'] = '2023-06-01'
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw await this.handleHttpError(response)
    }

    return response.json()
  }

  private processResponse(
    claudeResponse: any,
    originalRequest: AIRequest,
    processingTime: number
  ): AIResponse {
    const content = claudeResponse.content
      .filter((item: any) => item.type === 'text')
      .map((item: any) => item.text)
      .join('')

    const emotion = this.analyzeEmotion(content, originalRequest.context)
    const totalTokens = claudeResponse.usage.input_tokens + claudeResponse.usage.output_tokens
    const totalCost = (totalTokens / 1000) * this.costPerToken

    return {
      content: content.trim(),
      emotion,
      confidence: this.calculateConfidence(claudeResponse),
      tokensUsed: totalTokens,
      provider: this.name,
      processingTime,
      cached: false,
      metadata: {
        model: claudeResponse.model,
        finishReason: this.mapFinishReason(claudeResponse.stop_reason),
        totalCost,
        promptTokens: claudeResponse.usage.input_tokens,
        completionTokens: claudeResponse.usage.output_tokens,
        optimized: true,
        dailyUsage: this.dailyTokenUsage + totalTokens,
        remainingBudget: this.costOptimization.dailyTokenBudget - this.dailyTokenUsage
      },
    }
  }

  private generateCacheKey(request: AIRequest): any {
    const lastMessages = request.messages.slice(-3).map(m => m.content).join('|')
    const contextKey = `${request.context.companionName}-${request.context.relationshipLevel}`
    
    return {
      messages: lastMessages,
      context: contextKey,
      options: JSON.stringify(request.options || {})
    }
  }

  private analyzeEmotion(content: string, context: any): EmotionType {
    const emotionKeywords = {
      happy: ['기뻐', '좋아', '행복', '웃음', '즐거', '신나'],
      excited: ['와우', '대박', '신기', '놀라'],
      calm: ['평온', '차분', '편안'],
      sad: ['슬프', '우울', '아쉬'],
      curious: ['궁금', '어떻게', '왜'],
      playful: ['장난', '재미', '놀자'],
      caring: ['걱정', '괜찮', '도와'],
      thoughtful: ['생각', '음', '아마']
    }

    let maxScore = 0
    let detectedEmotion: EmotionType = 'neutral'

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      const score = keywords.reduce((sum, keyword) => {
        return sum + (content.includes(keyword) ? 1 : 0)
      }, 0)

      if (score > maxScore) {
        maxScore = score
        detectedEmotion = emotion as EmotionType
      }
    }

    return maxScore === 0 ? (context.companionEmotion || 'neutral') : detectedEmotion
  }

  private calculateConfidence(response: any): number {
    let confidence = 0.8

    if (response.stop_reason === 'end_turn') {
      confidence += 0.1
    } else if (response.stop_reason === 'max_tokens') {
      confidence -= 0.2
    }

    const contentLength = response.content[0]?.text?.length || 0
    if (contentLength < 10) {
      confidence -= 0.3
    } else if (contentLength > 30) {
      confidence += 0.1
    }

    return Math.max(0.1, Math.min(1.0, confidence))
  }

  private mapFinishReason(stopReason: string): 'stop' | 'length' | 'content_filter' | 'error' {
    switch (stopReason) {
      case 'end_turn': return 'stop'
      case 'max_tokens': return 'length'
      case 'stop_sequence': return 'stop'
      default: return 'error'
    }
  }

  private async handleHttpError(response: Response): Promise<AIProviderError> {
    let errorBody: any = null

    try {
      errorBody = await response.json()
    } catch {
      // Ignore JSON parse errors
    }

    const message = errorBody?.error?.message || response.statusText

    const errorMap: Record<number, AIProviderError> = {
      400: {
        code: 'INVALID_REQUEST',
        message: `Invalid request: ${message}`,
        provider: this.name,
        recoverable: false,
      },
      401: {
        code: 'INVALID_API_KEY',
        message: 'Invalid API key',
        provider: this.name,
        recoverable: false,
      },
      429: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded',
        provider: this.name,
        recoverable: true,
        retryAfter: parseInt(response.headers.get('retry-after') || '60'),
      },
      500: {
        code: 'SERVER_ERROR',
        message: 'Internal server error',
        provider: this.name,
        recoverable: true,
      }
    }

    return errorMap[response.status] || {
      code: 'UNKNOWN_ERROR',
      message: `HTTP ${response.status}: ${message}`,
      provider: this.name,
      recoverable: true,
    }
  }

  private createAIError(error: any, processingTime: number): AIProviderError {
    if (error.code) {
      return error
    }

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed',
        provider: this.name,
        recoverable: true,
      }
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'Unknown error occurred',
      provider: this.name,
      recoverable: true,
      details: { processingTime },
    }
  }

  private startDailyTokenReset() {
    setInterval(() => {
      const now = Date.now()
      if (now >= this.tokenResetTime) {
        this.dailyTokenUsage = 0
        this.tokenResetTime = now + 24 * 60 * 60 * 1000
        console.log('🔄 Daily token budget reset')
      }
    }, 60000) // Check every minute
  }

  async isHealthy(): Promise<boolean> {
    // Check if within daily budget
    return this.dailyTokenUsage < this.costOptimization.dailyTokenBudget
  }

  async getRemainingQuota(): Promise<number | null> {
    return this.costOptimization.dailyTokenBudget - this.dailyTokenUsage
  }

  getOptimizationStats() {
    const cacheStats = this.cacheManager.getStats()
    
    return {
      dailyTokenUsage: this.dailyTokenUsage,
      remainingBudget: this.costOptimization.dailyTokenBudget - this.dailyTokenUsage,
      cacheHitRate: cacheStats.hitRate,
      cachedResponses: cacheStats.size,
      savedCost: cacheStats.totalCost,
      batchQueueSize: this.batchQueue.length,
      optimizationSettings: {
        ...this.tokenOptimization,
        ...this.costOptimization
      }
    }
  }
}