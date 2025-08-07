import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getAIManager } from '@services'
import type { AIManager } from '@services/ai/AIManager'
import type { AIRequest } from '@services/ai/types'

/**
 * Integration test for AI conversation system
 * Based on execution plan requirements
 */
describe('AI Conversation Integration Tests', () => {
  let aiManager: AIManager
  
  // Test context based on execution plan
  const defaultContext = {
    companionName: '루나',
    companionPersonality: {
      cheerful: 0.7,
      careful: 0.4,
      curious: 0.8,
      emotional: 0.6,
      independent: 0.3,
      playful: 0.7,
      supportive: 0.8,
    },
    relationshipLevel: 1,
    intimacyLevel: 0.1,
    companionEmotion: 'happy' as const,
    currentScene: 'home',
    timeOfDay: 'afternoon' as const,
    recentTopics: [] as string[],
    recentMemories: [] as any[],
    conversationTone: 'casual' as const,
    userEmotionalState: 'neutral' as const,
  }

  beforeAll(() => {
    aiManager = getAIManager()
  })

  afterAll(async () => {
    await aiManager.shutdown()
  })

  describe('Basic Conversation Flow', () => {
    // Test cases from execution plan
    const testCases = [
      { input: '안녕하세요', expectedEmotion: ['happy', 'cheerful'] },
      { input: '오늘 기분이 어때?', expectedEmotion: ['happy', 'cheerful', 'playful'] },
      { input: '같이 모험 떠날까?', expectedEmotion: ['excited', 'playful'] },
    ]

    testCases.forEach(({ input, expectedEmotion }) => {
      it(`should respond appropriately to: "${input}"`, async () => {
        const request: AIRequest = {
          messages: [{ role: 'user', content: input }],
          context: defaultContext,
          options: {
            maxTokens: 150,
            temperature: 0.7,
          },
        }

        const response = await aiManager.generateResponse(request)

        // Verify response structure
        expect(response).toBeDefined()
        expect(response.content).toBeTruthy()
        expect(response.content.length).toBeGreaterThan(0)
        expect(response.content.length).toBeLessThan(150) // Korean character limit from plan
        
        // Verify emotion is appropriate
        expect(expectedEmotion).toContain(response.emotion)
        
        // Verify response quality
        expect(response.confidence).toBeGreaterThan(0.5)
        expect(response.tokensUsed).toBeGreaterThan(0)
        expect(response.provider).toBeDefined()
        
        // Verify Korean language response
        expect(response.content).toMatch(/[가-힣]/) // Contains Korean characters
      })
    })
  })

  describe('Context-Aware Responses', () => {
    it('should respond differently based on relationship level', async () => {
      // Low relationship level
      const lowRelationshipRequest: AIRequest = {
        messages: [{ role: 'user', content: '보고 싶었어' }],
        context: { ...defaultContext, relationshipLevel: 1, intimacyLevel: 0.1 },
      }

      const lowResponse = await aiManager.generateResponse(lowRelationshipRequest)

      // High relationship level
      const highRelationshipRequest: AIRequest = {
        messages: [{ role: 'user', content: '보고 싶었어' }],
        context: { ...defaultContext, relationshipLevel: 5, intimacyLevel: 0.8 },
      }

      const highResponse = await aiManager.generateResponse(highRelationshipRequest)

      // Responses should be different
      expect(lowResponse.content).not.toBe(highResponse.content)
      
      // Higher relationship might have more intimate response
      expect(highResponse.emotion).toMatch(/happy|caring|excited/)
    })

    it('should respond based on companion mood', async () => {
      const moods = ['happy', 'sad', 'playful', 'thoughtful'] as const
      const responses: string[] = []

      for (const mood of moods) {
        const request: AIRequest = {
          messages: [{ role: 'user', content: '뭐하고 있었어?' }],
          context: { ...defaultContext, companionEmotion: mood },
        }

        const response = await aiManager.generateResponse(request)
        responses.push(response.content)
        
        // Emotion should generally align with companion's mood
        if (mood === 'sad') {
          expect(['sad', 'calm', 'caring']).toContain(response.emotion)
        } else if (mood === 'playful') {
          expect(['playful', 'happy', 'excited']).toContain(response.emotion)
        }
      }

      // Responses should vary based on mood
      const uniqueResponses = new Set(responses)
      expect(uniqueResponses.size).toBeGreaterThan(1)
    })

    it('should consider time of day in responses', async () => {
      const times = ['morning', 'afternoon', 'evening', 'night'] as const
      
      for (const time of times) {
        const request: AIRequest = {
          messages: [{ role: 'user', content: '안녕!' }],
          context: { ...defaultContext, timeOfDay: time },
        }

        const response = await aiManager.generateResponse(request)
        
        // Morning responses might mention breakfast or good morning
        if (time === 'morning') {
          expect(response.content).toMatch(/아침|오전|좋은 하루|굿모닝/i)
        }
        // Night responses might mention sleep or rest
        else if (time === 'night') {
          expect(response.content).toMatch(/밤|저녁|잘|꿈|휴식/i)
        }
      }
    })
  })

  describe('Conversation Memory', () => {
    it('should maintain context across multiple messages', async () => {
      const conversation = [
        '내 이름은 테스터야',
        '나 오늘 피자 먹었어',
        '내 이름이 뭐라고 했지?',
      ]

      const messages: any[] = []
      let lastResponse: any

      for (const userMessage of conversation) {
        messages.push({ role: 'user', content: userMessage })
        
        if (lastResponse) {
          messages.push({ role: 'assistant', content: lastResponse.content })
        }

        const request: AIRequest = {
          messages,
          context: {
            ...defaultContext,
            recentTopics: ['이름 소개', '음식 이야기'],
          },
        }

        lastResponse = await aiManager.generateResponse(request)
      }

      // The AI should remember the name mentioned earlier
      expect(lastResponse.content).toMatch(/테스터/i)
    })
  })

  describe('Response Caching', () => {
    it('should cache identical requests', async () => {
      const request: AIRequest = {
        messages: [{ role: 'user', content: '날씨 어때?' }],
        context: defaultContext,
      }

      // First request
      const response1 = await aiManager.generateResponse(request)
      const time1 = response1.processingTime

      // Second identical request
      const response2 = await aiManager.generateResponse(request)
      const time2 = response2.processingTime

      // Second response should be cached
      expect(response2.cached).toBe(true)
      expect(response2.content).toBe(response1.content)
      expect(time2).toBeLessThan(time1) // Cached response should be faster
    })

    it('should not cache different requests', async () => {
      const request1: AIRequest = {
        messages: [{ role: 'user', content: '안녕!' }],
        context: defaultContext,
      }

      const request2: AIRequest = {
        messages: [{ role: 'user', content: '잘가!' }],
        context: defaultContext,
      }

      const response1 = await aiManager.generateResponse(request1)
      const response2 = await aiManager.generateResponse(request2)

      expect(response1.content).not.toBe(response2.content)
      expect(response2.cached).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should gracefully handle empty messages', async () => {
      const request: AIRequest = {
        messages: [],
        context: defaultContext,
      }

      const response = await aiManager.generateResponse(request)
      expect(response).toBeDefined()
      expect(response.content).toBeTruthy()
    })

    it('should handle very long messages', async () => {
      const longMessage = '안녕하세요! '.repeat(100)
      const request: AIRequest = {
        messages: [{ role: 'user', content: longMessage }],
        context: defaultContext,
        options: {
          maxTokens: 150,
        },
      }

      const response = await aiManager.generateResponse(request)
      expect(response).toBeDefined()
      expect(response.content.length).toBeLessThan(500) // Should respect limits
    })
  })

  describe('Personality Consistency', () => {
    it('should maintain personality traits in responses', async () => {
      // Test with high cheerful personality
      const cheerfulContext = {
        ...defaultContext,
        companionPersonality: {
          ...defaultContext.companionPersonality,
          cheerful: 0.9,
          playful: 0.9,
        },
      }

      const cheerfulRequest: AIRequest = {
        messages: [{ role: 'user', content: '오늘 뭐할까?' }],
        context: cheerfulContext,
      }

      const response = await aiManager.generateResponse(cheerfulRequest)
      
      // Cheerful personality should result in positive emotions
      expect(['happy', 'excited', 'playful']).toContain(response.emotion)
      
      // Response should contain exclamation marks or positive expressions
      expect(response.content).toMatch(/[!~♪♥😊]|ㅎㅎ|헤헤|히히/)
    })

    it('should show caring personality in supportive contexts', async () => {
      const caringContext = {
        ...defaultContext,
        companionPersonality: {
          ...defaultContext.companionPersonality,
          caring: 0.9,
          supportive: 0.9,
        },
      }

      const request: AIRequest = {
        messages: [{ role: 'user', content: '오늘 좀 힘들었어...' }],
        context: caringContext,
      }

      const response = await aiManager.generateResponse(request)
      
      // Should show caring emotion
      expect(['caring', 'calm', 'thoughtful']).toContain(response.emotion)
      
      // Response should contain supportive language
      expect(response.content).toMatch(/괜찮|힘내|도와|함께|편/)
    })
  })

  describe('Performance Requirements', () => {
    it('should respond within acceptable time limits', async () => {
      const request: AIRequest = {
        messages: [{ role: 'user', content: '안녕하세요!' }],
        context: defaultContext,
      }

      const startTime = Date.now()
      const response = await aiManager.generateResponse(request)
      const endTime = Date.now()

      const responseTime = endTime - startTime

      // Response should be reasonably fast
      expect(responseTime).toBeLessThan(5000) // 5 seconds max
      expect(response.processingTime).toBeLessThan(5000)
    })

    it('should handle multiple concurrent requests', async () => {
      const requests = Array(5).fill(null).map((_, i) => ({
        messages: [{ role: 'user', content: `테스트 메시지 ${i}` }],
        context: defaultContext,
      }))

      const responses = await Promise.all(
        requests.map(req => aiManager.generateResponse(req))
      )

      // All responses should be successful
      expect(responses).toHaveLength(5)
      responses.forEach((response, i) => {
        expect(response).toBeDefined()
        expect(response.content).toBeTruthy()
      })
    })
  })
})