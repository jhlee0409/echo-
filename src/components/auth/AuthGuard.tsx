/**
 * Auth Guard Component
 * Protects routes and components that require authentication
 */

import React, { useEffect, useState } from 'react'
import { authService } from '@/services/auth/AuthService'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { AuthModal } from './AuthModal'
import type { AuthState } from '@/services/auth/AuthService'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
  showModal?: boolean
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  fallback,
  requireAuth = true,
  showModal = true
}) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false,
    error: null
  })

  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    const initializeAuth = async () => {
      try {
        // Initialize auth service
        await authService.initialize()
        
        // Set initial auth state
        const initialState = authService.getAuthState()
        setAuthState(_prev => ({ ...initialState, isLoading: false }))

        // Listen to auth changes
        unsubscribe = authService.addAuthListener((state) => {
          setAuthState(_prev => ({ ...state, isLoading: false }))
        })
      } catch (error) {
        console.error('Auth initialization failed:', error)
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Authentication initialization failed'
        }))
      }
    }

    initializeAuth()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  // Show auth modal when authentication is required but user is not authenticated
  useEffect(() => {
    if (requireAuth && !authState.isLoading && !authState.isAuthenticated && showModal) {
      setShowAuthModal(true)
    }
  }, [requireAuth, authState.isAuthenticated, authState.isLoading, showModal])

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
  }

  const handleCloseModal = () => {
    if (!requireAuth) {
      setShowAuthModal(false)
    }
    // If auth is required, don't allow closing modal
  }

  // Loading state
  if (authState.isLoading) {
    return <LoadingScreen message="인증 상태를 확인하는 중..." />
  }

  // Authentication error
  if (authState.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              인증 오류
            </h2>
            <p className="text-gray-600 mb-4">
              {authState.error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              페이지 새로고침
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Not authenticated and auth is required
  if (requireAuth && !authState.isAuthenticated) {
    if (fallback) {
      return (
        <>
          {fallback}
          {showModal && (
            <AuthModal
              isOpen={showAuthModal}
              onClose={handleCloseModal}
              onSuccess={handleAuthSuccess}
            />
          )}
        </>
      )
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              로그인이 필요합니다
            </h2>
            <p className="text-gray-600 mb-4">
              이 페이지에 접근하려면 로그인이 필요합니다.
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              로그인
            </button>
          </div>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={handleCloseModal}
          onSuccess={handleAuthSuccess}
        />
      </div>
    )
  }

  // User is authenticated or auth is not required
  return (
    <>
      {children}
      {showModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </>
  )
}

export default AuthGuard