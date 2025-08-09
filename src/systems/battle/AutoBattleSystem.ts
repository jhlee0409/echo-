/**
 * 🗡️ Automated Battle System - execution-plan.md Implementation
 * 
 * Features:
 * - Turn-based combat with speed-based turn order
 * - AI-driven companion behavior based on personality
 * - Dynamic enemy AI with multiple patterns
 * - Skill system with cooldowns and resource management
 * - Status effects and elemental combat
 * - Battle analytics and balancing
 */

import { EventEmitter } from 'events'
import type {
  BattleUnit,
  BattleAction,
  BattleActionResult,
  BattleResult,
  BattleFormation,
  BattleConfig,
  BattleLogEntry,
  BattleStatistics,
  BattleTurn,
  BattleSkill,
  StatusEffect,
  BattleEvent,
  BattleEventListener,
  PersonalityInfluence,
  EnemyAIPattern
} from './types'
import type { EmotionType } from '@types'

export class AutoBattleSystem extends EventEmitter {
  private config: BattleConfig
  private currentBattle: BattleState | null = null
  
  constructor(config?: Partial<BattleConfig>) {
    super()
    
    this.config = {
      turnTimeLimit: 30,
      animationSpeed: 1.0,
      difficultyMultiplier: 1.0,
      companionAILevel: 'adaptive',
      enemyAILevel: 'normal',
      allowEscape: true,
      autoRevive: false,
      showDamageNumbers: true,
      ...config
    }
  }

  /**
   * Execute automated battle between player team and enemies
   */
  async executeBattle(formation: BattleFormation): Promise<BattleResult> {
    console.log('🗡️ Starting automated battle...')
    
    // Initialize battle state
    const currentBattle = this.initializeBattleState(formation)
    
    this.emitEvent('battle_start', { formation })
    
    let turnNumber = 0
    const battleTurns: BattleTurn[] = []
    
    // Main battle loop
    while (!this.isBattleOver(currentBattle)) {
      turnNumber++
      this.emitEvent('turn_start', { turnNumber })
      
      const turn = await this.executeTurn(turnNumber, currentBattle)
      battleTurns.push(turn)
      
      // Process end of turn effects
      this.processEndOfTurnEffects(currentBattle)
      
      this.emitEvent('turn_end', { turnNumber, turn })
      
      // Safety check to prevent infinite battles
      if (turnNumber >= 30) {
        console.warn('⚠️ Battle reached 30 turn limit, ending as draw')
        break
      }
    }
    
    // Generate battle result
    const result = this.generateBattleResult(battleTurns, currentBattle)
    
    this.emitEvent('battle_end', { result })
    console.log(`⚔️ Battle ended after ${turnNumber} turns. Victory: ${result.victory}`)
    
    return result
  }

  /**
   * Initialize battle state from formation
   */
  private initializeBattleState(formation: BattleFormation): BattleState {
    const allUnits = [...formation.playerTeam, ...formation.enemyTeam]
    
    // Ensure all units have required properties
    allUnits.forEach(unit => {
      unit.isAlive = unit.hp > 0
      unit.buffs = unit.buffs || []
      unit.debuffs = unit.debuffs || []
      unit.skills = unit.skills || []
      
      // Reset skill cooldowns
      unit.skills.forEach(skill => {
        skill.currentCooldown = 0
      })
    })

    return {
      playerTeam: formation.playerTeam,
      enemyTeam: formation.enemyTeam,
      allUnits,
      battleLog: [],
      statistics: {
        totalDamageDealt: 0,
        totalDamageReceived: 0,
        totalHealing: 0,
        skillsUsed: 0,
        criticalHits: 0,
        missedAttacks: 0,
        statusEffectsApplied: 0
      },
      environment: formation.environment
    }
  }

  /**
   * Execute a single battle turn
   */
  private async executeTurn(turnNumber: number, currentBattle: BattleState): Promise<BattleTurn> {
    const turnOrder = this.calculateTurnOrder(currentBattle)
    const actions: BattleActionResult[] = []
    
    for (const unit of turnOrder) {
      if (!unit.isAlive) continue
      
      // Determine unit action based on type and AI
      const action = await this.determineUnitAction(unit, currentBattle)
      
      if (action) {
        const result = await this.executeAction(unit, action)
        actions.push(result)
        
        // Update statistics
        this.updateStatistics(result, currentBattle)
        
        // Add to battle log
        this.addToBattleLog(turnNumber, result, currentBattle)
        
        // Check for battle end after each action
        if (this.isBattleOver(currentBattle)) {
          break
        }
      }
      
      // Reduce skill cooldowns
      this.reduceSkillCooldowns(unit)
    }

    return {
      turnNumber,
      actions,
      turnOrder: turnOrder.map(u => u.id)
    }
  }

  /**
   * Calculate turn order based on speed stats
   */
  private calculateTurnOrder(currentBattle: BattleState): BattleUnit[] {
    const aliveUnits = currentBattle.allUnits.filter(unit => unit.isAlive)
    
    return aliveUnits.sort((a, b) => {
      // Higher speed goes first
      const speedDiff = b.speed - a.speed
      
      // Add small random factor for units with same speed
      if (speedDiff === 0) {
        return Math.random() - 0.5
      }
      
      return speedDiff
    })
  }

  /**
   * Determine what action a unit should take
   */
  private async determineUnitAction(unit: BattleUnit, currentBattle?: BattleState): Promise<BattleAction | null> {
    switch (unit.type) {
      case 'player':
        // Player actions are determined externally
        // For auto-battle, use simple AI
        return this.determinePlayerAutoAction(unit, currentBattle)
      
      case 'companion':
        return this.determineCompanionAction(unit, currentBattle)
      
      case 'enemy':
      case 'boss':
        return this.determineEnemyAction(unit, currentBattle)
      
      default:
        return null
    }
  }

  /**
   * Determine companion action based on personality and situation
   */
  private determineCompanionAction(unit: BattleUnit, currentBattle?: BattleState): BattleAction {
    const personality = unit.personality || this.getDefaultPersonality()
    const situation = this.analyzeBattleSituation(unit, currentBattle)
    
    // High support personality prefers healing/buffing
    if (personality.support > 0.7 && situation.alliesNeedHealing) {
      const healingSkill = this.findBestHealingSkill(unit)
      if (healingSkill) {
        const target = this.findBestHealingTarget()
        return {
          actorId: unit.id,
          actionType: 'skill',
          skillId: healingSkill.id,
          targetId: target?.id
        }
      }
    }
    
    // High aggression prefers offensive actions
    if (personality.aggression > 0.6) {
      const offensiveSkill = this.findBestOffensiveSkill(unit)
      if (offensiveSkill && this.canUseSkill(unit, offensiveSkill)) {
        const target = this.findBestOffensiveTarget(offensiveSkill)
        return {
          actorId: unit.id,
          actionType: 'skill',
          skillId: offensiveSkill.id,
          targetId: target?.id
        }
      }
    }
    
    // High caution prefers defensive actions when health is low
    if (personality.caution > 0.5 && unit.hp / unit.maxHp < 0.4) {
      // Try to use defensive skill or just defend
      const defensiveSkill = this.findDefensiveSkill(unit)
      if (defensiveSkill && this.canUseSkill(unit, defensiveSkill)) {
        return {
          actorId: unit.id,
          actionType: 'skill',
          skillId: defensiveSkill.id,
          targetId: unit.id
        }
      }
      
      return {
        actorId: unit.id,
        actionType: 'defend'
      }
    }
    
    // Default: attack weakest enemy
    const target = this.findWeakestEnemy()
    return {
      actorId: unit.id,
      actionType: 'attack',
      targetId: target?.id
    }
  }

  /**
   * Determine enemy action based on AI pattern
   */
  private determineEnemyAction(unit: BattleUnit, currentBattle?: BattleState): BattleAction {
    const battle = currentBattle || this.currentBattle
    if (!battle) {
      // Fallback action if no battle context
      return {
        actorId: unit.id,
        actionType: 'attack',
        targetId: undefined
      }
    }
    
    const aiPattern = this.getEnemyAIPattern(unit)
    const availableTargets = battle.playerTeam.filter(u => u.isAlive)
    
    if (availableTargets.length === 0) {
      return { actorId: unit.id, actionType: 'defend' }
    }
    
    // Check if should use skill
    if (Math.random() < aiPattern.skillUseProbability) {
      const skill = this.selectEnemySkill(unit, aiPattern)
      if (skill && this.canUseSkill(unit, skill)) {
        const target = this.selectEnemyTarget(availableTargets, aiPattern, skill)
        return {
          actorId: unit.id,
          actionType: 'skill',
          skillId: skill.id,
          targetId: target?.id
        }
      }
    }
    
    // Default to basic attack
    const target = this.selectEnemyTarget(availableTargets, aiPattern)
    return {
      actorId: unit.id,
      actionType: 'attack',
      targetId: target?.id
    }
  }

  /**
   * Execute a battle action and return the result
   */
  private async executeAction(actor: BattleUnit, action: BattleAction): Promise<BattleActionResult> {
    const target = action.targetId ? this.findUnitById(action.targetId) : null
    
    let result: BattleActionResult = {
      action,
      success: false,
      criticalHit: false,
      missed: false,
      dodged: false,
      statusEffectsApplied: [],
      message: ''
    }
    
    switch (action.actionType) {
      case 'attack':
        if (!target || !target.isAlive) {
          result.message = '타겟이 유효하지 않거나 이미 사망했습니다.'
          return result
        }
        result = await this.executeAttack(actor, target)
        break
      
      case 'skill':
        const skill = actor.skills.find(s => s.id === action.skillId)
        if (skill) {
          if (skill.targetType === 'single' && (!target || !target.isAlive)) {
            result.message = '스킬 타겟이 유효하지 않거나 이미 사망했습니다.'
            return result
          }
          result = await this.executeSkill(actor, skill, target)
        }
        break
      
      case 'defend':
        result = this.executeDefend(actor)
        break
      
      case 'escape':
        result = this.executeEscape(actor)
        break
    }
    
    // Apply damage/healing
    if (result.damage && target) {
      target.hp = Math.max(0, target.hp - result.damage)
      if (target.hp === 0) {
        target.isAlive = false
        this.emitEvent('unit_death', { unit: target })
      }
    }
    
    if (result.healing && target) {
      target.hp = Math.min(target.maxHp, target.hp + result.healing)
    }
    
    return result
  }

  /**
   * Execute basic attack
   */
  private async executeAttack(attacker: BattleUnit, target: BattleUnit): Promise<BattleActionResult> {
    // Check if attack hits
    const hitChance = this.calculateHitChance(attacker, target)
    const missed = Math.random() * 100 > hitChance
    
    if (missed) {
      return {
        action: { actorId: attacker.id, actionType: 'attack', targetId: target.id },
        success: false,
        missed: true,
        criticalHit: false,
        dodged: false,
        statusEffectsApplied: [],
        message: `${attacker.name}의 공격이 빗나갔습니다!`
      }
    }
    
    // Check for dodge
    const dodgeChance = target.evasion || 0
    const dodged = Math.random() * 100 < dodgeChance
    
    if (dodged) {
      return {
        action: { actorId: attacker.id, actionType: 'attack', targetId: target.id },
        success: false,
        missed: false,
        dodged: true,
        criticalHit: false,
        statusEffectsApplied: [],
        message: `${target.name}이(가) 공격을 피했습니다!`
      }
    }
    
    // Calculate damage
    const baseDamage = Math.max(1, attacker.attack - target.defense / 2)
    
    // Check for critical hit
    const critChance = attacker.critRate || 10
    const criticalHit = Math.random() * 100 < critChance
    
    let finalDamage = baseDamage
    if (criticalHit) {
      const critMultiplier = (attacker.critDamage || 150) / 100
      finalDamage = Math.floor(baseDamage * critMultiplier)
      this.emitEvent('critical_hit', { attacker, target, damage: finalDamage })
    }
    
    // Add damage variance
    const variance = 0.85 + Math.random() * 0.3 // 85% to 115%
    finalDamage = Math.floor(finalDamage * variance)
    
    const critText = criticalHit ? ' 치명타!' : ''
    const message = `${attacker.name}이(가) ${target.name}에게 ${finalDamage} 데미지를 입혔습니다!${critText}`
    
    return {
      action: { actorId: attacker.id, actionType: 'attack', targetId: target.id },
      success: true,
      damage: finalDamage,
      criticalHit,
      missed: false,
      dodged: false,
      statusEffectsApplied: [],
      message
    }
  }

  /**
   * Execute skill usage
   */
  private async executeSkill(caster: BattleUnit, skill: BattleSkill, target: BattleUnit | null): Promise<BattleActionResult> {
    if (!this.canUseSkill(caster, skill)) {
      return {
        action: { actorId: caster.id, actionType: 'skill', skillId: skill.id },
        success: false,
        criticalHit: false,
        missed: false,
        dodged: false,
        statusEffectsApplied: [],
        message: `${caster.name}이(가) ${skill.name}을(를) 사용할 수 없습니다!`
      }
    }
    
    // Consume MP and set cooldown
    caster.mp -= skill.mpCost
    skill.currentCooldown = skill.cooldownTurns
    
    let damage = 0
    let healing = 0
    let message = ''
    const statusEffectsApplied: StatusEffect[] = []
    
    // Apply skill effects
    if (skill.damage > 0 && target) {
      const baseDamage = skill.damage + caster.attack * 0.5
      damage = Math.floor(baseDamage * (0.9 + Math.random() * 0.2))
      message = `${caster.name}이(가) ${skill.name}으로 ${target.name}에게 ${damage} 데미지!`
    }
    
    if (skill.healAmount && skill.healAmount > 0) {
      const healTarget = target || caster
      healing = skill.healAmount + Math.floor(caster.attack * 0.3)
      message = `${caster.name}이(가) ${skill.name}으로 ${healTarget.name}을(를) ${healing} 회복!`
    }
    
    // Apply status effects
    if (skill.statusEffects && target) {
      skill.statusEffects.forEach(effect => {
        const newEffect = { ...effect }
        if (effect.type === 'buff') {
          target.buffs.push(newEffect)
        } else {
          target.debuffs.push(newEffect)
        }
        statusEffectsApplied.push(newEffect)
      })
    }
    
    this.emitEvent('skill_used', { caster, skill, target, damage, healing })
    
    return {
      action: { actorId: caster.id, actionType: 'skill', skillId: skill.id, targetId: target?.id },
      success: true,
      damage,
      healing,
      criticalHit: false,
      missed: false,
      dodged: false,
      statusEffectsApplied,
      message: message || `${caster.name}이(가) ${skill.name}을(를) 사용했습니다!`
    }
  }

  /**
   * Execute defend action
   */
  private executeDefend(unit: BattleUnit): BattleActionResult {
    // Add temporary defense buff
    const defendBuff: StatusEffect = {
      id: `defend_${Date.now()}`,
      name: '방어 자세',
      type: 'buff',
      duration: 1,
      statModifiers: {
        defense: Math.floor(unit.defense * 0.5)
      },
      icon: '🛡️',
      description: '방어력이 50% 증가'
    }
    
    unit.buffs.push(defendBuff)
    
    return {
      action: { actorId: unit.id, actionType: 'defend' },
      success: true,
      criticalHit: false,
      missed: false,
      dodged: false,
      statusEffectsApplied: [defendBuff],
      message: `${unit.name}이(가) 방어 자세를 취했습니다!`
    }
  }

  /**
   * Execute escape attempt
   */
  private executeEscape(unit: BattleUnit): BattleActionResult {
    const escapeChance = this.config.allowEscape ? 0.8 : 0
    const success = Math.random() < escapeChance
    
    return {
      action: { actorId: unit.id, actionType: 'escape' },
      success,
      criticalHit: false,
      missed: false,
      dodged: false,
      statusEffectsApplied: [],
      message: success 
        ? `${unit.name}이(가) 전투에서 도망쳤습니다!`
        : `${unit.name}의 도망 시도가 실패했습니다!`
    }
  }

  // Helper methods
  private canUseSkill(unit: BattleUnit, skill: BattleSkill): boolean {
    return unit.mp >= skill.mpCost && skill.currentCooldown === 0
  }
  
  private calculateHitChance(attacker: BattleUnit, target: BattleUnit | null): number {
    const baseAccuracy = attacker.accuracy || 95
    const targetEvasion = target?.evasion || 5
    return Math.max(10, Math.min(95, baseAccuracy - targetEvasion))
  }

  private isBattleOver(currentBattle?: BattleState): boolean {
    if (!currentBattle) return true
    
    const playerTeamAlive = currentBattle.playerTeam.some(unit => unit.isAlive)
    const enemyTeamAlive = currentBattle.enemyTeam.some(unit => unit.isAlive)
    
    return !playerTeamAlive || !enemyTeamAlive
  }

  private generateBattleResult(turns: BattleTurn[], currentBattle: BattleState): BattleResult {
    const playerTeamAlive = currentBattle.playerTeam.some(unit => unit.isAlive)
    
    return {
      victory: playerTeamAlive,
      turns: turns.length,
      battleLog: currentBattle.battleLog,
      statistics: currentBattle.statistics,
      rewards: this.calculateRewards(playerTeamAlive, currentBattle),
      experienceGained: {
        player: this.calculateExperience('player', currentBattle),
        companion: this.calculateExperience('companion', currentBattle)
      }
    }
  }

  private calculateRewards(victory: boolean, currentBattle?: BattleState): any {
    if (!victory) {
      return { experience: 0, gold: 0, items: [] }
    }
    
    const battle = currentBattle || this.currentBattle
    if (!battle) {
      return { experience: 0, gold: 0, items: [] }
    }
    
    const defeatedEnemies = battle.enemyTeam.filter(e => !e.isAlive)
    
    return {
      experience: defeatedEnemies.reduce((sum, enemy) => sum + enemy.maxHp * 2, 0),
      gold: defeatedEnemies.reduce((sum, enemy) => sum + enemy.maxHp, 0),
      items: [] // TODO: Implement item drops
    }
  }

  private calculateExperience(unitType: string, currentBattle?: BattleState): number {
    const battle = currentBattle || this.currentBattle
    if (!battle) return 0
    
    // Calculate experience based on defeated enemies and damage dealt
    const baseExp = battle.statistics.totalDamageDealt / 10
    
    // Add bonus experience for defeating enemies
    const defeatedEnemies = battle.enemyTeam.filter(enemy => !enemy.isAlive)
    const defeatBonus = defeatedEnemies.reduce((sum, enemy) => sum + (enemy.maxHp / 5), 0)
    
    // Ensure minimum experience is gained even if no damage tracked
    const minExp = defeatedEnemies.length > 0 ? 5 : 0
    
    return Math.max(minExp, Math.floor(baseExp + defeatBonus))
  }

  // Event system
  private emitEvent(type: string, data: any): void {
    const event: BattleEvent = {
      type: type as any,
      data,
      timestamp: new Date()
    }
    this.emit(type, event)
  }

  // Additional helper methods would be implemented here...
  private determinePlayerAutoAction(unit: BattleUnit, currentBattle?: BattleState): BattleAction {
    const target = this.findWeakestEnemy(currentBattle)
    return {
      actorId: unit.id,
      actionType: 'attack',
      targetId: target?.id
    }
  }

  private getDefaultPersonality(): PersonalityInfluence {
    return {
      aggression: 0.5,
      caution: 0.5,
      support: 0.5,
      independence: 0.5
    }
  }

  private analyzeBattleSituation(unit: BattleUnit, currentBattle?: BattleState): any {
    const battle = currentBattle || this.currentBattle
    if (!battle) return { alliesNeedHealing: false, enemyCount: 0 }
    
    const playerTeam = battle.playerTeam
    const alliesNeedHealing = playerTeam.some(ally => ally.hp / ally.maxHp < 0.4)
    
    return {
      alliesNeedHealing
    }
  }

  private findBestHealingSkill(unit: BattleUnit): BattleSkill | null {
    return unit.skills
      .filter(skill => skill.healAmount && skill.healAmount > 0 && this.canUseSkill(unit, skill))
      .sort((a, b) => (b.healAmount || 0) - (a.healAmount || 0))[0] || null
  }

  private findBestHealingTarget(): BattleUnit | null {
    return this.currentBattle!.playerTeam
      .filter(unit => unit.isAlive)
      .sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0] || null
  }

  private findBestOffensiveSkill(unit: BattleUnit): BattleSkill | null {
    return unit.skills
      .filter(skill => skill.damage > 0 && this.canUseSkill(unit, skill))
      .sort((a, b) => b.damage - a.damage)[0] || null
  }

  private findBestOffensiveTarget(skill: BattleSkill): BattleUnit | null {
    return this.findWeakestEnemy()
  }

  private findDefensiveSkill(unit: BattleUnit): BattleSkill | null {
    return unit.skills
      .find(skill => skill.statusEffects?.some(effect => effect.type === 'buff') && this.canUseSkill(unit, skill)) || null
  }

  private findWeakestEnemy(currentBattle?: BattleState): BattleUnit | null {
    const battle = currentBattle || this.currentBattle
    if (!battle) return null
    return battle.enemyTeam
      .filter(unit => unit.isAlive)
      .sort((a, b) => a.hp - b.hp)[0] || null
  }

  private getEnemyAIPattern(unit: BattleUnit): EnemyAIPattern {
    return {
      type: 'balanced',
      skillUseProbability: 0.3,
      targetPriority: 'weakest',
      specialBehaviors: []
    }
  }

  private selectEnemySkill(unit: BattleUnit, pattern: EnemyAIPattern): BattleSkill | null {
    const availableSkills = unit.skills.filter(skill => this.canUseSkill(unit, skill))
    if (availableSkills.length === 0) return null
    
    return availableSkills[Math.floor(Math.random() * availableSkills.length)]
  }

  private selectEnemyTarget(targets: BattleUnit[], pattern: EnemyAIPattern, skill?: BattleSkill): BattleUnit | null {
    if (targets.length === 0) return null
    
    switch (pattern.targetPriority) {
      case 'weakest':
        return targets.sort((a, b) => a.hp - b.hp)[0]
      case 'strongest':
        return targets.sort((a, b) => b.hp - a.hp)[0]
      case 'lowest_hp':
        return targets.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0]
      default:
        return targets[Math.floor(Math.random() * targets.length)]
    }
  }

  private findUnitById(id: string, currentBattle?: BattleState): BattleUnit | null {
    const battle = currentBattle || this.currentBattle
    if (!battle) return null
    return battle.allUnits.find(unit => unit.id === id) || null
  }

  private reduceSkillCooldowns(unit: BattleUnit): void {
    unit.skills.forEach(skill => {
      if (skill.currentCooldown > 0) {
        skill.currentCooldown--
      }
    })
  }

  private processEndOfTurnEffects(currentBattle: BattleState): void {
    // Process status effects for all units
    currentBattle.allUnits.forEach(unit => {
      // Process buffs
      unit.buffs = unit.buffs.filter(buff => {
        buff.duration--
        
        // Apply per-turn effects
        if (buff.damagePerTurn) {
          unit.hp = Math.max(0, unit.hp + buff.damagePerTurn) // Negative for damage
        }
        if (buff.mpRegenPerTurn) {
          unit.mp = Math.min(unit.maxMp, unit.mp + buff.mpRegenPerTurn)
        }
        
        return buff.duration > 0
      })
      
      // Process debuffs
      unit.debuffs = unit.debuffs.filter(debuff => {
        debuff.duration--
        
        if (debuff.damagePerTurn) {
          unit.hp = Math.max(0, unit.hp + debuff.damagePerTurn)
        }
        
        return debuff.duration > 0
      })
    })
  }

  private updateStatistics(result: BattleActionResult, currentBattle?: BattleState): void {
    const battle = currentBattle || this.currentBattle
    if (!battle) return
    const stats = battle.statistics
    
    if (result.damage) {
      stats.totalDamageDealt += result.damage
    }
    if (result.healing) {
      stats.totalHealing += result.healing
    }
    if (result.action.actionType === 'skill') {
      stats.skillsUsed++
    }
    if (result.criticalHit) {
      stats.criticalHits++
    }
    if (result.missed) {
      stats.missedAttacks++
    }
    stats.statusEffectsApplied += result.statusEffectsApplied.length
  }

  private addToBattleLog(turnNumber: number, result: BattleActionResult, currentBattle?: BattleState): void {
    const battle = currentBattle || this.currentBattle
    if (!battle) return
    
    const actor = this.findUnitById(result.action.actorId, battle)
    const target = result.action.targetId ? this.findUnitById(result.action.targetId, battle) : null
    
    const logEntry: BattleLogEntry = {
      turnNumber,
      actorName: actor?.name || 'Unknown',
      action: result.action.actionType,
      targetName: target?.name,
      damage: result.damage,
      healing: result.healing,
      message: result.message,
      timestamp: new Date()
    }
    
    battle.battleLog.push(logEntry)
  }
}

// Internal battle state interface
interface BattleState {
  playerTeam: BattleUnit[]
  enemyTeam: BattleUnit[]
  allUnits: BattleUnit[]
  battleLog: BattleLogEntry[]
  statistics: BattleStatistics
  environment?: any
}

// Singleton instance
let battleSystemInstance: AutoBattleSystem | null = null

export function getBattleSystem(config?: Partial<BattleConfig>): AutoBattleSystem {
  if (!battleSystemInstance) {
    battleSystemInstance = new AutoBattleSystem(config)
  }
  return battleSystemInstance
}

export default AutoBattleSystem