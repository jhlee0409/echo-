#!/usr/bin/env node

/**
 * 전투 밸런싱 자동화 스크립트
 * 전투 시스템의 균형을 자동으로 조정
 */

import fs from 'fs/promises'
import path from 'path'

async function balanceCombatStats() {
  console.log('⚖️ 전투 밸런싱 시작...')
  
  try {
    // 1. 밸런싱 설정 파일 생성
    const balanceConfig = {
      // 기본 성장 공식
      growthFormulas: {
        player: {
          hp: (level) => 100 + level * 20,
          mp: (level) => 50 + level * 10,
          attack: (level) => 15 + level * 3,
          defense: (level) => 10 + level * 2,
          speed: (level) => 10 + level
        },
        companion: {
          hp: (level, personality) => {
            const base = 80 + level * 15
            const carefulBonus = personality.careful * 20
            const independentBonus = personality.independent * 10
            return Math.floor(base + carefulBonus + independentBonus)
          },
          attack: (level, personality) => {
            const base = 12 + level * 2.5
            const independentBonus = personality.independent * 5
            const playfulBonus = personality.playful * 3
            return Math.floor(base + independentBonus + playfulBonus)
          },
          defense: (level, personality) => {
            const base = 8 + level * 1.5
            const carefulBonus = personality.careful * 7
            const caringBonus = personality.caring * 3
            return Math.floor(base + carefulBonus + caringBonus)
          }
        },
        enemies: {
          slime: {
            hp: (level) => 50 + level * 10,
            attack: (level) => 8 + level * 1.5,
            defense: (level) => 5 + level,
            speed: 5
          },
          goblin: {
            hp: (level) => 80 + level * 15,
            attack: (level) => 12 + level * 2,
            defense: (level) => 8 + level * 1.5,
            speed: 12
          },
          wolf: {
            hp: (level) => 120 + level * 20,
            attack: (level) => 18 + level * 3,
            defense: (level) => 10 + level * 2,
            speed: 15
          }
        }
      },
      
      // 난이도 곡선
      difficultyCurve: {
        easy: { damageMultiplier: 0.7, hpMultiplier: 0.8 },
        normal: { damageMultiplier: 1.0, hpMultiplier: 1.0 },
        hard: { damageMultiplier: 1.3, hpMultiplier: 1.2 },
        expert: { damageMultiplier: 1.5, hpMultiplier: 1.4 }
      },
      
      // 전투 길이 목표 (턴 수)
      targetBattleDuration: {
        normal_enemies: { min: 3, max: 8 },
        boss_enemies: { min: 8, max: 15 },
        pvp: { min: 5, max: 12 }
      },
      
      // 밸런싱 목표
      balanceTargets: {
        winRate: 0.75,        // 플레이어 승률 목표 75%
        avgTurns: 5,          // 평균 전투 턴 수
        companionUsage: 0.8,  // 동반자 활용도 80%
        criticalRate: 0.15,   // 치명타 발생률 15%
        skillUsage: 0.6       // 스킬 사용률 60%
      }
    }
    
    await fs.mkdir('./src/data/balance', { recursive: true })
    await fs.writeFile(
      './src/data/balance/combat-balance.json',
      JSON.stringify(balanceConfig, null, 2)
    )
    console.log('✅ 밸런싱 설정 파일 생성 완료')
    
    // 2. 전투 시뮬레이션 시스템 생성
    const simulationTemplate = `/**
 * 전투 밸런싱 시뮬레이션 시스템
 */
import type { BattleUnit } from '@systems/battle/types'
import { getBattleSystem } from '@systems/battle/AutoBattleSystem'
import balanceConfig from '@data/balance/combat-balance.json'

export interface SimulationResult {
  winRate: number
  avgTurns: number
  avgDamagePerTurn: number
  companionEffectiveness: number
  skillUsageRate: number
  criticalHitRate: number
  recommendations: string[]
}

export class CombatSimulator {
  private battleSystem = getBattleSystem()
  
  /**
   * 전투 시뮬레이션 실행 (N회 반복)
   */
  async runSimulation(
    playerTemplate: Partial<BattleUnit>,
    companionTemplate: Partial<BattleUnit>,
    enemyTemplates: Partial<BattleUnit>[],
    iterations: number = 1000
  ): Promise<SimulationResult> {
    console.log(\`🎮 \${iterations}회 전투 시뮬레이션 시작...\`)
    
    let wins = 0
    let totalTurns = 0
    let totalDamage = 0
    let companionActions = 0
    let totalSkillsUsed = 0
    let totalCrits = 0
    let totalActions = 0
    
    for (let i = 0; i < iterations; i++) {
      // 전투 유닛 생성
      const player = this.createBattleUnit(playerTemplate, 'player')
      const companion = this.createBattleUnit(companionTemplate, 'companion')
      const enemies = enemyTemplates.map(template => 
        this.createBattleUnit(template, 'enemy')
      )
      
      try {
        const result = await this.battleSystem.executeBattle(player, companion, enemies)
        
        if (result.victory) wins++
        totalTurns += result.turns
        totalDamage += result.statistics.totalDamageDealt
        totalSkillsUsed += result.statistics.skillsUsed
        totalCrits += result.statistics.criticalHits
        
        // 동반자 행동 분석
        const companionActionCount = result.battleLog.filter(
          log => log.actor.includes('동반자') || log.actor.includes('companion')
        ).length
        companionActions += companionActionCount
        
        totalActions += result.battleLog.filter(log => 
          log.action === '공격!' || log.action.includes('시전')
        ).length
        
      } catch (error) {
        console.warn(\`시뮬레이션 \${i + 1} 실패:\`, error.message)
      }
      
      // 진행률 표시
      if ((i + 1) % 100 === 0) {
        console.log(\`  진행률: \${i + 1}/\${iterations} (\${Math.round((i + 1) / iterations * 100)}%)\`)
      }
    }
    
    // 결과 계산
    const winRate = wins / iterations
    const avgTurns = totalTurns / iterations
    const avgDamagePerTurn = totalDamage / totalTurns
    const companionEffectiveness = companionActions / totalActions
    const skillUsageRate = totalSkillsUsed / totalActions
    const criticalHitRate = totalCrits / totalActions
    
    // 밸런싱 권장사항 생성
    const recommendations = this.generateRecommendations({
      winRate,
      avgTurns,
      avgDamagePerTurn,
      companionEffectiveness,
      skillUsageRate,
      criticalHitRate
    })
    
    return {
      winRate,
      avgTurns,
      avgDamagePerTurn,
      companionEffectiveness,
      skillUsageRate,
      criticalHitRate,
      recommendations
    }
  }
  
  /**
   * 밸런싱 권장사항 생성
   */
  private generateRecommendations(stats: {
    winRate: number
    avgTurns: number
    companionEffectiveness: number
    skillUsageRate: number
    criticalHitRate: number
  }): string[] {
    const recommendations: string[] = []
    const targets = balanceConfig.balanceTargets
    
    // 승률 분석
    if (stats.winRate < targets.winRate - 0.1) {
      recommendations.push('승률이 낮음: 플레이어/동반자 스탯 10% 증가 권장')
    } else if (stats.winRate > targets.winRate + 0.1) {
      recommendations.push('승률이 높음: 적 스탯 15% 증가 권장')
    }
    
    // 전투 길이 분석
    if (stats.avgTurns < 3) {
      recommendations.push('전투가 너무 짧음: 모든 유닛 HP 20% 증가 권장')
    } else if (stats.avgTurns > 10) {
      recommendations.push('전투가 너무 길음: 전체 공격력 15% 증가 권장')
    }
    
    // 동반자 활용도 분석
    if (stats.companionEffectiveness < 0.3) {
      recommendations.push('동반자 활용도 낮음: 동반자 AI 개선 또는 스킬 강화 필요')
    }
    
    // 스킬 사용률 분석
    if (stats.skillUsageRate < 0.4) {
      recommendations.push('스킬 사용률 낮음: MP 회복 증가 또는 스킬 비용 감소 권장')
    }
    
    // 치명타 발생률 분석
    if (stats.criticalHitRate < 0.1) {
      recommendations.push('치명타 발생률 낮음: 크리티컬 확률 5% 증가 권장')
    } else if (stats.criticalHitRate > 0.25) {
      recommendations.push('치명타 발생률 높음: 크리티컬 확률 3% 감소 권장')
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ 밸런스가 양호합니다!')
    }
    
    return recommendations
  }
  
  /**
   * 전투 유닛 생성
   */
  private createBattleUnit(template: Partial<BattleUnit>, type: string): BattleUnit {
    const baseUnit: BattleUnit = {
      id: \`\${type}_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`,
      name: template.name || type,
      type: type as any,
      hp: 100,
      maxHp: 100,
      mp: 50,
      maxMp: 50,
      attack: 15,
      defense: 10,
      speed: 10,
      critRate: 10,
      critDamage: 150,
      accuracy: 95,
      evasion: 5,
      skills: [],
      buffs: [],
      debuffs: [],
      isAlive: true,
      ...template
    }
    
    return baseUnit
  }
  
  /**
   * 자동 밸런싱 적용
   */
  async autoBalance(
    currentStats: any,
    targetMetrics: any
  ): Promise<any> {
    const adjustments = {}
    
    // 승률 기반 조정
    if (currentStats.winRate < targetMetrics.winRate) {
      adjustments.playerAttackMultiplier = 1.1
      adjustments.companionAttackMultiplier = 1.1
      adjustments.enemyHpMultiplier = 0.9
    } else if (currentStats.winRate > targetMetrics.winRate) {
      adjustments.playerAttackMultiplier = 0.95
      adjustments.companionAttackMultiplier = 0.95
      adjustments.enemyAttackMultiplier = 1.05
    }
    
    // 전투 길이 기반 조정
    if (currentStats.avgTurns < targetMetrics.minTurns) {
      adjustments.globalAttackMultiplier = 0.9
      adjustments.globalHpMultiplier = 1.1
    } else if (currentStats.avgTurns > targetMetrics.maxTurns) {
      adjustments.globalAttackMultiplier = 1.1
      adjustments.globalHpMultiplier = 0.95
    }
    
    return adjustments
  }
}

// 싱글톤
let simulator: CombatSimulator | null = null

export function getCombatSimulator(): CombatSimulator {
  if (!simulator) {
    simulator = new CombatSimulator()
  }
  return simulator
}
`

    await fs.writeFile(
      './src/systems/balance/CombatSimulator.ts',
      simulationTemplate
    )
    console.log('✅ 전투 시뮬레이션 시스템 생성 완료')
    
    // 3. 밸런싱 테스트 스크립트 생성
    const testTemplate = `/**
 * 전투 밸런싱 테스트
 */
import { getCombatSimulator } from '../balance/CombatSimulator'
import type { BattleUnit } from './types'

describe('Combat Balance Tests', () => {
  const simulator = getCombatSimulator()
  
  test('Player vs Single Slime Balance', async () => {
    const player: Partial<BattleUnit> = {
      name: '테스트 플레이어',
      hp: 100,
      maxHp: 100,
      mp: 50,
      maxMp: 50,
      attack: 15,
      defense: 10,
      speed: 10
    }
    
    const companion: Partial<BattleUnit> = {
      name: '테스트 동반자',
      hp: 80,
      maxHp: 80,
      mp: 40,
      maxMp: 40,
      attack: 12,
      defense: 8,
      speed: 8
    }
    
    const slime: Partial<BattleUnit> = {
      name: '슬라임',
      hp: 50,
      maxHp: 50,
      mp: 20,
      maxMp: 20,
      attack: 8,
      defense: 5,
      speed: 5
    }
    
    const result = await simulator.runSimulation(
      player,
      companion,
      [slime],
      100 // 100회 시뮬레이션
    )
    
    console.log('=== 플레이어 vs 슬라임 밸런스 테스트 ===')
    console.log(\`승률: \${(result.winRate * 100).toFixed(1)}%\`)
    console.log(\`평균 턴 수: \${result.avgTurns.toFixed(1)}\`)
    console.log(\`동반자 효과도: \${(result.companionEffectiveness * 100).toFixed(1)}%\`)
    console.log(\`스킬 사용률: \${(result.skillUsageRate * 100).toFixed(1)}%\`)
    console.log('권장사항:')
    result.recommendations.forEach(rec => console.log(\`  - \${rec}\`))
    
    // 밸런스 검증
    expect(result.winRate).toBeGreaterThan(0.6)
    expect(result.winRate).toBeLessThan(0.9)
    expect(result.avgTurns).toBeGreaterThan(2)
    expect(result.avgTurns).toBeLessThan(8)
  }, 30000) // 30초 타임아웃
  
  test('Player vs Multiple Enemies Balance', async () => {
    const player: Partial<BattleUnit> = {
      name: '플레이어',
      hp: 120,
      attack: 18,
      defense: 12
    }
    
    const companion: Partial<BattleUnit> = {
      name: '동반자',
      hp: 100,
      attack: 15,
      defense: 10
    }
    
    const enemies = [
      { name: '고블린1', hp: 60, attack: 10, defense: 6 },
      { name: '고블린2', hp: 60, attack: 10, defense: 6 }
    ]
    
    const result = await simulator.runSimulation(
      player,
      companion,
      enemies,
      50
    )
    
    console.log('\\n=== 플레이어 vs 다수 적 밸런스 테스트 ===')
    console.log(\`승률: \${(result.winRate * 100).toFixed(1)}%\`)
    console.log(\`평균 턴 수: \${result.avgTurns.toFixed(1)}\`)
    
    expect(result.winRate).toBeGreaterThan(0.5)
    expect(result.avgTurns).toBeGreaterThan(3)
  }, 20000)
  
  test('Difficulty Scaling', async () => {
    const basePlayer = {
      name: '플레이어',
      hp: 100,
      attack: 15,
      defense: 10
    }
    
    const baseCompanion = {
      name: '동반자',
      hp: 80,
      attack: 12,
      defense: 8
    }
    
    // 레벨 1-5까지 테스트
    for (let level = 1; level <= 5; level++) {
      const player = {
        ...basePlayer,
        hp: basePlayer.hp + level * 20,
        attack: basePlayer.attack + level * 3
      }
      
      const companion = {
        ...baseCompanion,
        hp: baseCompanion.hp + level * 15,
        attack: baseCompanion.attack + level * 2
      }
      
      const enemy = {
        name: \`레벨\${level} 적\`,
        hp: 50 + level * 15,
        attack: 8 + level * 2,
        defense: 5 + level
      }
      
      const result = await simulator.runSimulation(
        player,
        companion,
        [enemy],
        20
      )
      
      console.log(\`\\n레벨 \${level} 밸런스: 승률 \${(result.winRate * 100).toFixed(1)}%, 평균 \${result.avgTurns.toFixed(1)}턴\`)
      
      // 레벨이 올라가도 적절한 난이도 유지
      expect(result.winRate).toBeGreaterThan(0.6)
      expect(result.winRate).toBeLessThan(0.85)
    }
  }, 60000)
})
`

    await fs.mkdir('./src/systems/battle/__tests__', { recursive: true })
    await fs.writeFile(
      './src/systems/battle/__tests__/balance.test.ts',
      testTemplate
    )
    console.log('✅ 밸런싱 테스트 생성 완료')
    
    // 4. 밸런싱 리포트 생성 스크립트
    const reportTemplate = `#!/usr/bin/env node

/**
 * 전투 밸런싱 리포트 생성
 */

import { getCombatSimulator } from '../src/systems/balance/CombatSimulator.js'
import fs from 'fs/promises'

async function generateBalanceReport() {
  console.log('📊 전투 밸런싱 리포트 생성 시작...')
  
  const simulator = getCombatSimulator()
  
  // 여러 시나리오 테스트
  const scenarios = [
    {
      name: '초보자 vs 슬라임',
      player: { name: '초보자', hp: 100, attack: 15, defense: 10 },
      companion: { name: '루나', hp: 80, attack: 12, defense: 8 },
      enemies: [{ name: '슬라임', hp: 50, attack: 8, defense: 5 }]
    },
    {
      name: '중급자 vs 고블린 무리',
      player: { name: '모험가', hp: 150, attack: 20, defense: 15 },
      companion: { name: '아리아', hp: 120, attack: 18, defense: 12 },
      enemies: [
        { name: '고블린1', hp: 70, attack: 12, defense: 8 },
        { name: '고블린2', hp: 70, attack: 12, defense: 8 }
      ]
    },
    {
      name: '고급자 vs 늑대 우두머리',
      player: { name: '용사', hp: 200, attack: 25, defense: 20 },
      companion: { name: '유나', hp: 160, attack: 22, defense: 18 },
      enemies: [{ name: '늑대 우두머리', hp: 250, attack: 30, defense: 15 }]
    }
  ]
  
  const results = []
  
  for (const scenario of scenarios) {
    console.log(\`\n🔄 "\${scenario.name}" 시나리오 시뮬레이션 중...\`)
    
    const result = await simulator.runSimulation(
      scenario.player,
      scenario.companion,
      scenario.enemies,
      200 // 200회 시뮬레이션
    )
    
    results.push({
      scenarioName: scenario.name,
      ...result
    })
  }
  
  // 리포트 생성
  const reportDate = new Date().toLocaleString('ko-KR')
  const reportContent = \`# 소울메이트 전투 밸런싱 리포트

생성 일시: \${reportDate}

## 시뮬레이션 결과 요약

\${results.map((result, index) => \`
### \${result.scenarioName}

- **승률**: \${(result.winRate * 100).toFixed(1)}%
- **평균 전투 길이**: \${result.avgTurns.toFixed(1)}턴
- **동반자 효과도**: \${(result.companionEffectiveness * 100).toFixed(1)}%
- **스킬 사용률**: \${(result.skillUsageRate * 100).toFixed(1)}%
- **치명타 발생률**: \${(result.criticalHitRate * 100).toFixed(1)}%

**권장사항**:
\${result.recommendations.map(rec => \`- \${rec}\`).join('\\n')}
\`).join('\\n')}

## 전체 분석

### 밸런스 상태
- 전체 평균 승률: \${(results.reduce((sum, r) => sum + r.winRate, 0) / results.length * 100).toFixed(1)}%
- 전체 평균 전투 길이: \${(results.reduce((sum, r) => sum + r.avgTurns, 0) / results.length).toFixed(1)}턴

### 개선 필요 사항
\${results.flatMap(r => r.recommendations)
  .filter((rec, index, arr) => arr.indexOf(rec) === index) // 중복 제거
  .map(rec => \`- \${rec}\`).join('\\n')}

## 결론

\${results.every(r => r.winRate > 0.6 && r.winRate < 0.9)
  ? '✅ 전반적으로 균형잡힌 밸런스를 보이고 있습니다.'
  : '⚠️  일부 시나리오에서 밸런스 조정이 필요합니다.'}

---
*이 리포트는 자동 시뮬레이션을 통해 생성되었습니다.*
\`
  
  // 파일 저장
  await fs.mkdir('./reports', { recursive: true })
  await fs.writeFile(
    './reports/balance-report.md',
    reportContent
  )
  
  // 콘솔 출력
  console.log('\\n📊 밸런싱 리포트 생성 완료!')
  console.log('  파일 위치: ./reports/balance-report.md')
  
  // 요약 출력
  console.log('\\n📈 시뮬레이션 결과 요약:')
  results.forEach(result => {
    console.log(\`  \${result.scenarioName}: 승률 \${(result.winRate * 100).toFixed(1)}%, \${result.avgTurns.toFixed(1)}턴\`)
  })
}

generateBalanceReport().catch(console.error)
`

    await fs.writeFile(
      './scripts/generate-balance-report.js',
      reportTemplate
    )
    console.log('✅ 밸런싱 리포트 스크립트 생성 완료')
    
    console.log('\n⚖️ 전투 밸런싱 시스템 구현 완료!')
    console.log('생성된 파일:')
    console.log('  - /src/data/balance/combat-balance.json')
    console.log('  - /src/systems/balance/CombatSimulator.ts')
    console.log('  - /src/systems/battle/__tests__/balance.test.ts')
    console.log('  - /scripts/generate-balance-report.js')
    
    console.log('\n🎮 밸런싱 테스트 실행 방법:')
    console.log('  npm test balance.test.ts          # 밸런스 테스트')
    console.log('  node scripts/generate-balance-report.js  # 리포트 생성')
    
  } catch (error) {
    console.error('❌ 전투 밸런싱 중 오류:', error)
    process.exit(1)
  }
}

// 실행
balanceCombatStats().catch(console.error)