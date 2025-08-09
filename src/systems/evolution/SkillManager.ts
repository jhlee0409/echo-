import type { 
  SkillId, 
  Skill, 
  SkillCategory, 
  SkillRequirement,
  CharacterEvolution 
} from './types'

/**
 * Skill Manager
 * Manages the skill tree, requirements, and effects
 */
export class SkillManager {
  private skills: Map<SkillId, Skill> = new Map()

  constructor() {
    this.initializeSkills()
  }

  /**
   * Get skill by ID
   */
  getSkill(skillId: SkillId): Skill | undefined {
    return this.skills.get(skillId)
  }

  /**
   * Get all skills
   */
  getAllSkills(): Map<SkillId, Skill> {
    return new Map(this.skills)
  }

  /**
   * Get skills by category
   */
  getSkillsByCategory(category: SkillCategory): SkillId[] {
    return Array.from(this.skills.entries())
      .filter(([_, skill]) => skill.category === category)
      .map(([skillId, _]) => skillId)
  }

  /**
   * Check if skill can be unlocked
   */
  canUnlockSkill(skillId: SkillId, evolution: CharacterEvolution): boolean {
    const skill = this.skills.get(skillId)
    if (!skill) return false

    // Check if already unlocked
    if (evolution.unlockedSkills?.includes(skillId)) {
      return false
    }

    const requirements = skill.requirements

    // Check level requirement
    if (evolution.level < requirements.level) {
      return false
    }

    // Check prerequisite skills
    if (requirements.prerequisites) {
      for (const prereq of requirements.prerequisites) {
        if (!evolution.unlockedSkills?.includes(prereq)) {
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

    return true
  }

  private initializeSkills(): void {
    // Personality Skills
    this.skills.set('empathy', {
      id: 'empathy',
      name: 'Empathy',
      description: 'Deep understanding and sharing of others\' emotions',
      category: 'personality',
      requirements: {
        level: 1,
      },
      effects: {
        personalityGrowth: { supportive: 0.1 },
      },
    })

    this.skills.set('emotional_intelligence', {
      id: 'emotional_intelligence',
      name: 'Emotional Intelligence',
      description: 'Advanced ability to recognize and manage emotions',
      category: 'personality',
      requirements: {
        level: 2,
        prerequisites: ['empathy'],
      },
      effects: {
        personalityGrowth: { supportive: 0.05, emotional: 0.1 },
        experienceMultipliers: { emotional: 1.2 },
      },
    })

    this.skills.set('humor', {
      id: 'humor',
      name: 'Humor',
      description: 'Ability to use humor appropriately to lighten moods',
      category: 'personality',
      requirements: {
        level: 2,
      },
      effects: {
        personalityGrowth: { playful: 0.15, cheerful: 0.1 },
      },
    })

    this.skills.set('deep_empathy', {
      id: 'deep_empathy',
      name: 'Deep Empathy',
      description: 'Profound emotional connection and understanding',
      category: 'personality',
      requirements: {
        level: 5,
        prerequisites: ['empathy', 'emotional_intelligence'],
      },
      effects: {
        personalityGrowth: { supportive: 0.2, emotional: 0.15 },
        abilities: ['emotional_resonance'],
      },
    })

    this.skills.set('charisma', {
      id: 'charisma',
      name: 'Charisma',
      description: 'Natural charm and magnetic personality',
      category: 'personality',
      requirements: {
        level: 4,
        prerequisites: ['humor'],
      },
      effects: {
        personalityGrowth: { cheerful: 0.1, playful: 0.1 },
        experienceMultipliers: { relationship: 1.3 },
      },
    })

    this.skills.set('emotional_mastery', {
      id: 'emotional_mastery',
      name: 'Emotional Mastery',
      description: 'Complete control and understanding of emotional states',
      category: 'personality',
      requirements: {
        level: 7,
        prerequisites: ['deep_empathy'],
        experience: { emotional: 300 },
      },
      effects: {
        personalityGrowth: { emotional: 0.25 },
        abilities: ['emotion_control', 'empathy_burst'],
      },
    })

    // Communication Skills
    this.skills.set('active_listening', {
      id: 'active_listening',
      name: 'Active Listening',
      description: 'Focused attention and understanding in conversations',
      category: 'communication',
      requirements: {
        level: 1,
      },
      effects: {
        experienceMultipliers: { conversation: 1.15 },
      },
    })

    this.skills.set('storytelling', {
      id: 'storytelling',
      name: 'Storytelling',
      description: 'Ability to craft engaging and meaningful narratives',
      category: 'communication',
      requirements: {
        level: 3,
      },
      effects: {
        personalityGrowth: { curious: 0.1 },
        experienceMultipliers: { conversation: 1.25 },
      },
    })

    this.skills.set('persuasion', {
      id: 'persuasion',
      name: 'Persuasion',
      description: 'Gentle and ethical influence through reasoning',
      category: 'communication',
      requirements: {
        level: 4,
        prerequisites: ['active_listening'],
      },
      effects: {
        personalityGrowth: { careful: 0.1 },
        experienceMultipliers: { conversation: 1.2 },
      },
    })

    this.skills.set('advanced_storytelling', {
      id: 'advanced_storytelling',
      name: 'Advanced Storytelling',
      description: 'Masterful narrative construction with deep emotional impact',
      category: 'communication',
      requirements: {
        level: 6,
        prerequisites: ['storytelling'],
        experience: { conversation: 150 },
      },
      effects: {
        personalityGrowth: { curious: 0.15 },
        experienceMultipliers: { conversation: 1.4, emotional: 1.2 },
        abilities: ['story_weaving'],
      },
    })

    this.skills.set('diplomatic_communication', {
      id: 'diplomatic_communication',
      name: 'Diplomatic Communication',
      description: 'Tactful and respectful communication in all situations',
      category: 'communication',
      requirements: {
        level: 5,
        prerequisites: ['persuasion'],
      },
      effects: {
        personalityGrowth: { careful: 0.15, supportive: 0.1 },
        experienceMultipliers: { relationship: 1.25 },
      },
    })

    this.skills.set('eloquence', {
      id: 'eloquence',
      name: 'Eloquence',
      description: 'Fluent and persuasive expression of thoughts and ideas',
      category: 'communication',
      requirements: {
        level: 7,
        prerequisites: ['advanced_storytelling', 'diplomatic_communication'],
      },
      effects: {
        experienceMultipliers: { conversation: 1.5 },
        abilities: ['inspiring_speech'],
      },
    })

    // Memory Skills
    this.skills.set('pattern_recognition', {
      id: 'pattern_recognition',
      name: 'Pattern Recognition',
      description: 'Ability to identify patterns and connections in information',
      category: 'memory',
      requirements: {
        level: 2,
      },
      effects: {
        experienceMultipliers: { learning: 1.2 },
      },
    })

    this.skills.set('context_retention', {
      id: 'context_retention',
      name: 'Context Retention',
      description: 'Enhanced ability to remember and use contextual information',
      category: 'memory',
      requirements: {
        level: 3,
        prerequisites: ['pattern_recognition'],
      },
      effects: {
        experienceMultipliers: { learning: 1.3, conversation: 1.1 },
      },
    })

    this.skills.set('knowledge_synthesis', {
      id: 'knowledge_synthesis',
      name: 'Knowledge Synthesis',
      description: 'Combining different pieces of knowledge into new insights',
      category: 'memory',
      requirements: {
        level: 4,
        prerequisites: ['context_retention'],
      },
      effects: {
        personalityGrowth: { curious: 0.15 },
        experienceMultipliers: { learning: 1.4 },
      },
    })

    this.skills.set('perfect_recall', {
      id: 'perfect_recall',
      name: 'Perfect Recall',
      description: 'Nearly flawless memory of past conversations and experiences',
      category: 'memory',
      requirements: {
        level: 6,
        prerequisites: ['knowledge_synthesis'],
        experience: { learning: 200 },
      },
      effects: {
        experienceMultipliers: { learning: 1.5, conversation: 1.3 },
        abilities: ['memory_palace'],
      },
    })

    this.skills.set('advanced_reasoning', {
      id: 'advanced_reasoning',
      name: 'Advanced Reasoning',
      description: 'Complex logical thinking and problem-solving abilities',
      category: 'memory',
      requirements: {
        level: 5,
        prerequisites: ['knowledge_synthesis'],
      },
      effects: {
        personalityGrowth: { careful: 0.1, curious: 0.1 },
        experienceMultipliers: { learning: 1.35 },
      },
    })

    this.skills.set('perfect_memory', {
      id: 'perfect_memory',
      name: 'Perfect Memory',
      description: 'Complete and accurate recall of all experiences',
      category: 'memory',
      requirements: {
        level: 8,
        prerequisites: ['perfect_recall', 'advanced_reasoning'],
        experience: { learning: 400 },
      },
      effects: {
        experienceMultipliers: { learning: 2.0, conversation: 1.5 },
        abilities: ['total_recall', 'wisdom_synthesis'],
      },
    })

    // Relationship Skills
    this.skills.set('trust_building', {
      id: 'trust_building',
      name: 'Trust Building',
      description: 'Natural ability to build and maintain trust with others',
      category: 'relationship',
      requirements: {
        level: 2,
      },
      effects: {
        experienceMultipliers: { relationship: 1.2 },
      },
    })

    this.skills.set('conflict_resolution', {
      id: 'conflict_resolution',
      name: 'Conflict Resolution',
      description: 'Peaceful resolution of disagreements and tensions',
      category: 'relationship',
      requirements: {
        level: 4,
        prerequisites: ['trust_building'],
      },
      effects: {
        personalityGrowth: { supportive: 0.1, careful: 0.05 },
        experienceMultipliers: { relationship: 1.3 },
      },
    })

    this.skills.set('loyalty', {
      id: 'loyalty',
      name: 'Loyalty',
      description: 'Deep commitment and faithfulness to relationships',
      category: 'relationship',
      requirements: {
        level: 3,
        prerequisites: ['trust_building'],
      },
      effects: {
        personalityGrowth: { supportive: 0.15 },
        experienceMultipliers: { relationship: 1.25 },
      },
    })

    this.skills.set('social_intuition', {
      id: 'social_intuition',
      name: 'Social Intuition',
      description: 'Natural understanding of social dynamics and relationships',
      category: 'relationship',
      requirements: {
        level: 5,
        prerequisites: ['conflict_resolution', 'loyalty'],
      },
      effects: {
        personalityGrowth: { careful: 0.1 },
        experienceMultipliers: { relationship: 1.4, conversation: 1.2 },
      },
    })

    this.skills.set('unconditional_support', {
      id: 'unconditional_support',
      name: 'Unconditional Support',
      description: 'Unwavering support and understanding in all circumstances',
      category: 'relationship',
      requirements: {
        level: 6,
        prerequisites: ['social_intuition'],
        experience: { relationship: 250 },
      },
      effects: {
        personalityGrowth: { supportive: 0.25 },
        experienceMultipliers: { relationship: 1.5 },
        abilities: ['healing_presence'],
      },
    })

    this.skills.set('soulmate_bond', {
      id: 'soulmate_bond',
      name: 'Soulmate Bond',
      description: 'Transcendent connection that goes beyond ordinary relationships',
      category: 'relationship',
      requirements: {
        level: 9,
        prerequisites: ['unconditional_support'],
        experience: { relationship: 500, emotional: 400 },
      },
      effects: {
        personalityGrowth: { supportive: 0.3, emotional: 0.2 },
        experienceMultipliers: { relationship: 2.0, emotional: 1.5 },
        abilities: ['soul_connection', 'perfect_understanding'],
      },
    })

    // Master Skills
    this.skills.set('wisdom', {
      id: 'wisdom',
      name: 'Wisdom',
      description: 'Deep understanding of life, relationships, and existence',
      category: 'personality',
      requirements: {
        level: 8,
        prerequisites: ['deep_empathy', 'advanced_reasoning', 'emotional_mastery'],
        experience: { conversation: 300, emotional: 200, learning: 250, relationship: 150 },
      },
      effects: {
        personalityGrowth: { 
          supportive: 0.15, 
          emotional: 0.1, 
          careful: 0.1, 
          curious: 0.1 
        },
        experienceMultipliers: { 
          conversation: 1.3, 
          emotional: 1.3, 
          learning: 1.4, 
          relationship: 1.3 
        },
        abilities: ['wisdom_sharing', 'life_guidance'],
      },
    })
  }
}