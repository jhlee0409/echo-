/**
 * Supabase React Hooks
 * Custom hooks for easy Supabase integration in React components
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  authService,
  userProfileService,
  companionService,
  gameStateService,
  messageService,
  userSettingsService,
  realtimeService,
  type AuthState,
  type UserProfile,
  type CompanionRow,
  type GameStateRow,
  type MessageRow,
  type UserSettingsRow,
  type DatabaseResult,
  type PaginationOptions
} from '@/services/database'
import type { User } from '@supabase/supabase-js'

/**
 * Auth Hook
 * Provides authentication state and methods
 */
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false,
    error: null
  })

  useEffect(() => {
    // Subscribe to auth changes
    const unsubscribe = authService.addAuthListener((state) => {
      setAuthState({
        ...state,
        isLoading: false
      })
    })

    // Get initial state
    const initialState = authService.getAuthState()
    setAuthState({
      ...initialState,
      isLoading: false
    })

    return unsubscribe
  }, [])

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const result = await authService.signUp({
        email,
        password,
        displayName
      })

      if (!result.success) {
        setAuthState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: result.error?.message || 'Sign up failed' 
        }))
        return { success: false, error: result.error }
      }

      return { success: true, user: result.user }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed'
      setAuthState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      return { success: false, error: { message: errorMessage } }
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const result = await authService.signIn({ email, password })

      if (!result.success) {
        setAuthState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: result.error?.message || 'Sign in failed' 
        }))
        return { success: false, error: result.error }
      }

      return { success: true, user: result.user }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed'
      setAuthState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      return { success: false, error: { message: errorMessage } }
    }
  }, [])

  const signOut = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const result = await authService.signOut()
      
      if (!result.success) {
        setAuthState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: result.error?.message || 'Sign out failed' 
        }))
      }
      
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed'
      setAuthState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      return { success: false, error: { message: errorMessage } }
    }
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    return authService.resetPassword(email)
  }, [])

  const hasCompletedOnboarding = useCallback(async () => {
    return authService.hasCompletedOnboarding()
  }, [])

  const completeOnboarding = useCallback(async () => {
    return authService.completeOnboarding()
  }, [])

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    resetPassword,
    hasCompletedOnboarding,
    completeOnboarding
  }
}

/**
 * User Profile Hook
 * Manages user profile data and operations
 */
export function useUserProfile(userId?: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProfile = useCallback(async (id?: string) => {
    const targetUserId = id || userId
    if (!targetUserId) return

    setLoading(true)
    setError(null)

    try {
      const result = await userProfileService.getProfile(targetUserId)
      
      if (result.success && result.data) {
        const profileData: UserProfile = {
          id: result.data.id,
          email: '', // This would come from auth
          displayName: result.data.display_name,
          username: result.data.username,
          avatarUrl: result.data.avatar_url,
          language: result.data.language,
          timezone: result.data.timezone,
          createdAt: result.data.created_at,
          lastActive: result.data.last_active,
          isPublic: result.data.is_public,
          allowAnalytics: result.data.allow_analytics
        }
        setProfile(profileData)
      } else {
        setError(result.error?.message || 'Failed to load profile')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [userId])

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!userId) return { success: false, error: 'No user ID' }

    setLoading(true)
    setError(null)

    try {
      const result = await userProfileService.updateProfile(userId, {
        display_name: updates.displayName,
        username: updates.username,
        avatar_url: updates.avatarUrl,
        language: updates.language,
        timezone: updates.timezone,
        is_public: updates.isPublic,
        allow_analytics: updates.allowAnalytics
      })

      if (result.success && result.data) {
        const updatedProfile: UserProfile = {
          id: result.data.id,
          email: profile?.email || '',
          displayName: result.data.display_name,
          username: result.data.username,
          avatarUrl: result.data.avatar_url,
          language: result.data.language,
          timezone: result.data.timezone,
          createdAt: result.data.created_at,
          lastActive: result.data.last_active,
          isPublic: result.data.is_public,
          allowAnalytics: result.data.allow_analytics
        }
        setProfile(updatedProfile)
        return { success: true, data: updatedProfile }
      } else {
        setError(result.error?.message || 'Failed to update profile')
        return { success: false, error: result.error }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile'
      setError(errorMessage)
      return { success: false, error: { message: errorMessage } }
    } finally {
      setLoading(false)
    }
  }, [userId, profile])

  useEffect(() => {
    if (userId) {
      loadProfile()
    }
  }, [userId, loadProfile])

  return {
    profile,
    loading,
    error,
    loadProfile,
    updateProfile,
    refresh: () => loadProfile()
  }
}

/**
 * Companions Hook
 * Manages user's companions
 */
export function useCompanions(userId?: string, options: PaginationOptions = {}) {
  const [companions, setCompanions] = useState<CompanionRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCompanions = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const result = await companionService.getUserCompanions(userId, options)
      
      if (result.success && result.data) {
        setCompanions(result.data)
      } else {
        setError(result.error?.message || 'Failed to load companions')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load companions')
    } finally {
      setLoading(false)
    }
  }, [userId, options])

  const createCompanion = useCallback(async (companionData: {
    name: string
    avatar_url?: string
    description?: string
  }) => {
    if (!userId) return { success: false, error: 'No user ID' }

    setLoading(true)
    setError(null)

    try {
      const result = await companionService.createCompanion({
        user_id: userId,
        ...companionData
      })

      if (result.success && result.data) {
        setCompanions(prev => [...prev, result.data!])
        return { success: true, data: result.data }
      } else {
        setError(result.error?.message || 'Failed to create companion')
        return { success: false, error: result.error }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create companion'
      setError(errorMessage)
      return { success: false, error: { message: errorMessage } }
    } finally {
      setLoading(false)
    }
  }, [userId])

  const updateCompanion = useCallback(async (companionId: string, updates: Partial<CompanionRow>) => {
    setLoading(true)
    setError(null)

    try {
      const result = await companionService.updateCompanion(companionId, updates)

      if (result.success && result.data) {
        setCompanions(prev => 
          prev.map(companion => 
            companion.id === companionId ? result.data! : companion
          )
        )
        return { success: true, data: result.data }
      } else {
        setError(result.error?.message || 'Failed to update companion')
        return { success: false, error: result.error }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update companion'
      setError(errorMessage)
      return { success: false, error: { message: errorMessage } }
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteCompanion = useCallback(async (companionId: string) => {
    setLoading(true)
    setError(null)

    try {
      const result = await companionService.deleteCompanion(companionId)

      if (result.success) {
        setCompanions(prev => prev.filter(companion => companion.id !== companionId))
        return { success: true }
      } else {
        setError(result.error?.message || 'Failed to delete companion')
        return { success: false, error: result.error }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete companion'
      setError(errorMessage)
      return { success: false, error: { message: errorMessage } }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (userId) {
      loadCompanions()
    }
  }, [userId, loadCompanions])

  // Set up realtime subscription for companions
  useEffect(() => {
    if (!userId) return

    const subscriptionId = realtimeService.subscribeToUserCompanions(
      userId,
      (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload
        
        setCompanions(prev => {
          switch (eventType) {
            case 'INSERT':
              return [...prev, newRecord as CompanionRow]
            case 'UPDATE':
              return prev.map(companion => 
                companion.id === newRecord.id ? newRecord as CompanionRow : companion
              )
            case 'DELETE':
              return prev.filter(companion => companion.id !== oldRecord.id)
            default:
              return prev
          }
        })
      }
    )

    return () => {
      realtimeService.unsubscribe(subscriptionId)
    }
  }, [userId])

  return {
    companions,
    loading,
    error,
    loadCompanions,
    createCompanion,
    updateCompanion,
    deleteCompanion,
    refresh: loadCompanions
  }
}

/**
 * Game State Hook
 * Manages user's game state
 */
export function useGameState(userId?: string) {
  const [gameState, setGameState] = useState<GameStateRow | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadGameState = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const result = await gameStateService.getGameState(userId)
      
      if (result.success && result.data) {
        setGameState(result.data)
      } else if (result.error?.code === 'PGRST116') {
        // No game state found, create default
        const createResult = await gameStateService.createGameState({
          user_id: userId,
          is_first_time: true
        })
        
        if (createResult.success && createResult.data) {
          setGameState(createResult.data)
        } else {
          setError(createResult.error?.message || 'Failed to create game state')
        }
      } else {
        setError(result.error?.message || 'Failed to load game state')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load game state')
    } finally {
      setLoading(false)
    }
  }, [userId])

  const updateGameState = useCallback(async (updates: Partial<GameStateRow>) => {
    if (!userId) return { success: false, error: 'No user ID' }

    try {
      const result = await gameStateService.updateGameState(userId, updates)

      if (result.success && result.data) {
        setGameState(result.data)
        return { success: true, data: result.data }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update game state'
      return { success: false, error: { message: errorMessage } }
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      loadGameState()
    }
  }, [userId, loadGameState])

  // Set up realtime subscription for game state
  useEffect(() => {
    if (!userId) return

    const subscriptionId = realtimeService.subscribeToGameState(
      userId,
      (payload) => {
        const { eventType, new: newRecord } = payload
        
        if (eventType === 'UPDATE' && newRecord) {
          setGameState(newRecord as GameStateRow)
        }
      }
    )

    return () => {
      realtimeService.unsubscribe(subscriptionId)
    }
  }, [userId])

  return {
    gameState,
    loading,
    error,
    updateGameState,
    refresh: loadGameState
  }
}

/**
 * Messages Hook
 * Manages conversation messages with realtime updates
 */
export function useMessages(conversationId?: string, options: PaginationOptions = {}) {
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadMessages = useCallback(async () => {
    if (!conversationId) return

    setLoading(true)
    setError(null)

    try {
      const result = await messageService.getConversationMessages(conversationId, options)
      
      if (result.success && result.data) {
        setMessages(result.data)
      } else {
        setError(result.error?.message || 'Failed to load messages')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }, [conversationId, options])

  useEffect(() => {
    if (conversationId) {
      loadMessages()
    }
  }, [conversationId, loadMessages])

  // Set up realtime subscription for new messages
  useEffect(() => {
    if (!conversationId) return

    const subscriptionId = realtimeService.subscribeToConversation(
      conversationId,
      (payload) => {
        const { eventType, new: newRecord } = payload
        
        if (eventType === 'INSERT' && newRecord) {
          setMessages(prev => [...prev, newRecord as MessageRow])
        } else if (eventType === 'UPDATE' && newRecord) {
          setMessages(prev => 
            prev.map(message => 
              message.id === newRecord.id ? newRecord as MessageRow : message
            )
          )
        }
      }
    )

    return () => {
      realtimeService.unsubscribe(subscriptionId)
    }
  }, [conversationId])

  return {
    messages,
    loading,
    error,
    refresh: loadMessages
  }
}

/**
 * User Settings Hook
 * Manages user settings
 */
export function useUserSettings(userId?: string) {
  const [settings, setSettings] = useState<UserSettingsRow | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSettings = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const result = await userSettingsService.getSettings(userId)
      
      if (result.success && result.data) {
        setSettings(result.data)
      } else if (result.error?.code === 'PGRST116') {
        // No settings found, create default
        const createResult = await userSettingsService.createDefaultSettings(userId)
        
        if (createResult.success && createResult.data) {
          setSettings(createResult.data)
        } else {
          setError(createResult.error?.message || 'Failed to create settings')
        }
      } else {
        setError(result.error?.message || 'Failed to load settings')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [userId])

  const updateSettings = useCallback(async (updates: Partial<UserSettingsRow>) => {
    if (!userId) return { success: false, error: 'No user ID' }

    setLoading(true)
    setError(null)

    try {
      const result = await userSettingsService.updateSettings(userId, updates)

      if (result.success && result.data) {
        setSettings(result.data)
        return { success: true, data: result.data }
      } else {
        setError(result.error?.message || 'Failed to update settings')
        return { success: false, error: result.error }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings'
      setError(errorMessage)
      return { success: false, error: { message: errorMessage } }
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      loadSettings()
    }
  }, [userId, loadSettings])

  return {
    settings,
    loading,
    error,
    updateSettings,
    refresh: loadSettings
  }
}

/**
 * Database Health Hook
 * Monitors database connection health
 */
export function useDatabaseHealth() {
  const [health, setHealth] = useState<{
    status: 'healthy' | 'unhealthy'
    services: {
      supabase: 'connected' | 'disconnected'
      auth: 'ready' | 'not_ready'
      realtime: 'connected' | 'connecting' | 'disconnected'
    }
    timestamp: string
  } | null>(null)
  const [checking, setChecking] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout>()

  const checkHealth = useCallback(async () => {
    setChecking(true)
    
    try {
      const { checkDatabaseHealth } = await import('@/services/database')
      const result = await checkDatabaseHealth()
      setHealth(result)
    } catch (error) {
      console.error('Health check failed:', error)
      setHealth({
        status: 'unhealthy',
        services: {
          supabase: 'disconnected',
          auth: 'not_ready',
          realtime: 'disconnected'
        },
        timestamp: new Date().toISOString()
      })
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    // Initial check
    checkHealth()

    // Check every 30 seconds
    intervalRef.current = setInterval(checkHealth, 30000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [checkHealth])

  return {
    health,
    checking,
    checkHealth
  }
}