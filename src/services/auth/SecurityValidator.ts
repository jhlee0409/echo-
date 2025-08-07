import { 
  PasswordRequirements, 
  UsernameRequirements, 
  AuthErrorResponse,
  AuthErrorCode 
} from './types'

/**
 * Security Validator
 * Handles password validation, username checking, and security policies
 */
export class SecurityValidator {
  private readonly passwordRequirements: PasswordRequirements = {
    min_length: 8,
    require_uppercase: true,
    require_lowercase: true,
    require_numbers: true,
    require_symbols: false,
    disallow_common: true,
    disallow_personal_info: true
  }

  private readonly usernameRequirements: UsernameRequirements = {
    min_length: 3,
    max_length: 20,
    allowed_characters: 'a-zA-Z0-9_-',
    disallow_reserved: [
      'admin', 'administrator', 'mod', 'moderator', 'system', 'user', 'test',
      'guest', 'anonymous', 'null', 'undefined', 'bot', 'ai', 'claude', 'gpt',
      'soulmate', 'companion', 'echo', 'support', 'help', 'api', 'www'
    ]
  }

  // Common weak passwords to reject
  private readonly commonPasswords = [
    'password', '123456', '12345678', 'qwerty', 'abc123', 'password123',
    'admin', 'welcome', 'letmein', 'monkey', '1234567890', 'password1',
    'qwerty123', 'admin123', 'root', 'toor', 'pass', 'test', 'guest'
  ]

  // Common password patterns to detect
  private readonly weakPatterns = [
    /^(.)\1{3,}$/, // Repeated characters (aaaa, 1111, etc.)
    /^(.*?)(.+?)\1\2$/, // Simple repetition (abcabc)
    /^123456/, // Sequential numbers
    /^abcdef/, // Sequential letters
    /^qwerty/, // Keyboard patterns
    /^password/i, // Contains "password"
  ]

  /**
   * Validate password strength and requirements
   */
  validatePassword(
    password: string, 
    userInfo?: { email?: string, username?: string, displayName?: string }
  ): { valid: boolean; errors: string[]; score: number; requirements?: any } {
    const errors: string[] = []
    let score = 0

    // Check minimum length
    if (password.length < this.passwordRequirements.min_length) {
      errors.push(`비밀번호는 최소 ${this.passwordRequirements.min_length}자 이상이어야 합니다`)
    } else {
      score += 20
    }

    // Check character requirements
    if (this.passwordRequirements.require_uppercase && !/[A-Z]/.test(password)) {
      errors.push('비밀번호에는 대문자가 포함되어야 합니다')
    } else if (this.passwordRequirements.require_uppercase) {
      score += 15
    }

    if (this.passwordRequirements.require_lowercase && !/[a-z]/.test(password)) {
      errors.push('비밀번호에는 소문자가 포함되어야 합니다')
    } else if (this.passwordRequirements.require_lowercase) {
      score += 15
    }

    if (this.passwordRequirements.require_numbers && !/\d/.test(password)) {
      errors.push('비밀번호에는 숫자가 포함되어야 합니다')
    } else if (this.passwordRequirements.require_numbers) {
      score += 15
    }

    if (this.passwordRequirements.require_symbols && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('비밀번호에는 특수문자가 포함되어야 합니다')
    } else if (this.passwordRequirements.require_symbols && /[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 20
    }

    // Check for common passwords
    if (this.passwordRequirements.disallow_common) {
      const lowerPassword = password.toLowerCase()
      if (this.commonPasswords.includes(lowerPassword)) {
        errors.push('너무 일반적인 비밀번호입니다. 다른 비밀번호를 선택해주세요')
      }
    }

    // Check for weak patterns
    for (const pattern of this.weakPatterns) {
      if (pattern.test(password)) {
        errors.push('비밀번호가 예측 가능한 패턴을 포함하고 있습니다')
        score -= 10
        break
      }
    }

    // Check for personal information
    if (this.passwordRequirements.disallow_personal_info && userInfo) {
      const personalInfo = [
        userInfo.email?.split('@')[0].toLowerCase(),
        userInfo.username?.toLowerCase(),
        userInfo.displayName?.toLowerCase()
      ].filter(Boolean)

      for (const info of personalInfo) {
        if (info && password.toLowerCase().includes(info)) {
          errors.push('비밀번호에 개인정보가 포함되어서는 안 됩니다')
          break
        }
      }
    }

    // Additional scoring based on length and diversity
    if (password.length >= 12) score += 15
    if (password.length >= 16) score += 10
    
    const uniqueChars = new Set(password).size
    score += Math.min(uniqueChars * 2, 20)

    return {
      valid: errors.length === 0,
      errors,
      score: Math.max(0, Math.min(100, score)),
      requirements: this.passwordRequirements
    }
  }

  /**
   * Validate username requirements
   */
  validateUsername(username: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check length
    if (username.length < this.usernameRequirements.min_length) {
      errors.push(`사용자명은 최소 ${this.usernameRequirements.min_length}자 이상이어야 합니다`)
    }

    if (username.length > this.usernameRequirements.max_length) {
      errors.push(`사용자명은 최대 ${this.usernameRequirements.max_length}자 이하여야 합니다`)
    }

    // Check allowed characters
    const allowedPattern = new RegExp(`^[${this.usernameRequirements.allowed_characters}]+$`)
    if (!allowedPattern.test(username)) {
      errors.push('사용자명에는 영문자, 숫자, 언더스코어(_), 하이픈(-)만 사용할 수 있습니다')
    }

    // Check reserved words
    if (this.usernameRequirements.disallow_reserved.includes(username.toLowerCase())) {
      errors.push('예약된 사용자명입니다. 다른 이름을 선택해주세요')
    }

    // Additional checks
    if (username.startsWith('-') || username.endsWith('-')) {
      errors.push('사용자명은 하이픈으로 시작하거나 끝날 수 없습니다')
    }

    if (username.startsWith('_') || username.endsWith('_')) {
      errors.push('사용자명은 언더스코어로 시작하거나 끝날 수 없습니다')
    }

    // Check for consecutive special characters
    if (/[_-]{2,}/.test(username)) {
      errors.push('연속된 특수문자는 사용할 수 없습니다')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!email) {
      errors.push('이메일 주소를 입력해주세요')
      return { valid: false, errors }
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      errors.push('올바른 이메일 주소 형식이 아닙니다')
    }

    // Check for common typos
    const commonTypos = [
      { wrong: '@gmail.co', correct: '@gmail.com' },
      { wrong: '@yahoo.co', correct: '@yahoo.com' },
      { wrong: '@hotmail.co', correct: '@hotmail.com' },
      { wrong: '@naver.co', correct: '@naver.com' },
      { wrong: '@kakao.co', correct: '@kakao.com' }
    ]

    for (const typo of commonTypos) {
      if (email.includes(typo.wrong)) {
        errors.push(`${typo.correct}을(를) 의도하셨나요?`)
        break
      }
    }

    // Check for suspicious patterns
    if (email.includes('..')) {
      errors.push('이메일 주소에 연속된 점이 포함될 수 없습니다')
    }

    if (email.startsWith('.') || email.endsWith('.')) {
      errors.push('이메일 주소는 점으로 시작하거나 끝날 수 없습니다')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Check for password breaches (simplified version)
   */
  async checkPasswordBreach(password: string): Promise<{ breached: boolean; count?: number }> {
    try {
      // In a real implementation, you would use HaveIBeenPwned API or similar
      // For now, just check against common passwords
      const isCommon = this.commonPasswords.includes(password.toLowerCase())
      
      return {
        breached: isCommon,
        count: isCommon ? 1000000 : undefined // Simulated breach count
      }
    } catch (error) {
      console.error('❌ Breach check failed:', error)
      return { breached: false }
    }
  }

  /**
   * Generate secure password suggestion
   */
  generateSecurePassword(length: number = 12): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const numbers = '0123456789'
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    
    let charset = lowercase + numbers
    let password = ''
    
    // Ensure at least one character from each required category
    if (this.passwordRequirements.require_uppercase) {
      charset += uppercase
      password += uppercase[Math.floor(Math.random() * uppercase.length)]
    }
    
    if (this.passwordRequirements.require_lowercase) {
      password += lowercase[Math.floor(Math.random() * lowercase.length)]
    }
    
    if (this.passwordRequirements.require_numbers) {
      password += numbers[Math.floor(Math.random() * numbers.length)]
    }
    
    if (this.passwordRequirements.require_symbols) {
      charset += symbols
      password += symbols[Math.floor(Math.random() * symbols.length)]
    }
    
    // Fill remaining length
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)]
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('')
  }

  /**
   * Rate limit validation
   */
  private rateLimitStore = new Map<string, { count: number; resetTime: number }>()

  checkRateLimit(identifier: string, maxAttempts: number, windowMs: number): { 
    allowed: boolean; 
    resetTime?: number;
    message?: string;
    retryAfter?: number;
    attemptsRemaining?: number;
  } {
    const now = Date.now()
    const key = identifier.toLowerCase()
    
    let record = this.rateLimitStore.get(key)
    
    if (!record || now > record.resetTime) {
      // First attempt or reset window
      record = { count: 1, resetTime: now + windowMs }
      this.rateLimitStore.set(key, record)
      return { 
        allowed: true,
        attemptsRemaining: maxAttempts - 1
      }
    }
    
    if (record.count >= maxAttempts) {
      const retryAfterMs = record.resetTime - now
      return { 
        allowed: false, 
        resetTime: record.resetTime,
        message: `너무 많은 시도입니다. ${Math.ceil(retryAfterMs / 1000)}초 후에 다시 시도하세요.`,
        retryAfter: Math.ceil(retryAfterMs / 1000),
        attemptsRemaining: 0
      }
    }
    
    record.count++
    this.rateLimitStore.set(key, record)
    return { 
      allowed: true,
      attemptsRemaining: maxAttempts - record.count
    }
  }

  /**
   * Clean up expired rate limit records
   */
  cleanupRateLimits() {
    const now = Date.now()
    for (const [key, record] of this.rateLimitStore.entries()) {
      if (now > record.resetTime) {
        this.rateLimitStore.delete(key)
      }
    }
  }

  /**
   * Validate session token format
   */
  validateSessionToken(token: string): boolean {
    if (!token || typeof token !== 'string') return false
    
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.')
    if (parts.length !== 3) return false
    
    // Each part should be base64url encoded
    const base64UrlRegex = /^[A-Za-z0-9_-]+$/
    return parts.every(part => base64UrlRegex.test(part))
  }

  /**
   * Sanitize user input to prevent injection attacks
   */
  sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') return ''
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/data:/gi, '') // Remove data: protocol
      .replace(/vbscript:/gi, '') // Remove vbscript: protocol
      .slice(0, 1000) // Limit length
  }

  /**
   * Create standardized error response
   */
  createErrorResponse(code: AuthErrorCode, message: string, details?: any): AuthErrorResponse {
    const recoverableErrors: AuthErrorCode[] = [
      'NETWORK_ERROR',
      'SERVER_ERROR',
      'RATE_LIMITED',
      'SESSION_EXPIRED'
    ]

    return {
      code,
      message,
      details,
      recoverable: recoverableErrors.includes(code),
      suggested_action: this.getSuggestedAction(code)
    }
  }

  /**
   * Get suggested action for error codes
   */
  private getSuggestedAction(code: AuthErrorCode): string | undefined {
    switch (code) {
      case 'INVALID_CREDENTIALS':
        return '이메일과 비밀번호를 다시 확인해주세요'
      case 'EMAIL_NOT_VERIFIED':
        return '이메일 인증을 완료해주세요'
      case 'ACCOUNT_LOCKED':
        return '계정이 잠겼습니다. 지원팀에 문의해주세요'
      case 'PASSWORD_TOO_WEAK':
        return '더 강력한 비밀번호를 설정해주세요'
      case 'EMAIL_ALREADY_EXISTS':
        return '다른 이메일 주소를 사용하거나 로그인을 시도해주세요'
      case 'USERNAME_TAKEN':
        return '다른 사용자명을 선택해주세요'
      case 'SESSION_EXPIRED':
        return '다시 로그인해주세요'
      case 'MFA_REQUIRED':
        return '2단계 인증을 완료해주세요'
      case 'RATE_LIMITED':
        return '잠시 후 다시 시도해주세요'
      case 'NETWORK_ERROR':
        return '인터넷 연결을 확인해주세요'
      case 'SERVER_ERROR':
        return '서버 오류입니다. 잠시 후 다시 시도해주세요'
      default:
        return undefined
    }
  }

  /**
   * Get password strength description
   */
  getPasswordStrengthDescription(score: number): { level: string; color: string; description: string } {
    if (score >= 80) {
      return {
        level: '매우 강함',
        color: '#22c55e',
        description: '매우 안전한 비밀번호입니다'
      }
    } else if (score >= 60) {
      return {
        level: '강함',
        color: '#3b82f6',
        description: '안전한 비밀번호입니다'
      }
    } else if (score >= 40) {
      return {
        level: '보통',
        color: '#f59e0b',
        description: '보통 수준의 비밀번호입니다'
      }
    } else if (score >= 20) {
      return {
        level: '약함',
        color: '#ef4444',
        description: '약한 비밀번호입니다. 개선이 필요합니다'
      }
    } else {
      return {
        level: '매우 약함',
        color: '#dc2626',
        description: '매우 약한 비밀번호입니다. 반드시 개선해주세요'
      }
    }
  }

  /**
   * Validate authentication token
   */
  validateAuthToken(token: string): { valid: boolean; error?: string; userId?: string } {
    const isValidFormat = this.validateSessionToken(token)
    
    if (!isValidFormat) {
      return { valid: false, error: 'Invalid token format' }
    }

    try {
      // Basic JWT decode (just for validation, not security verification)
      const parts = token.split('.')
      if (parts.length !== 3) {
        return { valid: false, error: 'Invalid JWT format' }
      }

      // Decode payload to get user ID (in real app, would verify signature)
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
      
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        return { valid: false, error: 'Token expired' }
      }

      return { 
        valid: true, 
        userId: payload.sub || payload.user_id || payload.id 
      }
    } catch (error) {
      return { valid: false, error: 'Invalid token payload' }
    }
  }

  /**
   * Sanitize email input
   */
  sanitizeEmail(email: string): string {
    return this.sanitizeInput(email).toLowerCase()
  }

  /**
   * Validate password strength with legacy method name
   */
  validatePasswordStrength(password: string, userInfo?: any): { valid: boolean; errors: string[]; score: number; requirements?: any } {
    return this.validatePassword(password, userInfo)
  }

  /**
   * Validate sign-in attempt (rate limiting)
   */
  validateSignInAttempt(identifier: string): { 
    allowed: boolean; 
    resetTime?: number;
    message?: string;
    retryAfter?: number;
    attemptsRemaining?: number;
  } {
    return this.checkRateLimit(identifier, 5, 15 * 60 * 1000) // 5 attempts per 15 minutes
  }

  // Getters
  get passwordRules(): PasswordRequirements {
    return { ...this.passwordRequirements }
  }

  get usernameRules(): UsernameRequirements {
    return { ...this.usernameRequirements }
  }
}

// Export singleton instance
let securityValidatorInstance: SecurityValidator | null = null

export const getSecurityValidator = (): SecurityValidator => {
  if (!securityValidatorInstance) {
    securityValidatorInstance = new SecurityValidator()
    
    // Clean up rate limits every 5 minutes
    setInterval(() => {
      securityValidatorInstance?.cleanupRateLimits()
    }, 5 * 60 * 1000)
  }
  
  return securityValidatorInstance
}

// Named exports for API compatibility
const validator = getSecurityValidator()

export const validateAuthToken = (token: string): { valid: boolean; error?: string; userId?: string } => {
  return validator.validateAuthToken(token)
}

export const sanitizeEmail = (email: string): string => {
  return validator.sanitizeEmail(email)
}

export const validatePasswordStrength = (password: string, userInfo?: any): { valid: boolean; errors: string[]; score: number; requirements?: any } => {
  return validator.validatePasswordStrength(password, userInfo)
}

export const validateSignInAttempt = (identifier: string): { 
  allowed: boolean; 
  resetTime?: number;
  message?: string;
  retryAfter?: number;
  attemptsRemaining?: number;
} => {
  return validator.validateSignInAttempt(identifier)
}

export default SecurityValidator