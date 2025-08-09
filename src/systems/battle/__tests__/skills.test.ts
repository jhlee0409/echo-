/**
 * 🎯 Skills System 테스트 스위트
 * 
 * 스킬 데이터베이스, 성격 기반 스킬 선택, 밸런싱 검증
 */

import { describe, test, expect } from 'vitest'
import {
  playerSkills,
  companionSkills,
  enemySkills,
  getSkillsByPersonality,
  getPlayerSkillsForLevel,
  getEnemySkillsForType,
  createCustomSkill,
  SKILL_BALANCE
} from '../skills'
import type { BattleSkill } from '../types'

describe('Skills Database', () => {
  describe('Player Skills', () => {
    test('should have all required player skills', () => {
      expect(playerSkills.power_strike).toBeDefined()
      expect(playerSkills.whirlwind).toBeDefined()
      expect(playerSkills.heal).toBeDefined()
    })

    test('should have valid skill properties', () => {
      Object.values(playerSkills).forEach(skill => {
        expect(skill.id).toBeTruthy()
        expect(skill.name).toBeTruthy()
        expect(skill.description).toBeTruthy()
        expect(skill.mpCost).toBeGreaterThanOrEqual(0)
        expect(skill.cooldownTurns).toBeGreaterThanOrEqual(0)
        expect(skill.currentCooldown).toBe(0) // 초기값은 0이어야 함
        expect(skill.targetType).toMatch(/^(single|all_enemies|all_allies|self)$/)
        expect(skill.aiPriority).toBeGreaterThanOrEqual(0)
        expect(skill.aiPriority).toBeLessThanOrEqual(100)
      })
    })

    test('should have balanced damage/cost ratios', () => {
      const powerStrike = playerSkills.power_strike
      const whirlwind = playerSkills.whirlwind

      // 단일 대상 스킬이 전체 공격보다 단일 대미지가 높아야 함
      expect(powerStrike.damage).toBeGreaterThan(whirlwind.damage)
      
      // 전체 공격이 더 높은 MP 비용을 가져야 함
      expect(whirlwind.mpCost).toBeGreaterThan(powerStrike.mpCost)
    })
  })

  describe('Companion Skills', () => {
    test('should have personality-based skills', () => {
      expect(companionSkills.gentle_heal).toBeDefined()
      expect(companionSkills.protective_shield).toBeDefined()
      expect(companionSkills.quick_strike).toBeDefined()
      expect(companionSkills.encouraging_cheer).toBeDefined()
      expect(companionSkills.solo_focus).toBeDefined()
      expect(companionSkills.counter_attack).toBeDefined()
      expect(companionSkills.analyze_enemy).toBeDefined()
    })

    test('should have appropriate healing skills', () => {
      const gentleHeal = companionSkills.gentle_heal

      expect(gentleHeal.healAmount).toBeGreaterThan(0)
      expect(gentleHeal.damage).toBe(0)
      expect(gentleHeal.targetType).toBe('single')
      expect(gentleHeal.aiPriority).toBeGreaterThan(80) // 치유는 높은 우선순위
    })

    test('should have buff/debuff skills with status effects', () => {
      const protectiveShield = companionSkills.protective_shield
      const analyzingEnemy = companionSkills.analyze_enemy

      expect(protectiveShield.statusEffects).toBeDefined()
      expect(protectiveShield.statusEffects![0].type).toBe('buff')
      expect(protectiveShield.statusEffects![0].statModifiers.defense).toBeGreaterThan(0)

      expect(analyzingEnemy.statusEffects).toBeDefined()
      expect(analyzingEnemy.statusEffects![0].type).toBe('debuff')
      expect(analyzingEnemy.statusEffects![0].statModifiers.defense).toBeLessThan(0)
    })
  })

  describe('Enemy Skills', () => {
    test('should have basic combat skills', () => {
      expect(enemySkills.bite).toBeDefined()
      expect(enemySkills.poison_spit).toBeDefined()
      expect(enemySkills.intimidate).toBeDefined()
      expect(enemySkills.howl).toBeDefined()
    })

    test('should have boss-level skills', () => {
      expect(enemySkills.devastating_blow).toBeDefined()
      expect(enemySkills.area_destruction).toBeDefined()
      expect(enemySkills.regeneration).toBeDefined()

      // 보스 스킬은 높은 데미지/효과를 가져야 함
      expect(enemySkills.devastating_blow.damage).toBeGreaterThan(40)
      expect(enemySkills.area_destruction.targetType).toBe('all_enemies')
      expect(enemySkills.regeneration.healAmount).toBeGreaterThan(50)
    })

    test('should have balanced enemy skill costs', () => {
      const basicSkill = enemySkills.bite
      const advancedSkill = enemySkills.devastating_blow

      expect(basicSkill.mpCost).toBeLessThan(advancedSkill.mpCost)
      expect(basicSkill.cooldownTurns).toBeLessThan(advancedSkill.cooldownTurns)
    })
  })
})

describe('Skill Selection Logic', () => {
  describe('Personality-Based Selection', () => {
    test('should return caring skills for high caring personality', () => {
      const caringPersonality = {
        caring: 0.8,
        playful: 0.2,
        independent: 0.3,
        curious: 0.1
      }

      const skills = getSkillsByPersonality(caringPersonality)

      expect(skills).toContain(companionSkills.gentle_heal)
      expect(skills).toContain(companionSkills.protective_shield)
    })

    test('should return playful skills for high playful personality', () => {
      const playfulPersonality = {
        caring: 0.2,
        playful: 0.8,
        independent: 0.3,
        curious: 0.4
      }

      const skills = getSkillsByPersonality(playfulPersonality)

      expect(skills).toContain(companionSkills.quick_strike)
      expect(skills).toContain(companionSkills.encouraging_cheer)
    })

    test('should return independent skills for high independent personality', () => {
      const independentPersonality = {
        caring: 0.2,
        playful: 0.3,
        independent: 0.8,
        curious: 0.1
      }

      const skills = getSkillsByPersonality(independentPersonality)

      expect(skills).toContain(companionSkills.solo_focus)
      expect(skills).toContain(companionSkills.counter_attack)
    })

    test('should return curious skills for high curious personality', () => {
      const curiousPersonality = {
        caring: 0.1,
        playful: 0.2,
        independent: 0.3,
        curious: 0.8
      }

      const skills = getSkillsByPersonality(curiousPersonality)

      expect(skills).toContain(companionSkills.analyze_enemy)
    })

    test('should return default skills for balanced personality', () => {
      const balancedPersonality = {
        caring: 0.4,
        playful: 0.4,
        independent: 0.4,
        curious: 0.4
      }

      const skills = getSkillsByPersonality(balancedPersonality)

      expect(skills.length).toBeGreaterThan(0)
      expect(skills).toContain(companionSkills.quick_strike)
      expect(skills).toContain(companionSkills.gentle_heal)
    })

    test('should not return empty skill set', () => {
      const emptyPersonality = {
        caring: 0.1,
        playful: 0.1,
        independent: 0.1,
        curious: 0.1
      }

      const skills = getSkillsByPersonality(emptyPersonality)

      expect(skills.length).toBeGreaterThan(0)
      expect(skills).toContain(companionSkills.quick_strike)
      expect(skills).toContain(companionSkills.gentle_heal)
    })
  })

  describe('Level-Based Player Skills', () => {
    test('should return level-appropriate player skills', () => {
      const level1Skills = getPlayerSkillsForLevel(1)
      expect(level1Skills).toContain(playerSkills.power_strike)
      expect(level1Skills).not.toContain(playerSkills.heal)
      expect(level1Skills).not.toContain(playerSkills.whirlwind)

      const level3Skills = getPlayerSkillsForLevel(3)
      expect(level3Skills).toContain(playerSkills.power_strike)
      expect(level3Skills).toContain(playerSkills.heal)
      expect(level3Skills).not.toContain(playerSkills.whirlwind)

      const level5Skills = getPlayerSkillsForLevel(5)
      expect(level5Skills).toContain(playerSkills.power_strike)
      expect(level5Skills).toContain(playerSkills.heal)
      expect(level5Skills).toContain(playerSkills.whirlwind)
    })

    test('should always include basic attack skill', () => {
      for (let level = 1; level <= 10; level++) {
        const skills = getPlayerSkillsForLevel(level)
        expect(skills).toContain(playerSkills.power_strike)
      }
    })
  })

  describe('Enemy Type Skills', () => {
    test('should return appropriate skills for enemy types', () => {
      const slimeSkills = getEnemySkillsForType('slime')
      expect(slimeSkills).toContain(enemySkills.bite)

      const goblinSkills = getEnemySkillsForType('goblin')
      expect(goblinSkills).toContain(enemySkills.bite)
      expect(goblinSkills).toContain(enemySkills.intimidate)

      const wolfSkills = getEnemySkillsForType('wolf')
      expect(wolfSkills).toContain(enemySkills.bite)
      expect(wolfSkills).toContain(enemySkills.howl)

      const spiderSkills = getEnemySkillsForType('spider')
      expect(spiderSkills).toContain(enemySkills.bite)
      expect(spiderSkills).toContain(enemySkills.poison_spit)
    })

    test('should return default skills for unknown enemy types', () => {
      const unknownSkills = getEnemySkillsForType('unknown_monster')
      expect(unknownSkills).toContain(enemySkills.bite)
    })

    test('should return boss skills for boss types', () => {
      const bossWolfSkills = getEnemySkillsForType('boss_wolf')
      expect(bossWolfSkills).toContain(enemySkills.bite)
      expect(bossWolfSkills).toContain(enemySkills.howl)
      expect(bossWolfSkills).toContain(enemySkills.devastating_blow)

      const bossDragonSkills = getEnemySkillsForType('boss_dragon')
      expect(bossDragonSkills).toContain(enemySkills.devastating_blow)
      expect(bossDragonSkills).toContain(enemySkills.area_destruction)
      expect(bossDragonSkills).toContain(enemySkills.regeneration)
    })
  })
})

describe('Custom Skill Creation', () => {
  test('should create custom skill with default values', () => {
    const customSkill = createCustomSkill(
      'test_skill',
      '테스트 스킬',
      '테스트용 커스텀 스킬입니다.'
    )

    expect(customSkill.id).toBe('test_skill')
    expect(customSkill.name).toBe('테스트 스킬')
    expect(customSkill.description).toBe('테스트용 커스텀 스킬입니다.')
    expect(customSkill.mpCost).toBe(10)
    expect(customSkill.cooldownTurns).toBe(1)
    expect(customSkill.currentCooldown).toBe(0)
    expect(customSkill.damage).toBe(0)
    expect(customSkill.targetType).toBe('single')
    expect(customSkill.aiPriority).toBe(50)
  })

  test('should create custom skill with specific configuration', () => {
    const customConfig: Partial<BattleSkill> = {
      mpCost: 25,
      cooldownTurns: 3,
      damage: 40,
      healAmount: 15,
      targetType: 'all_enemies',
      aiPriority: 80,
      element: 'fire',
      statusEffects: [{
        id: 'burn',
        name: '화상',
        type: 'debuff',
        duration: 3,
        statModifiers: {},
        damagePerTurn: -3,
        icon: '🔥',
        description: '매 턴 3 피해'
      }]
    }

    const customSkill = createCustomSkill(
      'fire_blast',
      '파이어 블라스트',
      '불꽃으로 모든 적을 공격합니다.',
      customConfig
    )

    expect(customSkill.mpCost).toBe(25)
    expect(customSkill.cooldownTurns).toBe(3)
    expect(customSkill.damage).toBe(40)
    expect(customSkill.healAmount).toBe(15)
    expect(customSkill.targetType).toBe('all_enemies')
    expect(customSkill.aiPriority).toBe(80)
    expect(customSkill.element).toBe('fire')
    expect(customSkill.statusEffects).toHaveLength(1)
    expect(customSkill.statusEffects![0].name).toBe('화상')
  })
})

describe('Skill Balance Constants', () => {
  test('should have consistent balance constants', () => {
    expect(SKILL_BALANCE.BASIC_SKILL_DAMAGE).toBeLessThan(SKILL_BALANCE.ADVANCED_SKILL_DAMAGE)
    expect(SKILL_BALANCE.ADVANCED_SKILL_DAMAGE).toBeLessThan(SKILL_BALANCE.ULTIMATE_SKILL_DAMAGE)

    expect(SKILL_BALANCE.LOW_MP_COST).toBeLessThan(SKILL_BALANCE.MEDIUM_MP_COST)
    expect(SKILL_BALANCE.MEDIUM_MP_COST).toBeLessThan(SKILL_BALANCE.HIGH_MP_COST)

    expect(SKILL_BALANCE.SHORT_COOLDOWN).toBeLessThan(SKILL_BALANCE.MEDIUM_COOLDOWN)
    expect(SKILL_BALANCE.MEDIUM_COOLDOWN).toBeLessThan(SKILL_BALANCE.LONG_COOLDOWN)

    expect(SKILL_BALANCE.BASIC_HEAL).toBeLessThan(SKILL_BALANCE.STRONG_HEAL)
    expect(SKILL_BALANCE.STRONG_HEAL).toBeLessThan(SKILL_BALANCE.MASTER_HEAL)
  })

  test('should have reasonable balance values', () => {
    // 데미지 값들이 합리적인 범위에 있는지 확인
    expect(SKILL_BALANCE.BASIC_SKILL_DAMAGE).toBeGreaterThan(10)
    expect(SKILL_BALANCE.BASIC_SKILL_DAMAGE).toBeLessThan(30)

    expect(SKILL_BALANCE.ULTIMATE_SKILL_DAMAGE).toBeGreaterThan(40)
    expect(SKILL_BALANCE.ULTIMATE_SKILL_DAMAGE).toBeLessThan(70)

    // MP 비용이 합리적인지 확인
    expect(SKILL_BALANCE.LOW_MP_COST).toBeGreaterThan(5)
    expect(SKILL_BALANCE.HIGH_MP_COST).toBeLessThan(50)

    // 치유량이 합리적인지 확인
    expect(SKILL_BALANCE.BASIC_HEAL).toBeGreaterThan(20)
    expect(SKILL_BALANCE.MASTER_HEAL).toBeLessThan(100)
  })
})

describe('Skill Validation', () => {
  test('should validate skill data integrity', () => {
    const allSkills = [
      ...Object.values(playerSkills),
      ...Object.values(companionSkills),
      ...Object.values(enemySkills)
    ]

    allSkills.forEach(skill => {
      // 필수 속성 존재 확인
      expect(skill.id).toBeTruthy()
      expect(skill.name).toBeTruthy()
      expect(skill.description).toBeTruthy()

      // 수치 값 유효성 확인
      expect(skill.mpCost).toBeGreaterThanOrEqual(0)
      expect(skill.cooldownTurns).toBeGreaterThanOrEqual(0)
      expect(skill.currentCooldown).toBeGreaterThanOrEqual(0)
      expect(skill.damage).toBeGreaterThanOrEqual(0)
      expect(skill.aiPriority).toBeGreaterThanOrEqual(0)
      expect(skill.aiPriority).toBeLessThanOrEqual(100)

      // 대상 타입 유효성 확인
      const validTargetTypes = ['single', 'all_enemies', 'all_allies', 'self']
      expect(validTargetTypes).toContain(skill.targetType)

      // 속성 유효성 확인 (있는 경우)
      if (skill.element) {
        const validElements = ['fire', 'water', 'earth', 'wind', 'light', 'dark', 'neutral']
        expect(validElements).toContain(skill.element)
      }

      // 치유량 유효성 확인 (있는 경우)
      if (skill.healAmount) {
        expect(skill.healAmount).toBeGreaterThan(0)
      }

      // 상태 효과 유효성 확인 (있는 경우)
      if (skill.statusEffects) {
        skill.statusEffects.forEach(effect => {
          expect(effect.id).toBeTruthy()
          expect(effect.name).toBeTruthy()
          expect(['buff', 'debuff']).toContain(effect.type)
          expect(effect.duration).toBeGreaterThan(0)
          expect(effect.icon).toBeTruthy()
          expect(effect.description).toBeTruthy()
        })
      }
    })
  })

  test('should have unique skill IDs', () => {
    const allSkills = [
      ...Object.values(playerSkills),
      ...Object.values(companionSkills),
      ...Object.values(enemySkills)
    ]

    const skillIds = allSkills.map(skill => skill.id)
    const uniqueIds = new Set(skillIds)

    expect(uniqueIds.size).toBe(skillIds.length)
  })

  test('should have appropriate skill costs for power levels', () => {
    // 더 강력한 스킬일수록 더 높은 비용을 가져야 함
    const devastatingBlow = enemySkills.devastating_blow
    const basicBite = enemySkills.bite

    expect(devastatingBlow.mpCost).toBeGreaterThan(basicBite.mpCost)
    expect(devastatingBlow.cooldownTurns).toBeGreaterThan(basicBite.cooldownTurns)
    expect(devastatingBlow.damage).toBeGreaterThan(basicBite.damage)
  })
})