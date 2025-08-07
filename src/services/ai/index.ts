// AI Services
export { AIManager, getAIManager } from './AIManager'
export { CacheManager } from './CacheManager'
export { CostOptimizer } from './CostOptimizer'
export { PromptEngine } from './PromptEngine'
export { ClaudeProvider } from './providers/ClaudeProvider'
export { MockProvider } from './providers/MockProvider'

// Re-export types
export type {
  AIProvider,
  AIRequest,
  AIResponse,
  AIProviderError,
  ProviderConfig,
  ClaudeConfig,
  CacheEntry,
  CacheKey,
  EmotionType,
} from './types'
