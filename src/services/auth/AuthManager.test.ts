import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AuthManager } from './AuthManager'
import { supabase } from '@lib/supabase'
import { createMockUser } from '@/tests/utils/test-utils'
import type { SignUpRequest, SignInRequest } from './types'

// Mock EventEmitter
vi.mock('events', () => ({
  EventEmitter: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    removeAllListeners: vi.fn(),
  })),
}))

describe('AuthManager', () => {
  let authManager: AuthManager
  let mockAuthStateChange: any

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks()

    // Setup auth state change mock
    mockAuthStateChange = vi.fn()
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
      mockAuthStateChange.mockImplementation(callback)
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      }
    })

    authManager = new AuthManager()
  })

  afterEach(() => {
    authManager.destroy()
  })

  describe('Initialization', () => {
    it('should initialize with no user session', () => {
      expect(authManager.user).toBeNull()
      expect(authManager.session).toBeNull()
      expect(authManager.isAuthenticated).toBe(false)
    })

    it('should setup auth state listener on initialization', () => {
      expect(supabase.auth.onAuthStateChange).toHaveBeenCalled()
    })

    it('should load existing session on initialization', async () => {
      const mockSession = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        expires_at: Date.now() / 1000 + 3600,
        user: createMockUser(),
      }

      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      })

      // Create new instance to trigger initialization
      const newAuthManager = new AuthManager()
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(supabase.auth.getSession).toHaveBeenCalled()
    })
  })

  describe('Sign Up', () => {
    const signUpRequest: SignUpRequest = {
      email: 'newuser@example.com',
      password: 'TestPassword123!',
      display_name: '새 사용자',
      language: 'ko',
      timezone: 'Asia/Seoul',
    }

    it('should successfully sign up a new user', async () => {
      const mockUser = createMockUser({
        email: signUpRequest.email,
        user_metadata: {
          display_name: signUpRequest.display_name,
          language: signUpRequest.language,
          timezone: signUpRequest.timezone,
        },
      })

      vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
        data: {
          user: mockUser,
          session: {
            access_token: 'mock-token',
            refresh_token: 'mock-refresh',
            expires_at: Date.now() / 1000 + 3600,
            user: mockUser,
          },
        },
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
      } as any)

      const response = await authManager.signUp(signUpRequest)

      expect(response.error).toBeNull()
      expect(response.user).toBeDefined()
      expect(response.user?.email).toBe(signUpRequest.email)
      expect(response.requires_verification).toBe(false)

      // Verify user profile creation
      expect(supabase.from).toHaveBeenCalledWith('user_profiles')
    })

    it('should handle sign up errors', async () => {
      const mockError = {
        message: 'User already registered',
        status: 400,
      }

      vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: mockError,
      })

      const response = await authManager.signUp(signUpRequest)

      expect(response.error).toEqual(mockError)
      expect(response.user).toBeNull()
      expect(response.session).toBeNull()
    })

    it('should indicate email verification required when no session returned', async () => {
      const mockUser = createMockUser({ email: signUpRequest.email })

      vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
        data: {
          user: mockUser,
          session: null, // No session means email verification required
        },
        error: null,
      })

      const response = await authManager.signUp(signUpRequest)

      expect(response.requires_verification).toBe(true)
      expect(response.user).toBeDefined()
      expect(response.session).toBeNull()
    })
  })

  describe('Sign In', () => {
    const signInRequest: SignInRequest = {
      email: 'user@example.com',
      password: 'Password123!',
    }

    it('should successfully sign in a user', async () => {
      const mockUser = createMockUser({ email: signInRequest.email })
      const mockSession = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        expires_at: Date.now() / 1000 + 3600,
        user: mockUser,
      }

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: {
          user: mockUser,
          session: mockSession,
        },
        error: null,
      })

      const response = await authManager.signIn(signInRequest)

      expect(response.error).toBeNull()
      expect(response.user).toBeDefined()
      expect(response.session).toBeDefined()
      expect(response.user?.email).toBe(signInRequest.email)
    })

    it('should handle invalid credentials', async () => {
      const mockError = {
        message: 'Invalid login credentials',
        status: 400,
      }

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: mockError,
      })

      const response = await authManager.signIn(signInRequest)

      expect(response.error).toEqual(mockError)
      expect(response.user).toBeNull()
      expect(response.session).toBeNull()
    })
  })

  describe('Sign Out', () => {
    it('should successfully sign out user', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({
        error: null,
      })

      const response = await authManager.signOut()

      expect(response.error).toBeNull()
      expect(supabase.auth.signOut).toHaveBeenCalled()
    })

    it('should clear user data on sign out', async () => {
      // Set some user data first
      authManager['currentUser'] = createMockUser() as any
      authManager['currentSession'] = { access_token: 'token' } as any

      vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({
        error: null,
      })

      await authManager.signOut()

      expect(authManager.user).toBeNull()
      expect(authManager.session).toBeNull()
      expect(authManager.isAuthenticated).toBe(false)
    })
  })

  describe('OAuth Sign In', () => {
    it('should initiate OAuth sign in with Google', async () => {
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValueOnce({
        data: { provider: 'google', url: 'https://google.com/oauth' },
        error: null,
      })

      const response = await authManager.signInWithOAuth({
        provider: 'google',
        redirect_url: 'http://localhost:3000/auth/callback',
      })

      expect(response.error).toBeNull()
      expect(response.data).toBeDefined()
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback',
          scopes: undefined,
        },
      })
    })

    it('should handle OAuth errors', async () => {
      const mockError = {
        message: 'OAuth provider error',
        status: 500,
      }

      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValueOnce({
        data: null,
        error: mockError,
      })

      const response = await authManager.signInWithOAuth({
        provider: 'kakao',
      })

      expect(response.error).toEqual(mockError)
      expect(response.data).toBeNull()
    })
  })

  describe('Password Management', () => {
    it('should request password reset', async () => {
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValueOnce({
        data: {},
        error: null,
      })

      const response = await authManager.requestPasswordReset({
        email: 'user@example.com',
        redirect_url: 'http://localhost:3000/reset-password',
      })

      expect(response.error).toBeNull()
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'user@example.com',
        { redirectTo: 'http://localhost:3000/reset-password' }
      )
    })

    it('should update password', async () => {
      vi.mocked(supabase.auth.updateUser).mockResolvedValueOnce({
        data: { user: createMockUser() },
        error: null,
      })

      const response = await authManager.updatePassword({
        new_password: 'NewPassword123!',
      })

      expect(response.error).toBeNull()
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'NewPassword123!',
      })
    })
  })

  describe('Profile Management', () => {
    beforeEach(() => {
      authManager['currentUser'] = createMockUser() as any
    })

    it('should update user profile', async () => {
      vi.mocked(supabase.auth.updateUser).mockResolvedValueOnce({
        data: { user: createMockUser() },
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
      } as any)

      const profileUpdate = {
        display_name: '업데이트된 이름',
        language: 'en',
        timezone: 'America/New_York',
      }

      const response = await authManager.updateProfile(profileUpdate)

      expect(response.error).toBeNull()
      expect(supabase.auth.updateUser).toHaveBeenCalled()
      expect(supabase.from).toHaveBeenCalledWith('user_profiles')
    })

    it('should handle profile update when not authenticated', async () => {
      authManager['currentUser'] = null

      const response = await authManager.updateProfile({
        display_name: 'Test',
      })

      expect(response.error).toBeDefined()
      expect(response.error?.message).toContain('not authenticated')
    })
  })

  describe('Permissions and Features', () => {
    beforeEach(() => {
      authManager['gameContext'] = {
        user: createMockUser() as any,
        profile: {} as any,
        subscription: {} as any,
        permissions: ['read:profile', 'write:profile', 'read:companions'],
        companion_access: true,
        message_quota: {
          daily_used: 10,
          daily_limit: 50,
          monthly_used: 100,
          monthly_limit: 1500,
        },
        feature_flags: {
          voice_chat: false,
          custom_personality: true,
        },
      }
    })

    it('should check user permissions correctly', () => {
      expect(authManager.hasPermission('read:profile')).toBe(true)
      expect(authManager.hasPermission('admin:users')).toBe(false)
    })

    it('should check feature access correctly', () => {
      expect(authManager.canAccessFeature('voice_chat')).toBe(false)
      expect(authManager.canAccessFeature('custom_personality')).toBe(true)
      expect(authManager.canAccessFeature('unknown_feature')).toBe(false)
    })

    it('should calculate remaining message quota', () => {
      const quota = authManager.getMessageQuota()
      
      expect(quota.daily).toBe(40) // 50 - 10
      expect(quota.monthly).toBe(1400) // 1500 - 100
    })

    it('should return zero quota when no context', () => {
      authManager['gameContext'] = null
      
      const quota = authManager.getMessageQuota()
      
      expect(quota.daily).toBe(0)
      expect(quota.monthly).toBe(0)
    })
  })

  describe('Auth State Changes', () => {
    it('should handle SIGNED_IN event', async () => {
      const mockUser = createMockUser()
      const mockSession = {
        access_token: 'token',
        user: mockUser,
      }

      // Trigger auth state change
      await mockAuthStateChange('SIGNED_IN', mockSession)

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(authManager['emitAuthEvent']).toHaveBeenCalledWith('SIGNED_IN', {
        session_id: 'token',
      })
    })

    it('should handle SIGNED_OUT event', async () => {
      await mockAuthStateChange('SIGNED_OUT', null)
      
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(authManager['emitAuthEvent']).toHaveBeenCalledWith('SIGNED_OUT')
    })

    it('should handle TOKEN_REFRESHED event', async () => {
      const mockSession = {
        access_token: 'new-token',
        user: createMockUser(),
      }

      await mockAuthStateChange('TOKEN_REFRESHED', mockSession)
      
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(authManager['emitAuthEvent']).toHaveBeenCalledWith('TOKEN_REFRESHED', {
        session_id: 'new-token',
      })
    })
  })

  describe('Cleanup', () => {
    it('should cleanup resources on destroy', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
      authManager['refreshTimer'] = setTimeout(() => {}, 1000) as any

      authManager.destroy()

      expect(clearTimeoutSpy).toHaveBeenCalled()
      expect(authManager['removeAllListeners']).toHaveBeenCalled()
    })
  })
})