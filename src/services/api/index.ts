/**
 * API Services Exports
 * 
 * Central export point for all API bridge functionality
 */

export { APIBridge, getAPIBridge, useAPIBridge } from './APIBridge'
export { APIClient } from './APIClient'
export { WebSocketManager, useWebSocket } from './WebSocketManager'

// Type exports
export type {
  APIError,
  APIResponse,
  ConversationRequest,
  ConversationResponse,
  CharacterUpdateRequest,
  CharacterStateResponse,
  SaveGameRequest,
  SaveGameResponse,
  LoadGameRequest,
  LoadGameResponse,
  AnalyticsEvent,
  AnalyticsRequest,
  ContentRequest,
  ContentResponse,
  SyncRequest,
  SyncResponse,
  WSMessage,
  WSConnectionState
} from './types'

// Configuration
export interface APIConfig {
  baseURL?: string
  timeout?: number
  retries?: number
  mockMode?: boolean
  rateLimitPerMinute?: number
}

// Default configuration
export const DEFAULT_API_CONFIG: Required<APIConfig> = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
  retries: 3,
  mockMode: import.meta.env.DEV,
  rateLimitPerMinute: 60
}