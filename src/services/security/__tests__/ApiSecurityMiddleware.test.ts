import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ApiSecurityMiddleware, createSecurityMiddleware, securityPresets } from '../ApiSecurityMiddleware'
import type { SecurityRequest, SecurityResponse, NextFunction } from '../ApiSecurityMiddleware'

describe('ApiSecurityMiddleware', () => {
  let middleware: ApiSecurityMiddleware
  let mockRequest: SecurityRequest
  let mockResponse: SecurityResponse
  let mockNext: NextFunction
  let responseData: any
  let responseStatus: number
  let responseHeaders: Record<string, string>

  beforeEach(() => {
    middleware = new ApiSecurityMiddleware({
      enableRateLimit: false // Disable rate limiting for most tests to avoid interference
    })
    responseData = null
    responseStatus = 200
    responseHeaders = {}

    mockRequest = {
      method: 'GET',
      url: '/api/users',
      path: '/api/users',
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'content-type': 'application/json'
      },
      ip: '192.168.1.1'
    }

    mockResponse = {
      setHeader: vi.fn((name: string, value: string) => {
        responseHeaders[name] = value
      }),
      status: vi.fn((code: number) => {
        responseStatus = code
        return mockResponse
      }),
      json: vi.fn((data: any) => {
        responseData = data
      }),
      send: vi.fn((data: any) => {
        responseData = data
      })
    }

    mockNext = vi.fn()
  })

  describe('Main Middleware Function', () => {
    it('should allow valid requests to pass through', async () => {
      const middlewareFn = middleware.middleware()
      
      await middlewareFn(mockRequest, mockResponse, mockNext)
      
      expect(mockNext).toHaveBeenCalled()
      expect(responseStatus).toBe(200)
    })

    it('should add security headers to response', async () => {
      const middlewareFn = middleware.middleware()
      
      await middlewareFn(mockRequest, mockResponse, mockNext)
      
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY')
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff')
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block')
    })

    it('should handle CORS preflight requests', async () => {
      const corsRequest = {
        ...mockRequest,
        method: 'OPTIONS',
        headers: {
          ...mockRequest.headers,
          origin: 'http://localhost:3000'
        }
      }
      
      const middlewareFn = middleware.middleware()
      await middlewareFn(corsRequest, mockResponse, mockNext)
      
      expect(responseStatus).toBe(200)
      expect(responseHeaders['Access-Control-Allow-Origin']).toBe('http://localhost:3000')
    })

    it('should block requests from unauthorized origins', async () => {
      const corsRequest = {
        ...mockRequest,
        headers: {
          ...mockRequest.headers,
          origin: 'http://malicious-site.com'
        }
      }
      
      const middlewareFn = middleware.middleware()
      await middlewareFn(corsRequest, mockResponse, mockNext)
      
      expect(responseStatus).toBe(403)
      expect(responseData.error).toBe('CORS policy violation')
    })

    it('should validate and sanitize input data', async () => {
      const requestWithBody = {
        ...mockRequest,
        method: 'POST',
        body: {
          name: 'John<script>alert("xss")</script>',
          email: 'john@example.com'
        },
        headers: {
          ...mockRequest.headers,
          'x-csrf-token': 'valid-token'
        }
      }
      
      const middlewareFn = middleware.middleware()
      await middlewareFn(requestWithBody, mockResponse, mockNext)
      
      expect(responseStatus).toBe(400)
      expect(responseData.error).toBe('Input validation failed')
    })

    it('should enforce rate limiting', async () => {
      const rateLimitMiddleware = new ApiSecurityMiddleware({
        enableRateLimit: true,
        enableInputValidation: false,
        enableSuspiciousActivityDetection: false,
        enableCSRFProtection: false
      })
      const middlewareFn = rateLimitMiddleware.middleware()
      
      // Make many requests to trigger rate limit
      for (let i = 0; i < 101; i++) {
        await middlewareFn(mockRequest, mockResponse, mockNext)
      }
      
      expect(responseStatus).toBe(429)
      expect(responseData.error).toBe('Too Many Requests')
    })

    it('should detect suspicious activity', async () => {
      const suspiciousRequest = {
        ...mockRequest,
        path: '/admin/config',
        headers: {
          'user-agent': 'malicious-bot'
        }
      }
      
      const middlewareFn = middleware.middleware()
      await middlewareFn(suspiciousRequest, mockResponse, mockNext)
      
      expect(responseStatus).toBe(403)
      expect(responseData.error).toBe('Suspicious activity detected')
    })

    it('should require CSRF token for state-changing operations', async () => {
      const postRequest = {
        ...mockRequest,
        method: 'POST',
        body: { data: 'test' }
      }
      
      const middlewareFn = middleware.middleware()
      await middlewareFn(postRequest, mockResponse, mockNext)
      
      expect(responseStatus).toBe(403)
      expect(responseData.error).toBe('CSRF protection failed')
    })

    it('should allow POST requests with valid CSRF token', async () => {
      const postRequest = {
        ...mockRequest,
        method: 'POST',
        body: { data: 'test' },
        headers: {
          ...mockRequest.headers,
          'x-csrf-token': 'valid-token'
        }
      }
      
      const middlewareFn = middleware.middleware()
      await middlewareFn(postRequest, mockResponse, mockNext)
      
      expect(mockNext).toHaveBeenCalled()
    })

    it('should handle middleware errors gracefully', async () => {
      // Mock an error in the middleware
      const errorMiddleware = new ApiSecurityMiddleware({
        enableRateLimit: false,
        enableInputValidation: false,
        enableSuspiciousActivityDetection: false,
        enableCSRFProtection: false,
        customValidation: async () => {
          throw new Error('Custom validation error')
        }
      })
      
      const middlewareFn = errorMiddleware.middleware()
      await middlewareFn(mockRequest, mockResponse, mockNext)
      
      expect(responseStatus).toBe(500)
      expect(responseData.error).toBe('Internal security error')
    })
  })

  describe('Authentication Middleware', () => {
    it('should require authorization header', () => {
      const authMiddleware = middleware.requireAuth()
      
      authMiddleware(mockRequest, mockResponse, mockNext)
      
      expect(responseStatus).toBe(401)
      expect(responseData.error).toBe('Authentication required')
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should validate Bearer token format', () => {
      const requestWithAuth = {
        ...mockRequest,
        headers: {
          ...mockRequest.headers,
          authorization: 'Bearer invalid-token'
        }
      }
      
      const authMiddleware = middleware.requireAuth()
      authMiddleware(requestWithAuth, mockResponse, mockNext)
      
      expect(responseStatus).toBe(401)
      expect(responseData.error).toBe('Invalid token')
    })

    it('should extract user ID from valid token', () => {
      // Create a mock JWT-like token (for testing purposes)
      const mockPayload = { sub: 'user123', exp: Math.floor(Date.now() / 1000) + 3600 }
      const mockToken = 'header.' + btoa(JSON.stringify(mockPayload)) + '.signature'
      
      const requestWithAuth = {
        ...mockRequest,
        headers: {
          ...mockRequest.headers,
          authorization: `Bearer ${mockToken}`
        }
      }
      
      const authMiddleware = middleware.requireAuth()
      authMiddleware(requestWithAuth, mockResponse, mockNext)
      
      expect(requestWithAuth.userId).toBe('user123')
      expect(mockNext).toHaveBeenCalled()
    })

    it('should reject expired tokens', () => {
      // Create an expired token
      const mockPayload = { sub: 'user123', exp: Math.floor(Date.now() / 1000) - 3600 }
      const mockToken = 'header.' + btoa(JSON.stringify(mockPayload)) + '.signature'
      
      const requestWithAuth = {
        ...mockRequest,
        headers: {
          ...mockRequest.headers,
          authorization: `Bearer ${mockToken}`
        }
      }
      
      const authMiddleware = middleware.requireAuth()
      authMiddleware(requestWithAuth, mockResponse, mockNext)
      
      expect(responseStatus).toBe(401)
      expect(responseData.error).toBe('Invalid token')
    })
  })

  describe('Admin Middleware', () => {
    it('should require authentication for admin access', () => {
      const adminMiddleware = middleware.requireAdmin()
      
      adminMiddleware(mockRequest, mockResponse, mockNext)
      
      expect(responseStatus).toBe(401)
      expect(responseData.error).toBe('Authentication required')
    })

    it('should allow authenticated users', () => {
      const authenticatedRequest = {
        ...mockRequest,
        userId: 'user123'
      }
      
      const adminMiddleware = middleware.requireAdmin()
      adminMiddleware(authenticatedRequest, mockResponse, mockNext)
      
      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('Content-Type Validation', () => {
    it('should require Content-Type header', () => {
      const requestWithoutContentType = {
        ...mockRequest,
        headers: { ...mockRequest.headers }
      }
      delete requestWithoutContentType.headers['content-type']
      
      const contentTypeMiddleware = middleware.requireContentType(['application/json'])
      contentTypeMiddleware(requestWithoutContentType, mockResponse, mockNext)
      
      expect(responseStatus).toBe(400)
      expect(responseData.error).toBe('Content-Type required')
    })

    it('should validate allowed content types', () => {
      const xmlRequest = {
        ...mockRequest,
        headers: {
          ...mockRequest.headers,
          'content-type': 'application/xml'
        }
      }
      
      const contentTypeMiddleware = middleware.requireContentType(['application/json'])
      contentTypeMiddleware(xmlRequest, mockResponse, mockNext)
      
      expect(responseStatus).toBe(415)
      expect(responseData.error).toBe('Unsupported Media Type')
    })

    it('should allow valid content types', () => {
      const contentTypeMiddleware = middleware.requireContentType(['application/json'])
      contentTypeMiddleware(mockRequest, mockResponse, mockNext)
      
      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('Request Size Limiting', () => {
    it('should reject requests exceeding size limit', () => {
      const largeRequest = {
        ...mockRequest,
        headers: {
          ...mockRequest.headers,
          'content-length': '1000000' // 1MB
        }
      }
      
      const sizeLimitMiddleware = middleware.limitRequestSize(500000) // 500KB limit
      sizeLimitMiddleware(largeRequest, mockResponse, mockNext)
      
      expect(responseStatus).toBe(413)
      expect(responseData.error).toBe('Payload Too Large')
    })

    it('should allow requests within size limit', () => {
      const smallRequest = {
        ...mockRequest,
        headers: {
          ...mockRequest.headers,
          'content-length': '1000' // 1KB
        }
      }
      
      const sizeLimitMiddleware = middleware.limitRequestSize(500000) // 500KB limit
      sizeLimitMiddleware(smallRequest, mockResponse, mockNext)
      
      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('Configuration and Presets', () => {
    it('should create middleware with custom configuration', () => {
      const customMiddleware = new ApiSecurityMiddleware({
        enableRateLimit: false,
        enableCSRFProtection: false
      })
      
      expect(customMiddleware).toBeInstanceOf(ApiSecurityMiddleware)
    })

    it('should create middleware using factory function', () => {
      const factoryMiddleware = createSecurityMiddleware({
        enableInputValidation: false
      })
      
      expect(factoryMiddleware).toBeInstanceOf(ApiSecurityMiddleware)
    })

    it('should provide preset configurations', () => {
      const strictMiddleware = securityPresets.strict()
      const developmentMiddleware = securityPresets.development()
      const productionMiddleware = securityPresets.production()
      
      expect(strictMiddleware).toBeInstanceOf(ApiSecurityMiddleware)
      expect(developmentMiddleware).toBeInstanceOf(ApiSecurityMiddleware)
      expect(productionMiddleware).toBeInstanceOf(ApiSecurityMiddleware)
    })

    it('should create middleware using static create method', () => {
      const staticMiddleware = ApiSecurityMiddleware.create({
        enableSuspiciousActivityDetection: false
      })
      
      expect(staticMiddleware).toBeInstanceOf(ApiSecurityMiddleware)
    })
  })

  describe('Custom Validation', () => {
    it('should run custom validation when provided', async () => {
      const customValidation = vi.fn().mockResolvedValue({ valid: true })
      
      const customMiddleware = new ApiSecurityMiddleware({
        enableRateLimit: false,
        enableInputValidation: false,
        enableSuspiciousActivityDetection: false,
        enableCSRFProtection: false,
        customValidation
      })
      
      const middlewareFn = customMiddleware.middleware()
      await middlewareFn(mockRequest, mockResponse, mockNext)
      
      expect(customValidation).toHaveBeenCalledWith(mockRequest)
      expect(mockNext).toHaveBeenCalled()
    })

    it('should block requests failing custom validation', async () => {
      const customValidation = vi.fn().mockResolvedValue({
        valid: false,
        message: 'Custom validation failed'
      })
      
      const customMiddleware = new ApiSecurityMiddleware({
        enableRateLimit: false,
        enableInputValidation: false,
        enableSuspiciousActivityDetection: false,
        enableCSRFProtection: false,
        customValidation
      })
      
      const middlewareFn = customMiddleware.middleware()
      await middlewareFn(mockRequest, mockResponse, mockNext)
      
      expect(responseStatus).toBe(400)
      expect(responseData.error).toBe('Custom validation failed')
      expect(responseData.message).toBe('Custom validation failed')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle requests without IP address', async () => {
      const requestWithoutIP = {
        ...mockRequest,
        ip: undefined
      }
      
      const middlewareFn = middleware.middleware()
      await middlewareFn(requestWithoutIP, mockResponse, mockNext)
      
      // Should still work, using fallback identifier
      expect(mockNext).toHaveBeenCalled()
    })

    it('should handle requests without user agent', async () => {
      const requestWithoutUA = {
        ...mockRequest,
        headers: {
          ...mockRequest.headers,
          'user-agent': undefined
        } as any
      }
      
      const middlewareFn = middleware.middleware()
      await middlewareFn(requestWithoutUA, mockResponse, mockNext)
      
      // Should be flagged as suspicious due to missing UA
      expect(responseStatus).toBe(403)
      expect(responseData.error).toBe('Suspicious activity detected')
    })

    it('should handle malformed authorization headers', () => {
      const requestWithMalformedAuth = {
        ...mockRequest,
        headers: {
          ...mockRequest.headers,
          authorization: 'Malformed header'
        }
      }
      
      const authMiddleware = middleware.requireAuth()
      authMiddleware(requestWithMalformedAuth, mockResponse, mockNext)
      
      expect(responseStatus).toBe(401)
      expect(responseData.error).toBe('Authentication required')
    })

    it('should handle content-length header edge cases', () => {
      const requestWithInvalidLength = {
        ...mockRequest,
        headers: {
          ...mockRequest.headers,
          'content-length': 'invalid'
        }
      }
      
      const sizeLimitMiddleware = middleware.limitRequestSize(1000)
      sizeLimitMiddleware(requestWithInvalidLength, mockResponse, mockNext)
      
      // Should treat invalid content-length as 0
      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('Security Configuration Flexibility', () => {
    it('should allow disabling individual security features', async () => {
      const permissiveMiddleware = new ApiSecurityMiddleware({
        enableInputValidation: false,
        enableRateLimit: false,
        enableSuspiciousActivityDetection: false,
        enableCSRFProtection: false
      })
      
      const maliciousRequest = {
        ...mockRequest,
        method: 'POST',
        path: '/admin/delete-all',
        body: { malicious: '<script>alert("xss")</script>' },
        headers: { 'user-agent': 'evil-bot' }
      }
      
      const middlewareFn = permissiveMiddleware.middleware()
      await middlewareFn(maliciousRequest, mockResponse, mockNext)
      
      // Should pass through despite malicious content
      expect(mockNext).toHaveBeenCalled()
    })
  })
})