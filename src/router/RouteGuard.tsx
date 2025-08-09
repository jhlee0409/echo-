/**
 * 🛡️ Route Guard - Advanced Route Protection System
 * 
 * Provides comprehensive route protection with:
 * - Authentication checking
 * - Role-based access control
 * - Feature flag integration
 * - Loading states
 * - Redirect handling
 * - Session validation
 */

import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

// Hooks and services
import { useAuthStore } from '@hooks/useAuthStore'
import { useGameStore } from '@hooks/useGameStore'
import { useFeatureFlag, useFeatureFlags } from '@hooks/useFeatureFlags'
import { LoadingScreen } from '@components'

// Types
interface RouteGuardProps {
  children: React.ReactNode
  
  // Authentication requirements
  requireAuth?: boolean
  requireAdmin?: boolean
  requirePremium?: boolean
  
  // Feature flag requirements
  requiresFeature?: string
  requiresAnyFeature?: string[]
  requiresAllFeatures?: string[]
  
  // Role-based access
  allowedRoles?: string[]
  blockedRoles?: string[]
  
  // Redirect options
  fallbackRoute?: string
  unauthorizedRoute?: string
  loadingComponent?: React.ComponentType
  
  // Advanced options
  validateSession?: boolean
  checkGameState?: boolean
  minimumLevel?: number
  
  // Custom validation
  customValidator?: () => boolean | Promise<boolean>
  validationMessage?: string
}

// Permission validation result
interface ValidationResult {
  allowed: boolean
  reason?: string
  redirectTo?: string
  showLoading?: boolean
}

// Session validation hook
const useSessionValidation = (enabled: boolean) => {
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const { validateSession } = useAuthStore()
  
  useEffect(() => {
    if (!enabled) {
      setIsValid(true)
      return
    }
    
    const validate = async () => {
      try {
        const valid = await validateSession()
        setIsValid(valid)
      } catch (error) {
        console.error('Session validation failed:', error)
        setIsValid(false)
      }
    }
    
    validate()
  }, [enabled, validateSession])
  
  return isValid
}

// Game state validation hook
const useGameStateValidation = (enabled: boolean, minimumLevel?: number) => {
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const { gameState, isInitialized } = useGameStore()
  
  useEffect(() => {
    if (!enabled) {
      setIsValid(true)
      return
    }
    
    if (!isInitialized) {
      setIsValid(null) // Still loading
      return
    }
    
    // Check minimum level requirement
    if (minimumLevel && gameState?.character?.level < minimumLevel) {
      setIsValid(false)
      return
    }
    
    setIsValid(true)
  }, [enabled, isInitialized, gameState, minimumLevel])
  
  return isValid
}

// Custom validation hook
const useCustomValidation = (validator?: () => boolean | Promise<boolean>) => {
  const [result, setResult] = useState<boolean | null>(null)
  
  useEffect(() => {
    if (!validator) {
      setResult(true)
      return
    }
    
    const validate = async () => {
      try {
        const valid = await Promise.resolve(validator())
        setResult(valid)
      } catch (error) {
        console.error('Custom validation failed:', error)
        setResult(false)
      }
    }
    
    validate()
  }, [validator])
  
  return result
}

// Permission validation logic
const usePermissionValidation = (props: RouteGuardProps): ValidationResult => {
  const location = useLocation()
  const { 
    isAuthenticated, 
    isAdmin, 
    isPremium, 
    userRoles, 
    isLoading: authLoading 
  } = useAuthStore()
  
  // Feature flag checks
  const primaryFeature = useFeatureFlag(props.requiresFeature as any)
  const anyFeatures = useFeatureFlags(props.requiresAnyFeature as any[] || [])
  const allFeatures = useFeatureFlags(props.requiresAllFeatures as any[] || [])
  
  // Session and game state validation
  const sessionValid = useSessionValidation(props.validateSession ?? false)
  const gameStateValid = useGameStateValidation(
    props.checkGameState ?? false, 
    props.minimumLevel
  )
  const customValid = useCustomValidation(props.customValidator)
  
  // Loading state check
  if (authLoading || sessionValid === null || gameStateValid === null || customValid === null) {
    return { allowed: false, showLoading: true }
  }
  
  // Authentication checks
  if (props.requireAuth && !isAuthenticated) {
    return {
      allowed: false,
      reason: 'Authentication required',
      redirectTo: props.fallbackRoute || `/auth?redirect=${encodeURIComponent(location.pathname)}`
    }
  }
  
  if (props.requireAdmin && !isAdmin) {
    return {
      allowed: false,
      reason: 'Admin privileges required',
      redirectTo: props.unauthorizedRoute || '/unauthorized'
    }
  }
  
  if (props.requirePremium && !isPremium) {
    return {
      allowed: false,
      reason: 'Premium subscription required',
      redirectTo: '/upgrade'
    }
  }
  
  // Role-based access control
  if (props.allowedRoles && props.allowedRoles.length > 0) {
    const hasAllowedRole = props.allowedRoles.some(role => userRoles?.includes(role))
    if (!hasAllowedRole) {
      return {
        allowed: false,
        reason: 'Insufficient role permissions',
        redirectTo: props.unauthorizedRoute || '/unauthorized'
      }
    }
  }
  
  if (props.blockedRoles && props.blockedRoles.length > 0) {
    const hasBlockedRole = props.blockedRoles.some(role => userRoles?.includes(role))
    if (hasBlockedRole) {
      return {
        allowed: false,
        reason: 'Role blocked from access',
        redirectTo: props.unauthorizedRoute || '/unauthorized'
      }
    }
  }
  
  // Feature flag checks
  if (props.requiresFeature && !primaryFeature) {
    return {
      allowed: false,
      reason: `Feature '${props.requiresFeature}' not available`,
      redirectTo: props.fallbackRoute || '/'
    }
  }
  
  if (props.requiresAnyFeature && props.requiresAnyFeature.length > 0) {
    const hasAnyFeature = Object.values(anyFeatures).some(Boolean)
    if (!hasAnyFeature) {
      return {
        allowed: false,
        reason: 'None of required features are available',
        redirectTo: props.fallbackRoute || '/'
      }
    }
  }
  
  if (props.requiresAllFeatures && props.requiresAllFeatures.length > 0) {
    const hasAllFeatures = Object.values(allFeatures).every(Boolean)
    if (!hasAllFeatures) {
      return {
        allowed: false,
        reason: 'Not all required features are available',
        redirectTo: props.fallbackRoute || '/'
      }
    }
  }
  
  // Session validation
  if (!sessionValid) {
    return {
      allowed: false,
      reason: 'Session expired or invalid',
      redirectTo: props.fallbackRoute || '/auth'
    }
  }
  
  // Game state validation
  if (!gameStateValid) {
    return {
      allowed: false,
      reason: props.minimumLevel ? 
        `Minimum level ${props.minimumLevel} required` : 
        'Game state requirements not met',
      redirectTo: props.fallbackRoute || '/game'
    }
  }
  
  // Custom validation
  if (!customValid) {
    return {
      allowed: false,
      reason: props.validationMessage || 'Custom validation failed',
      redirectTo: props.fallbackRoute || '/'
    }
  }
  
  return { allowed: true }
}

// Access denied component
const AccessDenied: React.FC<{
  reason?: string
  onRetry?: () => void
}> = ({ reason, onRetry }) => (
  <div className="min-h-screen bg-dark-navy flex items-center justify-center p-4">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-dark-surface rounded-xl border border-ui-border-100 p-8 text-center max-w-md"
    >
      <div className="text-6xl mb-4">🚫</div>
      <h1 className="text-2xl font-bold text-ui-text-100 mb-4">
        접근 권한이 없습니다
      </h1>
      {reason && (
        <p className="text-ui-text-300 mb-6">
          {reason}
        </p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-neon mr-4"
        >
          다시 시도
        </button>
      )}
      <button
        onClick={() => window.history.back()}
        className="btn-secondary"
      >
        돌아가기
      </button>
    </motion.div>
  </div>
)

// Main RouteGuard component
export const RouteGuard: React.FC<RouteGuardProps> = (props) => {
  const { children, loadingComponent: LoadingComponent = LoadingScreen } = props
  const validation = usePermissionValidation(props)
  const [retryCount, setRetryCount] = useState(0)
  
  // Show loading state
  if (validation.showLoading) {
    return <LoadingComponent />
  }
  
  // Handle access denied
  if (!validation.allowed) {
    // Redirect if specified
    if (validation.redirectTo) {
      return <Navigate to={validation.redirectTo} replace />
    }
    
    // Show access denied screen
    return (
      <AccessDenied 
        reason={validation.reason}
        onRetry={() => {
          setRetryCount(prev => prev + 1)
          window.location.reload()
        }}
      />
    )
  }
  
  // Render protected content
  return <>{children}</>
}

export default RouteGuard

// Convenience components for common scenarios
export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RouteGuard requireAuth>{children}</RouteGuard>
)

export const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RouteGuard requireAuth requireAdmin>{children}</RouteGuard>
)

export const PremiumGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RouteGuard requireAuth requirePremium>{children}</RouteGuard>
)

export const FeatureGuard: React.FC<{ 
  feature: string
  children: React.ReactNode 
}> = ({ feature, children }) => (
  <RouteGuard requiresFeature={feature}>{children}</RouteGuard>
)

export const LevelGuard: React.FC<{ 
  level: number
  children: React.ReactNode 
}> = ({ level, children }) => (
  <RouteGuard requireAuth checkGameState minimumLevel={level}>
    {children}
  </RouteGuard>
)