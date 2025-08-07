import { supabase } from '../lib/supabase'
import type { 
  UserProfileRow, 
  CompanionInsert,
  CompanionUpdate,
  GameStateInsert,
  GameStateUpdate,
  MessageInsert,
  UserSettingsUpdate
} from '../lib/supabase'

// User Profile Service
export class UserProfileService {
  static async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return data
  }

  static async updateProfile(userId: string, updates: Partial<UserProfileRow>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user profile:', error)
      throw error
    }

    return data
  }

  static async updateLastActive(userId: string) {
    const { error } = await supabase
      .from('user_profiles')
      .update({ last_active: new Date().toISOString() })
      .eq('id', userId)

    if (error) {
      console.error('Error updating last active:', error)
    }
  }
}

// Companion Service
export class CompanionService {
  static async getCompanion(userId: string) {
    const { data, error } = await supabase
      .from('companions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching companion:', error)
      return null
    }

    return data
  }

  static async createCompanion(companionData: CompanionInsert) {
    const { data, error } = await supabase
      .from('companions')
      .insert(companionData)
      .select()
      .single()

    if (error) {
      console.error('Error creating companion:', error)
      throw error
    }

    return data
  }

  static async updateCompanion(companionId: string, updates: CompanionUpdate) {
    const { data, error } = await supabase
      .from('companions')
      .update(updates)
      .eq('id', companionId)
      .select()
      .single()

    if (error) {
      console.error('Error updating companion:', error)
      throw error
    }

    return data
  }

  static async createDefaultCompanion(userId: string) {
    const { data, error } = await supabase
      .rpc('create_default_companion', { user_id: userId })

    if (error) {
      console.error('Error creating default companion:', error)
      throw error
    }

    return data // Returns companion ID
  }

  static async updateRelationship(
    companionId: string, 
    interactionType: string, 
    userEmotion?: string
  ) {
    const { error } = await supabase
      .rpc('update_companion_relationship', {
        p_companion_id: companionId,
        p_interaction_type: interactionType,
        p_user_emotion: userEmotion
      })

    if (error) {
      console.error('Error updating companion relationship:', error)
      throw error
    }
  }
}

// Game State Service
export class GameStateService {
  static async getGameState(userId: string) {
    const { data, error } = await supabase
      .from('game_states')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching game state:', error)
      return null
    }

    return data
  }

  static async createGameState(gameStateData: GameStateInsert) {
    const { data, error } = await supabase
      .from('game_states')
      .insert(gameStateData)
      .select()
      .single()

    if (error) {
      console.error('Error creating game state:', error)
      throw error
    }

    return data
  }

  static async updateGameState(userId: string, updates: GameStateUpdate) {
    const { data, error } = await supabase
      .from('game_states')
      .update({
        ...updates,
        last_saved: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating game state:', error)
      throw error
    }

    return data
  }

  static async incrementConversationCount(userId: string) {
    // First get current values
    const currentState = await this.getGameState(userId)
    if (!currentState) {
      throw new Error('Game state not found')
    }

    const { data, error } = await supabase
      .from('game_states')
      .update({ 
        conversation_count: currentState.conversation_count + 1,
        experience: currentState.experience + 10
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error incrementing conversation count:', error)
      throw error
    }

    return data
  }
}

// Message Service
export class MessageService {
  static async getMessages(
    userId: string, 
    companionId: string, 
    limit = 50,
    offset = 0
  ) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .eq('companion_id', companionId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching messages:', error)
      return []
    }

    return data.reverse() // Return in chronological order
  }

  static async getMessagesBySession(sessionId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching session messages:', error)
      return []
    }

    return data
  }

  static async createMessage(messageData: MessageInsert) {
    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single()

    if (error) {
      console.error('Error creating message:', error)
      throw error
    }

    return data
  }

  static async createMessagePair(
    userMessage: MessageInsert,
    aiMessage: MessageInsert
  ) {
    const { data, error } = await supabase
      .from('messages')
      .insert([userMessage, aiMessage])
      .select()

    if (error) {
      console.error('Error creating message pair:', error)
      throw error
    }

    return data
  }

  static async getConversationStats(userId: string, companionId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('companion_id', companionId)

    if (error) {
      console.error('Error fetching conversation stats:', error)
      return { messageCount: 0 }
    }

    return { messageCount: data.length }
  }
}

// User Settings Service
export class UserSettingsService {
  static async getSettings(userId: string) {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching user settings:', error)
      return null
    }

    return data
  }

  static async updateSettings(userId: string, updates: UserSettingsUpdate) {
    const { data, error } = await supabase
      .from('user_settings')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user settings:', error)
      throw error
    }

    return data
  }

  static async createDefaultSettings(userId: string) {
    const { data, error } = await supabase
      .from('user_settings')
      .insert({ user_id: userId })
      .select()
      .single()

    if (error) {
      console.error('Error creating default settings:', error)
      throw error
    }

    return data
  }
}

// Combined service for common operations
export class GameDataService {
  /**
   * Initialize user data - create companion and game state for new user
   */
  static async initializeUser(userId: string) {
    try {
      // Check if user already has data
      const existingCompanion = await CompanionService.getCompanion(userId)
      if (existingCompanion) {
        return {
          companion: existingCompanion,
          gameState: await GameStateService.getGameState(userId),
          settings: await UserSettingsService.getSettings(userId)
        }
      }

      // Create default companion (this also creates game state via trigger)
      await CompanionService.createDefaultCompanion(userId)
      
      // Fetch the created data
      const companion = await CompanionService.getCompanion(userId)
      const gameState = await GameStateService.getGameState(userId)
      const settings = await UserSettingsService.getSettings(userId)

      return {
        companion,
        gameState,
        settings
      }
    } catch (error) {
      console.error('Error initializing user data:', error)
      throw error
    }
  }

  /**
   * Load all user game data
   */
  static async loadUserData(userId: string) {
    try {
      const [companion, gameState, settings] = await Promise.all([
        CompanionService.getCompanion(userId),
        GameStateService.getGameState(userId),
        UserSettingsService.getSettings(userId)
      ])

      return {
        companion,
        gameState,
        settings
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      throw error
    }
  }

  /**
   * Save game progress
   */
  static async saveGameProgress(userId: string, updates: {
    gameState?: GameStateUpdate
    companion?: CompanionUpdate
    settings?: UserSettingsUpdate
  }) {
    try {
      const promises = []

      if (updates.gameState) {
        promises.push(GameStateService.updateGameState(userId, updates.gameState))
      }

      if (updates.companion) {
        const companion = await CompanionService.getCompanion(userId)
        if (companion) {
          promises.push(CompanionService.updateCompanion(companion.id, updates.companion))
        }
      }

      if (updates.settings) {
        promises.push(UserSettingsService.updateSettings(userId, updates.settings))
      }

      await Promise.all(promises)

      // Update last active timestamp
      await UserProfileService.updateLastActive(userId)

    } catch (error) {
      console.error('Error saving game progress:', error)
      throw error
    }
  }

  /**
   * Get latest save for user
   */
  static async getLatestSave(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('game_saves')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error('❌ Failed to get latest save:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('❌ GameDataService.getLatestSave error:', error)
      return null
    }
  }

  /**
   * Create backup of save data
   */
  static async createBackup(userId: string, saveData: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('game_backups')
        .insert({
          user_id: userId,
          save_data: saveData,
          backup_type: 'auto',
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('❌ Failed to create backup:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('❌ GameDataService.createBackup error:', error)
      return false
    }
  }

  /**
   * Create new save
   */
  static async createSave(userId: string, saveData: any): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('game_saves')
        .insert({
          user_id: userId,
          save_data: saveData,
          version: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Failed to create save:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('❌ GameDataService.createSave error:', error)
      return null
    }
  }
}

// All services are exported via class declarations above