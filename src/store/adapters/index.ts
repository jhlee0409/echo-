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

export { GameStateAdapter, useGameStateAdapter } from './GameStateAdapter'
export {
  CharacterStateAdapter,
  useCharacterStateAdapter,
} from './CharacterStateAdapter'
export {
  ConversationStateAdapter,
  useConversationStateAdapter,
} from './ConversationStateAdapter'
export {
  SettingsStateAdapter,
  useSettingsStateAdapter,
} from './SettingsStateAdapter'
export { UIStateAdapter, useUIStateAdapter } from './UIStateAdapter'

export { getCharacterStateAdapter } from './CharacterStateAdapter'
export { getConversationStateAdapter } from './ConversationStateAdapter'
export { getGameStateAdapter } from './GameStateAdapter'

// Re-export types for convenience
export type {
  GameStateAPI,
  CharacterStateAPI,
  ConversationStateAPI,
  SettingsStateAPI,
  UIStateAPI,
} from './types'
