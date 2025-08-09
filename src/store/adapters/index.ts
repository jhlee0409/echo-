/**
 * 🔌 State Adapters - Clean Interface Layer for State Management
 * 
 * Provides domain-specific adapters that abstract the underlying
 * store implementation details and provide a clean API for components
 * 
 * Benefits:
 * - Decouples UI from store implementation
 * - Enables easy store migration/refactoring
 * - Provides type-safe domain-specific APIs
 * - Centralizes state logic and transformations
 */

export { GameStateAdapter } from './GameStateAdapter'
export { CharacterStateAdapter } from './CharacterStateAdapter'
export { ConversationStateAdapter } from './ConversationStateAdapter'
export { SettingsStateAdapter } from './SettingsStateAdapter'
export { UIStateAdapter } from './UIStateAdapter'

// Re-export types for convenience
export type { 
  GameStateAPI,
  CharacterStateAPI,
  ConversationStateAPI,
  SettingsStateAPI,
  UIStateAPI
} from './types'