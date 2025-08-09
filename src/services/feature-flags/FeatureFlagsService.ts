/**
 * 🏳️ Feature Flags Service - Advanced Feature Toggle System
 *
 * Provides comprehensive feature flag management with:
 * - Environment-based feature control
 * - User-specific feature overrides
 * - A/B testing support
 * - Real-time flag updates
 * - Analytics integration
 * - Safe rollback mechanisms
 */

import React from 'react'
import { ENV } from '@config/env'

// Core feature flag types
export type FeatureFlagKey =
  // Core Game Features
  | 'voice_chat'
  | 'analytics'
  | 'payment'
  | 'debug_mode'

  // Game Content Features
  | 'advanced_battle'
  | 'character_customization'
  | 'multiplayer_mode'
  | 'story_mode'
  | 'exploration_mode'
  | 'emotion_sync'
  | 'daily_activities'

  // AI Features
  | 'ai_personality_learning'
  | 'ai_memory_system'
  | 'ai_conversation_history'
  | 'ai_emotional_responses'
  | 'ai_creative_mode'

  // UI/UX Features
  | 'new_ui_design'
  | 'dark_mode_toggle'
  | 'accessibility_mode'
  | 'mobile_optimizations'
  | 'keyboard_shortcuts'
  | 'gesture_controls'

  // Social Features
  | 'friend_system'
  | 'leaderboards'
  | 'achievements'
  | 'sharing_features'
  | 'community_features'

  // Performance Features
  | 'lazy_loading'
  | 'service_worker'
  | 'offline_mode'
  | 'performance_monitoring'
  | 'error_reporting'

  // Business Features
  | 'premium_features'
  | 'subscription_system'
  | 'in_app_purchases'
  | 'referral_program'
  | 'loyalty_rewards'

export interface FeatureFlag {
  key: FeatureFlagKey
  enabled: boolean
  description: string
  category:
    | 'core'
    | 'game'
    | 'ai'
    | 'ui'
    | 'social'
    | 'performance'
    | 'business'
  rolloutPercentage: number // 0-100
  environments: ('development' | 'staging' | 'production')[]
  userGroups?: string[] // Optional user group restrictions
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
  expiresAt?: Date // Optional expiration for temporary flags
}

export interface FeatureFlagConfig {
  flags: Record<FeatureFlagKey, FeatureFlag>
  defaultEnabled: boolean
  enableAnalytics: boolean
  cacheTimeout: number // minutes
}

export interface UserContext {
  userId?: string
  userGroup?: string
  deviceType: 'mobile' | 'tablet' | 'desktop'
  location?: string
  isEmployee?: boolean
  betaTester?: boolean
  premiumUser?: boolean
}

export interface FeatureFlagAnalytics {
  flagKey: FeatureFlagKey
  userId?: string
  enabled: boolean
  timestamp: Date
  context: UserContext
  source: 'default' | 'override' | 'experiment'
}

// Default feature flag configuration
const DEFAULT_FEATURE_FLAGS: Record<
  FeatureFlagKey,
  Omit<FeatureFlag, 'createdAt' | 'updatedAt'>
> = {
  // Core Game Features (from existing env)
  voice_chat: {
    key: 'voice_chat',
    enabled: ENV.ENABLE_VOICE_CHAT,
    description: 'Enable voice chat functionality with AI companion',
    category: 'core',
    rolloutPercentage: 0,
    environments: ['development', 'staging'],
  },
  analytics: {
    key: 'analytics',
    enabled: ENV.ENABLE_ANALYTICS,
    description: 'Enable user analytics and behavior tracking',
    category: 'core',
    rolloutPercentage: 100,
    environments: ['development', 'staging', 'production'],
  },
  payment: {
    key: 'payment',
    enabled: ENV.ENABLE_PAYMENT,
    description: 'Enable payment processing and premium features',
    category: 'business',
    rolloutPercentage: 0,
    environments: ['staging'],
  },
  debug_mode: {
    key: 'debug_mode',
    enabled: ENV.ENABLE_DEBUG_MODE,
    description: 'Enable debug logging and development tools',
    category: 'core',
    rolloutPercentage: 100,
    environments: ['development'],
  },

  // Game Content Features
  advanced_battle: {
    key: 'advanced_battle',
    enabled: true,
    description: 'Advanced battle system with AI companions',
    category: 'game',
    rolloutPercentage: 100,
    environments: ['development', 'staging', 'production'],
  },
  character_customization: {
    key: 'character_customization',
    enabled: true,
    description: 'Character appearance and personality customization',
    category: 'game',
    rolloutPercentage: 80,
    environments: ['development', 'staging'],
  },
  multiplayer_mode: {
    key: 'multiplayer_mode',
    enabled: false,
    description: 'Multiplayer interactions with other players',
    category: 'game',
    rolloutPercentage: 0,
    environments: ['development'],
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
  },
  story_mode: {
    key: 'story_mode',
    enabled: true,
    description: 'Structured story progression and quests',
    category: 'game',
    rolloutPercentage: 90,
    environments: ['development', 'staging'],
  },
  exploration_mode: {
    key: 'exploration_mode',
    enabled: false,
    description: 'Open world exploration gameplay',
    category: 'game',
    rolloutPercentage: 30,
    environments: ['development'],
  },
  emotion_sync: {
    key: 'emotion_sync',
    enabled: true,
    description: 'Emotional synchronization and bonding activities',
    category: 'game',
    rolloutPercentage: 70,
    environments: ['development', 'staging'],
  },
  daily_activities: {
    key: 'daily_activities',
    enabled: false,
    description: 'Daily life simulation activities',
    category: 'game',
    rolloutPercentage: 40,
    environments: ['development'],
  },

  // AI Features
  ai_personality_learning: {
    key: 'ai_personality_learning',
    enabled: true,
    description: 'AI learns and adapts personality based on interactions',
    category: 'ai',
    rolloutPercentage: 100,
    environments: ['development', 'staging', 'production'],
  },
  ai_memory_system: {
    key: 'ai_memory_system',
    enabled: true,
    description: 'AI remembers conversations and preferences',
    category: 'ai',
    rolloutPercentage: 100,
    environments: ['development', 'staging', 'production'],
  },
  ai_conversation_history: {
    key: 'ai_conversation_history',
    enabled: true,
    description: 'Persistent conversation history with context',
    category: 'ai',
    rolloutPercentage: 90,
    environments: ['development', 'staging'],
  },
  ai_emotional_responses: {
    key: 'ai_emotional_responses',
    enabled: true,
    description: 'Dynamic emotional responses and expressions',
    category: 'ai',
    rolloutPercentage: 85,
    environments: ['development', 'staging'],
  },
  ai_creative_mode: {
    key: 'ai_creative_mode',
    enabled: false,
    description: 'AI-generated creative content and activities',
    category: 'ai',
    rolloutPercentage: 25,
    environments: ['development'],
  },

  // UI/UX Features
  new_ui_design: {
    key: 'new_ui_design',
    enabled: true,
    description: 'New glassmorphism UI design system',
    category: 'ui',
    rolloutPercentage: 100,
    environments: ['development', 'staging', 'production'],
  },
  dark_mode_toggle: {
    key: 'dark_mode_toggle',
    enabled: false,
    description: 'Toggle between light and dark themes',
    category: 'ui',
    rolloutPercentage: 60,
    environments: ['development', 'staging'],
  },
  accessibility_mode: {
    key: 'accessibility_mode',
    enabled: false,
    description: 'Enhanced accessibility features and navigation',
    category: 'ui',
    rolloutPercentage: 40,
    environments: ['development'],
  },
  mobile_optimizations: {
    key: 'mobile_optimizations',
    enabled: true,
    description: 'Mobile-specific UI optimizations and gestures',
    category: 'ui',
    rolloutPercentage: 100,
    environments: ['development', 'staging', 'production'],
  },
  keyboard_shortcuts: {
    key: 'keyboard_shortcuts',
    enabled: true,
    description: 'Keyboard shortcuts for power users',
    category: 'ui',
    rolloutPercentage: 75,
    environments: ['development', 'staging'],
  },
  gesture_controls: {
    key: 'gesture_controls',
    enabled: false,
    description: 'Touch gesture controls for mobile devices',
    category: 'ui',
    rolloutPercentage: 20,
    environments: ['development'],
  },

  // Social Features
  friend_system: {
    key: 'friend_system',
    enabled: false,
    description: 'Friend connections and social interactions',
    category: 'social',
    rolloutPercentage: 0,
    environments: ['development'],
  },
  leaderboards: {
    key: 'leaderboards',
    enabled: false,
    description: 'Global and friend leaderboards',
    category: 'social',
    rolloutPercentage: 0,
    environments: ['development'],
  },
  achievements: {
    key: 'achievements',
    enabled: true,
    description: 'Achievement system and progress tracking',
    category: 'social',
    rolloutPercentage: 70,
    environments: ['development', 'staging'],
  },
  sharing_features: {
    key: 'sharing_features',
    enabled: false,
    description: 'Share moments and achievements on social media',
    category: 'social',
    rolloutPercentage: 30,
    environments: ['development'],
  },
  community_features: {
    key: 'community_features',
    enabled: false,
    description: 'Community forums and user-generated content',
    category: 'social',
    rolloutPercentage: 0,
    environments: ['development'],
  },

  // Performance Features
  lazy_loading: {
    key: 'lazy_loading',
    enabled: true,
    description: 'Lazy loading for components and assets',
    category: 'performance',
    rolloutPercentage: 100,
    environments: ['development', 'staging', 'production'],
  },
  service_worker: {
    key: 'service_worker',
    enabled: false,
    description: 'Service worker for offline functionality',
    category: 'performance',
    rolloutPercentage: 50,
    environments: ['development', 'staging'],
  },
  offline_mode: {
    key: 'offline_mode',
    enabled: false,
    description: 'Limited offline gameplay functionality',
    category: 'performance',
    rolloutPercentage: 20,
    environments: ['development'],
  },
  performance_monitoring: {
    key: 'performance_monitoring',
    enabled: ENV.NODE_ENV !== 'production',
    description: 'Real-time performance monitoring and reporting',
    category: 'performance',
    rolloutPercentage: 100,
    environments: ['development', 'staging'],
  },
  error_reporting: {
    key: 'error_reporting',
    enabled: true,
    description: 'Automatic error reporting and crash analytics',
    category: 'performance',
    rolloutPercentage: 100,
    environments: ['development', 'staging', 'production'],
  },

  // Business Features
  premium_features: {
    key: 'premium_features',
    enabled: false,
    description: 'Premium subscription features and content',
    category: 'business',
    rolloutPercentage: 0,
    environments: ['development'],
  },
  subscription_system: {
    key: 'subscription_system',
    enabled: false,
    description: 'Monthly/yearly subscription management',
    category: 'business',
    rolloutPercentage: 0,
    environments: ['development'],
  },
  in_app_purchases: {
    key: 'in_app_purchases',
    enabled: false,
    description: 'One-time purchase items and customizations',
    category: 'business',
    rolloutPercentage: 0,
    environments: ['development'],
  },
  referral_program: {
    key: 'referral_program',
    enabled: false,
    description: 'User referral rewards and bonuses',
    category: 'business',
    rolloutPercentage: 0,
    environments: ['development'],
  },
  loyalty_rewards: {
    key: 'loyalty_rewards',
    enabled: false,
    description: 'Daily login rewards and loyalty bonuses',
    category: 'business',
    rolloutPercentage: 0,
    environments: ['development'],
  },
}

export class FeatureFlagsService {
  private flags: Map<FeatureFlagKey, FeatureFlag> = new Map()
  private analytics: FeatureFlagAnalytics[] = []
  private userContext: UserContext | null = null
  private cacheTimeout = 60 * 1000 // 1 minute default
  private lastCacheUpdate = 0

  constructor() {
    this.initializeFlags()
    this.setupPeriodicRefresh()
  }

  /**
   * Initialize feature flags with defaults
   */
  private initializeFlags(): void {
    const now = new Date()

    Object.entries(DEFAULT_FEATURE_FLAGS).forEach(([key, flagConfig]) => {
      const flag: FeatureFlag = {
        ...flagConfig,
        createdAt: now,
        updatedAt: now,
      }

      // Check if flag should be enabled based on environment
      const initEnv = ENV.NODE_ENV === 'test' ? 'development' : ENV.NODE_ENV
      if (
        !flag.environments.includes(
          initEnv as 'development' | 'staging' | 'production'
        )
      ) {
        flag.enabled = false
      }

      // Check expiration
      if (flag.expiresAt && flag.expiresAt < now) {
        flag.enabled = false
      }

      this.flags.set(key as FeatureFlagKey, flag)
    })

    if (ENV.ENABLE_DEBUG_MODE) {
      console.log('🏳️ Feature Flags initialized:', {
        totalFlags: this.flags.size,
        enabledFlags: Array.from(this.flags.values()).filter(f => f.enabled)
          .length,
        environment: ENV.NODE_ENV,
      })
    }
  }

  /**
   * Set user context for personalized feature flags
   */
  setUserContext(context: UserContext): void {
    this.userContext = context

    if (ENV.ENABLE_DEBUG_MODE) {
      console.log('🏳️ User context updated:', context)
    }
  }

  /**
   * Check if a feature flag is enabled
   */
  isEnabled(flagKey: FeatureFlagKey, userId?: string): boolean {
    const flag = this.flags.get(flagKey)

    if (!flag) {
      console.warn(`🏳️ Unknown feature flag: ${flagKey}`)
      return false
    }

    // Check if flag is expired
    if (flag.expiresAt && flag.expiresAt < new Date()) {
      return false
    }

    // Check environment (map 'test' to 'development' for flag checks)
    const env = ENV.NODE_ENV === 'test' ? 'development' : ENV.NODE_ENV
    if (
      !flag.environments.includes(
        env as 'development' | 'staging' | 'production'
      )
    ) {
      return false
    }

    // Check user group restrictions
    if (flag.userGroups && this.userContext?.userGroup) {
      if (!flag.userGroups.includes(this.userContext.userGroup)) {
        return false
      }
    }

    // Apply rollout percentage (simple hash-based distribution)
    const rolloutEnabled = this.checkRolloutPercentage(
      flagKey,
      userId || this.userContext?.userId || 'anonymous',
      flag.rolloutPercentage
    )

    const enabled = flag.enabled && rolloutEnabled

    // Track analytics (avoid recursion for the analytics flag itself)
    if (flagKey !== 'analytics') {
      this.trackFlagUsage(flagKey, enabled, 'default')
    }

    return enabled
  }

  /**
   * Get all enabled flags for current context
   */
  getEnabledFlags(userId?: string): FeatureFlagKey[] {
    return Array.from(this.flags.keys()).filter(key =>
      this.isEnabled(key, userId)
    )
  }

  /**
   * Get flag metadata and configuration
   */
  getFlagInfo(flagKey: FeatureFlagKey): FeatureFlag | null {
    return this.flags.get(flagKey) || null
  }

  /**
   * Override a feature flag for testing/admin purposes
   */
  override(flagKey: FeatureFlagKey, enabled: boolean, temporary = true): void {
    const flag = this.flags.get(flagKey)

    if (!flag) {
      console.warn(`🏳️ Cannot override unknown flag: ${flagKey}`)
      return
    }

    // Create override
    const overriddenFlag: FeatureFlag = {
      ...flag,
      enabled,
      updatedAt: new Date(),
      metadata: {
        ...flag.metadata,
        override: true,
        originalEnabled: flag.enabled,
        temporary,
      },
    }

    this.flags.set(flagKey, overriddenFlag)
    this.trackFlagUsage(flagKey, enabled, 'override')

    if (ENV.ENABLE_DEBUG_MODE) {
      console.log(`🏳️ Flag overridden: ${flagKey} = ${enabled}`)
    }

    // Clear temporary overrides after 1 hour
    if (temporary) {
      setTimeout(
        () => {
          this.clearOverride(flagKey)
        },
        60 * 60 * 1000
      )
    }
  }

  /**
   * Clear flag override
   */
  clearOverride(flagKey: FeatureFlagKey): void {
    const flag = this.flags.get(flagKey)

    if (flag?.metadata?.override) {
      const clearedFlag: FeatureFlag = {
        ...flag,
        enabled: flag.metadata.originalEnabled || false,
        updatedAt: new Date(),
        metadata: {
          ...flag.metadata,
          override: undefined,
          originalEnabled: undefined,
          temporary: undefined,
        },
      }

      this.flags.set(flagKey, clearedFlag)

      if (ENV.ENABLE_DEBUG_MODE) {
        console.log(`🏳️ Flag override cleared: ${flagKey}`)
      }
    }
  }

  /**
   * Get feature flags by category
   */
  getFlagsByCategory(category: FeatureFlag['category']): FeatureFlagKey[] {
    return Array.from(this.flags.entries())
      .filter(([_, flag]) => flag.category === category)
      .map(([key, _]) => key)
  }

  /**
   * Check rollout percentage using consistent hashing
   */
  private checkRolloutPercentage(
    flagKey: FeatureFlagKey,
    userId: string,
    percentage: number
  ): boolean {
    if (percentage === 100) return true
    if (percentage === 0) return false

    // Simple hash function for consistent user assignment
    const hash = this.simpleHash(`${flagKey}:${userId}`)
    const bucket = hash % 100

    return bucket < percentage
  }

  /**
   * Simple hash function for rollout distribution
   */
  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  /**
   * Track feature flag usage for analytics
   */
  private trackFlagUsage(
    flagKey: FeatureFlagKey,
    enabled: boolean,
    source: FeatureFlagAnalytics['source']
  ): void {
    if (!this.isEnabled('analytics')) return

    const analytics: FeatureFlagAnalytics = {
      flagKey,
      userId: this.userContext?.userId,
      enabled,
      timestamp: new Date(),
      context: this.userContext || {
        deviceType: this.detectDeviceType(),
      },
      source,
    }

    this.analytics.push(analytics)

    // Keep only last 1000 analytics entries to prevent memory issues
    if (this.analytics.length > 1000) {
      this.analytics = this.analytics.slice(-1000)
    }
  }

  /**
   * Detect device type from user agent
   */
  private detectDeviceType(): UserContext['deviceType'] {
    if (typeof window === 'undefined') return 'desktop'

    const userAgent = navigator.userAgent.toLowerCase()
    if (
      /mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(
        userAgent
      )
    ) {
      return /ipad|tablet/i.test(userAgent) ? 'tablet' : 'mobile'
    }
    return 'desktop'
  }

  /**
   * Get analytics data
   */
  getAnalytics(): FeatureFlagAnalytics[] {
    return [...this.analytics]
  }

  /**
   * Setup periodic refresh of feature flags
   */
  private setupPeriodicRefresh(): void {
    // In a real app, this would fetch from a remote service
    setInterval(() => {
      if (Date.now() - this.lastCacheUpdate > this.cacheTimeout) {
        this.refreshFlags()
      }
    }, this.cacheTimeout)
  }

  /**
   * Refresh feature flags from remote source
   */
  private async refreshFlags(): Promise<void> {
    try {
      // In production, this would fetch from a feature flag service
      // For now, just update the cache timestamp
      this.lastCacheUpdate = Date.now()

      if (ENV.ENABLE_DEBUG_MODE) {
        console.log('🏳️ Feature flags refreshed')
      }
    } catch (error) {
      console.error('🏳️ Failed to refresh feature flags:', error)
    }
  }

  /**
   * Export configuration for debugging
   */
  exportConfig(): FeatureFlagConfig {
    // Build a fully-typed flags object snapshot
    const flags: Partial<Record<FeatureFlagKey, FeatureFlag>> = {}
    this.flags.forEach((flag, key) => {
      flags[key] = { ...flag }
    })

    return {
      flags: flags as Record<FeatureFlagKey, FeatureFlag>,
      defaultEnabled: false,
      enableAnalytics: false,
      cacheTimeout: this.cacheTimeout / 1000 / 60, // in minutes
    }
  }
}

// Singleton instance
export const featureFlagsService = new FeatureFlagsService()

// Convenience hooks and utilities
export const useFeatureFlag = (
  flagKey: FeatureFlagKey,
  userId?: string
): boolean => {
  return featureFlagsService.isEnabled(flagKey, userId)
}

export const withFeatureFlag = <T>(
  flagKey: FeatureFlagKey,
  component: T,
  fallback: T | null = null,
  userId?: string
): T | null => {
  return featureFlagsService.isEnabled(flagKey, userId) ? component : fallback
}

// React component wrapper (if needed)
export const FeatureFlag: React.FC<{
  flag: FeatureFlagKey
  userId?: string
  children: React.ReactNode
  fallback?: React.ReactNode
}> = ({ flag, userId, children, fallback = null }) => {
  const enabled = useFeatureFlag(flag, userId)
  return enabled
    ? (children as React.ReactElement)
    : (fallback as React.ReactElement) || null
}

export default featureFlagsService
