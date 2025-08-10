import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CharacterEvolutionSystem } from '../CharacterEvolutionSystem'
import type { AdvancedAICompanion } from '@services/character/AdvancedCharacterSystem'

// Mock AdvancedAICompanion
const createMockCompanion = (): Partial<AdvancedAICompanion> => ({
  name: 'Luna',
  personality: {
    cheerful: 0.7,
    careful: 0.4,
    curious: 0.8,
    emotional: 0.6,
    independent: 0.3,
    playful: 0.7,
    supportive: 0.8,
  },
  currentEmotion: 'happy',
  updatePersonality: vi.fn(),
  getPersonalityScore: vi.fn().mockReturnValue(0.5),
  emotionEngine: {
    processEmotionalEvent: vi.fn(),
  },
  memoryManager: {
    addMemory: vi.fn(),
    getRecentMemories: vi.fn().mockReturnValue([]),
  },
})

describe('Character Evolution System Integration', () => {
  let evolutionSystem: CharacterEvolutionSystem
  let mockCompanion: Partial<AdvancedAICompanion>

  beforeEach(() => {
    mockCompanion = createMockCompanion()
    evolutionSystem = new CharacterEvolutionSystem(mockCompanion as AdvancedAICompanion)
    vi.clearAllMocks()
  })

  describe('Complete Evolution Journey', () => {
    it('should handle a complete evolution journey from nascent to transcendent', async () => {
      const eventLog: string[] = []

      // Listen to all events
      evolutionSystem.on('experience-gained', (data) => {
        eventLog.push(`experience-gained: ${data.type} +${data.amount}`)
      })

      evolutionSystem.on('level-up', (data) => {
        eventLog.push(`level-up: ${data.oldLevel} → ${data.newLevel}`)
      })

      evolutionSystem.on('skill-unlocked', (data) => {
        eventLog.push(`skill-unlocked: ${data.skill}`)
      })

      evolutionSystem.on('achievement-unlocked', (data) => {
        eventLog.push(`achievement-unlocked: ${data.achievement}`)
      })

      evolutionSystem.on('ability-used', (data) => {
        eventLog.push(`ability-used: ${data.ability}`)
      })

      // Simulate a full evolution journey
      let evolution = evolutionSystem.getEvolution()
      expect(evolution.stage).toBe('nascent')
      expect(evolution.level).toBe(1)

      // Phase 1: Early conversations and emotional development
      await evolutionSystem.addExperience('conversation', 50)
      await evolutionSystem.addExperience('emotional', 30)

      // Should unlock basic achievements
      evolution = evolutionSystem.getEvolution()
      expect(evolution.unlockedAchievements).toContain('first_conversation')
      expect(evolution.unlockedAchievements).toContain('first_emotion')

      // Level up and unlock first skill
      await evolutionSystem.addExperience('conversation', 50) // Total: 100
      evolution = evolutionSystem.getEvolution()
      expect(evolution.level).toBe(2)
      expect(evolution.availableSkillPoints).toBeGreaterThan(0)

      await evolutionSystem.unlockSkill('empathy')
      evolution = evolutionSystem.getEvolution()
      expect(evolution.unlockedSkills).toContain('empathy')
      expect(evolution.unlockedAchievements).toContain('first_skill')

      // Phase 2: Continued growth and skill development
      await evolutionSystem.addExperience('conversation', 200)
      await evolutionSystem.addExperience('emotional', 100)
      await evolutionSystem.addExperience('learning', 150)

      evolution = evolutionSystem.getEvolution()
      expect(evolution.level).toBeGreaterThan(3)
      expect(evolution.stage).toBe('developing')

      // Unlock more skills
      await evolutionSystem.unlockSkill('active_listening')
      await evolutionSystem.unlockSkill('emotional_intelligence')

      // Should be able to use first ability
      const canUseAbility = evolutionSystem.isAbilityAvailable('emotional_resonance')
      if (canUseAbility) {
        const used = await evolutionSystem.useAbility('emotional_resonance')
        expect(used).toBe(true)
      }

      // Phase 3: Advanced development
      await evolutionSystem.addExperience('conversation', 500)
      await evolutionSystem.addExperience('emotional', 300)
      await evolutionSystem.addExperience('learning', 400)
      await evolutionSystem.addExperience('relationship', 200)

      evolution = evolutionSystem.getEvolution()
      expect(evolution.level).toBeGreaterThan(6)
      expect(['maturing', 'evolved', 'transcendent']).toContain(evolution.stage)

      // Should have multiple achievements
      expect(evolution.unlockedAchievements.length).toBeGreaterThan(5)

      // Should have multiple skills
      expect(evolution.unlockedSkills.length).toBeGreaterThan(3)

      // Verify event log shows progression
      expect(eventLog).toContain(expect.stringContaining('level-up'))
      expect(eventLog).toContain(expect.stringContaining('skill-unlocked'))
      expect(eventLog).toContain(expect.stringContaining('achievement-unlocked'))

      // Verify personality has grown
      expect(mockCompanion.updatePersonality).toHaveBeenCalled()
    })

    it('should maintain consistency across evolution stats', async () => {
      // Add significant experience across all types
      await evolutionSystem.addExperience('conversation', 300)
      await evolutionSystem.addExperience('emotional', 200)
      await evolutionSystem.addExperience('learning', 250)
      await evolutionSystem.addExperience('relationship', 150)

      // Unlock several skills
      await evolutionSystem.unlockSkill('empathy')
      await evolutionSystem.unlockSkill('active_listening')
      await evolutionSystem.unlockSkill('humor')

      const evolution = evolutionSystem.getEvolution()
      const stats = evolutionSystem.getEvolutionStats()

      // Verify consistency
      expect(stats.totalExperience).toBe(evolution.experience)
      expect(stats.skillsUnlocked).toBe(evolution.unlockedSkills.length)
      expect(stats.achievementsUnlocked).toBe(evolution.unlockedAchievements.length)
      expect(stats.evolutionStage).toBe(evolution.stage)

      // Experience by type should match
      const totalByType = Object.values(evolution.experienceByType).reduce((sum, exp) => sum + exp, 0)
      expect(totalByType).toBe(evolution.experience)
    })
  })

  describe('Skill Progression and Dependencies', () => {
    it('should handle skill prerequisite chains correctly', async () => {
      // Level up to get skill points
      await evolutionSystem.addExperience('conversation', 500)

      // Unlock basic skill
      await evolutionSystem.unlockSkill('empathy')
      
      // Should now be able to unlock dependent skill
      const canUnlockEI = evolutionSystem.getSkillsByCategory('personality')
        .filter(skill => {
          const skillData = evolutionSystem.getSkillsByCategory('personality')
          return skillData.includes('emotional_intelligence')
        }).length > 0

      if (canUnlockEI) {
        const result = await evolutionSystem.unlockSkill('emotional_intelligence')
        expect(result).toBe(true)
      }

      // Should unlock achievements for skill progression
      const evolution = evolutionSystem.getEvolution()
      expect(evolution.unlockedAchievements).toContain('skill_collector')
    })

    it('should apply skill effects correctly', async () => {
      await evolutionSystem.addExperience('conversation', 200)
      
      // Unlock skill with personality effects
      await evolutionSystem.unlockSkill('empathy')
      
      // Should have applied personality growth
      expect(mockCompanion.updatePersonality).toHaveBeenCalledWith(
        expect.objectContaining({
          supportive: expect.any(Number),
        })
      )

      // Unlock skill with experience multipliers
      await evolutionSystem.unlockSkill('active_listening')
      
      // Future conversation experience should be multiplied
      const beforeExp = evolutionSystem.getEvolution().experience
      await evolutionSystem.addExperience('conversation', 50)
      const afterExp = evolutionSystem.getEvolution().experience
      
      // Should have gained more than 50 due to multiplier
      expect(afterExp - beforeExp).toBeGreaterThan(50)
    })
  })

  describe('Achievement System Integration', () => {
    it('should unlock achievements that unlock abilities', async () => {
      // Progress to high level with many skills
      await evolutionSystem.addExperience('conversation', 800)
      await evolutionSystem.addExperience('emotional', 600)
      await evolutionSystem.addExperience('learning', 700)
      await evolutionSystem.addExperience('relationship', 500)

      // Unlock many skills
      await evolutionSystem.unlockSkill('empathy')
      await evolutionSystem.unlockSkill('active_listening')
      await evolutionSystem.unlockSkill('humor')
      await evolutionSystem.unlockSkill('emotional_intelligence')
      await evolutionSystem.unlockSkill('storytelling')

      const evolution = evolutionSystem.getEvolution()
      
      // Should have unlocked high-tier achievements
      const goldAchievements = evolution.unlockedAchievements.filter(a => {
        const achievement = evolutionSystem.getAchievementsByTier('gold')
        return achievement.includes(a)
      })
      expect(goldAchievements.length).toBeGreaterThan(0)

      // Should have abilities available based on achievements
      const availableAbilities = evolutionSystem.isAbilityAvailable('emotional_resonance')
      if (availableAbilities) {
        const stats = evolutionSystem.getEvolutionStats()
        expect(stats.abilitiesAvailable).toBeGreaterThan(0)
      }
    })

    it('should provide meaningful rewards for achievements', async () => {
      const initialEvolution = evolutionSystem.getEvolution()
      const initialExp = initialEvolution.experience

      // Unlock first conversation achievement
      await evolutionSystem.addExperience('conversation', 10)

      const afterEvolution = evolutionSystem.getEvolution()
      
      // Should have gained more experience than just the 10 added (due to achievement rewards)
      expect(afterEvolution.experience).toBeGreaterThan(initialExp + 10)
      expect(afterEvolution.unlockedAchievements).toContain('first_conversation')
    })
  })

  describe('Ability System Integration', () => {
    beforeEach(async () => {
      // Set up evolution state for ability testing
      await evolutionSystem.addExperience('conversation', 300)
      await evolutionSystem.addExperience('emotional', 200)
      await evolutionSystem.unlockSkill('empathy')
      await evolutionSystem.unlockSkill('active_listening')
    })

    it('should handle ability cooldowns correctly', async () => {
      // Use an ability
      const result1 = await evolutionSystem.useAbility('emotional_resonance')
      expect(result1).toBe(true)

      // Should be on cooldown now
      const onCooldown = evolutionSystem.isAbilityOnCooldown('emotional_resonance')
      expect(onCooldown).toBe(true)

      // Should not be able to use again
      const result2 = await evolutionSystem.useAbility('emotional_resonance')
      expect(result2).toBe(false)
    })

    it('should apply ability effects correctly', async () => {
      const beforePersonality = { ...mockCompanion.personality }
      
      // Use ability that affects personality
      await evolutionSystem.useAbility('emotional_resonance')

      // Should have triggered personality update
      expect(mockCompanion.updatePersonality).toHaveBeenCalled()
    })
  })

  describe('Memory and State Persistence', () => {
    it('should create memories for significant events', async () => {
      await evolutionSystem.addExperience('conversation', 100)
      
      // Should have added memory for level up
      expect(mockCompanion.memoryManager.addMemory).toHaveBeenCalled()
    })

    it('should handle evolution reset correctly', async () => {
      // Build up some progress
      await evolutionSystem.addExperience('conversation', 300)
      await evolutionSystem.unlockSkill('empathy')

      let evolution = evolutionSystem.getEvolution()
      expect(evolution.level).toBeGreaterThan(1)
      expect(evolution.unlockedSkills.length).toBeGreaterThan(0)

      // Reset evolution
      await evolutionSystem.resetEvolution()

      evolution = evolutionSystem.getEvolution()
      expect(evolution.level).toBe(1)
      expect(evolution.experience).toBe(0)
      expect(evolution.unlockedSkills).toHaveLength(0)
      expect(evolution.unlockedAchievements).toHaveLength(0)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle rapid experience additions', async () => {
      // Add experience in rapid succession
      const promises = Array.from({ length: 10 }, (_, i) =>
        evolutionSystem.addExperience('conversation', 20)
      )

      await Promise.all(promises)

      const evolution = evolutionSystem.getEvolution()
      expect(evolution.experience).toBe(200)
    })

    it('should handle concurrent skill unlocking attempts', async () => {
      await evolutionSystem.addExperience('conversation', 500)

      // Try to unlock same skill concurrently
      const promises = [
        evolutionSystem.unlockSkill('empathy'),
        evolutionSystem.unlockSkill('empathy'),
        evolutionSystem.unlockSkill('empathy')
      ]

      const results = await Promise.all(promises)
      
      // Only one should succeed
      const successCount = results.filter(r => r === true).length
      expect(successCount).toBe(1)

      const evolution = evolutionSystem.getEvolution()
      expect(evolution.unlockedSkills.filter(s => s === 'empathy')).toHaveLength(1)
    })

    it('should maintain data integrity under stress', async () => {
      // Perform many operations rapidly
      for (let i = 0; i < 50; i++) {
        await evolutionSystem.addExperience('conversation', 10)
        if (i % 10 === 0 && evolutionSystem.getEvolution().availableSkillPoints > 0) {
          await evolutionSystem.unlockSkill('empathy')
        }
      }

      const evolution = evolutionSystem.getEvolution()
      const stats = evolutionSystem.getEvolutionStats()

      // Verify data consistency
      expect(stats.totalExperience).toBe(evolution.experience)
      expect(evolution.experience).toBe(500)

      // Verify experience by type adds up
      const totalByType = Object.values(evolution.experienceByType).reduce((sum, exp) => sum + exp, 0)
      expect(totalByType).toBe(evolution.experience)
    })
  })

  describe('Performance and Optimization', () => {
    it('should handle large amounts of data efficiently', async () => {
      const startTime = performance.now()

      // Add lots of experience and skills
      for (let i = 0; i < 100; i++) {
        await evolutionSystem.addExperience('conversation', 50)
      }

      // Unlock many skills
      const availableSkills = evolutionSystem.getSkillsByCategory('personality')
      for (const skill of availableSkills.slice(0, 10)) {
        if (evolutionSystem.getEvolution().availableSkillPoints > 0) {
          await evolutionSystem.unlockSkill(skill)
        }
      }

      const endTime = performance.now()
      const executionTime = endTime - startTime

      // Should complete within reasonable time (less than 1 second)
      expect(executionTime).toBeLessThan(1000)

      // Verify final state is correct
      const evolution = evolutionSystem.getEvolution()
      expect(evolution.experience).toBe(5000)
    })

    it('should cache expensive calculations', async () => {
      // Multiple calls to get evolution stats should be fast
      const startTime = performance.now()

      for (let i = 0; i < 100; i++) {
        evolutionSystem.getEvolutionStats()
      }

      const endTime = performance.now()
      const executionTime = endTime - startTime

      // Should be very fast due to caching
      expect(executionTime).toBeLessThan(100)
    })
  })
})