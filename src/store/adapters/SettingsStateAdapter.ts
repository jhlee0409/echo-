/**
 * ⚙️ Settings State Adapter
 * 
 * Manages user preferences and configuration
 * Provides type-safe API for settings management
 */

import { useStore } from '@store/gameStore'
import type { Settings } from '@types'
import type { SettingsStateAPI } from './types'

export class SettingsStateAdapter implements SettingsStateAPI {
  private unsubscribe: (() => void) | null = null
  private readonly SUPPORTED_LANGUAGES = ['ko', 'en', 'ja', 'zh']
  private readonly MIN_VOLUME = 0
  private readonly MAX_VOLUME = 100
  
  // Core state access
  getState(): Settings {
    const state = useStore.getState()
    if (!state.settings) {
      throw new Error('Settings not initialized')
    }
    return state.settings
  }

  subscribe(listener: (state: Settings) => void): () => void {
    this.unsubscribe = useStore.subscribe(
      (state) => {
        if (state.settings) {
          listener(state.settings)
        }
      }
    )
    return () => {
      if (this.unsubscribe) {
        this.unsubscribe()
        this.unsubscribe = null
      }
    }
  }

  // State validation
  isValid(): boolean {
    try {
      const settings = this.getState()
      return !!(
        settings &&
        typeof settings.soundEnabled === 'boolean' &&
        typeof settings.musicEnabled === 'boolean' &&
        typeof settings.darkMode === 'boolean' &&
        this.SUPPORTED_LANGUAGES.includes(settings.language)
      )
    } catch {
      return false
    }
  }

  getErrors(): string[] {
    const errors: string[] = []
    try {
      const settings = this.getState()
      
      if (!this.SUPPORTED_LANGUAGES.includes(settings.language)) {
        errors.push(`Unsupported language: ${settings.language}`)
      }
      
      // Check for invalid boolean values
      const booleanFields = [
        'soundEnabled', 
        'musicEnabled', 
        'animationsEnabled',
        'darkMode',
        'notifications',
        'autoSave',
        'debugMode'
      ]
      
      booleanFields.forEach(field => {
        if (typeof settings[field as keyof Settings] !== 'boolean') {
          errors.push(`Invalid ${field}: must be boolean`)
        }
      })
    } catch (error) {
      errors.push(`Settings validation error: ${error}`)
    }
    
    return errors
  }

  // Persistence
  async persist(): Promise<void> {
    // Settings are persisted as part of game state
    await useStore.getState().saveGame()
    
    // Also update browser preferences
    this.applyBrowserSettings()
  }

  async hydrate(): Promise<void> {
    // Settings are hydrated as part of game state
    await useStore.getState().loadGame()
    
    // Apply loaded settings to browser
    this.applyBrowserSettings()
  }

  reset(): void {
    useStore.getState().resetGame()
    this.applyBrowserSettings()
  }

  // Audio settings
  isSoundEnabled(): boolean {
    return this.getState().soundEnabled
  }

  toggleSound(): void {
    const current = this.isSoundEnabled()
    useStore.getState().updateSettings({
      soundEnabled: !current
    })
    
    // Apply to audio system
    this.updateAudioSettings()
  }

  setSoundVolume(volume: number): void {
    if (volume < this.MIN_VOLUME || volume > this.MAX_VOLUME) {
      throw new Error(`Volume must be between ${this.MIN_VOLUME} and ${this.MAX_VOLUME}`)
    }
    
    // Store volume in settings (not in current interface, but useful extension)
    // For now, just ensure sound is enabled if volume > 0
    if (volume > 0 && !this.isSoundEnabled()) {
      this.toggleSound()
    }
  }

  isMusicEnabled(): boolean {
    return this.getState().musicEnabled
  }

  toggleMusic(): void {
    const current = this.isMusicEnabled()
    useStore.getState().updateSettings({
      musicEnabled: !current
    })
    
    // Apply to audio system
    this.updateAudioSettings()
  }

  setMusicVolume(volume: number): void {
    if (volume < this.MIN_VOLUME || volume > this.MAX_VOLUME) {
      throw new Error(`Volume must be between ${this.MIN_VOLUME} and ${this.MAX_VOLUME}`)
    }
    
    // Enable music if volume > 0
    if (volume > 0 && !this.isMusicEnabled()) {
      this.toggleMusic()
    }
  }

  // Visual settings
  isDarkMode(): boolean {
    return this.getState().darkMode
  }

  toggleDarkMode(): void {
    const current = this.isDarkMode()
    useStore.getState().updateSettings({
      darkMode: !current
    })
    
    // Apply theme
    this.applyTheme(!current)
  }

  areAnimationsEnabled(): boolean {
    return this.getState().animationsEnabled
  }

  toggleAnimations(): void {
    const current = this.areAnimationsEnabled()
    useStore.getState().updateSettings({
      animationsEnabled: !current
    })
    
    // Apply animation preference
    this.applyAnimationPreference(!current)
  }

  // Language
  getLanguage(): string {
    return this.getState().language
  }

  setLanguage(lang: string): void {
    if (!this.SUPPORTED_LANGUAGES.includes(lang)) {
      throw new Error(`Unsupported language: ${lang}`)
    }
    
    useStore.getState().updateSettings({
      language: lang
    })
    
    // Apply language change
    this.applyLanguage(lang)
  }

  getSupportedLanguages(): string[] {
    return [...this.SUPPORTED_LANGUAGES]
  }

  // System
  isAutoSaveEnabled(): boolean {
    return this.getState().autoSave
  }

  toggleAutoSave(): void {
    const current = this.isAutoSaveEnabled()
    useStore.getState().updateSettings({
      autoSave: !current
    })
    
    // Update auto-save system
    if (!current) {
      this.startAutoSave()
    } else {
      this.stopAutoSave()
    }
  }

  getAutoSaveInterval(): number {
    // Default to 5 minutes
    return 5 * 60 * 1000
  }

  setAutoSaveInterval(minutes: number): void {
    if (minutes < 1 || minutes > 60) {
      throw new Error('Auto-save interval must be between 1 and 60 minutes')
    }
    
    // Would store in settings if interface supported it
    // For now, just restart auto-save with new interval
    if (this.isAutoSaveEnabled()) {
      this.stopAutoSave()
      this.startAutoSave()
    }
  }

  // Privacy
  areNotificationsEnabled(): boolean {
    return this.getState().notifications
  }

  toggleNotifications(): void {
    const current = this.areNotificationsEnabled()
    useStore.getState().updateSettings({
      notifications: !current
    })
    
    // Request/revoke notification permission
    if (!current) {
      this.requestNotificationPermission()
    }
  }

  // Debug
  isDebugMode(): boolean {
    return this.getState().debugMode
  }

  toggleDebugMode(): void {
    const current = this.isDebugMode()
    useStore.getState().updateSettings({
      debugMode: !current
    })
    
    // Apply debug mode changes
    if (!current) {
      console.log('🐛 Debug mode enabled')
    } else {
      console.log('Debug mode disabled')
    }
  }

  // Private helper methods
  private applyBrowserSettings(): void {
    const settings = this.getState()
    
    this.applyTheme(settings.darkMode)
    this.applyLanguage(settings.language)
    this.applyAnimationPreference(settings.animationsEnabled)
    this.updateAudioSettings()
    
    if (settings.autoSave) {
      this.startAutoSave()
    }
  }

  private applyTheme(isDark: boolean): void {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  private applyLanguage(lang: string): void {
    document.documentElement.lang = lang
    // Would trigger i18n system here
  }

  private applyAnimationPreference(enabled: boolean): void {
    if (!enabled) {
      document.documentElement.classList.add('reduce-motion')
    } else {
      document.documentElement.classList.remove('reduce-motion')
    }
  }

  private updateAudioSettings(): void {
    // Would update global audio context here
    const settings = this.getState()
    console.log('Audio settings updated:', {
      sound: settings.soundEnabled,
      music: settings.musicEnabled
    })
  }

  private autoSaveInterval: NodeJS.Timeout | null = null

  private startAutoSave(): void {
    this.stopAutoSave()
    
    const interval = this.getAutoSaveInterval()
    this.autoSaveInterval = setInterval(() => {
      useStore.getState().saveGame()
        .then(() => console.log('Auto-save completed'))
        .catch((error) => console.error('Auto-save failed:', error))
    }, interval)
  }

  private stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval)
      this.autoSaveInterval = null
    }
  }

  private async requestNotificationPermission(): Promise<void> {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          // Revert the setting if permission denied
          useStore.getState().updateSettings({
            notifications: false
          })
        }
      } catch (error) {
        console.error('Failed to request notification permission:', error)
      }
    }
  }
}

// Singleton instance
let settingsStateAdapter: SettingsStateAdapter | null = null

export const getSettingsStateAdapter = (): SettingsStateAdapter => {
  if (!settingsStateAdapter) {
    settingsStateAdapter = new SettingsStateAdapter()
  }
  return settingsStateAdapter
}

// React hook for component usage
export const useSettingsStateAdapter = (): SettingsStateAdapter => {
  return getSettingsStateAdapter()
}