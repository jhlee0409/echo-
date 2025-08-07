import { createClient } from '@supabase/supabase-js'
import { ENV } from '../config/env'

// Database type definitions for Supabase
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfileRow
        Insert: UserProfileInsert
        Update: UserProfileUpdate
      }
      companions: {
        Row: CompanionRow
        Insert: CompanionInsert
        Update: CompanionUpdate
      }
      game_states: {
        Row: GameStateRow
        Insert: GameStateInsert
        Update: GameStateUpdate
      }
      messages: {
        Row: MessageRow
        Insert: MessageInsert
        Update: MessageUpdate
      }
      user_settings: {
        Row: UserSettingsRow
        Insert: UserSettingsInsert
        Update: UserSettingsUpdate
      }
    }
    Functions: {
      create_default_companion: {
        Args: { user_id: string }
        Returns: string
      }
      update_companion_relationship: {
        Args: {
          p_companion_id: string
          p_interaction_type: string
          p_user_emotion?: string
        }
        Returns: void
      }
    }
  }
}

// Database row types
export interface UserProfileRow {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  language: string
  timezone: string
  created_at: string
  updated_at: string
  last_active: string
  is_public: boolean
  allow_analytics: boolean
}

export interface UserProfileInsert {
  id: string
  username?: string | null
  display_name?: string | null
  avatar_url?: string | null
  language?: string
  timezone?: string
  is_public?: boolean
  allow_analytics?: boolean
}

export interface UserProfileUpdate {
  username?: string | null
  display_name?: string | null
  avatar_url?: string | null
  language?: string
  timezone?: string
  last_active?: string
  is_public?: boolean
  allow_analytics?: boolean
}

export interface CompanionRow {
  id: string
  user_id: string
  name: string
  avatar_url: string | null
  description: string | null
  
  // Personality traits
  personality_cheerful: number
  personality_careful: number
  personality_curious: number
  personality_emotional: number
  personality_independent: number
  personality_playful: number
  personality_supportive: number
  
  // Relationship
  relationship_level: number
  relationship_experience: number
  relationship_experience_to_next: number
  intimacy_level: number
  trust_level: number
  
  // Emotions
  current_emotion: string
  emotion_intensity: number
  emotion_stability: number
  
  // Progress
  unlocked_features: string[]
  completed_events: string[]
  available_events: string[]
  relationship_milestones: string[]
  
  created_at: string
  updated_at: string
}

export interface CompanionInsert {
  user_id: string
  name: string
  avatar_url?: string | null
  description?: string | null
  personality_cheerful?: number
  personality_careful?: number
  personality_curious?: number
  personality_emotional?: number
  personality_independent?: number
  personality_playful?: number
  personality_supportive?: number
  relationship_level?: number
  relationship_experience?: number
  relationship_experience_to_next?: number
  intimacy_level?: number
  trust_level?: number
  current_emotion?: string
  emotion_intensity?: number
  emotion_stability?: number
  unlocked_features?: string[]
  completed_events?: string[]
  available_events?: string[]
  relationship_milestones?: string[]
}

export interface CompanionUpdate {
  name?: string
  avatar_url?: string | null
  description?: string | null
  personality_cheerful?: number
  personality_careful?: number
  personality_curious?: number
  personality_emotional?: number
  personality_independent?: number
  personality_playful?: number
  personality_supportive?: number
  relationship_level?: number
  relationship_experience?: number
  relationship_experience_to_next?: number
  intimacy_level?: number
  trust_level?: number
  current_emotion?: string
  emotion_intensity?: number
  emotion_stability?: number
  unlocked_features?: string[]
  completed_events?: string[]
  available_events?: string[]
  relationship_milestones?: string[]
}

export interface GameStateRow {
  id: string
  user_id: string
  companion_id: string | null
  level: number
  experience: number
  conversation_count: number
  days_since_start: number
  play_time: number
  current_scene: string
  unlocked_features: string[]
  last_played: string
  last_saved: string | null
  is_first_time: boolean
  game_version: string
  created_at: string
  updated_at: string
}

export interface GameStateInsert {
  user_id: string
  companion_id?: string | null
  level?: number
  experience?: number
  conversation_count?: number
  days_since_start?: number
  play_time?: number
  current_scene?: string
  unlocked_features?: string[]
  is_first_time?: boolean
  game_version?: string
}

export interface GameStateUpdate {
  companion_id?: string | null
  level?: number
  experience?: number
  conversation_count?: number
  days_since_start?: number
  play_time?: number
  current_scene?: string
  unlocked_features?: string[]
  last_saved?: string | null
  is_first_time?: boolean
  game_version?: string
}

export interface MessageRow {
  id: string
  user_id: string
  companion_id: string
  conversation_session_id: string
  sender: 'user' | 'ai'
  content: string
  emotion: string | null
  tokens_used: number
  ai_provider: string | null
  processing_time: number | null
  is_cached: boolean
  context_data: any
  created_at: string
}

export interface MessageInsert {
  user_id: string
  companion_id: string
  conversation_session_id: string
  sender: 'user' | 'ai'
  content: string
  emotion?: string | null
  tokens_used?: number
  ai_provider?: string | null
  processing_time?: number | null
  is_cached?: boolean
  context_data?: any
}

export interface MessageUpdate {
  content?: string
  emotion?: string | null
  tokens_used?: number
  ai_provider?: string | null
  processing_time?: number | null
  is_cached?: boolean
  context_data?: any
}

export interface UserSettingsRow {
  user_id: string
  sound_enabled: boolean
  music_enabled: boolean
  animations_enabled: boolean
  dark_mode: boolean
  language: string
  notifications: boolean
  auto_save: boolean
  debug_mode: boolean
  allow_analytics: boolean
  allow_ai_learning: boolean
  communication_style: string
  preferred_topics: string[]
  content_filters: any
  custom_instructions: string | null
  created_at: string
  updated_at: string
}

export interface UserSettingsInsert {
  user_id: string
  sound_enabled?: boolean
  music_enabled?: boolean
  animations_enabled?: boolean
  dark_mode?: boolean
  language?: string
  notifications?: boolean
  auto_save?: boolean
  debug_mode?: boolean
  allow_analytics?: boolean
  allow_ai_learning?: boolean
  communication_style?: string
  preferred_topics?: string[]
  content_filters?: any
  custom_instructions?: string | null
}

export interface UserSettingsUpdate {
  sound_enabled?: boolean
  music_enabled?: boolean
  animations_enabled?: boolean
  dark_mode?: boolean
  language?: string
  notifications?: boolean
  auto_save?: boolean
  debug_mode?: boolean
  allow_analytics?: boolean
  allow_ai_learning?: boolean
  communication_style?: string
  preferred_topics?: string[]
  content_filters?: any
  custom_instructions?: string | null
}

// Create Supabase client
const supabaseUrl = ENV.SUPABASE_URL
const supabaseAnonKey = ENV.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application-name': 'soulmate-ai-companion'
    }
  }
})

// Auth helpers
export const auth = supabase.auth

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await auth.getUser()
  if (error) {
    console.error('Error getting current user:', error)
    return null
  }
  return user
}

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  const user = await getCurrentUser()
  return !!user
}

// Export supabase instance as default
export default supabase