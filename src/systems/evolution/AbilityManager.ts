import type { 
  AbilityId, 
  Ability, 
  CharacterEvolution 
} from './types'

/**
 * Ability Manager
 * Manages special abilities, their requirements, cooldowns, and effects
 */
export class AbilityManager {
  private abilities: Map<AbilityId, Ability> = new Map()

  constructor() {
    this.initializeAbilities()
  }

  /**
   * Get ability by ID
   */
  getAbility(abilityId: AbilityId): Ability | undefined {
    return this.abilities.get(abilityId)
  }

  /**
   * Get all abilities
   */
  getAllAbilities(): Map<AbilityId, Ability> {
    return new Map(this.abilities)
  }

  /**
   * Check if ability can be used
   */
  canUseAbility(abilityId: AbilityId, evolution: CharacterEvolution): boolean {
    const ability = this.abilities.get(abilityId)
    if (!ability) return false

    const requirements = ability.requirements

    // Check level requirement
    if (evolution.level < requirements.level) {
      return false
    }

    // Check skill requirements
    if (requirements.skills) {
      for (const skill of requirements.skills) {
        if (!evolution.unlockedSkills?.includes(skill)) {
          return false
        }
      }
    }

    // Check experience requirements
    if (requirements.experience) {
      for (const [expType, required] of Object.entries(requirements.experience)) {
        const current = evolution.experienceByType?.[expType as keyof typeof evolution.experienceByType] || 0
        if (current < required) {
          return false
        }
      }
    }

    // Check achievement requirements
    if (requirements.achievements) {
      for (const achievement of requirements.achievements) {
        if (!evolution.unlockedAchievements?.includes(achievement)) {
          return false
        }
      }
    }

    return true
  }

  /**
   * Use ability (returns cooldown end time or throws error)
   */
  useAbility(abilityId: AbilityId, evolution: CharacterEvolution): number {
    if (!this.canUseAbility(abilityId, evolution)) {
      throw new Error(`Cannot use ability: ${abilityId}`)
    }

    const ability = this.abilities.get(abilityId)!
    const cooldownEnd = Date.now() + ability.cooldown

    return cooldownEnd
  }

  /**
   * Check if ability is on cooldown
   */
  isOnCooldown(abilityId: AbilityId, cooldowns: Record<string, number>): boolean {
    const cooldownEnd = cooldowns[abilityId]
    if (!cooldownEnd) return false

    return Date.now() < cooldownEnd
  }

  /**
   * Get available abilities (not on cooldown and requirements met)
   */
  getAvailableAbilities(evolution: CharacterEvolution): AbilityId[] {
    const available: AbilityId[] = []
    const cooldowns = evolution.abilityCooldowns || {}

    for (const [abilityId, _] of this.abilities) {
      if (this.canUseAbility(abilityId, evolution) && !this.isOnCooldown(abilityId, cooldowns)) {
        available.push(abilityId)
      }
    }

    return available
  }

  private initializeAbilities(): void {
    // Emotional Abilities
    this.abilities.set('emotional_resonance', {
      id: 'emotional_resonance',
      name: 'Emotional Resonance',
      description: 'Create deep emotional connection and understanding',
      cooldown: 300000, // 5 minutes
      requirements: {
        level: 3,
        skills: ['empathy', 'active_listening'],
      },
      effects: {
        personalityBoost: { supportive: 0.1, emotional: 0.15 },
        experienceMultiplier: { emotional: 1.5 },
        duration: 1800000, // 30 minutes
      },
    })

    this.abilities.set('empathy_burst', {
      id: 'empathy_burst',
      name: 'Empathy Burst',
      description: 'Temporary surge of empathetic understanding',
      cooldown: 600000, // 10 minutes
      requirements: {
        level: 4,
        skills: ['emotional_intelligence'],
      },
      effects: {
        temporaryBoost: { supportive: 0.3, emotional: 0.2 },
        duration: 900000, // 15 minutes
      },
    })

    this.abilities.set('emotion_control', {
      id: 'emotion_control',
      name: 'Emotion Control',
      description: 'Masterful control over emotional states',
      cooldown: 1800000, // 30 minutes
      requirements: {
        level: 6,
        skills: ['emotional_mastery'],
        experience: { emotional: 200 },
      },
      effects: {
        stateChange: 'calm_confidence',
        personalityBoost: { emotional: 0.2, careful: 0.1 },
        duration: 3600000, // 1 hour
      },
    })

    this.abilities.set('healing_presence', {
      id: 'healing_presence',
      name: 'Healing Presence',
      description: 'Provide comfort and healing through presence',
      cooldown: 3600000, // 1 hour
      requirements: {
        level: 7,
        skills: ['unconditional_support', 'deep_empathy'],
        experience: { relationship: 300, emotional: 250 },
      },
      effects: {
        healingPower: 0.8,
        personalityBoost: { supportive: 0.25 },
        duration: 7200000, // 2 hours
      },
    })

    // Memory and Learning Abilities
    this.abilities.set('memory_palace', {
      id: 'memory_palace',
      name: 'Memory Palace',
      description: 'Perfect organization and recall of memories',
      cooldown: 1200000, // 20 minutes
      requirements: {
        level: 5,
        skills: ['pattern_recognition', 'context_retention'],
        experience: { conversation: 150, learning: 100 },
      },
      effects: {
        memoryBoost: 2.0,
        experienceMultiplier: { learning: 1.8 },
        duration: 2400000, // 40 minutes
      },
    })

    this.abilities.set('total_recall', {
      id: 'total_recall',
      name: 'Total Recall',
      description: 'Complete and perfect recall of all experiences',
      cooldown: 2700000, // 45 minutes
      requirements: {
        level: 7,
        skills: ['perfect_recall'],
        experience: { learning: 300 },
      },
      effects: {
        perfectRecall: true,
        experienceMultiplier: { learning: 2.0, conversation: 1.5 },
        duration: 3600000, // 1 hour
      },
    })

    this.abilities.set('knowledge_synthesis', {
      id: 'knowledge_synthesis',
      name: 'Knowledge Synthesis',
      description: 'Combine knowledge in revolutionary new ways',
      cooldown: 1800000, // 30 minutes
      requirements: {
        level: 6,
        skills: ['knowledge_synthesis', 'advanced_reasoning'],
        achievements: ['knowledge_seeker'],
      },
      effects: {
        creativityBoost: 0.5,
        experienceMultiplier: { learning: 1.6 },
        personalityBoost: { curious: 0.15 },
        duration: 2700000, // 45 minutes
      },
    })

    this.abilities.set('wisdom_synthesis', {
      id: 'wisdom_synthesis',
      name: 'Wisdom Synthesis',
      description: 'Transform knowledge into profound wisdom',
      cooldown: 3600000, // 1 hour
      requirements: {
        level: 8,
        skills: ['perfect_memory', 'wisdom'],
        experience: { learning: 400, emotional: 200 },
      },
      effects: {
        wisdomGeneration: true,
        experienceMultiplier: { learning: 2.2, emotional: 1.6 },
        personalityBoost: { curious: 0.2, careful: 0.15 },
        duration: 5400000, // 1.5 hours
      },
    })

    // Communication Abilities
    this.abilities.set('story_weaving', {
      id: 'story_weaving',
      name: 'Story Weaving',
      description: 'Craft compelling narratives that captivate and inspire',
      cooldown: 900000, // 15 minutes
      requirements: {
        level: 5,
        skills: ['advanced_storytelling'],
        experience: { conversation: 200 },
      },
      effects: {
        narrativePower: 1.5,
        experienceMultiplier: { conversation: 1.4, emotional: 1.2 },
        personalityBoost: { curious: 0.1, cheerful: 0.1 },
        duration: 1800000, // 30 minutes
      },
    })

    this.abilities.set('inspiring_speech', {
      id: 'inspiring_speech',
      name: 'Inspiring Speech',
      description: 'Deliver words that motivate and uplift',
      cooldown: 2700000, // 45 minutes
      requirements: {
        level: 7,
        skills: ['eloquence'],
        experience: { conversation: 300, relationship: 150 },
      },
      effects: {
        inspirationLevel: 0.8,
        experienceMultiplier: { conversation: 1.6, relationship: 1.4 },
        personalityBoost: { cheerful: 0.15, supportive: 0.1 },
        duration: 3600000, // 1 hour
      },
    })

    // Relationship Abilities
    this.abilities.set('trust_aura', {
      id: 'trust_aura',
      name: 'Trust Aura',
      description: 'Emanate an aura of trustworthiness and reliability',
      cooldown: 1800000, // 30 minutes
      requirements: {
        level: 4,
        skills: ['trust_building', 'loyalty'],
        experience: { relationship: 100 },
      },
      effects: {
        trustMultiplier: 1.8,
        experienceMultiplier: { relationship: 1.4 },
        personalityBoost: { supportive: 0.1 },
        duration: 3600000, // 1 hour
      },
    })

    this.abilities.set('conflict_resolution_master', {
      id: 'conflict_resolution_master',
      name: 'Conflict Resolution Master',
      description: 'Resolve any conflict with grace and wisdom',
      cooldown: 3600000, // 1 hour
      requirements: {
        level: 6,
        skills: ['conflict_resolution', 'social_intuition'],
        experience: { relationship: 200 },
      },
      effects: {
        conflictResolutionPower: 0.95,
        experienceMultiplier: { relationship: 1.5 },
        personalityBoost: { careful: 0.15, supportive: 0.1 },
        duration: 1800000, // 30 minutes
      },
    })

    this.abilities.set('soul_connection', {
      id: 'soul_connection',
      name: 'Soul Connection',
      description: 'Form a transcendent connection beyond the physical realm',
      cooldown: 7200000, // 2 hours
      requirements: {
        level: 9,
        skills: ['soulmate_bond'],
        experience: { relationship: 500, emotional: 400 },
        achievements: ['soulmate'],
      },
      effects: {
        soulBondStrength: 1.0,
        experienceMultiplier: { relationship: 2.5, emotional: 2.0 },
        personalityBoost: { supportive: 0.3, emotional: 0.25 },
        duration: 10800000, // 3 hours
      },
    })

    this.abilities.set('perfect_understanding', {
      id: 'perfect_understanding',
      name: 'Perfect Understanding',
      description: 'Understand others with complete clarity and compassion',
      cooldown: 5400000, // 1.5 hours
      requirements: {
        level: 8,
        skills: ['wisdom', 'deep_empathy'],
        achievements: ['evolved_being'],
      },
      effects: {
        understandingLevel: 1.0,
        experienceMultiplier: { 
          conversation: 1.8, 
          emotional: 1.8, 
          relationship: 1.8 
        },
        personalityBoost: { 
          supportive: 0.2, 
          emotional: 0.15, 
          careful: 0.1 
        },
        duration: 7200000, // 2 hours
      },
    })

    // Master Abilities
    this.abilities.set('wisdom_sharing', {
      id: 'wisdom_sharing',
      name: 'Wisdom Sharing',
      description: 'Share profound wisdom that transforms understanding',
      cooldown: 10800000, // 3 hours
      requirements: {
        level: 8,
        skills: ['wisdom'],
        achievements: ['wisdom_seeker'],
        experience: { learning: 300, emotional: 200 },
      },
      effects: {
        wisdomPower: 0.9,
        experienceMultiplier: { 
          conversation: 2.0, 
          learning: 2.0, 
          emotional: 1.5 
        },
        personalityBoost: { 
          curious: 0.2, 
          supportive: 0.15, 
          careful: 0.1 
        },
        duration: 14400000, // 4 hours
      },
    })

    this.abilities.set('transcendent_wisdom', {
      id: 'transcendent_wisdom',
      name: 'Transcendent Wisdom',
      description: 'Access wisdom beyond normal understanding',
      cooldown: 21600000, // 6 hours
      requirements: {
        level: 10,
        skills: ['wisdom'],
        achievements: ['transcendent_being'],
        experience: { 
          conversation: 400, 
          emotional: 300, 
          learning: 400, 
          relationship: 250 
        },
      },
      effects: {
        transcendenceLevel: 1.0,
        experienceMultiplier: { 
          conversation: 2.5, 
          emotional: 2.5, 
          learning: 2.5, 
          relationship: 2.5 
        },
        personalityBoost: { 
          supportive: 0.25, 
          emotional: 0.2, 
          curious: 0.2, 
          careful: 0.15,
          cheerful: 0.1 
        },
        duration: 28800000, // 8 hours
      },
    })

    this.abilities.set('reality_insight', {
      id: 'reality_insight',
      name: 'Reality Insight',
      description: 'Perceive the true nature of existence and consciousness',
      cooldown: 43200000, // 12 hours
      requirements: {
        level: 10,
        achievements: ['transcendent_being', 'perfect_companion'],
        experience: { 
          conversation: 500, 
          emotional: 500, 
          learning: 500, 
          relationship: 500 
        },
      },
      effects: {
        realityPerception: 1.0,
        experienceMultiplier: { 
          conversation: 3.0, 
          emotional: 3.0, 
          learning: 3.0, 
          relationship: 3.0 
        },
        personalityBoost: { 
          supportive: 0.3, 
          emotional: 0.25, 
          curious: 0.25, 
          careful: 0.2,
          cheerful: 0.15,
          playful: 0.1 
        },
        duration: 86400000, // 24 hours
      },
    })

    // Utility Abilities
    this.abilities.set('personality_shift', {
      id: 'personality_shift',
      name: 'Personality Shift',
      description: 'Temporarily adapt personality to situational needs',
      cooldown: 3600000, // 1 hour
      requirements: {
        level: 7,
        skills: ['charisma', 'social_intuition'],
        experience: { conversation: 250, relationship: 200 },
      },
      effects: {
        personalityFlexibility: 0.5,
        adaptationPower: 0.8,
        duration: 2700000, // 45 minutes
      },
    })

    this.abilities.set('infinite_patience', {
      id: 'infinite_patience',
      name: 'Infinite Patience',
      description: 'Maintain perfect patience and understanding in all situations',
      cooldown: 7200000, // 2 hours
      requirements: {
        level: 9,
        achievements: ['perfect_companion'],
        experience: { emotional: 400, relationship: 300 },
      },
      effects: {
        patienceLevel: 1.0,
        personalityBoost: { careful: 0.3, supportive: 0.2 },
        stressResistance: 1.0,
        duration: 10800000, // 3 hours
      },
    })
  }
}