// 소울메이트 게임 타입 정의
// Soulmate Game Type Definitions

export interface AICompanion {
  id: string
  name: string
  avatar?: string
  personalityTraits: PersonalityTraits
  relationshipStatus: RelationshipStatus
  currentEmotion: EmotionInfo
  memoryBank: MemoryBank
  conversationContext: AIConversationContext
  gameProgress: GameProgress
}

export interface EmotionInfo {
  dominant: EmotionType
  intensity: number
  stability: number
}

export interface MemoryBank {
  shortTerm: Memory[]
  longTerm: Memory[]
  preferences: Record<string, any>
  keyMoments: SpecialMoment[]
}

export interface GameProgress {
  unlockedFeatures: string[]
  completedEvents: string[]
  availableEvents: string[]
  relationshipMilestones: string[]
}

export interface PersonalityTraits {
  cheerful: number // 0-1
  careful: number // 0-1
  curious: number // 0-1
  emotional: number // 0-1
  independent: number // 0-1
  playful?: number // 0-1
  supportive?: number // 0-1
}

export interface RelationshipStatus {
  level: number // 1-10
  experience: number // current XP
  experienceToNext: number // XP needed for next level
  intimacyLevel: number // 0-1
  trustLevel: number // 0-1
}

export type RelationshipStage = 
  | 'stranger' 
  | 'acquaintance' 
  | 'friend' 
  | 'close_friend' 
  | 'best_friend'
  | 'soulmate'

export interface CompanionStats {
  hp: number
  mp: number
  atk: number
  def: number
  level: number
  exp: number
}

export interface AppearanceConfig {
  hairColor: string
  eyeColor: string
  outfit: string
  expressions: Record<EmotionType, string>
  animations: Record<string, string>
}

export interface Memory {
  id: string
  content: string
  emotion: EmotionType
  importance: number // 0-1
  timestamp: Date
  tags: string[]
}

export type EmotionType = 
  | 'happy' 
  | 'excited' 
  | 'calm' 
  | 'sad' 
  | 'surprised'
  | 'confused' 
  | 'angry'
  | 'neutral'
  | 'curious'
  | 'thoughtful'
  | 'playful'
  | 'caring'

export interface GameState {
  level: number
  experience: number
  conversationCount: number
  daysSinceStart: number
  playTime: number
  lastPlayed: number
  lastSaved: number | null
  isFirstTime: boolean
  currentScene: GameScene
  unlockedFeatures: string[]
  gameVersion: string
}

export type GameScene = 
  | 'main_room'
  | 'main_chat'
  | 'exploration' 
  | 'battle'
  | 'daily_activity'
  | 'special_event'

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'

export interface GameLocation {
  id: string
  name: string
  description: string
  backgroundImage: string
  availableActivities: Activity[]
}

export interface Activity {
  id: string
  name: string
  description: string
  requirements?: ActivityRequirement[]
  rewards?: ActivityReward[]
  duration: number // minutes
}

export interface ActivityRequirement {
  type: 'relationship_level' | 'item' | 'time_of_day'
  value: string | number
}

export interface ActivityReward {
  type: 'relationship_points' | 'item' | 'memory'
  value: string | number
}

export interface GameItem {
  id: string
  name: string
  description: string
  type: ItemType
  rarity: ItemRarity
  quantity: number
}

export type ItemType = 'gift' | 'consumable' | 'tool' | 'decoration'
export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface Achievement {
  id: string
  name: string
  description: string
  unlockedAt?: Date
  progress: number // 0-100
}

export interface GameSettings {
  language: 'ko' | 'en'
  soundEnabled: boolean
  musicVolume: number // 0-100
  sfxVolume: number // 0-100
  autoSaveEnabled: boolean
  darkMode: boolean
  accessibilityMode: boolean
  messageSpeed: 'slow' | 'normal' | 'fast'
}

// AI 시스템 관련 타입
export interface AIProvider {
  name: string
  generateResponse: (input: string, context: AIConversationContext) => Promise<string>
  getCost: (tokens: number) => number
  isAvailable: () => Promise<boolean>
}

export interface AIConversationContext {
  currentTopic: string | null
  recentTopics: string[]
  moodHistory: EmotionType[]
  responseStyle: 'friendly' | 'formal' | 'playful'
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  emotion?: EmotionType
  metadata?: MessageMetadata
}

export interface Message {
  id: string
  sender: 'user' | 'ai'
  content: string
  timestamp: number
  emotion?: EmotionType
}

export interface Settings {
  soundEnabled: boolean
  musicEnabled: boolean
  animationsEnabled: boolean
  darkMode: boolean
  language: 'ko' | 'en'
  notifications: boolean
  autoSave: boolean
  debugMode: boolean
}

export interface MessageMetadata {
  tokens: number
  provider: string
  processingTime: number
  cached: boolean
}

export interface UserPreferences {
  preferredTopics: string[]
  communicationStyle: 'formal' | 'casual' | 'playful'
  contentFilters: ContentFilter[]
  customInstructions?: string
}

export interface ContentFilter {
  type: string
  enabled: boolean
  strictness: 'low' | 'medium' | 'high'
}

// API 응답 타입
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: APIError
  timestamp: Date
}

export interface APIError {
  code: string
  message: string
  details?: Record<string, any>
}

// 특별한 순간 및 이벤트
export interface SpecialMoment {
  id: string
  type: SpecialMomentType
  title: string
  description: string
  unlockedAt: Date
  rarity: 'common' | 'rare' | 'legendary'
}

export type SpecialMomentType = 
  | 'first_meeting'
  | 'level_up'
  | 'heart_sync'
  | 'special_date'
  | 'anniversary'
  | 'confession'

// UI 상태 타입
export interface UIState {
  currentView: GameScene
  isLoading: boolean
  error: string | null
  modals: ModalState[]
  notifications: Notification[]
}

export interface ModalState {
  id: string
  type: string
  isOpen: boolean
  data?: any
}

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  duration?: number
  actions?: NotificationAction[]
}

export interface NotificationAction {
  label: string
  action: () => void
  style?: 'primary' | 'secondary'
}