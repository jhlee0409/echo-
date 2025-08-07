import { User, Session, AuthError } from '@supabase/supabase-js'
import { EmotionType } from '@types'

// User Authentication Types
export interface AuthUser extends User {
  user_metadata: {
    display_name?: string
    avatar_url?: string
    language?: string
    timezone?: string
  }
  app_metadata: {
    role?: UserRole
    subscription?: SubscriptionTier
  }
}

export interface AuthSession extends Session {
  user: AuthUser
}

// User Profile Types
export interface UserProfile {
  id: string
  username: string | null
  display_name: string | null
  email: string
  avatar_url: string | null
  language: string
  timezone: string
  role: UserRole
  subscription_tier: SubscriptionTier
  subscription_status: SubscriptionStatus
  created_at: string
  updated_at: string
  last_active: string
  is_public: boolean
  allow_analytics: boolean
  email_verified: boolean
  phone_verified: boolean
}

// Role-Based Access Control
export type UserRole = 'user' | 'moderator' | 'admin' | 'developer'

export type Permission = 
  | 'read:profile'
  | 'write:profile'
  | 'read:companions'
  | 'write:companions'
  | 'delete:companions'
  | 'read:messages'
  | 'write:messages'
  | 'delete:messages'
  | 'admin:users'
  | 'admin:analytics'
  | 'admin:system'

export interface RolePermissions {
  [key: string]: Permission[]
}

// Subscription Management
export type SubscriptionTier = 'free' | 'premium' | 'pro' | 'enterprise'
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'past_due' | 'trialing'

export interface SubscriptionLimits {
  maxCompanions: number
  maxDailyMessages: number
  maxStoredMessages: number
  aiProviderAccess: string[]
  premiumFeatures: string[]
}

// Authentication Flows
export interface SignUpRequest {
  email: string
  password: string
  display_name?: string
  language?: string
  timezone?: string
  referral_code?: string
}

export interface SignUpResponse {
  user: AuthUser | null
  session: AuthSession | null
  error: AuthError | null
  requires_verification: boolean
}

export interface SignInRequest {
  email: string
  password: string
  remember_me?: boolean
}

export interface SignInResponse {
  user: AuthUser | null
  session: AuthSession | null
  error: AuthError | null
  requires_mfa?: boolean
}

export interface PasswordResetRequest {
  email: string
  redirect_url?: string
}

export interface PasswordUpdateRequest {
  current_password?: string
  new_password: string
}

export interface ProfileUpdateRequest {
  display_name?: string
  username?: string
  avatar_url?: string
  language?: string
  timezone?: string
  is_public?: boolean
  allow_analytics?: boolean
}

// OAuth Providers
export type OAuthProvider = 'google' | 'discord' | 'github' | 'kakao' | 'naver'

export interface OAuthSignInRequest {
  provider: OAuthProvider
  redirect_url?: string
  scopes?: string[]
}

// Session Management
export interface SessionInfo {
  session_id: string
  user_id: string
  device_info: DeviceInfo
  ip_address: string
  user_agent: string
  created_at: string
  last_active: string
  expires_at: string
  is_current: boolean
}

export interface DeviceInfo {
  device_type: 'desktop' | 'mobile' | 'tablet'
  os: string
  browser: string
  location?: string
}

// Security Features
export interface SecuritySettings {
  two_factor_enabled: boolean
  backup_codes_generated: boolean
  trusted_devices: TrustedDevice[]
  login_notifications: boolean
  suspicious_activity_alerts: boolean
  session_timeout: number // minutes
}

export interface TrustedDevice {
  id: string
  device_name: string
  device_fingerprint: string
  created_at: string
  last_used: string
}

export interface LoginAttempt {
  id: string
  user_id: string | null
  email: string
  ip_address: string
  user_agent: string
  success: boolean
  failure_reason: string | null
  attempted_at: string
  location?: string
}

// Multi-Factor Authentication
export interface MFASetupRequest {
  method: 'totp' | 'sms' | 'email'
  phone_number?: string
}

export interface MFASetupResponse {
  secret?: string // For TOTP
  qr_code?: string // For TOTP
  backup_codes: string[]
  method: 'totp' | 'sms' | 'email'
}

export interface MFAVerificationRequest {
  code: string
  method: 'totp' | 'sms' | 'email' | 'backup'
}

// Game-Specific Auth Context
export interface GameAuthContext {
  user: AuthUser
  profile: UserProfile
  subscription: SubscriptionLimits
  permissions: Permission[]
  companion_access: boolean
  message_quota: {
    daily_used: number
    daily_limit: number
    monthly_used: number
    monthly_limit: number
  }
  feature_flags: {
    [feature: string]: boolean
  }
}

// Authentication Events
export type AuthEvent = 
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY'
  | 'MFA_CHALLENGE_ISSUED'
  | 'MFA_VERIFIED'
  | 'SUSPICIOUS_ACTIVITY'
  | 'SESSION_EXPIRED'

export interface AuthEventPayload {
  event: AuthEvent
  user_id?: string
  session_id?: string
  timestamp: string
  metadata?: Record<string, any>
}

// Error Types
export interface AuthErrorResponse {
  code: string
  message: string
  details?: Record<string, any>
  recoverable: boolean
  suggested_action?: string
}

export type AuthErrorCode = 
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_NOT_VERIFIED'
  | 'ACCOUNT_LOCKED'
  | 'PASSWORD_TOO_WEAK'
  | 'EMAIL_ALREADY_EXISTS'
  | 'USERNAME_TAKEN'
  | 'SESSION_EXPIRED'
  | 'MFA_REQUIRED'
  | 'MFA_INVALID'
  | 'RATE_LIMITED'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'

// Validation Schemas
export interface PasswordRequirements {
  min_length: number
  require_uppercase: boolean
  require_lowercase: boolean
  require_numbers: boolean
  require_symbols: boolean
  disallow_common: boolean
  disallow_personal_info: boolean
}

export interface UsernameRequirements {
  min_length: number
  max_length: number
  allowed_characters: string
  disallow_reserved: string[]
}

// Analytics & Monitoring
export interface AuthAnalytics {
  total_users: number
  active_sessions: number
  failed_login_attempts: number
  signup_rate: number
  churn_rate: number
  subscription_conversion: number
  security_incidents: number
}

export interface UserActivity {
  user_id: string
  session_id: string
  action: string
  timestamp: string
  metadata?: Record<string, any>
  ip_address?: string
  user_agent?: string
}