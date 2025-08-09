import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CharacterEvolutionSystem } from '../CharacterEvolutionSystem'
import { AdvancedAICompanion } from '@/systems/advanced/AdvancedAICompanion'
import type {
  ExperienceType,
  SkillCategory,
  AchievementTier,
  SkillRequirement,
  AbilityRequirement,
  CharacterEvolution,
} from '../types'

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

describe('CharacterEvolutionSystem', () => {
  let evolutionSystem: CharacterEvolutionSystem
  let mockCompanion: Partial<AdvancedAICompanion>

  beforeEach(() => {
    mockCompanion = createMockCompanion()
    evolutionSystem = new CharacterEvolutionSystem(mockCompanion as AdvancedAICompanion)
    vi.clearAllMocks()
  })

  describe('Experience System', () => {
    it('should add conversation experience correctly', async () => {
      const initialExp = evolutionSystem.getEvolution().experience

      await evolutionSystem.addExperience('conversation', 50)

      const evolution = evolutionSystem.getEvolution()
      expect(evolution.experience).toBe(50) // Total experience should be 50
      expect(evolution.experienceByType.conversation).toBe(50)
    })

    it('should add emotional experience correctly', async () => {
      await evolutionSystem.addExperience('emotional', 30)

      const evolution = evolutionSystem.getEvolution()
      expect(evolution.experienceByType.emotional).toBe(30)
    })

    it('should add learning experience correctly', async () => {
      await evolutionSystem.addExperience('learning', 40)

      const evolution = evolutionSystem.getEvolution()
      expect(evolution.experienceByType.learning).toBe(40)
    })

    it('should add relationship experience correctly', async () => {
      await evolutionSystem.addExperience('relationship', 25)

      const evolution = evolutionSystem.getEvolution()
      expect(evolution.experienceByType.relationship).toBe(25)
    })

    it('should emit experience-gained event', async () => {
      const experienceGainedSpy = vi.fn()
      evolutionSystem.on('experience-gained', experienceGainedSpy)

      await evolutionSystem.addExperience('conversation', 50)

      expect(experienceGainedSpy).toHaveBeenCalledWith({
        type: 'conversation',
        amount: 50,
        total: 50,
        level: 1,
      })
    })
  })

  describe('Leveling System', () => {
    it('should level up when reaching experience threshold', async () => {
      const levelUpSpy = vi.fn()
      evolutionSystem.on('level-up', levelUpSpy)

      // Add enough experience to reach level 2 (100 XP)
      await evolutionSystem.addExperience('conversation', 100)

      const evolution = evolutionSystem.getEvolution()
      expect(evolution.level).toBe(2)
      expect(evolution.stage).toBe('developing')
      expect(levelUpSpy).toHaveBeenCalled()
    })

    it('should calculate experience requirement correctly for different levels', async () => {
      // Level 1: requires 100 XP to reach level 2
      expect(evolutionSystem.getExperienceToNextLevel()).toBe(100)

      // Level up to level 5 (need 1000+ XP)
      await evolutionSystem.addExperience('conversation', 1000)
      const evolution = evolutionSystem.getEvolution()
      expect(evolution.level).toBeGreaterThanOrEqual(5)
      expect(evolutionSystem.getExperienceToNextLevel()).toBe(evolution.level * 100)
    })

    it('should update evolution stage based on level', async () => {
      let evolution = evolutionSystem.getEvolution()
      expect(evolution.stage).toBe('nascent') // Level 1

      // Level to 4 (developing)
      await evolutionSystem.addExperience('conversation', 1000) // Add lots of XP
      evolution = evolutionSystem.getEvolution()
      expect(evolution.level).toBeGreaterThanOrEqual(4)
      expect(['developing', 'maturing', 'evolved', 'transcendent']).toContain(evolution.stage)
    })

    it('should unlock skill points on level up', async () => {
      const initialSkillPoints = evolutionSystem.getEvolution().availableSkillPoints // 0

      await evolutionSystem.addExperience('conversation', 100) // Reaches level 2

      const evolution = evolutionSystem.getEvolution()
      expect(evolution.availableSkillPoints).toBe(1) // Should gain 1 skill point for reaching level 2
    })
  })

  describe('Skill System', () => {
    beforeEach(async () => {
      // Level up to get skill points
      await evolutionSystem.addExperience('conversation', 200)
    })

    it('should unlock basic skills when requirements are met', async () => {
      const result = await evolutionSystem.unlockSkill('empathy')
      
      expect(result).toBe(true)
      const evolution = evolutionSystem.getEvolution()
      expect(evolution.unlockedSkills).toContain('empathy')
      expect(evolution.availableSkillPoints).toBe(1) // Should consume 1 point (from 2 to 1)
    })

    it('should not unlock skill without enough skill points', async () => {
      // First, spend all available skill points
      await evolutionSystem.unlockSkill('empathy')
      await evolutionSystem.unlockSkill('active_listening')
      
      // Now we should have 0 skill points
      const evolution = evolutionSystem.getEvolution()
      expect(evolution.availableSkillPoints).toBe(0)

      const result = await evolutionSystem.unlockSkill('humor')
      
      expect(result).toBe(false)
      expect(evolution.unlockedSkills).not.toContain('humor')
    })

    it('should not unlock already unlocked skill', async () => {
      await evolutionSystem.unlockSkill('empathy')
      const initialPoints = evolutionSystem.getEvolution().availableSkillPoints

      const result = await evolutionSystem.unlockSkill('empathy')
      
      expect(result).toBe(false)
      expect(evolutionSystem.getEvolution().availableSkillPoints).toBe(initialPoints)
    })

    it('should unlock advanced skills with prerequisites', async () => {
      // First unlock prerequisite
      await evolutionSystem.unlockSkill('empathy')
      
      // Give more skill points
      await evolutionSystem.addExperience('conversation', 200)
      
      const result = await evolutionSystem.unlockSkill('emotional_intelligence')
      expect(result).toBe(true)
    })

    it('should get skills by category correctly', () => {
      const personalitySkills = evolutionSystem.getSkillsByCategory('personality')
      expect(personalitySkills).toContain('empathy')
      expect(personalitySkills).toContain('emotional_intelligence')
      expect(personalitySkills).toContain('humor')
    })

    it('should emit skill-unlocked event', async () => {
      const skillUnlockedSpy = vi.fn()
      evolutionSystem.on('skill-unlocked', skillUnlockedSpy)

      await evolutionSystem.unlockSkill('empathy')

      expect(skillUnlockedSpy).toHaveBeenCalledWith({
        skill: 'empathy',
        category: 'personality',
        level: expect.any(Number),
      })
    })
  })

  describe('Achievement System', () => {
    it('should check and unlock conversation achievements', async () => {
      const achievementUnlockedSpy = vi.fn()
      evolutionSystem.on('achievement-unlocked', achievementUnlockedSpy)

      // Add enough conversation experience for first_conversation
      await evolutionSystem.addExperience('conversation', 10)

      const evolution = evolutionSystem.getEvolution()
      expect(evolution.unlockedAchievements).toContain('first_conversation')
      expect(achievementUnlockedSpy).toHaveBeenCalled()
    })

    it('should not unlock achievement twice', async () => {
      await evolutionSystem.addExperience('conversation', 10)
      const initialCount = evolutionSystem.getEvolution().unlockedAchievements.length

      await evolutionSystem.addExperience('conversation', 10)
      const finalCount = evolutionSystem.getEvolution().unlockedAchievements.length

      expect(finalCount).toBe(initialCount) // No new achievements
    })

    it('should unlock level-based achievements', async () => {
      await evolutionSystem.addExperience('conversation', 1000) // Level up multiple times

      const evolution = evolutionSystem.getEvolution()
      const levelAchievements = evolution.unlockedAchievements.filter(a => 
        a.includes('level_') || a.includes('evolved')
      )
      expect(levelAchievements.length).toBeGreaterThan(0)
    })

    it('should get achievements by tier', () => {
      const bronzeAchievements = evolutionSystem.getAchievementsByTier('bronze')
      expect(bronzeAchievements).toContain('first_conversation')
      expect(bronzeAchievements).toContain('first_emotion')

      const masterAchievements = evolutionSystem.getAchievementsByTier('master')
      expect(masterAchievements).toContain('transcendent_being')
    })
  })

  describe('Ability System', () => {
    beforeEach(async () => {
      // Level up and unlock some skills to meet ability requirements
      await evolutionSystem.addExperience('conversation', 500)
      await evolutionSystem.unlockSkill('empathy')
      await evolutionSystem.unlockSkill('active_listening')
    })

    it('should use ability when requirements are met', async () => {
      const result = await evolutionSystem.useAbility('emotional_resonance')
      
      expect(result).toBe(true)
      
      const evolution = evolutionSystem.getEvolution()
      expect(evolution.abilityCooldowns).toHaveProperty('emotional_resonance')
    })

    it('should not use ability on cooldown', async () => {
      await evolutionSystem.useAbility('emotional_resonance')
      
      const result = await evolutionSystem.useAbility('emotional_resonance')
      expect(result).toBe(false)
    })

    it('should check ability availability correctly', () => {
      const available = evolutionSystem.isAbilityAvailable('emotional_resonance')
      expect(available).toBe(true)
    })

    it('should check ability cooldown correctly', async () => {
      await evolutionSystem.useAbility('emotional_resonance')
      
      const onCooldown = evolutionSystem.isAbilityOnCooldown('emotional_resonance')
      expect(onCooldown).toBe(true)
    })

    it('should emit ability-used event', async () => {
      const abilityUsedSpy = vi.fn()
      evolutionSystem.on('ability-used', abilityUsedSpy)

      await evolutionSystem.useAbility('emotional_resonance')

      expect(abilityUsedSpy).toHaveBeenCalledWith({
        ability: 'emotional_resonance',
        cooldownUntil: expect.any(Number),
      })
    })
  })

  describe('Personality Growth', () => {
    it('should grow personality traits based on experience type', async () => {
      await evolutionSystem.addExperience('emotional', 100)

      expect(mockCompanion.updatePersonality).toHaveBeenCalledWith(
        expect.objectContaining({
          emotional: expect.any(Number),
        })
      )
    })

    it('should apply growth from skills', async () => {
      await evolutionSystem.addExperience('conversation', 200)
      await evolutionSystem.unlockSkill('empathy')

      expect(mockCompanion.updatePersonality).toHaveBeenCalledWith(
        expect.objectContaining({
          supportive: expect.any(Number),
        })
      )
    })
  })

  describe('Evolution State', () => {
    it('should return complete evolution state', () => {
      const evolution = evolutionSystem.getEvolution()

      expect(evolution).toHaveProperty('level')
      expect(evolution).toHaveProperty('experience')
      expect(evolution).toHaveProperty('stage')
      expect(evolution).toHaveProperty('experienceByType')
      expect(evolution).toHaveProperty('unlockedSkills')
      expect(evolution).toHaveProperty('availableSkillPoints')
      expect(evolution).toHaveProperty('unlockedAchievements')
      expect(evolution).toHaveProperty('abilityCooldowns')
    })

    it('should calculate evolution statistics correctly', () => {
      const stats = evolutionSystem.getEvolutionStats()

      expect(stats).toHaveProperty('totalExperience')
      expect(stats).toHaveProperty('skillsUnlocked')
      expect(stats).toHaveProperty('achievementsUnlocked')
      expect(stats).toHaveProperty('abilitiesAvailable')
      expect(stats).toHaveProperty('personalityGrowth')
      expect(stats).toHaveProperty('evolutionStage')
    })
  })

  describe('Reset and Persistence', () => {
    it('should reset evolution state', async () => {
      // Add some progress
      await evolutionSystem.addExperience('conversation', 200)
      await evolutionSystem.unlockSkill('empathy')

      await evolutionSystem.resetEvolution()

      const evolution = evolutionSystem.getEvolution()
      expect(evolution.level).toBe(1)
      expect(evolution.experience).toBe(0)
      expect(evolution.unlockedSkills).toHaveLength(0)
      expect(evolution.unlockedAchievements).toHaveLength(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle invalid experience type', async () => {
      await expect(
        evolutionSystem.addExperience('invalid' as ExperienceType, 50)
      ).rejects.toThrow()
    })

    it('should handle invalid skill unlock', async () => {
      const result = await evolutionSystem.unlockSkill('invalid_skill')
      expect(result).toBe(false)
    })

    it('should handle invalid ability use', async () => {
      const result = await evolutionSystem.useAbility('invalid_ability')
      expect(result).toBe(false)
    })

    it('should handle negative experience', async () => {
      await expect(
        evolutionSystem.addExperience('conversation', -50)
      ).rejects.toThrow()
    })
  })
})