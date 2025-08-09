import { describe, it, expect, beforeEach } from 'vitest'
import { SkillManager } from '../SkillManager'
import type { SkillId, SkillCategory, SkillRequirement } from '../types'

describe('SkillManager', () => {
  let skillManager: SkillManager

  beforeEach(() => {
    skillManager = new SkillManager()
  })

  describe('Skill Information', () => {
    it('should return correct skill information', () => {
      const empathy = skillManager.getSkill('empathy')
      expect(empathy).toBeDefined()
      expect(empathy?.name).toBe('Empathy')
      expect(empathy?.category).toBe('personality')
      expect(empathy?.description).toContain('understanding')
    })

    it('should return all skills', () => {
      const allSkills = skillManager.getAllSkills()
      expect(allSkills.size).toBeGreaterThan(20) // Should have many skills
      expect(allSkills.has('empathy')).toBe(true)
      expect(allSkills.has('active_listening')).toBe(true)
    })

    it('should get skills by category', () => {
      const personalitySkills = skillManager.getSkillsByCategory('personality')
      expect(personalitySkills).toContain('empathy')
      expect(personalitySkills).toContain('emotional_intelligence')
      expect(personalitySkills).toContain('humor')

      const communicationSkills = skillManager.getSkillsByCategory('communication')
      expect(communicationSkills).toContain('active_listening')
      expect(communicationSkills).toContain('storytelling')
      expect(communicationSkills).toContain('persuasion')

      const memorySkills = skillManager.getSkillsByCategory('memory')
      expect(memorySkills).toContain('pattern_recognition')
      expect(memorySkills).toContain('context_retention')
      expect(memorySkills).toContain('knowledge_synthesis')

      const relationshipSkills = skillManager.getSkillsByCategory('relationship')
      expect(relationshipSkills).toContain('trust_building')
      expect(relationshipSkills).toContain('conflict_resolution')
      expect(relationshipSkills).toContain('loyalty')
    })

    it('should return undefined for invalid skill', () => {
      const invalidSkill = skillManager.getSkill('invalid_skill' as SkillId)
      expect(invalidSkill).toBeUndefined()
    })
  })

  describe('Skill Requirements', () => {
    it('should check basic skill requirements correctly', () => {
      const canUnlockEmpathy = skillManager.canUnlockSkill('empathy', {
        level: 1,
        unlockedSkills: [],
        experienceByType: {
          conversation: 0,
          emotional: 0,
          learning: 0,
          relationship: 0,
        },
      })

      expect(canUnlockEmpathy).toBe(true) // Basic skill, no requirements
    })

    it('should check level requirements', () => {
      const canUnlockAdvanced = skillManager.canUnlockSkill('deep_empathy', {
        level: 1,
        unlockedSkills: ['empathy', 'emotional_intelligence'],
        experienceByType: {
          conversation: 0,
          emotional: 0,
          learning: 0,
          relationship: 0,
        },
      })

      expect(canUnlockAdvanced).toBe(false) // Should require higher level

      const canUnlockWithLevel = skillManager.canUnlockSkill('deep_empathy', {
        level: 5,
        unlockedSkills: ['empathy', 'emotional_intelligence'],
        experienceByType: {
          conversation: 0,
          emotional: 0,
          learning: 0,
          relationship: 0,
        },
      })

      expect(canUnlockWithLevel).toBe(true)
    })

    it('should check prerequisite skill requirements', () => {
      const canUnlockEI = skillManager.canUnlockSkill('emotional_intelligence', {
        level: 2,
        unlockedSkills: [], // Missing empathy prerequisite
        experienceByType: {
          conversation: 0,
          emotional: 0,
          learning: 0,
          relationship: 0,
        },
      })

      expect(canUnlockEI).toBe(false)

      const canUnlockEIWithPrereq = skillManager.canUnlockSkill('emotional_intelligence', {
        level: 2,
        unlockedSkills: ['empathy'], // Has prerequisite
        experienceByType: {
          conversation: 0,
          emotional: 0,
          learning: 0,
          relationship: 0,
        },
      })

      expect(canUnlockEIWithPrereq).toBe(true)
    })

    it('should check experience requirements', () => {
      const canUnlockWithoutExp = skillManager.canUnlockSkill('advanced_storytelling', {
        level: 4,
        unlockedSkills: ['storytelling'],
        experienceByType: {
          conversation: 50, // Not enough conversation experience
          emotional: 0,
          learning: 0,
          relationship: 0,
        },
      })

      expect(canUnlockWithoutExp).toBe(false)

      const canUnlockWithExp = skillManager.canUnlockSkill('advanced_storytelling', {
        level: 4,
        unlockedSkills: ['storytelling'],
        experienceByType: {
          conversation: 200, // Enough experience
          emotional: 0,
          learning: 0,
          relationship: 0,
        },
      })

      expect(canUnlockWithExp).toBe(true)
    })

    it('should check complex multi-requirement skills', () => {
      const canUnlockComplex = skillManager.canUnlockSkill('wisdom', {
        level: 8,
        unlockedSkills: ['deep_empathy', 'advanced_reasoning', 'emotional_mastery'],
        experienceByType: {
          conversation: 300,
          emotional: 200,
          learning: 250,
          relationship: 150,
        },
      })

      expect(canUnlockComplex).toBe(true)
    })
  })

  describe('Skill Effects', () => {
    it('should provide personality growth for personality skills', () => {
      const empathySkill = skillManager.getSkill('empathy')
      expect(empathySkill?.effects.personalityGrowth).toBeDefined()
      expect(empathySkill?.effects.personalityGrowth?.supportive).toBeGreaterThan(0)

      const humorSkill = skillManager.getSkill('humor')
      expect(humorSkill?.effects.personalityGrowth?.playful).toBeGreaterThan(0)
    })

    it('should provide abilities for advanced skills', () => {
      const deepEmpathySkill = skillManager.getSkill('deep_empathy')
      expect(deepEmpathySkill?.effects.abilities).toBeDefined()
      expect(deepEmpathySkill?.effects.abilities).toContain('emotional_resonance')
    })

    it('should provide experience multipliers', () => {
      const activeListeningSkill = skillManager.getSkill('active_listening')
      expect(activeListeningSkill?.effects.experienceMultipliers?.conversation).toBeGreaterThan(1)
    })
  })

  describe('Skill Tree Validation', () => {
    it('should have valid skill tree structure', () => {
      const allSkills = skillManager.getAllSkills()
      
      // Check that all skills have required properties
      for (const [skillId, skill] of allSkills) {
        expect(skill.id).toBe(skillId)
        expect(skill.name).toBeDefined()
        expect(skill.description).toBeDefined()
        expect(skill.category).toBeDefined()
        expect(['personality', 'communication', 'memory', 'relationship']).toContain(skill.category)
        expect(skill.requirements).toBeDefined()
        expect(skill.effects).toBeDefined()
      }
    })

    it('should have valid prerequisites', () => {
      const allSkills = skillManager.getAllSkills()
      
      for (const [skillId, skill] of allSkills) {
        if (skill.requirements.prerequisites) {
          for (const prerequisite of skill.requirements.prerequisites) {
            expect(allSkills.has(prerequisite)).toBe(true)
          }
        }
      }
    })

    it('should have reasonable level requirements', () => {
      const allSkills = skillManager.getAllSkills()
      
      for (const [skillId, skill] of allSkills) {
        expect(skill.requirements.level).toBeGreaterThanOrEqual(1)
        expect(skill.requirements.level).toBeLessThanOrEqual(10)
      }
    })

    it('should have skills distributed across categories', () => {
      const categories: SkillCategory[] = ['personality', 'communication', 'memory', 'relationship']
      
      for (const category of categories) {
        const skillsInCategory = skillManager.getSkillsByCategory(category)
        expect(skillsInCategory.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Skill Prerequisites Chain', () => {
    it('should validate prerequisite chains are achievable', () => {
      // Test that we can eventually unlock all skills
      const allSkills = skillManager.getAllSkills()
      const maxLevel = 10
      const maxExperience = 1000
      
      const state = {
        level: maxLevel,
        unlockedSkills: [] as SkillId[],
        experienceByType: {
          conversation: maxExperience,
          emotional: maxExperience,
          learning: maxExperience,
          relationship: maxExperience,
        },
      }

      // Keep trying to unlock skills until no more can be unlocked
      let unlockedCount = 0
      let previousCount = -1
      
      while (unlockedCount !== previousCount && unlockedCount < allSkills.size) {
        previousCount = unlockedCount
        
        for (const [skillId, skill] of allSkills) {
          if (!state.unlockedSkills.includes(skillId) && 
              skillManager.canUnlockSkill(skillId, state)) {
            state.unlockedSkills.push(skillId)
            unlockedCount++
          }
        }
      }

      // Should be able to unlock most skills (allowing for some that might have special requirements)
      expect(unlockedCount).toBeGreaterThanOrEqual(allSkills.size * 0.8)
    })

    it('should have proper skill progression difficulty', () => {
      // Basic skills should be easier to unlock than advanced ones
      const empathy = skillManager.getSkill('empathy')
      const wisdom = skillManager.getSkill('wisdom')
      
      expect(empathy?.requirements.level).toBeLessThan(wisdom?.requirements.level || 0)
      
      const empathyPrereqs = empathy?.requirements.prerequisites?.length || 0
      const wisdomPrereqs = wisdom?.requirements.prerequisites?.length || 0
      
      expect(empathyPrereqs).toBeLessThan(wisdomPrereqs)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty unlocked skills list', () => {
      const canUnlock = skillManager.canUnlockSkill('empathy', {
        level: 1,
        unlockedSkills: [],
        experienceByType: {
          conversation: 0,
          emotional: 0,
          learning: 0,
          relationship: 0,
        },
      })

      expect(canUnlock).toBe(true) // Basic skill should be unlockable
    })

    it('should handle invalid skill categories', () => {
      const skills = skillManager.getSkillsByCategory('invalid' as SkillCategory)
      expect(skills).toHaveLength(0)
    })

    it('should handle checking already unlocked skill', () => {
      const canUnlock = skillManager.canUnlockSkill('empathy', {
        level: 5,
        unlockedSkills: ['empathy'], // Already unlocked
        experienceByType: {
          conversation: 100,
          emotional: 100,
          learning: 100,
          relationship: 100,
        },
      })

      expect(canUnlock).toBe(false) // Already unlocked
    })
  })
})