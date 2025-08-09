/**
 * 🏳️ Feature Flags Admin Panel
 * 
 * Development and admin interface for managing feature flags
 * Only available in development mode or for admin users
 */

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  useFeatureFlagAnalytics,
  useFeatureFlagOverride,
  useFeatureFlagDebug 
} from '@hooks/useFeatureFlags'
import { 
  FeatureFlagKey, 
  FeatureFlag
} from '@services/feature-flags/FeatureFlagsService'
import { ENV } from '@config/env'

interface FeatureFlagsPanelProps {
  isOpen: boolean
  onClose: () => void
  isAdmin?: boolean
}

export const FeatureFlagsPanel: React.FC<FeatureFlagsPanelProps> = ({
  isOpen,
  onClose,
  isAdmin = false
}) => {
  const [selectedCategory, setSelectedCategory] = useState<FeatureFlag['category'] | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAnalytics, setShowAnalytics] = useState(false)
  
  const { config } = useFeatureFlagDebug()
  const { analytics, exportData } = useFeatureFlagAnalytics()
  const { override, clearOverride } = useFeatureFlagOverride()

  // Helper functions
  const getCategoryIcon = (category: FeatureFlag['category']) => {
    const icons = {
      core: '⚡',
      game: '🎮',
      ai: '🤖',
      ui: '🎨',
      social: '👥',
      performance: '🚀',
      business: '💼',
    }
    return icons[category] || '🏳️'
  }

  // Don't render in production unless user is admin
  if (ENV.NODE_ENV === 'production' && !isAdmin) {
    return null
  }

  const categories: (FeatureFlag['category'] | 'all')[] = [
    'all', 'core', 'game', 'ai', 'ui', 'social', 'performance', 'business'
  ]

  const filteredFlags = useMemo(() => {
    if (!config?.flags) return []

    const flags = Object.entries(config.flags).filter(([key, flag]) => {
      const matchesCategory = selectedCategory === 'all' || flag.category === selectedCategory
      const matchesSearch = key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           flag.description.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesCategory && matchesSearch
    })

    return flags.sort(([a], [b]) => a.localeCompare(b))
  }, [config?.flags, selectedCategory, searchTerm])

  const handleToggleFlag = (flagKey: FeatureFlagKey, currentEnabled: boolean) => {
    if (currentEnabled) {
      clearOverride(flagKey)
    } else {
      override(flagKey, true, true)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-dark-surface rounded-xl border border-ui-border-100 w-full max-w-6xl h-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-dark-navy border-b border-ui-border-100 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🏳️</span>
              <div>
                <h2 className="text-xl font-bold text-ui-text-100">Feature Flags Panel</h2>
                <p className="text-sm text-ui-text-400">
                  Environment: {ENV.NODE_ENV} • 
                  Flags: {filteredFlags.length}/{Object.keys(config?.flags || {}).length}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="px-3 py-2 text-sm bg-ui-surface-100 hover:bg-ui-surface-200 rounded-lg transition-colors"
              >
                {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
              </button>
              
              <button
                onClick={() => {
                  const data = exportData()
                  navigator.clipboard.writeText(JSON.stringify(data, null, 2))
                }}
                className="px-3 py-2 text-sm bg-neon-blue/20 hover:bg-neon-blue/30 text-neon-blue rounded-lg transition-colors"
              >
                Export Config
              </button>
              
              <button
                onClick={onClose}
                className="p-2 text-ui-text-300 hover:text-ui-text-100 rounded-lg hover:bg-ui-surface-100 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex h-full">
            {/* Sidebar */}
            <div className="w-64 bg-dark-navy border-r border-ui-border-100 p-4">
              {/* Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search flags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 bg-ui-surface-100 border border-ui-border-200 rounded-lg text-ui-text-100 placeholder-ui-text-400 focus:outline-none focus:border-neon-blue"
                />
              </div>

              {/* Categories */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-ui-text-400 uppercase tracking-wide mb-2">Categories</p>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategory === category
                        ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
                        : 'text-ui-text-300 hover:text-ui-text-100 hover:bg-ui-surface-100'
                    }`}
                  >
                    <span className="mr-2">
                      {category === 'all' ? '🏳️' : getCategoryIcon(category as FeatureFlag['category'])}
                    </span>
                    {category === 'all' ? 'All Flags' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
              {showAnalytics ? (
                <AnalyticsView analytics={analytics} />
              ) : (
                <FlagsView 
                  flags={filteredFlags} 
                  onToggleFlag={handleToggleFlag}
                />
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Analytics View Component
const AnalyticsView: React.FC<{ analytics: ReturnType<typeof useFeatureFlagAnalytics>['analytics'] }> = ({ 
  analytics 
}) => {
  const flagUsage = useMemo(() => {
    const usage: Record<string, { enabled: number; disabled: number; total: number }> = {}
    
    analytics.forEach((entry) => {
      if (!usage[entry.flagKey]) {
        usage[entry.flagKey] = { enabled: 0, disabled: 0, total: 0 }
      }
      
      if (entry.enabled) {
        usage[entry.flagKey].enabled++
      } else {
        usage[entry.flagKey].disabled++
      }
      usage[entry.flagKey].total++
    })
    
    return Object.entries(usage)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 20) // Top 20 most used flags
  }, [analytics])

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-ui-text-100 mb-2">Feature Flag Analytics</h3>
        <p className="text-ui-text-400">Last {analytics.length} flag evaluations</p>
      </div>

      <div className="grid gap-6">
        {/* Usage Statistics */}
        <div className="bg-ui-surface-100 rounded-lg p-4">
          <h4 className="font-medium text-ui-text-100 mb-3">Most Used Flags</h4>
          <div className="space-y-3">
            {flagUsage.map(([flagKey, stats]) => (
              <div key={flagKey} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-ui-text-100">{flagKey}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex-1 bg-ui-surface-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(stats.enabled / stats.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-ui-text-400">
                      {Math.round((stats.enabled / stats.total) * 100)}%
                    </span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm font-medium text-ui-text-200">{stats.total}</p>
                  <p className="text-xs text-ui-text-400">uses</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-ui-surface-100 rounded-lg p-4">
          <h4 className="font-medium text-ui-text-100 mb-3">Recent Activity</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {analytics.slice(-20).reverse().map((entry, index) => (
              <div key={index} className="flex items-center justify-between py-1">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${entry.enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm text-ui-text-200">{entry.flagKey}</span>
                  <span className="text-xs text-ui-text-400">({entry.source})</span>
                </div>
                <span className="text-xs text-ui-text-400">
                  {entry.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Flags View Component  
const FlagsView: React.FC<{
  flags: [string, FeatureFlag][]
  onToggleFlag: (flagKey: FeatureFlagKey, currentEnabled: boolean) => void
}> = ({ flags, onToggleFlag }) => {
  // Helper functions (moved inside component)
  const getCategoryIcon = (category: FeatureFlag['category']) => {
    const icons = {
      core: '⚡',
      game: '🎮',
      ai: '🤖',
      ui: '🎨',
      social: '👥',
      performance: '🚀',
      business: '💼',
    }
    return icons[category] || '🏳️'
  }

  const getRolloutColor = (percentage: number) => {
    if (percentage === 100) return 'bg-green-500'
    if (percentage >= 50) return 'bg-yellow-500'
    if (percentage > 0) return 'bg-orange-500'
    return 'bg-red-500'
  }
  return (
    <div className="overflow-y-auto h-full">
      <div className="p-6 space-y-4">
        {flags.map(([flagKey, flag]) => (
          <motion.div
            key={flagKey}
            layout
            className="bg-ui-surface-100 rounded-lg p-4 border border-ui-border-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-lg">{getCategoryIcon(flag.category)}</span>
                  <div>
                    <h4 className="font-medium text-ui-text-100">{flagKey}</h4>
                    <p className="text-sm text-ui-text-400">{flag.category}</p>
                  </div>
                </div>
                
                <p className="text-sm text-ui-text-300 mb-3">{flag.description}</p>
                
                <div className="flex items-center space-x-4 text-xs text-ui-text-400">
                  <div className="flex items-center space-x-1">
                    <span>Rollout:</span>
                    <div className={`w-2 h-2 rounded-full ${getRolloutColor(flag.rolloutPercentage)}`} />
                    <span>{flag.rolloutPercentage}%</span>
                  </div>
                  
                  <div>
                    Environments: {flag.environments.join(', ')}
                  </div>
                  
                  {flag.expiresAt && (
                    <div>
                      Expires: {flag.expiresAt.toLocaleDateString()}
                    </div>
                  )}
                  
                  {flag.metadata?.override && (
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded">
                      Overridden
                    </span>
                  )}
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={() => onToggleFlag(flagKey as FeatureFlagKey, flag.enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  flag.enabled 
                    ? 'bg-neon-blue' 
                    : 'bg-ui-surface-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    flag.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default FeatureFlagsPanel