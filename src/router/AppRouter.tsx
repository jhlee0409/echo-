/**
 * 🧭 App Router - Application-Level Routing System
 *
 * Main routing system that handles:
 * - Authentication routes (login, signup, reset)
 * - Game routes (main game screens)
 * - Admin routes (development tools)
 * - Public routes (landing, about)
 * - Protected routes with authentication
 */

import React, { Suspense } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

// Feature flags integration
import { useFeatureFlag } from '@hooks/useFeatureFlags'
import { FeatureGate } from '@services/feature-flags'

// Loading and error components
import { LoadingScreen, ErrorBoundary } from '@components'

// Lazy-loaded route components for code splitting
const GameApp = React.lazy(() => import('@/components/screens/GameApp'))
const AuthScreen = React.lazy(() => import('@/components/auth/AuthScreen'))
const LandingPage = React.lazy(() => import('@/components/pages/LandingPage'))
const ProfilePage = React.lazy(() => import('@/components/pages/ProfilePage'))
const SettingsPage = React.lazy(() => import('@/components/pages/SettingsPage'))
const AdminPanel = React.lazy(() => import('@/components/admin/AdminPanel'))
const NotFoundPage = React.lazy(() => import('@/components/pages/NotFoundPage'))

// Game mode specific screens
const ConversationScreen = React.lazy(
  () => import('@/components/screens/ConversationScreen')
)
const ExplorationScreen = React.lazy(
  () => import('@/components/screens/ExplorationScreen')
)
const BattleScreen = React.lazy(
  () => import('@/components/screens/BattleScreen')
)
const DailyActivityScreen = React.lazy(
  () => import('@/components/screens/DailyActivityScreen')
)
const EmotionSyncScreen = React.lazy(
  () => import('@/components/screens/EmotionSyncScreen')
)

// Authentication hooks
import { useAuthStore } from '@hooks/useAuthStore'
import { useGameStore } from '@hooks/useGameStore'

// Route protection component
interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireAdmin?: boolean
  fallbackRoute?: string
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = false,
  requireAdmin = false,
  fallbackRoute = '/auth',
}) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuthStore()

  // Show loading while checking authentication
  if (isLoading) {
    return <LoadingScreen />
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={fallbackRoute} replace />
  }

  // Check admin requirement
  if (requireAdmin && (!isAuthenticated || !isAdmin)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}

// Route transition wrapper
const RouteTransition: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <div key={location.pathname}>{children}</div>
    </AnimatePresence>
  )
}

// Game routing component (handles game mode routing)
const GameRouter: React.FC = () => {
  return (
    <Routes>
      {/* Main game screen with mode router */}
      <Route path="/" element={<GameApp />} />

      {/* Individual game mode screens */}
      <Route path="/conversation" element={<ConversationScreen />} />
      <Route
        path="/exploration"
        element={
          <FeatureGate
            flag="exploration_mode"
            fallback={<Navigate to="/conversation" />}
          >
            <ExplorationScreen />
          </FeatureGate>
        }
      />
      <Route path="/battle" element={<BattleScreen />} />
      <Route
        path="/daily"
        element={
          <FeatureGate
            flag="daily_activities"
            fallback={<Navigate to="/conversation" />}
          >
            <DailyActivityScreen />
          </FeatureGate>
        }
      />
      <Route path="/emotion-sync" element={<EmotionSyncScreen />} />

      {/* Character and settings */}
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/settings" element={<SettingsPage />} />

      {/* Catch-all redirect to main game */}
      <Route path="*" element={<Navigate to="/conversation" replace />} />
    </Routes>
  )
}

// Main app router component
const AppRouter: React.FC = () => {
  const { isAuthenticated } = useAuthStore()
  const { isInitialized } = useGameStore()

  // Feature flags for different sections
  const enableAdminPanel = useFeatureFlag('debug_mode')
  const enableAuth = useFeatureFlag('analytics') // Using analytics as auth proxy

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <RouteTransition>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              {/* Public landing page */}
              <Route
                path="/landing"
                element={
                  <FeatureGate flag="new_ui_design">
                    <LandingPage />
                  </FeatureGate>
                }
              />

              {/* Authentication routes */}
              {enableAuth && (
                <Route
                  path="/auth/*"
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <AuthScreen />
                    </ProtectedRoute>
                  }
                />
              )}

              {/* Admin panel (development only) */}
              {enableAdminPanel && (
                <Route
                  path="/admin/*"
                  element={
                    <ProtectedRoute requireAuth={true} requireAdmin={true}>
                      <AdminPanel />
                    </ProtectedRoute>
                  }
                />
              )}

              {/* Unauthorized page */}
              <Route
                path="/unauthorized"
                element={
                  <div className="flex min-h-screen items-center justify-center bg-dark-navy">
                    <div className="text-center">
                      <h1 className="mb-4 text-2xl font-bold text-red-400">
                        접근 권한이 없습니다
                      </h1>
                      <p className="text-ui-text-300 mb-6">
                        이 페이지에 접근할 권한이 없습니다.
                      </p>
                      <button
                        onClick={() => window.history.back()}
                        className="btn-neon"
                      >
                        돌아가기
                      </button>
                    </div>
                  </div>
                }
              />

              {/* Main game routes */}
              <Route
                path="/game/*"
                element={
                  <ProtectedRoute requireAuth={enableAuth}>
                    <GameRouter />
                  </ProtectedRoute>
                }
              />

              {/* Root redirect logic */}
              <Route
                path="/"
                element={
                  isAuthenticated && isInitialized ? (
                    <Navigate to="/game/conversation" replace />
                  ) : enableAuth ? (
                    <Navigate to="/auth" replace />
                  ) : (
                    <Navigate to="/game/conversation" replace />
                  )
                }
              />

              {/* 404 page */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </RouteTransition>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default AppRouter

// Export route constants for easy reference
export const ROUTES = {
  // Public routes
  LANDING: '/landing',

  // Auth routes
  AUTH: '/auth',
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  RESET: '/auth/reset',

  // Game routes
  GAME_ROOT: '/game',
  CONVERSATION: '/game/conversation',
  EXPLORATION: '/game/exploration',
  BATTLE: '/game/battle',
  DAILY: '/game/daily',
  EMOTION_SYNC: '/game/emotion-sync',
  PROFILE: '/game/profile',
  SETTINGS: '/game/settings',

  // Admin routes
  ADMIN: '/admin',
  ADMIN_FLAGS: '/admin/flags',
  ADMIN_USERS: '/admin/users',
  ADMIN_ANALYTICS: '/admin/analytics',

  // Error routes
  NOT_FOUND: '/404',
  UNAUTHORIZED: '/unauthorized',
} as const

// Navigation helper functions
export const useAppNavigation = () => {
  const navigate = React.useCallback(
    (route: string, options?: { replace?: boolean }) => {
      if (typeof window !== 'undefined') {
        const method = options?.replace ? 'replaceState' : 'pushState'
        window.history[method](null, '', route)
        window.dispatchEvent(new PopStateEvent('popstate'))
      }
    },
    []
  )

  return {
    navigate,
    goToGame: () => navigate(ROUTES.CONVERSATION),
    goToAuth: () => navigate(ROUTES.AUTH),
    goToLanding: () => navigate(ROUTES.LANDING),
    goToProfile: () => navigate(ROUTES.PROFILE),
    goToSettings: () => navigate(ROUTES.SETTINGS),
    goToAdmin: () => navigate(ROUTES.ADMIN),
    goBack: () => window.history.back(),
    goForward: () => window.history.forward(),
  }
}
