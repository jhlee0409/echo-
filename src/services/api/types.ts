/**
 * API Bridge Type Definitions
 * 
 * Comprehensive type system for API communication
 */

import type { EmotionType, GameMode } from '@types'

// API Error Types
export type APIErrorCode = 
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMIT'
  | 'AUTHENTICATION'
  | 'SERVER_ERROR'
  | 'TIMEOUT'
  | 'UNKNOWN'

export interface APIError {
  code: APIErrorCode
  message: string
  details?: unknown
  retryable: boolean
  timestamp: number
}

// API Response Wrapper
export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: APIError
  metadata?: {
    requestId: string
    processingTime: number
    serverTime: number
  }
}

// Conversation API Types
export interface ConversationRequest {
  message: string
  context?: {
    characterId: string
    currentMode: GameMode
    emotionalContext: EmotionType
    conversationDepth: number
  }
  options?: {
    streamResponse?: boolean
    maxTokens?: number
    temperature?: number
  }
}

export interface ConversationResponse {
  content: string
  emotion: EmotionType
  suggestions?: string[]
  topicTransition?: {
    from: string
    to: string
    confidence: number
  }
  metadata?: {
    tokensUsed: number
    modelVersion: string
    confidence: number
  }
}

// Character API Types
export interface CharacterUpdateRequest {
  characterId: string
  updates: {
    personality?: Record<string, number>
    emotion?: {
      type: EmotionType
      intensity: number
    }
    memory?: {
      content: string
      importance: number
      tags: string[]
    }
  }
  reason: string
}

export interface CharacterStateResponse {
  characterId: string
  name: string
  personality: Record<string, number>
  currentEmotion: {
    type: EmotionType
    intensity: number
    stability: number
  }
  relationship: {
    intimacy: number
    trust: number
    milestones: string[]
  }
  stats: {
    totalInteractions: number
    averageMood: number
    personalityEvolution: Record<string, number>
  }
}

// Game State API Types
export interface SaveGameRequest {
  userId?: string
  saveSlot?: number
  data: {
    gameState: {
      level: number
      experience: number
      playTime: number
      unlockedFeatures: string[]
      currentScene: string
    }
    characterState: {
      id: string
      personality: Record<string, number>
      relationship: {
        intimacy: number
        trust: number
      }
      memories: Array<{
        id: string
        content: string
        timestamp: number
      }>
    }
    conversationState: {
      recentMessages: number
      topics: string[]
      moodProgression: EmotionType[]
    }
  }
  metadata: {
    version: string
    timestamp: number
    checksum?: string
  }
}

export interface SaveGameResponse {
  saveId: string
  slot: number
  timestamp: number
  cloudSync: boolean
}

export interface LoadGameRequest {
  userId?: string
  saveId?: string
  slot?: number
}

export interface LoadGameResponse {
  saveId: string
  data: SaveGameRequest['data']
  metadata: {
    createdAt: number
    lastModified: number
    playTime: number
    version: string
  }
}

// Analytics API Types
export interface AnalyticsEvent {
  eventType: 
    | 'conversation_start'
    | 'conversation_end'
    | 'emotion_change'
    | 'level_up'
    | 'milestone_reached'
    | 'error_occurred'
  data: Record<string, unknown>
  timestamp: number
  sessionId: string
}

export interface AnalyticsRequest {
  events: AnalyticsEvent[]
  context: {
    userId?: string
    sessionId: string
    deviceInfo?: {
      platform: string
      browser: string
      screenSize: string
    }
  }
}

// Content API Types
export interface ContentRequest {
  type: 'dialogue' | 'story' | 'activity' | 'tip'
  context: {
    characterId: string
    relationshipLevel: number
    currentEmotion: EmotionType
    recentTopics: string[]
  }
  preferences?: {
    tone: 'casual' | 'formal' | 'playful' | 'serious'
    length: 'short' | 'medium' | 'long'
    complexity: 'simple' | 'moderate' | 'complex'
  }
}

export interface ContentResponse {
  content: {
    id: string
    type: string
    text: string
    metadata?: Record<string, unknown>
  }
  alternatives?: Array<{
    id: string
    text: string
    tone: string
  }>
  nextSuggestions?: string[]
}

// Sync API Types
export interface SyncRequest {
  lastSyncTime: number
  changes: Array<{
    type: 'game' | 'character' | 'conversation' | 'settings'
    operation: 'create' | 'update' | 'delete'
    data: unknown
    timestamp: number
  }>
}

export interface SyncResponse {
  syncTime: number
  conflicts: Array<{
    type: string
    localVersion: unknown
    serverVersion: unknown
    resolution: 'local' | 'server' | 'merge'
  }>
  serverChanges: Array<{
    type: string
    operation: string
    data: unknown
  }>
}

// WebSocket Types for real-time features
export interface WSMessage {
  type: 'ping' | 'pong' | 'message' | 'emotion' | 'sync' | 'error'
  data?: unknown
  timestamp: number
}

export interface WSConnectionState {
  connected: boolean
  latency: number
  reconnectAttempts: number
  lastError?: string
}