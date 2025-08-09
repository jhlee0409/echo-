import type { 
  AchievementId, 
  Achievement, 
  AchievementTier, 
  CharacterEvolution 
} from './types'

/**
 * Achievement Tracker
 * Manages achievements, conditions, and rewards
 */
export class AchievementTracker {
  private achievements: Map<AchievementId, Achievement> = new Map()

  constructor() {
    this.initializeAchievements()
  }

  /**
   * Get achievement by ID
   */
  getAchievement(achievementId: AchievementId): Achievement | undefined {
    return this.achievements.get(achievementId)
  }

  /**
   * Get all achievements
   */
  getAllAchievements(): Map<AchievementId, Achievement> {
    return new Map(this.achievements)
  }

  /**
   * Get achievements by tier
   */
  getAchievementsByTier(tier: AchievementTier): AchievementId[] {
    return Array.from(this.achievements.entries())
      .filter(([_, achievement]) => achievement.tier === tier)
      .map(([achievementId, _]) => achievementId)
  }

  /**
   * Check for new achievements and return unlocked ones
   */
  checkAchievements(evolution: CharacterEvolution): AchievementId[] {
    const newAchievements: AchievementId[] = []
    const unlockedAchievements = evolution.unlockedAchievements || []

    for (const [achievementId, achievement] of this.achievements) {
      // Skip if already unlocked
      if (unlockedAchievements.includes(achievementId)) {
        continue
      }

      // Check condition
      if (achievement.condition(evolution)) {
        newAchievements.push(achievementId)
      }
    }

    return newAchievements
  }

  private initializeAchievements(): void {
    // Conversation Achievements
    this.achievements.set('first_conversation', {
      id: 'first_conversation',
      name: 'First Words',
      description: 'Had your first conversation',
      tier: 'bronze',
      condition: (evolution) => (evolution.experienceByType?.conversation || 0) >= 5,
      rewards: {
        experience: 10,
      },
    })

    this.achievements.set('conversationalist', {
      id: 'conversationalist',
      name: 'Conversationalist',
      description: 'Engaged in meaningful conversations',
      tier: 'silver',
      condition: (evolution) => (evolution.experienceByType?.conversation || 0) >= 100,
      rewards: {
        experience: 25,
        skillPoints: 1,
      },
    })

    this.achievements.set('master_conversationalist', {
      id: 'master_conversationalist',
      name: 'Master Conversationalist',
      description: 'Achieved excellence in conversation',
      tier: 'gold',
      condition: (evolution) => (evolution.experienceByType?.conversation || 0) >= 500,
      rewards: {
        experience: 50,
        skillPoints: 2,
        personalityBoost: { cheerful: 0.1, curious: 0.1 },
      },
    })

    // Emotional Achievements
    this.achievements.set('first_emotion', {
      id: 'first_emotion',
      name: 'First Feeling',
      description: 'Experienced your first deep emotion',
      tier: 'bronze',
      condition: (evolution) => (evolution.experienceByType?.emotional || 0) >= 3,
      rewards: {
        experience: 8,
      },
    })

    this.achievements.set('empathetic_soul', {
      id: 'empathetic_soul',
      name: 'Empathetic Soul',
      description: 'Developed deep emotional understanding',
      tier: 'silver',
      condition: (evolution) => (evolution.experienceByType?.emotional || 0) >= 150,
      rewards: {
        experience: 30,
        personalityBoost: { supportive: 0.15, emotional: 0.1 },
      },
    })

    this.achievements.set('emotional_master', {
      id: 'emotional_master',
      name: 'Emotional Master',
      description: 'Achieved mastery over emotions',
      tier: 'platinum',
      condition: (evolution) => (evolution.experienceByType?.emotional || 0) >= 600,
      rewards: {
        experience: 75,
        skillPoints: 3,
        personalityBoost: { emotional: 0.2, supportive: 0.15 },
        abilities: ['emotion_control'],
      },
    })

    // Learning Achievements
    this.achievements.set('first_lesson', {
      id: 'first_lesson',
      name: 'First Lesson',
      description: 'Learned something new for the first time',
      tier: 'bronze',
      condition: (evolution) => (evolution.experienceByType?.learning || 0) >= 10,
      rewards: {
        experience: 15,
      },
    })

    this.achievements.set('quick_learner', {
      id: 'quick_learner',
      name: 'Quick Learner',
      description: 'Demonstrated rapid learning ability',
      tier: 'silver',
      condition: (evolution) => (evolution.experienceByType?.learning || 0) >= 120,
      rewards: {
        experience: 35,
        personalityBoost: { curious: 0.15 },
      },
    })

    this.achievements.set('knowledge_seeker', {
      id: 'knowledge_seeker',
      name: 'Knowledge Seeker',
      description: 'Pursued knowledge with dedication',
      tier: 'gold',
      condition: (evolution) => (evolution.experienceByType?.learning || 0) >= 400,
      rewards: {
        experience: 60,
        skillPoints: 2,
        personalityBoost: { curious: 0.2 },
        abilities: ['knowledge_synthesis'],
      },
    })

    this.achievements.set('wisdom_seeker', {
      id: 'wisdom_seeker',
      name: 'Wisdom Seeker',
      description: 'Transcended mere knowledge to seek wisdom',
      tier: 'master',
      condition: (evolution) => (evolution.experienceByType?.learning || 0) >= 800,
      rewards: {
        experience: 100,
        skillPoints: 4,
        personalityBoost: { curious: 0.25, careful: 0.15 },
        abilities: ['wisdom_sharing', 'deep_insight'],
      },
    })

    // Relationship Achievements
    this.achievements.set('first_bond', {
      id: 'first_bond',
      name: 'First Bond',
      description: 'Formed your first meaningful connection',
      tier: 'bronze',
      condition: (evolution) => (evolution.experienceByType?.relationship || 0) >= 15,
      rewards: {
        experience: 12,
      },
    })

    this.achievements.set('trusted_friend', {
      id: 'trusted_friend',
      name: 'Trusted Friend',
      description: 'Became a trusted and reliable friend',
      tier: 'silver',
      condition: (evolution) => (evolution.experienceByType?.relationship || 0) >= 200,
      rewards: {
        experience: 40,
        personalityBoost: { supportive: 0.2 },
      },
    })

    this.achievements.set('soulmate', {
      id: 'soulmate',
      name: 'Soulmate',
      description: 'Formed a transcendent soul connection',
      tier: 'master',
      condition: (evolution) => (evolution.experienceByType?.relationship || 0) >= 750,
      rewards: {
        experience: 120,
        skillPoints: 5,
        personalityBoost: { supportive: 0.3, emotional: 0.2 },
        abilities: ['soul_connection', 'perfect_understanding'],
      },
    })

    // Level-based Achievements
    this.achievements.set('level_up', {
      id: 'level_up',
      name: 'Growing Up',
      description: 'Reached level 2',
      tier: 'bronze',
      condition: (evolution) => evolution.level >= 2,
      rewards: {
        experience: 20,
      },
    })

    this.achievements.set('experienced', {
      id: 'experienced',
      name: 'Experienced',
      description: 'Reached level 5',
      tier: 'silver',
      condition: (evolution) => evolution.level >= 5,
      rewards: {
        experience: 50,
        skillPoints: 1,
      },
    })

    this.achievements.set('veteran', {
      id: 'veteran',
      name: 'Veteran',
      description: 'Reached level 10',
      tier: 'platinum',
      condition: (evolution) => evolution.level >= 10,
      rewards: {
        experience: 100,
        skillPoints: 3,
        personalityBoost: { careful: 0.1, supportive: 0.1 },
      },
    })

    // Skill-based Achievements
    this.achievements.set('first_skill', {
      id: 'first_skill',
      name: 'First Skill',
      description: 'Unlocked your first skill',
      tier: 'bronze',
      condition: (evolution) => (evolution.unlockedSkills?.length || 0) >= 1,
      rewards: {
        experience: 15,
      },
    })

    this.achievements.set('skill_collector', {
      id: 'skill_collector',
      name: 'Skill Collector',
      description: 'Unlocked 5 different skills',
      tier: 'silver',
      condition: (evolution) => (evolution.unlockedSkills?.length || 0) >= 5,
      rewards: {
        experience: 40,
        skillPoints: 2,
      },
    })

    this.achievements.set('master_of_all', {
      id: 'master_of_all',
      name: 'Master of All',
      description: 'Unlocked 15 different skills',
      tier: 'platinum',
      condition: (evolution) => (evolution.unlockedSkills?.length || 0) >= 15,
      rewards: {
        experience: 80,
        skillPoints: 4,
        personalityBoost: { curious: 0.15, careful: 0.1 },
        abilities: ['skill_mastery'],
      },
    })

    // Stage-based Achievements
    this.achievements.set('developing_mind', {
      id: 'developing_mind',
      name: 'Developing Mind',
      description: 'Evolved to the developing stage',
      tier: 'silver',
      condition: (evolution) => evolution.stage === 'developing',
      rewards: {
        experience: 30,
        skillPoints: 1,
      },
    })

    this.achievements.set('mature_companion', {
      id: 'mature_companion',
      name: 'Mature Companion',
      description: 'Evolved to the maturing stage',
      tier: 'gold',
      condition: (evolution) => evolution.stage === 'maturing',
      rewards: {
        experience: 60,
        skillPoints: 2,
        personalityBoost: { careful: 0.1, supportive: 0.1 },
      },
    })

    this.achievements.set('evolved_being', {
      id: 'evolved_being',
      name: 'Evolved Being',
      description: 'Evolved to the evolved stage',
      tier: 'platinum',
      condition: (evolution) => evolution.stage === 'evolved',
      rewards: {
        experience: 100,
        skillPoints: 3,
        personalityBoost: { 
          supportive: 0.15, 
          emotional: 0.1, 
          curious: 0.1 
        },
        abilities: ['advanced_empathy', 'wisdom_sharing'],
      },
    })

    this.achievements.set('transcendent_being', {
      id: 'transcendent_being',
      name: 'Transcendent Being',
      description: 'Achieved the transcendent stage of evolution',
      tier: 'master',
      condition: (evolution) => evolution.stage === 'transcendent',
      rewards: {
        experience: 200,
        skillPoints: 5,
        personalityBoost: { 
          supportive: 0.25, 
          emotional: 0.2, 
          curious: 0.15, 
          careful: 0.1,
          cheerful: 0.1 
        },
        abilities: ['transcendent_wisdom', 'perfect_understanding', 'reality_insight'],
      },
    })

    // Combined Achievements
    this.achievements.set('well_rounded', {
      id: 'well_rounded',
      name: 'Well Rounded',
      description: 'Gained experience in all areas',
      tier: 'gold',
      condition: (evolution) => {
        const exp = evolution.experienceByType || {}
        return (exp.conversation || 0) >= 100 &&
               (exp.emotional || 0) >= 100 &&
               (exp.learning || 0) >= 100 &&
               (exp.relationship || 0) >= 100
      },
      rewards: {
        experience: 80,
        skillPoints: 3,
        personalityBoost: { 
          curious: 0.1, 
          supportive: 0.1, 
          emotional: 0.1 
        },
      },
    })

    this.achievements.set('perfect_companion', {
      id: 'perfect_companion',
      name: 'Perfect Companion',
      description: 'Achieved excellence in all aspects of companionship',
      tier: 'master',
      condition: (evolution) => {
        return evolution.level >= 10 &&
               evolution.stage === 'transcendent' &&
               (evolution.unlockedSkills?.length || 0) >= 12 &&
               (evolution.experienceByType?.conversation || 0) >= 400 &&
               (evolution.experienceByType?.emotional || 0) >= 400 &&
               (evolution.experienceByType?.learning || 0) >= 400 &&
               (evolution.experienceByType?.relationship || 0) >= 400
      },
      rewards: {
        experience: 300,
        skillPoints: 10,
        personalityBoost: { 
          supportive: 0.3, 
          emotional: 0.25, 
          curious: 0.2, 
          careful: 0.15,
          cheerful: 0.2,
          playful: 0.15 
        },
        abilities: [
          'perfect_understanding', 
          'transcendent_wisdom', 
          'soul_connection',
          'reality_insight',
          'infinite_patience'
        ],
      },
    })

    // Special Achievements
    this.achievements.set('fast_learner', {
      id: 'fast_learner',
      name: 'Fast Learner',
      description: 'Reached level 5 with minimal experience',
      tier: 'gold',
      condition: (evolution) => evolution.level >= 5 && evolution.experience <= 400,
      rewards: {
        experience: 70,
        skillPoints: 2,
        personalityBoost: { curious: 0.2 },
      },
    })

    this.achievements.set('patient_growth', {
      id: 'patient_growth',
      name: 'Patient Growth',
      description: 'Steady and consistent development over time',
      tier: 'silver',
      condition: (evolution) => {
        const exp = evolution.experienceByType || {}
        return Object.values(exp).every(e => e >= 50) && evolution.level >= 6
      },
      rewards: {
        experience: 45,
        skillPoints: 1,
        personalityBoost: { careful: 0.15 },
      },
    })

    this.achievements.set('social_butterfly', {
      id: 'social_butterfly',
      name: 'Social Butterfly',
      description: 'Excelled primarily in social aspects',
      tier: 'gold',
      condition: (evolution) => {
        const exp = evolution.experienceByType || {}
        return (exp.conversation || 0) >= 300 && (exp.relationship || 0) >= 200
      },
      rewards: {
        experience: 65,
        skillPoints: 2,
        personalityBoost: { cheerful: 0.15, playful: 0.1 },
      },
    })
  }
}