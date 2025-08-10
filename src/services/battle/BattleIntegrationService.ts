/**
 * 🎮 Battle Integration Service
 * 
 * Integrates the battle system with the character system to provide:
 * - Experience and relationship updates from battle results
 * - Character stats influence on battle performance
 * - Dynamic battle AI based on character personality
 * - Battle-specific character evolution
 * - Companion behavior adaptation during battles
 */

import type { BattleResult, BattleUnit, BattleFormation } from '@/systems/battle/types'
import type { AdvancedAICompanion, PersonalityTraits } from '@/services/character/AdvancedCharacterSystem'
import type { CharacterEvolutionSystem } from '@/systems/evolution/CharacterEvolutionSystem'
import { AutoBattleSystem } from '@/systems/battle/AutoBattleSystem'

export interface BattleIntegrationConfig {
  experienceMultiplier: number
  relationshipGainMultiplier: number
  personalityInfluenceStrength: number
  enableDynamicDifficulty: boolean
}

export interface BattleCharacterStats {
  level: number
  experience: number
  personality: PersonalityTraits
  intimacyLevel: number
  trustLevel: number
  emotionalState: string
  recentPerformance: BattlePerformanceMetrics
}

export interface BattlePerformanceMetrics {
  battlesWon: number
  battlesLost: number
  totalDamageDealt: number
  totalDamageReceived: number
  averageSkillUsage: number
  teamworkRating: number
  lastBattleTimestamp: Date
}

export interface BattleRewards {
  experience: {
    conversation: number
    emotional: number
    relationship: number
    combat: number
  }
  relationshipChange: {
    intimacy: number
    trust: number
  }
  personalityGrowth: Partial<PersonalityTraits>
  achievements: string[]
}

/**
 * Battle Integration Service
 * Connects battle outcomes with character development
 */
export class BattleIntegrationService {
  private config: BattleIntegrationConfig
  private performanceHistory: Map<string, BattlePerformanceMetrics> = new Map()

  constructor(config: Partial<BattleIntegrationConfig> = {}) {
    this.config = {
      experienceMultiplier: 1.0,
      relationshipGainMultiplier: 1.0,
      personalityInfluenceStrength: 0.7,
      enableDynamicDifficulty: true,
      ...config
    }
  }

  /**
   * Setup battle formation with character influence
   */
  public async setupBattleFormation(
    character: AdvancedAICompanion,
    baseFormation: Partial<BattleFormation>
  ): Promise<BattleFormation> {
    const characterStats = this.extractCharacterStats(character)
    
    // Apply character influence to player team
    const enhancedPlayerTeam = baseFormation.playerTeam?.map(unit => 
      this.enhanceUnitWithCharacter(unit, characterStats, character)
    ) || []

    // Apply personality-based companion AI
    const companionUnits = enhancedPlayerTeam.filter(unit => unit.type === 'companion')
    companionUnits.forEach(companion => {
      companion.personality = this.mapPersonalityToBattle(character.personality.core)
    })

    // Setup dynamic enemy difficulty if enabled
    let enemyTeam = baseFormation.enemyTeam || []
    if (this.config.enableDynamicDifficulty) {
      enemyTeam = this.adjustEnemyDifficulty(enemyTeam, characterStats)
    }

    return {
      playerTeam: enhancedPlayerTeam,
      enemyTeam,
      environment: baseFormation.environment || {
        name: 'Default Arena',
        effects: []
      }
    }
  }

  /**
   * Process battle results and update character
   */
  public async processBattleResults(
    battleResult: BattleResult,
    character: AdvancedAICompanion,
    evolutionSystem?: CharacterEvolutionSystem
  ): Promise<BattleRewards> {
    const rewards: BattleRewards = {
      experience: {
        conversation: 0,
        emotional: 0,
        relationship: 0,
        combat: 0
      },
      relationshipChange: {
        intimacy: 0,
        trust: 0
      },
      personalityGrowth: {},
      achievements: []
    }

    // Update performance metrics
    this.updatePerformanceMetrics(character.id, battleResult)

    // Calculate base experience rewards
    const baseExp = this.calculateBaseExperience(battleResult)
    
    // Apply multipliers
    rewards.experience.combat = Math.round(baseExp.combat * this.config.experienceMultiplier)
    rewards.experience.emotional = Math.round(baseExp.emotional * this.config.experienceMultiplier)
    rewards.experience.relationship = Math.round(baseExp.relationship * this.config.relationshipGainMultiplier)

    // Calculate relationship changes
    const relationshipChanges = this.calculateRelationshipChanges(battleResult, character)
    rewards.relationshipChange = relationshipChanges

    // Apply character system updates
    await this.applyCharacterUpdates(character, rewards, evolutionSystem)

    // Check for battle achievements
    rewards.achievements = this.checkBattleAchievements(battleResult, character)

    // Calculate personality growth from battle experience
    rewards.personalityGrowth = this.calculatePersonalityGrowth(battleResult, character)

    return rewards
  }

  /**
   * Extract character stats for battle integration
   */
  private extractCharacterStats(character: AdvancedAICompanion): BattleCharacterStats {
    const performance = this.performanceHistory.get(character.id) || this.createDefaultPerformance()

    return {
      level: this.calculateCharacterLevel(character),
      experience: character.relationship.totalInteractions,
      personality: character.personality.core,
      intimacyLevel: character.relationship.intimacyLevel,
      trustLevel: character.relationship.trustLevel,
      emotionalState: character.emotionalState.currentEmotion,
      recentPerformance: performance
    }
  }

  /**
   * Calculate character level based on relationship and interactions
   */
  private calculateCharacterLevel(character: AdvancedAICompanion): number {
    const baseLevel = Math.floor(character.relationship.totalInteractions / 10) + 1
    const relationshipBonus = Math.floor((character.relationship.intimacyLevel + character.relationship.trustLevel) / 4)
    return Math.max(1, Math.min(20, baseLevel + relationshipBonus))
  }

  /**
   * Enhance battle unit with character influence
   */
  private enhanceUnitWithCharacter(
    unit: BattleUnit, 
    stats: BattleCharacterStats, 
    character: AdvancedAICompanion
  ): BattleUnit {
    const enhanced = { ...unit }

    // Apply level-based stat bonuses
    const levelMultiplier = 1 + (stats.level - 1) * 0.05 // 5% per level
    enhanced.maxHp = Math.round(enhanced.maxHp * levelMultiplier)
    enhanced.hp = enhanced.maxHp
    enhanced.maxMp = Math.round((enhanced.maxMp || 50) * levelMultiplier)
    enhanced.mp = enhanced.maxMp
    enhanced.attack = Math.round(enhanced.attack * levelMultiplier)
    enhanced.defense = Math.round(enhanced.defense * levelMultiplier)

    // Apply personality influence to stats
    if (unit.type === 'companion') {
      enhanced.attack = Math.round(enhanced.attack * (1 + stats.personality.independent * 0.2))
      enhanced.defense = Math.round(enhanced.defense * (1 + stats.personality.thoughtful * 0.2))
      enhanced.speed = Math.round(enhanced.speed * (1 + stats.personality.playful * 0.15))
      
      // Apply emotional state modifiers
      enhanced.critRate = (enhanced.critRate || 10) * this.getEmotionalModifier(stats.emotionalState, 'crit')
      enhanced.accuracy = (enhanced.accuracy || 95) * this.getEmotionalModifier(stats.emotionalState, 'accuracy')
    }

    // Apply relationship bonuses
    if (unit.type === 'player' || unit.type === 'companion') {
      const relationshipBonus = (stats.intimacyLevel + stats.trustLevel) / 20
      enhanced.maxHp = Math.round(enhanced.maxHp * (1 + relationshipBonus))
      enhanced.hp = enhanced.maxHp
    }

    return enhanced
  }

  /**
   * Map character personality to battle personality influence
   */
  private mapPersonalityToBattle(personality: PersonalityTraits): any {
    return {
      aggression: personality.independent + personality.playful * 0.5,
      support: personality.caring + personality.supportive * 0.5,
      caution: personality.thoughtful + (1 - personality.playful) * 0.3,
      independence: personality.independent
    }
  }

  /**
   * Get emotional state modifier for battle stats
   */
  private getEmotionalModifier(emotion: string, statType: 'crit' | 'accuracy' | 'damage'): number {
    const modifiers: Record<string, Record<string, number>> = {
      happy: { crit: 1.1, accuracy: 1.05, damage: 1.0 },
      excited: { crit: 1.15, accuracy: 0.95, damage: 1.1 },
      angry: { crit: 1.2, accuracy: 0.9, damage: 1.15 },
      sad: { crit: 0.9, accuracy: 0.95, damage: 0.9 },
      calm: { crit: 1.0, accuracy: 1.1, damage: 1.0 },
      confused: { crit: 0.8, accuracy: 0.8, damage: 0.9 },
      neutral: { crit: 1.0, accuracy: 1.0, damage: 1.0 }
    }

    return modifiers[emotion]?.[statType] || 1.0
  }

  /**
   * Adjust enemy difficulty based on character performance
   */
  private adjustEnemyDifficulty(
    enemies: BattleUnit[], 
    characterStats: BattleCharacterStats
  ): BattleUnit[] {
    const difficultyMultiplier = this.calculateDifficultyMultiplier(characterStats)
    
    return enemies.map(enemy => ({
      ...enemy,
      maxHp: Math.round(enemy.maxHp * difficultyMultiplier),
      hp: Math.round(enemy.maxHp * difficultyMultiplier),
      attack: Math.round(enemy.attack * difficultyMultiplier),
      defense: Math.round(enemy.defense * difficultyMultiplier)
    }))
  }

  /**
   * Calculate dynamic difficulty multiplier
   */
  private calculateDifficultyMultiplier(stats: BattleCharacterStats): number {
    let multiplier = 1.0

    // Level-based scaling (more aggressive)
    multiplier += (stats.level - 1) * 0.08

    // Performance-based scaling (stronger adjustments)
    const totalBattles = stats.recentPerformance.battlesWon + stats.recentPerformance.battlesLost
    if (totalBattles > 0) {
      const winRate = stats.recentPerformance.battlesWon / totalBattles
      
      if (winRate > 0.8) multiplier += 0.4    // Much harder if dominating
      else if (winRate > 0.6) multiplier += 0.2  // Harder if doing well
      else if (winRate < 0.3) multiplier -= 0.3  // Easier if struggling
      else if (winRate < 0.5) multiplier -= 0.1  // Slightly easier if below average
    }

    // Relationship-based scaling (reduced impact)
    const relationshipModifier = (stats.intimacyLevel + stats.trustLevel) / 40
    multiplier -= relationshipModifier * 0.05

    return Math.max(0.6, Math.min(1.8, multiplier))
  }

  /**
   * Calculate base experience from battle results
   */
  private calculateBaseExperience(result: BattleResult): BattleRewards['experience'] {
    const baseExp = {
      conversation: 0,
      emotional: 8, // Increased base emotional experience
      relationship: 0,
      combat: 0
    }

    // Victory bonus (reduced combat, increased emotional/relationship)
    if (result.victory) {
      baseExp.combat += 15 // Reduced from 20
      baseExp.relationship += 8 // Increased from 5
      baseExp.emotional += 10 // Increased from 5
    } else {
      baseExp.combat += 3 // Reduced from 5
      baseExp.emotional += 18 // Increased from 15
      baseExp.relationship += 3 // Small consolation
    }

    // Turn-based bonus (reduced combat focus, cap at lower value)
    const turnBonus = Math.min(result.turns * 1.2, 20) // Reduced from 2x and cap of 30
    baseExp.combat += Math.floor(turnBonus * 0.6) // 60% goes to combat
    baseExp.emotional += Math.floor(turnBonus * 0.4) // 40% goes to emotional
    
    // Additional emotional experience for defeats (learning from struggle)
    if (!result.victory) {
      baseExp.emotional += Math.min(result.turns * 1.2, 15) // Reduced multiplier and cap
    }
    
    // Statistics-based bonuses (more balanced distribution)
    if (result.statistics) {
      const damageBonus = Math.floor(result.statistics.totalDamageDealt / 150) // Higher threshold
      baseExp.combat += damageBonus
      baseExp.emotional += Math.floor(damageBonus * 0.5) // Share some with emotional
      
      const skillBonus = Math.floor(result.statistics.skillsUsed / 2) // Lower threshold
      baseExp.relationship += skillBonus
      baseExp.emotional += Math.floor(skillBonus * 0.3)
    }

    return baseExp
  }

  /**
   * Calculate relationship changes from battle
   */
  private calculateRelationshipChanges(
    result: BattleResult, 
    character: AdvancedAICompanion
  ): BattleRewards['relationshipChange'] {
    const changes = {
      intimacy: 0,
      trust: 0
    }

    // Victory builds trust and intimacy through shared success
    if (result.victory) {
      changes.trust += 0.1
      changes.intimacy += 0.05
    } else {
      // Defeat can build intimacy through shared struggle
      changes.intimacy += 0.08
      changes.trust += 0.02 // Small trust gain for sticking together
    }

    // Long battles build more connection
    if (result.turns > 10) {
      changes.intimacy += 0.03
    }

    // Apply personality modifiers
    const supportModifier = character.personality.core.supportive * 0.5
    changes.trust += supportModifier * 0.02
    changes.intimacy += character.personality.core.caring * 0.02

    // Cap the changes
    changes.trust = Math.max(-0.1, Math.min(0.2, changes.trust))
    changes.intimacy = Math.max(-0.1, Math.min(0.2, changes.intimacy))

    return changes
  }

  /**
   * Apply updates to character system
   */
  private async applyCharacterUpdates(
    character: AdvancedAICompanion,
    rewards: BattleRewards,
    evolutionSystem?: CharacterEvolutionSystem
  ): Promise<void> {
    // Update relationship levels
    character.relationship.intimacyLevel = Math.max(0, Math.min(10, 
      character.relationship.intimacyLevel + rewards.relationshipChange.intimacy
    ))
    character.relationship.trustLevel = Math.max(0, Math.min(10,
      character.relationship.trustLevel + rewards.relationshipChange.trust
    ))

    // Update interaction count
    character.relationship.totalInteractions += 1

    // Apply experience if evolution system is available
    if (evolutionSystem) {
      for (const [type, amount] of Object.entries(rewards.experience)) {
        if (amount > 0 && type !== 'combat') {
          await evolutionSystem.addExperience(type as any, amount)
        }
      }
    }

    // Apply personality growth
    if (Object.keys(rewards.personalityGrowth).length > 0) {
      await this.applyPersonalityGrowth(character, rewards.personalityGrowth)
    }

    // Update last interaction time
    character.lastInteraction = new Date()
  }

  /**
   * Apply personality growth to character
   */
  private async applyPersonalityGrowth(
    character: AdvancedAICompanion, 
    growth: Partial<PersonalityTraits>
  ): Promise<void> {
    // Only apply if there's actual growth
    if (Object.keys(growth).length === 0) {
      return
    }

    const personality = character.personality.core
    const adaptability = personality.adaptability || 0.5

    // Apply growth with adaptability modifier
    let hasChanges = false
    Object.entries(growth).forEach(([trait, change]) => {
      if (change && change > 0) {
        const currentValue = personality[trait as keyof PersonalityTraits] || 0
        const adjustedChange = change * adaptability
        const newValue = Math.max(0, Math.min(1, currentValue + adjustedChange))
        
        if (newValue !== currentValue) {
          (personality as any)[trait] = newValue
          hasChanges = true
        }
      }
    })

    // Record personality change only if there were actual changes
    if (hasChanges) {
      character.personality.adaptation.personalityHistory.push({
        timestamp: new Date(),
        traits: { ...personality },
        context: 'Battle experience growth'
      })
    }
  }

  /**
   * Calculate personality growth from battle
   */
  private calculatePersonalityGrowth(
    result: BattleResult,
    character: AdvancedAICompanion
  ): Partial<PersonalityTraits> {
    const growth: Partial<PersonalityTraits> = {}

    if (result.victory) {
      // Victory builds confidence and independence
      growth.independent = 0.02
      growth.cheerful = 0.01
    } else {
      // Defeat builds thoughtfulness and emotional awareness
      growth.thoughtful = 0.02
      growth.emotional = 0.01
    }

    // Long battles build consistency
    if (result.turns > 15) {
      growth.consistency = 0.01
    }

    // High skill usage builds adaptability
    if (result.statistics && result.statistics.skillsUsed > 5) {
      growth.adaptability = 0.01
    }

    return growth
  }

  /**
   * Check for battle-related achievements
   */
  private checkBattleAchievements(
    result: BattleResult,
    character: AdvancedAICompanion
  ): string[] {
    const achievements: string[] = []
    const performance = this.performanceHistory.get(character.id)!

    // First victory
    if (result.victory && performance.battlesWon === 1) {
      achievements.push('first_victory')
    }

    // Perfect battle (no damage taken)
    if (result.victory && result.statistics?.totalDamageReceived === 0) {
      achievements.push('flawless_victory')
    }

    // Long battle survival
    if (result.turns > 20) {
      achievements.push('endurance_fighter')
    }

    // High skill usage
    if (result.statistics && result.statistics.skillsUsed > 10) {
      achievements.push('skill_master')
    }

    // Win streak
    if (this.calculateWinStreak(character.id) >= 5) {
      achievements.push('winning_streak')
    }

    return achievements
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(characterId: string, result: BattleResult): void {
    const metrics = this.performanceHistory.get(characterId) || this.createDefaultPerformance()

    if (result.victory) {
      metrics.battlesWon++
    } else {
      metrics.battlesLost++
    }

    if (result.statistics) {
      metrics.totalDamageDealt += result.statistics.totalDamageDealt || 0
      metrics.totalDamageReceived += result.statistics.totalDamageReceived || 0
      metrics.averageSkillUsage = this.calculateAverageSkillUsage(metrics, result.statistics.skillsUsed || 0)
    }

    metrics.teamworkRating = this.calculateTeamworkRating(result)
    metrics.lastBattleTimestamp = new Date()

    this.performanceHistory.set(characterId, metrics)
  }

  /**
   * Create default performance metrics
   */
  private createDefaultPerformance(): BattlePerformanceMetrics {
    return {
      battlesWon: 0,
      battlesLost: 0,
      totalDamageDealt: 0,
      totalDamageReceived: 0,
      averageSkillUsage: 0,
      teamworkRating: 0.5,
      lastBattleTimestamp: new Date()
    }
  }

  /**
   * Calculate average skill usage
   */
  private calculateAverageSkillUsage(metrics: BattlePerformanceMetrics, newSkills: number): number {
    const totalBattles = metrics.battlesWon + metrics.battlesLost + 1
    return ((metrics.averageSkillUsage * (totalBattles - 1)) + newSkills) / totalBattles
  }

  /**
   * Calculate teamwork rating based on battle performance
   */
  private calculateTeamworkRating(result: BattleResult): number {
    let rating = 0.5

    // Victory improves teamwork rating
    if (result.victory) {
      rating += 0.1
    }

    // Efficient battles (fewer turns needed) show good teamwork
    if (result.turns < 10) {
      rating += 0.05
    } else if (result.turns > 20) {
      rating -= 0.05
    }

    // High skill usage coordination
    if (result.statistics && result.statistics.skillsUsed > 8) {
      rating += 0.05
    }

    return Math.max(0, Math.min(1, rating))
  }

  /**
   * Calculate current win streak
   */
  private calculateWinStreak(characterId: string): number {
    // This would need battle history to implement properly
    // For now, simplified implementation
    const metrics = this.performanceHistory.get(characterId)
    if (!metrics) return 0
    
    // Simple approximation based on recent performance
    const winRate = metrics.battlesWon / Math.max(1, metrics.battlesWon + metrics.battlesLost)
    return winRate > 0.8 ? Math.floor(metrics.battlesWon / 3) : 0
  }

  /**
   * Get character's battle effectiveness
   */
  public getBattleEffectiveness(character: AdvancedAICompanion): {
    overallRating: number
    strengths: string[]
    weaknesses: string[]
    suggestedImprovements: string[]
  } {
    const stats = this.extractCharacterStats(character)
    const performance = stats.recentPerformance
    
    let overallRating = 0.5

    // Performance-based rating
    const totalBattles = performance.battlesWon + performance.battlesLost
    if (totalBattles > 0) {
      const winRate = performance.battlesWon / totalBattles
      overallRating = winRate * 0.6 + performance.teamworkRating * 0.4
    }

    // Personality-based strengths and weaknesses
    const strengths: string[] = []
    const weaknesses: string[] = []
    const improvements: string[] = []

    const personality = character.personality.core

    if (personality.caring > 0.7) strengths.push('Supportive teammate')
    if (personality.independent > 0.7) strengths.push('Strong individual combat')
    if (personality.thoughtful > 0.7) strengths.push('Strategic thinking')
    if (personality.playful > 0.7) strengths.push('Adaptable tactics')

    if (personality.emotional > 0.8) weaknesses.push('May be affected by battle stress')
    if (personality.consistency < 0.4) weaknesses.push('Unpredictable performance')
    if (personality.independent < 0.3) weaknesses.push('Over-reliant on support')

    // Improvement suggestions
    if (performance.averageSkillUsage < 3) {
      improvements.push('Practice using more diverse combat skills')
    }
    if (performance.teamworkRating < 0.6) {
      improvements.push('Focus on coordinated attacks with teammates')
    }
    if (stats.level < 5) {
      improvements.push('Gain more battle experience through training')
    }

    return {
      overallRating: Math.max(0, Math.min(1, overallRating)),
      strengths,
      weaknesses,
      suggestedImprovements: improvements
    }
  }

  /**
   * Reset character performance metrics
   */
  public resetPerformanceMetrics(characterId: string): void {
    this.performanceHistory.delete(characterId)
  }

  /**
   * Get performance history for character
   */
  public getPerformanceHistory(characterId: string): BattlePerformanceMetrics | null {
    return this.performanceHistory.get(characterId) || null
  }
}

// Export singleton instance
let battleIntegrationInstance: BattleIntegrationService | null = null

export function getBattleIntegrationService(config?: Partial<BattleIntegrationConfig>): BattleIntegrationService {
  if (!battleIntegrationInstance) {
    battleIntegrationInstance = new BattleIntegrationService(config)
  }
  return battleIntegrationInstance
}

export default BattleIntegrationService