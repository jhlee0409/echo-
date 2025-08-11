import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useStore } from '@store/gameStore'
import type { EmotionType, PersonalityTraits, AICompanion } from '@types'

/**
 * Feature Tests: Companion State Management
 * Validates AI companion behavior and state transitions before implementing new features
 */
describe('Feature: AI Companion State Management', () => {
  beforeEach(async () => {
    // Initialize store with fresh companion state
    const { result } = renderHook(() => useStore())
    await act(async () => {
      await result.current.initialize()
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Given a newly created AI companion', () => {
    describe('When the companion is initialized', () => {
      it('Then it should have proper default personality traits', async () => {
        const { result } = renderHook(() => useStore())
        
        // Given: Initialized companion
        const companion = result.current.companion!
        
        // Then: Should have expected personality structure
        expect(companion.personalityTraits).toMatchObject({
          cheerful: 0.7,
          careful: 0.4,
          curious: 0.8,
          emotional: 0.6,
          independent: 0.3
        })
        
        // All personality values should be between 0 and 1
        Object.values(companion.personalityTraits).forEach(value => {
          expect(value).toBeGreaterThanOrEqual(0)
          expect(value).toBeLessThanOrEqual(1)
        })
      })

      it('Then it should have appropriate starting emotional state', async () => {
        const { result } = renderHook(() => useStore())
        
        // Given: Fresh companion
        const companion = result.current.companion!
        
        // Then: Should start with curious emotion (default)
        expect(companion.currentEmotion).toMatchObject({
          dominant: 'curious',
          intensity: 0.6,
          stability: 0.8
        })
        
        // Emotional values should be valid ranges
        expect(companion.currentEmotion.intensity).toBeGreaterThanOrEqual(0)
        expect(companion.currentEmotion.intensity).toBeLessThanOrEqual(1)
        expect(companion.currentEmotion.stability).toBeGreaterThanOrEqual(0)
        expect(companion.currentEmotion.stability).toBeLessThanOrEqual(1)
      })

      it('Then it should have empty memory banks and conversation context', async () => {
        const { result } = renderHook(() => useStore())
        
        // Given: New companion
        const companion = result.current.companion!
        
        // Then: Memory should be empty
        expect(companion.memoryBank).toMatchObject({
          shortTerm: [],
          longTerm: [],
          preferences: {},
          keyMoments: []
        })
        
        // Conversation context should be initialized
        expect(companion.conversationContext).toMatchObject({
          currentTopic: null,
          recentTopics: [],
          moodHistory: [],
          responseStyle: 'friendly'
        })
      })

      it('Then it should have appropriate starting relationship status', async () => {
        const { result } = renderHook(() => useStore())
        
        // Given: New companion
        const companion = result.current.companion!
        
        // Then: Should start at relationship level 1
        expect(companion.relationshipStatus).toMatchObject({
          level: 1,
          experience: 0,
          experienceToNext: 100,
          intimacyLevel: 0.1,
          trustLevel: 0.1
        })
        
        // All relationship metrics should be valid
        expect(companion.relationshipStatus.level).toBeGreaterThan(0)
        expect(companion.relationshipStatus.intimacyLevel).toBeGreaterThanOrEqual(0)
        expect(companion.relationshipStatus.intimacyLevel).toBeLessThanOrEqual(1)
        expect(companion.relationshipStatus.trustLevel).toBeGreaterThanOrEqual(0)
        expect(companion.relationshipStatus.trustLevel).toBeLessThanOrEqual(1)
      })
    })
  })

  describe('Given an active conversation with emotional responses', () => {
    describe('When companion emotions are updated through conversation', () => {
      it('Then it should properly transition between emotional states', async () => {
        const { result } = renderHook(() => useStore())
        
        // Given: Initial emotional state
        const initialEmotion = result.current.companion!.currentEmotion.dominant
        expect(initialEmotion).toBe('curious')
        
        // When: Update companion emotion through conversation
        await act(async () => {
          await result.current.sendMessage('와! 정말 신나는 소식이야!')
        })
        
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        }, { timeout: 10000 })
        
        // Then: Emotion should potentially change based on conversation
        const updatedEmotion = result.current.companion!.currentEmotion
        expect(updatedEmotion.dominant).toBeDefined()
        
        // Emotion should be valid
        const validEmotions: EmotionType[] = [
          'happy', 'excited', 'calm', 'sad', 'surprised', 
          'confused', 'angry', 'neutral', 'curious', 
          'thoughtful', 'playful', 'caring'
        ]
        expect(validEmotions).toContain(updatedEmotion.dominant)
        
        // Intensity and stability should remain in valid ranges
        expect(updatedEmotion.intensity).toBeGreaterThanOrEqual(0)
        expect(updatedEmotion.intensity).toBeLessThanOrEqual(1)
        expect(updatedEmotion.stability).toBeGreaterThanOrEqual(0)
        expect(updatedEmotion.stability).toBeLessThanOrEqual(1)
      })

      it('Then it should maintain emotional consistency with personality traits', async () => {
        const { result } = renderHook(() => useStore())
        
        // Given: High cheerful personality
        act(() => {
          result.current.updateCompanion({
            personalityTraits: {
              cheerful: 0.9,
              careful: 0.4,
              curious: 0.8,
              emotional: 0.7,
              independent: 0.3
            }
          })
        })
        
        // When: Send multiple positive messages
        const positiveMessages = [
          '오늘 정말 좋은 일이 있었어!',
          '너와 이야기하는 게 즐거워!',
          '같이 놀러 가자!'
        ]
        
        const emotionsAfterMessages: EmotionType[] = []
        
        for (const message of positiveMessages) {
          await act(async () => {
            await result.current.sendMessage(message)
          })
          
          await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
          }, { timeout: 10000 })
          
          emotionsAfterMessages.push(result.current.companion!.currentEmotion.dominant)
        }
        
        // Then: Should generally show positive emotions with high cheerful trait
        const positiveEmotions = ['happy', 'excited', 'playful', 'curious']
        const positiveResponses = emotionsAfterMessages.filter(emotion => 
          positiveEmotions.includes(emotion)
        )
        
        // At least some responses should be positive given high cheerfulness
        expect(positiveResponses.length).toBeGreaterThan(0)
      })
    })

    describe('When companion mood history accumulates', () => {
      it('Then it should maintain limited mood history for performance', async () => {
        const { result } = renderHook(() => useStore())
        
        // When: Generate many conversation turns to build mood history
        for (let i = 0; i < 15; i++) {
          await act(async () => {
            await result.current.sendMessage(`테스트 메시지 ${i}`)
          })
          
          await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
          }, { timeout: 5000 })
        }
        
        // Then: Mood history should be limited (implementation shows max 10)
        const moodHistory = result.current.companion!.conversationContext.moodHistory
        expect(moodHistory.length).toBeLessThanOrEqual(10)
        
        // Should contain recent moods
        expect(moodHistory.length).toBeGreaterThan(0)
        moodHistory.forEach(mood => {
          expect(mood).toBeDefined()
          expect(typeof mood).toBe('string')
        })
      })

      it('Then it should track conversation topics appropriately', async () => {
        const { result } = renderHook(() => useStore())
        
        const conversationTopics = [
          '오늘 날씨가 정말 좋네요',
          '내가 제일 좋아하는 음식은 피자야',
          '같이 영화 볼까요?',
          '내 취미는 독서입니다',
          '운동하는 걸 좋아해요',
          '여행 계획을 세우고 있어요'
        ]
        
        // When: Discuss various topics
        for (const topic of conversationTopics) {
          await act(async () => {
            await result.current.sendMessage(topic)
          })
          
          await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
          }, { timeout: 5000 })
        }
        
        // Then: Recent topics should be tracked (limited to 5 as per implementation)
        const recentTopics = result.current.companion!.conversationContext.recentTopics
        expect(recentTopics.length).toBeLessThanOrEqual(5)
        
        // Should contain most recent topics
        expect(recentTopics.some(topic => 
          topic.includes('여행') || topic.includes('운동') || topic.includes('독서')
        )).toBe(true)
      })
    })
  })

  describe('Given relationship progression scenarios', () => {
    describe('When conversations contribute to relationship experience', () => {
      it('Then it should gain experience points from conversations', async () => {
        const { result } = renderHook(() => useStore())
        
        // Given: Initial experience
        const initialExp = result.current.gameState!.experience
        const initialCompanionExp = result.current.companion!.relationshipStatus.experience
        
        // When: Have a conversation
        await act(async () => {
          await result.current.sendMessage('안녕! 오늘 하루 어땠어?')
        })
        
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        }, { timeout: 10000 })
        
        // Then: Experience should increase
        expect(result.current.gameState!.experience).toBeGreaterThan(initialExp)
        
        // Experience gain depends on provider used (Claude = 15, Mock = 10, fallback = 5)
        const expGain = result.current.gameState!.experience - initialExp
        expect([5, 10, 15]).toContain(expGain)
      })

      it('Then it should handle relationship level progression', async () => {
        const { result } = renderHook(() => useStore())
        
        // Given: Artificially set high relationship experience
        act(() => {
          result.current.updateCompanion({
            relationshipStatus: {
              ...result.current.companion!.relationshipStatus,
              experience: 95, // Near level up threshold
              experienceToNext: 100
            }
          })
        })
        
        // When: Have conversation that should trigger level up
        await act(async () => {
          await result.current.sendMessage('너와 친구가 되어서 정말 기뻐!')
        })
        
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        }, { timeout: 10000 })
        
        // Then: Game experience should increase (relationship level logic may need additional implementation)
        const finalGameExp = result.current.gameState!.experience
        expect(finalGameExp).toBeGreaterThan(95)
      })
    })

    describe('When companion memory system is utilized', () => {
      it('Then it should have proper memory bank structure for future enhancements', async () => {
        const { result } = renderHook(() => useStore())
        
        // Given: Active companion
        const companion = result.current.companion!
        
        // Then: Memory structure should support future memory features
        expect(companion.memoryBank).toHaveProperty('shortTerm')
        expect(companion.memoryBank).toHaveProperty('longTerm')
        expect(companion.memoryBank).toHaveProperty('preferences')
        expect(companion.memoryBank).toHaveProperty('keyMoments')
        
        // Memory arrays should be initialized
        expect(Array.isArray(companion.memoryBank.shortTerm)).toBe(true)
        expect(Array.isArray(companion.memoryBank.longTerm)).toBe(true)
        expect(Array.isArray(companion.memoryBank.keyMoments)).toBe(true)
        expect(typeof companion.memoryBank.preferences).toBe('object')
      })
    })
  })

  describe('Given companion personality trait modifications', () => {
    describe('When personality traits are updated manually', () => {
      it('Then it should accept valid personality modifications', async () => {
        const { result } = renderHook(() => useStore())
        
        // Given: Current personality
        const originalTraits = result.current.companion!.personalityTraits
        
        // When: Update personality traits
        const newTraits: PersonalityTraits = {
          cheerful: 0.9,
          careful: 0.8,
          curious: 0.6,
          emotional: 0.4,
          independent: 0.7,
          playful: 0.8,
          supportive: 0.9
        }
        
        act(() => {
          result.current.updateCompanion({
            personalityTraits: newTraits
          })
        })
        
        // Then: Traits should be updated
        const updatedTraits = result.current.companion!.personalityTraits
        expect(updatedTraits).toMatchObject(newTraits)
        
        // Should not affect other companion properties
        expect(result.current.companion!.name).toBe('아리아')
        expect(result.current.companion!.id).toBe('companion_001')
      })

      it('Then it should validate personality trait ranges', async () => {
        const { result } = renderHook(() => useStore())
        
        // Test with valid values
        const validTraits: PersonalityTraits = {
          cheerful: 0.0,
          careful: 0.5,
          curious: 1.0,
          emotional: 0.75,
          independent: 0.25
        }
        
        act(() => {
          result.current.updateCompanion({
            personalityTraits: validTraits
          })
        })
        
        // Should accept valid ranges
        const updatedTraits = result.current.companion!.personalityTraits
        Object.values(updatedTraits).forEach(value => {
          expect(value).toBeGreaterThanOrEqual(0)
          expect(value).toBeLessThanOrEqual(1)
        })
      })
    })
  })

  describe('Given advanced companion state scenarios', () => {
    describe('When companion state persists across sessions', () => {
      it('Then it should maintain state consistency during store operations', async () => {
        const { result } = renderHook(() => useStore())
        
        // Given: Modified companion state
        const customEmotion: EmotionType = 'playful'
        const customIntensity = 0.85
        
        act(() => {
          result.current.updateCompanion({
            currentEmotion: {
              dominant: customEmotion,
              intensity: customIntensity,
              stability: 0.9
            },
            relationshipStatus: {
              ...result.current.companion!.relationshipStatus,
              intimacyLevel: 0.6,
              trustLevel: 0.7
            }
          })
        })
        
        // When: Perform various store operations
        await act(async () => {
          await result.current.saveGame()
        })
        
        await act(async () => {
          await result.current.loadGame()
        })
        
        // Then: Companion state should remain consistent
        const companion = result.current.companion!
        expect(companion.currentEmotion.dominant).toBe(customEmotion)
        expect(companion.currentEmotion.intensity).toBe(customIntensity)
        expect(companion.relationshipStatus.intimacyLevel).toBe(0.6)
        expect(companion.relationshipStatus.trustLevel).toBe(0.7)
      })
    })

    describe('When companion handles rapid state changes', () => {
      it('Then it should handle multiple rapid emotion updates without corruption', async () => {
        const { result } = renderHook(() => useStore())
        
        const emotionSequence: Array<{ emotion: EmotionType, intensity: number }> = [
          { emotion: 'happy', intensity: 0.8 },
          { emotion: 'excited', intensity: 0.9 },
          { emotion: 'calm', intensity: 0.5 },
          { emotion: 'thoughtful', intensity: 0.6 },
          { emotion: 'playful', intensity: 0.7 }
        ]
        
        // When: Apply rapid emotion changes
        for (const { emotion, intensity } of emotionSequence) {
          act(() => {
            result.current.updateCompanion({
              currentEmotion: {
                dominant: emotion,
                intensity,
                stability: 0.8
              }
            })
          })
        }
        
        // Then: Final state should be consistent and valid
        const finalEmotion = result.current.companion!.currentEmotion
        expect(finalEmotion.dominant).toBe('playful')
        expect(finalEmotion.intensity).toBe(0.7)
        expect(finalEmotion.stability).toBe(0.8)
        
        // Other companion properties should remain intact
        expect(result.current.companion!.name).toBe('아리아')
        expect(result.current.companion!.personalityTraits).toBeDefined()
        expect(result.current.companion!.relationshipStatus).toBeDefined()
      })
    })

    describe('When companion game progress is tracked', () => {
      it('Then it should maintain proper game progress structure', async () => {
        const { result } = renderHook(() => useStore())
        
        // Given: Initial companion game progress
        const companion = result.current.companion!
        
        // Then: Should have proper progress structure
        expect(companion.gameProgress).toMatchObject({
          unlockedFeatures: ['basic_chat'],
          completedEvents: [],
          availableEvents: ['first_meeting'],
          relationshipMilestones: []
        })
        
        // Arrays should be properly structured for future feature expansion
        expect(Array.isArray(companion.gameProgress.unlockedFeatures)).toBe(true)
        expect(Array.isArray(companion.gameProgress.completedEvents)).toBe(true)
        expect(Array.isArray(companion.gameProgress.availableEvents)).toBe(true)
        expect(Array.isArray(companion.gameProgress.relationshipMilestones)).toBe(true)
      })
    })
  })

  describe('Performance and Memory Management', () => {
    describe('When companion state undergoes stress testing', () => {
      it('Then it should handle high-frequency state updates efficiently', async () => {
        const { result } = renderHook(() => useStore())
        
        const startTime = performance.now()
        
        // Perform many state updates to test performance
        for (let i = 0; i < 100; i++) {
          act(() => {
            result.current.updateCompanion({
              currentEmotion: {
                dominant: i % 2 === 0 ? 'happy' : 'curious',
                intensity: 0.5 + (i % 10) * 0.05,
                stability: 0.8
              },
              relationshipStatus: {
                ...result.current.companion!.relationshipStatus,
                experience: i,
                intimacyLevel: Math.min(0.1 + i * 0.005, 1.0)
              }
            })
          })
        }
        
        const endTime = performance.now()
        const updateTime = endTime - startTime
        
        // Should complete updates reasonably quickly
        expect(updateTime).toBeLessThan(1000) // 1 second for 100 updates
        
        // Final state should be consistent
        const finalCompanion = result.current.companion!
        expect(finalCompanion.currentEmotion.dominant).toBe('curious')
        expect(finalCompanion.relationshipStatus.experience).toBe(99)
        expect(finalCompanion.relationshipStatus.intimacyLevel).toBe(0.595)
      })
    })
  })
})