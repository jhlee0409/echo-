/**
 * Authentication Integration Test Suite
 * End-to-end integration tests for the complete authentication system
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/tests/utils/test-utils'
import { AuthGuard } from '../AuthGuard'
import { AuthModal } from '../AuthModal'
import { authService } from '@/services/auth/AuthService'

// Mock auth service
const mockAuthService = {
  initialize: vi.fn(),
  getAuthState: vi.fn(),
  addAuthListener: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  resetPassword: vi.fn()
}

vi.mock('@/services/auth/AuthService', () => ({
  authService: mockAuthService
}))

// Mock database services
vi.mock('@/services/database/SupabaseService', () => ({
  userProfileService: {
    createProfile: vi.fn(),
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    updateLastActive: vi.fn()
  },
  userSettingsService: {
    createDefaultSettings: vi.fn()
  },
  gameStateService: {
    createGameState: vi.fn(),
    getGameState: vi.fn(),
    updateGameState: vi.fn()
  }
}))

// Mock components
const ProtectedContent = () => <div>Welcome to the protected app!</div>
const PublicContent = () => <div>Public content available to everyone</div>

// Test component that combines AuthGuard and protected content
const TestApp: React.FC<{ requireAuth?: boolean }> = ({ requireAuth = true }) => (
  <AuthGuard requireAuth={requireAuth}>
    <ProtectedContent />
  </AuthGuard>
)

describe('Authentication Integration', () => {
  const createMockAuthState = (overrides = {}) => ({
    user: null,
    session: null,
    profile: null,
    isLoading: false,
    isAuthenticated: false,
    error: null,
    ...overrides
  })

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock implementations
    mockAuthService.initialize.mockResolvedValue(undefined)
    mockAuthService.getAuthState.mockReturnValue(createMockAuthState())
    mockAuthService.addAuthListener.mockReturnValue(() => {}) // unsubscribe function
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Complete Authentication Flow', () => {
    it('should handle complete sign-up to protected content flow', async () => {
      let authListener: (state: any) => void
      
      // Start unauthenticated
      mockAuthService.getAuthState.mockReturnValue(createMockAuthState({ isAuthenticated: false }))
      mockAuthService.addAuthListener.mockImplementation((callback) => {
        authListener = callback
        return () => {}
      })

      // Mock successful sign-up
      mockAuthService.signUp.mockResolvedValue({
        success: true,
        user: { id: 'new-user-123', email: 'newuser@example.com' },
        session: { access_token: 'token-123' },
        error: null
      })

      render(<TestApp />)

      // Should show login prompt initially
      await waitFor(() => {
        expect(screen.getByText('로그인이 필요합니다')).toBeInTheDocument()
      })

      // Click login button to open auth modal
      const loginButton = screen.getByText('로그인')
      fireEvent.click(loginButton)

      // Should show auth modal (mocked)
      await waitFor(() => {
        expect(screen.getByText(/Auth Modal/)).toBeInTheDocument()
      })

      // Simulate successful authentication by updating auth state
      const authenticatedState = createMockAuthState({
        isAuthenticated: true,
        user: { id: 'new-user-123', email: 'newuser@example.com' },
        session: { access_token: 'token-123' }
      })
      mockAuthService.getAuthState.mockReturnValue(authenticatedState)
      authListener!(authenticatedState)

      // Should now show protected content
      await waitFor(() => {
        expect(screen.getByText('Welcome to the protected app!')).toBeInTheDocument()
      })
    })

    it('should handle authentication errors gracefully', async () => {
      // Mock auth service initialization error
      const error = new Error('Network connection failed')
      mockAuthService.initialize.mockRejectedValue(error)

      render(<TestApp />)

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('인증 오류')).toBeInTheDocument()
        expect(screen.getByText('Authentication initialization failed')).toBeInTheDocument()
      })

      // Should provide recovery option
      expect(screen.getByText('페이지 새로고침')).toBeInTheDocument()
    })

    it('should handle session expiration and re-authentication', async () => {
      let authListener: (state: any) => void
      
      // Start authenticated
      const authenticatedState = createMockAuthState({
        isAuthenticated: true,
        user: { id: 'user-123', email: 'user@example.com' },
        session: { access_token: 'valid-token' }
      })
      mockAuthService.getAuthState.mockReturnValue(authenticatedState)
      mockAuthService.addAuthListener.mockImplementation((callback) => {
        authListener = callback
        return () => {}
      })

      render(<TestApp />)

      // Should show protected content initially
      await waitFor(() => {
        expect(screen.getByText('Welcome to the protected app!')).toBeInTheDocument()
      })

      // Simulate session expiration
      const expiredState = createMockAuthState({
        isAuthenticated: false,
        error: 'Session expired'
      })
      mockAuthService.getAuthState.mockReturnValue(expiredState)
      authListener!(expiredState)

      // Should redirect back to login
      await waitFor(() => {
        expect(screen.getByText('로그인이 필요합니다')).toBeInTheDocument()
      })
    })
  })

  describe('Public vs Protected Content', () => {
    it('should render public content without authentication', async () => {
      mockAuthService.getAuthState.mockReturnValue(createMockAuthState({ isAuthenticated: false }))

      render(
        <AuthGuard requireAuth={false}>
          <PublicContent />
        </AuthGuard>
      )

      await waitFor(() => {
        expect(screen.getByText('Public content available to everyone')).toBeInTheDocument()
      })
    })

    it('should require authentication for protected content', async () => {
      mockAuthService.getAuthState.mockReturnValue(createMockAuthState({ isAuthenticated: false }))

      render(<TestApp requireAuth={true} />)

      await waitFor(() => {
        expect(screen.getByText('로그인이 필요합니다')).toBeInTheDocument()
        expect(screen.queryByText('Welcome to the protected app!')).not.toBeInTheDocument()
      })
    })
  })

  describe('Auth State Persistence', () => {
    it('should maintain authentication state across component re-renders', async () => {
      const authenticatedState = createMockAuthState({
        isAuthenticated: true,
        user: { id: 'user-123', email: 'user@example.com' },
        profile: { displayName: 'Test User', language: 'ko' }
      })
      mockAuthService.getAuthState.mockReturnValue(authenticatedState)

      const { rerender } = render(<TestApp />)

      await waitFor(() => {
        expect(screen.getByText('Welcome to the protected app!')).toBeInTheDocument()
      })

      // Re-render component
      rerender(<TestApp />)

      // Should still show protected content
      expect(screen.getByText('Welcome to the protected app!')).toBeInTheDocument()
    })

    it('should handle auth service cleanup on unmount', () => {
      const unsubscribe = vi.fn()
      mockAuthService.addAuthListener.mockReturnValue(unsubscribe)
      mockAuthService.getAuthState.mockReturnValue(createMockAuthState({ isAuthenticated: true }))

      const { unmount } = render(<TestApp />)
      
      unmount()

      expect(unsubscribe).toHaveBeenCalled()
    })
  })

  describe('User Profile Integration', () => {
    it('should load user profile after successful authentication', async () => {
      let authListener: (state: any) => void
      
      mockAuthService.getAuthState.mockReturnValue(createMockAuthState({ isAuthenticated: false }))
      mockAuthService.addAuthListener.mockImplementation((callback) => {
        authListener = callback
        return () => {}
      })

      render(<TestApp />)

      // Simulate authentication with profile data
      const authenticatedState = createMockAuthState({
        isAuthenticated: true,
        user: { id: 'user-123', email: 'user@example.com' },
        profile: {
          id: 'user-123',
          email: 'user@example.com',
          displayName: 'Test User',
          username: 'testuser',
          language: 'ko',
          timezone: 'Asia/Seoul',
          isPublic: false,
          allowAnalytics: true
        }
      })
      mockAuthService.getAuthState.mockReturnValue(authenticatedState)
      authListener!(authenticatedState)

      await waitFor(() => {
        expect(screen.getByText('Welcome to the protected app!')).toBeInTheDocument()
      })
    })
  })

  describe('Error Recovery', () => {
    it('should allow recovery from temporary authentication failures', async () => {
      let authListener: (state: any) => void
      
      // Start with authentication error
      mockAuthService.getAuthState.mockReturnValue(createMockAuthState({
        error: 'Temporary network error',
        isLoading: false
      }))
      mockAuthService.addAuthListener.mockImplementation((callback) => {
        authListener = callback
        return () => {}
      })

      render(<TestApp />)

      // Should show error initially
      await waitFor(() => {
        expect(screen.getByText('인증 오류')).toBeInTheDocument()
      })

      // Simulate recovery
      const recoveredState = createMockAuthState({
        isAuthenticated: true,
        user: { id: 'user-123' },
        error: null
      })
      mockAuthService.getAuthState.mockReturnValue(recoveredState)
      authListener!(recoveredState)

      // Should now show protected content
      await waitFor(() => {
        expect(screen.getByText('Welcome to the protected app!')).toBeInTheDocument()
      })
    })
  })

  describe('Performance Considerations', () => {
    it('should not cause excessive re-renders during auth state changes', async () => {
      const renderCount = vi.fn()
      let authListener: (state: any) => void

      const TestComponent = () => {
        renderCount()
        return <ProtectedContent />
      }

      mockAuthService.addAuthListener.mockImplementation((callback) => {
        authListener = callback
        return () => {}
      })
      mockAuthService.getAuthState.mockReturnValue(createMockAuthState({ isAuthenticated: false }))

      render(
        <AuthGuard>
          <TestComponent />
        </AuthGuard>
      )

      // Initial render
      expect(renderCount).toHaveBeenCalledTimes(1)

      // Simulate authentication
      const authenticatedState = createMockAuthState({
        isAuthenticated: true,
        user: { id: 'user-123' }
      })
      mockAuthService.getAuthState.mockReturnValue(authenticatedState)
      authListener!(authenticatedState)

      await waitFor(() => {
        expect(screen.getByText('Welcome to the protected app!')).toBeInTheDocument()
      })

      // Should not have caused excessive re-renders
      expect(renderCount).toHaveBeenCalledTimes(2) // Initial + auth state change
    })
  })
})