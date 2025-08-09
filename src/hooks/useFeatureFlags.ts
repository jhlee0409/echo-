/**
 * 🏳️ Feature Flags React Hooks
 * 
 * React hooks for feature flag integration with performance optimization
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { 
  featureFlagsService, 
  FeatureFlagKey, 
  UserContext, 
  FeatureFlag 
} from '@services/feature-flags/FeatureFlagsService'

/**
 * Hook to check if a single feature flag is enabled
 * Optimized with memoization to prevent unnecessary re-renders
 */
export function useFeatureFlag(
  flagKey: FeatureFlagKey, 
  userId?: string
): boolean {
  // Use ref to track the current value without causing re-renders
  const currentValue = useRef<boolean>(featureFlagsService.isEnabled(flagKey, userId))
  const [enabled, setEnabled] = useState<boolean>(currentValue.current)

  useEffect(() => {
    const checkFlag = () => {
      const newEnabled = featureFlagsService.isEnabled(flagKey, userId)
      if (newEnabled !== currentValue.current) {
        currentValue.current = newEnabled
        setEnabled(newEnabled)
      }
    }

    // Check immediately
    checkFlag()

    // Set up periodic check for dynamic updates
    const interval = setInterval(checkFlag, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [flagKey, userId])

  return enabled
}

/**
 * Hook to get multiple feature flags at once
 * More efficient than multiple individual calls
 */
export function useFeatureFlags(
  flagKeys: FeatureFlagKey[], 
  userId?: string
): Record<FeatureFlagKey, boolean> {
  const [flags, setFlags] = useState<Record<FeatureFlagKey, boolean>>(() => {
    const initialFlags: Record<string, boolean> = {}
    flagKeys.forEach(key => {
      initialFlags[key] = featureFlagsService.isEnabled(key, userId)
    })
    return initialFlags as Record<FeatureFlagKey, boolean>
  })

  useEffect(() => {
    const checkFlags = () => {
      const newFlags: Record<string, boolean> = {}
      let hasChanges = false

      flagKeys.forEach(key => {
        const enabled = featureFlagsService.isEnabled(key, userId)
        newFlags[key] = enabled
        
        if (enabled !== flags[key]) {
          hasChanges = true
        }
      })

      if (hasChanges) {
        setFlags(newFlags as Record<FeatureFlagKey, boolean>)
      }
    }

    checkFlags()

    const interval = setInterval(checkFlags, 30000)
    return () => clearInterval(interval)
  }, [flagKeys, userId, flags])

  return flags
}

/**
 * Hook to get all enabled flags by category
 */
export function useFeatureFlagsByCategory(
  category: FeatureFlag['category'],
  userId?: string
): FeatureFlagKey[] {
  const [enabledFlags, setEnabledFlags] = useState<FeatureFlagKey[]>([])

  useEffect(() => {
    const updateFlags = () => {
      const categoryFlags = featureFlagsService.getFlagsByCategory(category)
      const enabled = categoryFlags.filter(flag => 
        featureFlagsService.isEnabled(flag, userId)
      )
      setEnabledFlags(enabled)
    }

    updateFlags()

    const interval = setInterval(updateFlags, 30000)
    return () => clearInterval(interval)
  }, [category, userId])

  return enabledFlags
}

/**
 * Hook for managing feature flag overrides (admin/testing)
 */
export function useFeatureFlagOverride() {
  const override = useCallback(
    (flagKey: FeatureFlagKey, enabled: boolean, temporary = true) => {
      featureFlagsService.override(flagKey, enabled, temporary)
    },
    []
  )

  const clearOverride = useCallback((flagKey: FeatureFlagKey) => {
    featureFlagsService.clearOverride(flagKey)
  }, [])

  return { override, clearOverride }
}

/**
 * Hook to set user context for personalized feature flags
 */
export function useFeatureFlagContext() {
  const setUserContext = useCallback((context: UserContext) => {
    featureFlagsService.setUserContext(context)
  }, [])

  return { setUserContext }
}

/**
 * Hook to get feature flag analytics data
 */
export function useFeatureFlagAnalytics() {
  const [analytics, setAnalytics] = useState(() => 
    featureFlagsService.getAnalytics()
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setAnalytics(featureFlagsService.getAnalytics())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  const exportData = useCallback(() => {
    return featureFlagsService.exportConfig()
  }, [])

  return { analytics, exportData }
}

/**
 * Hook for conditional rendering based on feature flags
 * Returns a render function for better performance
 */
export function useConditionalRender(
  flagKey: FeatureFlagKey,
  userId?: string
) {
  const enabled = useFeatureFlag(flagKey, userId)
  
  return useCallback(
    <T extends React.ReactNode>(
      component: T,
      fallback: T | null = null
    ): T | null => {
      return enabled ? component : fallback
    },
    [enabled]
  )
}

/**
 * Hook for A/B testing with feature flags
 */
export function useABTest(
  testName: string,
  variants: Record<string, FeatureFlagKey>,
  userId?: string
): string | null {
  const flagStates = useFeatureFlags(Object.values(variants), userId)
  
  return useMemo(() => {
    // Return the first enabled variant
    for (const [variantName, flagKey] of Object.entries(variants)) {
      if (flagStates[flagKey]) {
        return variantName
      }
    }
    return null
  }, [variants, flagStates])
}

/**
 * Hook for feature flag debugging information
 */
export function useFeatureFlagDebug(flagKey?: FeatureFlagKey) {
  const [debugInfo, setDebugInfo] = useState<{
    flag?: FeatureFlag | null
    allFlags?: Record<FeatureFlagKey, boolean>
    config?: ReturnType<typeof featureFlagsService.exportConfig>
  }>({})

  useEffect(() => {
    const updateDebugInfo = () => {
      const info: typeof debugInfo = {}
      
      if (flagKey) {
        info.flag = featureFlagsService.getFlagInfo(flagKey)
      } else {
        info.allFlags = featureFlagsService.getEnabledFlags().reduce((acc, key) => {
          acc[key] = featureFlagsService.isEnabled(key)
          return acc
        }, {} as Record<FeatureFlagKey, boolean>)
        
        info.config = featureFlagsService.exportConfig()
      }
      
      setDebugInfo(info)
    }

    updateDebugInfo()

    const interval = setInterval(updateDebugInfo, 10000) // Update every 10 seconds
    return () => clearInterval(interval)
  }, [flagKey])

  return debugInfo
}

/**
 * Custom hook for feature-gated components with loading states
 */
export function useFeatureGate(
  flagKey: FeatureFlagKey,
  userId?: string
) {
  const enabled = useFeatureFlag(flagKey, userId)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate async flag checking (useful for remote flags)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [flagKey, userId])

  return {
    enabled,
    isLoading,
    render: useCallback(
      <T extends React.ReactNode>(
        component: T,
        fallback: T | null = null,
        loadingComponent: React.ReactNode = null
      ): React.ReactNode => {
        if (isLoading) return loadingComponent
        return enabled ? component : fallback
      },
      [enabled, isLoading]
    )
  }
}

// Utility type for component props with feature flag support
export type WithFeatureFlagProps<T> = T & {
  featureFlag?: FeatureFlagKey
  userId?: string
  fallback?: React.ReactNode
}

/**
 * HOC for wrapping components with feature flag checking
 */
export function withFeatureFlag<P extends object>(
  Component: React.ComponentType<P>,
  flagKey: FeatureFlagKey,
  fallback: React.ComponentType<P> | null = null
) {
  return function FeatureFlaggedComponent(
    props: P & { userId?: string }
  ) {
    const enabled = useFeatureFlag(flagKey, props.userId)
    
    if (!enabled && fallback) {
      const FallbackComponent = fallback
      return React.createElement(FallbackComponent, props)
    }
    
    if (!enabled) {
      return null
    }
    
    return React.createElement(Component, props)
  }
}

export default {
  useFeatureFlag,
  useFeatureFlags,
  useFeatureFlagsByCategory,
  useFeatureFlagOverride,
  useFeatureFlagContext,
  useFeatureFlagAnalytics,
  useConditionalRender,
  useABTest,
  useFeatureFlagDebug,
  useFeatureGate,
  withFeatureFlag,
}