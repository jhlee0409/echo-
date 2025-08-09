/**
 * Authentication Service
 * Handles user authentication, session management, and security
 */

import { supabase, auth } from '@/lib/supabase'
import { userProfileService, userSettingsService, gameStateService } from '@/services/database/SupabaseService'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import type { UserProfileInsert } from '@/lib/supabase'
import { log } from '@config/env'

export interface AuthResult {
  user: User | null
  session: Session | null
  error: AuthError | null
  success: boolean
}

export interface SignUpData {
  email: string
  password: string
  displayName?: string
  username?: string
  language?: string
  timezone?: string
}

export interface SignInData {
  email: string
  password: string
  rememberMe?: boolean
}

export interface UserProfile {
  id: string
  email: string
  displayName: string | null
  username: string | null
  avatarUrl: string | null
  language: string
  timezone: string
  createdAt: string
  lastActive: string
  isPublic: boolean
  allowAnalytics: boolean
}

export interface AuthState {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
}

/**
 * Authentication Service Class
 */
export class AuthService {
  private static instance: AuthService
  private currentUser: User | null = null
  private currentSession: Session | null = null
  private currentProfile: UserProfile | null = null
  private authListeners: Array<(state: AuthState) => void> = []

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  /**
   * Initialize auth service
   */
  async initialize(): Promise<void> {
    try {
      log.debug('Initializing auth service...')

      // Get initial session
      const { data: { session }, error } = await auth.getSession()
      
      if (error) {
        log.error('Error getting initial session:', error)
      } else if (session) {
        await this.handleSessionUpdate(session)
      }

      // Listen to auth changes
      auth.onAuthStateChange(async (event, session) => {
        log.debug('Auth state changed:', event)
        
        switch (event) {
          case 'SIGNED_IN':
            if (session) {
              await this.handleSessionUpdate(session)
            }
            break
          case 'SIGNED_OUT':
            await this.handleSignOut()
            break
          case 'TOKEN_REFRESHED':
            if (session) {
              await this.handleSessionUpdate(session)
            }
            break
          case 'PASSWORD_RECOVERY':
            log.info('Password recovery initiated')
            break
          case 'USER_UPDATED':
            if (session?.user) {
              await this.handleUserUpdate(session.user)
            }
            break
        }

        this.notifyListeners()
      })

      log.info('Auth service initialized successfully')
    } catch (error) {
      log.error('Failed to initialize auth service:', error)
      throw error
    }
  }

  /**
   * Sign up new user
   */
  async signUp(data: SignUpData): Promise<AuthResult> {
    try {
      log.debug('Attempting user registration:', data.email)

      const { data: authData, error } = await auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            display_name: data.displayName || null,
            username: data.username || null,
            language: data.language || 'ko',
            timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        }
      })

      if (error) {
        log.error('Sign up error:', error)
        return {
          user: null,
          session: null,
          error,
          success: false
        }
      }

      // Create user profile if user was created
      if (authData.user) {
        await this.createUserProfile(authData.user, data)
      }

      log.info('User registered successfully:', authData.user?.email)
      
      return {
        user: authData.user,
        session: authData.session,
        error: null,
        success: true
      }
    } catch (error) {
      log.error('Unexpected error during sign up:', error)
      return {
        user: null,
        session: null,
        error: error as AuthError,
        success: false
      }
    }
  }

  /**
   * Sign in user
   */
  async signIn(data: SignInData): Promise<AuthResult> {
    try {
      log.debug('Attempting user sign in:', data.email)

      const { data: authData, error } = await auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      if (error) {
        log.error('Sign in error:', error)
        return {
          user: null,
          session: null,
          error,
          success: false
        }
      }

      // Update last active timestamp
      if (authData.user) {
        await userProfileService.updateLastActive(authData.user.id)
      }

      log.info('User signed in successfully:', authData.user?.email)

      return {
        user: authData.user,
        session: authData.session,
        error: null,
        success: true
      }
    } catch (error) {
      log.error('Unexpected error during sign in:', error)
      return {
        user: null,
        session: null,
        error: error as AuthError,
        success: false
      }
    }
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<{ success: boolean; error: AuthError | null }> {
    try {
      log.debug('Attempting user sign out')

      const { error } = await auth.signOut()

      if (error) {
        log.error('Sign out error:', error)
        return { success: false, error }
      }

      log.info('User signed out successfully')
      return { success: true, error: null }
    } catch (error) {
      log.error('Unexpected error during sign out:', error)
      return { success: false, error: error as AuthError }
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<{ success: boolean; error: AuthError | null }> {
    try {
      log.debug('Sending password reset email:', email)

      const { error } = await auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        log.error('Password reset error:', error)
        return { success: false, error }
      }

      log.info('Password reset email sent successfully')
      return { success: true, error: null }
    } catch (error) {
      log.error('Unexpected error during password reset:', error)
      return { success: false, error: error as AuthError }
    }
  }

  /**
   * Update password
   */
  async updatePassword(newPassword: string): Promise<{ success: boolean; error: AuthError | null }> {
    try {
      log.debug('Updating user password')

      const { error } = await auth.updateUser({
        password: newPassword
      })

      if (error) {
        log.error('Password update error:', error)
        return { success: false, error }
      }

      log.info('Password updated successfully')
      return { success: true, error: null }
    } catch (error) {
      log.error('Unexpected error during password update:', error)
      return { success: false, error: error as AuthError }
    }
  }

  /**
   * Update user email
   */
  async updateEmail(newEmail: string): Promise<{ success: boolean; error: AuthError | null }> {
    try {
      log.debug('Updating user email:', newEmail)

      const { error } = await auth.updateUser({
        email: newEmail
      })

      if (error) {
        log.error('Email update error:', error)
        return { success: false, error }
      }

      log.info('Email update initiated (confirmation required)')
      return { success: true, error: null }
    } catch (error) {
      log.error('Unexpected error during email update:', error)
      return { success: false, error: error as AuthError }
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser
  }

  /**
   * Get current session
   */
  getCurrentSession(): Session | null {
    return this.currentSession
  }

  /**
   * Get current user profile
   */
  getCurrentProfile(): UserProfile | null {
    return this.currentProfile
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.currentUser && !!this.currentSession
  }

  /**
   * Get current auth state
   */
  getAuthState(): AuthState {
    return {
      user: this.currentUser,
      session: this.currentSession,
      profile: this.currentProfile,
      isLoading: false,
      isAuthenticated: this.isAuthenticated(),
      error: null
    }
  }

  /**
   * Add auth state listener
   */
  addAuthListener(callback: (state: AuthState) => void): () => void {
    this.authListeners.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.authListeners.indexOf(callback)
      if (index > -1) {
        this.authListeners.splice(index, 1)
      }
    }
  }

  /**
   * Refresh session
   */
  async refreshSession(): Promise<{ success: boolean; error: AuthError | null }> {
    try {
      log.debug('Refreshing user session')

      const { data, error } = await auth.refreshSession()

      if (error) {
        log.error('Session refresh error:', error)
        return { success: false, error }
      }

      if (data.session) {
        await this.handleSessionUpdate(data.session)
      }

      log.debug('Session refreshed successfully')
      return { success: true, error: null }
    } catch (error) {
      log.error('Unexpected error during session refresh:', error)
      return { success: false, error: error as AuthError }
    }
  }

  /**
   * Verify if user has completed onboarding
   */
  async hasCompletedOnboarding(): Promise<boolean> {
    if (!this.currentUser) return false

    try {
      const gameStateResult = await gameStateService.getGameState(this.currentUser.id)
      
      if (gameStateResult.success && gameStateResult.data) {
        return !gameStateResult.data.is_first_time
      }

      return false
    } catch (error) {
      log.error('Error checking onboarding status:', error)
      return false
    }
  }

  /**
   * Mark onboarding as completed
   */
  async completeOnboarding(): Promise<{ success: boolean; error: any }> {
    if (!this.currentUser) {
      return { success: false, error: 'User not authenticated' }
    }

    try {
      const result = await gameStateService.updateGameState(this.currentUser.id, {
        is_first_time: false
      })

      if (result.success) {
        log.info('Onboarding completed for user:', this.currentUser.id)
        return { success: true, error: null }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      log.error('Error completing onboarding:', error)
      return { success: false, error }
    }
  }

  /**
   * Handle session update
   */
  private async handleSessionUpdate(session: Session): Promise<void> {
    try {
      this.currentSession = session
      this.currentUser = session.user

      if (session.user) {
        // Load or create user profile
        await this.loadUserProfile(session.user.id)
        
        // Update last active timestamp
        await userProfileService.updateLastActive(session.user.id)
      }
    } catch (error) {
      log.error('Error handling session update:', error)
    }
  }

  /**
   * Handle user update
   */
  private async handleUserUpdate(user: User): Promise<void> {
    try {
      this.currentUser = user
      
      if (user) {
        await this.loadUserProfile(user.id)
      }
    } catch (error) {
      log.error('Error handling user update:', error)
    }
  }

  /**
   * Handle sign out
   */
  private async handleSignOut(): Promise<void> {
    this.currentUser = null
    this.currentSession = null
    this.currentProfile = null
    
    log.info('User session cleared')
  }

  /**
   * Create user profile after successful registration
   */
  private async createUserProfile(user: User, signUpData: SignUpData): Promise<void> {
    try {
      const profileData: UserProfileInsert = {
        id: user.id,
        username: signUpData.username || null,
        display_name: signUpData.displayName || null,
        language: signUpData.language || 'ko',
        timezone: signUpData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        is_public: false,
        allow_analytics: true
      }

      const profileResult = await userProfileService.createProfile(profileData)
      
      if (!profileResult.success) {
        log.error('Failed to create user profile:', profileResult.error)
        return
      }

      // Create default user settings
      const settingsResult = await userSettingsService.createDefaultSettings(user.id)
      
      if (!settingsResult.success) {
        log.error('Failed to create user settings:', settingsResult.error)
      }

      // Create initial game state
      const gameStateResult = await gameStateService.createGameState({
        user_id: user.id,
        is_first_time: true
      })

      if (!gameStateResult.success) {
        log.error('Failed to create game state:', gameStateResult.error)
      }

      log.info('User profile and initial data created successfully')
    } catch (error) {
      log.error('Error creating user profile:', error)
    }
  }

  /**
   * Load user profile
   */
  private async loadUserProfile(userId: string): Promise<void> {
    try {
      const result = await userProfileService.getProfile(userId)
      
      if (result.success && result.data) {
        this.currentProfile = {
          id: result.data.id,
          email: this.currentUser?.email || '',
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
      } else if (result.error?.code !== 'PGRST116') { // Not found error
        log.error('Error loading user profile:', result.error)
      }
    } catch (error) {
      log.error('Unexpected error loading user profile:', error)
    }
  }

  /**
   * Notify all auth listeners
   */
  private notifyListeners(): void {
    const state = this.getAuthState()
    this.authListeners.forEach(callback => {
      try {
        callback(state)
      } catch (error) {
        log.error('Error in auth listener:', error)
      }
    })
  }

  /**
   * Cleanup auth service
   */
  async cleanup(): Promise<void> {
    log.info('Cleaning up auth service...')
    this.authListeners = []
    this.currentUser = null
    this.currentSession = null
    this.currentProfile = null
  }
}

// Export singleton instance
export const authService = AuthService.getInstance()

// Export default
export default authService