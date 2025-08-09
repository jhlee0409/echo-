/**
 * 🛡️ Security Services
 * 
 * Comprehensive security layer for the Echo application
 * 
 * Architecture:
 * - SecurityEnhancementLayer: Core multi-layered security system
 * - ApiSecurityMiddleware: Express-compatible middleware for API protection
 * - InputSanitizer: Input validation and sanitization utilities
 * - SecurityMonitor: Real-time monitoring and alerting system
 * - SecurityValidator: Authentication and validation utilities (existing)
 * 
 * Features:
 * - Input validation and sanitization
 * - API security headers and CSRF protection
 * - Data encryption and secure storage
 * - Real-time threat detection and monitoring
 * - Automated incident response
 * - Security logging and audit trails
 * - Rate limiting and DDoS protection
 * - Compliance and privacy controls
 */

// Core security layer
export { 
  SecurityEnhancementLayer, 
  getSecurityLayer,
  type SecurityEvent,
  type SecurityEventType,
  type ThreatLevel,
  type SecurityAction,
  type SecurityPolicy,
  type ValidationResult 
} from './SecurityEnhancementLayer'

// API security middleware
export {
  ApiSecurityMiddleware,
  createSecurityMiddleware,
  securityPresets,
  type SecurityRequest,
  type SecurityResponse,
  type NextFunction,
  type MiddlewareConfig
} from './ApiSecurityMiddleware'

// Input sanitization
export {
  default as InputSanitizer,
  ValidationPatterns,
  ValidationHelpers,
  type SanitizationResult,
  type SanitizationChange,
  type SanitizationOptions
} from './InputSanitizer'

// Security monitoring
export {
  SecurityMonitor,
  getSecurityMonitor,
  type SecurityAlert,
  type AlertSeverity,
  type AlertType,
  type AlertAction,
  type MonitoringRule,
  type RuleCondition,
  type AutomatedAction,
  type AlertStats,
  type MonitoringConfig,
  type NotificationChannel
} from './SecurityMonitor'

// Existing security validator
export {
  SecurityValidator,
  getSecurityValidator,
  validateAuthToken,
  sanitizeEmail,
  validatePasswordStrength,
  validateSignInAttempt
} from './SecurityValidator'

export * from './types'

/**
 * Initialize complete security system
 */
export interface SecuritySystemConfig {
  securityLayer?: Partial<import('./SecurityEnhancementLayer').SecurityPolicy>
  middleware?: Partial<import('./ApiSecurityMiddleware').MiddlewareConfig>
  monitoring?: Partial<import('./SecurityMonitor').MonitoringConfig>
  sanitization?: Partial<import('./InputSanitizer').SanitizationOptions>
}

/**
 * Initialize and configure the complete security system
 */
export function initializeSecuritySystem(config: SecuritySystemConfig = {}) {
  // Initialize core security layer
  const securityLayer = getSecurityLayer(config.securityLayer)
  
  // Initialize monitoring
  const monitor = getSecurityMonitor(config.monitoring)
  
  // Initialize API middleware
  const middleware = createSecurityMiddleware(config.middleware)
  
  // Initialize input sanitizer
  const sanitizer = new InputSanitizer(config.sanitization)
  
  // Connect systems together
  securityLayer.on('threat-detected', (event) => {
    console.log('🛡️ Security threat detected:', event.description)
  })
  
  monitor.on('alert-created', (alert) => {
    console.log('🚨 Security alert:', alert.title)
  })
  
  return {
    securityLayer,
    monitor,
    middleware,
    sanitizer
  }
}

/**
 * Quick security checks for common use cases
 */
export const SecurityChecks = {
  /**
   * Validate and sanitize user input
   */
  validateInput: (input: any, context: string = 'general') => {
    const sanitizer = new InputSanitizer()
    return sanitizer.sanitize(input, context)
  },

  /**
   * Check if request should be blocked
   */
  shouldBlockRequest: (request: {
    method: string
    path: string
    headers: Record<string, string>
    body?: any
    ip?: string
  }) => {
    const securityLayer = getSecurityLayer()
    const result = securityLayer.detectSuspiciousActivity(request)
    return result.suspicious && result.riskScore >= 80
  },

  /**
   * Sanitize data for display
   */
  sanitizeForDisplay: (data: string) => {
    return InputSanitizer.quick.display(data)
  },

  /**
   * Validate email address
   */
  validateEmail: (email: string) => {
    const sanitized = InputSanitizer.quick.email(email)
    return ValidationPatterns.email.test(sanitized)
  },

  /**
   * Check rate limit
   */
  checkRateLimit: (identifier: string, context: string = 'api') => {
    const securityLayer = getSecurityLayer()
    return securityLayer.checkRateLimit(identifier, context)
  }
}

/**
 * Security middleware presets for common configurations
 */
export const SecurityPresets = {
  /**
   * Strict security for production APIs
   */
  productionAPI: () => createSecurityMiddleware({
    enableInputValidation: true,
    enableRateLimit: true,
    enableSuspiciousActivityDetection: true,
    enableSecurityHeaders: true,
    enableCSRFProtection: true,
    enableCORS: true,
    corsOrigins: [] // Must be explicitly configured
  }),

  /**
   * Development-friendly configuration
   */
  development: () => createSecurityMiddleware({
    enableInputValidation: true,
    enableRateLimit: false,
    enableSuspiciousActivityDetection: true,
    enableSecurityHeaders: true,
    enableCSRFProtection: false,
    enableCORS: true,
    corsOrigins: ['*']
  }),

  /**
   * Public API with basic protection
   */
  publicAPI: () => createSecurityMiddleware({
    enableInputValidation: true,
    enableRateLimit: true,
    enableSuspiciousActivityDetection: true,
    enableSecurityHeaders: true,
    enableCSRFProtection: false, // Not needed for stateless APIs
    enableCORS: true
  }),

  /**
   * Admin panel with maximum security
   */
  adminPanel: () => createSecurityMiddleware({
    enableInputValidation: true,
    enableRateLimit: true,
    enableSuspiciousActivityDetection: true,
    enableSecurityHeaders: true,
    enableCSRFProtection: true,
    enableCORS: true,
    corsOrigins: [], // Restricted origins only
    customValidation: async (req) => {
      // Additional admin-specific validation
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { valid: false, message: 'Admin access requires authentication' }
      }
      return { valid: true }
    }
  })
}

/**
 * Default security configuration for the application
 */
export const defaultSecurityConfig: SecuritySystemConfig = {
  securityLayer: {
    inputValidation: {
      maxInputLength: 10000,
      sanitizeHtml: true,
      preventInjection: true
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100
    },
    monitoring: {
      logLevel: 'warn',
      realTimeAlerts: true
    },
    compliance: {
      gdprEnabled: true,
      auditLogging: true
    }
  },
  middleware: {
    enableInputValidation: true,
    enableRateLimit: true,
    enableSuspiciousActivityDetection: true,
    enableSecurityHeaders: true,
    enableCSRFProtection: true,
    enableCORS: true
  },
  monitoring: {
    enabled: true,
    alertRetentionDays: 30,
    maxAlertsPerHour: 100
  },
  sanitization: {
    maxLength: 10000,
    allowHtml: false,
    escapeHtml: true,
    removeNullBytes: true
  }
}