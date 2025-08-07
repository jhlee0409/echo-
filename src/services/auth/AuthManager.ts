import {
  AuthUser,
  AuthSession,
  GameAuthContext,
  SignUpRequest,
  SignUpResponse,
  SignInRequest,
  SignInResponse,
  PasswordResetRequest,
  PasswordUpdateRequest,
  ProfileUpdateRequest,
  OAuthSignInRequest,
  AuthEvent,
  AuthEventPayload,
  SubscriptionLimits,
  Permission,
  UserRole,
  SubscriptionTier,
} from './types'
import { supabase, auth } from '@lib/supabase'
import { ENV } from '@config/env'
import type { Provider as SupabaseOAuthProvider } from '@supabase/supabase-js'

// 간단한 브라우저 호환 이벤트 emitter 구현 (Node 'events' 대체)
class SimpleEventEmitter {
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map()

  on(event: string, listener: (...args: any[]) => void) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    this.listeners.get(event)!.add(listener)
    return this
  }

  off(event: string, listener: (...args: any[]) => void) {
    this.listeners.get(event)?.delete(listener)
    return this
  }

  once(event: string, listener: (...args: any[]) => void) {
    const wrapper = (...args: any[]) => {
      this.off(event, wrapper)
      listener(...args)
    }
    return this.on(event, wrapper)
  }

  emit(event: string, ...args: any[]) {
    const set = this.listeners.get(event)
    if (!set) return false
    for (const listener of Array.from(set)) listener(...args)
    return true
  }

  removeAllListeners(event?: string) {
    if (event) {
      this.listeners.delete(event)
    } else {
      this.listeners.clear()
    }
    return this
  }
}

/**
 * Authentication Manager
 * Handles all authentication flows, user management, and security features
 */
export class AuthManager extends SimpleEventEmitter {
  private currentUser: AuthUser | null = null
  private currentSession: AuthSession | null = null
  private gameContext: GameAuthContext | null = null
  private refreshTimer: ReturnType<typeof setTimeout> | null = null

  // Role-based permissions mapping
  private readonly rolePermissions: Record<UserRole, Permission[]> = {
    user: [
      'read:profile',
      'write:profile',
      'read:companions',
      'write:companions',
      'read:messages',
      'write:messages',
    ],
    moderator: [
      'read:profile',
      'write:profile',
      'read:companions',
      'write:companions',
      'delete:companions',
      'read:messages',
      'write:messages',
      'delete:messages',
    ],
    admin: [
      'read:profile',
      'write:profile',
      'read:companions',
      'write:companions',
      'delete:companions',
      'read:messages',
      'write:messages',
      'delete:messages',
      'admin:users',
      'admin:analytics',
    ],
    developer: [
      'read:profile',
      'write:profile',
      'read:companions',
      'write:companions',
      'delete:companions',
      'read:messages',
      'write:messages',
      'delete:messages',
      'admin:users',
      'admin:analytics',
      'admin:system',
    ],
  }

  // Subscription tier limits
  private readonly subscriptionLimits: Record<
    SubscriptionTier,
    SubscriptionLimits
  > = {
    free: {
      maxCompanions: 1,
      maxDailyMessages: 50,
      maxStoredMessages: 1000,
      aiProviderAccess: ['mock'],
      premiumFeatures: [],
    },
    premium: {
      maxCompanions: 3,
      maxDailyMessages: 200,
      maxStoredMessages: 10000,
      aiProviderAccess: ['mock', 'claude'],
      premiumFeatures: ['voice_chat', 'custom_personality'],
    },
    pro: {
      maxCompanions: 10,
      maxDailyMessages: 500,
      maxStoredMessages: 50000,
      aiProviderAccess: ['mock', 'claude'],
      premiumFeatures: [
        'voice_chat',
        'custom_personality',
        'advanced_emotions',
        'custom_avatar',
      ],
    },
    enterprise: {
      maxCompanions: -1, // unlimited
      maxDailyMessages: -1, // unlimited
      maxStoredMessages: -1, // unlimited
      aiProviderAccess: ['mock', 'claude'],
      premiumFeatures: ['all'],
    },
  }

  constructor() {
    super()
    this.setupAuthStateListener()
    this.initializeSession()
  }

  /**
   * Initialize authentication session
   */
  private async initializeSession() {
    try {
      const {
        data: { session },
        error,
      } = await auth.getSession()

      if (error) {
        console.error('❌ Error initializing session:', error)
        this.emitAuthEvent('SESSION_EXPIRED')
        return
      }

      if (session) {
        await this.handleSessionUpdate(session as unknown as AuthSession)
      } else {
        console.log('ℹ️ No active session found')
      }
    } catch (error) {
      console.error('❌ Failed to initialize session:', error)
    }
  }

  /**
   * Setup auth state change listener
   */
  private setupAuthStateListener() {
    auth.onAuthStateChange(async (event, session) => {
      console.log(`🔑 Auth state changed: ${event}`)

      switch (event) {
        case 'SIGNED_IN':
          if (session) {
            await this.handleSessionUpdate(session as unknown as AuthSession)
            this.emitAuthEvent('SIGNED_IN', {
              session_id: session.access_token,
            })
          }
          break
        case 'SIGNED_OUT':
          await this.handleSignOut()
          this.emitAuthEvent('SIGNED_OUT')
          break
        case 'TOKEN_REFRESHED':
          if (session) {
            await this.handleSessionUpdate(session as unknown as AuthSession)
            this.emitAuthEvent('TOKEN_REFRESHED', {
              session_id: session.access_token,
            })
          }
          break
        case 'USER_UPDATED':
          if (session) {
            await this.updateGameContext(session.user as AuthUser)
            this.emitAuthEvent('USER_UPDATED', { user_id: session.user.id })
          }
          break
        case 'PASSWORD_RECOVERY':
          this.emitAuthEvent('PASSWORD_RECOVERY')
          break
      }
    })
  }

  /**
   * Handle session update
   */
  private async handleSessionUpdate(session: AuthSession) {
    this.currentSession = session
    this.currentUser = session.user as AuthUser

    // Setup token refresh timer
    this.setupTokenRefresh(session)

    // Load game context
    await this.updateGameContext(this.currentUser)
  }

  /**
   * Setup automatic token refresh
   */
  private setupTokenRefresh(session: AuthSession) {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
    }

    // Refresh token 5 minutes before expiry
    const expiresAt = session.expires_at! * 1000
    const refreshAt = expiresAt - 5 * 60 * 1000
    const now = Date.now()

    if (refreshAt > now) {
      this.refreshTimer = setTimeout(async () => {
        try {
          const { error } = await auth.refreshSession()
          if (error) {
            console.error('❌ Token refresh failed:', error)
            this.emitAuthEvent('SESSION_EXPIRED')
          }
        } catch (error) {
          console.error('❌ Token refresh error:', error)
        }
      }, refreshAt - now)
    }
  }

  /**
   * Update game authentication context
   */
  private async updateGameContext(user: AuthUser) {
    try {
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('❌ Failed to load user profile:', profileError)
        return
      }

      // Get user permissions based on role
      const role = (profile.role || 'user') as UserRole
      const permissions =
        this.rolePermissions[role] || this.rolePermissions.user

      // Get subscription limits
      const subscriptionTier = (profile.subscription_tier ||
        'free') as SubscriptionTier
      const subscriptionLimits = this.subscriptionLimits[subscriptionTier]

      // Calculate message quota
      const messageQuota = await this.calculateMessageQuota(
        user.id,
        subscriptionLimits
      )

      // Build game context
      this.gameContext = {
        user,
        profile,
        subscription: subscriptionLimits,
        permissions,
        companion_access: permissions.includes('read:companions'),
        message_quota: messageQuota,
        feature_flags: await this.getFeatureFlags(user.id, subscriptionTier),
      }

      console.log('✅ Game context updated:', {
        user_id: user.id,
        role,
        subscription: subscriptionTier,
        permissions: permissions.length,
      })
    } catch (error) {
      console.error('❌ Failed to update game context:', error)
    }
  }

  /**
   * Calculate user's message quota
   */
  private async calculateMessageQuota(
    userId: string,
    limits: SubscriptionLimits
  ) {
    const today = new Date().toISOString().split('T')[0]
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    ).toISOString()

    const { count: dailyCount } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', `${today}T00:00:00Z`)

    const { count: monthlyCount } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth)

    return {
      daily_used: dailyCount || 0,
      daily_limit: limits.maxDailyMessages,
      monthly_used: monthlyCount || 0,
      monthly_limit: limits.maxDailyMessages * 30, // Approximate monthly limit
    }
  }

  /**
   * Get feature flags for user
   */
  private async getFeatureFlags(
    userId: string,
    tier: SubscriptionTier
  ): Promise<Record<string, boolean>> {
    const limits = this.subscriptionLimits[tier]

    return {
      voice_chat:
        limits.premiumFeatures.includes('voice_chat') ||
        limits.premiumFeatures.includes('all'),
      custom_personality:
        limits.premiumFeatures.includes('custom_personality') ||
        limits.premiumFeatures.includes('all'),
      advanced_emotions:
        limits.premiumFeatures.includes('advanced_emotions') ||
        limits.premiumFeatures.includes('all'),
      custom_avatar:
        limits.premiumFeatures.includes('custom_avatar') ||
        limits.premiumFeatures.includes('all'),
      analytics: ENV.ENABLE_ANALYTICS,
      debug_mode: ENV.ENABLE_DEBUG_MODE,
    }
  }

  /**
   * User Sign Up
   */
  async signUp(request: SignUpRequest): Promise<SignUpResponse> {
    try {
      console.log('📝 Attempting user sign up:', { email: request.email })

      const { data, error } = await auth.signUp({
        email: request.email,
        password: request.password,
        options: {
          data: {
            display_name: request.display_name || '',
            language: request.language || 'ko',
            timezone: request.timezone || 'Asia/Seoul',
          },
        },
      })

      if (error) {
        return {
          user: null,
          session: null,
          error,
          requires_verification: false,
        }
      }

      // Create user profile
      if (data.user) {
        await this.createUserProfile(data.user, request)
      }

      return {
        user: data.user as AuthUser,
        session: data.session as AuthSession,
        error: null,
        requires_verification: !data.session, // If no session, email verification required
      }
    } catch (error) {
      console.error('❌ Sign up error:', error)
      return {
        user: null,
        session: null,
        error: error as any,
        requires_verification: false,
      }
    }
  }

  /**
   * User Sign In
   */
  async signIn(request: SignInRequest): Promise<SignInResponse> {
    try {
      console.log('🔑 Attempting user sign in:', { email: request.email })

      const { data, error } = await auth.signInWithPassword({
        email: request.email,
        password: request.password,
      })

      if (error) {
        // Log failed attempt
        await this.logLoginAttempt(request.email, false, error.message)

        return {
          user: null,
          session: null,
          error,
          requires_mfa: false,
        }
      }

      // Log successful attempt
      await this.logLoginAttempt(request.email, true)

      return {
        user: data.user as AuthUser,
        session: data.session as AuthSession,
        error: null,
        requires_mfa: false, // TODO: Implement MFA detection
      }
    } catch (error) {
      console.error('❌ Sign in error:', error)
      return {
        user: null,
        session: null,
        error: error as any,
        requires_mfa: false,
      }
    }
  }

  /**
   * OAuth Sign In
   */
  async signInWithOAuth(
    request: OAuthSignInRequest
  ): Promise<{ data: any; error: any }> {
    try {
      console.log(`🔑 Attempting OAuth sign in with ${request.provider}`)

      const { data, error } = await auth.signInWithOAuth({
        provider: request.provider as unknown as SupabaseOAuthProvider,
        options: {
          redirectTo: request.redirect_url,
          scopes: request.scopes?.join(' '),
        },
      })

      if (error) {
        console.error(`❌ OAuth sign in failed for ${request.provider}:`, error)
      }

      return { data, error }
    } catch (error) {
      console.error('❌ OAuth sign in error:', error)
      return { data: null, error }
    }
  }

  /**
   * Sign Out
   */
  async signOut(): Promise<{ error: any }> {
    try {
      console.log('👋 Signing out user')

      const { error } = await auth.signOut()

      if (!error) {
        await this.handleSignOut()
      }

      return { error }
    } catch (error) {
      console.error('❌ Sign out error:', error)
      return { error }
    }
  }

  /**
   * Handle sign out cleanup
   */
  private async handleSignOut() {
    this.currentUser = null
    this.currentSession = null
    this.gameContext = null

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }

    // Clear any cached data
    localStorage.removeItem('game_state')
    sessionStorage.clear()
  }

  /**
   * Password Reset Request
   */
  async requestPasswordReset(
    request: PasswordResetRequest
  ): Promise<{ error: any }> {
    try {
      console.log('🔑 Requesting password reset for:', request.email)

      const { error } = await auth.resetPasswordForEmail(request.email, {
        redirectTo: request.redirect_url,
      })

      if (error) {
        console.error('❌ Password reset request failed:', error)
      } else {
        this.emitAuthEvent('PASSWORD_RECOVERY', { email: request.email })
      }

      return { error }
    } catch (error) {
      console.error('❌ Password reset error:', error)
      return { error }
    }
  }

  /**
   * Update Password
   */
  async updatePassword(
    request: PasswordUpdateRequest
  ): Promise<{ error: any }> {
    try {
      console.log('🔑 Updating user password')

      const { error } = await auth.updateUser({
        password: request.new_password,
      })

      if (error) {
        console.error('❌ Password update failed:', error)
      } else {
        console.log('✅ Password updated successfully')
      }

      return { error }
    } catch (error) {
      console.error('❌ Password update error:', error)
      return { error }
    }
  }

  /**
   * Update User Profile
   */
  async updateProfile(request: ProfileUpdateRequest): Promise<{ error: any }> {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated')
      }

      console.log('👤 Updating user profile')

      // Update auth metadata
      const { error: authError } = await auth.updateUser({
        data: {
          display_name: request.display_name,
          avatar_url: request.avatar_url,
          language: request.language,
          timezone: request.timezone,
        },
      })

      if (authError) {
        return { error: authError }
      }

      // Update profile table
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          username: request.username,
          display_name: request.display_name,
          avatar_url: request.avatar_url,
          language: request.language,
          timezone: request.timezone,
          is_public: request.is_public,
          allow_analytics: request.allow_analytics,
          updated_at: new Date().toISOString(),
        })
        .eq('id', this.currentUser.id)

      if (profileError) {
        console.error('❌ Profile update failed:', profileError)
        return { error: profileError }
      }

      console.log('✅ Profile updated successfully')
      return { error: null }
    } catch (error) {
      console.error('❌ Profile update error:', error)
      return { error }
    }
  }

  /**
   * Create user profile after registration
   */
  private async createUserProfile(user: any, request: SignUpRequest) {
    try {
      const { error } = await supabase.from('user_profiles').insert({
        id: user.id,
        username: null,
        display_name: request.display_name || null,
        avatar_url: null,
        language: request.language || 'ko',
        timezone: request.timezone || 'Asia/Seoul',
        is_public: false,
        allow_analytics: false,
      })

      if (error) {
        console.error('❌ Failed to create user profile:', error)
      } else {
        console.log('✅ User profile created')
      }
    } catch (error) {
      console.error('❌ Create profile error:', error)
    }
  }

  /**
   * Log login attempts for security
   */
  private async logLoginAttempt(
    email: string,
    success: boolean,
    reason?: string
  ) {
    try {
      // In a real app, you'd want to capture IP, user agent, etc.
      const attempt = {
        email,
        success,
        failure_reason: reason || null,
        attempted_at: new Date().toISOString(),
        ip_address: 'unknown', // Would get from request in server
        user_agent: navigator.userAgent,
      }

      // Store in analytics or security table
      console.log('🔐 Login attempt:', attempt)
    } catch (error) {
      console.error('❌ Failed to log login attempt:', error)
    }
  }

  /**
   * Emit authentication events
   */
  private emitAuthEvent(event: AuthEvent, metadata?: Record<string, any>) {
    const payload: AuthEventPayload = {
      event,
      user_id: this.currentUser?.id,
      session_id: this.currentSession?.access_token,
      timestamp: new Date().toISOString(),
      metadata,
    }

    this.emit('auth_event', payload)
  }

  // Getters
  get user(): AuthUser | null {
    return this.currentUser
  }

  get session(): AuthSession | null {
    return this.currentSession
  }

  get context(): GameAuthContext | null {
    return this.gameContext
  }

  get isAuthenticated(): boolean {
    return !!(this.currentUser && this.currentSession)
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: Permission): boolean {
    return this.gameContext?.permissions.includes(permission) || false
  }

  /**
   * Check if user can access feature
   */
  canAccessFeature(feature: string): boolean {
    return this.gameContext?.feature_flags[feature] || false
  }

  /**
   * Get remaining message quota
   */
  getMessageQuota(): { daily: number; monthly: number } {
    if (!this.gameContext) return { daily: 0, monthly: 0 }

    const { daily_limit, daily_used, monthly_limit, monthly_used } =
      this.gameContext.message_quota

    return {
      daily: Math.max(0, daily_limit - daily_used),
      monthly: Math.max(0, monthly_limit - monthly_used),
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
    }
    this.removeAllListeners()
  }
}

// Export singleton instance
let authManagerInstance: AuthManager | null = null

export const getAuthManager = (): AuthManager => {
  if (!authManagerInstance) {
    authManagerInstance = new AuthManager()
  }
  return authManagerInstance
}

export default AuthManager
