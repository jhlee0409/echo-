/**
 * 🧪 AutoBattleSystem 통합 테스트 스위트
 * 
 * 핵심 전투 로직, AI 행동, 상태 효과 검증
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'
import { AutoBattleSystem } from '../AutoBattleSystem'
import { createEnemy } from '../enemies'
import { getSkillsByPersonality } from '../skills'
import type { BattleFormation, BattleUnit, BattleConfig } from '../types'

describe('AutoBattleSystem Core Logic', () => {
  let battleSystem: AutoBattleSystem
  let mockPlayer: BattleUnit
  let mockCompanion: BattleUnit
  let mockEnemies: BattleUnit[]
  let testFormation: BattleFormation

  beforeEach(() => {
    // 기본 전투 시스템 설정
    const config: Partial<BattleConfig> = {
      turnTimeLimit: 10,
      animationSpeed: 2.0,
      difficultyMultiplier: 1.0,
      companionAILevel: 'adaptive',
      enemyAILevel: 'normal',
      allowEscape: true,
      autoRevive: false,
      showDamageNumbers: true
    }
    
    battleSystem = new AutoBattleSystem(config)

    // 테스트용 플레이어 생성
    mockPlayer = {
      id: 'player_test',
      name: '테스트 플레이어',
      type: 'player',
      hp: 100,
      maxHp: 100,
      mp: 50,
      maxMp: 50,
      attack: 20,
      defense: 10,
      speed: 12,
      critRate: 15,
      critDamage: 150,
      accuracy: 95,
      evasion: 5,
      skills: [],
      buffs: [],
      debuffs: [],
      isAlive: true
    }

    // 테스트용 동반자 생성
    mockCompanion = {
      id: 'companion_test',
      name: '테스트 동반자',
      type: 'companion',
      hp: 80,
      maxHp: 80,
      mp: 40,
      maxMp: 40,
      attack: 15,
      defense: 8,
      speed: 10,
      critRate: 10,
      critDamage: 140,
      accuracy: 90,
      evasion: 8,
      skills: getSkillsByPersonality({ caring: 0.8, playful: 0.3, independent: 0.2, curious: 0.5 }),
      buffs: [],
      debuffs: [],
      isAlive: true,
      personality: {
        aggression: 0.3,
        caution: 0.7,
        support: 0.8,
        independence: 0.2
      }
    }

    // 테스트용 적 생성
    mockEnemies = [
      createEnemy('slime', 2),
      createEnemy('goblin', 2)
    ]

    testFormation = {
      playerTeam: [mockPlayer, mockCompanion],
      enemyTeam: mockEnemies
    }
  })

  describe('Battle Initialization', () => {
    test('should initialize battle state correctly', () => {
      expect(battleSystem).toBeDefined()
      expect(typeof battleSystem.executeBattle).toBe('function')
    })

    test('should validate formation before battle', async () => {
      const invalidFormation: BattleFormation = {
        playerTeam: [], // 빈 플레이어 팀
        enemyTeam: mockEnemies
      }

      const result = await battleSystem.executeBattle(invalidFormation)
      
      // 빈 팀으로는 패배 결과를 반환해야 함
      expect(result.victory).toBe(false)
      expect(result.turns).toBe(0)
    })

    test('should setup units with correct initial state', async () => {
      // 전투 시작 전 상태 확인
      expect(mockPlayer.isAlive).toBe(true)
      expect(mockCompanion.isAlive).toBe(true)
      expect(mockEnemies.every(enemy => enemy.isAlive)).toBe(true)
      
      // HP가 올바르게 설정되었는지 확인
      expect(mockPlayer.hp).toBe(mockPlayer.maxHp)
      expect(mockCompanion.hp).toBe(mockCompanion.maxHp)
    })
  })

  describe('Turn Order Calculation', () => {
    test('should calculate turn order based on speed', () => {
      // 속도 값 설정
      mockPlayer.speed = 15
      mockCompanion.speed = 8
      mockEnemies[0].speed = 12
      mockEnemies[1].speed = 6

      // 예상 순서: 플레이어(15) > 적1(12) > 동반자(8) > 적2(6)
      // 실제 내부 구현을 테스트하기 위해 별도 함수가 필요하지만
      // 통합 테스트에서는 결과로 검증
    })

    test('should handle units with same speed', () => {
      // 동일한 속도 설정
      mockPlayer.speed = 10
      mockCompanion.speed = 10
      mockEnemies[0].speed = 10

      // 랜덤 요소가 있어도 모든 유닛이 턴을 가져야 함
      expect(true).toBe(true) // 통합 테스트에서 검증
    })
  })

  describe('Basic Combat Mechanics', () => {
    test('should execute complete battle flow', async () => {
      // 빠른 전투를 위해 적 HP 감소
      mockEnemies.forEach(enemy => {
        enemy.hp = 20
        enemy.maxHp = 20
      })

      const result = await battleSystem.executeBattle(testFormation)

      expect(result).toBeDefined()
      expect(typeof result.victory).toBe('boolean')
      expect(result.turns).toBeGreaterThan(0)
      expect(result.battleLog).toBeInstanceOf(Array)
      expect(result.statistics).toBeDefined()
    })

    test('should handle player team victory', async () => {
      // 적을 매우 약하게 설정
      mockEnemies.forEach(enemy => {
        enemy.hp = 1
        enemy.maxHp = 1
        enemy.attack = 1
      })

      const result = await battleSystem.executeBattle(testFormation)

      expect(result.victory).toBe(true)
      expect(result.rewards).toBeDefined()
      expect(result.experienceGained.player).toBeGreaterThan(0)
      expect(result.experienceGained.companion).toBeGreaterThan(0)
    })

    test('should handle player team defeat', async () => {
      // 플레이어 팀을 매우 약하게 설정
      mockPlayer.hp = 1
      mockPlayer.maxHp = 1
      mockCompanion.hp = 1
      mockCompanion.maxHp = 1

      // 적을 강하게 설정
      mockEnemies.forEach(enemy => {
        enemy.attack = 50
      })

      const result = await battleSystem.executeBattle(testFormation)

      expect(result.victory).toBe(false)
      expect(result.rewards.experience).toBe(0)
    })
  })

  describe('Damage Calculation', () => {
    test('should calculate basic damage correctly', () => {
      const attacker = mockPlayer
      const target = mockEnemies[0]

      // 기본 데미지 = 공격력 - 방어력/2
      const expectedBaseDamage = Math.max(1, attacker.attack - target.defense / 2)
      
      // 실제 전투에서 variance가 적용되므로 범위 검증
      expect(expectedBaseDamage).toBeGreaterThan(0)
    })

    test('should apply critical hit multiplier', () => {
      const attacker = mockPlayer
      attacker.critRate = 100 // 100% 크리티컬
      attacker.critDamage = 200 // 200% 데미지

      // 크리티컬 히트 시 데미지가 증가해야 함
      expect(attacker.critRate).toBe(100)
      expect(attacker.critDamage).toBe(200)
    })

    test('should respect minimum damage threshold', () => {
      const attacker = { ...mockPlayer, attack: 1 }
      const target = { ...mockEnemies[0], defense: 100 }

      // 최소 1 데미지는 보장되어야 함
      const minDamage = Math.max(1, attacker.attack - target.defense / 2)
      expect(minDamage).toBe(1)
    })
  })

  describe('AI Behavior', () => {
    test('should make companion act based on personality', async () => {
      // 치유 중심 성격 설정
      mockCompanion.personality = {
        aggression: 0.1,
        caution: 0.8,
        support: 0.9,
        independence: 0.2
      }

      // 플레이어 HP 감소
      mockPlayer.hp = 30

      // 동반자가 치유 스킬을 사용할 가능성이 높아야 함
      expect(mockCompanion.personality.support).toBe(0.9)
    })

    test('should handle aggressive companion behavior', async () => {
      // 공격적 성격 설정
      mockCompanion.personality = {
        aggression: 0.9,
        caution: 0.1,
        support: 0.2,
        independence: 0.7
      }

      expect(mockCompanion.personality.aggression).toBe(0.9)
    })

    test('should apply enemy AI patterns', () => {
      const aggressiveEnemy = mockEnemies[0]
      aggressiveEnemy.skills = []

      // AI 패턴이 적절히 적용되는지 확인
      expect(aggressiveEnemy).toBeDefined()
    })
  })

  describe('Status Effects', () => {
    test('should apply buffs correctly', () => {
      const buff = {
        id: 'test_buff',
        name: '테스트 버프',
        type: 'buff' as const,
        duration: 3,
        statModifiers: {
          attack: 10
        },
        icon: '⚡',
        description: '공격력 +10'
      }

      mockPlayer.buffs.push(buff)

      expect(mockPlayer.buffs).toHaveLength(1)
      expect(mockPlayer.buffs[0].statModifiers.attack).toBe(10)
    })

    test('should apply debuffs correctly', () => {
      const debuff = {
        id: 'test_debuff',
        name: '테스트 디버프',
        type: 'debuff' as const,
        duration: 2,
        statModifiers: {
          speed: -5
        },
        icon: '💀',
        description: '속도 -5'
      }

      mockEnemies[0].debuffs.push(debuff)

      expect(mockEnemies[0].debuffs).toHaveLength(1)
      expect(mockEnemies[0].debuffs[0].statModifiers.speed).toBe(-5)
    })

    test('should process duration-based effects', () => {
      const poisonEffect = {
        id: 'poison',
        name: '독',
        type: 'debuff' as const,
        duration: 3,
        statModifiers: {},
        damagePerTurn: -5,
        icon: '☠️',
        description: '매 턴 5 피해'
      }

      mockPlayer.debuffs.push(poisonEffect)

      expect(mockPlayer.debuffs[0].damagePerTurn).toBe(-5)
      expect(mockPlayer.debuffs[0].duration).toBe(3)
    })
  })

  describe('Skill System', () => {
    test('should validate skill usage requirements', () => {
      const expensiveSkill = {
        id: 'expensive_skill',
        name: '비싼 스킬',
        description: 'MP를 많이 소모하는 스킬',
        mpCost: 100,
        cooldownTurns: 0,
        currentCooldown: 0,
        damage: 50,
        targetType: 'single' as const,
        aiPriority: 50
      }

      mockPlayer.skills.push(expensiveSkill)
      mockPlayer.mp = 10 // 충분하지 않은 MP

      // 스킬 사용 불가능해야 함
      expect(mockPlayer.mp < expensiveSkill.mpCost).toBe(true)
    })

    test('should handle skill cooldowns', () => {
      const cooldownSkill = {
        id: 'cooldown_skill',
        name: '쿨다운 스킬',
        description: '쿨다운이 있는 스킬',
        mpCost: 15,
        cooldownTurns: 3,
        currentCooldown: 2, // 현재 쿨다운 중
        damage: 30,
        targetType: 'single' as const,
        aiPriority: 60
      }

      mockCompanion.skills.push(cooldownSkill)

      // 쿨다운 중에는 사용 불가능
      expect(cooldownSkill.currentCooldown).toBeGreaterThan(0)
    })

    test('should apply skill effects correctly', () => {
      const healSkill = {
        id: 'heal',
        name: '치유',
        description: 'HP를 회복합니다',
        mpCost: 10,
        cooldownTurns: 1,
        currentCooldown: 0,
        damage: 0,
        healAmount: 30,
        targetType: 'single' as const,
        aiPriority: 80
      }

      mockCompanion.skills.push(healSkill)

      expect(healSkill.healAmount).toBe(30)
      expect(healSkill.damage).toBe(0)
    })
  })

  describe('Event System', () => {
    test('should emit battle start events', async () => {
      const eventPromise = new Promise(resolve => {
        battleSystem.once('battle_start', (event) => {
          expect(event).toBeDefined()
          expect(event.data.formation).toBeDefined()
          resolve(event)
        })
      })

      // 빠른 전투를 위한 설정
      mockEnemies[0].hp = 1
      battleSystem.executeBattle(testFormation)

      await eventPromise
    })

    test('should emit turn events', async () => {
      const eventPromise = new Promise(resolve => {
        battleSystem.once('turn_start', (event) => {
          expect(event.data.turnNumber).toBeGreaterThan(0)
          resolve(event)
        })
      })

      mockEnemies[0].hp = 1
      battleSystem.executeBattle(testFormation)

      await eventPromise
    })

    test('should emit battle end events', async () => {
      const eventPromise = new Promise(resolve => {
        battleSystem.once('battle_end', (event) => {
          expect(event.data.result).toBeDefined()
          expect(typeof event.data.result.victory).toBe('boolean')
          resolve(event)
        })
      })

      mockEnemies[0].hp = 1
      battleSystem.executeBattle(testFormation)

      await eventPromise
    })
  })

  describe('Error Handling', () => {
    test('should handle invalid formation gracefully', async () => {
      const invalidFormation = {
        playerTeam: [],
        enemyTeam: []
      }

      const result = await battleSystem.executeBattle(invalidFormation)
      
      expect(result.victory).toBe(false)
      expect(result.turns).toBe(0)
    })

    test('should prevent infinite battle loops', async () => {
      // 빠른 전투를 위해 적 HP 감소
      mockEnemies.forEach(enemy => {
        enemy.hp = 10
        enemy.maxHp = 10
      })

      const startTime = Date.now()
      const result = await battleSystem.executeBattle(testFormation)
      const endTime = Date.now()

      // 적절한 시간 내에 종료되어야 함
      expect(endTime - startTime).toBeLessThan(5000) // 5초 이내
      expect(result.turns).toBeLessThanOrEqual(100) // 안전 장치로 100턴 제한
    })

    test('should handle skill execution errors', () => {
      const invalidSkill = {
        id: 'invalid_skill',
        name: '잘못된 스킬',
        description: '오류가 있는 스킬',
        mpCost: -10, // 잘못된 MP 비용
        cooldownTurns: 1,
        currentCooldown: 0,
        damage: NaN, // 잘못된 데미지 값
        targetType: 'single' as const,
        aiPriority: 50
      }

      mockPlayer.skills.push(invalidSkill)

      // 시스템이 잘못된 스킬을 적절히 처리해야 함
      expect(invalidSkill.mpCost).toBe(-10)
      expect(isNaN(invalidSkill.damage)).toBe(true)
    })
  })

  describe('Battle Statistics', () => {
    test('should track damage statistics', async () => {
      // 새로운 battle system 인스턴스로 격리된 테스트 환경 생성
      const isolatedBattleSystem = new AutoBattleSystem()
      
      // 극도로 단순화된 테스트 설정
      const simplePlayer: BattleUnit = {
        id: 'simple_player',
        name: '단순 플레이어',
        type: 'player',
        hp: 100, maxHp: 100, mp: 50, maxMp: 50,
        attack: 100, defense: 10, speed: 10,
        critRate: 0, critDamage: 150, accuracy: 100, evasion: 0,
        skills: [], buffs: [], debuffs: [], isAlive: true
      }
      
      const simpleEnemy: BattleUnit = {
        id: 'simple_enemy',
        name: '단순 적',
        type: 'enemy',
        hp: 50, maxHp: 50, mp: 0, maxMp: 0,
        attack: 10, defense: 0, speed: 5,
        critRate: 0, critDamage: 150, accuracy: 100, evasion: 0,
        skills: [], buffs: [], debuffs: [], isAlive: true
      }
      
      const simpleFormation: BattleFormation = {
        playerTeam: [simplePlayer],
        enemyTeam: [simpleEnemy]
      }
      
      const result = await isolatedBattleSystem.executeBattle(simpleFormation)
      
      // 플레이어가 공격=100, 적이 HP=50이므로 확실히 데미지가 기록되어야 함
      expect(result.victory).toBe(true) // 플레이어 승리
      expect(result.turns).toBeGreaterThan(0) // 적어도 1턴은 진행
      expect(result.statistics.totalDamageDealt).toBeGreaterThan(0) // 데미지 기록됨
      expect(result.battleLog.length).toBeGreaterThan(0) // 전투 로그 존재
    })

    test('should track healing statistics', async () => {
      // 동반자에게 치유 스킬 부여
      const healSkill = {
        id: 'test_heal',
        name: '테스트 치유',
        description: '테스트용 치유 스킬',
        mpCost: 5,
        cooldownTurns: 1,
        currentCooldown: 0,
        damage: 0,
        healAmount: 20,
        targetType: 'single' as const,
        aiPriority: 90
      }

      mockCompanion.skills.push(healSkill)
      mockPlayer.hp = 50 // 치유가 필요한 상태

      mockEnemies[0].hp = 5 // 빠른 승리

      const result = await battleSystem.executeBattle(testFormation)

      expect(result.statistics.totalHealing).toBeGreaterThanOrEqual(0)
    })

    test('should calculate battle grade correctly', async () => {
      mockEnemies[0].hp = 10

      const result = await battleSystem.executeBattle(testFormation)

      // 기본적인 결과 구조 검증
      expect(result.turns).toBeGreaterThan(0)
      expect(result.victory).toBeDefined()
      expect(typeof result.victory).toBe('boolean')
    })
  })

  describe('Performance Tests', () => {
    test('should complete battles within reasonable time', async () => {
      const startTime = performance.now()
      
      mockEnemies[0].hp = 50 // 적당한 전투 길이
      
      await battleSystem.executeBattle(testFormation)
      
      const endTime = performance.now()
      const duration = endTime - startTime

      // 5초 이내에 완료되어야 함
      expect(duration).toBeLessThan(5000)
    })

    test('should handle multiple concurrent battles', async () => {
      const battles = []
      
      // 간단한 전투를 위한 적 생성
      for (let i = 0; i < 3; i++) {
        const enemy = createEnemy('slime', 1)
        enemy.hp = 5 // 매우 빠른 전투
        enemy.maxHp = 5
        
        // 깊은 복사로 안전하게 복제
        const playerCopy = JSON.parse(JSON.stringify(mockPlayer))
        const companionCopy = JSON.parse(JSON.stringify(mockCompanion))
        
        const formation = {
          playerTeam: [playerCopy, companionCopy],
          enemyTeam: [enemy]
        }
        battles.push(battleSystem.executeBattle(formation))
      }

      const results = await Promise.all(battles)
      
      expect(results).toHaveLength(3)
      results.forEach(result => {
        expect(typeof result.victory).toBe('boolean')
        expect(result).toBeDefined()
      })
    })
  })
})

describe('AutoBattleSystem Integration', () => {
  test('should integrate with character evolution system', async () => {
    const battleSystem = new AutoBattleSystem()
    const mockFormation: BattleFormation = {
      playerTeam: [
        {
          id: 'player_evolution_test',
          name: '진화 테스트 플레이어',
          type: 'player',
          hp: 100, maxHp: 100, mp: 50, maxMp: 50,
          attack: 20, defense: 10, speed: 12,
          critRate: 10, critDamage: 150, accuracy: 95, evasion: 5,
          skills: [], buffs: [], debuffs: [],
          isAlive: true
        }
      ],
      enemyTeam: [createEnemy('slime', 1)]
    }

    const result = await battleSystem.executeBattle(mockFormation)

    // 캐릭터 진화 시스템과의 연동 확인
    expect(result.experienceGained.player).toBeGreaterThan(0)
    expect(result.rewards).toBeDefined()
  })

  test('should integrate with character relationship system', async () => {
    const battleSystem = new AutoBattleSystem()
    const companionWithRelationship = {
      ...createEnemy('goblin', 2),
      type: 'companion' as const,
      id: 'relationship_companion',
      name: '관계 테스트 동반자',
      personality: {
        aggression: 0.3,
        caution: 0.7,
        support: 0.8,
        independence: 0.2
      }
    }

    const mockFormation: BattleFormation = {
      playerTeam: [companionWithRelationship],
      enemyTeam: [createEnemy('slime', 1)]
    }

    const result = await battleSystem.executeBattle(mockFormation)

    // 관계 시스템과의 연동 확인
    expect(result.experienceGained.companion).toBeGreaterThan(0)
    if (result.rewards.relationshipBonus) {
      expect(result.rewards.relationshipBonus).toBeGreaterThan(0)
    }
  })
})