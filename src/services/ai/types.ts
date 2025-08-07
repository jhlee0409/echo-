// AI Provider Type Definitions
import type { EmotionType } from '@types'

export interface AIProvider {
  name: string
  priority: number // Lower number = higher priority
  isEnabled: boolean
  maxTokens: number
  costPerToken: number // Cost per 1K tokens in USD
  
  // Provider-specific methods
  generateResponse: (request: AIRequest) => Promise<AIResponse>
  isHealthy: () => Promise<boolean>
  getRemainingQuota: () => Promise<number | null>
}

export interface AIRequest {
  messages: AIMessage[]
  context: ConversationContext
  options?: AIRequestOptions
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  timestamp?: number
}

export interface ConversationContext {
  companionName: string
  companionPersonality: PersonalityContext
  relationshipLevel: number
  intimacyLevel: number
  userEmotion?: EmotionType
  companionEmotion: EmotionType
  recentTopics: string[]
  currentScene: string
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  specialContext?: Record<string, any>
}

export interface PersonalityContext {
  cheerful: number
  careful: number
  curious: number
  emotional: number
  independent: number
  playful?: number
  supportive?: number
}

export interface AIRequestOptions {
  maxTokens?: number
  temperature?: number
  presencePenalty?: number
  frequencyPenalty?: number
  stopSequences?: string[]
  seed?: number
}

export interface AIResponse {
  content: string
  emotion: EmotionType
  confidence: number // 0-1 scale
  tokensUsed: number
  provider: string
  processingTime: number // milliseconds
  cached: boolean
  metadata?: ResponseMetadata
}

export interface ResponseMetadata {
  model: string
  finishReason: 'stop' | 'length' | 'content_filter' | 'error'
  totalCost: number // in USD
  promptTokens: number
  completionTokens: number
  cacheHit: boolean
  retryCount: number
}

export interface AIProviderError {
  code: string
  message: string
  provider: string
  recoverable: boolean
  retryAfter?: number // seconds
  details?: Record<string, any>
}

// Provider Configuration
export interface ProviderConfig {
  claude: ClaudeConfig
  openai: OpenAIConfig
  fallback: FallbackConfig
}

export interface ClaudeConfig {
  apiKey: string
  baseUrl: string
  model: string
  maxTokens: number
  defaultTemperature: number
  rateLimits: RateLimitConfig
}

export interface OpenAIConfig {
  apiKey: string
  baseUrl: string
  model: string
  maxTokens: number
  defaultTemperature: number
  rateLimits: RateLimitConfig
}

export interface FallbackConfig {
  enabled: boolean
  providers: string[] // Provider names in fallback order
  maxRetries: number
  retryDelay: number // milliseconds
}

export interface RateLimitConfig {
  requestsPerMinute: number
  tokensPerMinute: number
  dailyTokenLimit: number
}

// Caching
export interface CacheKey {
  messages: string // Hashed messages
  context: string // Hashed relevant context
  options: string // Hashed options
}

export interface CacheEntry {
  key: CacheKey
  response: AIResponse
  createdAt: number
  expiresAt: number
  hitCount: number
  lastAccessed: number
}

// Analytics and Monitoring
export interface AIUsageStats {
  totalRequests: number
  totalTokens: number
  totalCost: number
  averageResponseTime: number
  cacheHitRate: number
  errorRate: number
  providerUsage: Record<string, ProviderUsage>
  dailyUsage: DailyUsage[]
}

export interface ProviderUsage {
  requests: number
  tokens: number
  cost: number
  errors: number
  averageResponseTime: number
}

export interface DailyUsage {
  date: string
  requests: number
  tokens: number
  cost: number
  uniqueUsers: number
}

// Cost Optimization
export interface CostOptimizer {
  shouldUseCache: (request: AIRequest) => boolean
  selectProvider: (request: AIRequest) => Promise<string>
  optimizePrompt: (request: AIRequest) => AIRequest
  estimateCost: (request: AIRequest, provider: string) => number
}

export interface PromptTemplate {
  id: string
  name: string
  template: string
  variables: string[]
  category: 'companion' | 'system' | 'special'
  estimatedTokens: number
}

// Error Recovery
export interface RetryStrategy {
  maxRetries: number
  baseDelay: number // milliseconds
  maxDelay: number // milliseconds
  backoffMultiplier: number
  retryableErrors: string[]
}

export interface CircuitBreakerConfig {
  failureThreshold: number
  recoveryTimeout: number // milliseconds
  monitoringPeriod: number // milliseconds
}

// Real-time monitoring
export interface HealthCheck {
  provider: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime: number
  errorRate: number
  lastChecked: number
  details?: Record<string, any>
}