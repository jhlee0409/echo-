/**
 * State Adapter Interface Definitions
 * 
 * Type-safe contracts for domain-specific state adapters
 */

import type { 
  GameState, 
  AICompanion, 
  Message, 
  Settings, 
  EmotionType, 
  GameMode 
} from '@types'

// Base adapter interface
export interface StateAdapter<T> {
  // Core state access
  getState(): T
  subscribe(listener: (state: T) => void): () => void
  
  // State validation
  isValid(): boolean
  getErrors(): string[]
  
  // Persistence
  persist(): Promise<void>
  hydrate(): Promise<void>
  
  // Reset functionality
  reset(): void
}

// Game state adapter API
export interface GameStateAPI extends StateAdapter<GameState> {
  // Level & Progress
  getLevel(): number
  getExperience(): number
  addExperience(amount: number): void
  canLevelUp(): boolean
  levelUp(): void
  
  // Game flow
  startNewGame(): void
  continueGame(): void
  pauseGame(): void
  
  // Save management
  saveGame(): Promise<void>
  loadGame(saveId?: string): Promise<void>
  getSaveSlots(): Promise<SaveSlot[]>
  
  // Feature unlocks
  unlockFeature(feature: string): void
  isFeatureUnlocked(feature: string): boolean
  getUnlockedFeatures(): string[]
  
  // Statistics
  incrementConversationCount(): void
  updatePlayTime(seconds: number): void
  getStatistics(): GameStatistics
}

// Character state adapter API
export interface CharacterStateAPI extends StateAdapter<AICompanion> {
  // Basic info
  getCharacter(): AICompanion | null
  getCharacterName(): string
  setCharacterName(name: string): void
  
  // Emotions
  getCurrentEmotion(): EmotionType
  getEmotionIntensity(): number
  updateEmotion(emotion: EmotionType, intensity: number): void
  
  // Relationships
  getIntimacyLevel(): number
  getTrustLevel(): number
  updateRelationship(intimacy: number, trust: number): void
  
  // Personality
  getPersonalityTraits(): Record<string, number>
  updatePersonalityTrait(trait: string, value: number): void
  
  // Memory
  addMemory(memory: Memory): void
  getRecentMemories(count: number): Memory[]
  searchMemories(query: string): Memory[]
  
  // Progress
  addRelationshipMilestone(milestone: string): void
  getRelationshipMilestones(): string[]
}

// Conversation state adapter API
export interface ConversationStateAPI extends StateAdapter<Message[]> {
  // Message management
  sendMessage(content: string): Promise<void>
  addMessage(message: Message): void
  getMessages(page?: number, pageSize?: number): Message[]
  getTotalMessageCount(): number
  
  // Conversation flow
  isAIResponding(): boolean
  getLastUserMessage(): Message | null
  getLastAIMessage(): Message | null
  
  // Context
  getCurrentTopic(): string | null
  setCurrentTopic(topic: string): void
  getConversationContext(): ConversationContext
  
  // History management
  clearConversation(): void
  archiveOldMessages(beforeDate: Date): Promise<void>
  exportConversation(): Promise<string>
  
  // Analysis
  getConversationStats(): ConversationStats
  getSentimentHistory(): SentimentData[]
}

// Settings state adapter API
export interface SettingsStateAPI extends StateAdapter<Settings> {
  // Audio settings
  isSoundEnabled(): boolean
  toggleSound(): void
  setSoundVolume(volume: number): void
  
  isMusicEnabled(): boolean
  toggleMusic(): void
  setMusicVolume(volume: number): void
  
  // Visual settings
  isDarkMode(): boolean
  toggleDarkMode(): void
  
  areAnimationsEnabled(): boolean
  toggleAnimations(): void
  
  // Language
  getLanguage(): string
  setLanguage(lang: string): void
  getSupportedLanguages(): string[]
  
  // System
  isAutoSaveEnabled(): boolean
  toggleAutoSave(): void
  getAutoSaveInterval(): number
  setAutoSaveInterval(minutes: number): void
  
  // Privacy
  areNotificationsEnabled(): boolean
  toggleNotifications(): void
  
  // Debug
  isDebugMode(): boolean
  toggleDebugMode(): void
}

// UI state adapter API (for GameModeRouter context)
export interface UIStateAPI {
  // Mode management
  getCurrentMode(): GameMode
  switchMode(mode: GameMode, options?: SwitchOptions): void
  canSwitchToMode(mode: GameMode): boolean
  
  // Character display
  getCharacterDisplayState(): CharacterDisplayState
  updateCharacterDisplay(updates: Partial<CharacterDisplayState>): void
  
  // Layout
  getLayoutInfo(): LayoutInfo
  isBreakpoint(breakpoint: 'mobile' | 'tablet' | 'desktop'): boolean
  
  // Animations
  getAnimationSettings(): AnimationSettings
  setAnimationEnabled(animation: string, enabled: boolean): void
  
  // Interaction
  getInteractionMode(): InteractionMode
  setUserTyping(isTyping: boolean): void
  
  // Transitions
  isTransitioning(): boolean
  getTransitionProgress(): number
}

// Supporting types
export interface SaveSlot {
  id: string
  name: string
  timestamp: number
  level: number
  playTime: number
  thumbnail?: string
}

export interface GameStatistics {
  totalPlayTime: number
  conversationCount: number
  daysSinceStart: number
  achievementsUnlocked: number
  completionPercentage: number
}

export interface Memory {
  id: string
  content: string
  timestamp: number
  emotion: EmotionType
  importance: number
  tags: string[]
}

export interface ConversationContext {
  currentTopic: string | null
  recentTopics: string[]
  moodHistory: EmotionType[]
  responseStyle: string
}

export interface ConversationStats {
  totalMessages: number
  userMessages: number
  aiMessages: number
  averageResponseTime: number
  topicsDiscussed: string[]
}

export interface SentimentData {
  timestamp: number
  sentiment: 'positive' | 'neutral' | 'negative'
  confidence: number
}

export interface SwitchOptions {
  transition?: boolean
  duration?: number
  onComplete?: () => void
}

export interface CharacterDisplayState {
  emotion: EmotionType
  emotionIntensity: number
  isActive: boolean
  eyeBlinking: boolean
  lipSync: boolean
  expressionLevel: number
}

export interface LayoutInfo {
  breakpoint: 'mobile' | 'tablet' | 'desktop' | 'wide'
  orientation: 'portrait' | 'landscape'
  sidebarCollapsed: boolean
  panelHeight: number
}

export interface AnimationSettings {
  typingEffect: boolean
  emotionMorphing: boolean
  particleSystem: boolean
  specialMoments: boolean
}

export interface InteractionMode {
  type: 'quick_response' | 'free_text' | 'exploration' | 'battle'
  isTyping: boolean
  selectedOption: string | null
  lastInteractionTime: Date
}