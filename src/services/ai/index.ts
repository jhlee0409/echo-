// AI Services
export { AIManager, getAIManager } from './AIManager'
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
  EmotionType,
} from './types'
