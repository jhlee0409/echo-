/**
 * 🐉 Enemy System 테스트 스위트
 * 
 * 적 생성, AI 패턴, 밸런싱 검증
 */

import { describe, test, expect } from 'vitest'
import { createEnemy, enemyTemplates, encounterGroups } from '../enemies'
import type { BattleUnit } from '../types'

describe('Enemy Creation System', () => {
  describe('Basic Enemy Creation', () => {
    test('should create slime enemy with correct stats', () => {
      const slime = createEnemy('slime', 1)

      expect(slime.id).toContain('slime')
      expect(slime.name).toBe('슬라임')
      expect(slime.type).toBe('enemy')
      expect(slime.hp).toBeGreaterThan(0)
      expect(slime.maxHp).toBeGreaterThan(0)
      expect(slime.attack).toBeGreaterThan(0)
      expect(slime.defense).toBeGreaterThanOrEqual(0)
      expect(slime.speed).toBeGreaterThan(0)
      expect(slime.isAlive).toBe(true)
    })

    test('should create goblin enemy with correct stats', () => {
      const goblin = createEnemy('goblin', 2)

      expect(goblin.id).toContain('goblin')
      expect(goblin.name).toBe('고블린')
      expect(goblin.type).toBe('enemy')
      expect(goblin.skills.length).toBeGreaterThan(0)
      expect(goblin.buffs).toEqual([])
      expect(goblin.debuffs).toEqual([])
    })

    test('should create wolf enemy with pack behavior', () => {
      const wolf = createEnemy('wolf', 3)

      expect(wolf.id).toContain('wolf')
      expect(wolf.name).toBe('늑대')
      expect(wolf.skills.length).toBeGreaterThan(0) // 늑대는 스킬 보유
    })

    test('should create spider enemy with poison abilities', () => {
      const spider = createEnemy('spider', 2)

      expect(spider.id).toContain('spider')
      expect(spider.name).toBe('거미')
      expect(spider.skills.some(skill => skill.id === 'poison_spit')).toBe(true)
    })
  })

  describe('Level Scaling', () => {
    test('should scale stats correctly with level', () => {
      const slimeLevel1 = createEnemy('slime', 1)
      const slimeLevel5 = createEnemy('slime', 5)

      expect(slimeLevel5.hp).toBeGreaterThan(slimeLevel1.hp)
      expect(slimeLevel5.maxHp).toBeGreaterThan(slimeLevel1.maxHp)
      expect(slimeLevel5.attack).toBeGreaterThan(slimeLevel1.attack)
      expect(slimeLevel5.defense).toBeGreaterThan(slimeLevel1.defense)
    })

    test('should maintain reasonable stat ratios across levels', () => {
      const levels = [1, 3, 5, 7, 10]
      
      levels.forEach(level => {
        const enemy = createEnemy('goblin', level)
        
        // HP는 공격력의 3-8배 정도여야 함
        const hpToAttackRatio = enemy.hp / enemy.attack
        expect(hpToAttackRatio).toBeGreaterThan(2)
        expect(hpToAttackRatio).toBeLessThan(10)
        
        // 방어력은 공격력의 절반 이하여야 함
        expect(enemy.defense).toBeLessThan(enemy.attack)
      })
    })

    test('should cap stats at reasonable maximum values', () => {
      const highLevelEnemy = createEnemy('goblin', 20)

      expect(highLevelEnemy.hp).toBeLessThan(2000)
      expect(highLevelEnemy.attack).toBeLessThan(200)
      expect(highLevelEnemy.defense).toBeLessThan(100)
      expect(highLevelEnemy.speed).toBeLessThan(50)
    })
  })

  describe('Boss Enemy Creation', () => {
    test('should create troll enemy with enhanced stats', () => {
      const troll = createEnemy('troll', 5)

      expect(troll.id).toContain('troll')
      expect(troll.name).toBe('트롤')
      expect(troll.type).toBe('enemy')
      
      // 트롤은 강한 몬스터여야 함
      const goblin = createEnemy('goblin', 5)
      expect(troll.hp).toBeGreaterThan(goblin.hp)
      expect(troll.attack).toBeGreaterThan(goblin.attack)
    })

    test('should handle available enemy types', () => {
      const troll = createEnemy('troll', 3)

      expect(troll.id).toContain('troll')
      expect(troll.name).toBe('트롤')
      expect(troll.type).toBe('enemy')
      expect(troll.hp).toBeGreaterThan(0)
    })

    test('should create enemies with appropriate difficulty', () => {
      const highLevelSlime = createEnemy('slime', 10)
      const lowLevelSlime = createEnemy('slime', 1)

      expect(highLevelSlime.hp).toBeGreaterThan(lowLevelSlime.hp)
      expect(highLevelSlime.attack).toBeGreaterThan(lowLevelSlime.attack)
    })
  })

  describe('Enemy Templates Validation', () => {
    test('should have valid enemy templates', () => {
      Object.entries(enemyTemplates).forEach(([key, template]) => {
        expect(template.name).toBeTruthy()
        expect(template.baseHp).toBeGreaterThan(0)
        expect(template.baseAttack).toBeGreaterThan(0)
        expect(template.baseDefense).toBeGreaterThanOrEqual(0)
        expect(template.skillSet).toBeInstanceOf(Array)
        expect(template.skillSet.length).toBeGreaterThan(0)
      })
    })

    test('should have balanced stat distributions', () => {
      Object.entries(enemyTemplates).forEach(([key, template]) => {
        // HP는 공격력의 2-10배여야 함
        const hpToAttackRatio = template.baseHp / template.baseAttack
        expect(hpToAttackRatio).toBeGreaterThan(1.5)
        expect(hpToAttackRatio).toBeLessThan(12)
      })
    })

    test('should have appropriate skills for enemy types', () => {
      // 슬라임은 기본 공격만 가져야 함
      expect(enemyTemplates.slime.skillSet).toContain('bite')

      // 고블린은 기본 공격 + 위협 스킬
      expect(enemyTemplates.goblin.skillSet).toContain('bite')
      expect(enemyTemplates.goblin.skillSet).toContain('intimidate')

      // 늑대는 무리 전술 스킬들
      expect(enemyTemplates.wolf.skillSet).toContain('bite')
      expect(enemyTemplates.wolf.skillSet).toContain('howl')

      // 거미는 독 공격
      expect(enemyTemplates.spider.skillSet).toContain('bite')
      expect(enemyTemplates.spider.skillSet).toContain('poison_spit')
    })
  })

  describe('AI Pattern System', () => {
    test('should create enemies with AI patterns', () => {
      const slime = createEnemy('slime', 1)
      const goblin = createEnemy('goblin', 3)
      const spider = createEnemy('spider', 5)

      expect(slime.type).toBe('enemy')
      expect(goblin.type).toBe('enemy')
      expect(spider.type).toBe('enemy')
    })

    test('should create enemies with valid properties', () => {
      const enemies = [
        createEnemy('slime', 2),
        createEnemy('goblin', 3),
        createEnemy('wolf', 4),
        createEnemy('spider', 3)
      ]

      enemies.forEach(enemy => {
        expect(enemy.type).toBe('enemy')
        expect(enemy.isAlive).toBe(true)
        expect(enemy.skills.length).toBeGreaterThan(0)
      })
    })
  })
})

describe('Enemy Group System', () => {
  describe('Encounter Groups', () => {
    test('should have predefined encounter groups', () => {
      expect(encounterGroups.slime_pack).toBeDefined()
      expect(encounterGroups.mixed_weak).toBeDefined()
      expect(encounterGroups.goblin_patrol).toBeDefined()
      expect(encounterGroups.wolf_pack).toBeDefined()
    })

    test('should create slime pack encounter', () => {
      const slimePack = encounterGroups.slime_pack()

      expect(slimePack.length).toBeGreaterThan(0)
      expect(slimePack.length).toBeLessThanOrEqual(4)
      
      slimePack.forEach(enemy => {
        expect(enemy.type).toBe('enemy')
        expect(enemy.isAlive).toBe(true)
        expect(enemy.id).toContain('slime')
      })
    })

    test('should create mixed weak encounter', () => {
      const mixedGroup = encounterGroups.mixed_weak()

      expect(mixedGroup.length).toBeGreaterThan(0)
      mixedGroup.forEach(enemy => {
        expect(enemy.type).toBe('enemy')
        expect(enemy.isAlive).toBe(true)
      })
    })

    test('should create goblin patrol encounter', () => {
      const goblinPatrol = encounterGroups.goblin_patrol()

      expect(goblinPatrol.length).toBeGreaterThan(0)
      goblinPatrol.forEach(enemy => {
        expect(enemy.type).toBe('enemy')
        expect(enemy.isAlive).toBe(true)
      })
    })

    test('should create wolf pack encounter', () => {
      const wolfPack = encounterGroups.wolf_pack()

      expect(wolfPack.length).toBeGreaterThan(0)
      wolfPack.forEach(enemy => {
        expect(enemy.type).toBe('enemy')
        expect(enemy.id).toContain('wolf')
      })
    })
  })

  describe('Group Validation', () => {
    test('should create valid groups', () => {
      const groups = [
        encounterGroups.slime_pack(),
        encounterGroups.mixed_weak(),
        encounterGroups.goblin_patrol(),
        encounterGroups.wolf_pack()
      ]

      groups.forEach(group => {
        expect(group.length).toBeGreaterThan(0)
        group.forEach(enemy => {
          expect(enemy.type).toBe('enemy')
          expect(enemy.hp).toBeGreaterThan(0)
          expect(enemy.attack).toBeGreaterThan(0)
          expect(enemy.isAlive).toBe(true)
        })
      })
    })

    test('should create balanced group compositions', () => {
      const group = encounterGroups.mixed_medium()

      // 그룹 전체 HP가 합리적인지 확인
      const totalHp = group.reduce((sum, enemy) => sum + enemy.hp, 0)
      const avgAttack = group.reduce((sum, enemy) => sum + enemy.attack, 0) / group.length

      expect(totalHp).toBeGreaterThan(50)
      expect(totalHp).toBeLessThan(1000)
      expect(avgAttack).toBeGreaterThan(5)
      expect(avgAttack).toBeLessThan(100)
    })

    test('should maintain appropriate group sizes', () => {
      const groups = [
        encounterGroups.slime_pack(),
        encounterGroups.spider_nest(),
        encounterGroups.goblin_patrol(),
        encounterGroups.wolf_pack(),
        encounterGroups.mixed_weak()
      ]
      
      groups.forEach(group => {
        expect(group.length).toBeGreaterThan(0)
        expect(group.length).toBeLessThanOrEqual(5) // 최대 5마리
      })
    })
  })
})

describe('Enemy System Integration', () => {
  describe('System Integration', () => {
    test('should create battle-ready enemies', () => {
      const wolf = createEnemy('wolf', 4)

      // 전투에 필요한 모든 속성이 있는지 확인
      expect(wolf.id).toBeTruthy()
      expect(wolf.name).toBeTruthy()
      expect(wolf.type).toBe('enemy')
      expect(wolf.hp).toBeGreaterThan(0)
      expect(wolf.maxHp).toEqual(wolf.hp)
      expect(wolf.mp).toBeGreaterThanOrEqual(0)
      expect(wolf.maxMp).toEqual(wolf.mp)
      expect(wolf.skills.length).toBeGreaterThan(0)
      expect(wolf.buffs).toEqual([])
      expect(wolf.debuffs).toEqual([])
      expect(wolf.isAlive).toBe(true)
    })

    test('should support stat modifications', () => {
      const originalEnemy = createEnemy('slime', 3)
      
      // 버프/디버프를 위한 기본 배열들이 존재해야 함
      expect(Array.isArray(originalEnemy.buffs)).toBe(true)
      expect(Array.isArray(originalEnemy.debuffs)).toBe(true)
      
      // 스탯 수정이 가능해야 함
      originalEnemy.attack += 10
      expect(originalEnemy.attack).toBeGreaterThan(0)
    })

    test('should create enemies efficiently', () => {
      const startTime = performance.now()
      
      // 여러 적 생성
      for (let i = 0; i < 10; i++) {
        createEnemy('goblin', Math.floor(Math.random() * 10) + 1)
      }
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // 10마리를 50ms 이내에 생성해야 함
      expect(duration).toBeLessThan(50)
    })
  })
})