/**
 * Auth API 타입 정의
 * execution-plan.md의 인증 시스템 기반
 */

export interface SignInRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignUpRequest {
  email: string;
  password: string;
  nickname: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface SignInResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    nickname: string;
    profile: UserProfile;
  };
  token: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  session: AuthSession;
}

export interface UserProfile {
  avatar?: string;
  preferences?: {
    language?: 'ko' | 'en' | 'ja';
    theme?: 'light' | 'dark' | 'auto';
    notifications?: {
      companion?: boolean;
      achievements?: boolean;
      system?: boolean;
    };
    accessibility?: {
      reduceMotion?: boolean;
      highContrast?: boolean;
      fontSize?: 'small' | 'medium' | 'large';
    };
  };
  subscription?: {
    tier: 'free' | 'premium';
    expiresAt?: string;
    features: string[];
  };
  statistics?: {
    joinDate: string;
    totalPlayTime: number;
    gamesPlayed: number;
    achievementsUnlocked: number;
  };
}

export interface AuthSession {
  id: string;
  userId: string;
  expiresAt: string;
  lastActivity: string;
  deviceInfo: {
    userAgent: string;
    ip: string;
    platform: string;
  };
}

export interface AuthErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: number;
    requestId: string;
  };
}

export interface RefreshResponse {
  success: boolean;
  token: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  session: AuthSession;
}

export interface SignUpResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    nickname: string;
  };
  emailVerificationSent: boolean;
  message: string;
}