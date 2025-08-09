/**
 * 🎮 Game State Adapter
 * 
 * Provides a clean API for game progress and state management
 * Abstracts the underlying Zustand store implementation
 */

import { useStore } from '@store/gameStore'
import type { GameState } from '@types'
import type { 
  GameStateAPI, 
  SaveSlot, 
  GameStatistics 
} from './types'

export class GameStateAdapter implements GameStateAPI {
  private unsubscribe: (() => void) | null = null

  // Core state access
  getState(): GameState {
    const state = useStore.getState()
    if (!state.gameState) {
      throw new Error('Game state not initialized')
    }
    return state.gameState
  }

  subscribe(listener: (state: GameState) => void): () => void {
    this.unsubscribe = useStore.subscribe(
      (state) => {
        if (state.gameState) {
          listener(state.gameState)
        }
      }
    )
    return () => {
      if (this.unsubscribe) {
        this.unsubscribe()
        this.unsubscribe = null
      }
    }
  }

  // State validation
  isValid(): boolean {
    try {
      const state = this.getState()
      return !!(
        state &&
        typeof state.level === 'number' &&
        typeof state.experience === 'number' &&
        state.gameVersion
      )
    } catch {
      return false
    }
  }

  getErrors(): string[] {
    const errors: string[] = []
    try {
      const state = this.getState()
      
      if (state.level < 1) {
        errors.push('Invalid level: must be at least 1')
      }
      
      if (state.experience < 0) {
        errors.push('Invalid experience: cannot be negative')
      }
      
      if (!state.gameVersion) {
        errors.push('Missing game version')
      }
    } catch (error) {
      errors.push(`State validation error: ${error}`)
    }
    
    return errors
  }

  // Persistence
  async persist(): Promise<void> {
    await useStore.getState().saveGame()
  }

  async hydrate(): Promise<void> {
    await useStore.getState().loadGame()
  }

  reset(): void {
    useStore.getState().resetGame()
  }

  // Level & Progress
  getLevel(): number {
    return this.getState().level
  }

  getExperience(): number {
    return this.getState().experience
  }

  addExperience(amount: number): void {
    if (amount <= 0) return
    
    const currentExp = this.getExperience()
    const newExp = currentExp + amount
    
    useStore.getState().updateGameState({
      experience: newExp
    })
    
    // Check for level up
    if (this.canLevelUp()) {
      this.levelUp()
    }
  }

  canLevelUp(): boolean {
    const exp = this.getExperience()
    const level = this.getLevel()
    const expNeeded = this.calculateExpForLevel(level + 1)
    return exp >= expNeeded
  }

  levelUp(): void {
    if (!this.canLevelUp()) return
    
    const currentLevel = this.getLevel()
    const newLevel = currentLevel + 1
    
    useStore.getState().updateGameState({
      level: newLevel
    })
    
    // Trigger level up effects
    this.unlockFeature(`level_${newLevel}_rewards`)
  }

  private calculateExpForLevel(level: number): number {
    // Experience curve: 100 * level^1.5
    return Math.floor(100 * Math.pow(level, 1.5))
  }

  // Game flow
  startNewGame(): void {
    useStore.getState().resetGame()
    useStore.getState().updateGameState({
      isFirstTime: false,
      lastPlayed: Date.now()
    })
  }

  continueGame(): void {
    useStore.getState().updateGameState({
      lastPlayed: Date.now()
    })
  }

  pauseGame(): void {
    // Update last played timestamp
    useStore.getState().updateGameState({
      lastPlayed: Date.now()
    })
    this.persist()
  }

  // Save management
  async saveGame(): Promise<void> {
    try {
      // Use APIBridge for actual save operation
      const { getAPIBridge } = await import('@services/api')
      const apiBridge = getAPIBridge()
      
      const result = await apiBridge.saveGameState()
      if (result.success) {
        // Update local state with save timestamp
        useStore.getState().updateGameState({
          lastSaved: Date.now()
        })
      } else {
        throw new Error('Save operation failed')
      }
    } catch (error) {
      console.error('Failed to save game:', error)
      // Fallback to local persistence
      await this.persist()
      throw error
    }
  }

  async loadGame(saveId?: string): Promise<void> {
    if (!saveId) {
      // No specific save ID, just hydrate from local storage
      await this.hydrate()
      return
    }
    
    try {
      // Use APIBridge for loading specific save
      const { getAPIBridge } = await import('@services/api')
      const apiBridge = getAPIBridge()
      
      const saveData = await apiBridge.loadGameState(saveId)
      
      // Update store with loaded data
      if (saveData.gameState) {
        useStore.getState().updateGameState(saveData.gameState)
      }
      
      if (saveData.companion) {
        useStore.getState().updateCompanion(saveData.companion)
      }
    } catch (error) {
      console.error('Failed to load game:', error)
      // Fallback to local hydration
      await this.hydrate()
      throw error
    }
  }

  async getSaveSlots(): Promise<SaveSlot[]> {
    // Mock implementation - would connect to real save system
    const currentState = this.getState()
    return [
      {
        id: 'autosave',
        name: 'Autosave',
        timestamp: currentState.lastSaved || Date.now(),
        level: currentState.level,
        playTime: currentState.playTime
      }
    ]
  }

  // Feature unlocks
  unlockFeature(feature: string): void {
    const currentFeatures = this.getState().unlockedFeatures
    if (!currentFeatures.includes(feature)) {
      useStore.getState().updateGameState({
        unlockedFeatures: [...currentFeatures, feature]
      })
    }
  }

  isFeatureUnlocked(feature: string): boolean {
    return this.getState().unlockedFeatures.includes(feature)
  }

  getUnlockedFeatures(): string[] {
    return [...this.getState().unlockedFeatures]
  }

  // Statistics
  incrementConversationCount(): void {
    const current = this.getState().conversationCount
    useStore.getState().updateGameState({
      conversationCount: current + 1
    })
  }

  updatePlayTime(seconds: number): void {
    if (seconds <= 0) return
    
    const current = this.getState().playTime
    useStore.getState().updateGameState({
      playTime: current + seconds
    })
  }

  getStatistics(): GameStatistics {
    const state = this.getState()
    const daysSinceStart = Math.floor(
      (Date.now() - (state.lastPlayed - state.playTime * 1000)) / 
      (1000 * 60 * 60 * 24)
    )
    
    return {
      totalPlayTime: state.playTime,
      conversationCount: state.conversationCount,
      daysSinceStart: Math.max(1, daysSinceStart),
      achievementsUnlocked: state.unlockedFeatures.length,
      completionPercentage: this.calculateCompletionPercentage()
    }
  }

  private calculateCompletionPercentage(): number {
    const state = this.getState()
    const factors = [
      state.level / 50, // Max level 50
      state.conversationCount / 1000, // Target 1000 conversations
      state.unlockedFeatures.length / 100, // Target 100 features
      Math.min(state.playTime / (100 * 60 * 60), 1) // 100 hours
    ]
    
    const average = factors.reduce((sum, val) => sum + val, 0) / factors.length
    return Math.min(Math.round(average * 100), 100)
  }
}

// Singleton instance
let gameStateAdapter: GameStateAdapter | null = null

export const getGameStateAdapter = (): GameStateAdapter => {
  if (!gameStateAdapter) {
    gameStateAdapter = new GameStateAdapter()
  }
  return gameStateAdapter
}

// React hook for component usage
export const useGameStateAdapter = (): GameStateAdapter => {
  return getGameStateAdapter()
}