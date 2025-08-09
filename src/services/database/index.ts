/**
 * Database Services Index
 * Central export point for all database-related services
 */

// Core Supabase client and types
export { 
  supabase, 
  auth, 
  getCurrentUser, 
  isAuthenticated,
  type Database,
  type UserProfileRow,
  type UserProfileInsert,
  type UserProfileUpdate,
  type CompanionRow,
  type CompanionInsert,
  type CompanionUpdate,
  type GameStateRow,
  type GameStateInsert,
  type GameStateUpdate,
  type MessageRow,
  type MessageInsert,
  type MessageUpdate,
  type UserSettingsRow,
  type UserSettingsInsert,
  type UserSettingsUpdate
} from '@/lib/supabase'

// Service layer
export {
  SupabaseService,
  UserProfileService,
  CompanionService,
  GameStateService,
  MessageService,
  UserSettingsService,
  userProfileService,
  companionService,
  gameStateService,
  messageService,
  userSettingsService,
  type DatabaseError,
  type DatabaseResult,
  type PaginationOptions,
  type QueryFilters
} from './SupabaseService'

// Realtime services
export {
  RealtimeService,
  RealtimeHook,
  useRealtime,
  realtimeService,
  type DatabaseEvent,
  type TableName,
  type RealtimeSubscription,
  type RealtimeOptions
} from './RealtimeService'

// Auth services
export {
  AuthService,
  authService,
  type AuthResult,
  type SignUpData,
  type SignInData,
  type UserProfile,
  type AuthState
} from '../auth/AuthService'

// Security validation
export {
  getSecurityValidator,
  validateAuthToken,
  validatePasswordStrength,
  validateSignInAttempt,
  sanitizeEmail,
  SecurityValidator
} from '../auth/SecurityValidator'

/**
 * Initialize all database services
 * Call this once during app startup
 */
export async function initializeDatabaseServices(): Promise<void> {
  try {
    console.log('🔧 Initializing database services...')

    // Initialize auth service first
    await authService.initialize()
    console.log('✅ Auth service initialized')

    // Initialize realtime service
    await realtimeService.initialize()
    console.log('✅ Realtime service initialized')

    console.log('🎉 All database services initialized successfully')
  } catch (error) {
    console.error('❌ Failed to initialize database services:', error)
    throw error
  }
}

/**
 * Cleanup all database services
 * Call this during app shutdown
 */
export async function cleanupDatabaseServices(): Promise<void> {
  try {
    console.log('🧹 Cleaning up database services...')

    await authService.cleanup()
    await realtimeService.shutdown()

    console.log('✅ Database services cleaned up successfully')
  } catch (error) {
    console.error('❌ Error cleaning up database services:', error)
  }
}

/**
 * Database service health check
 */
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy'
  services: {
    supabase: 'connected' | 'disconnected'
    auth: 'ready' | 'not_ready'
    realtime: 'connected' | 'connecting' | 'disconnected'
  }
  timestamp: string
}> {
  const timestamp = new Date().toISOString()

  try {
    // Check Supabase connection
    const { error: supabaseError } = await supabase.from('user_profiles').select('count').limit(1)
    const supabaseStatus = supabaseError ? 'disconnected' : 'connected'

    // Check auth service
    const authStatus = authService.isAuthenticated() ? 'ready' : 'not_ready'

    // Check realtime service
    const realtimeStatus = realtimeService.getConnectionStatus().toLowerCase() as 'connected' | 'connecting' | 'disconnected'

    const allHealthy = supabaseStatus === 'connected' && 
                      (authStatus === 'ready' || authStatus === 'not_ready') && // Auth can be not ready but service healthy
                      realtimeStatus !== 'disconnected'

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      services: {
        supabase: supabaseStatus,
        auth: authStatus,
        realtime: realtimeStatus
      },
      timestamp
    }
  } catch (error) {
    console.error('Database health check failed:', error)
    return {
      status: 'unhealthy',
      services: {
        supabase: 'disconnected',
        auth: 'not_ready',
        realtime: 'disconnected'
      },
      timestamp
    }
  }
}