/**
 * State Adapter Tests
 * 
 * Verifies adapter pattern implementation and functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GameStateAdapter } from '../GameStateAdapter'
import { CharacterStateAdapter } from '../CharacterStateAdapter'
import { ConversationStateAdapter } from '../ConversationStateAdapter'
import { SettingsStateAdapter } from '../SettingsStateAdapter'
import { useStore } from '@store/gameStore'

// Mock the store
vi.mock('@store/gameStore', () => ({
  useStore: {
    getState: vi.fn(),
    setState: vi.fn(),
    subscribe: vi.fn()
  }
}))

describe('State Adapters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GameStateAdapter', () => {
    let adapter: GameStateAdapter

    beforeEach(() => {
      adapter = new GameStateAdapter()
      
      // Mock store state
      vi.mocked(useStore.getState).mockReturnValue({
        gameState: {
          level: 5,
          experience: 450,
          conversationCount: 25,
          daysSinceStart: 10,
          playTime: 3600,
          lastPlayed: Date.now(),
          lastSaved: null,
          isFirstTime: false,
          currentScene: 'main_room',
          unlockedFeatures: ['chat', 'status'],
          gameVersion: '1.0.0'
        },
        updateGameState: vi.fn()
      } as any)
    })

    it('should get current level', () => {
      expect(adapter.getLevel()).toBe(5)
    })

    it('should calculate level up correctly', () => {
      expect(adapter.canLevelUp()).toBe(false)
      
      // Give enough experience for level 6
      vi.mocked(useStore.getState).mockReturnValue({
        gameState: {
          level: 5,
          experience: 735 // 100 * 6^1.5 = ~735
        },
        updateGameState: vi.fn()
      } as any)
      
      expect(adapter.canLevelUp()).toBe(true)
    })

    it('should validate state correctly', () => {
      expect(adapter.isValid()).toBe(true)
      expect(adapter.getErrors()).toHaveLength(0)
    })

    it('should calculate statistics', () => {
      const stats = adapter.getStatistics()
      
      expect(stats.totalPlayTime).toBe(3600)
      expect(stats.conversationCount).toBe(25)
      expect(stats.achievementsUnlocked).toBe(2)
      expect(stats.completionPercentage).toBeGreaterThanOrEqual(0)
      expect(stats.completionPercentage).toBeLessThanOrEqual(100)
    })
  })

  describe('CharacterStateAdapter', () => {
    let adapter: CharacterStateAdapter

    beforeEach(() => {
      adapter = new CharacterStateAdapter()
      
      vi.mocked(useStore.getState).mockReturnValue({
        companion: {
          id: 'companion_001',
          name: 'Aria',
          personalityTraits: {
            cheerful: 0.7,
            careful: 0.4,
            curious: 0.8,
            emotional: 0.6,
            independent: 0.3
          },
          currentEmotion: {
            dominant: 'happy' as const,
            intensity: 0.7,
            stability: 0.8
          },
          relationshipStatus: {
            level: 3,
            experience: 250,
            experienceToNext: 300,
            intimacyLevel: 0.6,
            trustLevel: 0.7
          },
          memoryBank: {
            shortTerm: [],
            longTerm: [],
            preferences: {},
            keyMoments: []
          },
          conversationContext: {
            currentTopic: 'music',
            recentTopics: ['games', 'movies'],
            moodHistory: ['happy', 'curious'],
            responseStyle: 'friendly'
          },
          gameProgress: {
            unlockedFeatures: ['basic_chat'],
            completedEvents: [],
            availableEvents: [],
            relationshipMilestones: ['first_meeting']
          }
        },
        updateCompanion: vi.fn()
      } as any)
    })

    it('should get character name', () => {
      expect(adapter.getCharacterName()).toBe('Aria')
    })

    it('should get current emotion', () => {
      expect(adapter.getCurrentEmotion()).toBe('happy')
      expect(adapter.getEmotionIntensity()).toBe(0.7)
    })

    it('should get relationship levels', () => {
      expect(adapter.getIntimacyLevel()).toBe(0.6)
      expect(adapter.getTrustLevel()).toBe(0.7)
    })

    it('should validate personality traits', () => {
      const traits = adapter.getPersonalityTraits()
      expect(traits.cheerful).toBe(0.7)
      expect(traits.curious).toBe(0.8)
      
      // All traits should be between 0 and 1
      Object.values(traits).forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThanOrEqual(1)
      })
    })

    it('should validate state', () => {
      expect(adapter.isValid()).toBe(true)
      expect(adapter.getErrors()).toHaveLength(0)
    })
  })

  describe('ConversationStateAdapter', () => {
    let adapter: ConversationStateAdapter

    beforeEach(() => {
      adapter = new ConversationStateAdapter()
      
      const mockMessages = [
        {
          id: 'msg_1',
          sender: 'user' as const,
          content: 'Hello!',
          timestamp: Date.now() - 2000
        },
        {
          id: 'msg_2',
          sender: 'ai' as const,
          content: 'Hi there!',
          timestamp: Date.now() - 1000,
          emotion: 'happy' as const
        }
      ]
      
      vi.mocked(useStore.getState).mockReturnValue({
        conversationHistory: mockMessages,
        isLoading: false,
        companion: {
          conversationContext: {
            currentTopic: 'greeting',
            recentTopics: [],
            moodHistory: [],
            responseStyle: 'friendly'
          }
        },
        addMessage: vi.fn(),
        sendMessage: vi.fn()
      } as any)
    })

    it('should get messages with pagination', () => {
      const messages = adapter.getMessages(0, 10)
      expect(messages).toHaveLength(2)
      expect(messages[0].content).toBe('Hello!')
    })

    it('should get last messages by sender', () => {
      const lastUser = adapter.getLastUserMessage()
      expect(lastUser?.content).toBe('Hello!')
      
      const lastAI = adapter.getLastAIMessage()
      expect(lastAI?.content).toBe('Hi there!')
    })

    it('should calculate conversation stats', () => {
      const stats = adapter.getConversationStats()
      expect(stats.totalMessages).toBe(2)
      expect(stats.userMessages).toBe(1)
      expect(stats.aiMessages).toBe(1)
    })
  })

  describe('SettingsStateAdapter', () => {
    let adapter: SettingsStateAdapter

    beforeEach(() => {
      adapter = new SettingsStateAdapter()
      
      vi.mocked(useStore.getState).mockReturnValue({
        settings: {
          soundEnabled: true,
          musicEnabled: false,
          animationsEnabled: true,
          darkMode: true,
          language: 'ko',
          notifications: false,
          autoSave: true,
          debugMode: false
        },
        updateSettings: vi.fn(),
        saveGame: vi.fn(),
        loadGame: vi.fn(),
        resetGame: vi.fn()
      } as any)
    })

    it('should get audio settings', () => {
      expect(adapter.isSoundEnabled()).toBe(true)
      expect(adapter.isMusicEnabled()).toBe(false)
    })

    it('should get visual settings', () => {
      expect(adapter.isDarkMode()).toBe(true)
      expect(adapter.areAnimationsEnabled()).toBe(true)
    })

    it('should get supported languages', () => {
      const languages = adapter.getSupportedLanguages()
      expect(languages).toContain('ko')
      expect(languages).toContain('en')
      expect(languages).toContain('ja')
      expect(languages).toContain('zh')
    })

    it('should validate settings', () => {
      expect(adapter.isValid()).toBe(true)
      expect(adapter.getErrors()).toHaveLength(0)
    })
  })
})