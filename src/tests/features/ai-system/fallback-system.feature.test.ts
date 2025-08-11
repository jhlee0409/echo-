import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useStore } from '@store/gameStore'
import { getAIManager } from '@services/ai'
import type { AIManager } from '@services/ai/AIManager'
import type { AIRequest, AIResponse } from '@services/ai/types'

/**
 * Feature Tests: AI System Fallback Mechanisms
 * Validates AI provider fallback behavior before implementing new features
 */
describe('Feature: AI System Fallback Mechanisms', () => {
  let originalAIManager: AIManager

  beforeEach(async () => {
    // Store original AI manager
    originalAIManager = getAIManager()
    
    // Initialize store
    const { result } = renderHook(() => useStore())
    await act(async () => {
      await result.current.initialize()
    })
    
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Given Claude API is unavailable', () => {
    describe('When the primary AI service fails', () => {
      it('Then it should automatically fallback to Mock provider', async () => {
        // Given: Mock AI Manager to simulate Claude API failure
        const mockAIManager = {
          generateResponse: vi.fn().mockImplementation(async (request: AIRequest) => {
            // Simulate Claude API failure, fallback to mock
            throw new Error('Claude API unavailable')
          }),
          isHealthy: vi.fn().mockResolvedValue(false),
          getHealthStatus: vi.fn().mockResolvedValue({ claude: false, mock: true }),
          shutdown: vi.fn().mockResolvedValue(undefined)
        } as unknown as AIManager

        vi.doMock('@services/ai', () => ({
          getAIManager: () => mockAIManager
        }))

        const { result } = renderHook(() => useStore())
        
        // When: Send message that would normally use Claude API
        await act(async () => {
          await result.current.sendMessage('안녕하세요!')
        })

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        }, { timeout: 10000 })

        // Then: Should fallback to Mock provider response
        const history = result.current.conversationHistory
        expect(history).toHaveLength(2) // User message + AI fallback response

        const aiResponse = history[1]
        expect(aiResponse.sender).toBe('ai')
        expect(aiResponse.content).toMatch(/[가-힣]/) // Korean response
        expect(aiResponse.emotion).toBeDefined()

        // Error should be temporarily shown
        expect(result.current.error).toContain('Mock 응답으로 대체됨')
      })

      it('Then it should provide meaningful error feedback to user', async () => {
        const { result } = renderHook(() => useStore())
        
        // Given: Mock failing AI service
        const failingAIManager = {
          generateResponse: vi.fn().mockRejectedValue(new Error('Network timeout')),
          isHealthy: vi.fn().mockResolvedValue(false),
          shutdown: vi.fn().mockResolvedValue(undefined)
        } as unknown as AIManager

        vi.doMock('@services/ai', () => ({
          getAIManager: () => failingAIManager
        }))

        // When: Attempt conversation with failing service
        await act(async () => {
          await result.current.sendMessage('테스트 메시지')
        })

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        }, { timeout: 10000 })

        // Then: Should show appropriate error message
        expect(result.current.error).toBeDefined()
        expect(result.current.error).toContain('Mock 응답으로 대체됨')
        
        // But conversation should still work via fallback
        const history = result.current.conversationHistory
        expect(history.length).toBeGreaterThanOrEqual(2)
        
        const aiResponse = history[history.length - 1]
        expect(aiResponse.content).toBeDefined()
        expect(aiResponse.content.length).toBeGreaterThan(0)
      })

      it('Then it should clear error state after timeout', async () => {
        const { result } = renderHook(() => useStore())
        
        // Given: Mock failing service
        const mockFailingManager = {
          generateResponse: vi.fn().mockRejectedValue(new Error('Service down')),
          isHealthy: vi.fn().mockResolvedValue(false),
          shutdown: vi.fn().mockResolvedValue(undefined)
        } as unknown as AIManager

        vi.doMock('@services/ai', () => ({
          getAIManager: () => mockFailingManager
        }))

        // When: Send message with failing service
        await act(async () => {
          await result.current.sendMessage('테스트')
        })

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        }, { timeout: 10000 })

        // Error should be set initially
        expect(result.current.error).toBeDefined()

        // Then: Error should clear after timeout (3 seconds as per implementation)
        await waitFor(() => {
          expect(result.current.error).toBeNull()
        }, { timeout: 5000 })
      })
    })

    describe('When API key is missing or invalid', () => {
      it('Then it should gracefully handle missing API key scenario', async () => {
        // Given: Mock environment without API key
        vi.doMock('@config/env', () => ({
          ENV: {
            ...vi.importActual('@config/env').ENV,
            CLAUDE_API_KEY: '', // Missing API key
          }
        }))

        const { result } = renderHook(() => useStore())

        // When: Initialize game without valid API key
        await act(async () => {
          await result.current.initialize()
        })

        await waitFor(() => {
          expect(result.current.isInitialized).toBe(true)
        }, { timeout: 10000 })

        // Then: Should still initialize successfully
        expect(result.current.error).toBeNull()

        // When: Send message
        await act(async () => {
          await result.current.sendMessage('안녕하세요!')
        })

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        }, { timeout: 10000 })

        // Then: Should work with fallback provider
        const history = result.current.conversationHistory
        expect(history.length).toBeGreaterThanOrEqual(2)
        
        const aiResponse = history[history.length - 1]
        expect(aiResponse.content).toMatch(/[가-힣]/)
      })

      it('Then it should handle malformed API key gracefully', async () => {
        // Given: Mock environment with invalid API key format
        vi.doMock('@config/env', () => ({
          ENV: {
            ...vi.importActual('@config/env').ENV,
            CLAUDE_API_KEY: 'invalid-key-format', // Malformed key
          }
        }))

        const { result } = renderHook(() => useStore())

        // When: Try to use system with invalid key
        await act(async () => {
          await result.current.sendMessage('테스트 메시지')
        })

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        }, { timeout: 10000 })

        // Then: Should fallback without crashing
        expect(result.current.conversationHistory.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Given intermittent network connectivity issues', () => {
    describe('When network requests timeout or fail sporadically', () => {
      it('Then it should retry failed requests appropriately', async () => {
        let callCount = 0
        const mockRetryingManager = {
          generateResponse: vi.fn().mockImplementation(async () => {
            callCount++
            if (callCount <= 2) {
              throw new Error('Network timeout')
            }
            // Succeed on 3rd try
            return {
              content: '네트워크 재시도 후 성공한 응답입니다.',
              emotion: 'happy',
              confidence: 0.8,
              tokensUsed: 45,
              provider: 'claude',
              processingTime: 1500,
              cached: false
            } as AIResponse
          }),
          isHealthy: vi.fn().mockResolvedValue(true),
          shutdown: vi.fn().mockResolvedValue(undefined)
        } as unknown as AIManager

        vi.doMock('@services/ai', () => ({
          getAIManager: () => mockRetryingManager
        }))

        const { result } = renderHook(() => useStore())

        // When: Send message with intermittent network issues
        await act(async () => {
          await result.current.sendMessage('네트워크 테스트')
        })

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        }, { timeout: 15000 })

        // Then: Should eventually succeed after retries
        const history = result.current.conversationHistory
        const aiResponse = history[history.length - 1]
        
        expect(aiResponse.content).toContain('재시도 후 성공')
        expect(callCount).toBeGreaterThan(1) // Should have retried
      })
    })

    describe('When partial service degradation occurs', () => {
      it('Then it should handle mixed success/failure scenarios', async () => {
        let isServiceHealthy = true
        
        const mockDegradedManager = {
          generateResponse: vi.fn().mockImplementation(async () => {
            if (isServiceHealthy) {
              return {
                content: 'Claude API 정상 응답입니다.',
                emotion: 'happy',
                confidence: 0.9,
                tokensUsed: 50,
                provider: 'claude',
                processingTime: 800,
                cached: false
              } as AIResponse
            } else {
              throw new Error('Service temporarily degraded')
            }
          }),
          isHealthy: vi.fn().mockResolvedValue(true),
          shutdown: vi.fn().mockResolvedValue(undefined)
        } as unknown as AIManager

        vi.doMock('@services/ai', () => ({
          getAIManager: () => mockDegradedManager
        }))

        const { result } = renderHook(() => useStore())

        // When: First message succeeds
        await act(async () => {
          await result.current.sendMessage('첫 번째 메시지')
        })

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        }, { timeout: 10000 })

        let history = result.current.conversationHistory
        expect(history[history.length - 1].content).toContain('Claude API 정상')

        // Simulate service degradation
        isServiceHealthy = false

        // When: Second message fails and falls back
        await act(async () => {
          await result.current.sendMessage('두 번째 메시지')
        })

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        }, { timeout: 10000 })

        // Then: Should fallback for second message
        history = result.current.conversationHistory
        expect(history.length).toBeGreaterThanOrEqual(4) // 2 user + 2 AI responses
        expect(result.current.error).toContain('Mock 응답으로 대체됨')
      })
    })
  })

  describe('Given AI response quality issues', () => {
    describe('When AI responses have low confidence or are inappropriate', () => {
      it('Then it should handle low-confidence responses appropriately', async () => {
        const mockLowConfidenceManager = {
          generateResponse: vi.fn().mockResolvedValue({
            content: '죄송합니다. 잘 이해하지 못했어요.',
            emotion: 'confused',
            confidence: 0.2, // Very low confidence
            tokensUsed: 30,
            provider: 'claude',
            processingTime: 1200,
            cached: false
          } as AIResponse),
          isHealthy: vi.fn().mockResolvedValue(true),
          shutdown: vi.fn().mockResolvedValue(undefined)
        } as unknown as AIManager

        vi.doMock('@services/ai', () => ({
          getAIManager: () => mockLowConfidenceManager
        }))

        const { result } = renderHook(() => useStore())

        // When: Receive low-confidence response
        await act(async () => {
          await result.current.sendMessage('복잡한 질문입니다')
        })

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        }, { timeout: 10000 })

        // Then: Should still provide response but may not cache it
        const history = result.current.conversationHistory
        const aiResponse = history[history.length - 1]
        
        expect(aiResponse.content).toBeDefined()
        expect(aiResponse.emotion).toBe('confused')
        // Low confidence responses aren't cached (confidence < 0.7 threshold)
      })

      it('Then it should validate response appropriateness', async () => {
        const mockInappropriateManager = {
          generateResponse: vi.fn().mockResolvedValue({
            content: '', // Empty response
            emotion: 'neutral',
            confidence: 0.5,
            tokensUsed: 0,
            provider: 'claude',
            processingTime: 500,
            cached: false
          } as AIResponse),
          isHealthy: vi.fn().mockResolvedValue(true),
          shutdown: vi.fn().mockResolvedValue(undefined)
        } as unknown as AIManager

        vi.doMock('@services/ai', () => ({
          getAIManager: () => mockInappropriateManager
        }))

        const { result } = renderHook(() => useStore())

        // When: Receive empty or inappropriate response
        await act(async () => {
          await result.current.sendMessage('일반적인 질문')
        })

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        }, { timeout: 10000 })

        // Then: Should handle gracefully (implementation may provide fallback)
        const history = result.current.conversationHistory
        expect(history.length).toBeGreaterThanOrEqual(2)
        
        // System should not crash
        expect(result.current.error).not.toContain('crash')
      })
    })
  })

  describe('Given multiple concurrent failure scenarios', () => {
    describe('When system handles concurrent fallback situations', () => {
      it('Then it should manage multiple simultaneous fallbacks', async () => {
        const mockConcurrentFailManager = {
          generateResponse: vi.fn().mockImplementation(async () => {
            // Simulate random failures
            if (Math.random() < 0.7) {
              throw new Error('Random service failure')
            }
            return {
              content: '간헐적 성공 응답',
              emotion: 'happy',
              confidence: 0.8,
              tokensUsed: 40,
              provider: 'claude',
              processingTime: 1000,
              cached: false
            } as AIResponse
          }),
          isHealthy: vi.fn().mockResolvedValue(true),
          shutdown: vi.fn().mockResolvedValue(undefined)
        } as unknown as AIManager

        vi.doMock('@services/ai', () => ({
          getAIManager: () => mockConcurrentFailManager
        }))

        const { result } = renderHook(() => useStore())

        // When: Send multiple messages concurrently
        const messages = ['메시지 1', '메시지 2', '메시지 3', '메시지 4', '메시지 5']
        
        for (const message of messages) {
          await act(async () => {
            await result.current.sendMessage(message)
          })
          
          await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
          }, { timeout: 10000 })
        }

        // Then: All messages should receive responses (either from Claude or fallback)
        const history = result.current.conversationHistory
        expect(history.length).toBe(messages.length * 2) // Each message + response

        // Verify all AI responses exist
        const aiResponses = history.filter(msg => msg.sender === 'ai')
        expect(aiResponses).toHaveLength(messages.length)
        
        aiResponses.forEach(response => {
          expect(response.content).toBeDefined()
          expect(response.content.length).toBeGreaterThan(0)
          expect(response.emotion).toBeDefined()
        })
      })
    })
  })

  describe('Given recovery scenarios', () => {
    describe('When AI service recovers after failure', () => {
      it('Then it should seamlessly resume normal operation', async () => {
        let serviceIsDown = true
        
        const mockRecoveringManager = {
          generateResponse: vi.fn().mockImplementation(async () => {
            if (serviceIsDown) {
              throw new Error('Service temporarily down')
            }
            return {
              content: '서비스가 정상 복구되었습니다.',
              emotion: 'happy',
              confidence: 0.9,
              tokensUsed: 55,
              provider: 'claude',
              processingTime: 900,
              cached: false
            } as AIResponse
          }),
          isHealthy: vi.fn().mockImplementation(() => Promise.resolve(!serviceIsDown)),
          shutdown: vi.fn().mockResolvedValue(undefined)
        } as unknown as AIManager

        vi.doMock('@services/ai', () => ({
          getAIManager: () => mockRecoveringManager
        }))

        const { result } = renderHook(() => useStore())

        // When: Service is down - should fallback
        await act(async () => {
          await result.current.sendMessage('서비스 다운 상태 테스트')
        })

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        }, { timeout: 10000 })

        // Should have used fallback
        let history = result.current.conversationHistory
        expect(result.current.error).toContain('Mock 응답으로 대체됨')

        // Service recovers
        serviceIsDown = false

        // When: Service is back up
        await act(async () => {
          await result.current.sendMessage('서비스 복구 테스트')
        })

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        }, { timeout: 10000 })

        // Then: Should use recovered service
        history = result.current.conversationHistory
        const lastResponse = history[history.length - 1]
        expect(lastResponse.content).toContain('정상 복구')
      })
    })
  })

  describe('Performance and Reliability under Fallback Conditions', () => {
    describe('When fallback system is under stress', () => {
      it('Then it should maintain acceptable performance during fallback operations', async () => {
        const mockFallbackManager = {
          generateResponse: vi.fn().mockImplementation(async () => {
            // Always fail to force fallback usage
            throw new Error('Force fallback')
          }),
          isHealthy: vi.fn().mockResolvedValue(false),
          shutdown: vi.fn().mockResolvedValue(undefined)
        } as unknown as AIManager

        vi.doMock('@services/ai', () => ({
          getAIManager: () => mockFallbackManager
        }))

        const { result } = renderHook(() => useStore())

        // When: Send multiple messages forcing fallback
        const startTime = performance.now()
        
        for (let i = 0; i < 5; i++) {
          await act(async () => {
            await result.current.sendMessage(`Fallback 테스트 ${i}`)
          })
          
          await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
          }, { timeout: 5000 })
        }
        
        const endTime = performance.now()
        const totalTime = endTime - startTime

        // Then: Fallback should be reasonably fast
        expect(totalTime).toBeLessThan(10000) // 10 seconds for 5 fallback messages
        
        // All messages should have responses
        const history = result.current.conversationHistory
        expect(history.length).toBe(10) // 5 user + 5 AI responses
        
        const aiResponses = history.filter(msg => msg.sender === 'ai')
        aiResponses.forEach(response => {
          expect(response.content).toMatch(/[가-힣]/)
          expect(response.emotion).toBeDefined()
        })
      })
    })
  })
})