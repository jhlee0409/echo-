import fs from 'fs/promises'

const autoBattleTemplate = `export interface BattleUnit {
  id: string
  name: string
  hp: number
  maxHp: number
  mp: number
  maxMp: number
  attack: number
  defense: number
  speed: number
  skills: Skill[]
}

export interface Skill {
  id: string
  name: string
  damage: number
  mpCost: number
  targetType: 'single' | 'all'
  element?: 'fire' | 'water' | 'earth' | 'wind'
}

export class AutoBattleSystem {
  private battleLog: string[] = []
  
  async executeBattle(
    player: BattleUnit,
    companion: BattleUnit,
    enemies: BattleUnit[]
  ): Promise<BattleResult> {
    this.battleLog = []
    let turn = 0
    
    while (!this.isBattleOver(player, enemies)) {
      turn++
      this.battleLog.push(\`=== Turn \${turn} ===\`)
      
      // 속도 순으로 행동 순서 정렬
      const turnOrder = this.calculateTurnOrder([player, companion, ...enemies])
      
      for (const unit of turnOrder) {
        if (unit.hp <= 0) continue
        
        if (unit === companion) {
          // AI 동반자 자동 행동
          await this.executeCompanionAction(companion, enemies)
        } else if (enemies.includes(unit)) {
          // 적 행동
          await this.executeEnemyAction(unit, [player, companion])
        }
      }
    }
    
    return {
      victory: enemies.every(e => e.hp <= 0),
      battleLog: this.battleLog,
      rewards: this.calculateRewards(enemies)
    }
  }
  
  private async executeCompanionAction(companion: BattleUnit, enemies: BattleUnit[]) {
    // AI가 최적의 행동 선택
    const action = this.chooseOptimalAction(companion, enemies)
    
    if (action.type === 'attack') {
      const damage = this.calculateDamage(companion, action.target)
      action.target.hp -= damage
      this.battleLog.push(\`\${companion.name}의 공격! \${action.target.name}에게 \${damage} 데미지!\`)
    } else if (action.type === 'skill') {
      // 스킬 사용 로직
      const skill = action.skill
      const damage = skill.damage + companion.attack
      action.target.hp -= damage
      companion.mp -= skill.mpCost
      this.battleLog.push(\`\${companion.name}의 \${skill.name}! \${damage} 데미지!\`)
    }
  }
  
  private chooseOptimalAction(unit: BattleUnit, targets: BattleUnit[]) {
    // 간단한 AI 로직
    const aliveTargets = targets.filter(t => t.hp > 0)
    const weakestTarget = aliveTargets.sort((a, b) => a.hp - b.hp)[0]
    
    // MP가 충분하고 강력한 스킬이 있으면 사용
    const powerfulSkill = unit.skills.find(s => s.mpCost <= unit.mp && s.damage > unit.attack * 2)
    
    if (powerfulSkill && Math.random() > 0.3) {
      return { type: 'skill', skill: powerfulSkill, target: weakestTarget }
    }
    
    return { type: 'attack', target: weakestTarget }
  }
  
  private calculateDamage(attacker: BattleUnit, defender: BattleUnit): number {
    const baseDamage = attacker.attack - defender.defense / 2
    const variance = 0.8 + Math.random() * 0.4 // 80% ~ 120%
    return Math.max(1, Math.floor(baseDamage * variance))
  }
  
  private calculateTurnOrder(units: BattleUnit[]): BattleUnit[] {
    return units.sort((a, b) => b.speed - a.speed)
  }
  
  private isBattleOver(player: BattleUnit, enemies: BattleUnit[]): boolean {
    return player.hp <= 0 || enemies.every(e => e.hp <= 0)
  }
  
  private calculateRewards(enemies: BattleUnit[]) {
    return {
      exp: enemies.reduce((sum, e) => sum + e.maxHp, 0),
      gold: enemies.reduce((sum, e) => sum + e.maxHp / 2, 0),
      items: [] // TODO: 아이템 드롭 로직
    }
  }
}

export interface BattleResult {
  victory: boolean
  battleLog: string[]
  rewards: {
    exp: number
    gold: number
    items: any[]
  }
}
`

async function implementAutoBattle() {
  await fs.writeFile(
    './src/systems/AutoBattleSystem.ts',
    autoBattleTemplate
  )
  
  console.log('✅ 자동 전투 시스템 구현 완료')
}

implementAutoBattle()
