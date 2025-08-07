import { describe, it, expect, beforeEach } from 'vitest'
import { SecurityValidator } from './SecurityValidator'

describe('SecurityValidator', () => {
  let validator: SecurityValidator

  beforeEach(() => {
    validator = new SecurityValidator()
  })

  describe('Password Validation', () => {
    it('should validate a strong password', () => {
      const result = validator.validatePassword('StrongP@ssw0rd123')
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.score).toBeGreaterThan(60)
    })

    it('should reject password shorter than minimum length', () => {
      const result = validator.validatePassword('Short1!')
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('비밀번호는 최소 8자 이상이어야 합니다')
    })

    it('should require uppercase letters', () => {
      const result = validator.validatePassword('lowercase123')
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('비밀번호에는 대문자가 포함되어야 합니다')
    })

    it('should require lowercase letters', () => {
      const result = validator.validatePassword('UPPERCASE123')
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('비밀번호에는 소문자가 포함되어야 합니다')
    })

    it('should require numbers', () => {
      const result = validator.validatePassword('NoNumbers!')
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('비밀번호에는 숫자가 포함되어야 합니다')
    })

    it('should reject common passwords', () => {
      const result = validator.validatePassword('password123')
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('너무 일반적인 비밀번호입니다. 다른 비밀번호를 선택해주세요')
    })

    it('should reject passwords with predictable patterns', () => {
      const patterns = ['aaaa1111', 'abcabc12', '12345678', 'qwerty12']
      
      patterns.forEach(password => {
        const result = validator.validatePassword(password)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('비밀번호가 예측 가능한 패턴을 포함하고 있습니다')
      })
    })

    it('should reject passwords containing personal information', () => {
      const userInfo = {
        email: 'john.doe@example.com',
        username: 'johndoe',
        displayName: 'John Doe',
      }
      
      const result = validator.validatePassword('johndoe123', userInfo)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('비밀번호에 개인정보가 포함되어서는 안 됩니다')
    })

    it('should give higher score for longer passwords', () => {
      const shortResult = validator.validatePassword('Short1!A')
      const longResult = validator.validatePassword('VeryLongPassword123!')
      
      expect(longResult.score).toBeGreaterThan(shortResult.score)
    })

    it('should give higher score for diverse character sets', () => {
      const simpleResult = validator.validatePassword('Simple123')
      const diverseResult = validator.validatePassword('D!v3rs3P@ssw0rd')
      
      expect(diverseResult.score).toBeGreaterThan(simpleResult.score)
    })
  })

  describe('Username Validation', () => {
    it('should validate a valid username', () => {
      const result = validator.validateUsername('user_name-123')
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject username shorter than minimum length', () => {
      const result = validator.validateUsername('ab')
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('사용자명은 최소 3자 이상이어야 합니다')
    })

    it('should reject username longer than maximum length', () => {
      const result = validator.validateUsername('a'.repeat(21))
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('사용자명은 최대 20자 이하여야 합니다')
    })

    it('should reject invalid characters', () => {
      const result = validator.validateUsername('user@name!')
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('사용자명에는 영문자, 숫자, 언더스코어(_), 하이픈(-)만 사용할 수 있습니다')
    })

    it('should reject reserved usernames', () => {
      const reserved = ['admin', 'system', 'bot', 'api']
      
      reserved.forEach(username => {
        const result = validator.validateUsername(username)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('예약된 사용자명입니다. 다른 이름을 선택해주세요')
      })
    })

    it('should reject usernames starting or ending with special characters', () => {
      const invalidUsernames = ['-username', 'username-', '_username', 'username_']
      
      invalidUsernames.forEach(username => {
        const result = validator.validateUsername(username)
        expect(result.valid).toBe(false)
      })
    })

    it('should reject consecutive special characters', () => {
      const result = validator.validateUsername('user__name')
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('연속된 특수문자는 사용할 수 없습니다')
    })
  })

  describe('Email Validation', () => {
    it('should validate a valid email', () => {
      const result = validator.validateEmail('user@example.com')
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid email format', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user@.com',
        'user@example',
      ]
      
      invalidEmails.forEach(email => {
        const result = validator.validateEmail(email)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('올바른 이메일 주소 형식이 아닙니다')
      })
    })

    it('should detect common typos', () => {
      const result = validator.validateEmail('user@gmail.co')
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('@gmail.com을(를) 의도하셨나요?')
    })

    it('should reject consecutive dots', () => {
      const result = validator.validateEmail('user..name@example.com')
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('이메일 주소에 연속된 점이 포함될 수 없습니다')
    })

    it('should reject emails starting or ending with dots', () => {
      const invalidEmails = ['.user@example.com', 'user.@example.com']
      
      invalidEmails.forEach(email => {
        const result = validator.validateEmail(email)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('이메일 주소는 점으로 시작하거나 끝날 수 없습니다')
      })
    })
  })

  describe('Password Breach Check', () => {
    it('should detect common breached passwords', async () => {
      const result = await validator.checkPasswordBreach('password')
      
      expect(result.breached).toBe(true)
      expect(result.count).toBeDefined()
    })

    it('should not flag secure passwords as breached', async () => {
      const result = await validator.checkPasswordBreach('V3ryS3cur3P@ssw0rd!2024')
      
      expect(result.breached).toBe(false)
    })
  })

  describe('Secure Password Generation', () => {
    it('should generate password of specified length', () => {
      const password = validator.generateSecurePassword(16)
      
      expect(password).toHaveLength(16)
    })

    it('should generate password meeting all requirements', () => {
      const password = validator.generateSecurePassword()
      const result = validator.validatePassword(password)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should generate different passwords each time', () => {
      const passwords = new Set()
      for (let i = 0; i < 10; i++) {
        passwords.add(validator.generateSecurePassword())
      }
      
      expect(passwords.size).toBe(10)
    })
  })

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', () => {
      const identifier = 'user@example.com'
      const maxAttempts = 3
      const windowMs = 60000
      
      for (let i = 0; i < maxAttempts; i++) {
        const result = validator.checkRateLimit(identifier, maxAttempts, windowMs)
        expect(result.allowed).toBe(true)
      }
    })

    it('should block requests exceeding rate limit', () => {
      const identifier = 'user@example.com'
      const maxAttempts = 3
      const windowMs = 60000
      
      // Exhaust rate limit
      for (let i = 0; i < maxAttempts; i++) {
        validator.checkRateLimit(identifier, maxAttempts, windowMs)
      }
      
      // Next request should be blocked
      const result = validator.checkRateLimit(identifier, maxAttempts, windowMs)
      expect(result.allowed).toBe(false)
      expect(result.resetTime).toBeDefined()
    })

    it('should reset rate limit after window expires', () => {
      const identifier = 'user@example.com'
      const maxAttempts = 3
      const windowMs = 100 // 100ms for testing
      
      // Exhaust rate limit
      for (let i = 0; i < maxAttempts; i++) {
        validator.checkRateLimit(identifier, maxAttempts, windowMs)
      }
      
      // Wait for window to expire
      setTimeout(() => {
        const result = validator.checkRateLimit(identifier, maxAttempts, windowMs)
        expect(result.allowed).toBe(true)
      }, windowMs + 10)
    })
  })

  describe('Session Token Validation', () => {
    it('should validate valid JWT format', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      
      expect(validator.validateSessionToken(validToken)).toBe(true)
    })

    it('should reject invalid token formats', () => {
      const invalidTokens = [
        '',
        'not.a.token',
        'only.two',
        'invalid.token.format!',
        null,
        undefined,
      ]
      
      invalidTokens.forEach(token => {
        expect(validator.validateSessionToken(token as any)).toBe(false)
      })
    })
  })

  describe('Input Sanitization', () => {
    it('should sanitize HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello'
      const sanitized = validator.sanitizeInput(input)
      
      expect(sanitized).toBe('script>alert("xss")/script>Hello')
      expect(sanitized).not.toContain('<')
      expect(sanitized).not.toContain('>')
    })

    it('should remove javascript protocol', () => {
      const input = 'javascript:alert("xss")'
      const sanitized = validator.sanitizeInput(input)
      
      expect(sanitized).not.toContain('javascript:')
    })

    it('should limit input length', () => {
      const longInput = 'a'.repeat(2000)
      const sanitized = validator.sanitizeInput(longInput)
      
      expect(sanitized.length).toBeLessThanOrEqual(1000)
    })

    it('should handle null/undefined gracefully', () => {
      expect(validator.sanitizeInput(null as any)).toBe('')
      expect(validator.sanitizeInput(undefined as any)).toBe('')
    })

    it('should trim whitespace', () => {
      const input = '  some text  '
      const sanitized = validator.sanitizeInput(input)
      
      expect(sanitized).toBe('some text')
    })
  })

  describe('Password Strength Description', () => {
    it('should return correct strength levels', () => {
      const testCases = [
        { score: 85, level: '매우 강함', color: '#22c55e' },
        { score: 65, level: '강함', color: '#3b82f6' },
        { score: 45, level: '보통', color: '#f59e0b' },
        { score: 25, level: '약함', color: '#ef4444' },
        { score: 10, level: '매우 약함', color: '#dc2626' },
      ]
      
      testCases.forEach(({ score, level, color }) => {
        const result = validator.getPasswordStrengthDescription(score)
        expect(result.level).toBe(level)
        expect(result.color).toBe(color)
      })
    })
  })

  describe('Error Response Creation', () => {
    it('should create error response with correct structure', () => {
      const error = validator.createErrorResponse(
        'INVALID_CREDENTIALS',
        'Invalid email or password',
        { attempts: 3 }
      )
      
      expect(error).toMatchObject({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
        details: { attempts: 3 },
        recoverable: false,
        suggested_action: '이메일과 비밀번호를 다시 확인해주세요',
      })
    })

    it('should mark certain errors as recoverable', () => {
      const recoverableErrors = ['NETWORK_ERROR', 'SERVER_ERROR', 'RATE_LIMITED', 'SESSION_EXPIRED']
      
      recoverableErrors.forEach(code => {
        const error = validator.createErrorResponse(code as any, 'Error message')
        expect(error.recoverable).toBe(true)
      })
    })
  })
})