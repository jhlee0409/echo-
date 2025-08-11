import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useStore } from '@store/gameStore'
import type { AIResponse } from '@services/ai/types'

/**
 * Feature Tests: Load Testing and Performance
 * Validates system performance under load before implementing new features
 */
describe('Feature: Load Testing and Performance', () => {
  beforeEach(async () => {
    // Initialize store for performance testing
    const { result } = renderHook(() => useStore())
    await act(async () => {
      await result.current.initialize()
    })
    
    vi.clearAllMocks()
    
    // Mock performance-optimized AI manager for consistent testing
    const mockOptimizedManager = {
      generateResponse: vi.fn().mockImplementation(async () => {
        // Simulate variable response times
        const delay = Math.random() * 1000 + 500 // 500-1500ms
        await new Promise(resolve => setTimeout(resolve, delay))
        
        return {
          content: '성능 테스트를 위한 최적화된 응답입니다.',
          emotion: 'happy',
          confidence: 0.85,
          tokensUsed: 45,
          provider: 'claude',
          processingTime: delay,
          cached: false
        } as AIResponse
      }),
      isHealthy: vi.fn().mockResolvedValue(true),
      shutdown: vi.fn().mockResolvedValue(undefined)
    }

    vi.doMock('@services/ai', () => ({
      getAIManager: () => mockOptimizedManager
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Given normal conversation load', () => {
    describe('When handling sequential conversation requests', () => {
      it('Then it should maintain consistent response times', async () => {
        const { result } = renderHook(() => useStore())
        
        const responseTimes: number[] = []
        const messageCount = 10
        
        // When: Send multiple sequential messages
        for (let i = 0; i < messageCount; i++) {
          const startTime = performance.now()
          
          await act(async () => {
            await result.current.sendMessage(`순차 테스트 메시지 ${i}`)
          })
          
          await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
          }, { timeout: 5000 })
          
          const endTime = performance.now()
          responseTimes.push(endTime - startTime)
        }
        
        // Then: Response times should be consistent and acceptable
        const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        const maxResponseTime = Math.max(...responseTimes)
        const minResponseTime = Math.min(...responseTimes)
        
        expect(avgResponseTime).toBeLessThan(3000) // Average under 3 seconds
        expect(maxResponseTime).toBeLessThan(5000) // Max under 5 seconds
        
        // Response time variance should not be extreme
        const variance = maxResponseTime - minResponseTime
        expect(variance).toBeLessThan(4000) // Max 4 second variance
        
        // All conversations should be completed
        expect(result.current.conversationHistory.length).toBe(messageCount * 2)
      })

      it('Then it should manage memory usage efficiently during extended conversations', async () => {
        const { result } = renderHook(() => useStore())
        
        const initialMemory = process.memoryUsage().heapUsed
        
        // When: Have extended conversation (50 messages)
        for (let i = 0; i < 50; i++) {
          await act(async () => {
            await result.current.sendMessage(`장시간 대화 테스트 ${i}`)
          })
          
          await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
          }, { timeout: 3000 })
          
          // Trigger garbage collection periodically in test environment
          if (i % 10 === 0 && global.gc) {
            global.gc()
          }
        }
        
        const finalMemory = process.memoryUsage().heapUsed
        const memoryGrowth = finalMemory - initialMemory
        
        // Then: Memory growth should be reasonable
        expect(memoryGrowth).toBeLessThan(100 * 1024 * 1024) // Less than 100MB growth
        
        // Conversation history should be properly managed
        expect(result.current.conversationHistory.length).toBe(100) // 50 user + 50 AI
        
        // Recent topics should be limited as per implementation
        const recentTopics = result.current.companion!.conversationContext.recentTopics
        expect(recentTopics.length).toBeLessThanOrEqual(5)
        
        // Mood history should be limited
        const moodHistory = result.current.companion!.conversationContext.moodHistory
        expect(moodHistory.length).toBeLessThanOrEqual(10)
      })
    })

    describe('When handling rapid-fire message scenarios', () => {
      it('Then it should handle quick consecutive messages without data corruption', async () => {
        const { result } = renderHook(() => useStore())
        
        const messages = [
          '첫 번째 빠른 메시지',
          '두 번째 빠른 메시지', 
          '세 번째 빠른 메시지',
          '네 번째 빠른 메시지',
          '다섯 번째 빠른 메시지'
        ]
        
        // When: Send messages in rapid succession
        const startTime = performance.now()
        
        for (const message of messages) {
          act(() => {
            // Fire messages without waiting (rapid-fire)
            result.current.sendMessage(message)
          })
        }
        
        // Wait for all to complete
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        }, { timeout: 15000 })
        
        const endTime = performance.now()
        const totalTime = endTime - startTime
        
        // Then: Should handle all messages efficiently
        expect(totalTime).toBeLessThan(10000) // Complete within 10 seconds
        
        // All user messages should be recorded
        const userMessages = result.current.conversationHistory.filter(msg => msg.sender === 'user')
        expect(userMessages).toHaveLength(messages.length)
        
        // Verify message order and content integrity
        userMessages.forEach((msg, index) => {
          expect(msg.content).toBe(messages[index])
          expect(msg.id).toMatch(/msg_\d+_user/)
          expect(msg.timestamp).toBeGreaterThan(startTime)
        })
        
        // Should have AI responses for all messages
        const aiMessages = result.current.conversationHistory.filter(msg => msg.sender === 'ai')
        expect(aiMessages.length).toBeGreaterThan(0)
      })

      it('Then it should maintain state consistency under concurrent operations', async () => {
        const { result } = renderHook(() => useStore())
        
        // When: Perform concurrent state operations
        const operations = [
          () => result.current.updateGameState({ experience: 100 }),
          () => result.current.updateCompanion({ 
            currentEmotion: { dominant: 'happy', intensity: 0.8, stability: 0.9 }
          }),
          () => result.current.sendMessage('동시 작업 테스트 1'),
          () => result.current.updateSettings({ darkMode: false }),
          () => result.current.sendMessage('동시 작업 테스트 2')
        ]
        
        // Execute operations concurrently
        await Promise.all(operations.map(op => act(async () => op())))
        
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        }, { timeout: 10000 })
        
        // Then: State should be consistent
        expect(result.current.gameState!.experience).toBe(100)
        expect(result.current.companion!.currentEmotion.dominant).toBe('happy')
        expect(result.current.settings!.darkMode).toBe(false)
        
        // Messages should be processed
        const userMessages = result.current.conversationHistory.filter(msg => msg.sender === 'user')
        expect(userMessages.length).toBeGreaterThanOrEqual(2)
      })
    })
  })

  describe('Given high-load conversation scenarios', () => {
    describe('When simulating multiple concurrent conversations', () => {
      it('Then it should handle concurrent conversation threads efficiently', async () => {
        const stores = Array.from({ length: 5 }, () => {
          const { result } = renderHook(() => useStore())
          return result
        })
        
        // Initialize all stores
        await Promise.all(stores.map(store => 
          act(async () => {
            await store.current.initialize()
          })
        ))
        
        const startTime = performance.now()
        
        // When: Run concurrent conversations across multiple stores
        const conversationPromises = stores.map((store, index) =>
          act(async () => {
            await store.current.sendMessage(`동시 대화 테스트 - 스토어 ${index}`)
          })
        )
        
        await Promise.all(conversationPromises)
        
        // Wait for all conversations to complete
        await Promise.all(stores.map(store =>
          waitFor(() => {
            expect(store.current.isLoading).toBe(false)
          }, { timeout: 10000 })
        ))
        
        const endTime = performance.now()
        const totalTime = endTime - startTime
        
        // Then: Should handle concurrent load efficiently
        expect(totalTime).toBeLessThan(8000) // Complete within 8 seconds
        
        // All stores should have successful conversations
        stores.forEach((store, index) => {
          expect(store.current.conversationHistory.length).toBe(2)
          
          const userMsg = store.current.conversationHistory[0]
          expect(userMsg.content).toBe(`동시 대화 테스트 - 스토어 ${index}`)
          
          const aiMsg = store.current.conversationHistory[1]
          expect(aiMsg.content).toBeDefined()
          expect(aiMsg.emotion).toBeDefined()
        })
      })

      it('Then it should maintain quality under stress conditions', async () => {
        const { result } = renderHook(() => useStore())
        
        // When: Create stress conditions with many operations
        const stressOperations = []
        
        // Mix of different operations to stress test the system
        for (let i = 0; i < 20; i++) {
          if (i % 4 === 0) {
            stressOperations.push(() => 
              result.current.sendMessage(`스트레스 테스트 메시지 ${i}`)
            )
          } else if (i % 4 === 1) {
            stressOperations.push(() =>
              result.current.updateGameState({ experience: i * 10 })
            )
          } else if (i % 4 === 2) {
            stressOperations.push(() =>
              result.current.updateCompanion({
                currentEmotion: {
                  dominant: i % 2 === 0 ? 'happy' : 'curious',
                  intensity: 0.5 + (i % 5) * 0.1,
                  stability: 0.8
                }
              })
            )
          } else {
            stressOperations.push(() =>
              result.current.updateSettings({ 
                darkMode: i % 2 === 0,
                soundEnabled: i % 3 === 0
              })
            )
          }
        }
        
        const startTime = performance.now()
        
        // Execute stress operations
        for (const operation of stressOperations) {
          await act(async () => operation())
        }
        
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        }, { timeout: 30000 })
        
        const endTime = performance.now()
        const totalTime = endTime - startTime
        
        // Then: System should remain stable and responsive
        expect(totalTime).toBeLessThan(25000) // Complete within 25 seconds
        
        // State should be consistent after stress test
        expect(result.current.gameState!.experience).toBe(190) // Last update was i=19, 19*10=190
        expect(result.current.companion!.currentEmotion.intensity).toBeCloseTo(0.9) // i=19, 0.5 + (19%5)*0.1 = 0.9
        expect(result.current.settings!.darkMode).toBe(false) // i=19, 19%2 = 1, so false
        expect(result.current.settings!.soundEnabled).toBe(true) // i=19, 19%3 = 1, so true
        
        // Conversation messages should be processed
        const userMessages = result.current.conversationHistory.filter(msg => msg.sender === 'user')
        expect(userMessages.length).toBe(5) // Messages for i=0,4,8,12,16
      })
    })
  })

  describe('Given memory and resource constraints', () => {
    describe('When monitoring resource usage over time', () => {
      it('Then it should not exhibit memory leaks during extended usage', async () => {
        const { result } = renderHook(() => useStore())
        
        const initialMemory = process.memoryUsage().heapUsed
        const memorySnapshots: number[] = []
        
        // When: Simulate extended usage with periodic memory monitoring
        for (let cycle = 0; cycle < 10; cycle++) {
          // Each cycle: conversation + state updates
          await act(async () => {
            await result.current.sendMessage(`메모리 테스트 사이클 ${cycle}`)
          })
          
          await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
          }, { timeout: 5000 })
          
          act(() => {
            result.current.updateGameState({ experience: cycle * 50 })
            result.current.updateCompanion({
              currentEmotion: {
                dominant: 'happy',
                intensity: 0.7,
                stability: 0.8
              }
            })
          })
          
          // Take memory snapshot
          if (global.gc) global.gc() // Force garbage collection if available
          memorySnapshots.push(process.memoryUsage().heapUsed)
        }
        
        const finalMemory = process.memoryUsage().heapUsed
        const totalMemoryGrowth = finalMemory - initialMemory
        
        // Then: Memory usage should be bounded
        expect(totalMemoryGrowth).toBeLessThan(50 * 1024 * 1024) // Less than 50MB growth
        
        // Memory growth should stabilize (not continuously increase)
        const lastThreeSnapshots = memorySnapshots.slice(-3)
        const memoryGrowthRate = (lastThreeSnapshots[2] - lastThreeSnapshots[0]) / 2
        expect(memoryGrowthRate).toBeLessThan(10 * 1024 * 1024) // Growth rate < 10MB per cycle
      })

      it('Then it should efficiently manage conversation history size', async () => {
        const { result } = renderHook(() => useStore())
        
        // When: Build up very long conversation history
        for (let i = 0; i < 100; i++) {
          await act(async () => {
            await result.current.sendMessage(`히스토리 테스트 ${i}`)
          })
          
          await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
          }, { timeout: 3000 })
        }
        
        // Then: History should be managed efficiently
        const history = result.current.conversationHistory
        expect(history.length).toBe(200) // 100 user + 100 AI messages
        
        // But companion context should be limited for performance
        const recentTopics = result.current.companion!.conversationContext.recentTopics
        expect(recentTopics.length).toBeLessThanOrEqual(5)
        
        const moodHistory = result.current.companion!.conversationContext.moodHistory
        expect(moodHistory.length).toBeLessThanOrEqual(10)
        
        // Recent topics should contain the most recent conversations
        const shouldContainRecent = recentTopics.some(topic => 
          topic.includes('히스토리 테스트 99') || 
          topic.includes('히스토리 테스트 98') ||
          topic.includes('히스토리 테스트 97')
        )
        expect(shouldContainRecent).toBe(true)
      })
    })
  })

  describe('Given performance benchmarking scenarios', () => {
    describe('When measuring core operation performance', () => {
      it('Then it should meet response time SLA requirements', async () => {
        const { result } = renderHook(() => useStore())
        
        const benchmarkScenarios = [
          { name: 'short_message', message: '안녕!', maxTime: 2000 },
          { name: 'medium_message', message: '오늘 날씨가 정말 좋네요. 같이 밖에 나가서 산책할까요?', maxTime: 3000 },
          { name: 'long_message', message: '오늘은 정말 많은 일이 있었어요. '.repeat(20), maxTime: 4000 }
        ]
        
        const performanceResults: Record<string, number> = {}
        
        // When: Benchmark different message scenarios
        for (const scenario of benchmarkScenarios) {
          const startTime = performance.now()
          
          await act(async () => {
            await result.current.sendMessage(scenario.message)
          })
          
          await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
          }, { timeout: 10000 })
          
          const endTime = performance.now()
          const responseTime = endTime - startTime
          
          performanceResults[scenario.name] = responseTime
          
          // Then: Should meet SLA requirements
          expect(responseTime).toBeLessThan(scenario.maxTime)
        }
        
        // Overall performance should be acceptable
        const avgResponseTime = Object.values(performanceResults).reduce((a, b) => a + b, 0) / benchmarkScenarios.length
        expect(avgResponseTime).toBeLessThan(3000) // Average under 3 seconds
        
        console.log('Performance Benchmark Results:', performanceResults)
      })

      it('Then it should maintain performance consistency across multiple runs', async () => {
        const { result } = renderHook(() => useStore())
        
        const testMessage = '성능 일관성 테스트 메시지입니다.'
        const responseTimes: number[] = []
        const runCount = 10
        
        // When: Run same operation multiple times
        for (let run = 0; run < runCount; run++) {
          // Clear conversation for clean test
          act(() => {
            result.current.clearConversation()
          })
          
          const startTime = performance.now()
          
          await act(async () => {
            await result.current.sendMessage(testMessage)
          })
          
          await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
          }, { timeout: 5000 })
          
          const endTime = performance.now()
          responseTimes.push(endTime - startTime)
        }
        
        // Then: Performance should be consistent
        const avgTime = responseTimes.reduce((a, b) => a + b, 0) / runCount
        const maxTime = Math.max(...responseTimes)
        const minTime = Math.min(...responseTimes)
        
        // Standard deviation should be reasonable
        const variance = responseTimes.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / runCount
        const standardDeviation = Math.sqrt(variance)
        
        expect(standardDeviation).toBeLessThan(1000) // StdDev < 1 second
        expect(maxTime - minTime).toBeLessThan(2000) // Range < 2 seconds
        expect(avgTime).toBeLessThan(3000) // Average < 3 seconds
      })
    })
  })
})