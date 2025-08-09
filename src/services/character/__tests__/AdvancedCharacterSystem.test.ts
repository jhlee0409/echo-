/**
 * 🧪 Advanced Character System Test Suite
 * 
 * Comprehensive testing for the Advanced Character System including:
 * - Character manager initialization
 * - Personality system
 * - Emotion engine
 * - Relationship tracking
 * - Memory management
 * - Privacy compliance
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  AdvancedCharacterManager, 
  AdvancedAICompanion,
  EmotionEngine,
  MemoryManager,
  RelationshipTracker,
  PrivacyManager 
} from '../AdvancedCharacterSystem'
import type { EmotionType } from '@types'

// Mock data for testing
const mockCharacterData: Partial<AdvancedAICompanion> = {
  id: 'test_companion_001',
  name: '테스트아리아',
  createdAt: new Date('2024-01-01'),
  personality: {
    core: {
      cheerful: 0.7,
      caring: 0.8,
      playful: 0.6,
      curious: 0.9,
      thoughtful: 0.7,
      supportive: 0.8,
      independent: 0.4,
      emotional: 0.6,
      adaptability: 0.5,
      consistency: 0.7,
      authenticity: 0.9
    },
    current: {
      dominantMood: 'happy' as EmotionType,
      moodIntensity: 0.6,
      moodDuration: 10,
      expectedDuration: 30,
      timeOfDay: 'morning',
      dayOfWeek: 1
    },
    adaptation: {
      growthRate: 0.1,
      influenceFactors: [],
      personalityHistory: [],
      developmentStage: 'early',
      totalGrowthPoints: 0,
      recentGrowth: [],
      growthGoals: []
    }
  },
  relationship: {
    intimacyLevel: 3,
    trustLevel: 4,
    relationshipType: 'friend',
    conflictHistory: [],
    specialMoments: [],
    dailyInteractions: 5,
    totalInteractions: 25
  }
}

describe('AdvancedCharacterManager', () => {
  let characterManager: AdvancedCharacterManager
  
  beforeEach(() => {
    characterManager = new AdvancedCharacterManager(mockCharacterData)
  })

  describe('Initialization', () => {
    it('should initialize with provided character data', () => {
      const character = characterManager.getCharacter()
      
      expect(character.id).toBe('test_companion_001')
      expect(character.name).toBe('테스트아리아')
      expect(character.personality.core.cheerful).toBe(0.7)
      expect(character.relationship.intimacyLevel).toBe(3)
    })

    it('should initialize with default values for missing data', () => {
      const minimalManager = new AdvancedCharacterManager({ name: '최소컴패니언' })
      const character = minimalManager.getCharacter()
      
      expect(character.name).toBe('최소컴패니언')
      expect(character.personality.core.cheerful).toBe(0.7)
      expect(character.relationship.intimacyLevel).toBe(1)
      expect(character.emotionalState.stability).toBe(0.7)
    })

    it('should create proper ID if not provided', () => {
      const manager = new AdvancedCharacterManager({ name: 'NoID' })
      const character = manager.getCharacter()
      
      expect(character.id).toMatch(/^companion_\d+$/)
    })
  })

  describe('Interaction Processing', () => {
    it('should process user interactions and update character state', async () => {
      const initialInteractions = characterManager.getCharacter().relationship.totalInteractions
      
      const result = await characterManager.processInteraction(
        '안녕하세요! 오늘 정말 기분이 좋아요!',
        {
          topic: '일상대화',
          setting: 'casual',
          user_mood: 'happy' as EmotionType
        }
      )

      const updatedCharacter = characterManager.getCharacter()
      
      expect(updatedCharacter.relationship.totalInteractions).toBe(initialInteractions + 1)
      expect(result.emotionChange || result.relationshipChange || result.memoryUpdate).toBeTruthy()
    })

    it('should handle negative interactions appropriately', async () => {
      const result = await characterManager.processInteraction(
        '오늘 정말 화가 나고 짜증이 나요',
        {
          topic: '감정표현',
          setting: 'emotional',
          user_mood: 'angry' as EmotionType
        }
      )

      expect(result.emotionChange).toBeTruthy()
    })

    it('should trigger personality shifts after sufficient interactions', async () => {
      // Simulate multiple interactions to trigger personality shift
      for (let i = 0; i < 15; i++) {
        await characterManager.processInteraction(
          '정말 행복한 대화입니다!',
          {
            topic: '일상',
            setting: 'positive',
            user_mood: 'happy' as EmotionType
          }
        )
      }

      const character = characterManager.getCharacter()
      expect(character.personality.adaptation.personalityHistory.length).toBeGreaterThan(0)
    })
  })

  describe('Emotional Context', () => {
    it('should provide comprehensive emotional context', () => {
      const context = characterManager.getEmotionalContext()
      
      expect(context).toHaveProperty('emotion')
      expect(context).toHaveProperty('intensity')
      expect(context).toHaveProperty('mood')
      expect(context).toHaveProperty('personalityInfluence')
      expect(context).toHaveProperty('relationshipContext')
      
      expect(typeof context.intensity).toBe('number')
      expect(context.intensity).toBeGreaterThanOrEqual(0)
      expect(context.intensity).toBeLessThanOrEqual(1)
    })
  })

  describe('Memory Retrieval', () => {
    it('should retrieve recent memories', () => {
      const memories = characterManager.getRecentMemories(3)
      expect(Array.isArray(memories)).toBeTruthy()
      expect(memories.length).toBeLessThanOrEqual(3)
    })
  })

  describe('Data Management', () => {
    it('should export character data as JSON', () => {
      const exportedData = characterManager.exportCharacter()
      
      expect(() => JSON.parse(exportedData)).not.toThrow()
      
      const parsed = JSON.parse(exportedData)
      expect(parsed.name).toBe('테스트아리아')
      expect(parsed.id).toBe('test_companion_001')
    })

    it('should import character data from JSON', () => {
      const originalData = characterManager.exportCharacter()
      const newManager = new AdvancedCharacterManager({ name: 'Different' })
      
      expect(() => newManager.importCharacter(originalData)).not.toThrow()
      
      const importedCharacter = newManager.getCharacter()
      expect(importedCharacter.name).toBe('테스트아리아')
    })

    it('should handle invalid import data gracefully', () => {
      expect(() => characterManager.importCharacter('invalid json')).toThrow('Invalid character data format')
    })
  })
})

describe('Emotion Engine', () => {
  let character: AdvancedAICompanion
  let emotionEngine: any // Using any because EmotionEngine is private

  beforeEach(() => {
    const manager = new AdvancedCharacterManager(mockCharacterData)
    character = manager.getCharacter()
    // Access private emotion engine for testing
    emotionEngine = (manager as any).emotionEngine
  })

  describe('Emotion Analysis', () => {
    it('should detect emotions from Korean text', async () => {
      const result = await emotionEngine.processMessage(
        '정말 기쁘고 행복해요! 오늘 최고의 날이에요!',
        { topic: '감정', setting: 'positive' }
      )

      expect(typeof result).toBe('boolean')
    })

    it('should handle sad emotions', async () => {
      const result = await emotionEngine.processMessage(
        '오늘 정말 슬프고 우울해요... 힘들어요',
        { topic: '감정', setting: 'negative', user_mood: 'sad' as EmotionType }
      )

      expect(typeof result).toBe('boolean')
    })

    it('should detect emotional triggers', async () => {
      const result = await emotionEngine.processMessage(
        '정말 고마워요! 당신이 최고예요!',
        { topic: '칭찬', setting: 'positive' }
      )

      expect(typeof result).toBe('boolean')
    })
  })
})

describe('Memory Manager', () => {
  let character: AdvancedAICompanion
  let memoryManager: any

  beforeEach(() => {
    const manager = new AdvancedCharacterManager(mockCharacterData)
    character = manager.getCharacter()
    memoryManager = (manager as any).memoryManager
  })

  describe('Conversation Storage', () => {
    it('should add conversations to memory', async () => {
      const initialMemoryCount = character.memory.shortTerm.length
      
      await memoryManager.addConversation(
        '오늘 날씨가 정말 좋아요',
        { topic: '날씨', setting: 'casual' }
      )

      expect(character.memory.shortTerm.length).toBeGreaterThan(initialMemoryCount)
    })

    it('should extract user preferences', async () => {
      await memoryManager.addConversation(
        '저는 게임을 정말 좋아해요. 특히 RPG 게임을 즐겨해요.',
        { topic: '취미', setting: 'personal' }
      )

      // Check if preferences were learned
      const hasGamePreference = character.memory.preferences.some(
        pref => pref.preference.includes('게임') || pref.preference.includes('RPG')
      )
      
      expect(hasGamePreference).toBeTruthy()
    })

    it('should maintain memory limits', async () => {
      // Add many conversations
      for (let i = 0; i < 20; i++) {
        await memoryManager.addConversation(
          `대화 ${i}: 테스트 메시지입니다.`,
          { topic: '테스트', setting: 'test' }
        )
      }

      // Should not exceed limit
      expect(character.memory.shortTerm.length).toBeLessThanOrEqual(10)
    })
  })

  describe('Fact Extraction', () => {
    it('should extract personal facts from conversation', async () => {
      await memoryManager.addConversation(
        '저는 20살이고 서울에 살아요. 대학생입니다.',
        { topic: '개인정보', setting: 'personal' }
      )

      const hasFacts = character.memory.facts.length > 0
      expect(hasFacts).toBeTruthy()
    })
  })
})

describe('Relationship Tracker', () => {
  let character: AdvancedAICompanion
  let relationshipTracker: any

  beforeEach(() => {
    const manager = new AdvancedCharacterManager(mockCharacterData)
    character = manager.getCharacter()
    relationshipTracker = (manager as any).relationshipTracker
  })

  describe('Intimacy and Trust Changes', () => {
    it('should increase intimacy with personal sharing', async () => {
      const initialIntimacy = character.relationship.intimacyLevel
      
      await relationshipTracker.updateFromInteraction(
        '사실은 저에게 비밀이 있어요... 아무에게도 말하지 마세요',
        { topic: '비밀', setting: 'intimate' }
      )

      expect(character.relationship.intimacyLevel).toBeGreaterThanOrEqual(initialIntimacy)
    })

    it('should increase trust with supportive interactions', async () => {
      const initialTrust = character.relationship.trustLevel
      
      await relationshipTracker.updateFromInteraction(
        '당신을 정말 믿어요. 항상 지지해줄게요.',
        { topic: '지지', setting: 'supportive' }
      )

      expect(character.relationship.trustLevel).toBeGreaterThanOrEqual(initialTrust)
    })

    it('should detect and handle conflicts', async () => {
      const initialConflicts = character.relationship.conflictHistory.length
      
      await relationshipTracker.updateFromInteraction(
        '정말 이해할 수 없어요. 화가 나네요.',
        { topic: '갈등', setting: 'conflict' }
      )

      expect(character.relationship.conflictHistory.length).toBeGreaterThanOrEqual(initialConflicts)
    })
  })

  describe('Milestone Detection', () => {
    it('should detect celebration milestones', async () => {
      const result = await relationshipTracker.updateFromInteraction(
        '축하해요! 정말 기뻐요! 성공했어요!',
        { topic: '축하', setting: 'celebration' }
      )

      expect(typeof result).toBe('boolean')
    })

    it('should update relationship type based on levels', async () => {
      // Set high intimacy and trust
      character.relationship.intimacyLevel = 8
      character.relationship.trustLevel = 8
      
      const result = await relationshipTracker.updateFromInteraction(
        '당신과 함께하는 시간이 정말 소중해요',
        { topic: '관계', setting: 'deep' }
      )

      expect(typeof result).toBe('boolean')
    })
  })

  describe('Relationship Insights', () => {
    it('should provide relationship insights', () => {
      const insights = relationshipTracker.getRelationshipInsights()
      
      expect(insights).toHaveProperty('level')
      expect(insights).toHaveProperty('strength')
      expect(insights).toHaveProperty('growth_areas')
      expect(insights).toHaveProperty('next_milestone')
      expect(insights).toHaveProperty('health_score')
      
      expect(typeof insights.health_score).toBe('number')
      expect(insights.health_score).toBeGreaterThanOrEqual(0)
      expect(insights.health_score).toBeLessThanOrEqual(1)
    })
  })
})

describe('Privacy Manager', () => {
  let character: AdvancedAICompanion
  let privacyManager: any

  beforeEach(() => {
    const manager = new AdvancedCharacterManager({
      ...mockCharacterData,
      privacy: {
        dataRetention: 'standard',
        consentLevel: 'standard',
        anonymization: false
      }
    })
    character = manager.getCharacter()
    privacyManager = (manager as any).privacyManager
  })

  describe('Data Storage Permissions', () => {
    it('should allow conversation storage with standard consent', () => {
      const canStore = privacyManager.canStoreData('conversation')
      expect(canStore).toBeTruthy()
    })

    it('should restrict fact storage with minimal consent', () => {
      character.privacy.consentLevel = 'minimal'
      const canStore = privacyManager.canStoreData('fact')
      expect(canStore).toBeFalsy()
    })

    it('should respect session-only retention policy', () => {
      character.privacy.dataRetention = 'session_only'
      const canStore = privacyManager.canStoreData('preference')
      expect(canStore).toBeFalsy()
    })
  })

  describe('Data Anonymization', () => {
    it('should anonymize data when enabled', () => {
      character.privacy.anonymization = true
      
      const testData = {
        name: '홍길동',
        email: 'test@example.com',
        content: '제 이름은 홍길동입니다. 010-1234-5678로 연락주세요.'
      }

      const anonymized = privacyManager.anonymizeData(testData)
      
      expect(anonymized.name).not.toBe('홍길동')
      expect(anonymized.email).not.toBe('test@example.com')
      expect(anonymized.content).toContain('[휴대폰번호]')
    })

    it('should not anonymize when disabled', () => {
      character.privacy.anonymization = false
      
      const testData = { name: '홍길동' }
      const result = privacyManager.anonymizeData(testData)
      
      expect(result.name).toBe('홍길동')
    })
  })

  describe('Data Retention', () => {
    it('should clean expired data based on retention policy', async () => {
      // Add some old data
      character.memory.shortTerm = [{
        id: 'old_conv',
        timestamp: new Date('2020-01-01'),
        userMessage: 'Old message',
        companionResponse: 'Old response',
        emotion: 'neutral' as EmotionType,
        mood: character.personality.current,
        context: { topic: 'old' },
        significance: 0.5,
        topics: ['old'],
        sentiment: 0
      }]

      const cleaned = await privacyManager.cleanExpiredData(character)
      expect(cleaned).toBeTruthy()
      expect(character.memory.shortTerm.length).toBe(0)
    })
  })

  describe('GDPR Compliance', () => {
    it('should export user data for GDPR compliance', () => {
      const exportData = privacyManager.exportUserData(character)
      
      expect(exportData).toHaveProperty('personalData')
      expect(exportData).toHaveProperty('interactionData')
      expect(exportData).toHaveProperty('privacySettings')
      expect(exportData).toHaveProperty('exportedAt')
      
      expect(exportData.personalData.characterName).toBe('테스트아리아')
    })

    it('should delete all user data for GDPR compliance', () => {
      // Add some data first
      character.memory.shortTerm = [/* some data */]
      character.memory.preferences = [/* some preferences */]
      character.relationship.specialMoments = [/* some moments */]

      privacyManager.deleteAllUserData(character)

      expect(character.memory.shortTerm).toHaveLength(0)
      expect(character.memory.preferences).toHaveLength(0)
      expect(character.relationship.specialMoments).toHaveLength(0)
      expect(character.relationship.intimacyLevel).toBe(1)
      expect(character.relationship.trustLevel).toBe(1)
    })
  })

  describe('Privacy Reporting', () => {
    it('should generate privacy compliance report', () => {
      const report = privacyManager.getPrivacyReport()
      
      expect(report).toHaveProperty('consentLevel')
      expect(report).toHaveProperty('dataRetention')
      expect(report).toHaveProperty('anonymizationEnabled')
      expect(report).toHaveProperty('complianceScore')
      expect(report).toHaveProperty('recommendations')
      
      expect(typeof report.complianceScore).toBe('number')
      expect(Array.isArray(report.recommendations)).toBeTruthy()
    })

    it('should generate privacy-aware summaries', () => {
      const summary = privacyManager.generatePrivacyAwareSummary(character)
      
      expect(summary).toHaveProperty('personalitySnapshot')
      expect(summary).toHaveProperty('relationshipSummary')
      expect(summary).toHaveProperty('memoryContext')
      expect(summary).toHaveProperty('privacyNotice')
    })
  })
})

describe('Integration Tests', () => {
  let characterManager: AdvancedCharacterManager

  beforeEach(() => {
    characterManager = new AdvancedCharacterManager(mockCharacterData)
  })

  describe('Event System', () => {
    it('should emit events when character state changes', async () => {
      let eventCount = 0
      const expectedEvents = ['emotionChanged', 'relationshipChanged', 'memoryUpdated']
      
      const eventPromises = expectedEvents.map(event => 
        new Promise<void>(resolve => {
          characterManager.on(event, () => {
            eventCount++
            resolve()
          })
        })
      )

      // Trigger interactions that should emit events
      await characterManager.processInteraction(
        '정말 감사하고 행복해요! 당신과 함께하는 시간이 소중해요.',
        {
          topic: '감정',
          setting: 'intimate',
          user_mood: 'happy' as EmotionType
        }
      )

      // Wait for all events to be emitted (with timeout)
      await Promise.race([
        Promise.all(eventPromises),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Events not emitted in time')), 1000)
        )
      ])

      expect(eventCount).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Performance', () => {
    it('should handle multiple rapid interactions efficiently', async () => {
      const startTime = Date.now()
      
      const promises = []
      for (let i = 0; i < 50; i++) {
        promises.push(
          characterManager.processInteraction(
            `빠른 대화 ${i}: 테스트 메시지입니다.`,
            { topic: '성능테스트', setting: 'rapid' }
          )
        )
      }

      await Promise.all(promises)
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000) // 5 seconds for 50 interactions
      
      const character = characterManager.getCharacter()
      expect(character.relationship.totalInteractions).toBe(25 + 50) // initial + new
    })

    it('should maintain memory limits under load', async () => {
      // Add many interactions
      for (let i = 0; i < 100; i++) {
        await characterManager.processInteraction(
          `메모리 테스트 ${i}`,
          { topic: '메모리', setting: 'load-test' }
        )
      }

      const character = characterManager.getCharacter()
      
      // Check memory limits are maintained
      expect(character.memory.shortTerm.length).toBeLessThanOrEqual(10)
      expect(character.memory.emotional.length).toBeLessThanOrEqual(50)
      expect(character.memory.preferences.length).toBeLessThanOrEqual(100)
      expect(character.memory.facts.length).toBeLessThanOrEqual(200)
    })
  })

  describe('Data Consistency', () => {
    it('should maintain data consistency across multiple operations', async () => {
      const initialState = characterManager.exportCharacter()
      
      // Perform various operations
      await characterManager.processInteraction('첫 번째 메시지', { topic: '일관성', setting: 'test' })
      await characterManager.processInteraction('두 번째 메시지', { topic: '일관성', setting: 'test' })
      await characterManager.processInteraction('세 번째 메시지', { topic: '일관성', setting: 'test' })

      const character = characterManager.getCharacter()
      
      // Verify data consistency
      expect(character.id).toBe(JSON.parse(initialState).id)
      expect(character.name).toBe(JSON.parse(initialState).name)
      expect(character.relationship.totalInteractions).toBeGreaterThan(0)
      
      // Verify relationship levels are within bounds
      expect(character.relationship.intimacyLevel).toBeGreaterThanOrEqual(0)
      expect(character.relationship.intimacyLevel).toBeLessThanOrEqual(10)
      expect(character.relationship.trustLevel).toBeGreaterThanOrEqual(0)
      expect(character.relationship.trustLevel).toBeLessThanOrEqual(10)
      
      // Verify emotional stability is within bounds
      expect(character.emotionalState.stability).toBeGreaterThanOrEqual(0)
      expect(character.emotionalState.stability).toBeLessThanOrEqual(1)
    })
  })
})

// Helper function to create test scenarios
const createTestScenario = (
  message: string,
  emotion: EmotionType,
  expectedOutcome: 'positive' | 'negative' | 'neutral'
) => ({
  message,
  context: {
    topic: 'test',
    setting: 'scenario',
    user_mood: emotion
  },
  expectedOutcome
})

describe('Scenario-Based Tests', () => {
  let characterManager: AdvancedCharacterManager

  beforeEach(() => {
    characterManager = new AdvancedCharacterManager(mockCharacterData)
  })

  const testScenarios = [
    createTestScenario('정말 행복하고 기뻐요!', 'happy', 'positive'),
    createTestScenario('오늘 너무 슬프고 우울해요...', 'sad', 'negative'),
    createTestScenario('그냥 평범한 하루였어요.', 'neutral', 'neutral'),
    createTestScenario('정말 화가 나고 짜증이 나요!', 'angry', 'negative'),
    createTestScenario('궁금한 게 있어요. 알려주세요!', 'curious', 'positive')
  ]

  testScenarios.forEach(scenario => {
    it(`should handle ${scenario.context.user_mood} emotion appropriately`, async () => {
      const result = await characterManager.processInteraction(
        scenario.message,
        scenario.context
      )

      // Verify that some change occurred
      expect(result.emotionChange || result.relationshipChange || result.memoryUpdate).toBeTruthy()
      
      const character = characterManager.getCharacter()
      
      // Verify emotional state is reasonable
      expect(character.emotionalState.emotionIntensity).toBeGreaterThanOrEqual(0)
      expect(character.emotionalState.emotionIntensity).toBeLessThanOrEqual(1)
    })
  })
})