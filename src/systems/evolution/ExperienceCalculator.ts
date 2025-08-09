import type {
  ExperienceType,
  ConversationMetrics,
  EmotionalMetrics,
  LearningMetrics,
  RelationshipMetrics,
} from './types'

/**
 * Experience Calculator
 * Calculates experience points based on various metrics and interactions
 */
export class ExperienceCalculator {
  private readonly maxExperienceByType = {
    conversation: 100,
    emotional: 80,
    learning: 60,
    relationship: 50,
  }

  private readonly minExperience = 1

  /**
   * Calculate experience points based on metrics
   */
  calculateExperience(
    type: ExperienceType,
    metrics: ConversationMetrics | EmotionalMetrics | LearningMetrics | RelationshipMetrics | null,
    level: number = 1,
    multiplier: number = 1
  ): number {
    if (!metrics) {
      return this.minExperience
    }

    try {
      let baseExperience: number

      switch (type) {
        case 'conversation':
          baseExperience = this.calculateConversationExperience(metrics as ConversationMetrics)
          break
        case 'emotional':
          baseExperience = this.calculateEmotionalExperience(metrics as EmotionalMetrics)
          break
        case 'learning':
          baseExperience = this.calculateLearningExperience(metrics as LearningMetrics)
          break
        case 'relationship':
          baseExperience = this.calculateRelationshipExperience(metrics as RelationshipMetrics)
          break
        default:
          throw new Error(`Invalid experience type: ${type}`)
      }

      // Apply level and custom multipliers
      const levelMultiplier = 1 + (level - 1) * 0.1 // 10% bonus per level
      const finalExperience = Math.round(baseExperience * levelMultiplier * multiplier)

      // Ensure within bounds
      return Math.max(
        this.minExperience,
        Math.min(finalExperience, this.maxExperienceByType[type])
      )
    } catch (error) {
      console.error('Error calculating experience:', error)
      return this.minExperience
    }
  }

  private calculateConversationExperience(metrics: ConversationMetrics): number {
    const {
      messageLength = 0,
      complexity = 0,
      engagement = 0,
      responseQuality = 0,
    } = this.normalizeMetrics(metrics)

    // Base experience from message length (0-40 points)
    const lengthExp = Math.min(messageLength / 2.5, 40)

    // Complexity bonus (0-30 points)
    const complexityExp = complexity * 30

    // Engagement bonus (0-20 points)
    const engagementExp = engagement * 20

    // Quality multiplier (0.5x to 1.5x)
    const qualityMultiplier = 0.5 + responseQuality

    const totalExp = (lengthExp + complexityExp + engagementExp) * qualityMultiplier

    return Math.max(this.minExperience, Math.round(totalExp))
  }

  private calculateEmotionalExperience(metrics: EmotionalMetrics): number {
    const {
      intensityChange = 0,
      empathyLevel = 0,
      emotionalComplexity = 0,
      userSatisfaction = 0,
    } = this.normalizeMetrics(metrics)

    // Base experience from intensity change (0-30 points)
    const intensityExp = intensityChange * 30

    // Empathy bonus (0-25 points)
    const empathyExp = empathyLevel * 25

    // Complexity bonus (0-15 points)
    const complexityExp = emotionalComplexity * 15

    // Satisfaction multiplier (0.5x to 1.5x)
    const satisfactionMultiplier = 0.5 + userSatisfaction

    const totalExp = (intensityExp + empathyExp + complexityExp) * satisfactionMultiplier

    return Math.max(this.minExperience, Math.round(totalExp))
  }

  private calculateLearningExperience(metrics: LearningMetrics): number {
    const {
      newConceptsLearned = 0,
      knowledgeRetention = 0,
      adaptationSpeed = 0,
      creativityLevel = 0,
    } = this.normalizeMetrics(metrics)

    // Base experience from new concepts (up to 25 points)
    const conceptsExp = Math.min(newConceptsLearned * 5, 25)

    // Retention bonus (0-20 points)
    const retentionExp = knowledgeRetention * 20

    // Adaptation bonus (0-10 points)
    const adaptationExp = adaptationSpeed * 10

    // Creativity multiplier (0.5x to 1.5x)
    const creativityMultiplier = 0.5 + creativityLevel

    const totalExp = (conceptsExp + retentionExp + adaptationExp) * creativityMultiplier

    return Math.max(this.minExperience, Math.round(totalExp))
  }

  private calculateRelationshipExperience(metrics: RelationshipMetrics): number {
    const {
      intimacyIncrease = 0,
      trustBuilding = 0,
      bondStrength = 0,
      conflictResolution = 0,
    } = this.normalizeMetrics(metrics)

    // Base experience from intimacy increase (0-20 points)
    const intimacyExp = intimacyIncrease * 100 // Scale up since intimacy changes are small

    // Trust bonus (0-15 points)
    const trustExp = trustBuilding * 15

    // Bond strength bonus (0-10 points)
    const bondExp = bondStrength * 10

    // Conflict resolution multiplier (0.7x to 1.3x)
    const conflictMultiplier = 0.7 + conflictResolution * 0.6

    const totalExp = (intimacyExp + trustExp + bondExp) * conflictMultiplier

    return Math.max(this.minExperience, Math.round(totalExp))
  }

  private normalizeMetrics(metrics: any): any {
    const normalized: any = {}

    for (const [key, value] of Object.entries(metrics)) {
      if (typeof value === 'number') {
        // Clamp negative values to 0 and normalize very large values
        normalized[key] = Math.max(0, Math.min(value, key === 'messageLength' ? 1000 : key === 'newConceptsLearned' ? 10 : 1))
      } else {
        normalized[key] = value
      }
    }

    return normalized
  }
}