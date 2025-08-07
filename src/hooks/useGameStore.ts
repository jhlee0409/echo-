// Hook wrapper for game store access
// This provides a clean interface for components to interact with the game state

import { useStore } from '@store/gameStore'

export const useGameStore = useStore