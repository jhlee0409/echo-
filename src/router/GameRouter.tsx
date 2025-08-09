/**
 * 🎮 Game Router - Game Mode Routing System
 *
 * Enhanced game mode routing that integrates with:
 * - React Router for URL-based navigation
 * - GameUIProvider for state management
 * - Feature flags for conditional routes
 * - Animation transitions between modes
 */

import React, { useEffect, Suspense } from 'react'
import {
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate,
} from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

// Game UI context and routing
import {
  useGameUI,
  useGameMode,
  GameMode,
} from '@components/ui/GameUI/GameModeRouter'
import { useFeatureFlag } from '@hooks/useFeatureFlags'
import { FeatureGate } from '@services/feature-flags'

// Components
import { LoadingScreen } from '@components'

// Lazy-loaded game screens
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

// Game navigation component
import { GameNavigation } from '@/components/ui/navigation/GameNavigation'

// Route to GameMode mapping
const ROUTE_TO_MODE: Record<string, GameMode> = {
  '/game/conversation': 'conversation',
  '/game/exploration': 'exploration',
  '/game/battle': 'battle',
  '/game/daily': 'daily_activity',
  '/game/emotion-sync': 'emotion_sync',
}

const MODE_TO_ROUTE: Record<GameMode, string> = {
  conversation: '/game/conversation',
  exploration: '/game/exploration',
  battle: '/game/battle',
  daily_activity: '/game/daily',
  emotion_sync: '/game/emotion-sync',
}

// Route transition animations
const routeVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}
const routeTransition = { duration: 0.3, ease: 'easeInOut' }

// Game mode synchronization component
const GameModeSync: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentMode, switchMode, canSwitchTo, isTransitioning } =
    useGameMode()

  // Sync URL with game mode
  useEffect(() => {
    const targetMode = ROUTE_TO_MODE[location.pathname]

    if (targetMode && targetMode !== currentMode && !isTransitioning) {
      if (canSwitchTo(targetMode)) {
        switchMode(targetMode, { transition: false }) // Disable UI transition for URL changes
      } else {
        // Redirect to current mode if target mode is not available
        navigate(MODE_TO_ROUTE[currentMode], { replace: true })
      }
    }
  }, [
    location.pathname,
    currentMode,
    switchMode,
    canSwitchTo,
    isTransitioning,
    navigate,
  ])

  // Sync game mode with URL (disabled to prevent navigation loops)
  // URL -> mode is the source of truth; do not push on mode change.
  useEffect(() => {
    // no-op
  }, [currentMode])

  return <>{children}</>
}

// Game screen wrapper with loading states
interface GameScreenProps {
  children: React.ReactNode
  mode: GameMode
  requiresFeature?: string
}

const GameScreen: React.FC<GameScreenProps> = ({
  children,
  mode,
  requiresFeature,
}) => {
  const { isMode } = useGameMode()
  const isCurrentMode = isMode(mode)

  if (requiresFeature) {
    return (
      <FeatureGate
        flag={requiresFeature as any}
        fallback={<Navigate to="/game/conversation" replace />}
      >
        <motion.div
          key={mode}
          variants={routeVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={routeTransition}
          className={`min-h-screen ${isCurrentMode ? 'block' : 'hidden'}`}
        >
          <Suspense fallback={<LoadingScreen />}>{children}</Suspense>
        </motion.div>
      </FeatureGate>
    )
  }

  return (
    <motion.div
      key={mode}
      variants={routeVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={routeTransition}
      className={`min-h-screen ${isCurrentMode ? 'block' : 'hidden'}`}
    >
      <Suspense fallback={<LoadingScreen />}>{children}</Suspense>
    </motion.div>
  )
}

// Main game router component
const GameRouter: React.FC = () => {
  const location = useLocation()
  const { state } = useGameUI()

  // Feature flag checks
  const explorationEnabled = useFeatureFlag('exploration_mode')
  const dailyActivitiesEnabled = useFeatureFlag('daily_activities')
  // const multiplayerEnabled = useFeatureFlag('multiplayer_mode')
  const advancedBattleEnabled = useFeatureFlag('advanced_battle')

  return (
    <div className="relative min-h-screen bg-dark-navy text-ui-text-50">
      {/* Game Navigation */}
      <GameNavigation />

      {/* Route synchronization */}
      <GameModeSync>
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            {/* Conversation Mode (Default) */}
            <Route
              path="/conversation"
              element={
                <GameScreen mode="conversation">
                  <ConversationScreen />
                </GameScreen>
              }
            />

            {/* Exploration Mode */}
            <Route
              path="/exploration"
              element={
                explorationEnabled ? (
                  <GameScreen
                    mode="exploration"
                    requiresFeature="exploration_mode"
                  >
                    <ExplorationScreen />
                  </GameScreen>
                ) : (
                  <Navigate to="/conversation" replace />
                )
              }
            />

            {/* Battle Mode */}
            <Route
              path="/battle"
              element={
                <GameScreen mode="battle">
                  <BattleScreen enhanced={advancedBattleEnabled} />
                </GameScreen>
              }
            />

            {/* Daily Activities Mode */}
            <Route
              path="/daily"
              element={
                dailyActivitiesEnabled ? (
                  <GameScreen
                    mode="daily_activity"
                    requiresFeature="daily_activities"
                  >
                    <DailyActivityScreen />
                  </GameScreen>
                ) : (
                  <Navigate to="/conversation" replace />
                )
              }
            />

            {/* Emotion Sync Mode */}
            <Route
              path="/emotion-sync"
              element={
                <GameScreen mode="emotion_sync">
                  <EmotionSyncScreen />
                </GameScreen>
              }
            />

            {/* Default redirect to conversation */}
            <Route path="/" element={<Navigate to="/conversation" replace />} />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/conversation" replace />} />
          </Routes>
        </AnimatePresence>
      </GameModeSync>

      {/* Debug information (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="border-ui-border-100 text-ui-text-300 fixed bottom-4 left-4 rounded-lg border bg-dark-surface p-2 font-mono text-xs">
          <div>Mode: {state.currentMode}</div>
          <div>Route: {location.pathname}</div>
          <div>Transitioning: {state.isTransitioning ? 'Yes' : 'No'}</div>
          {state.previousMode && <div>From: {state.previousMode}</div>}
        </div>
      )}
    </div>
  )
}

export default GameRouter

// Hook for game mode navigation
export const useGameNavigation = () => {
  const navigate = useNavigate()
  const { switchMode, canSwitchTo, currentMode } = useGameMode()

  const navigateToMode = React.useCallback(
    (mode: GameMode, options?: { force?: boolean }) => {
      if (options?.force || canSwitchTo(mode)) {
        const route = MODE_TO_ROUTE[mode]
        navigate(route)
        switchMode(mode)
      }
    },
    [navigate, switchMode, canSwitchTo]
  )

  return {
    navigateToMode,
    currentMode,
    canSwitchTo,

    // Convenience methods
    goToConversation: () => navigateToMode('conversation'),
    goToExploration: () => navigateToMode('exploration'),
    goToBattle: () => navigateToMode('battle'),
    goToDailyActivity: () => navigateToMode('daily_activity'),
    goToEmotionSync: () => navigateToMode('emotion_sync'),

    // Check current mode
    isConversation: currentMode === 'conversation',
    isExploration: currentMode === 'exploration',
    isBattle: currentMode === 'battle',
    isDailyActivity: currentMode === 'daily_activity',
    isEmotionSync: currentMode === 'emotion_sync',
  }
}

// Export route constants
export const GAME_ROUTES = {
  CONVERSATION: '/game/conversation',
  EXPLORATION: '/game/exploration',
  BATTLE: '/game/battle',
  DAILY: '/game/daily',
  EMOTION_SYNC: '/game/emotion-sync',
} as const

// Export mode mappings
export { MODE_TO_ROUTE, ROUTE_TO_MODE }
