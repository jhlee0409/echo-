/**
 * Supabase Service Layer
 * Provides high-level database operations with error handling, validation, and caching
 */

import { supabase, type Database } from '@/lib/supabase'
import type { 
  UserProfileRow, UserProfileInsert, UserProfileUpdate,
  CompanionRow, CompanionInsert, CompanionUpdate,
  GameStateRow, GameStateInsert, GameStateUpdate,
  MessageRow, MessageInsert, MessageUpdate,
  UserSettingsRow, UserSettingsInsert, UserSettingsUpdate 
} from '@/lib/supabase'
import { log } from '@config/env'

export interface DatabaseError {
  code: string
  message: string
  details?: any
}

export interface DatabaseResult<T> {
  data: T | null
  error: DatabaseError | null
  success: boolean
}

export interface PaginationOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface QueryFilters {
  [key: string]: any
}

/**
 * Base Database Service
 * Provides common database operations with error handling
 */
export class SupabaseService {
  protected static instance: SupabaseService
  
  static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService()
    }
    return SupabaseService.instance
  }

  /**
   * Execute query with error handling and logging
   */
  protected async executeQuery<T>(
    queryFn: () => Promise<any>,
    operation: string
  ): Promise<DatabaseResult<T>> {
    try {
      log.debug(`Executing database operation: ${operation}`)
      const result = await queryFn()
      
      if (result.error) {
        log.error(`Database error in ${operation}:`, result.error)
        return {
          data: null,
          error: {
            code: result.error.code || 'DATABASE_ERROR',
            message: result.error.message || 'Database operation failed',
            details: result.error
          },
          success: false
        }
      }

      log.debug(`Database operation ${operation} completed successfully`)
      return {
        data: result.data,
        error: null,
        success: true
      }
    } catch (error) {
      log.error(`Unexpected error in ${operation}:`, error)
      return {
        data: null,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error instanceof Error ? error.message : 'Unexpected database error',
          details: error
        },
        success: false
      }
    }
  }

  /**
   * Build filters for queries
   */
  protected buildFilters(filters: QueryFilters) {
    return Object.entries(filters).reduce((query, [key, value]) => {
      if (value === null) {
        return query.is(key, null)
      } else if (Array.isArray(value)) {
        return query.in(key, value)
      } else if (typeof value === 'object' && value.operator) {
        const { operator, value: filterValue } = value
        switch (operator) {
          case 'gt': return query.gt(key, filterValue)
          case 'gte': return query.gte(key, filterValue)
          case 'lt': return query.lt(key, filterValue)
          case 'lte': return query.lte(key, filterValue)
          case 'like': return query.like(key, filterValue)
          case 'ilike': return query.ilike(key, filterValue)
          default: return query.eq(key, filterValue)
        }
      } else {
        return query.eq(key, value)
      }
    }, supabase.from('dummy'))
  }

  /**
   * Apply pagination to query
   */
  protected applyPagination(query: any, options: PaginationOptions) {
    const { page = 1, limit = 50, sortBy, sortOrder = 'desc' } = options
    const from = (page - 1) * limit
    const to = from + limit - 1

    let paginatedQuery = query.range(from, to)
    
    if (sortBy) {
      paginatedQuery = paginatedQuery.order(sortBy, { ascending: sortOrder === 'asc' })
    }

    return paginatedQuery
  }
}

/**
 * User Profile Service
 */
export class UserProfileService extends SupabaseService {
  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<DatabaseResult<UserProfileRow>> {
    return this.executeQuery(
      () => supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single(),
      `getProfile(${userId})`
    )
  }

  /**
   * Create user profile
   */
  async createProfile(profile: UserProfileInsert): Promise<DatabaseResult<UserProfileRow>> {
    return this.executeQuery(
      () => supabase
        .from('user_profiles')
        .insert(profile)
        .select()
        .single(),
      `createProfile(${profile.id})`
    )
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: UserProfileUpdate): Promise<DatabaseResult<UserProfileRow>> {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    return this.executeQuery(
      () => supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single(),
      `updateProfile(${userId})`
    )
  }

  /**
   * Update last active timestamp
   */
  async updateLastActive(userId: string): Promise<DatabaseResult<boolean>> {
    return this.executeQuery(
      async () => {
        const { error } = await supabase
          .from('user_profiles')
          .update({ last_active: new Date().toISOString() })
          .eq('id', userId)
        
        return { data: !error, error }
      },
      `updateLastActive(${userId})`
    )
  }

  /**
   * Search public profiles
   */
  async searchProfiles(
    query: string,
    options: PaginationOptions = {}
  ): Promise<DatabaseResult<UserProfileRow[]>> {
    return this.executeQuery(
      () => {
        const dbQuery = supabase
          .from('user_profiles')
          .select('*')
          .eq('is_public', true)
          .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)

        return this.applyPagination(dbQuery, options)
      },
      `searchProfiles(${query})`
    )
  }
}

/**
 * Companion Service
 */
export class CompanionService extends SupabaseService {
  /**
   * Get user's companions
   */
  async getUserCompanions(
    userId: string,
    options: PaginationOptions = {}
  ): Promise<DatabaseResult<CompanionRow[]>> {
    return this.executeQuery(
      () => {
        const query = supabase
          .from('companions')
          .select('*')
          .eq('user_id', userId)

        return this.applyPagination(query, {
          sortBy: 'created_at',
          sortOrder: 'desc',
          ...options
        })
      },
      `getUserCompanions(${userId})`
    )
  }

  /**
   * Get companion by ID
   */
  async getCompanion(companionId: string): Promise<DatabaseResult<CompanionRow>> {
    return this.executeQuery(
      () => supabase
        .from('companions')
        .select('*')
        .eq('id', companionId)
        .single(),
      `getCompanion(${companionId})`
    )
  }

  /**
   * Create new companion
   */
  async createCompanion(companion: CompanionInsert): Promise<DatabaseResult<CompanionRow>> {
    return this.executeQuery(
      () => supabase
        .from('companions')
        .insert({
          ...companion,
          // Default values
          personality_cheerful: companion.personality_cheerful ?? 0.5,
          personality_careful: companion.personality_careful ?? 0.5,
          personality_curious: companion.personality_curious ?? 0.5,
          personality_emotional: companion.personality_emotional ?? 0.5,
          personality_independent: companion.personality_independent ?? 0.5,
          personality_playful: companion.personality_playful ?? 0.5,
          personality_supportive: companion.personality_supportive ?? 0.5,
          relationship_level: companion.relationship_level ?? 1,
          relationship_experience: companion.relationship_experience ?? 0,
          relationship_experience_to_next: companion.relationship_experience_to_next ?? 100,
          intimacy_level: companion.intimacy_level ?? 0.1,
          trust_level: companion.trust_level ?? 0.1,
          current_emotion: companion.current_emotion ?? 'neutral',
          emotion_intensity: companion.emotion_intensity ?? 0.5,
          emotion_stability: companion.emotion_stability ?? 0.5,
          unlocked_features: companion.unlocked_features ?? ['basic_chat'],
          completed_events: companion.completed_events ?? [],
          available_events: companion.available_events ?? ['first_meeting'],
          relationship_milestones: companion.relationship_milestones ?? []
        })
        .select()
        .single(),
      `createCompanion(${companion.name})`
    )
  }

  /**
   * Update companion
   */
  async updateCompanion(companionId: string, updates: CompanionUpdate): Promise<DatabaseResult<CompanionRow>> {
    return this.executeQuery(
      () => supabase
        .from('companions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', companionId)
        .select()
        .single(),
      `updateCompanion(${companionId})`
    )
  }

  /**
   * Update relationship stats
   */
  async updateRelationshipStats(
    companionId: string,
    stats: {
      experienceGain?: number
      intimacyChange?: number
      trustChange?: number
      newEmotion?: string
      emotionIntensity?: number
    }
  ): Promise<DatabaseResult<CompanionRow>> {
    return this.executeQuery(
      async () => {
        // First get current companion data
        const { data: companion, error: getError } = await supabase
          .from('companions')
          .select('*')
          .eq('id', companionId)
          .single()

        if (getError) throw getError

        // Calculate new values
        const updates: CompanionUpdate = {}

        if (stats.experienceGain) {
          const newExp = companion.relationship_experience + stats.experienceGain
          let newLevel = companion.relationship_level
          let expToNext = companion.relationship_experience_to_next

          // Level up logic
          while (newExp >= expToNext && newLevel < 10) {
            newLevel++
            expToNext = Math.floor(expToNext * 1.2) // Increase required exp by 20%
          }

          updates.relationship_experience = newExp
          updates.relationship_level = newLevel
          updates.relationship_experience_to_next = expToNext
        }

        if (stats.intimacyChange) {
          updates.intimacy_level = Math.max(0, Math.min(1, 
            companion.intimacy_level + stats.intimacyChange
          ))
        }

        if (stats.trustChange) {
          updates.trust_level = Math.max(0, Math.min(1, 
            companion.trust_level + stats.trustChange
          ))
        }

        if (stats.newEmotion) {
          updates.current_emotion = stats.newEmotion
        }

        if (stats.emotionIntensity !== undefined) {
          updates.emotion_intensity = Math.max(0, Math.min(1, stats.emotionIntensity))
        }

        // Update companion
        return supabase
          .from('companions')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', companionId)
          .select()
          .single()
      },
      `updateRelationshipStats(${companionId})`
    )
  }

  /**
   * Delete companion
   */
  async deleteCompanion(companionId: string): Promise<DatabaseResult<boolean>> {
    return this.executeQuery(
      async () => {
        const { error } = await supabase
          .from('companions')
          .delete()
          .eq('id', companionId)
        
        return { data: !error, error }
      },
      `deleteCompanion(${companionId})`
    )
  }
}

/**
 * Game State Service
 */
export class GameStateService extends SupabaseService {
  /**
   * Get user's game state
   */
  async getGameState(userId: string): Promise<DatabaseResult<GameStateRow>> {
    return this.executeQuery(
      () => supabase
        .from('game_states')
        .select('*')
        .eq('user_id', userId)
        .single(),
      `getGameState(${userId})`
    )
  }

  /**
   * Create new game state
   */
  async createGameState(gameState: GameStateInsert): Promise<DatabaseResult<GameStateRow>> {
    return this.executeQuery(
      () => supabase
        .from('game_states')
        .insert({
          ...gameState,
          level: gameState.level ?? 1,
          experience: gameState.experience ?? 0,
          conversation_count: gameState.conversation_count ?? 0,
          days_since_start: gameState.days_since_start ?? 0,
          play_time: gameState.play_time ?? 0,
          current_scene: gameState.current_scene ?? 'home',
          unlocked_features: gameState.unlocked_features ?? ['basic_chat'],
          is_first_time: gameState.is_first_time ?? true,
          game_version: gameState.game_version ?? '1.0.0',
          last_played: new Date().toISOString()
        })
        .select()
        .single(),
      `createGameState(${gameState.user_id})`
    )
  }

  /**
   * Update game state
   */
  async updateGameState(userId: string, updates: GameStateUpdate): Promise<DatabaseResult<GameStateRow>> {
    return this.executeQuery(
      () => supabase
        .from('game_states')
        .update({
          ...updates,
          last_played: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single(),
      `updateGameState(${userId})`
    )
  }

  /**
   * Update play time
   */
  async updatePlayTime(userId: string, additionalSeconds: number): Promise<DatabaseResult<GameStateRow>> {
    return this.executeQuery(
      async () => {
        const { data: gameState, error: getError } = await supabase
          .from('game_states')
          .select('play_time')
          .eq('user_id', userId)
          .single()

        if (getError) throw getError

        return supabase
          .from('game_states')
          .update({
            play_time: gameState.play_time + additionalSeconds,
            last_played: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .select()
          .single()
      },
      `updatePlayTime(${userId})`
    )
  }

  /**
   * Increment conversation count
   */
  async incrementConversationCount(userId: string): Promise<DatabaseResult<GameStateRow>> {
    return this.executeQuery(
      async () => {
        const { data: gameState, error: getError } = await supabase
          .from('game_states')
          .select('conversation_count')
          .eq('user_id', userId)
          .single()

        if (getError) throw getError

        return supabase
          .from('game_states')
          .update({
            conversation_count: gameState.conversation_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .select()
          .single()
      },
      `incrementConversationCount(${userId})`
    )
  }
}

/**
 * Message Service
 */
export class MessageService extends SupabaseService {
  /**
   * Get conversation messages
   */
  async getConversationMessages(
    sessionId: string,
    options: PaginationOptions = {}
  ): Promise<DatabaseResult<MessageRow[]>> {
    return this.executeQuery(
      () => {
        const query = supabase
          .from('messages')
          .select('*')
          .eq('conversation_session_id', sessionId)

        return this.applyPagination(query, {
          sortBy: 'created_at',
          sortOrder: 'asc',
          ...options
        })
      },
      `getConversationMessages(${sessionId})`
    )
  }

  /**
   * Get user's recent messages
   */
  async getUserRecentMessages(
    userId: string,
    options: PaginationOptions = {}
  ): Promise<DatabaseResult<MessageRow[]>> {
    return this.executeQuery(
      () => {
        const query = supabase
          .from('messages')
          .select('*')
          .eq('user_id', userId)

        return this.applyPagination(query, {
          sortBy: 'created_at',
          sortOrder: 'desc',
          limit: 100,
          ...options
        })
      },
      `getUserRecentMessages(${userId})`
    )
  }

  /**
   * Save message
   */
  async saveMessage(message: MessageInsert): Promise<DatabaseResult<MessageRow>> {
    return this.executeQuery(
      () => supabase
        .from('messages')
        .insert({
          ...message,
          tokens_used: message.tokens_used ?? 0,
          is_cached: message.is_cached ?? false
        })
        .select()
        .single(),
      `saveMessage(${message.conversation_session_id})`
    )
  }

  /**
   * Bulk save messages
   */
  async saveMessages(messages: MessageInsert[]): Promise<DatabaseResult<MessageRow[]>> {
    return this.executeQuery(
      () => supabase
        .from('messages')
        .insert(messages)
        .select(),
      `saveMessages(${messages.length} messages)`
    )
  }

  /**
   * Get conversation statistics
   */
  async getConversationStats(userId: string): Promise<DatabaseResult<{
    totalMessages: number
    totalTokens: number
    averageResponseTime: number
    conversationsToday: number
  }>> {
    return this.executeQuery(
      async () => {
        const today = new Date().toISOString().split('T')[0]

        const { data: stats, error } = await supabase
          .from('messages')
          .select('tokens_used, processing_time, created_at')
          .eq('user_id', userId)

        if (error) throw error

        const totalMessages = stats.length
        const totalTokens = stats.reduce((sum, msg) => sum + (msg.tokens_used || 0), 0)
        const avgResponseTime = stats
          .filter(msg => msg.processing_time)
          .reduce((sum, msg, _, arr) => sum + (msg.processing_time! / arr.length), 0)
        
        const conversationsToday = stats.filter(msg => 
          msg.created_at.startsWith(today)
        ).length

        return {
          data: {
            totalMessages,
            totalTokens,
            averageResponseTime: Math.round(avgResponseTime),
            conversationsToday
          },
          error: null
        }
      },
      `getConversationStats(${userId})`
    )
  }
}

/**
 * User Settings Service
 */
export class UserSettingsService extends SupabaseService {
  /**
   * Get user settings
   */
  async getSettings(userId: string): Promise<DatabaseResult<UserSettingsRow>> {
    return this.executeQuery(
      () => supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single(),
      `getSettings(${userId})`
    )
  }

  /**
   * Create default settings
   */
  async createDefaultSettings(userId: string): Promise<DatabaseResult<UserSettingsRow>> {
    const defaultSettings: UserSettingsInsert = {
      user_id: userId,
      sound_enabled: true,
      music_enabled: true,
      animations_enabled: true,
      dark_mode: false,
      language: 'ko',
      notifications: true,
      auto_save: true,
      debug_mode: false,
      allow_analytics: true,
      allow_ai_learning: true,
      communication_style: 'friendly',
      preferred_topics: ['daily_life', 'hobbies', 'feelings'],
      content_filters: { adult_content: false, violence: false },
      custom_instructions: null
    }

    return this.executeQuery(
      () => supabase
        .from('user_settings')
        .insert(defaultSettings)
        .select()
        .single(),
      `createDefaultSettings(${userId})`
    )
  }

  /**
   * Update settings
   */
  async updateSettings(userId: string, updates: UserSettingsUpdate): Promise<DatabaseResult<UserSettingsRow>> {
    return this.executeQuery(
      () => supabase
        .from('user_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single(),
      `updateSettings(${userId})`
    )
  }
}

// Export service instances
export const userProfileService = UserProfileService.getInstance()
export const companionService = CompanionService.getInstance()
export const gameStateService = GameStateService.getInstance()
export const messageService = MessageService.getInstance()
export const userSettingsService = UserSettingsService.getInstance()

// Export main service class for extension
export { SupabaseService }