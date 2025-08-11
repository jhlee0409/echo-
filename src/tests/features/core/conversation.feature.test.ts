import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useStore } from '@store/gameStore'
import type { Message, EmotionType } from '@types'

/**
 * Feature Tests: Conversation System
 * Validates AI conversation functionality before implementing new features
 */
describe('Feature: AI Conversation System', () => {
  beforeEach(async () => {
    // Initialize store for each test
    const { result } = renderHook(() => useStore())
    await act(async () => {
      await result.current.initialize()
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Given an initialized conversation system', () => {
    describe('When a user sends their first message', () => {
      it('Then it should create a complete conversation flow', async () => {
        const { result } = renderHook(() => useStore())
        
        // Given: Empty conversation history
        expect(result.current.conversationHistory).toEqual([])
        expect(result.current.isLoading).toBe(false)
        
        // When: User sends a message
        const userMessage = '안녕하세요! 처음 뵙겠습니다.'
        await act(async () => {
          await result.current.sendMessage(userMessage)
        })
        
        // Then: Conversation should be established
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        }, { timeout: 10000 })
        
        const history = result.current.conversationHistory
        expect(history).toHaveLength(2) // User message + AI response
        
        // Verify user message structure
        const userMsg = history[0]
        expect(userMsg).toMatchObject({
          id: expect.stringMatching(/msg_\d+_user/),
          sender: 'user',
          content: userMessage,
          timestamp: expect.any(Number)
        })
        
        // Verify AI response structure
        const aiMsg = history[1]
        expect(aiMsg).toMatchObject({
          id: expect.stringMatching(/msg_\d+_ai/),
          sender: 'ai',
          content: expect.any(String),
          timestamp: expect.any(Number),
          emotion: expect.any(String)
        })
        
        // AI response should be in Korean
        expect(aiMsg.content).toMatch(/[가-힣]/)
        expect(aiMsg.content.length).toBeGreaterThan(0)
        expect(aiMsg.content.length).toBeLessThan(500)
      })

      it('Then it should update companion state based on conversation', async () => {
        const { result } = renderHook(() => useStore())
        
        // Given: Initial companion state
        const initialEmotion = result.current.companion!.currentEmotion.dominant
        const initialConversationCount = result.current.gameState!.conversationCount
        const initialExperience = result.current.gameState!.experience
        
        // When: User sends a positive message
        await act(async () => {
          await result.current.sendMessage('안녕! 오늘 정말 좋은 날이야!')
        })
        
        // Then: Companion and game state should be updated
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        }, { timeout: 10000 })
        
        // Conversation count should increase
        expect(result.current.gameState!.conversationCount).toBe(initialConversationCount + 1)
        
        // Experience should increase
        expect(result.current.gameState!.experience).toBeGreaterThan(initialExperience)
        
        // Recent topics should be updated
        const recentTopics = result.current.companion!.conversationContext.recentTopics
        expect(recentTopics).toContain('안녕! 오늘 정말 좋은 날이야!')
        
        // Mood history should be updated
        const moodHistory = result.current.companion!.conversationContext.moodHistory
        expect(moodHistory.length).toBeGreaterThan(0)
        expect(moodHistory[moodHistory.length - 1]).toBeDefined()
      })
    })

    describe('When conducting a multi-turn conversation', () => {
      it('Then it should maintain conversation context across turns', async () => {
        const { result } = renderHook(() => useStore())
        
        const conversationFlow = [
          '내 이름은 테스터야',
          '나는 게임 개발을 좋아해',
          '내 취미가 뭐였지?'
        ]
        
        // Given: Empty conversation
        expect(result.current.conversationHistory).toEqual([])
        
        // When: Conduct multi-turn conversation
        for (const message of conversationFlow) {
          await act(async () => {
            await result.current.sendMessage(message)
          })
          
          await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
          }, { timeout: 10000 })
        }
        
        // Then: Context should be maintained
        const history = result.current.conversationHistory
        expect(history).toHaveLength(6) // 3 user messages + 3 AI responses
        
        // Recent topics should accumulate (limited to last 5)
        const recentTopics = result.current.companion!.conversationContext.recentTopics
        expect(recentTopics).toContain('내 이름은 테스터야')
        expect(recentTopics).toContain('나는 게임 개발을 좋아해')
        expect(recentTopics).toContain('내 취미가 뭐였지?')
        
        // Final AI response might reference previous context
        const lastAIResponse = history[history.length - 1]
        // This is probabilistic, so we just verify structure
        expect(lastAIResponse.content).toBeDefined()
        expect(lastAIResponse.content.length).toBeGreaterThan(0)
      })

      it('Then it should limit conversation history to prevent memory issues', async () => {
        const { result } = renderHook(() => useStore())
        
        // When: Send many messages to test limits
        for (let i = 0; i < 10; i++) {
          await act(async () => {
            await result.current.sendMessage(`테스트 메시지 ${i}`)
          })
          
          await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
          }, { timeout: 5000 })
        }
        
        // Then: Recent topics should be limited (last 5 as per implementation)
        const recentTopics = result.current.companion!.conversationContext.recentTopics
        expect(recentTopics.length).toBeLessThanOrEqual(5)
        
        // Should contain more recent messages
        expect(recentTopics.some(topic => topic.includes('테스트 메시지 9'))).toBe(true)
        
        // Mood history should also be limited (last 10 as per implementation)
        const moodHistory = result.current.companion!.conversationContext.moodHistory
        expect(moodHistory.length).toBeLessThanOrEqual(10)
      })
    })

    describe('When conversation context influences responses', () => {
      it('Then it should adapt responses based on relationship level', async () => {
        const { result } = renderHook(() => useStore())
        
        // Given: Different relationship levels
        const testScenarios = [
          { level: 1, intimacy: 0.1, message: '보고 싶었어' },
          { level: 5, intimacy: 0.8, message: '보고 싶었어' }
        ]
        
        const responses: string[] = []
        
        for (const scenario of testScenarios) {
          // Set up relationship level
          act(() => {
            result.current.updateCompanion({
              relationshipStatus: {
                ...result.current.companion!.relationshipStatus,
                level: scenario.level,
                intimacyLevel: scenario.intimacy
              }
            })
          })
          
          // Clear previous conversation
          act(() => {
            result.current.clearConversation()
          })
          
          // When: Send message with different relationship contexts
          await act(async () => {
            await result.current.sendMessage(scenario.message)
          })
          
          await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
          }, { timeout: 10000 })
          
          // Collect AI response
          const history = result.current.conversationHistory
          const aiResponse = history[history.length - 1]
          responses.push(aiResponse.content)
        }
        
        // Then: Responses should be contextually different
        expect(responses[0]).not.toBe(responses[1])
        expect(responses).toHaveLength(2)
        responses.forEach(response => {
          expect(response).toMatch(/[가-힣]/) // Korean text
          expect(response.length).toBeGreaterThan(0)
        })
      })

      it('Then it should consider companion emotion in response generation', async () => {
        const { result } = renderHook(() => useStore())
        
        const emotionalStates: EmotionType[] = ['happy', 'sad', 'curious', 'playful']
        const responses: Array<{ emotion: EmotionType, response: string }> = []
        
        for (const emotion of emotionalStates) {
          // Given: Set companion to specific emotional state
          act(() => {
            result.current.updateCompanion({
              currentEmotion: {
                dominant: emotion,
                intensity: 0.7,
                stability: 0.8
              }
            })
          })
          
          // Clear conversation for clean test
          act(() => {
            result.current.clearConversation()
          })
          
          // When: Send neutral message
          await act(async () => {
            await result.current.sendMessage('오늘 뭐하고 있었어?')
          })
          
          await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
          }, { timeout: 10000 })
          
          // Then: Response should be influenced by emotional state
          const history = result.current.conversationHistory
          const aiResponse = history[history.length - 1]
          
          responses.push({
            emotion,
            response: aiResponse.content
          })
        }
        
        // Verify we got different responses for different emotional states
        const uniqueResponses = new Set(responses.map(r => r.response))
        expect(uniqueResponses.size).toBeGreaterThan(1) // Should have variation
        
        // All responses should be valid Korean text
        responses.forEach(({ response }) => {
          expect(response).toMatch(/[가-힣]/)
          expect(response.length).toBeGreaterThan(0)
          expect(response.length).toBeLessThan(500)
        })
      })
    })

    describe('When handling conversation errors', () => {
      it('Then it should gracefully handle AI service failures', async () => {
        // Given: Mock AI Manager to fail
        const mockGetAIManager = vi.fn().mockImplementation(() => ({
          generateResponse: vi.fn().mockRejectedValue(new Error('AI service unavailable'))
        }))
        
        vi.doMock('@services/ai', () => ({
          getAIManager: mockGetAIManager
        }))
        
        const { result } = renderHook(() => useStore())
        
        // When: Attempt to send message with failing AI service
        await act(async () => {
          await result.current.sendMessage('테스트 메시지')
        })
        
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        }, { timeout: 10000 })
        
        // Then: Should fallback gracefully
        const history = result.current.conversationHistory
        expect(history).toHaveLength(2) // User message + fallback response
        
        const aiResponse = history[1]
        expect(aiResponse.content).toBeDefined()
        expect(aiResponse.content).toMatch(/[가-힣]/) // Korean fallback text
        expect(aiResponse.emotion).toBeDefined()
        
        // Error state should be temporarily set then cleared
        expect(result.current.error).toBeDefined()
        expect(result.current.error).toContain('Mock 응답으로 대체됨')
      })

      it('Then it should handle empty or invalid messages appropriately', async () => {
        const { result } = renderHook(() => useStore())
        
        const invalidMessages = ['', '   ', '\n\t  ']
        
        for (const invalidMessage of invalidMessages) {
          const initialHistoryLength = result.current.conversationHistory.length
          
          // When: Send invalid message
          await act(async () => {
            await result.current.sendMessage(invalidMessage)
          })
          
          // Then: Should either handle gracefully or provide appropriate response
          // Implementation might choose to ignore empty messages or provide feedback
          const finalHistoryLength = result.current.conversationHistory.length
          
          // Should not crash the application
          expect(result.current.error).not.toContain('crash')
          expect(result.current.isLoading).toBe(false)
        }
      })
    })

    describe('When managing conversation performance', () => {
      it('Then it should complete conversations within acceptable time limits', async () => {
        const { result } = renderHook(() => useStore())
        
        const performanceTests = [
          '짧은 메시지',
          '조금 더 긴 메시지입니다. 이 메시지는 일반적인 사용자 입력의 길이를 시뮬레이션합니다.',
          '매우 긴 메시지입니다. '.repeat(20) // Very long message
        ]
        
        for (const message of performanceTests) {
          const startTime = Date.now()
          
          // When: Send message and measure response time
          await act(async () => {
            await result.current.sendMessage(message)
          })
          
          await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
          }, { timeout: 10000 })
          
          const endTime = Date.now()
          const responseTime = endTime - startTime
          
          // Then: Response should be within acceptable limits
          expect(responseTime).toBeLessThan(10000) // 10 seconds max for tests
          
          // Verify response quality wasn't compromised
          const history = result.current.conversationHistory
          const aiResponse = history[history.length - 1]
          expect(aiResponse.content).toMatch(/[가-힣]/)
          expect(aiResponse.emotion).toBeDefined()
        }
      })
    })

    describe('When clearing conversation history', () => {
      it('Then it should properly reset conversation state', async () => {
        const { result } = renderHook(() => useStore())
        
        // Given: Active conversation with history
        await act(async () => {
          await result.current.sendMessage('첫 번째 메시지')
        })
        
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        }, { timeout: 10000 })
        
        await act(async () => {
          await result.current.sendMessage('두 번째 메시지')
        })
        
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        }, { timeout: 10000 })
        
        // Verify conversation exists
        expect(result.current.conversationHistory.length).toBeGreaterThan(0)
        
        // When: Clear conversation
        act(() => {
          result.current.clearConversation()
        })
        
        // Then: History should be empty
        expect(result.current.conversationHistory).toEqual([])
        expect(result.current.isLoading).toBe(false)
        expect(result.current.error).toBeNull()
      })
    })
  })

  describe('Given concurrent conversation scenarios', () => {
    describe('When multiple messages are sent rapidly', () => {
      it('Then it should handle message queuing appropriately', async () => {
        const { result } = renderHook(() => useStore())
        
        // When: Send multiple messages quickly
        const messages = ['메시지 1', '메시지 2', '메시지 3']
        const sendPromises = messages.map(msg => 
          act(async () => {
            await result.current.sendMessage(msg)
          })
        )
        
        // Wait for all to complete
        await Promise.all(sendPromises)
        
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        }, { timeout: 15000 })
        
        // Then: All messages should be processed
        const history = result.current.conversationHistory
        expect(history.length).toBeGreaterThanOrEqual(messages.length) // At least user messages
        
        // Verify message order and content
        const userMessages = history.filter(msg => msg.sender === 'user')
        expect(userMessages).toHaveLength(messages.length)
        
        userMessages.forEach((msg, index) => {
          expect(msg.content).toBe(messages[index])
        })
      })
    })
  })
})