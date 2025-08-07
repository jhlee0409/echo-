// Authentication Services
export { AuthManager, getAuthManager } from './AuthManager'
export { SessionManager } from './SessionManager'
export { SecurityValidator, getSecurityValidator } from './SecurityValidator'

// Types
export type {
  // Core auth types
  AuthUser,
  AuthSession,
  UserProfile,
  GameAuthContext,
  
  // Request/Response types
  SignUpRequest,
  SignUpResponse,
  SignInRequest,
  SignInResponse,
  PasswordResetRequest,
  PasswordUpdateRequest,
  ProfileUpdateRequest,
  OAuthSignInRequest,
  
  // Security types
  SecuritySettings,
  SessionInfo,
  DeviceInfo,
  TrustedDevice,
  LoginAttempt,
  
  // MFA types
  MFASetupRequest,
  MFASetupResponse,
  MFAVerificationRequest,
  
  // Role and permission types
  UserRole,
  Permission,
  SubscriptionTier,
  SubscriptionStatus,
  SubscriptionLimits,
  
  // OAuth types
  OAuthProvider,
  
  // Error types
  AuthErrorResponse,
  AuthErrorCode,
  
  // Validation types
  PasswordRequirements,
  UsernameRequirements,
  
  // Event types
  AuthEvent,
  AuthEventPayload,
  
  // Analytics types
  AuthAnalytics,
  UserActivity
} from './types'

// Constants
export const AUTH_EVENTS = {
  SIGNED_IN: 'SIGNED_IN',
  SIGNED_OUT: 'SIGNED_OUT',
  TOKEN_REFRESHED: 'TOKEN_REFRESHED',
  USER_UPDATED: 'USER_UPDATED',
  PASSWORD_RECOVERY: 'PASSWORD_RECOVERY',
  MFA_CHALLENGE_ISSUED: 'MFA_CHALLENGE_ISSUED',
  MFA_VERIFIED: 'MFA_VERIFIED',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  SESSION_EXPIRED: 'SESSION_EXPIRED'
} as const

export const USER_ROLES = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
  DEVELOPER: 'developer'
} as const

export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PREMIUM: 'premium',
  PRO: 'pro',
  ENTERPRISE: 'enterprise'
} as const

export const OAUTH_PROVIDERS = {
  GOOGLE: 'google',
  DISCORD: 'discord',
  GITHUB: 'github',
  KAKAO: 'kakao',
  NAVER: 'naver'
} as const

export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  PASSWORD_TOO_WEAK: 'PASSWORD_TOO_WEAK',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  USERNAME_TAKEN: 'USERNAME_TAKEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  MFA_REQUIRED: 'MFA_REQUIRED',
  MFA_INVALID: 'MFA_INVALID',
  RATE_LIMITED: 'RATE_LIMITED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR'
} as const

// Utility functions
export const createAuthContext = (user: AuthUser, profile: UserProfile) => {
  return {
    user,
    profile,
    isAuthenticated: true,
    hasPermission: (permission: string) => {
      // Implementation would check user's role permissions
      return true
    },
    canAccessFeature: (feature: string) => {
      // Implementation would check subscription tier
      return true
    }
  }
}

export const formatAuthError = (error: any): string => {
  if (!error) return '알 수 없는 오류가 발생했습니다'
  
  const errorMessages: Record<string, string> = {
    'Invalid login credentials': '이메일 또는 비밀번호가 잘못되었습니다',
    'Email not confirmed': '이메일 인증을 완료해주세요',
    'User already registered': '이미 등록된 이메일 주소입니다',
    'Password should be at least 8 characters': '비밀번호는 8자 이상이어야 합니다',
    'Email rate limit exceeded': '이메일 전송 한도를 초과했습니다. 잠시 후 다시 시도해주세요',
    'Network request failed': '네트워크 연결을 확인해주세요'
  }

  return errorMessages[error.message] || error.message || '오류가 발생했습니다'
}

export const validateAuthToken = (token: string): boolean => {
  if (!token || typeof token !== 'string') return false
  
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return false
    
    // Decode the payload to check expiry
    const payload = JSON.parse(atob(parts[1]))
    const now = Math.floor(Date.now() / 1000)
    
    return payload.exp > now
  } catch {
    return false
  }
}

export const getPermissionsForRole = (role: UserRole): Permission[] => {
  const permissions: Record<UserRole, Permission[]> = {
    user: [
      'read:profile', 'write:profile',
      'read:companions', 'write:companions',
      'read:messages', 'write:messages'
    ],
    moderator: [
      'read:profile', 'write:profile',
      'read:companions', 'write:companions', 'delete:companions',
      'read:messages', 'write:messages', 'delete:messages'
    ],
    admin: [
      'read:profile', 'write:profile',
      'read:companions', 'write:companions', 'delete:companions',
      'read:messages', 'write:messages', 'delete:messages',
      'admin:users', 'admin:analytics'
    ],
    developer: [
      'read:profile', 'write:profile',
      'read:companions', 'write:companions', 'delete:companions',
      'read:messages', 'write:messages', 'delete:messages',
      'admin:users', 'admin:analytics', 'admin:system'
    ]
  }
  
  return permissions[role] || permissions.user
}

export const getLimitsForTier = (tier: SubscriptionTier): SubscriptionLimits => {
  const limits: Record<SubscriptionTier, SubscriptionLimits> = {
    free: {
      maxCompanions: 1,
      maxDailyMessages: 50,
      maxStoredMessages: 1000,
      aiProviderAccess: ['mock'],
      premiumFeatures: []
    },
    premium: {
      maxCompanions: 3,
      maxDailyMessages: 200,
      maxStoredMessages: 10000,
      aiProviderAccess: ['mock', 'claude'],
      premiumFeatures: ['voice_chat', 'custom_personality']
    },
    pro: {
      maxCompanions: 10,
      maxDailyMessages: 500,
      maxStoredMessages: 50000,
      aiProviderAccess: ['mock', 'claude', 'openai'],
      premiumFeatures: ['voice_chat', 'custom_personality', 'advanced_emotions', 'custom_avatar']
    },
    enterprise: {
      maxCompanions: -1,
      maxDailyMessages: -1,
      maxStoredMessages: -1,
      aiProviderAccess: ['mock', 'claude', 'openai'],
      premiumFeatures: ['all']
    }
  }
  
  return limits[tier] || limits.free
}