// Phase 1 Hook exports
export { useGameStore } from './useGameStore'
export { useAuth, useSession, usePasswordValidation } from './useAuth'

// State Adapter Hooks
export { 
  useGameStateAdapter,
  useCharacterStateAdapter,
  useConversationStateAdapter,
  useSettingsStateAdapter,
  useUIStateAdapter
} from '@store/adapters'

// Additional hooks to be implemented in Phase 2:
// export { default as useAIChat } from './useAIChat'
// export { default as useLocalStorage } from './useLocalStorage'
// export { default as useDebounce } from './useDebounce'
// export { default as useMediaQuery } from './useMediaQuery'