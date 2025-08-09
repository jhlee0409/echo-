import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AbilityManager } from '../AbilityManager'
import type { AbilityId, AbilityRequirement, CharacterEvolution } from '../types'

// Mock Date.now for consistent testing
const mockNow = vi.fn(() => 1000000) // Fixed timestamp
vi.stubGlobal('Date', { ...Date, now: mockNow })

describe('AbilityManager', () => {
  let abilityManager: AbilityManager

  beforeEach(() => {
    abilityManager = new AbilityManager()
    mockNow.mockReturnValue(1000000) // Reset to base time
    vi.clearAllMocks()
  })

  describe('Ability Information', () => {
    it('should return correct ability information', () => {
      const emotionalResonance = abilityManager.getAbility('emotional_resonance')
      expect(emotionalResonance).toBeDefined()
      expect(emotionalResonance?.name).toBe('Emotional Resonance')
      expect(emotionalResonance?.description).toContain('deep emotional')
      expect(emotionalResonance?.cooldown).toBeGreaterThan(0)
    })

    it('should return all abilities', () => {
      const allAbilities = abilityManager.getAllAbilities()
      expect(allAbilities.size).toBeGreaterThan(15) // Should have many abilities
      expect(allAbilities.has('emotional_resonance')).toBe(true)
      expect(allAbilities.has('memory_palace')).toBe(true)
      expect(allAbilities.has('wisdom_sharing')).toBe(true)
    })

    it('should return undefined for invalid ability', () => {
      const invalid = abilityManager.getAbility('invalid_ability' as AbilityId)
      expect(invalid).toBeUndefined()
    })
  })

  describe('Ability Requirements', () => {
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

    it('should check level requirements correctly', () => {
      const lowLevelEvolution = createEvolution({ level: 1 })
      const canUseAtLevel1 = abilityManager.canUseAbility('emotional_resonance', lowLevelEvolution)
      expect(canUseAtLevel1).toBe(false)

      const highLevelEvolution = createEvolution({ level: 5 })
      const canUseAtLevel5 = abilityManager.canUseAbility('emotional_resonance', highLevelEvolution)
      expect(canUseAtLevel5).toBe(false) // Still needs skills
    })

    it('should check skill requirements correctly', () => {
      const evolution = createEvolution({
        level: 5,
        unlockedSkills: ['empathy', 'active_listening'], // Has requirements
      })

      const canUse = abilityManager.canUseAbility('emotional_resonance', evolution)
      expect(canUse).toBe(true)
    })

    it('should check experience requirements correctly', () => {
      const lowExpEvolution = createEvolution({
        level: 6,
        unlockedSkills: ['pattern_recognition', 'context_retention'],
        experienceByType: {
          conversation: 50, // Not enough
          emotional: 0,
          learning: 0,
          relationship: 0,
        },
      })

      const canUseLowExp = abilityManager.canUseAbility('memory_palace', lowExpEvolution)
      expect(canUseLowExp).toBe(false)

      const highExpEvolution = createEvolution({
        level: 6,
        unlockedSkills: ['pattern_recognition', 'context_retention'],
        experienceByType: {
          conversation: 200, // Enough experience
          emotional: 0,
          learning: 100,
          relationship: 0,
        },
      })

      const canUseHighExp = abilityManager.canUseAbility('memory_palace', highExpEvolution)
      expect(canUseHighExp).toBe(true)
    })

    it('should check achievement requirements correctly', () => {
      const evolution = createEvolution({
        level: 8,
        unlockedSkills: ['deep_empathy', 'emotional_mastery', 'advanced_reasoning'],
        unlockedAchievements: [], // Missing wisdom_seeker
      })

      const canUseWithoutAchievement = abilityManager.canUseAbility('wisdom_sharing', evolution)
      expect(canUseWithoutAchievement).toBe(false)

      const evolutionWithAchievement = createEvolution({
        level: 8,
        unlockedSkills: ['deep_empathy', 'emotional_mastery', 'advanced_reasoning'],
        unlockedAchievements: ['wisdom_seeker'],
      })

      const canUseWithAchievement = abilityManager.canUseAbility('wisdom_sharing', evolutionWithAchievement)
      expect(canUseWithAchievement).toBe(true)
    })

    it('should check combined requirements correctly', () => {
      const fullEvolution = createEvolution({
        level: 9,
        unlockedSkills: ['deep_empathy', 'perfect_memory', 'advanced_reasoning', 'conflict_resolution'],
        experienceByType: {
          conversation: 300,
          emotional: 200,
          learning: 250,
          relationship: 150,
        },
        unlockedAchievements: ['evolved_being'],
      })

      const canUseAdvanced = abilityManager.canUseAbility('personality_shift', fullEvolution)
      expect(canUseAdvanced).toBe(true)
    })
  })

  describe('Cooldown Management', () => {
    const evolution = createEvolution({
      level: 5,
      unlockedSkills: ['empathy', 'active_listening'],
    })

    it('should not be on cooldown initially', () => {
      const onCooldown = abilityManager.isOnCooldown('emotional_resonance', {})
      expect(onCooldown).toBe(false)
    })

    it('should be on cooldown after use', () => {
      const cooldownUntil = abilityManager.useAbility('emotional_resonance', evolution)
      expect(cooldownUntil).toBeGreaterThan(0)

      const onCooldown = abilityManager.isOnCooldown('emotional_resonance', {
        emotional_resonance: cooldownUntil,
      })
      expect(onCooldown).toBe(true)
    })

    it('should calculate cooldown end time correctly', () => {
      const ability = abilityManager.getAbility('emotional_resonance')!
      const currentTime = 1000000
      mockNow.mockReturnValue(currentTime)

      const cooldownUntil = abilityManager.useAbility('emotional_resonance', evolution)
      const expectedCooldownEnd = currentTime + ability.cooldown

      expect(cooldownUntil).toBe(expectedCooldownEnd)
    })

    it('should not be on cooldown after cooldown expires', () => {
      const ability = abilityManager.getAbility('emotional_resonance')!
      const useTime = 1000000
      mockNow.mockReturnValue(useTime)

      const cooldownUntil = abilityManager.useAbility('emotional_resonance', evolution)

      // Advance time past cooldown
      mockNow.mockReturnValue(useTime + ability.cooldown + 1000)

      const onCooldown = abilityManager.isOnCooldown('emotional_resonance', {
        emotional_resonance: cooldownUntil,
      })
      expect(onCooldown).toBe(false)
    })

    it('should handle multiple abilities on cooldown', () => {
      const evolution2 = createEvolution({
        level: 6,
        unlockedSkills: ['pattern_recognition', 'context_retention'],
        experienceByType: { conversation: 200, emotional: 0, learning: 100, relationship: 0 },
      })

      const cooldown1 = abilityManager.useAbility('emotional_resonance', evolution)
      const cooldown2 = abilityManager.useAbility('memory_palace', evolution2)

      const cooldowns = {
        emotional_resonance: cooldown1,
        memory_palace: cooldown2,
      }

      expect(abilityManager.isOnCooldown('emotional_resonance', cooldowns)).toBe(true)
      expect(abilityManager.isOnCooldown('memory_palace', cooldowns)).toBe(true)
    })
  })

  describe('Ability Effects', () => {
    it('should have defined effects for each ability', () => {
      const allAbilities = abilityManager.getAllAbilities()

      for (const [abilityId, ability] of allAbilities) {
        expect(ability.effects).toBeDefined()
        
        // Each ability should have at least one effect
        const effectCount = Object.keys(ability.effects).length
        expect(effectCount).toBeGreaterThan(0)
      }
    })

    it('should have personality effects for emotional abilities', () => {
      const emotionalResonance = abilityManager.getAbility('emotional_resonance')!
      expect(emotionalResonance.effects.personalityBoost).toBeDefined()
      expect(emotionalResonance.effects.personalityBoost?.supportive).toBeGreaterThan(0)
    })

    it('should have experience effects for learning abilities', () => {
      const memoryPalace = abilityManager.getAbility('memory_palace')!
      expect(memoryPalace.effects.experienceMultiplier).toBeDefined()
      expect(memoryPalace.effects.experienceMultiplier?.learning).toBeGreaterThan(1)
    })

    it('should have temporary abilities', () => {
      const temporaryAbility = abilityManager.getAbility('empathy_burst')
      if (temporaryAbility) {
        expect(temporaryAbility.effects.temporaryBoost).toBeDefined()
        expect(temporaryAbility.effects.duration).toBeGreaterThan(0)
      }
    })
  })

  describe('Ability Validation', () => {
    it('should have valid ability structure', () => {
      const allAbilities = abilityManager.getAllAbilities()

      for (const [abilityId, ability] of allAbilities) {
        expect(ability.id).toBe(abilityId)
        expect(ability.name).toBeDefined()
        expect(ability.description).toBeDefined()
        expect(ability.cooldown).toBeGreaterThan(0)
        expect(ability.requirements).toBeDefined()
        expect(ability.effects).toBeDefined()
      }
    })

    it('should have reasonable cooldown times', () => {
      const allAbilities = abilityManager.getAllAbilities()

      for (const [abilityId, ability] of allAbilities) {
        // Cooldowns should be between 1 minute and 24 hours
        expect(ability.cooldown).toBeGreaterThanOrEqual(60000) // 1 minute
        expect(ability.cooldown).toBeLessThanOrEqual(86400000) // 24 hours
      }
    })

    it('should have increasing requirements for higher level abilities', () => {
      const basicAbility = abilityManager.getAbility('emotional_resonance')!
      const advancedAbility = abilityManager.getAbility('personality_shift')!

      expect(advancedAbility.requirements.level).toBeGreaterThan(basicAbility.requirements.level)
      
      const basicSkillCount = basicAbility.requirements.skills?.length || 0
      const advancedSkillCount = advancedAbility.requirements.skills?.length || 0
      
      expect(advancedSkillCount).toBeGreaterThanOrEqual(basicSkillCount)
    })
  })

  describe('Available Abilities', () => {
    it('should return available abilities based on evolution state', () => {
      const lowLevelEvolution = createEvolution({
        level: 2,
        unlockedSkills: ['empathy'],
      })

      const availableAtLowLevel = abilityManager.getAvailableAbilities(lowLevelEvolution)
      expect(availableAtLowLevel.length).toBeLessThan(5) // Should have few abilities

      const highLevelEvolution = createEvolution({
        level: 8,
        unlockedSkills: ['empathy', 'active_listening', 'deep_empathy', 'emotional_mastery', 'pattern_recognition', 'context_retention'],
        experienceByType: {
          conversation: 300,
          emotional: 200,
          learning: 200,
          relationship: 150,
        },
        unlockedAchievements: ['wisdom_seeker', 'evolved_being'],
      })

      const availableAtHighLevel = abilityManager.getAvailableAbilities(highLevelEvolution)
      expect(availableAtHighLevel.length).toBeGreaterThan(availableAtLowLevel.length)
    })

    it('should not include abilities on cooldown in available list', () => {
      const evolution = createEvolution({
        level: 5,
        unlockedSkills: ['empathy', 'active_listening'],
        abilityCooldowns: {
          emotional_resonance: Date.now() + 300000, // 5 minutes from now
        },
      })

      const available = abilityManager.getAvailableAbilities(evolution)
      expect(available).not.toContain('emotional_resonance')
    })
  })

  describe('Edge Cases', () => {
    it('should handle ability use without meeting requirements', () => {
      const evolution = createEvolution({ level: 1 }) // Low level, no skills

      expect(() => {
        abilityManager.useAbility('emotional_resonance', evolution)
      }).toThrow()
    })

    it('should handle checking cooldown for non-existent ability', () => {
      const onCooldown = abilityManager.isOnCooldown('invalid_ability' as AbilityId, {})
      expect(onCooldown).toBe(false)
    })

    it('should handle empty cooldowns object', () => {
      const onCooldown = abilityManager.isOnCooldown('emotional_resonance', {})
      expect(onCooldown).toBe(false)
    })

    it('should handle evolution with missing properties', () => {
      const incompleteEvolution = {
        level: 5,
        unlockedSkills: ['empathy'],
      } as any

      expect(() => {
        abilityManager.canUseAbility('emotional_resonance', incompleteEvolution)
      }).not.toThrow()
    })

    it('should handle future cooldown times', () => {
      const futureTime = Date.now() + 1000000
      const onCooldown = abilityManager.isOnCooldown('emotional_resonance', {
        emotional_resonance: futureTime,
      })
      expect(onCooldown).toBe(true)
    })

    it('should handle past cooldown times', () => {
      const pastTime = Date.now() - 1000000
      const onCooldown = abilityManager.isOnCooldown('emotional_resonance', {
        emotional_resonance: pastTime,
      })
      expect(onCooldown).toBe(false)
    })
  })

  describe('Ability Categories', () => {
    it('should have abilities for different aspects of growth', () => {
      const allAbilities = abilityManager.getAllAbilities()
      const abilityNames = Array.from(allAbilities.values()).map(a => a.name)

      // Should have emotional abilities
      expect(abilityNames.some(name => name.toLowerCase().includes('emotional'))).toBe(true)
      
      // Should have memory abilities
      expect(abilityNames.some(name => name.toLowerCase().includes('memory'))).toBe(true)
      
      // Should have wisdom/learning abilities
      expect(abilityNames.some(name => name.toLowerCase().includes('wisdom') || name.toLowerCase().includes('learning'))).toBe(true)
      
      // Should have relationship abilities
      expect(abilityNames.some(name => name.toLowerCase().includes('bond') || name.toLowerCase().includes('trust'))).toBe(true)
    })

    it('should have different cooldown categories', () => {
      const allAbilities = abilityManager.getAllAbilities()
      const cooldowns = Array.from(allAbilities.values()).map(a => a.cooldown)
      const uniqueCooldowns = [...new Set(cooldowns)]
      
      // Should have varied cooldown times
      expect(uniqueCooldowns.length).toBeGreaterThan(3)
    })
  })
})