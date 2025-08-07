import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthManager } from '../../services/auth/AuthManager';
import { SecurityValidator } from '../../services/auth/SecurityValidator';
import type { SignInRequest, SignInResponse, AuthErrorResponse } from './types';

/**
 * Auth Sign In API - execution-plan.md의 인증 시스템 구현
 * 
 * execution-plan.md 기반:
 * - Supabase (DB + 인증)
 * - JWT 토큰 기반 인증
 * - 보안 우선 설계
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST method is allowed',
        timestamp: Date.now(),
        requestId: generateRequestId()
      }
    });
  }

  try {
    // 1. 요청 데이터 검증
    const signInRequest: SignInRequest = req.body;
    const validationResult = validateSignInRequest(signInRequest);
    
    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validationResult.error,
          details: validationResult.details,
          timestamp: Date.now(),
          requestId: generateRequestId()
        }
      } as AuthErrorResponse);
    }

    // 2. 보안 검증 (브루트포스 방지 등)
    const securityValidator = new SecurityValidator();
    const securityCheck = await securityValidator.validateSignInAttempt(
      signInRequest.email,
      req.headers['x-forwarded-for'] as string || req.connection.remoteAddress || 'unknown'
    );

    if (!securityCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'TOO_MANY_ATTEMPTS',
          message: securityCheck.message || 'Too many sign-in attempts. Please try again later.',
          details: {
            retryAfter: securityCheck.retryAfter,
            attemptsRemaining: securityCheck.attemptsRemaining
          },
          timestamp: Date.now(),
          requestId: generateRequestId()
        }
      } as AuthErrorResponse);
    }

    // 3. 입력값 보안 처리
    const sanitizedEmail = securityValidator.sanitizeEmail(signInRequest.email);
    const isPasswordSecure = securityValidator.validatePasswordStrength(signInRequest.password);
    
    if (!isPasswordSecure.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password does not meet security requirements',
          details: isPasswordSecure.requirements,
          timestamp: Date.now(),
          requestId: generateRequestId()
        }
      } as AuthErrorResponse);
    }

    // 4. 로그인 시도
    const authManager = new AuthManager();
    
    try {
      const authResult = await authManager.signIn(sanitizedEmail, signInRequest.password);
      
      // 5. 성공 로그 기록
      await logAuthEvent('signin_success', {
        userId: authResult.user.id,
        email: sanitizedEmail,
        ip: req.headers['x-forwarded-for'] as string || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        timestamp: Date.now()
      });

      // 6. 세션 설정 (rememberMe 옵션 처리)
      const sessionDuration = signInRequest.rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30일 또는 1일
      
      // 7. 응답 생성
      const response: SignInResponse = {
        success: true,
        user: {
          id: authResult.user.id,
          email: authResult.user.email,
          nickname: authResult.user.user_metadata?.nickname || '',
          profile: authResult.user.user_metadata?.profile || {}
        },
        token: {
          access_token: authResult.session.access_token,
          refresh_token: authResult.session.refresh_token,
          expires_in: sessionDuration
        },
        session: {
          id: authResult.session.id || '',
          userId: authResult.user.id,
          expiresAt: new Date(Date.now() + sessionDuration * 1000).toISOString(),
          lastActivity: new Date().toISOString(),
          deviceInfo: {
            userAgent: req.headers['user-agent'] || '',
            ip: req.headers['x-forwarded-for'] as string || req.connection.remoteAddress || '',
            platform: detectPlatform(req.headers['user-agent'] || '')
          }
        }
      };

      // 8. 보안 헤더 설정
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');

      return res.status(200).json(response);

    } catch (authError: any) {
      // 로그인 실패 로그 기록
      await logAuthEvent('signin_failure', {
        email: sanitizedEmail,
        error: authError.message,
        ip: req.headers['x-forwarded-for'] as string || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        timestamp: Date.now()
      });

      // 구체적인 에러 메시지는 보안상 숨김
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
          timestamp: Date.now(),
          requestId: generateRequestId()
        }
      } as AuthErrorResponse);
    }

  } catch (error: any) {
    console.error('SignIn API Error:', error);
    
    await logAuthEvent('signin_error', {
      error: error.message,
      stack: error.stack,
      ip: req.headers['x-forwarded-for'] as string || req.connection.remoteAddress,
      timestamp: Date.now()
    });
    
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        timestamp: Date.now(),
        requestId: generateRequestId()
      }
    } as AuthErrorResponse);
  }
}

/**
 * 로그인 요청 검증
 */
function validateSignInRequest(request: any): { valid: boolean; error?: string; details?: any } {
  if (!request) {
    return { valid: false, error: 'Request body is required' };
  }

  if (!request.email || typeof request.email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  if (!request.password || typeof request.password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }

  // 이메일 형식 검증
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(request.email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  // 이메일 길이 제한
  if (request.email.length > 254) {
    return { valid: false, error: 'Email too long' };
  }

  // 패스워드 길이 제한
  if (request.password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }

  if (request.password.length > 128) {
    return { valid: false, error: 'Password too long' };
  }

  return { valid: true };
}

/**
 * 플랫폼 감지
 */
function detectPlatform(userAgent: string): string {
  if (/Android/i.test(userAgent)) return 'android';
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
  if (/Windows/i.test(userAgent)) return 'windows';
  if (/Macintosh/i.test(userAgent)) return 'macos';
  if (/Linux/i.test(userAgent)) return 'linux';
  return 'unknown';
}

/**
 * 인증 이벤트 로깅
 */
async function logAuthEvent(event: string, data: any): Promise<void> {
  // 실제 구현에서는 보안 로그 시스템에 기록
  console.log(`AUTH_EVENT: ${event}`, {
    ...data,
    // 민감한 정보는 해시화하여 기록
    email: data.email ? hashString(data.email) : undefined,
    ip: data.ip ? hashString(data.ip) : undefined
  });
}

/**
 * 문자열 해시화 (로깅용)
 */
function hashString(str: string): string {
  // 실제 구현에서는 crypto 모듈 사용
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit integer로 변환
  }
  return `hash_${Math.abs(hash).toString(36)}`;
}

/**
 * 요청 ID 생성
 */
function generateRequestId(): string {
  return `auth_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}