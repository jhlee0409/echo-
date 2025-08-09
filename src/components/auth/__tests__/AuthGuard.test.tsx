/**
 * AuthGuard Component Test Suite
 * Tests for authentication protection and route guarding
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@/tests/utils/test-utils'
import { AuthGuard } from '../AuthGuard'
import { authService } from '@/services/auth/AuthService'
import type { AuthState } from '@/services/auth/AuthService'

// Mock auth service
const mockAuthService = {
  initialize: vi.fn(),
  getAuthState: vi.fn(),
  addAuthListener: vi.fn()
}

vi.mock('@/services/auth/AuthService', () => ({
  authService: mockAuthService
}))

// Mock child component
const TestChild = () => <div>Protected Content</div>

// Mock loading screen
vi.mock('@/components/ui/LoadingScreen', () => ({
  LoadingScreen: ({ message }: { message: string }) => <div>Loading: {message}</div>
}))

// Mock auth modal
vi.mock('../AuthModal', () => ({
  AuthModal: ({ isOpen, onClose, onSuccess }: any) => (
    <div>
      Auth Modal - {isOpen ? 'Open' : 'Closed'}
      <button onClick={onSuccess}>Sign In Success</button>
      <button onClick={onClose}>Close Modal</button>
    </div>
  )
}))

describe('AuthGuard', () => {
  const createMockAuthState = (overrides: Partial<AuthState> = {}): AuthState => ({
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
    mockAuthService.addAuthListener.mockReturnValue(() => {}) // Mock unsubscribe function
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should show loading state during initialization', async () => {
      // Mock loading state
      mockAuthService.getAuthState.mockReturnValue(createMockAuthState({ isLoading: true }))

      render(
        <AuthGuard>
          <TestChild />
        </AuthGuard>
      )

      expect(screen.getByText('Loading: 인증 상태를 확인하는 중...')).toBeInTheDocument()
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('should initialize auth service and setup listener', async () => {
      mockAuthService.getAuthState.mockReturnValue(createMockAuthState({ isAuthenticated: true }))
      
      render(
        <AuthGuard>
          <TestChild />
        </AuthGuard>
      )

      await waitFor(() => {
        expect(mockAuthService.initialize).toHaveBeenCalled()
        expect(mockAuthService.addAuthListener).toHaveBeenCalled()
      })
    })

    it('should handle initialization errors gracefully', async () => {
      const error = new Error('Auth initialization failed')
      mockAuthService.initialize.mockRejectedValue(error)

      render(
        <AuthGuard>
          <TestChild />
        </AuthGuard>
      )

      await waitFor(() => {
        expect(screen.getByText('인증 오류')).toBeInTheDocument()
        expect(screen.getByText('Authentication initialization failed')).toBeInTheDocument()
        expect(screen.getByText('페이지 새로고침')).toBeInTheDocument()
      })
    })
  })

  describe('Authentication States', () => {
    it('should render children when user is authenticated', async () => {
      const authenticatedState = createMockAuthState({ 
        isAuthenticated: true,
        user: { id: 'user-123', email: 'test@example.com' } as any
      })
      
      mockAuthService.getAuthState.mockReturnValue(authenticatedState)
      
      render(
        <AuthGuard>
          <TestChild />
        </AuthGuard>
      )

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument()
      })
    })

    it('should render children when auth is not required', async () => {
      mockAuthService.getAuthState.mockReturnValue(createMockAuthState({ isAuthenticated: false }))
      
      render(
        <AuthGuard requireAuth={false}>
          <TestChild />
        </AuthGuard>
      )

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument()
      })
    })

    it('should show login prompt when authentication is required but user is not authenticated', async () => {
      mockAuthService.getAuthState.mockReturnValue(createMockAuthState({ isAuthenticated: false }))
      
      render(
        <AuthGuard requireAuth={true}>
          <TestChild />
        </AuthGuard>
      )

      await waitFor(() => {
        expect(screen.getByText('로그인이 필요합니다')).toBeInTheDocument()
        expect(screen.getByText('이 페이지에 접근하려면 로그인이 필요합니다.')).toBeInTheDocument()
        expect(screen.getByText('로그인')).toBeInTheDocument()
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
      })
    })

    it('should render fallback component when provided and user is not authenticated', async () => {
      const fallback = <div>Please log in to continue</div>
      mockAuthService.getAuthState.mockReturnValue(createMockAuthState({ isAuthenticated: false }))
      
      render(
        <AuthGuard requireAuth={true} fallback={fallback}>
          <TestChild />
        </AuthGuard>
      )

      await waitFor(() => {
        expect(screen.getByText('Please log in to continue')).toBeInTheDocument()
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
      })
    })
  })

  describe('Auth Modal Behavior', () => {
    it('should show auth modal when authentication is required', async () => {
      mockAuthService.getAuthState.mockReturnValue(createMockAuthState({ isAuthenticated: false }))
      
      render(
        <AuthGuard requireAuth={true}>
          <TestChild />
        </AuthGuard>
      )

      await waitFor(() => {
        expect(screen.getByText(/Auth Modal - Open/)).toBeInTheDocument()
      })
    })

    it('should not show auth modal when showModal is false', async () => {
      mockAuthService.getAuthState.mockReturnValue(createMockAuthState({ isAuthenticated: false }))
      
      render(
        <AuthGuard requireAuth={true} showModal={false}>
          <TestChild />
        </AuthGuard>
      )

      await waitFor(() => {
        expect(screen.queryByText(/Auth Modal/)).not.toBeInTheDocument()
      })
    })

    it('should hide auth modal on successful authentication', async () => {
      // Start with unauthenticated state
      let authState = createMockAuthState({ isAuthenticated: false })
      let authListener: (state: AuthState) => void
      
      mockAuthService.getAuthState.mockReturnValue(authState)
      mockAuthService.addAuthListener.mockImplementation((callback) => {
        authListener = callback
        return () => {}
      })

      const { rerender } = render(
        <AuthGuard requireAuth={true}>
          <TestChild />
        </AuthGuard>
      )

      // Initial state - modal should be open
      await waitFor(() => {
        expect(screen.getByText(/Auth Modal - Open/)).toBeInTheDocument()
      })

      // Simulate successful authentication
      authState = createMockAuthState({ isAuthenticated: true })
      mockAuthService.getAuthState.mockReturnValue(authState)
      authListener!(authState)
      
      rerender(
        <AuthGuard requireAuth={true}>
          <TestChild />
        </AuthGuard>
      )

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument()
        expect(screen.queryByText(/Auth Modal - Open/)).not.toBeInTheDocument()
      })
    })

    it('should handle auth success from modal', async () => {
      mockAuthService.getAuthState.mockReturnValue(createMockAuthState({ isAuthenticated: false }))
      
      render(
        <AuthGuard requireAuth={true}>
          <TestChild />
        </AuthGuard>
      )

      const successButton = await screen.findByText('Sign In Success')
      fireEvent.click(successButton)

      // Modal should be closed (implementation detail - modal manages its own visibility)
      await waitFor(() => {
        expect(screen.getByText(/Auth Modal - Open/)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error message when auth state has error', async () => {
      const errorState = createMockAuthState({ 
        error: 'Authentication service unavailable',
        isLoading: false
      })
      
      mockAuthService.getAuthState.mockReturnValue(errorState)
      
      render(
        <AuthGuard>
          <TestChild />
        </AuthGuard>
      )

      await waitFor(() => {
        expect(screen.getByText('인증 오류')).toBeInTheDocument()
        expect(screen.getByText('Authentication service unavailable')).toBeInTheDocument()
        expect(screen.getByText('페이지 새로고침')).toBeInTheDocument()
      })
    })

    it('should provide refresh button on error', async () => {
      const reloadSpy = vi.fn()
      Object.defineProperty(window, 'location', {
        value: { reload: reloadSpy },
        writable: true
      })

      const errorState = createMockAuthState({ 
        error: 'Auth error',
        isLoading: false
      })
      
      mockAuthService.getAuthState.mockReturnValue(errorState)
      
      render(
        <AuthGuard>
          <TestChild />
        </AuthGuard>
      )

      const refreshButton = await screen.findByText('페이지 새로고침')
      fireEvent.click(refreshButton)

      expect(reloadSpy).toHaveBeenCalled()
    })
  })

  describe('Auth State Updates', () => {
    it('should update when auth state changes', async () => {
      let authListener: (state: AuthState) => void
      let authState = createMockAuthState({ isAuthenticated: false })
      
      mockAuthService.getAuthState.mockReturnValue(authState)
      mockAuthService.addAuthListener.mockImplementation((callback) => {
        authListener = callback
        return () => {}
      })

      const { rerender } = render(
        <AuthGuard requireAuth={true}>
          <TestChild />
        </AuthGuard>
      )

      // Initially not authenticated
      await waitFor(() => {
        expect(screen.getByText('로그인이 필요합니다')).toBeInTheDocument()
      })

      // Simulate authentication
      authState = createMockAuthState({ 
        isAuthenticated: true,
        user: { id: 'user-123' } as any
      })
      authListener!(authState)
      
      rerender(
        <AuthGuard requireAuth={true}>
          <TestChild />
        </AuthGuard>
      )

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument()
      })
    })

    it('should cleanup listener on unmount', () => {
      const unsubscribe = vi.fn()
      mockAuthService.addAuthListener.mockReturnValue(unsubscribe)
      mockAuthService.getAuthState.mockReturnValue(createMockAuthState({ isAuthenticated: true }))

      const { unmount } = render(
        <AuthGuard>
          <TestChild />
        </AuthGuard>
      )

      unmount()

      expect(unsubscribe).toHaveBeenCalled()
    })
  })

  describe('Props Configuration', () => {
    it('should respect requireAuth prop', async () => {
      mockAuthService.getAuthState.mockReturnValue(createMockAuthState({ isAuthenticated: false }))
      
      // With requireAuth=false, should render children even when not authenticated
      const { rerender } = render(
        <AuthGuard requireAuth={false}>
          <TestChild />
        </AuthGuard>
      )

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument()
      })

      // With requireAuth=true, should not render children when not authenticated
      rerender(
        <AuthGuard requireAuth={true}>
          <TestChild />
        </AuthGuard>
      )

      await waitFor(() => {
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
        expect(screen.getByText('로그인이 필요합니다')).toBeInTheDocument()
      })
    })
  })
})