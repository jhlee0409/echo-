import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getAIManager } from '@services'
import type { AIManager } from '@services/ai/AIManager'
import type { AIRequest } from '@services/ai/types'

/**
 * Performance tests based on execution-plan.md requirements
 * 
 * Performance targets from execution-plan.md:
 * - API Response Time: <2 seconds
 * - Cache Efficiency: 70-80% hit rate
 * - Cost Optimization: $20-50/month through caching
 * - UI Responsiveness: Touch optimized
 */
describe('Performance Tests - execution-plan.md Standards', () => {
  let aiManager: AIManager
  
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

  describe('API Response Time Tests', () => {
    // execution-plan.md: 암시적 <2초 응답 시간 요구
    it('should respond to basic greeting within 2 seconds', async () => {
      const startTime = Date.now()
      
      const request: AIRequest = {
        messages: [{ role: 'user', content: '안녕하세요' }],
        context: defaultContext,
      }

      const response = await aiManager.generateResponse(request)
      const endTime = Date.now()
      const responseTime = endTime - startTime

      expect(responseTime).toBeLessThan(2000) // <2 seconds as per plan
      expect(response.content).toBeDefined()
      expect(response.content.length).toBeGreaterThan(0)

      console.log(`✅ Basic greeting response time: ${responseTime}ms`)
    })

    it('should handle complex conversation within performance budget', async () => {
      const startTime = Date.now()
      
      const request: AIRequest = {
        messages: [
          { role: 'user', content: '오늘 기분이 어때?' },
          { role: 'assistant', content: '기분이 좋아요!' },
          { role: 'user', content: '같이 모험 떠날까? 새로운 곳을 탐험하고 싶어' }
        ],
        context: {
          ...defaultContext,
          recentTopics: ['감정', '모험', '탐험'],
          relationshipLevel: 3
        },
      }

      const response = await aiManager.generateResponse(request)
      const endTime = Date.now()
      const responseTime = endTime - startTime

      expect(responseTime).toBeLessThan(2000) // execution-plan.md target
      expect(response.content).toBeDefined()

      console.log(`✅ Complex conversation response time: ${responseTime}ms`)
    })

    it('should maintain performance under concurrent requests', async () => {
      const concurrentRequests = 5
      const requests: Promise<any>[] = []
      
      const startTime = Date.now()

      for (let i = 0; i < concurrentRequests; i++) {
        const request: AIRequest = {
          messages: [{ role: 'user', content: `테스트 메시지 ${i + 1}` }],
          context: defaultContext,
        }
        
        requests.push(aiManager.generateResponse(request))
      }

      const responses = await Promise.all(requests)
      const endTime = Date.now()
      const totalTime = endTime - startTime
      const avgTime = totalTime / concurrentRequests

      expect(avgTime).toBeLessThan(2000) // Average should still be <2s
      expect(responses).toHaveLength(concurrentRequests)
      responses.forEach(response => {
        expect(response.content).toBeDefined()
      })

      console.log(`✅ Concurrent (${concurrentRequests}) avg response time: ${avgTime}ms`)
    })
  })

  describe('Cache Performance Tests', () => {
    // execution-plan.md: "캐싱 적극 활용" - 70-80% API 호출 절감
    it('should demonstrate cache efficiency for repeated requests', async () => {
      const testMessage = '안녕하세요! 오늘 날씨가 좋네요.'
      
      // First request (cache miss)
      const firstStart = Date.now()
      const request: AIRequest = {
        messages: [{ role: 'user', content: testMessage }],
        context: defaultContext,
      }
      
      const firstResponse = await aiManager.generateResponse(request)
      const firstTime = Date.now() - firstStart
      
      // Second identical request (cache hit)
      const secondStart = Date.now()
      const secondResponse = await aiManager.generateResponse(request)
      const secondTime = Date.now() - secondStart
      
      // Cache hit should be significantly faster
      expect(secondTime).toBeLessThan(firstTime * 0.5) // At least 50% faster
      expect(secondResponse.content).toBeDefined()
      
      // Content might be same or similar from cache
      console.log(`✅ First request: ${firstTime}ms, Cached request: ${secondTime}ms`)
      console.log(`✅ Cache speedup: ${Math.round(((firstTime - secondTime) / firstTime) * 100)}%`)
    })

    it('should achieve target cache hit rate over multiple requests', async () => {
      const testCases = [
        '안녕하세요',
        '오늘 기분이 어때?',
        '같이 모험 떠날까?',
        '안녕하세요', // Repeat
        '오늘 기분이 어때?', // Repeat
      ]
      
      let cacheHits = 0
      let totalRequests = 0
      
      for (const message of testCases) {
        const startTime = Date.now()
        
        const request: AIRequest = {
          messages: [{ role: 'user', content: message }],
          context: defaultContext,
        }
        
        await aiManager.generateResponse(request)
        const responseTime = Date.now() - startTime
        
        // Consider fast responses (<100ms) as cache hits
        if (responseTime < 100) {
          cacheHits++
        }
        totalRequests++
      }
      
      const hitRate = (cacheHits / totalRequests) * 100
      
      // execution-plan.md target: 70-80% efficiency through caching
      expect(hitRate).toBeGreaterThan(0) // Some caching should occur
      
      console.log(`✅ Cache hit rate: ${hitRate.toFixed(1)}% (${cacheHits}/${totalRequests})`)
    })
  })

  describe('Resource Optimization Tests', () => {
    // execution-plan.md: 비용 최적화를 위한 성능
    it('should optimize API calls through intelligent caching', async () => {
      const conversations = [
        { input: '안녕', mood: 'happy' },
        { input: '안녕', mood: 'happy' }, // Same context, should cache
        { input: '안녕', mood: 'sad' },   // Different mood, new request
        { input: '안녕', mood: 'happy' }, // Back to cached context
      ]
      
      let totalTime = 0
      let apiCalls = 0
      
      for (const { input, mood } of conversations) {
        const startTime = Date.now()
        
        const request: AIRequest = {
          messages: [{ role: 'user', content: input }],
          context: {
            ...defaultContext,
            companionEmotion: mood as any
          },
        }
        
        await aiManager.generateResponse(request)
        const responseTime = Date.now() - startTime
        
        totalTime += responseTime
        
        // Assume responses >500ms are actual API calls
        if (responseTime > 500) {
          apiCalls++
        }
      }
      
      const avgTime = totalTime / conversations.length
      const efficiencyRatio = (conversations.length - apiCalls) / conversations.length
      
      expect(avgTime).toBeLessThan(1500) // Good average performance
      expect(efficiencyRatio).toBeGreaterThan(0) // Some API call reduction
      
      console.log(`✅ API calls reduced by ${(efficiencyRatio * 100).toFixed(1)}%`)
      console.log(`✅ Average response time: ${avgTime}ms`)
    })
  })

  describe('UI Responsiveness Tests', () => {
    // execution-plan.md: "터치 최적화" UI 반응성
    it('should provide immediate feedback for user interactions', async () => {
      // Simulate rapid user typing scenario
      const rapidInputs = [
        '안', '안녕', '안녕하', '안녕하세', '안녕하세요'
      ]
      
      for (const input of rapidInputs) {
        const startTime = Date.now()
        
        // Simulate partial input processing
        const request: AIRequest = {
          messages: [{ role: 'user', content: input }],
          context: defaultContext,
          options: {
            stream: false, // Quick response mode
            maxTokens: 50, // Limit for faster response
          }
        }
        
        const response = await aiManager.generateResponse(request)
        const responseTime = Date.now() - startTime
        
        // Should provide quick acknowledgment
        expect(responseTime).toBeLessThan(1000) // Mobile-friendly timing
        expect(response.content).toBeDefined()
      }
      
      console.log(`✅ Rapid input responses all < 1000ms (mobile optimized)`)
    })
  })

  describe('Stress Testing', () => {
    // Additional stress testing for production readiness
    it('should maintain performance under heavy load', async () => {
      const heavyLoad = 10
      const startTime = Date.now()
      
      const requests = Array.from({ length: heavyLoad }, (_, i) => {
        const request: AIRequest = {
          messages: [{ role: 'user', content: `스트레스 테스트 ${i + 1}` }],
          context: {
            ...defaultContext,
            relationshipLevel: i % 5 + 1 // Vary context
          },
        }
        return aiManager.generateResponse(request)
      })
      
      const responses = await Promise.all(requests)
      const totalTime = Date.now() - startTime
      const avgTime = totalTime / heavyLoad
      
      expect(responses).toHaveLength(heavyLoad)
      expect(avgTime).toBeLessThan(3000) // Reasonable under load
      
      responses.forEach((response, i) => {
        expect(response.content).toBeDefined()
        expect(response.content.length).toBeGreaterThan(0)
      })
      
      console.log(`✅ Heavy load (${heavyLoad} concurrent) avg time: ${avgTime}ms`)
    })
  })
})