/**
 * 🎮 Game Mode Router - UI 모드 전환 및 상태 관리
 * 
 * 5가지 게임 모드 간의 전환과 상태 동기화를 담당
 * - 대화 모드 (기본)
 * - 탐험 모드  
 * - 전투 모드
 * - 일상 활동 모드
 * - 감정 교감 모드
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import type { EmotionType } from '@types'

// Game Mode 정의
export type GameMode = 
  | 'conversation'    // 메인 대화 모드
  | 'exploration'     // 탐험 모드
  | 'battle'          // 전투 화면
  | 'daily_activity'  // 일상 활동
  | 'emotion_sync'    // 감정 교감

// 게임 UI 상태 인터페이스
interface GameUIState {
  currentMode: GameMode
  previousMode: GameMode | null
  isTransitioning: boolean
  transitionDuration: number
  
  // AI 캐릭터 상태
  character: {
    emotion: EmotionType
    emotionIntensity: number
    intimacyLevel: number
    currentMood: string
    isActive: boolean
    eyeBlinking: boolean
    lipSync: boolean
    expressionLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7
  }
  
  // 사용자 인터랙션 상태
  interaction: {
    isTyping: boolean
    selectedOption: string | null
    inputMode: 'quick_response' | 'free_text' | 'exploration' | 'battle'
    lastInteractionTime: Date
  }
  
  // 레이아웃 상태
  layout: {
    breakpoint: 'mobile' | 'tablet' | 'desktop' | 'wide'
    orientation: 'portrait' | 'landscape'
    sidebarCollapsed: boolean
    panelHeight: number
  }
  
  // 애니메이션 상태
  animations: {
    typingEffect: boolean
    emotionMorphing: boolean
    particleSystem: boolean
    specialMoments: boolean
  }
}

// Action 타입 정의
type GameUIAction =
  | { type: 'SWITCH_MODE'; payload: { mode: GameMode; transition?: boolean } }
  | { type: 'UPDATE_CHARACTER_STATE'; payload: Partial<GameUIState['character']> }
  | { type: 'SET_INTERACTION_STATE'; payload: Partial<GameUIState['interaction']> }
  | { type: 'UPDATE_LAYOUT'; payload: Partial<GameUIState['layout']> }
  | { type: 'TOGGLE_ANIMATION'; payload: { animation: keyof GameUIState['animations']; enabled: boolean } }
  | { type: 'START_TRANSITION'; payload: { duration: number } }
  | { type: 'END_TRANSITION' }

// 초기 상태
const initialState: GameUIState = {
  currentMode: 'conversation',
  previousMode: null,
  isTransitioning: false,
  transitionDuration: 500,
  
  character: {
    emotion: 'neutral',
    emotionIntensity: 0.5,
    intimacyLevel: 1,
    currentMood: '평온',
    isActive: true,
    eyeBlinking: true,
    lipSync: false,
    expressionLevel: 3
  },
  
  interaction: {
    isTyping: false,
    selectedOption: null,
    inputMode: 'quick_response',
    lastInteractionTime: new Date()
  },
  
  layout: {
    breakpoint: 'desktop',
    orientation: 'landscape',
    sidebarCollapsed: false,
    panelHeight: 200
  },
  
  animations: {
    typingEffect: true,
    emotionMorphing: true,
    particleSystem: true,
    specialMoments: true
  }
}

// Reducer 함수
const gameUIReducer = (state: GameUIState, action: GameUIAction): GameUIState => {
  switch (action.type) {
    case 'SWITCH_MODE':
      return {
        ...state,
        previousMode: state.currentMode,
        currentMode: action.payload.mode,
        isTransitioning: action.payload.transition ?? true,
        interaction: {
          ...state.interaction,
          inputMode: getInputModeForGameMode(action.payload.mode),
          selectedOption: null
        }
      }
      
    case 'UPDATE_CHARACTER_STATE':
      return {
        ...state,
        character: {
          ...state.character,
          ...action.payload
        }
      }
      
    case 'SET_INTERACTION_STATE':
      return {
        ...state,
        interaction: {
          ...state.interaction,
          ...action.payload,
          lastInteractionTime: new Date()
        }
      }
      
    case 'UPDATE_LAYOUT':
      return {
        ...state,
        layout: {
          ...state.layout,
          ...action.payload
        }
      }
      
    case 'TOGGLE_ANIMATION':
      return {
        ...state,
        animations: {
          ...state.animations,
          [action.payload.animation]: action.payload.enabled
        }
      }
      
    case 'START_TRANSITION':
      return {
        ...state,
        isTransitioning: true,
        transitionDuration: action.payload.duration
      }
      
    case 'END_TRANSITION':
      return {
        ...state,
        isTransitioning: false
      }
      
    default:
      return state
  }
}

// Helper function: 게임 모드에 따른 입력 모드 결정
function getInputModeForGameMode(mode: GameMode): GameUIState['interaction']['inputMode'] {
  switch (mode) {
    case 'conversation':
      return 'quick_response'
    case 'exploration':
      return 'exploration'
    case 'battle':
      return 'battle'
    case 'daily_activity':
    case 'emotion_sync':
      return 'free_text'
    default:
      return 'quick_response'
  }
}

// Context 생성
interface GameUIContextType {
  state: GameUIState
  dispatch: React.Dispatch<GameUIAction>
  
  // 편의 함수들
  switchMode: (mode: GameMode, options?: { transition?: boolean; duration?: number }) => void
  updateCharacterState: (updates: Partial<GameUIState['character']>) => void
  setInteractionState: (updates: Partial<GameUIState['interaction']>) => void
  updateLayout: (updates: Partial<GameUIState['layout']>) => void
  toggleAnimation: (animation: keyof GameUIState['animations'], enabled: boolean) => void
  
  // 상태 확인 함수들
  isMode: (mode: GameMode) => boolean
  canSwitchTo: (mode: GameMode) => boolean
  getCurrentTransition: () => string | null
}

const GameUIContext = createContext<GameUIContextType | null>(null)

// Provider 컴포넌트
export const GameUIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameUIReducer, initialState)
  
  // 편의 함수 구현
  const switchMode = useCallback((
    mode: GameMode, 
    options: { transition?: boolean; duration?: number } = {}
  ) => {
    const { transition = true, duration = 500 } = options
    
    if (transition) {
      dispatch({ type: 'START_TRANSITION', payload: { duration } })
      
      setTimeout(() => {
        dispatch({ type: 'SWITCH_MODE', payload: { mode, transition: false } })
        
        setTimeout(() => {
          dispatch({ type: 'END_TRANSITION' })
        }, duration)
      }, 50) // 짧은 지연으로 전환 시작
    } else {
      dispatch({ type: 'SWITCH_MODE', payload: { mode, transition: false } })
    }
  }, [])
  
  const updateCharacterState = useCallback((updates: Partial<GameUIState['character']>) => {
    dispatch({ type: 'UPDATE_CHARACTER_STATE', payload: updates })
  }, [])
  
  const setInteractionState = useCallback((updates: Partial<GameUIState['interaction']>) => {
    dispatch({ type: 'SET_INTERACTION_STATE', payload: updates })
  }, [])
  
  const updateLayout = useCallback((updates: Partial<GameUIState['layout']>) => {
    dispatch({ type: 'UPDATE_LAYOUT', payload: updates })
  }, [])
  
  const toggleAnimation = useCallback((animation: keyof GameUIState['animations'], enabled: boolean) => {
    dispatch({ type: 'TOGGLE_ANIMATION', payload: { animation, enabled } })
  }, [])
  
  const isMode = useCallback((mode: GameMode) => {
    return state.currentMode === mode
  }, [state.currentMode])
  
  const canSwitchTo = useCallback((mode: GameMode) => {
    // 전환 중이거나 현재 모드와 같으면 불가능
    if (state.isTransitioning || state.currentMode === mode) {
      return false
    }
    
    // 특정 조건 확인 (예: 전투 모드는 전투 상황에서만)
    switch (mode) {
      case 'battle':
        // 전투 시스템이 활성화되어 있을 때만
        return true // TODO: 실제 전투 상태 확인 로직 추가
      case 'exploration':
        // 탐험 가능한 상황일 때만
        return true // TODO: 실제 탐험 가능 상태 확인 로직 추가
      default:
        return true
    }
  }, [state.isTransitioning, state.currentMode])
  
  const getCurrentTransition = useCallback(() => {
    if (!state.isTransitioning || !state.previousMode) return null
    return `${state.previousMode}-to-${state.currentMode}`
  }, [state.isTransitioning, state.previousMode, state.currentMode])
  
  // 브라우저 크기 변화 감지
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      let breakpoint: GameUIState['layout']['breakpoint']
      if (width >= 1920) breakpoint = 'wide'
      else if (width >= 1024) breakpoint = 'desktop'
      else if (width >= 768) breakpoint = 'tablet'
      else breakpoint = 'mobile'
      
      const orientation = width > height ? 'landscape' : 'portrait'
      
      updateLayout({
        breakpoint,
        orientation,
        sidebarCollapsed: breakpoint === 'mobile'
      })
    }
    
    handleResize() // 초기 설정
    window.addEventListener('resize', handleResize)
    
    return () => window.removeEventListener('resize', handleResize)
  }, [updateLayout])
  
  // 키보드 단축키 지원
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 전환 중에는 키보드 입력 무시
      if (state.isTransitioning) return
      
      // 모드 전환 단축키
      if (event.altKey) {
        switch (event.key) {
          case '1':
            event.preventDefault()
            if (canSwitchTo('conversation')) switchMode('conversation')
            break
          case '2':
            event.preventDefault()
            if (canSwitchTo('exploration')) switchMode('exploration')
            break
          case '3':
            event.preventDefault()
            if (canSwitchTo('battle')) switchMode('battle')
            break
          case '4':
            event.preventDefault()
            if (canSwitchTo('daily_activity')) switchMode('daily_activity')
            break
          case '5':
            event.preventDefault()
            if (canSwitchTo('emotion_sync')) switchMode('emotion_sync')
            break
        }
      }
      
      // ESC로 대화 모드로 돌아가기
      if (event.key === 'Escape' && state.currentMode !== 'conversation') {
        if (canSwitchTo('conversation')) {
          switchMode('conversation')
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [state.isTransitioning, state.currentMode, canSwitchTo, switchMode])
  
  const contextValue: GameUIContextType = {
    state,
    dispatch,
    switchMode,
    updateCharacterState,
    setInteractionState,
    updateLayout,
    toggleAnimation,
    isMode,
    canSwitchTo,
    getCurrentTransition
  }
  
  return (
    <GameUIContext.Provider value={contextValue}>
      {children}
    </GameUIContext.Provider>
  )
}

// Hook for using the context
export const useGameUI = (): GameUIContextType => {
  const context = useContext(GameUIContext)
  if (!context) {
    throw new Error('useGameUI must be used within a GameUIProvider')
  }
  return context
}

// Hook for specific mode checking
export const useGameMode = () => {
  const { state, isMode, canSwitchTo, switchMode } = useGameUI()
  
  return {
    currentMode: state.currentMode,
    previousMode: state.previousMode,
    isTransitioning: state.isTransitioning,
    isMode,
    canSwitchTo,
    switchMode
  }
}

// Hook for character state
export const useCharacterState = () => {
  const { state, updateCharacterState } = useGameUI()
  
  return {
    character: state.character,
    updateCharacterState
  }
}

// Hook for interaction state
export const useInteractionState = () => {
  const { state, setInteractionState } = useGameUI()
  
  return {
    interaction: state.interaction,
    setInteractionState
  }
}

// Hook for layout state
export const useLayoutState = () => {
  const { state, updateLayout } = useGameUI()
  
  return {
    layout: state.layout,
    updateLayout,
    isMobile: state.layout.breakpoint === 'mobile',
    isTablet: state.layout.breakpoint === 'tablet',
    isDesktop: state.layout.breakpoint === 'desktop' || state.layout.breakpoint === 'wide',
    isPortrait: state.layout.orientation === 'portrait'
  }
}

// Hook for animations
export const useAnimationState = () => {
  const { state, toggleAnimation } = useGameUI()
  
  return {
    animations: state.animations,
    toggleAnimation
  }
}

export default GameUIProvider