/**
 * 🎮 Game App - Main Game Application Container
 *
 * Central container that orchestrates:
 * - Game UI Provider integration
 * - Game Router integration
 * - Feature flag management
 * - Global game state
 * - Performance optimization
 */

import React, { Suspense, useEffect } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

// Router and context providers
import GameRouter from '@/router/GameRouter'
import { GameUIProvider } from '@components/ui/GameUI/GameModeRouter'

// Feature flags
import { FeatureFlagProvider } from '@services/feature-flags'
import { useFeatureFlag } from '@hooks/useFeatureFlags'

// Components
import { LoadingScreen } from '@components'
import { FeatureFlagsPanel } from '@components/admin/FeatureFlagsPanel'

// Hooks
import { useGameStore } from '@hooks/useGameStore'
import { bootstrapServiceIntegration } from '@services/integration'

// Service Testing (development only)
import { runServiceIntegrationTest } from '@utils/serviceTest'
import { ENV, isDevelopment } from '@config/env'

// Performance optimization
const ResponsiveLayout = React.lazy(
  () => import('@components/ui/responsive/ResponsiveLayout')
)

// Error fallback component
const GameErrorFallback = ({
  error,
  resetErrorBoundary,
}: {
  error: Error
  resetErrorBoundary: () => void
}) => (
  <div className="flex min-h-screen items-center justify-center bg-dark-navy p-4">
    <div className="border-ui-border-100 max-w-md rounded-xl border bg-dark-surface p-8 text-center">
      <div className="mb-4 text-6xl">💥</div>
      <h1 className="mb-4 text-2xl font-bold text-red-400">
        게임 오류가 발생했습니다
      </h1>
      <p className="text-ui-text-300 mb-4 text-sm">{error.message}</p>
      <div className="space-x-4">
        <button onClick={resetErrorBoundary} className="btn-neon">
          다시 시도
        </button>
        <button
          onClick={() => window.location.reload()}
          className="btn-secondary"
        >
          페이지 새로고침
        </button>
      </div>
    </div>
  </div>
)

// Game initialization component
const GameInitializer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { initialize, isInitialized, error } = useGameStore()

  useEffect(() => {
    if (!isInitialized && !error) {
      initialize()
      
      // 서비스 통합 시스템 부트스트랩 (중복 호출 안전)
      bootstrapServiceIntegration().catch(e => {
        console.error('Service Integration bootstrap failed:', e)
      })
      
      // 개발 모드에서만 서비스 테스트 실행
      if (isDevelopment && ENV.ENABLE_DEBUG_MODE) {
        console.log('🧪 Running service integration test in development mode...')
        runServiceIntegrationTest().then(results => {
          console.group('🧪 Service Integration Test Results')
          results.forEach(result => {
            const icon = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌'
            console.log(`${icon} ${result.service}: ${result.message}`)
            if (result.details) {
              console.log('Details:', result.details)
            }
          })
          console.groupEnd()
          
          // 전역 객체에 테스트 함수들 노출 (개발용)
          if (typeof window !== 'undefined') {
            // @ts-ignore
            window.testServices = runServiceIntegrationTest
          }
        }).catch(e => {
          console.warn('Service integration test failed:', e)
        })
      }
    }
  }, [initialize, isInitialized, error])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark-navy">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-400">
            게임 초기화 실패
          </h1>
          <p className="mb-6 text-gray-300">{error}</p>
          <button onClick={initialize} className="btn-neon">
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  if (!isInitialized) {
    return <LoadingScreen />
  }

  return <>{children}</>
}

// Performance monitoring component
const PerformanceMonitor: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const performanceEnabled = useFeatureFlag('performance_monitoring')

  useEffect(() => {
    if (!performanceEnabled) return

    // Performance monitoring setup
    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries()
      entries.forEach(entry => {
        if (entry.entryType === 'measure') {
          console.log(`Performance: ${entry.name} took ${entry.duration}ms`)
        }
      })
    })

    observer.observe({ entryTypes: ['measure'] })

    return () => observer.disconnect()
  }, [performanceEnabled])

  return <>{children}</>
}

// Feature flag debugging
const FeatureFlagDebug: React.FC = () => {
  const [showPanel, setShowPanel] = React.useState(false)
  const debugMode = useFeatureFlag('debug_mode')

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + F to toggle feature flags panel
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault()
        setShowPanel(!showPanel)
      }
    }

    if (debugMode) {
      document.addEventListener('keydown', handleKeyPress)
      return () => document.removeEventListener('keydown', handleKeyPress)
    }
  }, [debugMode, showPanel])

  if (!debugMode) return null

  return (
    <FeatureFlagsPanel
      isOpen={showPanel}
      onClose={() => setShowPanel(false)}
      isAdmin={true}
    />
  )
}

// Main GameApp component
const GameApp: React.FC = () => {
  const newUIEnabled = useFeatureFlag('new_ui_design')

  return (
    <ErrorBoundary FallbackComponent={GameErrorFallback}>
      <FeatureFlagProvider>
        <GameUIProvider>
          <PerformanceMonitor>
            <GameInitializer>
              <div className="relative min-h-screen overflow-hidden bg-dark-navy text-ui-text-50">
                {/* Responsive Layout Container */}
                {newUIEnabled ? (
                  <Suspense fallback={<LoadingScreen />}>
                    <ResponsiveLayout>
                      <GameRouter />
                    </ResponsiveLayout>
                  </Suspense>
                ) : (
                  <GameRouter />
                )}

                {/* Animation System - integrated via individual components */}

                {/* Feature Flag Debug Panel */}
                <FeatureFlagDebug />

                {/* Development helpers */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-ui-text-400 fixed bottom-4 right-4 rounded bg-dark-surface/80 px-2 py-1 font-mono text-xs">
                    Game App v0.1.0
                  </div>
                )}
              </div>
            </GameInitializer>
          </PerformanceMonitor>
        </GameUIProvider>
      </FeatureFlagProvider>
    </ErrorBoundary>
  )
}

export default GameApp
