/**
 * 🏳️ Feature Flags System - Central Exports
 *
 * Main entry point for the feature flags system
 */

import type { FeatureFlag as FeatureFlagType } from './FeatureFlagsService'

// Core service and types
export {
  FeatureFlagsService,
  featureFlagsService,
  useFeatureFlag,
  withFeatureFlag,
  FeatureFlag as FeatureFlagComponent,
} from './FeatureFlagsService'

export type {
  FeatureFlagKey,
  FeatureFlag as FeatureFlagType,
  FeatureFlagConfig,
  UserContext,
  FeatureFlagAnalytics,
} from './FeatureFlagsService'

// React hooks
export {
  useFeatureFlags,
  useFeatureFlagsByCategory,
  useFeatureFlagOverride,
  useFeatureFlagContext,
  useFeatureFlagAnalytics,
  useConditionalRender,
  useABTest,
  useFeatureFlagDebug,
  useFeatureGate,
  withFeatureFlag as withFeatureFlagHOC,
} from '@hooks/useFeatureFlags'

export type { WithFeatureFlagProps } from '@hooks/useFeatureFlags'

// UI Components
export {
  FeatureFlag,
  FeatureGate,
  ABTest,
  ProgressiveFeature,
  FeatureFlagProvider,
  FeatureFlagDebug,
  LazyFeature,
} from '@components/ui/FeatureFlag'

export type {
  FeatureFlagProps,
  FeatureGateProps,
  ABTestProps,
  ProgressiveFeatureProps,
  FeatureFlagProviderProps,
  FeatureFlagDebugProps,
  LazyFeatureProps,
} from '@components/ui/FeatureFlag'

// Admin components
export { FeatureFlagsPanel } from '@components/admin/FeatureFlagsPanel'

// Utility functions and constants
export const FEATURE_FLAG_CATEGORIES = [
  'core',
  'game',
  'ai',
  'ui',
  'social',
  'performance',
  'business',
] as const

export const FEATURE_FLAG_ENVIRONMENTS = [
  'development',
  'staging',
  'production',
] as const

// Feature flag utilities
export const createFeatureFlagKey = (
  category: string,
  name: string
): string => {
  return `${category}_${name}`.toLowerCase()
}

export const isFeatureFlagExpired = (flag: FeatureFlagType): boolean => {
  return !!(flag.expiresAt && flag.expiresAt < new Date())
}

export const getFeatureFlagStatus = (
  flag: FeatureFlagType,
  environment: string
): 'enabled' | 'disabled' | 'restricted' => {
  if (!flag.environments.includes(environment as any)) {
    return 'restricted'
  }

  if (isFeatureFlagExpired(flag)) {
    return 'disabled'
  }

  return flag.enabled ? 'enabled' : 'disabled'
}

// Default export for the service
export { featureFlagsService as default } from './FeatureFlagsService'
