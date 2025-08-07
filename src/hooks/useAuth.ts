import { useState, useEffect, useCallback } from 'react'
import { 
  AuthUser, 
  AuthSession, 
  UserProfile, 
  GameAuthContext,
  SignUpRequest,
  SignInRequest,
  PasswordResetRequest,
  PasswordUpdateRequest,
  ProfileUpdateRequest,
  OAuthProvider,
  AuthEvent,
  AuthEventPayload
} from '@services/auth'
import { getAuthManager } from '@services'

/**
 * Authentication Hook
 * Provides authentication state and methods for React components
 */
export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<AuthSession | null>(null)
  const [gameContext, setGameContext] = useState<GameAuthContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const authManager = getAuthManager()

  // Initialize auth state
  useEffect(() => {
    setUser(authManager.user)
    setSession(authManager.session)
    setGameContext(authManager.context)
    setLoading(false)

    // Listen for auth events
    const handleAuthEvent = (payload: AuthEventPayload) => {
      console.log('🔑 Auth event received:', payload.event)
      
      switch (payload.event) {
        case 'SIGNED_IN':
          setUser(authManager.user)
          setSession(authManager.session)
          setGameContext(authManager.context)
          setError(null)
          break
        case 'SIGNED_OUT':
          setUser(null)
          setSession(null)
          setGameContext(null)
          setError(null)
          break
        case 'USER_UPDATED':
          setGameContext(authManager.context)
          break
        case 'SESSION_EXPIRED':
          setError('세션이 만료되었습니다. 다시 로그인해주세요.')
          break
      }
    }

    authManager.on('auth_event', handleAuthEvent)

    return () => {
      authManager.off('auth_event', handleAuthEvent)
    }
  }, [authManager])

  // Sign up
  const signUp = useCallback(async (request: SignUpRequest) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await authManager.signUp(request)
      
      if (response.error) {
        throw new Error(response.error.message)
      }
      
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : '회원가입 중 오류가 발생했습니다'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [authManager])

  // Sign in
  const signIn = useCallback(async (request: SignInRequest) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await authManager.signIn(request)
      
      if (response.error) {
        throw new Error(response.error.message)
      }
      
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [authManager])

  // OAuth sign in
  const signInWithOAuth = useCallback(async (provider: OAuthProvider) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await authManager.signInWithOAuth({ provider })
      
      if (response.error) {
        throw new Error(response.error.message)
      }
      
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'OAuth 로그인 중 오류가 발생했습니다'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [authManager])

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await authManager.signOut()
      
      if (response.error) {
        throw new Error(response.error.message)
      }
      
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : '로그아웃 중 오류가 발생했습니다'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [authManager])

  // Request password reset
  const requestPasswordReset = useCallback(async (request: PasswordResetRequest) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await authManager.requestPasswordReset(request)
      
      if (response.error) {
        throw new Error(response.error.message)
      }
      
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : '비밀번호 재설정 요청 중 오류가 발생했습니다'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [authManager])

  // Update password
  const updatePassword = useCallback(async (request: PasswordUpdateRequest) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await authManager.updatePassword(request)
      
      if (response.error) {
        throw new Error(response.error.message)
      }
      
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : '비밀번호 변경 중 오류가 발생했습니다'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [authManager])

  // Update profile
  const updateProfile = useCallback(async (request: ProfileUpdateRequest) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await authManager.updateProfile(request)
      
      if (response.error) {
        throw new Error(response.error.message)
      }
      
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : '프로필 수정 중 오류가 발생했습니다'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [authManager])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Permission helpers
  const hasPermission = useCallback((permission: string) => {
    return authManager.hasPermission(permission as any)
  }, [authManager])

  const canAccessFeature = useCallback((feature: string) => {
    return authManager.canAccessFeature(feature)
  }, [authManager])

  // Quota helpers
  const getMessageQuota = useCallback(() => {
    return authManager.getMessageQuota()
  }, [authManager])

  return {
    // State
    user,
    session,
    gameContext,
    loading,
    error,
    isAuthenticated: authManager.isAuthenticated,
    
    // Actions
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    requestPasswordReset,
    updatePassword,
    updateProfile,
    clearError,
    
    // Helpers
    hasPermission,
    canAccessFeature,
    getMessageQuota,
    
    // User info shortcuts
    profile: gameContext?.profile || null,
    subscription: gameContext?.subscription || null,
    permissions: gameContext?.permissions || [],
    featureFlags: gameContext?.feature_flags || {},
    messageQuota: gameContext?.message_quota || null
  }
}

/**
 * Session Management Hook
 */
export const useSession = () => {
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const authManager = getAuthManager()

  // Load user sessions
  const loadSessions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // This would need to be implemented in AuthManager
      // const sessions = await authManager.getUserSessions()
      // setSessions(sessions)
    } catch (err) {
      const message = err instanceof Error ? err.message : '세션 정보를 불러오는 중 오류가 발생했습니다'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [authManager])

  // Revoke session
  const revokeSession = useCallback(async (sessionId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      // This would need to be implemented in SessionManager
      // await authManager.sessionManager.revokeSession(sessionId)
      // await loadSessions()
    } catch (err) {
      const message = err instanceof Error ? err.message : '세션 해지 중 오류가 발생했습니다'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [authManager, loadSessions])

  // Revoke all other sessions
  const revokeAllOtherSessions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // This would need to be implemented in SessionManager
      // await authManager.sessionManager.revokeAllOtherSessions()
      // await loadSessions()
    } catch (err) {
      const message = err instanceof Error ? err.message : '다른 세션 해지 중 오류가 발생했습니다'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [authManager, loadSessions])

  useEffect(() => {
    if (authManager.isAuthenticated) {
      loadSessions()
    }
  }, [authManager.isAuthenticated, loadSessions])

  return {
    sessions,
    loading,
    error,
    loadSessions,
    revokeSession,
    revokeAllOtherSessions
  }
}

/**
 * Password Validation Hook
 */
export const usePasswordValidation = () => {
  const [validation, setValidation] = useState<{
    valid: boolean
    errors: string[]
    score: number
    strength: {
      level: string
      color: string
      description: string
    }
  } | null>(null)

  const validatePassword = useCallback((
    password: string, 
    userInfo?: { email?: string, username?: string, displayName?: string }
  ) => {
    // This would use the SecurityValidator
    // const validator = getSecurityValidator()
    // const result = validator.validatePassword(password, userInfo)
    // const strength = validator.getPasswordStrengthDescription(result.score)
    
    // setValidation({
    //   ...result,
    //   strength
    // })

    // Simplified version for now
    const score = Math.min(100, Math.max(0, password.length * 10))
    const strength = {
      level: score > 80 ? '강함' : score > 60 ? '보통' : '약함',
      color: score > 80 ? '#22c55e' : score > 60 ? '#f59e0b' : '#ef4444',
      description: score > 80 ? '안전한 비밀번호입니다' : score > 60 ? '보통 수준의 비밀번호입니다' : '더 강한 비밀번호를 사용하세요'
    }

    setValidation({
      valid: password.length >= 8,
      errors: password.length < 8 ? ['비밀번호는 8자 이상이어야 합니다'] : [],
      score,
      strength
    })
  }, [])

  const clearValidation = useCallback(() => {
    setValidation(null)
  }, [])

  return {
    validation,
    validatePassword,
    clearValidation
  }
}

export default useAuth