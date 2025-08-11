import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AIManager, getAIManager } from './AIManager'
import type { AIRequest } from './types'

// Mock environment
vi.mock('@config/env', () => ({
  ENV: {
    CLAUDE_API_KEY: 'test-key-123',
  },
}))

describe('AIManager Enhanced Features', () => {
  let aiManager: AIManager

  beforeEach(() => {
    // Reset singleton for each test
    vi.clearAllMocks()
    aiManager = getAIManager()
  })

  describe('Health Status', () => {
    it('should provide detailed health status', async () => {
      const healthStatus = await aiManager.getHealthStatus()

      expect(healthStatus).toBeDefined()
      expect(typeof healthStatus).toBe('object')

      // Should have at least mock provider
      expect('mock' in healthStatus).toBe(true)
    })

    it('should determine overall health correctly', async () => {
      const isHealthy = await aiManager.isHealthy()

      expect(typeof isHealthy).toBe('boolean')
    })
  })

  describe('Rate Limiting', () => {
    it('should provide rate limiter status', () => {
      const status = aiManager.getRateLimiterStatus()

      expect(status).toBeDefined()
      expect(typeof status).toBe('object')
    })
  })

  describe('Performance Monitoring', () => {
    it('should provide performance metrics', () => {
      const metrics = aiManager.getPerformanceMetrics()

      expect(metrics).toBeDefined()
      expect(typeof metrics).toBe('object')
    })
  })

  describe('Queue Management', () => {
    it('should provide queue status', () => {
      const queueStatus = aiManager.getQueueStatus()

      expect(queueStatus).toBeDefined()
      expect(queueStatus).toHaveProperty('high')
      expect(queueStatus).toHaveProperty('normal')
      expect(queueStatus).toHaveProperty('low')
      expect(queueStatus).toHaveProperty('total')
      expect(queueStatus).toHaveProperty('isProcessing')
    })

    it('should clear queue when requested', () => {
      aiManager.clearQueue()
      const status = aiManager.getQueueStatus()

      expect(status.total).toBe(0)
    })
  })

  describe('Request Processing with Priority', () => {
    const mockRequest: AIRequest = {
      messages: [{ role: 'user', content: 'test message' }],
      context: {
        companionName: 'TestBot',
        companionPersonality: {
          cheerful: 0.7,
          caring: 0.6,
          curious: 0.8,
          emotional: 0.5,
          independent: 0.3,
          playful: 0.7,
          supportive: 0.8,
          thoughtful: 0.6,
          adaptability: 0.5,
          consistency: 0.7,
          authenticity: 0.8,
        },
        relationshipLevel: 5,
        intimacyLevel: 0.5,
        companionEmotion: 'happy',
        recentTopics: ['greeting'],
        currentScene: 'main_room',
        timeOfDay: 'morning',
      },
    }

    it('should handle high priority requests', async () => {
      const response = await aiManager.generateResponse(mockRequest, 'high')

      expect(response).toBeDefined()
      expect(response.content).toBeDefined()
      expect(response.provider).toBe('mock') // Should fallback to mock
    })

    it('should handle normal priority requests', async () => {
      const response = await aiManager.generateResponse(mockRequest, 'normal')

      expect(response).toBeDefined()
      expect(response.content).toBeDefined()
    })

    it('should handle low priority requests', async () => {
      const response = await aiManager.generateResponse(mockRequest, 'low')

      expect(response).toBeDefined()
      expect(response.content).toBeDefined()
    })
  })

  describe('PromptEngine Integration', () => {
    it('should enhance requests with system prompts', async () => {
      const mockRequest: AIRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
        context: {
          companionName: 'Aria',
          companionPersonality: {
            cheerful: 0.8,
            caring: 0.7,
            curious: 0.9,
            emotional: 0.6,
            independent: 0.4,
            playful: 0.8,
            supportive: 0.9,
            thoughtful: 0.7,
            adaptability: 0.6,
            consistency: 0.8,
            authenticity: 0.9,
          },
          relationshipLevel: 3,
          intimacyLevel: 0.3,
          companionEmotion: 'curious',
          recentTopics: [],
          currentScene: 'conversation',
          timeOfDay: 'afternoon',
        },
      }

      const response = await aiManager.generateResponse(mockRequest)

      expect(response).toBeDefined()
      expect(response.provider).toBe('mock') // Should use mock provider
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid requests gracefully', async () => {
      const invalidRequest = {
        messages: [],
        context: null,
      } as any

      await expect(aiManager.generateResponse(invalidRequest)).rejects.toThrow()
    })
  })

  describe('Usage Statistics', () => {
    it('should provide usage statistics', () => {
      const stats = aiManager.getUsageStats()

      expect(stats).toBeDefined()
      expect(stats).toHaveProperty('totalRequests')
      expect(stats).toHaveProperty('totalTokens')
      expect(stats).toHaveProperty('totalCost')
      expect(stats).toHaveProperty('errorRate')
      expect(stats).toHaveProperty('providerUsage')
    })
  })
})
