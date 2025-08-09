/**
 * API Bridge Tests
 * 
 * Tests the API bridge functionality including validation, retry logic,
 * rate limiting, and integration with state adapters
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { APIBridge } from '../APIBridge'
import type { Message } from '@types'

// Mock the dependencies
vi.mock('@services/ai/AIManager')
vi.mock('@services/security/SecurityEnhancementLayer')
vi.mock('@store/adapters', () => ({
  getConversationStateAdapter: vi.fn(),
  getCharacterStateAdapter: vi.fn(),
  getGameStateAdapter: vi.fn()
}))

describe('APIBridge', () => {
  let apiBridge: APIBridge
  let mockCharacterAdapter: any
  let mockConversationAdapter: any
  let mockGameAdapter: any

  beforeEach(() => {
    // Setup mock adapters
    mockCharacterAdapter = {
      getCharacter: vi.fn(() => ({
        id: 'test-character',
        name: 'Test Character',
        currentEmotion: { dominant: 'neutral', intensity: 0.5 },
        personalityTraits: { cheerful: 0.7 },
        conversationContext: { recentTopics: ['greeting'] },
        relationshipStatus: { intimacyLevel: 0.5, trustLevel: 0.6 }
      })),
      getIntimacyLevel: vi.fn(() => 0.5),
      updateEmotion: vi.fn()
    }

    mockConversationAdapter = {
      getMessages: vi.fn(() => [
        { id: '1', sender: 'user', content: 'Hello', timestamp: Date.now() - 1000 },
        { id: '2', sender: 'ai', content: 'Hi there!', timestamp: Date.now() }
      ])
    }

    mockGameAdapter = {
      getState: vi.fn(() => ({
        level: 5,
        experience: 1200,
        playTime: 3600,
        unlockedFeatures: ['chat', 'exploration']
      }))
    }

    // Mock the adapter getters
    const { getCharacterStateAdapter, getConversationStateAdapter, getGameStateAdapter } = 
      await import('@store/adapters')
    
    vi.mocked(getCharacterStateAdapter).mockReturnValue(mockCharacterAdapter)
    vi.mocked(getConversationStateAdapter).mockReturnValue(mockConversationAdapter)
    vi.mocked(getGameStateAdapter).mockReturnValue(mockGameAdapter)

    // Create API bridge in mock mode
    apiBridge = new APIBridge({ mockMode: true, timeout: 5000 })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('sendMessage', () => {
    it('should send message and return AI response', async () => {
      const result = await apiBridge.sendMessage('Hello, how are you?')

      expect(result).toMatchObject({
        id: expect.stringMatching(/^msg_\d+_ai$/),
        sender: 'ai',
        content: expect.any(String),
        timestamp: expect.any(Number),
        emotion: expect.any(String)
      })

      // Should have called character adapter to get context
      expect(mockCharacterAdapter.getCharacter).toHaveBeenCalled()
      expect(mockCharacterAdapter.getIntimacyLevel).toHaveBeenCalled()
    })

    it('should handle empty messages', async () => {
      await expect(apiBridge.sendMessage('')).rejects.toThrow('Message content cannot be empty')
      await expect(apiBridge.sendMessage('   ')).rejects.toThrow('Message content cannot be empty')
    })

    it('should validate message length', async () => {
      const longMessage = 'a'.repeat(1001)
      await expect(apiBridge.sendMessage(longMessage)).rejects.toThrow()
    })

    it('should update character emotion based on response', async () => {
      const result = await apiBridge.sendMessage('I love spending time with you!')

      // Mock should return an emotion
      expect(mockCharacterAdapter.updateEmotion).toHaveBeenCalledWith(
        result.emotion,
        expect.any(Number)
      )
    })

    it('should handle API errors gracefully', async () => {
      // Create bridge with error simulation
      const errorBridge = new APIBridge({ mockMode: false, timeout: 100 })
      
      // Should timeout and fallback
      const result = await errorBridge.sendMessage('test message')
      expect(result.content).toContain('error')
    })
  })

  describe('rate limiting', () => {
    it('should enforce rate limits', async () => {
      const rateLimitedBridge = new APIBridge({ 
        mockMode: true,
        rateLimitPerMinute: 2 
      })

      // First two requests should succeed
      await rateLimitedBridge.sendMessage('message 1')
      await rateLimitedBridge.sendMessage('message 2')

      // Third request should fail
      await expect(rateLimitedBridge.sendMessage('message 3'))
        .rejects.toThrow('Rate limit exceeded')
    })

    it('should reset rate limit after time window', async () => {
      vi.useFakeTimers()

      const rateLimitedBridge = new APIBridge({ 
        mockMode: true,
        rateLimitPerMinute: 1 
      })

      await rateLimitedBridge.sendMessage('message 1')
      
      // Should fail immediately
      await expect(rateLimitedBridge.sendMessage('message 2'))
        .rejects.toThrow('Rate limit exceeded')

      // Advance time by 61 seconds
      vi.advanceTimersByTime(61000)

      // Should succeed now
      await expect(rateLimitedBridge.sendMessage('message 3'))
        .resolves.toBeDefined()

      vi.useRealTimers()
    })
  })

  describe('request deduplication', () => {
    it('should deduplicate identical requests', async () => {
      const spy = vi.spyOn(apiBridge as any, 'generateMockResponse')

      // Send identical messages quickly
      const promises = [
        apiBridge.sendMessage('duplicate message'),
        apiBridge.sendMessage('duplicate message'),
        apiBridge.sendMessage('duplicate message')
      ]

      const results = await Promise.all(promises)

      // All should return same result
      expect(results[0]).toEqual(results[1])
      expect(results[1]).toEqual(results[2])

      // Mock should only be called once
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('should not deduplicate after timeout', async () => {
      vi.useFakeTimers()

      const spy = vi.spyOn(apiBridge as any, 'generateMockResponse')

      await apiBridge.sendMessage('message')
      
      // Advance time past deduplication window
      vi.advanceTimersByTime(6000)
      
      await apiBridge.sendMessage('message')

      // Should be called twice
      expect(spy).toHaveBeenCalledTimes(2)

      vi.useRealTimers()
    })
  })

  describe('saveGameState', () => {
    it('should save game state successfully', async () => {
      const result = await apiBridge.saveGameState()

      expect(result).toMatchObject({
        success: true,
        saveId: expect.stringMatching(/^save_\d+$/)
      })

      // Should have called game and character adapters
      expect(mockGameAdapter.getState).toHaveBeenCalled()
      expect(mockCharacterAdapter.getCharacter).toHaveBeenCalled()
    })

    it('should handle missing character gracefully', async () => {
      mockCharacterAdapter.getCharacter.mockReturnValue(null)

      await expect(apiBridge.saveGameState())
        .rejects.toThrow('Cannot save: Character not initialized')
    })

    it('should validate save data structure', async () => {
      // Mock invalid game state
      mockGameAdapter.getState.mockReturnValue({
        level: -1, // Invalid level
        experience: 'invalid',
        playTime: null
      })

      await expect(apiBridge.saveGameState()).rejects.toThrow()
    })
  })

  describe('loadGameState', () => {
    it('should load mock save data', async () => {
      const result = await apiBridge.loadGameState('save_123')

      expect(result).toMatchObject({
        gameState: {
          level: expect.any(Number),
          experience: expect.any(Number),
          playTime: expect.any(Number),
          unlockedFeatures: expect.any(Array)
        },
        companion: {
          name: expect.any(String),
          personalityTraits: expect.any(Object),
          relationshipStatus: expect.any(Object)
        }
      })
    })

    it('should handle load errors gracefully', async () => {
      const errorBridge = new APIBridge({ mockMode: false })
      
      await expect(errorBridge.loadGameState('invalid_save'))
        .rejects.toThrow('Load not implemented for production')
    })
  })

  describe('getContentRecommendations', () => {
    it('should generate recommendations based on character state', async () => {
      const recommendations = await apiBridge.getContentRecommendations()

      expect(recommendations).toMatchObject({
        topics: expect.arrayContaining([expect.any(String)]),
        activities: expect.arrayContaining([expect.any(String)]),
        emotionalTone: expect.any(String)
      })
    })

    it('should adapt recommendations to intimacy level', async () => {
      // Test low intimacy
      mockCharacterAdapter.getIntimacyLevel.mockReturnValue(0.2)
      const lowIntimacy = await apiBridge.getContentRecommendations()
      
      // Test high intimacy  
      mockCharacterAdapter.getIntimacyLevel.mockReturnValue(0.9)
      const highIntimacy = await apiBridge.getContentRecommendations()

      // Should get different topics based on intimacy
      expect(lowIntimacy.topics).not.toEqual(highIntimacy.topics)
      expect(lowIntimacy.emotionalTone).not.toEqual(highIntimacy.emotionalTone)
    })

    it('should handle missing character gracefully', async () => {
      mockCharacterAdapter.getCharacter.mockReturnValue(null)

      const recommendations = await apiBridge.getContentRecommendations()

      expect(recommendations).toMatchObject({
        topics: ['getting to know each other', 'hobbies', 'daily life'],
        activities: ['casual chat', 'share stories'],
        emotionalTone: 'friendly'
      })
    })
  })

  describe('error handling', () => {
    it('should implement retry logic with exponential backoff', async () => {
      vi.useFakeTimers()

      const errorBridge = new APIBridge({ 
        mockMode: false, 
        timeout: 100,
        maxRetries: 2
      })

      const startTime = Date.now()
      const promise = errorBridge.sendMessage('test')

      // Let timeouts occur
      await vi.advanceTimersByTimeAsync(100) // First timeout
      await vi.advanceTimersByTimeAsync(1000) // First retry delay
      await vi.advanceTimersByTimeAsync(100) // Second timeout
      await vi.advanceTimersByTimeAsync(2000) // Second retry delay
      await vi.advanceTimersByTimeAsync(100) // Final timeout

      await expect(promise).rejects.toThrow()

      vi.useRealTimers()
    })

    it('should clean up pending requests', async () => {
      vi.useFakeTimers()

      const pendingMap = (apiBridge as any).pendingRequests

      // Create pending request
      apiBridge.sendMessage('test message')
      expect(pendingMap.size).toBe(1)

      // Advance time past cleanup threshold
      vi.advanceTimersByTime(61000)

      // Should be cleaned up
      expect(pendingMap.size).toBe(0)

      vi.useRealTimers()
    })
  })
})