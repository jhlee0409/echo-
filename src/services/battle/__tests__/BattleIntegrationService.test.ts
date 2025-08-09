/**
 * 🧪 Battle Integration Service Tests
 * 
 * Tests the integration between battle system and character system
 */

import { BattleIntegrationService } from '../BattleIntegrationService'
import type { BattleResult, BattleUnit, BattleFormation } from '@/systems/battle/types'
import type { AdvancedAICompanion } from '@/services/character/AdvancedCharacterSystem'
import type { EmotionType } from '@types'

// Mock character data for testing
const createMockCharacter = (overrides: Partial<AdvancedAICompanion> = {}): AdvancedAICompanion => ({
  id: 'test-character',
  name: 'Test Companion',
  createdAt: new Date('2024-01-01'),
  lastInteraction: new Date(),
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
      authenticity: 0.9,
    },
    current: {
      dominantMood: 'happy' as EmotionType,
      moodIntensity: 0.6,
      moodDuration: 0,
      expectedDuration: 30,
      timeOfDay: 'afternoon',
      dayOfWeek: 3,
    },
    adaptation: {
      growthRate: 0.1,
      influenceFactors: [],
      personalityHistory: [],
      developmentStage: 'early',
      totalGrowthPoints: 0,
      recentGrowth: [],
      growthGoals: [],
    },
  },
  emotionalState: {
    currentEmotion: 'happy' as EmotionType,
    emotionIntensity: 0.6,
    emotionHistory: [],
    triggers: [],
    stability: 0.7,
  },
  memory: {
    shortTerm: [],
    longTerm: [],
    emotional: [],
    preferences: [],
    facts: [],
  },
  relationship: {
    intimacyLevel: 3,
    trustLevel: 4,
    conflictHistory: [],
    specialMoments: [],
    relationshipType: 'friend',
    dailyInteractions: 0,
    totalInteractions: 25,
  },
  privacy: {
    dataRetention: 'standard',
    consentLevel: 'standard',
    anonymization: false,
  },
  learning: {
    conversationPatterns: [],
    userBehaviorModel: {
      interaction_frequency: 0,
      preferred_times: [],
      conversation_length_preference: 10,
      topic_preferences: {},
      response_style_preference: 'friendly',
    },
    adaptationRate: 0.5,
    learningEnabled: true,
  },
  ...overrides,
})

// Mock battle units
const createMockBattleUnit = (type: 'player' | 'companion' | 'enemy', overrides: Partial<BattleUnit> = {}): BattleUnit => ({
  id: `${type}-unit`,
  name: `Test ${type}`,
  type,
  level: 1,
  hp: 100,
  maxHp: 100,
  mp: 50,
  maxMp: 50,
  attack: 20,
  defense: 15,
  speed: 10,
  accuracy: 95,
  evasion: 5,
  critRate: 10,
  critDamage: 150,
  isAlive: true,
  buffs: [],
  debuffs: [],
  skills: [],
  ...overrides,
})

describe('BattleIntegrationService', () => {
  let service: BattleIntegrationService
  let mockCharacter: AdvancedAICompanion

  beforeEach(() => {
    service = new BattleIntegrationService({
      experienceMultiplier: 1.0,
      relationshipGainMultiplier: 1.0,
      personalityInfluenceStrength: 0.7,
      enableDynamicDifficulty: true,
    })
    mockCharacter = createMockCharacter()
  })

  describe('setupBattleFormation', () => {
    it('should enhance player team with character stats', async () => {
      const baseFormation: Partial<BattleFormation> = {
        playerTeam: [
          createMockBattleUnit('player'),
          createMockBattleUnit('companion'),
        ],
        enemyTeam: [createMockBattleUnit('enemy')],
      }

      const result = await service.setupBattleFormation(mockCharacter, baseFormation)

      expect(result.playerTeam).toHaveLength(2)
      
      // Player unit should be enhanced with level bonuses
      const playerUnit = result.playerTeam.find(u => u.type === 'player')!
      expect(playerUnit.maxHp).toBeGreaterThan(100) // Enhanced by level and relationship
      
      // Companion should have personality mapping
      const companionUnit = result.playerTeam.find(u => u.type === 'companion')!
      expect(companionUnit.personality).toBeDefined()
      expect(companionUnit.personality.support).toBeGreaterThan(0)
    })

    it('should apply emotional modifiers correctly', async () => {
      // Test with excited character (high crit, high damage, low accuracy)
      const excitedCharacter = createMockCharacter({
        emotionalState: {
          ...mockCharacter.emotionalState,
          currentEmotion: 'excited' as EmotionType,
        },
      })

      const baseFormation: Partial<BattleFormation> = {
        playerTeam: [createMockBattleUnit('companion')],
        enemyTeam: [createMockBattleUnit('enemy')],
      }

      const result = await service.setupBattleFormation(excitedCharacter, baseFormation)
      const companionUnit = result.playerTeam[0]

      // Excited emotion should increase crit rate but decrease accuracy
      expect(companionUnit.critRate).toBeGreaterThan(10)
      expect(companionUnit.accuracy).toBeLessThan(95)
    })

    it('should adjust enemy difficulty based on character performance', async () => {
      const highLevelCharacter = createMockCharacter({
        relationship: {
          ...mockCharacter.relationship,
          totalInteractions: 100, // Higher level character
        },
      })

      const baseFormation: Partial<BattleFormation> = {
        playerTeam: [createMockBattleUnit('player')],
        enemyTeam: [createMockBattleUnit('enemy', { maxHp: 80, hp: 80 })],
      }

      const result = await service.setupBattleFormation(highLevelCharacter, baseFormation)
      
      // Enemy should be stronger for higher level character
      expect(result.enemyTeam[0].maxHp).toBeGreaterThan(80)
      expect(result.enemyTeam[0].hp).toBeGreaterThan(80)
    })
  })

  describe('processBattleResults', () => {
    it('should award appropriate experience for victory', async () => {
      const victoryResult: BattleResult = {
        victory: true,
        turns: 8,
        battleLog: [],
        statistics: {
          totalDamageDealt: 200,
          totalDamageReceived: 50,
          totalHealing: 0,
          skillsUsed: 5,
          criticalHits: 2,
          missedAttacks: 1,
          statusEffectsApplied: 3,
        },
        rewards: {
          experience: 100,
          gold: 50,
          items: [],
        },
        experienceGained: {
          player: 50,
          companion: 40,
        },
      }

      const rewards = await service.processBattleResults(victoryResult, mockCharacter)

      expect(rewards.experience.combat).toBeGreaterThan(0)
      expect(rewards.experience.emotional).toBeGreaterThan(0)
      expect(rewards.experience.relationship).toBeGreaterThan(0)
      expect(rewards.relationshipChange.intimacy).toBeGreaterThan(0)
      expect(rewards.relationshipChange.trust).toBeGreaterThan(0)
    })

    it('should provide different rewards for defeat', async () => {
      const defeatResult: BattleResult = {
        victory: false,
        turns: 12,
        battleLog: [],
        statistics: {
          totalDamageDealt: 80,
          totalDamageReceived: 150,
          totalHealing: 0,
          skillsUsed: 3,
          criticalHits: 0,
          missedAttacks: 3,
          statusEffectsApplied: 1,
        },
        rewards: {
          experience: 20,
          gold: 10,
          items: [],
        },
        experienceGained: {
          player: 15,
          companion: 10,
        },
      }

      const rewards = await service.processBattleResults(defeatResult, mockCharacter)

      // Defeat should still give some rewards, with emphasis on emotional growth
      expect(rewards.experience.combat).toBeGreaterThan(0)
      expect(rewards.experience.emotional).toBeGreaterThan(rewards.experience.combat) // More emotional exp from defeat
      expect(rewards.relationshipChange.intimacy).toBeGreaterThan(0) // Shared struggle builds intimacy
    })

    it('should update character relationship levels', async () => {
      const initialIntimacy = mockCharacter.relationship.intimacyLevel
      const initialTrust = mockCharacter.relationship.trustLevel

      const result: BattleResult = {
        victory: true,
        turns: 5,
        battleLog: [],
        statistics: {
          totalDamageDealt: 150,
          totalDamageReceived: 30,
          totalHealing: 0,
          skillsUsed: 4,
          criticalHits: 1,
          missedAttacks: 0,
          statusEffectsApplied: 2,
        },
        rewards: { experience: 80, gold: 40, items: [] },
        experienceGained: { player: 40, companion: 30 },
      }

      await service.processBattleResults(result, mockCharacter)

      expect(mockCharacter.relationship.intimacyLevel).toBeGreaterThan(initialIntimacy)
      expect(mockCharacter.relationship.trustLevel).toBeGreaterThan(initialTrust)
      expect(mockCharacter.relationship.totalInteractions).toBe(26) // Incremented by 1
    })

    it('should apply personality growth from battle experience', async () => {
      const initialPersonality = { ...mockCharacter.personality.core }

      const victoryResult: BattleResult = {
        victory: true,
        turns: 6,
        battleLog: [],
        statistics: {
          totalDamageDealt: 180,
          totalDamageReceived: 40,
          totalHealing: 0,
          skillsUsed: 8, // High skill usage
          criticalHits: 3,
          missedAttacks: 1,
          statusEffectsApplied: 4,
        },
        rewards: { experience: 90, gold: 45, items: [] },
        experienceGained: { player: 45, companion: 35 },
      }

      const rewards = await service.processBattleResults(victoryResult, mockCharacter)

      expect(rewards.personalityGrowth).toBeDefined()
      expect(Object.keys(rewards.personalityGrowth).length).toBeGreaterThan(0)
      
      // Victory should build independence and cheerfulness
      expect(rewards.personalityGrowth.independent).toBeGreaterThan(0)
      expect(rewards.personalityGrowth.cheerful).toBeGreaterThan(0)
    })

    it('should detect battle achievements', async () => {
      const perfectVictoryResult: BattleResult = {
        victory: true,
        turns: 3,
        battleLog: [],
        statistics: {
          totalDamageDealt: 300,
          totalDamageReceived: 0, // Perfect - no damage received
          totalHealing: 0,
          skillsUsed: 12, // Many skills used
          criticalHits: 5,
          missedAttacks: 0,
          statusEffectsApplied: 6,
        },
        rewards: { experience: 120, gold: 60, items: [] },
        experienceGained: { player: 60, companion: 50 },
      }

      const rewards = await service.processBattleResults(perfectVictoryResult, mockCharacter)

      expect(rewards.achievements).toContain('flawless_victory')
      expect(rewards.achievements).toContain('skill_master')
    })
  })

  describe('getBattleEffectiveness', () => {
    it('should provide accurate battle effectiveness assessment', () => {
      const effectiveness = service.getBattleEffectiveness(mockCharacter)

      expect(effectiveness.overallRating).toBeGreaterThan(0)
      expect(effectiveness.overallRating).toBeLessThanOrEqual(1)
      expect(effectiveness.strengths).toBeInstanceOf(Array)
      expect(effectiveness.weaknesses).toBeInstanceOf(Array)
      expect(effectiveness.suggestedImprovements).toBeInstanceOf(Array)
    })

    it('should identify personality-based strengths', () => {
      const supportiveCharacter = createMockCharacter({
        personality: {
          ...mockCharacter.personality,
          core: {
            ...mockCharacter.personality.core,
            caring: 0.9, // High caring
            supportive: 0.8, // High supportive
          },
        },
      })

      const effectiveness = service.getBattleEffectiveness(supportiveCharacter)
      expect(effectiveness.strengths).toContain('Supportive teammate')
    })

    it('should identify areas for improvement', () => {
      const lowLevelCharacter = createMockCharacter({
        relationship: {
          ...mockCharacter.relationship,
          totalInteractions: 5, // Very low level
        },
      })

      const effectiveness = service.getBattleEffectiveness(lowLevelCharacter)
      expect(effectiveness.suggestedImprovements).toContain('Gain more battle experience through training')
    })
  })

  describe('Performance Metrics', () => {
    it('should track performance metrics correctly', async () => {
      const result: BattleResult = {
        victory: true,
        turns: 7,
        battleLog: [],
        statistics: {
          totalDamageDealt: 160,
          totalDamageReceived: 60,
          totalHealing: 0,
          skillsUsed: 6,
          criticalHits: 2,
          missedAttacks: 1,
          statusEffectsApplied: 3,
        },
        rewards: { experience: 85, gold: 42, items: [] },
        experienceGained: { player: 42, companion: 33 },
      }

      await service.processBattleResults(result, mockCharacter)

      const metrics = service.getPerformanceHistory(mockCharacter.id)
      expect(metrics).toBeDefined()
      expect(metrics!.battlesWon).toBe(1)
      expect(metrics!.battlesLost).toBe(0)
      expect(metrics!.totalDamageDealt).toBe(160)
      expect(metrics!.totalDamageReceived).toBe(60)
    })

    it('should reset performance metrics when requested', () => {
      service.resetPerformanceMetrics(mockCharacter.id)
      const metrics = service.getPerformanceHistory(mockCharacter.id)
      expect(metrics).toBeNull()
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero-turn battles gracefully', async () => {
      const instantResult: BattleResult = {
        victory: true,
        turns: 0, // Instant victory
        battleLog: [],
        statistics: {
          totalDamageDealt: 999,
          totalDamageReceived: 0,
          totalHealing: 0,
          skillsUsed: 1,
          criticalHits: 1,
          missedAttacks: 0,
          statusEffectsApplied: 0,
        },
        rewards: { experience: 200, gold: 100, items: [] },
        experienceGained: { player: 100, companion: 80 },
      }

      const rewards = await service.processBattleResults(instantResult, mockCharacter)
      
      expect(rewards.experience.combat).toBeGreaterThan(0)
      expect(rewards.relationshipChange.intimacy).toBeGreaterThanOrEqual(0)
    })

    it('should handle characters with extreme personality traits', async () => {
      const extremeCharacter = createMockCharacter({
        personality: {
          ...mockCharacter.personality,
          core: {
            ...mockCharacter.personality.core,
            independent: 1.0, // Maximum independence
            emotional: 1.0, // Maximum emotional
            consistency: 0.0, // Minimum consistency
          },
        },
      })

      const baseFormation: Partial<BattleFormation> = {
        playerTeam: [createMockBattleUnit('companion')],
        enemyTeam: [createMockBattleUnit('enemy')],
      }

      const result = await service.setupBattleFormation(extremeCharacter, baseFormation)
      const companionUnit = result.playerTeam[0]

      // Should still produce valid stats despite extreme values
      expect(companionUnit.attack).toBeGreaterThan(0)
      expect(companionUnit.defense).toBeGreaterThan(0)
      expect(companionUnit.maxHp).toBeGreaterThan(0)
    })

    it('should handle relationship levels at maximum', async () => {
      const maxRelationshipCharacter = createMockCharacter({
        relationship: {
          ...mockCharacter.relationship,
          intimacyLevel: 10,
          trustLevel: 10,
        },
      })

      const result: BattleResult = {
        victory: true,
        turns: 5,
        battleLog: [],
        statistics: {
          totalDamageDealt: 200,
          totalDamageReceived: 20,
          totalHealing: 0,
          skillsUsed: 7,
          criticalHits: 3,
          missedAttacks: 0,
          statusEffectsApplied: 4,
        },
        rewards: { experience: 100, gold: 50, items: [] },
        experienceGained: { player: 50, companion: 40 },
      }

      const initialIntimacy = maxRelationshipCharacter.relationship.intimacyLevel
      const initialTrust = maxRelationshipCharacter.relationship.trustLevel

      await service.processBattleResults(result, maxRelationshipCharacter)

      // Should not exceed maximum values
      expect(maxRelationshipCharacter.relationship.intimacyLevel).toBeLessThanOrEqual(10)
      expect(maxRelationshipCharacter.relationship.trustLevel).toBeLessThanOrEqual(10)
      expect(maxRelationshipCharacter.relationship.intimacyLevel).toBeGreaterThanOrEqual(initialIntimacy)
      expect(maxRelationshipCharacter.relationship.trustLevel).toBeGreaterThanOrEqual(initialTrust)
    })
  })
})