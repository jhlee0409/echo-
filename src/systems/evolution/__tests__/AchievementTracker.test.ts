import { describe, it, expect, beforeEach } from 'vitest'
import { AchievementTracker } from '../AchievementTracker'
import type { AchievementId, AchievementTier, CharacterEvolution } from '../types'

describe('AchievementTracker', () => {
  let tracker: AchievementTracker

  beforeEach(() => {
    tracker = new AchievementTracker()
  })

  describe('Achievement Information', () => {
    it('should return correct achievement information', () => {
      const firstConv = tracker.getAchievement('first_conversation')
      expect(firstConv).toBeDefined()
      expect(firstConv?.name).toBe('First Words')
      expect(firstConv?.tier).toBe('bronze')
      expect(firstConv?.description).toContain('first conversation')
    })

    it('should return all achievements', () => {
      const allAchievements = tracker.getAllAchievements()
      expect(allAchievements.size).toBeGreaterThan(30) // Should have many achievements
      expect(allAchievements.has('first_conversation')).toBe(true)
      expect(allAchievements.has('transcendent_being')).toBe(true)
    })

    it('should get achievements by tier', () => {
      const bronzeAchievements = tracker.getAchievementsByTier('bronze')
      expect(bronzeAchievements).toContain('first_conversation')
      expect(bronzeAchievements).toContain('first_emotion')

      const masterAchievements = tracker.getAchievementsByTier('master')
      expect(masterAchievements).toContain('transcendent_being')
      expect(masterAchievements).toContain('perfect_companion')
    })

    it('should return undefined for invalid achievement', () => {
      const invalid = tracker.getAchievement('invalid_achievement' as AchievementId)
      expect(invalid).toBeUndefined()
    })
  })

  describe('Achievement Checking', () => {
    const createEvolution = (overrides: Partial<CharacterEvolution> = {}): CharacterEvolution => ({
      level: 1,
      experience: 0,
      stage: 'nascent',
      experienceByType: {
        conversation: 0,
        emotional: 0,
        learning: 0,
        relationship: 0,
      },
      unlockedSkills: [],
      availableSkillPoints: 0,
      unlockedAchievements: [],
      abilityCooldowns: {},
      personalityGrowth: {
        cheerful: 0,
        careful: 0,
        curious: 0,
        emotional: 0,
        independent: 0,
        playful: 0,
        supportive: 0,
      },
      ...overrides,
    })

    describe('Conversation Achievements', () => {
      it('should unlock first_conversation achievement', () => {
        const evolution = createEvolution({
          experienceByType: { conversation: 10, emotional: 0, learning: 0, relationship: 0 }
        })

        const newAchievements = tracker.checkAchievements(evolution)
        expect(newAchievements).toContain('first_conversation')
      })

      it('should unlock conversationalist achievement', () => {
        const evolution = createEvolution({
          experienceByType: { conversation: 100, emotional: 0, learning: 0, relationship: 0 }
        })

        const newAchievements = tracker.checkAchievements(evolution)
        expect(newAchievements).toContain('conversationalist')
      })

      it('should unlock master_conversationalist achievement', () => {
        const evolution = createEvolution({
          experienceByType: { conversation: 1000, emotional: 0, learning: 0, relationship: 0 }
        })

        const newAchievements = tracker.checkAchievements(evolution)
        expect(newAchievements).toContain('master_conversationalist')
      })
    })

    describe('Emotional Achievements', () => {
      it('should unlock first_emotion achievement', () => {
        const evolution = createEvolution({
          experienceByType: { conversation: 0, emotional: 5, learning: 0, relationship: 0 }
        })

        const newAchievements = tracker.checkAchievements(evolution)
        expect(newAchievements).toContain('first_emotion')
      })

      it('should unlock empathetic_soul achievement', () => {
        const evolution = createEvolution({
          experienceByType: { conversation: 0, emotional: 200, learning: 0, relationship: 0 }
        })

        const newAchievements = tracker.checkAchievements(evolution)
        expect(newAchievements).toContain('empathetic_soul')
      })

      it('should unlock emotional_master achievement', () => {
        const evolution = createEvolution({
          experienceByType: { conversation: 0, emotional: 800, learning: 0, relationship: 0 }
        })

        const newAchievements = tracker.checkAchievements(evolution)
        expect(newAchievements).toContain('emotional_master')
      })
    })

    describe('Learning Achievements', () => {
      it('should unlock first_lesson achievement', () => {
        const evolution = createEvolution({
          experienceByType: { conversation: 0, emotional: 0, learning: 15, relationship: 0 }
        })

        const newAchievements = tracker.checkAchievements(evolution)
        expect(newAchievements).toContain('first_lesson')
      })

      it('should unlock quick_learner achievement', () => {
        const evolution = createEvolution({
          experienceByType: { conversation: 0, emotional: 0, learning: 150, relationship: 0 }
        })

        const newAchievements = tracker.checkAchievements(evolution)
        expect(newAchievements).toContain('quick_learner')
      })

      it('should unlock knowledge_seeker achievement', () => {
        const evolution = createEvolution({
          experienceByType: { conversation: 0, emotional: 0, learning: 600, relationship: 0 }
        })

        const newAchievements = tracker.checkAchievements(evolution)
        expect(newAchievements).toContain('knowledge_seeker')
      })
    })

    describe('Relationship Achievements', () => {
      it('should unlock first_bond achievement', () => {
        const evolution = createEvolution({
          experienceByType: { conversation: 0, emotional: 0, learning: 0, relationship: 20 }
        })

        const newAchievements = tracker.checkAchievements(evolution)
        expect(newAchievements).toContain('first_bond')
      })

      it('should unlock trusted_friend achievement', () => {
        const evolution = createEvolution({
          experienceByType: { conversation: 0, emotional: 0, learning: 0, relationship: 300 }
        })

        const newAchievements = tracker.checkAchievements(evolution)
        expect(newAchievements).toContain('trusted_friend')
      })

      it('should unlock soulmate achievement', () => {
        const evolution = createEvolution({
          experienceByType: { conversation: 0, emotional: 0, learning: 0, relationship: 1000 }
        })

        const newAchievements = tracker.checkAchievements(evolution)
        expect(newAchievements).toContain('soulmate')
      })
    })

    describe('Level Achievements', () => {
      it('should unlock level_up achievement', () => {
        const evolution = createEvolution({ level: 2 })

        const newAchievements = tracker.checkAchievements(evolution)
        expect(newAchievements).toContain('level_up')
      })

      it('should unlock experienced achievement', () => {
        const evolution = createEvolution({ level: 5 })

        const newAchievements = tracker.checkAchievements(evolution)
        expect(newAchievements).toContain('experienced')
      })

      it('should unlock veteran achievement', () => {
        const evolution = createEvolution({ level: 10 })

        const newAchievements = tracker.checkAchievements(evolution)
        expect(newAchievements).toContain('veteran')
      })
    })

    describe('Skill Achievements', () => {
      it('should unlock first_skill achievement', () => {
        const evolution = createEvolution({
          unlockedSkills: ['empathy']
        })

        const newAchievements = tracker.checkAchievements(evolution)
        expect(newAchievements).toContain('first_skill')
      })

      it('should unlock skill_collector achievement', () => {
        const evolution = createEvolution({
          unlockedSkills: ['empathy', 'active_listening', 'humor', 'emotional_intelligence', 'storytelling']
        })

        const newAchievements = tracker.checkAchievements(evolution)
        expect(newAchievements).toContain('skill_collector')
      })

      it('should unlock master_of_all achievement', () => {
        const evolution = createEvolution({
          unlockedSkills: Array.from({ length: 20 }, (_, i) => `skill_${i}`) as any
        })

        const newAchievements = tracker.checkAchievements(evolution)
        expect(newAchievements).toContain('master_of_all')
      })
    })

    describe('Stage Evolution Achievements', () => {
      it('should unlock developing_mind achievement', () => {
        const evolution = createEvolution({ stage: 'developing' })

        const newAchievements = tracker.checkAchievements(evolution)
        expect(newAchievements).toContain('developing_mind')
      })

      it('should unlock mature_companion achievement', () => {
        const evolution = createEvolution({ stage: 'maturing' })

        const newAchievements = tracker.checkAchievements(evolution)
        expect(newAchievements).toContain('mature_companion')
      })

      it('should unlock evolved_being achievement', () => {
        const evolution = createEvolution({ stage: 'evolved' })

        const newAchievements = tracker.checkAchievements(evolution)
        expect(newAchievements).toContain('evolved_being')
      })

      it('should unlock transcendent_being achievement', () => {
        const evolution = createEvolution({ stage: 'transcendent' })

        const newAchievements = tracker.checkAchievements(evolution)
        expect(newAchievements).toContain('transcendent_being')
      })
    })

    describe('Combined Achievements', () => {
      it('should unlock well_rounded achievement', () => {
        const evolution = createEvolution({
          experienceByType: {
            conversation: 100,
            emotional: 100,
            learning: 100,
            relationship: 100,
          }
        })

        const newAchievements = tracker.checkAchievements(evolution)
        expect(newAchievements).toContain('well_rounded')
      })

      it('should unlock perfect_companion achievement', () => {
        const evolution = createEvolution({
          level: 10,
          stage: 'transcendent',
          experienceByType: {
            conversation: 500,
            emotional: 500,
            learning: 500,
            relationship: 500,
          },
          unlockedSkills: Array.from({ length: 15 }, (_, i) => `skill_${i}`) as any
        })

        const newAchievements = tracker.checkAchievements(evolution)
        expect(newAchievements).toContain('perfect_companion')
      })
    })
  })

  describe('Achievement Rewards', () => {
    it('should provide experience rewards', () => {
      const achievement = tracker.getAchievement('first_conversation')
      expect(achievement?.rewards.experience).toBeGreaterThan(0)
    })

    it('should provide skill point rewards for higher tier achievements', () => {
      const goldAchievement = tracker.getAchievementsByTier('gold')[0]
      const achievement = tracker.getAchievement(goldAchievement)
      expect(achievement?.rewards.skillPoints).toBeGreaterThan(0)
    })

    it('should provide personality boosts for relevant achievements', () => {
      const empathyAchievement = tracker.getAchievement('empathetic_soul')
      expect(empathyAchievement?.rewards.personalityBoost).toBeDefined()
      expect(empathyAchievement?.rewards.personalityBoost?.supportive).toBeGreaterThan(0)
    })

    it('should provide abilities for master tier achievements', () => {
      const masterAchievements = tracker.getAchievementsByTier('master')
      const masterAchievement = tracker.getAchievement(masterAchievements[0])
      expect(masterAchievement?.rewards.abilities).toBeDefined()
      expect(masterAchievement?.rewards.abilities?.length).toBeGreaterThan(0)
    })
  })

  describe('Already Unlocked Achievements', () => {
    it('should not return already unlocked achievements', () => {
      const evolution = createEvolution({
        experienceByType: { conversation: 10, emotional: 0, learning: 0, relationship: 0 },
        unlockedAchievements: ['first_conversation']
      })

      const newAchievements = tracker.checkAchievements(evolution)
      expect(newAchievements).not.toContain('first_conversation')
    })

    it('should only return new achievements', () => {
      const evolution = createEvolution({
        experienceByType: { conversation: 200, emotional: 0, learning: 0, relationship: 0 },
        unlockedAchievements: ['first_conversation'] // Already has this one
      })

      const newAchievements = tracker.checkAchievements(evolution)
      expect(newAchievements).toContain('conversationalist')
      expect(newAchievements).not.toContain('first_conversation')
    })
  })

  describe('Achievement Validation', () => {
    it('should have valid achievement structure', () => {
      const allAchievements = tracker.getAllAchievements()
      
      for (const [achievementId, achievement] of allAchievements) {
        expect(achievement.id).toBe(achievementId)
        expect(achievement.name).toBeDefined()
        expect(achievement.description).toBeDefined()
        expect(['bronze', 'silver', 'gold', 'platinum', 'master']).toContain(achievement.tier)
        expect(achievement.condition).toBeDefined()
        expect(achievement.rewards).toBeDefined()
        expect(achievement.rewards.experience).toBeGreaterThanOrEqual(0)
      }
    })

    it('should have achievements distributed across tiers', () => {
      const tiers: AchievementTier[] = ['bronze', 'silver', 'gold', 'platinum', 'master']
      
      for (const tier of tiers) {
        const achievementsInTier = tracker.getAchievementsByTier(tier)
        expect(achievementsInTier.length).toBeGreaterThan(0)
      }
    })

    it('should have reasonable reward scaling by tier', () => {
      const bronze = tracker.getAchievementsByTier('bronze')[0]
      const master = tracker.getAchievementsByTier('master')[0]
      
      const bronzeReward = tracker.getAchievement(bronze)?.rewards.experience || 0
      const masterReward = tracker.getAchievement(master)?.rewards.experience || 0
      
      expect(masterReward).toBeGreaterThan(bronzeReward)
    })
  })

  describe('Edge Cases', () => {
    it('should handle evolution with no progress', () => {
      const evolution = createEvolution()
      const newAchievements = tracker.checkAchievements(evolution)
      expect(Array.isArray(newAchievements)).toBe(true)
    })

    it('should handle invalid tier queries', () => {
      const achievements = tracker.getAchievementsByTier('invalid' as AchievementTier)
      expect(achievements).toHaveLength(0)
    })

    it('should handle evolution with all achievements unlocked', () => {
      const allAchievements = tracker.getAllAchievements()
      const evolution = createEvolution({
        unlockedAchievements: Array.from(allAchievements.keys())
      })

      const newAchievements = tracker.checkAchievements(evolution)
      expect(newAchievements).toHaveLength(0)
    })
  })
})