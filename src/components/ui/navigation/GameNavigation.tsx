/**
 * 🧭 Game Navigation - Navigation Component for Game Modes
 * 
 * Provides navigation between different game modes with:
 * - Visual indicators for current mode
 * - Accessibility features
 * - Responsive design
 * - Feature flag integration
 * - Keyboard shortcuts display
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, 
  Map, 
  Sword, 
  Calendar, 
  Heart,
  Settings,
  User,
  Menu,
  X,
  ChevronRight,
  Gamepad2
} from 'lucide-react'

// Hooks and context
import { useGameNavigation } from '@/router/GameRouter'
import { useGameMode, useLayoutState } from '@components/ui/GameUI/GameModeRouter'
import { useFeatureFlag } from '@hooks/useFeatureFlags'
import { useAuthStore } from '@hooks/useAuthStore'

// Types
import type { GameMode } from '@components/ui/GameUI/GameModeRouter'

interface NavigationItem {
  mode: GameMode
  label: string
  icon: React.ComponentType<any>
  shortcut: string
  description: string
  requiresFeature?: string
  color: string
}

// Navigation configuration
const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    mode: 'conversation',
    label: '대화',
    icon: MessageCircle,
    shortcut: 'Alt+1',
    description: 'AI와 자유로운 대화를 나눠보세요',
    color: 'text-blue-400 border-blue-400 bg-blue-400/10',
  },
  {
    mode: 'exploration',
    label: '탐험',
    icon: Map,
    shortcut: 'Alt+2',
    description: '새로운 장소를 탐험해보세요',
    requiresFeature: 'exploration_mode',
    color: 'text-green-400 border-green-400 bg-green-400/10',
  },
  {
    mode: 'battle',
    label: '전투',
    icon: Sword,
    shortcut: 'Alt+3',
    description: '전략적 전투를 경험해보세요',
    color: 'text-red-400 border-red-400 bg-red-400/10',
  },
  {
    mode: 'daily_activity',
    label: '일상',
    icon: Calendar,
    shortcut: 'Alt+4',
    description: '일상 활동을 함께해보세요',
    requiresFeature: 'daily_activities',
    color: 'text-yellow-400 border-yellow-400 bg-yellow-400/10',
  },
  {
    mode: 'emotion_sync',
    label: '감정교감',
    icon: Heart,
    shortcut: 'Alt+5',
    description: '깊은 감정적 유대를 쌓아보세요',
    color: 'text-pink-400 border-pink-400 bg-pink-400/10',
  },
]

// Mobile navigation item
const MobileNavItem: React.FC<{
  item: NavigationItem
  isActive: boolean
  isDisabled: boolean
  onClick: () => void
}> = ({ item, isActive, isDisabled, onClick }) => {
  const Icon = item.icon
  
  return (
    <motion.button
      whileHover={{ scale: isDisabled ? 1 : 1.05 }}
      whileTap={{ scale: isDisabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        relative p-3 rounded-xl border transition-all duration-200
        ${isActive 
          ? `${item.color} shadow-lg` 
          : isDisabled 
            ? 'text-ui-text-600 border-ui-border-200 bg-ui-surface-100/50 cursor-not-allowed'
            : 'text-ui-text-300 border-ui-border-200 bg-ui-surface-100 hover:bg-ui-surface-200'
        }
      `}
    >
      <Icon size={20} />
      {isActive && (
        <motion.div
          layoutId="mobile-nav-indicator"
          className="absolute -bottom-1 left-1/2 w-2 h-2 bg-current rounded-full"
          style={{ transform: 'translateX(-50%)' }}
        />
      )}
    </motion.button>
  )
}

// Desktop navigation item
const DesktopNavItem: React.FC<{
  item: NavigationItem
  isActive: boolean
  isDisabled: boolean
  onClick: () => void
}> = ({ item, isActive, isDisabled, onClick }) => {
  const Icon = item.icon
  
  return (
    <motion.button
      whileHover={{ scale: isDisabled ? 1 : 1.02 }}
      whileTap={{ scale: isDisabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        relative flex items-center space-x-3 px-4 py-3 rounded-lg border transition-all duration-200 min-w-[200px]
        ${isActive 
          ? `${item.color} shadow-md` 
          : isDisabled 
            ? 'text-ui-text-600 border-ui-border-200 bg-ui-surface-100/50 cursor-not-allowed'
            : 'text-ui-text-300 border-ui-border-200 bg-ui-surface-100 hover:bg-ui-surface-200 hover:border-ui-border-300'
        }
      `}
    >
      <Icon size={20} />
      <div className="flex-1 text-left">
        <div className="font-medium">{item.label}</div>
        <div className="text-xs text-ui-text-400">{item.shortcut}</div>
      </div>
      {isActive && (
        <motion.div
          layoutId="desktop-nav-indicator"
          className="absolute right-2 w-2 h-2 bg-current rounded-full"
        />
      )}
    </motion.button>
  )
}

// Main navigation component
export const GameNavigation: React.FC = () => {
  const { currentMode, canSwitchTo } = useGameMode()
  const { navigateToMode } = useGameNavigation()
  const { isMobile, isTablet } = useLayoutState()
  const { isAuthenticated } = useAuthStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showTooltips, setShowTooltips] = useState(false)
  
  // Check which navigation items are available
  const availableItems = NAVIGATION_ITEMS.filter(item => {
    if (!item.requiresFeature) return true
    return useFeatureFlag(item.requiresFeature as any)
  })
  
  const handleModeSwitch = (mode: GameMode) => {
    if (canSwitchTo(mode)) {
      navigateToMode(mode)
      setIsMenuOpen(false)
    }
  }
  
  // Mobile navigation
  if (isMobile || isTablet) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-dark-surface/95 backdrop-blur-sm border-t border-ui-border-100">
        {/* Mobile nav items */}
        <div className="flex justify-around items-center px-4 py-2 max-w-screen-sm mx-auto">
          {availableItems.map((item) => {
            const isActive = currentMode === item.mode
            const isDisabled = !canSwitchTo(item.mode)
            
            return (
              <MobileNavItem
                key={item.mode}
                item={item}
                isActive={isActive}
                isDisabled={isDisabled}
                onClick={() => handleModeSwitch(item.mode)}
              />
            )
          })}
          
          {/* Settings/Profile button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-3 rounded-xl border border-ui-border-200 bg-ui-surface-100 text-ui-text-300"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </motion.button>
        </div>
        
        {/* Mobile menu overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full left-0 right-0 bg-dark-surface border-t border-ui-border-100 p-4"
            >
              <div className="space-y-2 max-w-screen-sm mx-auto">
                <button className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg bg-ui-surface-100 text-ui-text-300 hover:bg-ui-surface-200">
                  <User size={20} />
                  <span>프로필</span>
                  <ChevronRight size={16} className="ml-auto" />
                </button>
                <button className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg bg-ui-surface-100 text-ui-text-300 hover:bg-ui-surface-200">
                  <Settings size={20} />
                  <span>설정</span>
                  <ChevronRight size={16} className="ml-auto" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }
  
  // Desktop navigation
  return (
    <div className="fixed top-4 left-4 z-40">
      {/* Desktop nav toggle */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="mb-4 p-3 rounded-lg bg-dark-surface/90 backdrop-blur-sm border border-ui-border-100 text-ui-text-300 hover:text-ui-text-100 hover:bg-ui-surface-200 transition-colors"
      >
        <Gamepad2 size={20} />
      </motion.button>
      
      {/* Desktop navigation menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.95 }}
            className="bg-dark-surface/95 backdrop-blur-sm rounded-xl border border-ui-border-100 p-4 shadow-xl min-w-[280px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-ui-text-100">게임 모드</h3>
              <button
                onClick={() => setShowTooltips(!showTooltips)}
                className="text-xs text-ui-text-400 hover:text-ui-text-300"
              >
                {showTooltips ? '설명 숨기기' : '설명 보기'}
              </button>
            </div>
            
            {/* Navigation items */}
            <div className="space-y-2">
              {availableItems.map((item) => {
                const isActive = currentMode === item.mode
                const isDisabled = !canSwitchTo(item.mode)
                
                return (
                  <div key={item.mode} className="relative">
                    <DesktopNavItem
                      item={item}
                      isActive={isActive}
                      isDisabled={isDisabled}
                      onClick={() => handleModeSwitch(item.mode)}
                    />
                    
                    {/* Tooltip/Description */}
                    <AnimatePresence>
                      {showTooltips && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-1 px-4 text-xs text-ui-text-400"
                        >
                          {item.description}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
            
            {/* Separator */}
            <div className="border-t border-ui-border-200 my-4" />
            
            {/* Additional options */}
            <div className="space-y-2">
              <button className="flex items-center space-x-3 w-full px-4 py-2 rounded-lg text-ui-text-300 hover:bg-ui-surface-100 transition-colors">
                <User size={16} />
                <span className="text-sm">프로필</span>
              </button>
              <button className="flex items-center space-x-3 w-full px-4 py-2 rounded-lg text-ui-text-300 hover:bg-ui-surface-100 transition-colors">
                <Settings size={16} />
                <span className="text-sm">설정</span>
              </button>
            </div>
            
            {/* ESC hint */}
            <div className="mt-4 pt-3 border-t border-ui-border-200">
              <p className="text-xs text-ui-text-400 text-center">
                ESC 키로 대화 모드로 돌아가기
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default GameNavigation