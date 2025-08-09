/**
 * AuthService Test Suite
 * Comprehensive tests for authentication service functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AuthService } from './AuthService'
import type { User, Session, AuthError } from '@supabase/supabase-js'

// Mock dependencies
const mockSupabaseAuth = {
  getSession: vi.fn(),
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  refreshSession: vi.fn(),
  onAuthStateChange: vi.fn()
}

const mockUserProfileService = {
  createProfile: vi.fn(),
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  updateLastActive: vi.fn()
}

const mockUserSettingsService = {
  createDefaultSettings: vi.fn()
}

const mockGameStateService = {
  createGameState: vi.fn(),
  getGameState: vi.fn(),
  updateGameState: vi.fn()
}

// Mock modules
vi.mock('@/lib/supabase', () => ({
  auth: mockSupabaseAuth
}))

vi.mock('@/services/database/SupabaseService', () => ({
  userProfileService: mockUserProfileService,
  userSettingsService: mockUserSettingsService,
  gameStateService: mockGameStateService
}))

vi.mock('@config/env', () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}))

// Mock data generators
const createMockUser = (overrides = {}): User => ({
  id: 'user-123',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
  email_confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {
    display_name: 'Test User'
  },
  aud: 'authenticated',
  role: 'authenticated',
  ...overrides
})

const createMockSession = (user?: User): Session => ({
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: user || createMockUser()
})

const createMockAuthError = (message: string, status?: number): AuthError => ({
  message,
  status: status || 400,
  name: 'AuthError'
})

const createMockUserProfile = () => ({
  id: 'user-123',
  username: 'testuser',
  display_name: 'Test User',
  avatar_url: null,
  language: 'ko',
  timezone: 'Asia/Seoul',
  created_at: new Date().toISOString(),
  last_active: new Date().toISOString(),
  is_public: false,
  allow_analytics: true
})

describe('AuthService', () => {
  let authService: AuthService

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Create new instance
    authService = new (class extends AuthService {
      static getInstance() {
        return new AuthService()
      }
    })()

    // Mock default responses
    mockSupabaseAuth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })
    mockSupabaseAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize successfully with no existing session', async () => {
      await authService.initialize()

      expect(mockSupabaseAuth.getSession).toHaveBeenCalled()
      expect(mockSupabaseAuth.onAuthStateChange).toHaveBeenCalled()
      expect(authService.isAuthenticated()).toBe(false)
    })

    it('should initialize successfully with existing session', async () => {
      const mockUser = createMockUser()
      const mockSession = createMockSession(mockUser)
      
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })
      mockUserProfileService.getProfile.mockResolvedValue({
        success: true,
        data: createMockUserProfile()
      })
      mockUserProfileService.updateLastActive.mockResolvedValue({
        success: true
      })

      await authService.initialize()

      expect(authService.isAuthenticated()).toBe(true)
      expect(authService.getCurrentUser()).toEqual(mockUser)
      expect(authService.getCurrentSession()).toEqual(mockSession)
    })

    it('should handle initialization errors gracefully', async () => {
      const error = new Error('Network error')
      mockSupabaseAuth.getSession.mockRejectedValue(error)

      await expect(authService.initialize()).rejects.toThrow('Network error')
    })
  })

  describe('Sign Up', () => {
    it('should sign up user successfully', async () => {
      const mockUser = createMockUser()
      const mockSession = createMockSession(mockUser)
      
      mockSupabaseAuth.signUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })
      mockUserProfileService.createProfile.mockResolvedValue({
        success: true,
        data: createMockUserProfile()
      })
      mockUserSettingsService.createDefaultSettings.mockResolvedValue({
        success: true
      })
      mockGameStateService.createGameState.mockResolvedValue({
        success: true
      })

      const signUpData = {
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
        username: 'testuser'
      }

      const result = await authService.signUp(signUpData)

      expect(result.success).toBe(true)
      expect(result.user).toEqual(mockUser)
      expect(result.session).toEqual(mockSession)
      expect(result.error).toBeNull()
      expect(mockSupabaseAuth.signUp).toHaveBeenCalledWith({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            display_name: signUpData.displayName,
            username: signUpData.username,
            language: 'ko',
            timezone: expect.any(String)
          }
        }
      })
    })

    it('should handle sign up errors', async () => {
      const error = createMockAuthError('Email already registered')
      
      mockSupabaseAuth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error
      })

      const result = await authService.signUp({
        email: 'test@example.com',
        password: 'password123'
      })

      expect(result.success).toBe(false)
      expect(result.user).toBeNull()
      expect(result.error).toEqual(error)
    })

    it('should handle profile creation failures gracefully', async () => {
      const mockUser = createMockUser()
      
      mockSupabaseAuth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null
      })
      mockUserProfileService.createProfile.mockResolvedValue({
        success: false,
        error: 'Profile creation failed'
      })

      const result = await authService.signUp({
        email: 'test@example.com',
        password: 'password123'
      })

      // Should still return success as auth succeeded
      expect(result.success).toBe(true)
      expect(result.user).toEqual(mockUser)
    })
  })

  describe('Sign In', () => {
    it('should sign in user successfully', async () => {
      const mockUser = createMockUser()
      const mockSession = createMockSession(mockUser)
      
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })
      mockUserProfileService.updateLastActive.mockResolvedValue({
        success: true
      })

      const signInData = {
        email: 'test@example.com',
        password: 'password123'
      }

      const result = await authService.signIn(signInData)

      expect(result.success).toBe(true)
      expect(result.user).toEqual(mockUser)
      expect(result.session).toEqual(mockSession)
      expect(result.error).toBeNull()
      expect(mockUserProfileService.updateLastActive).toHaveBeenCalledWith(mockUser.id)
    })

    it('should handle invalid credentials', async () => {
      const error = createMockAuthError('Invalid credentials', 401)
      
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error
      })

      const result = await authService.signIn({
        email: 'test@example.com',
        password: 'wrongpassword'
      })

      expect(result.success).toBe(false)
      expect(result.user).toBeNull()
      expect(result.error).toEqual(error)
    })
  })

  describe('Sign Out', () => {
    it('should sign out user successfully', async () => {
      mockSupabaseAuth.signOut.mockResolvedValue({ error: null })

      const result = await authService.signOut()

      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
      expect(mockSupabaseAuth.signOut).toHaveBeenCalled()
    })

    it('should handle sign out errors', async () => {
      const error = createMockAuthError('Sign out failed')
      mockSupabaseAuth.signOut.mockResolvedValue({ error })

      const result = await authService.signOut()

      expect(result.success).toBe(false)
      expect(result.error).toEqual(error)
    })
  })

  describe('Password Reset', () => {
    it('should send password reset email successfully', async () => {
      mockSupabaseAuth.resetPasswordForEmail.mockResolvedValue({ error: null })

      const result = await authService.resetPassword('test@example.com')

      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
      expect(mockSupabaseAuth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        { redirectTo: expect.stringContaining('/auth/reset-password') }
      )
    })

    it('should handle password reset errors', async () => {
      const error = createMockAuthError('Invalid email')
      mockSupabaseAuth.resetPasswordForEmail.mockResolvedValue({ error })

      const result = await authService.resetPassword('invalid@email')

      expect(result.success).toBe(false)
      expect(result.error).toEqual(error)
    })
  })

  describe('Password Update', () => {
    it('should update password successfully', async () => {
      mockSupabaseAuth.updateUser.mockResolvedValue({ error: null })

      const result = await authService.updatePassword('newpassword123')

      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
      expect(mockSupabaseAuth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123'
      })
    })

    it('should handle password update errors', async () => {
      const error = createMockAuthError('Password too weak')
      mockSupabaseAuth.updateUser.mockResolvedValue({ error })

      const result = await authService.updatePassword('weak')

      expect(result.success).toBe(false)
      expect(result.error).toEqual(error)
    })
  })

  describe('Email Update', () => {
    it('should update email successfully', async () => {
      mockSupabaseAuth.updateUser.mockResolvedValue({ error: null })

      const result = await authService.updateEmail('new@example.com')

      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
      expect(mockSupabaseAuth.updateUser).toHaveBeenCalledWith({
        email: 'new@example.com'
      })
    })

    it('should handle email update errors', async () => {
      const error = createMockAuthError('Email already taken')
      mockSupabaseAuth.updateUser.mockResolvedValue({ error })

      const result = await authService.updateEmail('taken@example.com')

      expect(result.success).toBe(false)
      expect(result.error).toEqual(error)
    })
  })

  describe('Session Management', () => {
    it('should refresh session successfully', async () => {
      const mockUser = createMockUser()
      const mockSession = createMockSession(mockUser)
      
      mockSupabaseAuth.refreshSession.mockResolvedValue({
        data: { session: mockSession, user: mockUser },
        error: null
      })
      mockUserProfileService.getProfile.mockResolvedValue({
        success: true,
        data: createMockUserProfile()
      })
      mockUserProfileService.updateLastActive.mockResolvedValue({
        success: true
      })

      const result = await authService.refreshSession()

      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
      expect(mockSupabaseAuth.refreshSession).toHaveBeenCalled()
    })

    it('should handle session refresh errors', async () => {
      const error = createMockAuthError('Session expired')
      mockSupabaseAuth.refreshSession.mockResolvedValue({
        data: { session: null, user: null },
        error
      })

      const result = await authService.refreshSession()

      expect(result.success).toBe(false)
      expect(result.error).toEqual(error)
    })
  })

  describe('Onboarding', () => {
    beforeEach(() => {
      // Set up authenticated user
      const mockUser = createMockUser()
      authService['currentUser'] = mockUser
    })

    it('should check onboarding completion status', async () => {
      mockGameStateService.getGameState.mockResolvedValue({
        success: true,
        data: { is_first_time: false }
      })

      const result = await authService.hasCompletedOnboarding()

      expect(result).toBe(true)
      expect(mockGameStateService.getGameState).toHaveBeenCalledWith('user-123')
    })

    it('should return false for first-time users', async () => {
      mockGameStateService.getGameState.mockResolvedValue({
        success: true,
        data: { is_first_time: true }
      })

      const result = await authService.hasCompletedOnboarding()

      expect(result).toBe(false)
    })

    it('should complete onboarding successfully', async () => {
      mockGameStateService.updateGameState.mockResolvedValue({
        success: true
      })

      const result = await authService.completeOnboarding()

      expect(result.success).toBe(true)
      expect(mockGameStateService.updateGameState).toHaveBeenCalledWith('user-123', {
        is_first_time: false
      })
    })
  })

  describe('Auth State Management', () => {
    it('should return correct auth state when not authenticated', () => {
      const state = authService.getAuthState()

      expect(state.isAuthenticated).toBe(false)
      expect(state.user).toBeNull()
      expect(state.session).toBeNull()
      expect(state.profile).toBeNull()
      expect(state.isLoading).toBe(false)
    })

    it('should manage auth listeners correctly', () => {
      const listener = vi.fn()
      const unsubscribe = authService.addAuthListener(listener)

      expect(typeof unsubscribe).toBe('function')

      // Trigger listener notification
      authService['notifyListeners']()
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        isAuthenticated: false
      }))

      // Test unsubscribe
      unsubscribe()
      authService['notifyListeners']()
      expect(listener).toHaveBeenCalledTimes(1) // Should not be called again
    })

    it('should handle listener errors gracefully', () => {
      const faultyListener = vi.fn().mockImplementation(() => {
        throw new Error('Listener error')
      })
      
      authService.addAuthListener(faultyListener)
      
      // Should not throw
      expect(() => authService['notifyListeners']()).not.toThrow()
    })
  })

  describe('Cleanup', () => {
    it('should cleanup resources correctly', async () => {
      // Set up some state
      authService['currentUser'] = createMockUser()
      authService['authListeners'] = [vi.fn()]

      await authService.cleanup()

      expect(authService['currentUser']).toBeNull()
      expect(authService['currentSession']).toBeNull()
      expect(authService['currentProfile']).toBeNull()
      expect(authService['authListeners']).toEqual([])
    })
  })
})