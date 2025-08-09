/**
 * 🎨 UI State Adapter
 * 
 * Bridges GameModeRouter context with a clean adapter API
 * Manages UI-specific state separately from game data
 */

import { useGameUI, useGameMode, useCharacterState, useLayoutState, useAnimationState } from '@components/ui/GameUI/GameModeRouter'
import type { GameMode, EmotionType } from '@types'
import type { 
  UIStateAPI,
  CharacterDisplayState,
  LayoutInfo,
  AnimationSettings,
  InteractionMode,
  SwitchOptions
} from './types'

export class UIStateAdapter implements UIStateAPI {
  // Note: This adapter works differently as it wraps React Context
  // Cannot be used outside of React components
  
  private gameUI = useGameUI()
  private gameMode = useGameMode()
  private characterState = useCharacterState()
  private layoutState = useLayoutState()
  private animationState = useAnimationState()

  // Mode management
  getCurrentMode(): GameMode {
    return this.gameMode.currentMode
  }

  switchMode(mode: GameMode, options?: SwitchOptions): void {
    this.gameMode.switchMode(mode, {
      transition: options?.transition ?? true,
      duration: options?.duration ?? 500
    })
    
    if (options?.onComplete) {
      // Set up completion callback
      setTimeout(options.onComplete, options?.duration || 500)
    }
  }

  canSwitchToMode(mode: GameMode): boolean {
    return this.gameMode.canSwitchTo(mode)
  }

  // Character display
  getCharacterDisplayState(): CharacterDisplayState {
    const character = this.characterState.character
    return {
      emotion: character.emotion,
      emotionIntensity: character.emotionIntensity,
      isActive: character.isActive,
      eyeBlinking: character.eyeBlinking,
      lipSync: character.lipSync,
      expressionLevel: character.expressionLevel
    }
  }

  updateCharacterDisplay(updates: Partial<CharacterDisplayState>): void {
    this.characterState.updateCharacterState(updates)
  }

  // Layout
  getLayoutInfo(): LayoutInfo {
    return {
      breakpoint: this.layoutState.layout.breakpoint,
      orientation: this.layoutState.layout.orientation,
      sidebarCollapsed: this.layoutState.layout.sidebarCollapsed,
      panelHeight: this.layoutState.layout.panelHeight
    }
  }

  isBreakpoint(breakpoint: 'mobile' | 'tablet' | 'desktop'): boolean {
    switch (breakpoint) {
      case 'mobile':
        return this.layoutState.isMobile
      case 'tablet':
        return this.layoutState.isTablet
      case 'desktop':
        return this.layoutState.isDesktop
      default:
        return false
    }
  }

  // Animations
  getAnimationSettings(): AnimationSettings {
    return { ...this.animationState.animations }
  }

  setAnimationEnabled(animation: string, enabled: boolean): void {
    if (animation in this.animationState.animations) {
      this.animationState.toggleAnimation(
        animation as keyof AnimationSettings, 
        enabled
      )
    }
  }

  // Interaction
  getInteractionMode(): InteractionMode {
    const interaction = this.gameUI.state.interaction
    return {
      type: interaction.inputMode,
      isTyping: interaction.isTyping,
      selectedOption: interaction.selectedOption,
      lastInteractionTime: interaction.lastInteractionTime
    }
  }

  setUserTyping(isTyping: boolean): void {
    this.gameUI.setInteractionState({ isTyping })
  }

  // Transitions
  isTransitioning(): boolean {
    return this.gameMode.isTransitioning
  }

  getTransitionProgress(): number {
    // Estimate based on transition state
    if (!this.isTransitioning()) return 1
    
    // Would need to track actual progress
    // For now, return 0.5 as midpoint
    return 0.5
  }
}

// Factory function for creating UI adapter within React components
export const createUIStateAdapter = () => {
  // This will only work inside React components with GameUIProvider
  return new UIStateAdapter()
}

// React hook version that's easier to use
export const useUIStateAdapter = (): Omit<UIStateAPI, keyof UIStateAdapter> => {
  const gameMode = useGameMode()
  const characterState = useCharacterState()
  const layoutState = useLayoutState()
  const animationState = useAnimationState()
  const gameUI = useGameUI()

  return {
    // Mode management
    getCurrentMode: () => gameMode.currentMode,
    switchMode: (mode: GameMode, options?: SwitchOptions) => {
      gameMode.switchMode(mode, {
        transition: options?.transition ?? true,
        duration: options?.duration ?? 500
      })
      
      if (options?.onComplete) {
        setTimeout(options.onComplete, options?.duration || 500)
      }
    },
    canSwitchToMode: (mode: GameMode) => gameMode.canSwitchTo(mode),

    // Character display
    getCharacterDisplayState: (): CharacterDisplayState => ({
      emotion: characterState.character.emotion,
      emotionIntensity: characterState.character.emotionIntensity,
      isActive: characterState.character.isActive,
      eyeBlinking: characterState.character.eyeBlinking,
      lipSync: characterState.character.lipSync,
      expressionLevel: characterState.character.expressionLevel
    }),
    updateCharacterDisplay: (updates: Partial<CharacterDisplayState>) => {
      characterState.updateCharacterState(updates)
    },

    // Layout
    getLayoutInfo: (): LayoutInfo => ({
      breakpoint: layoutState.layout.breakpoint,
      orientation: layoutState.layout.orientation,
      sidebarCollapsed: layoutState.layout.sidebarCollapsed,
      panelHeight: layoutState.layout.panelHeight
    }),
    isBreakpoint: (breakpoint: 'mobile' | 'tablet' | 'desktop'): boolean => {
      switch (breakpoint) {
        case 'mobile':
          return layoutState.isMobile
        case 'tablet':
          return layoutState.isTablet
        case 'desktop':
          return layoutState.isDesktop
        default:
          return false
      }
    },

    // Animations
    getAnimationSettings: (): AnimationSettings => ({ ...animationState.animations }),
    setAnimationEnabled: (animation: string, enabled: boolean) => {
      if (animation in animationState.animations) {
        animationState.toggleAnimation(
          animation as keyof AnimationSettings, 
          enabled
        )
      }
    },

    // Interaction
    getInteractionMode: (): InteractionMode => ({
      type: gameUI.state.interaction.inputMode,
      isTyping: gameUI.state.interaction.isTyping,
      selectedOption: gameUI.state.interaction.selectedOption,
      lastInteractionTime: gameUI.state.interaction.lastInteractionTime
    }),
    setUserTyping: (isTyping: boolean) => {
      gameUI.setInteractionState({ isTyping })
    },

    // Transitions
    isTransitioning: () => gameMode.isTransitioning,
    getTransitionProgress: () => {
      if (!gameMode.isTransitioning) return 1
      return 0.5 // Placeholder
    }
  }
}