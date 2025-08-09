import { describe, it, expect } from 'vitest'
import { ExperienceCalculator } from '../ExperienceCalculator'
import type { ExperienceType, ConversationMetrics, EmotionalMetrics, LearningMetrics, RelationshipMetrics } from '../types'

describe('ExperienceCalculator', () => {
  let calculator: ExperienceCalculator

  beforeEach(() => {
    calculator = new ExperienceCalculator()
  })

  describe('Conversation Experience', () => {
    it('should calculate basic conversation experience', () => {
      const metrics: ConversationMetrics = {
        messageLength: 50,
        complexity: 0.6,
        engagement: 0.8,
        responseQuality: 0.7,
      }

      const exp = calculator.calculateExperience('conversation', metrics)
      expect(exp).toBeGreaterThan(0)
      expect(exp).toBeLessThanOrEqual(100) // Max base experience
    })

    it('should give more experience for longer messages', () => {
      const shortMessage: ConversationMetrics = {
        messageLength: 10,
        complexity: 0.5,
        engagement: 0.5,
        responseQuality: 0.5,
      }

      const longMessage: ConversationMetrics = {
        messageLength: 100,
        complexity: 0.5,
        engagement: 0.5,
        responseQuality: 0.5,
      }

      const shortExp = calculator.calculateExperience('conversation', shortMessage)
      const longExp = calculator.calculateExperience('conversation', longMessage)

      expect(longExp).toBeGreaterThan(shortExp)
    })

    it('should give more experience for higher complexity', () => {
      const simple: ConversationMetrics = {
        messageLength: 50,
        complexity: 0.2,
        engagement: 0.5,
        responseQuality: 0.5,
      }

      const complex: ConversationMetrics = {
        messageLength: 50,
        complexity: 0.9,
        engagement: 0.5,
        responseQuality: 0.5,
      }

      const simpleExp = calculator.calculateExperience('conversation', simple)
      const complexExp = calculator.calculateExperience('conversation', complex)

      expect(complexExp).toBeGreaterThan(simpleExp)
    })

    it('should apply quality bonus correctly', () => {
      const lowQuality: ConversationMetrics = {
        messageLength: 50,
        complexity: 0.5,
        engagement: 0.5,
        responseQuality: 0.3,
      }

      const highQuality: ConversationMetrics = {
        messageLength: 50,
        complexity: 0.5,
        engagement: 0.5,
        responseQuality: 0.9,
      }

      const lowExp = calculator.calculateExperience('conversation', lowQuality)
      const highExp = calculator.calculateExperience('conversation', highQuality)

      expect(highExp).toBeGreaterThan(lowExp)
    })
  })

  describe('Emotional Experience', () => {
    it('should calculate emotional experience correctly', () => {
      const metrics: EmotionalMetrics = {
        intensityChange: 0.6,
        empathyLevel: 0.8,
        emotionalComplexity: 0.7,
        userSatisfaction: 0.9,
      }

      const exp = calculator.calculateExperience('emotional', metrics)
      expect(exp).toBeGreaterThan(0)
      expect(exp).toBeLessThanOrEqual(80) // Max emotional experience
    })

    it('should give more experience for higher intensity changes', () => {
      const lowIntensity: EmotionalMetrics = {
        intensityChange: 0.2,
        empathyLevel: 0.5,
        emotionalComplexity: 0.5,
        userSatisfaction: 0.5,
      }

      const highIntensity: EmotionalMetrics = {
        intensityChange: 0.9,
        empathyLevel: 0.5,
        emotionalComplexity: 0.5,
        userSatisfaction: 0.5,
      }

      const lowExp = calculator.calculateExperience('emotional', lowIntensity)
      const highExp = calculator.calculateExperience('emotional', highIntensity)

      expect(highExp).toBeGreaterThan(lowExp)
    })

    it('should apply empathy bonus', () => {
      const lowEmpathy: EmotionalMetrics = {
        intensityChange: 0.5,
        empathyLevel: 0.2,
        emotionalComplexity: 0.5,
        userSatisfaction: 0.5,
      }

      const highEmpathy: EmotionalMetrics = {
        intensityChange: 0.5,
        empathyLevel: 0.9,
        emotionalComplexity: 0.5,
        userSatisfaction: 0.5,
      }

      const lowExp = calculator.calculateExperience('emotional', lowEmpathy)
      const highExp = calculator.calculateExperience('emotional', highEmpathy)

      expect(highExp).toBeGreaterThan(lowExp)
    })
  })

  describe('Learning Experience', () => {
    it('should calculate learning experience correctly', () => {
      const metrics: LearningMetrics = {
        newConceptsLearned: 3,
        knowledgeRetention: 0.8,
        adaptationSpeed: 0.7,
        creativityLevel: 0.6,
      }

      const exp = calculator.calculateExperience('learning', metrics)
      expect(exp).toBeGreaterThan(0)
      expect(exp).toBeLessThanOrEqual(60) // Max learning experience
    })

    it('should give more experience for learning new concepts', () => {
      const fewConcepts: LearningMetrics = {
        newConceptsLearned: 1,
        knowledgeRetention: 0.5,
        adaptationSpeed: 0.5,
        creativityLevel: 0.5,
      }

      const manyConcepts: LearningMetrics = {
        newConceptsLearned: 10,
        knowledgeRetention: 0.5,
        adaptationSpeed: 0.5,
        creativityLevel: 0.5,
      }

      const fewExp = calculator.calculateExperience('learning', fewConcepts)
      const manyExp = calculator.calculateExperience('learning', manyConcepts)

      expect(manyExp).toBeGreaterThan(fewExp)
    })

    it('should apply retention bonus', () => {
      const lowRetention: LearningMetrics = {
        newConceptsLearned: 2,
        knowledgeRetention: 0.3,
        adaptationSpeed: 0.5,
        creativityLevel: 0.5,
      }

      const highRetention: LearningMetrics = {
        newConceptsLearned: 2,
        knowledgeRetention: 0.9,
        adaptationSpeed: 0.5,
        creativityLevel: 0.5,
      }

      const lowExp = calculator.calculateExperience('learning', lowRetention)
      const highExp = calculator.calculateExperience('learning', highRetention)

      expect(highExp).toBeGreaterThan(lowExp)
    })
  })

  describe('Relationship Experience', () => {
    it('should calculate relationship experience correctly', () => {
      const metrics: RelationshipMetrics = {
        intimacyIncrease: 0.1,
        trustBuilding: 0.8,
        bondStrength: 0.7,
        conflictResolution: 0.6,
      }

      const exp = calculator.calculateExperience('relationship', metrics)
      expect(exp).toBeGreaterThan(0)
      expect(exp).toBeLessThanOrEqual(50) // Max relationship experience
    })

    it('should give more experience for intimacy increases', () => {
      const smallIncrease: RelationshipMetrics = {
        intimacyIncrease: 0.02,
        trustBuilding: 0.5,
        bondStrength: 0.5,
        conflictResolution: 0.5,
      }

      const largeIncrease: RelationshipMetrics = {
        intimacyIncrease: 0.2,
        trustBuilding: 0.5,
        bondStrength: 0.5,
        conflictResolution: 0.5,
      }

      const smallExp = calculator.calculateExperience('relationship', smallIncrease)
      const largeExp = calculator.calculateExperience('relationship', largeIncrease)

      expect(largeExp).toBeGreaterThan(smallExp)
    })

    it('should apply trust bonus', () => {
      const lowTrust: RelationshipMetrics = {
        intimacyIncrease: 0.1,
        trustBuilding: 0.2,
        bondStrength: 0.5,
        conflictResolution: 0.5,
      }

      const highTrust: RelationshipMetrics = {
        intimacyIncrease: 0.1,
        trustBuilding: 0.9,
        bondStrength: 0.5,
        conflictResolution: 0.5,
      }

      const lowExp = calculator.calculateExperience('relationship', lowTrust)
      const highExp = calculator.calculateExperience('relationship', highTrust)

      expect(highExp).toBeGreaterThan(lowExp)
    })
  })

  describe('Experience Calculation with Multipliers', () => {
    it('should apply level multiplier correctly', () => {
      const metrics: ConversationMetrics = {
        messageLength: 50,
        complexity: 0.5,
        engagement: 0.5,
        responseQuality: 0.5,
      }

      const baseExp = calculator.calculateExperience('conversation', metrics, 1)
      const multipliedExp = calculator.calculateExperience('conversation', metrics, 5, 1.5)

      expect(multipliedExp).toBeGreaterThan(baseExp)
    })

    it('should cap experience at maximum values', () => {
      const highMetrics: ConversationMetrics = {
        messageLength: 1000,
        complexity: 1.0,
        engagement: 1.0,
        responseQuality: 1.0,
      }

      const exp = calculator.calculateExperience('conversation', highMetrics)
      expect(exp).toBeLessThanOrEqual(100) // Should not exceed max
    })

    it('should return minimum experience for very low metrics', () => {
      const lowMetrics: ConversationMetrics = {
        messageLength: 1,
        complexity: 0.0,
        engagement: 0.0,
        responseQuality: 0.0,
      }

      const exp = calculator.calculateExperience('conversation', lowMetrics)
      expect(exp).toBeGreaterThanOrEqual(1) // Minimum experience
    })
  })

  describe('Edge Cases', () => {
    it('should handle null metrics gracefully', () => {
      const exp = calculator.calculateExperience('conversation', null as any)
      expect(exp).toBe(1) // Should return minimum experience
    })

    it('should handle negative values in metrics', () => {
      const negativeMetrics: ConversationMetrics = {
        messageLength: -10,
        complexity: -0.5,
        engagement: -0.3,
        responseQuality: -0.2,
      }

      const exp = calculator.calculateExperience('conversation', negativeMetrics)
      expect(exp).toBeGreaterThanOrEqual(1) // Should normalize to minimum
    })

    it('should handle very large values', () => {
      const largeMetrics: ConversationMetrics = {
        messageLength: 999999,
        complexity: 999,
        engagement: 999,
        responseQuality: 999,
      }

      const exp = calculator.calculateExperience('conversation', largeMetrics)
      expect(exp).toBeLessThanOrEqual(100) // Should cap at maximum
    })

    it('should handle invalid experience type', () => {
      const metrics: ConversationMetrics = {
        messageLength: 50,
        complexity: 0.5,
        engagement: 0.5,
        responseQuality: 0.5,
      }

      expect(() => {
        calculator.calculateExperience('invalid' as ExperienceType, metrics)
      }).toThrow()
    })
  })

  describe('Experience Formulas', () => {
    it('should use different formulas for different experience types', () => {
      const conversationExp = calculator.calculateExperience('conversation', {
        messageLength: 50,
        complexity: 0.5,
        engagement: 0.5,
        responseQuality: 0.5,
      })

      const emotionalExp = calculator.calculateExperience('emotional', {
        intensityChange: 0.5,
        empathyLevel: 0.5,
        emotionalComplexity: 0.5,
        userSatisfaction: 0.5,
      })

      const learningExp = calculator.calculateExperience('learning', {
        newConceptsLearned: 2,
        knowledgeRetention: 0.5,
        adaptationSpeed: 0.5,
        creativityLevel: 0.5,
      })

      const relationshipExp = calculator.calculateExperience('relationship', {
        intimacyIncrease: 0.1,
        trustBuilding: 0.5,
        bondStrength: 0.5,
        conflictResolution: 0.5,
      })

      // Each type should give different base amounts
      const experiences = [conversationExp, emotionalExp, learningExp, relationshipExp]
      const uniqueValues = [...new Set(experiences)]
      
      // Should have different values (unless coincidentally equal)
      expect(uniqueValues.length).toBeGreaterThan(1)
    })
  })
})