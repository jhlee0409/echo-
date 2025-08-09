/**
 * 🛡️ API Security Middleware
 * 
 * Express-like middleware for securing API endpoints
 * Integrates with SecurityEnhancementLayer for comprehensive protection
 */

import { getSecurityLayer, SecurityEnhancementLayer } from './SecurityEnhancementLayer'

/**
 * Request-like interface for middleware
 */
export interface SecurityRequest {
  method: string
  url: string
  path: string
  headers: Record<string, string>
  body?: any
  query?: Record<string, any>
  params?: Record<string, any>
  ip?: string
  userId?: string
  sessionId?: string
}

/**
 * Response-like interface for middleware
 */
export interface SecurityResponse {
  setHeader: (name: string, value: string) => void
  status: (code: number) => SecurityResponse
  json: (data: any) => void
  send: (data: any) => void
}

/**
 * Next function type
 */
export type NextFunction = (error?: any) => void

/**
 * Middleware configuration
 */
export interface MiddlewareConfig {
  enableInputValidation?: boolean
  enableRateLimit?: boolean
  enableSuspiciousActivityDetection?: boolean
  enableSecurityHeaders?: boolean
  enableCSRFProtection?: boolean
  enableCORS?: boolean
  corsOrigins?: string[]
  customValidation?: (req: SecurityRequest) => Promise<{ valid: boolean; message?: string }>
}

/**
 * Default middleware configuration
 */
const DEFAULT_CONFIG: MiddlewareConfig = {
  enableInputValidation: true,
  enableRateLimit: true,
  enableSuspiciousActivityDetection: true,
  enableSecurityHeaders: true,
  enableCSRFProtection: true,
  enableCORS: true,
  corsOrigins: ['http://localhost:3000', 'http://localhost:5173']
}

/**
 * API Security Middleware Class
 */
export class ApiSecurityMiddleware {
  private securityLayer: SecurityEnhancementLayer
  private config: MiddlewareConfig

  constructor(config: Partial<MiddlewareConfig> = {}) {
    this.securityLayer = getSecurityLayer()
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Main middleware function
   */
  middleware() {
    return async (req: SecurityRequest, res: SecurityResponse, next: NextFunction) => {
      try {
        // Add security headers first
        if (this.config.enableSecurityHeaders) {
          this.addSecurityHeaders(req, res)
        }

        // Handle CORS
        if (this.config.enableCORS) {
          const corsResult = this.handleCORS(req, res)
          if (!corsResult.allowed) {
            return res.status(403).json({
              error: 'CORS policy violation',
              message: corsResult.message
            })
          }

          // Handle preflight requests
          if (req.method === 'OPTIONS') {
            return res.status(200).send('')
          }
        }

        // Rate limiting check
        if (this.config.enableRateLimit) {
          const rateLimitResult = this.checkRateLimit(req)
          if (!rateLimitResult.allowed) {
            res.setHeader('X-RateLimit-Limit', '100')
            res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
            res.setHeader('X-RateLimit-Reset', rateLimitResult.resetTime.toString())
            
            if (rateLimitResult.retryAfter) {
              res.setHeader('Retry-After', rateLimitResult.retryAfter.toString())
            }
            
            return res.status(429).json({
              error: 'Too Many Requests',
              message: 'Rate limit exceeded',
              retryAfter: rateLimitResult.retryAfter
            })
          }
        }

        // CSRF protection
        if (this.config.enableCSRFProtection) {
          const csrfResult = this.checkCSRFProtection(req)
          if (!csrfResult.valid) {
            return res.status(403).json({
              error: 'CSRF protection failed',
              message: csrfResult.message
            })
          }
        }

        // Input validation
        if (this.config.enableInputValidation) {
          const validationResult = this.validateInputs(req)
          if (!validationResult.valid) {
            return res.status(400).json({
              error: 'Input validation failed',
              message: 'Invalid input detected',
              details: validationResult.errors,
              riskScore: validationResult.riskScore
            })
          }
          
          // Update request with sanitized data
          if (validationResult.sanitized) {
            if (validationResult.sanitized.body) req.body = validationResult.sanitized.body
            if (validationResult.sanitized.query) req.query = validationResult.sanitized.query
            if (validationResult.sanitized.params) req.params = validationResult.sanitized.params
          }
        }

        // Suspicious activity detection
        if (this.config.enableSuspiciousActivityDetection) {
          const suspiciousResult = this.detectSuspiciousActivity(req)
          if (suspiciousResult.suspicious && suspiciousResult.riskScore >= 80) {
            return res.status(403).json({
              error: 'Suspicious activity detected',
              message: 'Request blocked due to security concerns',
              reasons: suspiciousResult.reasons
            })
          }
        }

        // Custom validation
        if (this.config.customValidation) {
          const customResult = await this.config.customValidation(req)
          if (!customResult.valid) {
            return res.status(400).json({
              error: 'Custom validation failed',
              message: customResult.message || 'Request did not pass custom validation'
            })
          }
        }

        // All checks passed, continue to next middleware
        next()

      } catch (error) {
        console.error('🛡️ Security middleware error:', error)
        
        // Log security event
        this.securityLayer.emit('threat-detected', {
          id: Math.random().toString(36),
          timestamp: Date.now(),
          type: 'system_compromise',
          level: 'critical',
          source: 'api-middleware',
          userId: req.userId,
          description: 'Security middleware error',
          metadata: { error: (error as Error).message, path: req.path },
          resolved: false,
          actions: []
        })

        res.status(500).json({
          error: 'Internal security error',
          message: 'Request could not be processed securely'
        })
      }
    }
  }

  /**
   * Authentication middleware
   */
  requireAuth() {
    return (req: SecurityRequest, res: SecurityResponse, next: NextFunction) => {
      const authHeader = req.headers.authorization
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Valid authentication token required'
        })
      }

      const token = authHeader.substring(7) // Remove 'Bearer ' prefix
      
      // Validate token format
      if (!this.securityLayer.validateAuthToken) {
        return res.status(500).json({
          error: 'Authentication system unavailable',
          message: 'Authentication validation is not available'
        })
      }

      const tokenResult = this.securityLayer.validateAuthToken(token)
      
      if (!tokenResult.valid) {
        return res.status(401).json({
          error: 'Invalid token',
          message: tokenResult.error || 'Authentication token is invalid'
        })
      }

      // Add user ID to request
      if (tokenResult.userId) {
        req.userId = tokenResult.userId
      }

      next()
    }
  }

  /**
   * Admin-only middleware
   */
  requireAdmin() {
    return (req: SecurityRequest, res: SecurityResponse, next: NextFunction) => {
      // This would typically check user roles from database
      // For now, just ensure user is authenticated
      if (!req.userId) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Admin access requires authentication'
        })
      }

      // In real implementation, check if user has admin role
      // const user = await getUserById(req.userId)
      // if (!user.isAdmin) return res.status(403).json({...})

      next()
    }
  }

  /**
   * Content-Type validation middleware
   */
  requireContentType(allowedTypes: string[]) {
    return (req: SecurityRequest, res: SecurityResponse, next: NextFunction) => {
      const contentType = req.headers['content-type']
      
      if (!contentType) {
        return res.status(400).json({
          error: 'Content-Type required',
          message: 'Request must specify Content-Type header'
        })
      }

      const isAllowed = allowedTypes.some(type => 
        contentType.toLowerCase().includes(type.toLowerCase())
      )

      if (!isAllowed) {
        return res.status(415).json({
          error: 'Unsupported Media Type',
          message: `Content-Type must be one of: ${allowedTypes.join(', ')}`,
          received: contentType
        })
      }

      next()
    }
  }

  /**
   * Request size limit middleware
   */
  limitRequestSize(maxSizeBytes: number) {
    return (req: SecurityRequest, res: SecurityResponse, next: NextFunction) => {
      const contentLength = parseInt(req.headers['content-length'] || '0', 10)
      
      if (contentLength > maxSizeBytes) {
        return res.status(413).json({
          error: 'Payload Too Large',
          message: `Request size exceeds limit of ${maxSizeBytes} bytes`,
          received: contentLength
        })
      }

      next()
    }
  }

  // Private helper methods

  private addSecurityHeaders(req: SecurityRequest, res: SecurityResponse): void {
    const headers = this.securityLayer.getSecurityHeaders()
    
    Object.entries(headers).forEach(([name, value]) => {
      res.setHeader(name, value)
    })

    // Add rate limit info
    res.setHeader('X-RateLimit-Policy', 'security-enhanced')
  }

  private handleCORS(req: SecurityRequest, res: SecurityResponse): { allowed: boolean; message?: string } {
    const origin = req.headers.origin
    
    if (!origin) {
      return { allowed: true } // Allow requests without origin (same-origin)
    }

    const allowedOrigins = this.config.corsOrigins || []
    const isAllowed = allowedOrigins.includes(origin) || allowedOrigins.includes('*')

    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin)
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token')
      res.setHeader('Access-Control-Allow-Credentials', 'true')
      res.setHeader('Access-Control-Max-Age', '86400') // 24 hours
      
      return { allowed: true }
    }

    return {
      allowed: false,
      message: `Origin ${origin} not allowed by CORS policy`
    }
  }

  private checkRateLimit(req: SecurityRequest) {
    const identifier = req.ip || req.userId || 'anonymous'
    const context = this.getContextFromPath(req.path)
    
    return this.securityLayer.checkRateLimit(identifier, context, req.userId)
  }

  private checkCSRFProtection(req: SecurityRequest): { valid: boolean; message?: string } {
    // Skip CSRF for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method.toUpperCase())) {
      return { valid: true }
    }

    // Check for CSRF token in headers
    const csrfToken = req.headers['x-csrf-token'] || req.headers['x-requested-with']
    
    if (!csrfToken) {
      return {
        valid: false,
        message: 'CSRF token required for state-changing operations'
      }
    }

    // In real implementation, validate CSRF token against session
    // For now, just check presence
    if (typeof csrfToken === 'string' && csrfToken.length > 0) {
      return { valid: true }
    }

    return {
      valid: false,
      message: 'Invalid CSRF token format'
    }
  }

  private validateInputs(req: SecurityRequest) {
    const context = this.getContextFromPath(req.path)
    const inputs: any = {}
    
    if (req.body) inputs.body = req.body
    if (req.query) inputs.query = req.query
    if (req.params) inputs.params = req.params

    if (Object.keys(inputs).length === 0) {
      return { valid: true, errors: [], warnings: [], riskScore: 0 }
    }

    const result = this.securityLayer.validateAndSanitizeInput(inputs, context, req.userId)
    
    return {
      valid: result.valid,
      errors: result.errors,
      warnings: result.warnings,
      riskScore: result.riskScore,
      sanitized: result.sanitized
    }
  }

  private detectSuspiciousActivity(req: SecurityRequest) {
    return this.securityLayer.detectSuspiciousActivity({
      method: req.method,
      path: req.path,
      headers: req.headers,
      body: req.body,
      userId: req.userId,
      ip: req.ip
    })
  }

  private getContextFromPath(path: string): string {
    // Extract API context from path
    const parts = path.split('/').filter(Boolean)
    
    if (parts.length === 0) return 'root'
    if (parts[0] === 'api') return parts[1] || 'api'
    
    return parts[0] || 'general'
  }

  /**
   * Create security middleware with specific configuration
   */
  static create(config?: Partial<MiddlewareConfig>) {
    return new ApiSecurityMiddleware(config)
  }

  /**
   * Preset configurations
   */
  static presets = {
    strict: (): ApiSecurityMiddleware => new ApiSecurityMiddleware({
      enableInputValidation: true,
      enableRateLimit: true,
      enableSuspiciousActivityDetection: true,
      enableSecurityHeaders: true,
      enableCSRFProtection: true,
      enableCORS: true,
      corsOrigins: ['http://localhost:3000']
    }),

    development: (): ApiSecurityMiddleware => new ApiSecurityMiddleware({
      enableInputValidation: true,
      enableRateLimit: false, // Disabled for easier development
      enableSuspiciousActivityDetection: true,
      enableSecurityHeaders: true,
      enableCSRFProtection: false, // Disabled for easier development
      enableCORS: true,
      corsOrigins: ['*'] // Allow all origins in development
    }),

    production: (): ApiSecurityMiddleware => new ApiSecurityMiddleware({
      enableInputValidation: true,
      enableRateLimit: true,
      enableSuspiciousActivityDetection: true,
      enableSecurityHeaders: true,
      enableCSRFProtection: true,
      enableCORS: true,
      corsOrigins: [] // Must be explicitly configured for production
    })
  }
}

/**
 * Convenience function to create middleware
 */
export const createSecurityMiddleware = (config?: Partial<MiddlewareConfig>): ApiSecurityMiddleware => {
  return new ApiSecurityMiddleware(config)
}

/**
 * Export preset configurations
 */
export const securityPresets = ApiSecurityMiddleware.presets

export default ApiSecurityMiddleware