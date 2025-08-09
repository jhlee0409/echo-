/**
 * 🏳️ Feature Flag UI Components
 * 
 * React components for feature flag conditional rendering
 */

import React, { Suspense } from 'react'
import { useFeatureFlag, useFeatureGate } from '@hooks/useFeatureFlags'
import { FeatureFlagKey } from '@services/feature-flags/FeatureFlagsService'

// Basic Feature Flag Component for conditional rendering
export interface FeatureFlagProps {
  flag: FeatureFlagKey
  userId?: string
  children: React.ReactNode
  fallback?: React.ReactNode
  loading?: React.ReactNode
}

export const FeatureFlag: React.FC<FeatureFlagProps> = ({
  flag,
  userId,
  children,
  fallback = null,
  loading = null
}) => {
  const { enabled, isLoading, render } = useFeatureGate(flag, userId)
  
  return <>{render(children, fallback, loading)}</>
}

// Feature Gate component with more advanced options
export interface FeatureGateProps extends FeatureFlagProps {
  loadingTimeout?: number
  onEnabled?: () => void
  onDisabled?: () => void
  requireAll?: FeatureFlagKey[] // Require all flags to be enabled
  requireAny?: FeatureFlagKey[] // Require any flag to be enabled
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  flag,
  userId,
  children,
  fallback = null,
  loading = null,
  loadingTimeout = 1000,
  onEnabled,
  onDisabled,
  requireAll = [],
  requireAny = []
}) => {
  // Primary flag
  const primaryEnabled = useFeatureFlag(flag, userId)
  
  // Additional flags for complex conditions
  const allRequiredFlags = requireAll.map(f => useFeatureFlag(f, userId))
  const anyRequiredFlags = requireAny.map(f => useFeatureFlag(f, userId))
  
  // Calculate final enabled state
  const allConditionsMet = requireAll.length === 0 || allRequiredFlags.every(Boolean)
  const anyConditionsMet = requireAny.length === 0 || anyRequiredFlags.some(Boolean)
  
  const enabled = primaryEnabled && allConditionsMet && anyConditionsMet
  
  // Call effect callbacks
  React.useEffect(() => {
    if (enabled && onEnabled) {
      onEnabled()
    } else if (!enabled && onDisabled) {
      onDisabled()
    }
  }, [enabled, onEnabled, onDisabled])
  
  // Handle loading state with timeout
  const [isLoading, setIsLoading] = React.useState(true)
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, loadingTimeout)
    
    return () => clearTimeout(timer)
  }, [loadingTimeout])
  
  if (isLoading && loading) {
    return <>{loading}</>
  }
  
  return <>{enabled ? children : fallback}</>
}

// A/B Test Component
export interface ABTestProps {
  testName: string
  userId?: string
  variants: {
    [variantName: string]: {
      flag: FeatureFlagKey
      component: React.ReactNode
    }
  }
  defaultVariant?: React.ReactNode
}

export const ABTest: React.FC<ABTestProps> = ({
  testName,
  userId,
  variants,
  defaultVariant = null
}) => {
  // Check which variant should be shown
  for (const [variantName, { flag, component }] of Object.entries(variants)) {
    const enabled = useFeatureFlag(flag, userId)
    if (enabled) {
      return <>{component}</>
    }
  }
  
  return <>{defaultVariant}</>
}

// Progressive Feature Rollout Component
export interface ProgressiveFeatureProps {
  flag: FeatureFlagKey
  userId?: string
  stages: {
    [stageName: string]: {
      threshold: number // 0-100 rollout percentage
      component: React.ReactNode
    }
  }
  defaultComponent?: React.ReactNode
}

export const ProgressiveFeature: React.FC<ProgressiveFeatureProps> = ({
  flag,
  userId,
  stages,
  defaultComponent = null
}) => {
  const enabled = useFeatureFlag(flag, userId)
  
  if (!enabled) {
    return <>{defaultComponent}</>
  }
  
  // For now, just return the first stage since we don't have rollout percentage in the hook
  // In a more advanced implementation, this would check the user's rollout bucket
  const firstStage = Object.values(stages)[0]
  return <>{firstStage?.component || defaultComponent}</>
}

// Feature Flag Context Provider
export interface FeatureFlagProviderProps {
  userId?: string
  userGroup?: string
  deviceType?: 'mobile' | 'tablet' | 'desktop'
  location?: string
  children: React.ReactNode
}

export const FeatureFlagProvider: React.FC<FeatureFlagProviderProps> = ({
  userId,
  userGroup,
  deviceType = 'desktop',
  location,
  children
}) => {
  // Set user context for feature flags
  React.useEffect(() => {
    const context = {
      userId,
      userGroup,
      deviceType,
      location
    }
    
    // This would set the context in the feature flags service
    // featureFlagsService.setUserContext(context)
  }, [userId, userGroup, deviceType, location])
  
  return <>{children}</>
}

// Feature Flag Debug Component (development only)
export interface FeatureFlagDebugProps {
  flag?: FeatureFlagKey
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

export const FeatureFlagDebug: React.FC<FeatureFlagDebugProps> = ({
  flag,
  position = 'bottom-right'
}) => {
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }
  
  const [isOpen, setIsOpen] = React.useState(false)
  
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4', 
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  }
  
  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-neon-blue/20 border border-neon-blue/50 text-neon-blue px-2 py-1 rounded text-xs font-mono hover:bg-neon-blue/30 transition-colors"
      >
        🏳️ {flag || 'All Flags'}
      </button>
      
      {isOpen && (
        <div className="absolute bottom-full mb-2 right-0 bg-dark-surface border border-ui-border-100 rounded-lg p-3 min-w-48 max-w-64">
          <div className="text-xs text-ui-text-300">
            {flag ? (
              <div>
                <div className="font-semibold text-ui-text-100">{flag}</div>
                <div>Status: <span className="text-green-400">Enabled</span></div>
              </div>
            ) : (
              <div>Feature Flags Debug Panel</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Lazy Feature Component - loads component only if feature is enabled
export interface LazyFeatureProps {
  flag: FeatureFlagKey
  userId?: string
  loader: () => Promise<{ default: React.ComponentType<any> }>
  fallback?: React.ReactNode
  loading?: React.ReactNode
  componentProps?: any
}

export const LazyFeature: React.FC<LazyFeatureProps> = ({
  flag,
  userId,
  loader,
  fallback = null,
  loading = null,
  componentProps = {}
}) => {
  const enabled = useFeatureFlag(flag, userId)
  const [Component, setComponent] = React.useState<React.ComponentType<any> | null>(null)
  
  React.useEffect(() => {
    if (enabled && !Component) {
      loader()
        .then((module) => {
          setComponent(() => module.default)
        })
        .catch((error) => {
          console.error(`Failed to load feature component for ${flag}:`, error)
        })
    }
  }, [enabled, Component, loader, flag])
  
  if (!enabled) {
    return <>{fallback}</>
  }
  
  if (!Component) {
    return <>{loading || <div>Loading feature...</div>}</>
  }
  
  return (
    <Suspense fallback={loading}>
      <Component {...componentProps} />
    </Suspense>
  )
}

// Export all components
export default {
  FeatureFlag,
  FeatureGate, 
  ABTest,
  ProgressiveFeature,
  FeatureFlagProvider,
  FeatureFlagDebug,
  LazyFeature
}