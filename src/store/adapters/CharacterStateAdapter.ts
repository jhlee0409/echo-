/**
 * 👤 Character State Adapter
 * 
 * Manages AI companion state with clean API
 * Handles personality, emotions, relationships, and memories
 */

import { useStore } from '@store/gameStore'
import type { AICompanion, EmotionType } from '@types'
import type { 
  CharacterStateAPI, 
  Memory 
} from './types'

export class CharacterStateAdapter implements CharacterStateAPI {
  private unsubscribe: (() => void) | null = null
  private memoryIndex: Map<string, Memory> = new Map()

  // Core state access
  getState(): AICompanion {
    const state = useStore.getState()
    if (!state.companion) {
      throw new Error('Character not initialized')
    }
    return state.companion
  }

  subscribe(listener: (state: AICompanion) => void): () => void {
    this.unsubscribe = useStore.subscribe(
      (state) => {
        if (state.companion) {
          listener(state.companion)
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
        state.id &&
        state.name &&
        state.personalityTraits &&
        state.relationshipStatus
      )
    } catch {
      return false
    }
  }

  getErrors(): string[] {
    const errors: string[] = []
    try {
      const state = this.getState()
      
      if (!state.name || state.name.trim().length === 0) {
        errors.push('Character must have a name')
      }
      
      // Validate personality traits are in valid range
      Object.entries(state.personalityTraits).forEach(([trait, value]) => {
        if (value < 0 || value > 1) {
          errors.push(`Invalid ${trait} value: must be between 0 and 1`)
        }
      })
      
      const relationship = state.relationshipStatus
      if (relationship.intimacyLevel < 0 || relationship.intimacyLevel > 1) {
        errors.push('Invalid intimacy level: must be between 0 and 1')
      }
      
      if (relationship.trustLevel < 0 || relationship.trustLevel > 1) {
        errors.push('Invalid trust level: must be between 0 and 1')
      }
    } catch (error) {
      errors.push(`State validation error: ${error}`)
    }
    
    return errors
  }

  // Persistence
  async persist(): Promise<void> {
    // Character state is persisted as part of game state
    await useStore.getState().saveGame()
  }

  async hydrate(): Promise<void> {
    // Character state is hydrated as part of game state
    await useStore.getState().loadGame()
    this.rebuildMemoryIndex()
  }

  reset(): void {
    useStore.getState().resetGame()
    this.memoryIndex.clear()
  }

  // Basic info
  getCharacter(): AICompanion | null {
    try {
      return this.getState()
    } catch {
      return null
    }
  }

  getCharacterName(): string {
    return this.getState().name
  }

  setCharacterName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Name cannot be empty')
    }
    
    useStore.getState().updateCompanion({
      name: name.trim()
    })
  }

  // Emotions
  getCurrentEmotion(): EmotionType {
    return this.getState().currentEmotion.dominant
  }

  getEmotionIntensity(): number {
    return this.getState().currentEmotion.intensity
  }

  updateEmotion(emotion: EmotionType, intensity: number): void {
    if (intensity < 0 || intensity > 1) {
      throw new Error('Emotion intensity must be between 0 and 1')
    }
    
    const currentEmotion = this.getState().currentEmotion
    
    useStore.getState().updateCompanion({
      currentEmotion: {
        ...currentEmotion,
        dominant: emotion,
        intensity: intensity,
        stability: this.calculateEmotionStability(emotion, intensity)
      }
    })
    
    // Add to mood history
    this.addToMoodHistory(emotion)
  }

  private calculateEmotionStability(emotion: EmotionType, intensity: number): number {
    // Higher intensity emotions are less stable
    const baseStability = 1 - (intensity * 0.3)
    
    // Some emotions are naturally more stable
    const emotionStabilityModifiers: Record<EmotionType, number> = {
      'calm': 0.2,
      'content': 0.15,
      'neutral': 0.1,
      'thoughtful': 0.05,
      'happy': 0,
      'sad': -0.05,
      'excited': -0.1,
      'anxious': -0.15,
      'confused': -0.1,
      'curious': 0
    }
    
    const modifier = emotionStabilityModifiers[emotion] || 0
    return Math.max(0, Math.min(1, baseStability + modifier))
  }

  private addToMoodHistory(emotion: EmotionType): void {
    const companion = this.getState()
    const moodHistory = [...companion.conversationContext.moodHistory]
    
    // Keep last 10 moods
    if (moodHistory.length >= 10) {
      moodHistory.shift()
    }
    
    moodHistory.push(emotion)
    
    useStore.getState().updateCompanion({
      conversationContext: {
        ...companion.conversationContext,
        moodHistory
      }
    })
  }

  // Relationships
  getIntimacyLevel(): number {
    return this.getState().relationshipStatus.intimacyLevel
  }

  getTrustLevel(): number {
    return this.getState().relationshipStatus.trustLevel
  }

  updateRelationship(intimacy: number, trust: number): void {
    if (intimacy < 0 || intimacy > 1) {
      throw new Error('Intimacy must be between 0 and 1')
    }
    if (trust < 0 || trust > 1) {
      throw new Error('Trust must be between 0 and 1')
    }
    
    const currentStatus = this.getState().relationshipStatus
    const intimacyDelta = intimacy - currentStatus.intimacyLevel
    const trustDelta = trust - currentStatus.trustLevel
    
    // Update experience based on relationship growth
    const expGain = Math.floor(
      (Math.abs(intimacyDelta) + Math.abs(trustDelta)) * 1000
    )
    
    useStore.getState().updateCompanion({
      relationshipStatus: {
        ...currentStatus,
        intimacyLevel: intimacy,
        trustLevel: trust,
        experience: currentStatus.experience + expGain
      }
    })
    
    // Check for relationship level up
    this.checkRelationshipLevelUp()
  }

  private checkRelationshipLevelUp(): void {
    const status = this.getState().relationshipStatus
    const expNeeded = status.level * 100
    
    if (status.experience >= expNeeded) {
      useStore.getState().updateCompanion({
        relationshipStatus: {
          ...status,
          level: status.level + 1,
          experience: status.experience - expNeeded,
          experienceToNext: (status.level + 1) * 100
        }
      })
      
      // Add milestone
      this.addRelationshipMilestone(`level_${status.level + 1}`)
    }
  }

  // Personality
  getPersonalityTraits(): Record<string, number> {
    return { ...this.getState().personalityTraits }
  }

  updatePersonalityTrait(trait: string, value: number): void {
    if (value < 0 || value > 1) {
      throw new Error('Personality trait value must be between 0 and 1')
    }
    
    const traits = this.getPersonalityTraits()
    if (!(trait in traits)) {
      throw new Error(`Unknown personality trait: ${trait}`)
    }
    
    useStore.getState().updateCompanion({
      personalityTraits: {
        ...traits,
        [trait]: value
      }
    })
  }

  // Memory
  addMemory(memory: Memory): void {
    const companion = this.getState()
    const memories = [...companion.memoryBank.shortTerm]
    
    // Add to short-term memory
    memories.push({
      id: memory.id,
      content: memory.content,
      timestamp: memory.timestamp,
      emotion: memory.emotion,
      tags: memory.tags,
      importance: memory.importance
    })
    
    // Move old memories to long-term if needed
    if (memories.length > 20) {
      const oldMemories = memories.splice(0, 10)
      const longTerm = [...companion.memoryBank.longTerm, ...oldMemories]
      
      useStore.getState().updateCompanion({
        memoryBank: {
          ...companion.memoryBank,
          shortTerm: memories,
          longTerm: longTerm.slice(-100) // Keep last 100 long-term memories
        }
      })
    } else {
      useStore.getState().updateCompanion({
        memoryBank: {
          ...companion.memoryBank,
          shortTerm: memories
        }
      })
    }
    
    // Update memory index
    this.memoryIndex.set(memory.id, memory)
  }

  getRecentMemories(count: number): Memory[] {
    const companion = this.getState()
    const allMemories = [
      ...companion.memoryBank.shortTerm,
      ...companion.memoryBank.longTerm
    ]
    
    return allMemories
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count)
      .map(m => ({
        ...m,
        importance: m.importance || 0.5,
        tags: m.tags || []
      }))
  }

  searchMemories(query: string): Memory[] {
    const lowerQuery = query.toLowerCase()
    const memories: Memory[] = []
    
    this.memoryIndex.forEach((memory) => {
      if (
        memory.content.toLowerCase().includes(lowerQuery) ||
        memory.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      ) {
        memories.push(memory)
      }
    })
    
    return memories.sort((a, b) => b.importance - a.importance)
  }

  private rebuildMemoryIndex(): void {
    this.memoryIndex.clear()
    const companion = this.getState()
    
    if (!companion?.memoryBank) {
      return
    }
    
    const allMemories = [
      ...(companion.memoryBank.shortTerm || []), 
      ...(companion.memoryBank.longTerm || [])
    ]
    
    allMemories.forEach(memory => {
      this.memoryIndex.set(memory.id, {
        ...memory,
        importance: memory.importance || 0.5,
        tags: memory.tags || []
      })
    })
  }

  // Progress
  addRelationshipMilestone(milestone: string): void {
    const companion = this.getState()
    const milestones = companion.gameProgress.relationshipMilestones
    
    if (!milestones.includes(milestone)) {
      useStore.getState().updateCompanion({
        gameProgress: {
          ...companion.gameProgress,
          relationshipMilestones: [...milestones, milestone]
        }
      })
    }
  }

  getRelationshipMilestones(): string[] {
    return [...this.getState().gameProgress.relationshipMilestones]
  }
}

// Singleton instance
let characterStateAdapter: CharacterStateAdapter | null = null

export const getCharacterStateAdapter = (): CharacterStateAdapter => {
  if (!characterStateAdapter) {
    characterStateAdapter = new CharacterStateAdapter()
  }
  return characterStateAdapter
}

// React hook for component usage
export const useCharacterStateAdapter = (): CharacterStateAdapter => {
  return getCharacterStateAdapter()
}