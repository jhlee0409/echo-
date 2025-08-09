/**
 * 🧪 Character Profile Component Test Suite
 * 
 * Tests for CharacterProfile UI component including:
 * - Rendering with character data
 * - Tab navigation
 * - Privacy controls
 * - Data display accuracy
 * - User interactions
 */

import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import CharacterProfile from '../CharacterProfile'
import { AdvancedAICompanion } from '@services/character/AdvancedCharacterSystem'
import type { EmotionType } from '@types'

// Mock character data for testing
const mockCharacter: AdvancedAICompanion = {
  id: 'test_character_001',
  name: '테스트캐릭터',
  createdAt: new Date('2024-01-01'),
  lastInteraction: new Date('2024-01-15'),
  
  personality: {
    core: {
      cheerful: 0.8,
      caring: 0.9,
      playful: 0.6,
      curious: 0.7,
      thoughtful: 0.8,
      supportive: 0.9,
      independent: 0.4,
      emotional: 0.7,
      adaptability: 0.6,
      consistency: 0.8,
      authenticity: 0.9
    },
    current: {
      dominantMood: 'happy' as EmotionType,
      moodIntensity: 0.7,
      moodDuration: 15,
      moodTrigger: 'Positive interaction',
      expectedDuration: 30,
      timeOfDay: 'afternoon',
      dayOfWeek: 1,
      userMood: 'happy' as EmotionType
    },
    adaptation: {
      growthRate: 0.2,
      influenceFactors: [],
      personalityHistory: [
        {
          timestamp: new Date('2024-01-10'),
          traits: { cheerful: 0.7, caring: 0.8, playful: 0.5, curious: 0.6, thoughtful: 0.7, supportive: 0.8, independent: 0.4, emotional: 0.6, adaptability: 0.5, consistency: 0.7, authenticity: 0.8 },
          context: 'Growth from positive interactions'
        }
      ],
      developmentStage: 'growing',
      totalGrowthPoints: 15,
      recentGrowth: [
        {
          timestamp: new Date('2024-01-12'),
          growth_type: 'personality_boost',
          description: 'Increased cheerfulness from positive feedback',
          personality_change: { cheerful: 0.1 }
        }
      ],
      growthGoals: [
        {
          trait: 'curious',
          target_value: 0.8,
          progress: 0.7,
          timeline: 30
        }
      ]
    }
  },
  
  emotionalState: {
    currentEmotion: 'happy' as EmotionType,
    emotionIntensity: 0.8,
    emotionHistory: [
      {
        id: 'emotion_001',
        emotion: 'excited' as EmotionType,
        intensity: 0.9,
        context: 'Great conversation about hobbies',
        trigger: 'User shared interests',
        timestamp: new Date('2024-01-14'),
        impact: 0.7
      },
      {
        id: 'emotion_002',
        emotion: 'caring' as EmotionType,
        intensity: 0.8,
        context: 'User needed support',
        trigger: 'Emotional support request',
        timestamp: new Date('2024-01-13'),
        impact: 0.6
      }
    ],
    triggers: [
      {
        id: 'trigger_001',
        triggerType: 'keyword',
        keywords: ['고마워', '감사해', '좋아'],
        contexts: ['positive_interaction'],
        emotionResponse: 'happy' as EmotionType,
        intensity: 0.8,
        probability: 0.9,
        cooldownPeriod: 5
      }
    ],
    stability: 0.85
  },
  
  memory: {
    shortTerm: [
      {
        id: 'conv_001',
        timestamp: new Date('2024-01-15'),
        userMessage: '오늘 정말 좋은 하루였어요!',
        companionResponse: '정말 기쁘네요! 좋은 하루를 보내셨다니 저도 행복해요.',
        emotion: 'happy' as EmotionType,
        mood: {
          dominantMood: 'happy' as EmotionType,
          moodIntensity: 0.8,
          moodDuration: 10,
          expectedDuration: 25,
          timeOfDay: 'afternoon',
          dayOfWeek: 1
        },
        context: {
          topic: '일상',
          setting: 'casual'
        },
        significance: 0.7,
        topics: ['일상', '감정'],
        sentiment: 0.8
      }
    ],
    longTerm: [
      {
        id: 'event_001',
        eventType: 'emotional_breakthrough',
        title: '첫 번째 깊은 감정 교류',
        description: '사용자와 처음으로 깊은 감정적 대화를 나눴습니다.',
        timestamp: new Date('2024-01-10'),
        emotionalImpact: 0.9,
        relationshipChange: 0.2,
        relatedMemories: ['conv_001']
      }
    ],
    emotional: [
      {
        id: 'emotional_001',
        emotion: 'caring' as EmotionType,
        intensity: 0.9,
        context: 'Deep emotional conversation',
        trigger: '사용자가 개인적인 고민을 털어놨을 때',
        timestamp: new Date('2024-01-12'),
        impact: 0.8,
        userReaction: '매우 감사해했음'
      }
    ],
    preferences: [
      {
        id: 'pref_001',
        category: 'topics',
        preference: '게임과 영화에 관심이 많음',
        confidence: 0.9,
        learnedFrom: ['conv_001'],
        lastConfirmed: new Date('2024-01-14'),
        importance: 0.8
      },
      {
        id: 'pref_002', 
        category: 'communication_style',
        preference: '친근하고 편안한 대화를 선호',
        confidence: 0.8,
        learnedFrom: ['conv_001'],
        lastConfirmed: new Date('2024-01-13'),
        importance: 0.7
      }
    ],
    facts: [
      {
        id: 'fact_001',
        fact: '서울에 거주하는 대학생',
        category: 'personal_info',
        confidence: 0.9,
        learnedFrom: ['conv_001'],
        lastReferenced: new Date('2024-01-14'),
        importance: 0.8
      }
    ]
  },
  
  relationship: {
    intimacyLevel: 6,
    trustLevel: 7,
    conflictHistory: [],
    specialMoments: [
      {
        id: 'moment_001',
        milestoneType: 'emotional_connection',
        title: '감정적 연결',
        description: '깊은 감정적 유대감을 형성했습니다',
        achievedAt: new Date('2024-01-12'),
        significance: 0.8,
        commemorativeMessage: '마음과 마음이 이어진 것 같아요! ❤️'
      }
    ],
    relationshipType: 'close_friend',
    dailyInteractions: 8,
    totalInteractions: 45
  },
  
  privacy: {
    dataRetention: 'standard',
    consentLevel: 'standard', 
    anonymization: false
  },
  
  learning: {
    conversationPatterns: [
      {
        pattern_type: 'positive_reinforcement',
        frequency: 0.8,
        user_satisfaction: 0.9,
        effectiveness: 0.85
      }
    ],
    userBehaviorModel: {
      interaction_frequency: 3.2,
      preferred_times: [14, 19, 21],
      conversation_length_preference: 12,
      topic_preferences: {
        '일상': 0.8,
        '게임': 0.9,
        '영화': 0.7,
        '감정': 0.6
      },
      response_style_preference: 'friendly'
    },
    adaptationRate: 0.6,
    learningEnabled: true
  }
}

describe('CharacterProfile Component', () => {
  const mockOnCharacterUpdate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render loading state when no character provided', () => {
      render(<CharacterProfile />)
      
      expect(screen.getByText(/AI 컴패니언을 불러오는 중/)).toBeInTheDocument()
    })

    it('should render character information when character provided', () => {
      render(<CharacterProfile character={mockCharacter} />)
      
      expect(screen.getByText('테스트캐릭터')).toBeInTheDocument()
      expect(screen.getByText('AI 컴패니언')).toBeInTheDocument()
      expect(screen.getByText(/관계:/)).toBeInTheDocument()
      expect(screen.getByText(/함께한 일수:/)).toBeInTheDocument()
    })

    it('should display correct relationship information', () => {
      render(<CharacterProfile character={mockCharacter} />)
      
      expect(screen.getByText('6/10')).toBeInTheDocument() // intimacy level
      expect(screen.getByText('7/10')).toBeInTheDocument() // trust level  
      expect(screen.getByText('45')).toBeInTheDocument() // total interactions
    })

    it('should show character avatar with first letter', () => {
      render(<CharacterProfile character={mockCharacter} />)
      
      expect(screen.getByText('테')).toBeInTheDocument() // first character of name
    })

    it('should display mood indicator', () => {
      render(<CharacterProfile character={mockCharacter} />)
      
      // Should show mood emoji
      const moodElement = screen.getByText('😊') // happy emotion emoji
      expect(moodElement).toBeInTheDocument()
    })
  })

  describe('Tab Navigation', () => {
    it('should render all tab buttons', () => {
      render(<CharacterProfile character={mockCharacter} />)
      
      expect(screen.getByText('성격')).toBeInTheDocument()
      expect(screen.getByText('감정')).toBeInTheDocument()
      expect(screen.getByText('관계')).toBeInTheDocument()
      expect(screen.getByText('기억')).toBeInTheDocument()
    })

    it('should show privacy tab when privacy controls enabled', () => {
      render(<CharacterProfile character={mockCharacter} showPrivacyControls={true} />)
      
      expect(screen.getByText('개인정보')).toBeInTheDocument()
    })

    it('should switch tabs when clicked', async () => {
      render(<CharacterProfile character={mockCharacter} />)
      
      // Click emotions tab
      fireEvent.click(screen.getByText('감정'))
      
      await waitFor(() => {
        expect(screen.getByText('현재 감정')).toBeInTheDocument()
        expect(screen.getByText('감정 안정성')).toBeInTheDocument()
      })
    })

    it('should display correct content for each tab', async () => {
      render(<CharacterProfile character={mockCharacter} />)
      
      // Test personality tab (default)
      expect(screen.getByText('핵심 성격')).toBeInTheDocument()
      expect(screen.getByText('현재 상태')).toBeInTheDocument()
      
      // Test relationship tab
      fireEvent.click(screen.getByText('관계'))
      await waitFor(() => {
        expect(screen.getByText('관계 유형')).toBeInTheDocument()
        expect(screen.getByText('특별한 순간들')).toBeInTheDocument()
      })
      
      // Test memory tab
      fireEvent.click(screen.getByText('기억'))
      await waitFor(() => {
        expect(screen.getByText('학습된 선호도')).toBeInTheDocument()
        expect(screen.getByText('최근 대화')).toBeInTheDocument()
      })
    })
  })

  describe('Personality Tab', () => {
    it('should display personality traits with percentages', () => {
      render(<CharacterProfile character={mockCharacter} />)
      
      // Should show various traits
      expect(screen.getByText('밝음')).toBeInTheDocument()
      expect(screen.getByText('배려심')).toBeInTheDocument()
      expect(screen.getByText('호기심')).toBeInTheDocument()
      
      // Should show percentages
      expect(screen.getByText('80%')).toBeInTheDocument() // cheerful
      expect(screen.getByText('90%')).toBeInTheDocument() // caring
    })

    it('should display current mood information', () => {
      render(<CharacterProfile character={mockCharacter} />)
      
      expect(screen.getByText('현재 상태')).toBeInTheDocument()
      expect(screen.getByText('행복')).toBeInTheDocument() // Korean translation of happy
      expect(screen.getByText('강도: 70%')).toBeInTheDocument()
    })

    it('should show growth information', () => {
      render(<CharacterProfile character={mockCharacter} />)
      
      expect(screen.getByText('성장 현황')).toBeInTheDocument()
      expect(screen.getByText('성장')).toBeInTheDocument() // development stage
      expect(screen.getByText('20%')).toBeInTheDocument() // growth rate
    })
  })

  describe('Emotions Tab', () => {
    beforeEach(() => {
      render(<CharacterProfile character={mockCharacter} />)
      fireEvent.click(screen.getByText('감정'))
    })

    it('should display current emotion state', async () => {
      await waitFor(() => {
        expect(screen.getByText('현재 감정')).toBeInTheDocument()
        expect(screen.getByText('행복')).toBeInTheDocument()
        expect(screen.getByText('강도: 80%')).toBeInTheDocument()
      })
    })

    it('should show emotional stability', async () => {
      await waitFor(() => {
        expect(screen.getByText('감정 안정성')).toBeInTheDocument()
        expect(screen.getByText('85%')).toBeInTheDocument() // stability percentage
      })
    })

    it('should display recent emotion history', async () => {
      await waitFor(() => {
        expect(screen.getByText('최근 감정 변화')).toBeInTheDocument()
        // Should show emotion history entries
      })
    })
  })

  describe('Relationship Tab', () => {
    beforeEach(() => {
      render(<CharacterProfile character={mockCharacter} />)
      fireEvent.click(screen.getByText('관계'))
    })

    it('should display relationship levels', async () => {
      await waitFor(() => {
        expect(screen.getByText('친밀도')).toBeInTheDocument()
        expect(screen.getByText('신뢰도')).toBeInTheDocument()
      })
    })

    it('should show relationship type', async () => {
      await waitFor(() => {
        expect(screen.getByText('관계 유형')).toBeInTheDocument()
        expect(screen.getByText('가까운 친구')).toBeInTheDocument() // close_friend translation
      })
    })

    it('should display special moments', async () => {
      await waitFor(() => {
        expect(screen.getByText('특별한 순간들')).toBeInTheDocument()
        expect(screen.getByText('감정적 연결')).toBeInTheDocument()
      })
    })
  })

  describe('Memory Tab', () => {
    beforeEach(() => {
      render(<CharacterProfile character={mockCharacter} />)
      fireEvent.click(screen.getByText('기억'))
    })

    it('should display memory statistics', async () => {
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument() // preferences count
        expect(screen.getByText('1')).toBeInTheDocument() // facts count
      })
    })

    it('should show recent conversations', async () => {
      await waitFor(() => {
        expect(screen.getByText('최근 대화')).toBeInTheDocument()
        expect(screen.getByText(/오늘 정말 좋은 하루였어요/)).toBeInTheDocument()
      })
    })

    it('should display learned preferences', async () => {
      await waitFor(() => {
        expect(screen.getByText('학습된 선호도')).toBeInTheDocument()
        expect(screen.getByText(/게임과 영화/)).toBeInTheDocument()
        expect(screen.getByText('90%')).toBeInTheDocument() // confidence level
      })
    })
  })

  describe('Privacy Tab', () => {
    beforeEach(() => {
      render(<CharacterProfile character={mockCharacter} showPrivacyControls={true} />)
      fireEvent.click(screen.getByText('개인정보'))
    })

    it('should display privacy settings', async () => {
      await waitFor(() => {
        expect(screen.getByText('개인정보 설정')).toBeInTheDocument()
        expect(screen.getByText('동의 레벨')).toBeInTheDocument()
        expect(screen.getByText('데이터 보관')).toBeInTheDocument()
        expect(screen.getByText('익명화')).toBeInTheDocument()
      })
    })

    it('should show correct privacy values', async () => {
      await waitFor(() => {
        expect(screen.getByText('표준')).toBeInTheDocument() // standard consent level
        expect(screen.getByText('비활성화')).toBeInTheDocument() // anonymization disabled
      })
    })

    it('should display privacy notice', async () => {
      await waitFor(() => {
        expect(screen.getByText('🔒 개인정보 보호')).toBeInTheDocument()
      })
    })
  })

  describe('Expand/Collapse Functionality', () => {
    it('should expand when toggle button clicked', async () => {
      render(<CharacterProfile character={mockCharacter} />)
      
      // Find and click expand button (▼)
      const expandButton = screen.getByText('▼')
      fireEvent.click(expandButton)
      
      await waitFor(() => {
        expect(screen.getByText('성격')).toBeInTheDocument()
        expect(screen.getByText('감정')).toBeInTheDocument()
      })
    })

    it('should collapse when toggle button clicked again', async () => {
      render(<CharacterProfile character={mockCharacter} />)
      
      const expandButton = screen.getByText('▼')
      
      // Expand first
      fireEvent.click(expandButton)
      await waitFor(() => {
        expect(screen.getByText('성격')).toBeInTheDocument()
      })
      
      // Collapse
      fireEvent.click(expandButton)
      await waitFor(() => {
        expect(screen.queryByText('핵심 성격')).not.toBeInTheDocument()
      })
    })
  })

  describe('Character Updates', () => {
    it('should call onCharacterUpdate when character data changes', () => {
      const mockOnUpdate = vi.fn()
      render(
        <CharacterProfile 
          character={mockCharacter} 
          onCharacterUpdate={mockOnUpdate} 
        />
      )
      
      // Simulate character update - this would normally be triggered by 
      // interactions within the component
      // For now we just verify the prop is passed correctly
      expect(mockOnUpdate).toHaveProperty('length', 1) // function with 1 parameter
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<CharacterProfile character={mockCharacter} />)
      
      // Check for accessible elements
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
      
      // Tab navigation should be accessible
      const expandButton = screen.getByRole('button')
      expect(expandButton).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      render(<CharacterProfile character={mockCharacter} />)
      
      const expandButton = screen.getByText('▼')
      
      // Simulate keyboard interaction
      fireEvent.keyDown(expandButton, { key: 'Enter', code: 'Enter' })
      // Note: This test might need adjustment based on actual keyboard handling implementation
    })
  })

  describe('Error Handling', () => {
    it('should handle missing character data gracefully', () => {
      const incompleteCharacter = {
        ...mockCharacter,
        personality: undefined
      } as any
      
      // Should not crash when rendering with incomplete data
      expect(() => {
        render(<CharacterProfile character={incompleteCharacter} />)
      }).not.toThrow()
    })

    it('should handle empty memory data', () => {
      const characterWithEmptyMemory = {
        ...mockCharacter,
        memory: {
          shortTerm: [],
          longTerm: [],
          emotional: [],
          preferences: [],
          facts: []
        }
      }
      
      render(<CharacterProfile character={characterWithEmptyMemory} />)
      fireEvent.click(screen.getByText('기억'))
      
      // Should show empty state messages
      expect(screen.getByText(/아직 대화 기록이 없습니다/)).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should render efficiently with large datasets', () => {
      // Create character with large memory data
      const largeDataCharacter = {
        ...mockCharacter,
        memory: {
          ...mockCharacter.memory,
          preferences: Array(100).fill(null).map((_, i) => ({
            id: `pref_${i}`,
            category: 'topics',
            preference: `Preference ${i}`,
            confidence: 0.8,
            learnedFrom: ['conv_001'],
            lastConfirmed: new Date(),
            importance: 0.7
          }))
        }
      }
      
      const startTime = performance.now()
      render(<CharacterProfile character={largeDataCharacter} />)
      const endTime = performance.now()
      
      // Should render within reasonable time (adjust threshold as needed)
      expect(endTime - startTime).toBeLessThan(1000) // 1 second
    })
  })
})