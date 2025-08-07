// Service exports
export {
  UserProfileService,
  CompanionService,
  GameStateService,
  MessageService,
  UserSettingsService,
  GameDataService,
} from './database'

// AI Services
export {
  AIManager,
  CacheManager,
  CostOptimizer,
  PromptEngine,
  ClaudeProvider,
  MockProvider,
  getAIManager,
} from './ai'

// Authentication Services
export {
  AuthManager,
  SessionManager,
  SecurityValidator,
  getAuthManager,
  getSecurityValidator,
  AUTH_EVENTS,
  USER_ROLES,
  SUBSCRIPTION_TIERS,
  OAUTH_PROVIDERS,
  AUTH_ERROR_CODES,
  formatAuthError,
  validateAuthToken,
  getPermissionsForRole,
  getLimitsForTier,
} from './auth'

// Re-export types
export type {
  // AI Types
  AIProvider,
  AIRequest,
  AIResponse,
  AIProviderError,
} from './ai'

export type {
  // Auth Types
  AuthUser,
  AuthSession,
  UserProfile,
  GameAuthContext,
  SignUpRequest,
  SignInRequest,
  UserRole,
  Permission,
  SubscriptionTier,
  AuthErrorResponse,
} from './auth'

export type {
  // Database Types
  Database,
  UserProfileRow,
  CompanionRow,
  GameStateRow,
  MessageRow,
  UserSettingsRow,
} from '../lib/supabase'
