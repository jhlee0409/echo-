/**
 * 🧼 Input Sanitizer
 * 
 * Comprehensive input sanitization and validation utilities
 * Works on both client and server-side for consistent security
 */

/**
 * Sanitization result
 */
export interface SanitizationResult {
  sanitized: any
  originalValue: any
  changes: SanitizationChange[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  riskScore: number
  warnings: string[]
  blocked: boolean
}

/**
 * Sanitization change record
 */
export interface SanitizationChange {
  type: 'removed' | 'encoded' | 'truncated' | 'replaced' | 'blocked'
  field: string
  original: string
  sanitized: string
  reason: string
}

/**
 * Sanitization options
 */
export interface SanitizationOptions {
  maxLength?: number
  allowHtml?: boolean
  allowScripts?: boolean
  allowUrls?: boolean
  allowEmails?: boolean
  stripWhitespace?: boolean
  convertToLowercase?: boolean
  removeNullBytes?: boolean
  escapeHtml?: boolean
  removeComments?: boolean
  allowedTags?: string[]
  blockedPatterns?: RegExp[]
  customSanitizers?: Record<string, (value: any) => any>
}

/**
 * Default sanitization options
 */
const DEFAULT_OPTIONS: Required<SanitizationOptions> = {
  maxLength: 10000,
  allowHtml: false,
  allowScripts: false,
  allowUrls: true,
  allowEmails: true,
  stripWhitespace: true,
  convertToLowercase: false,
  removeNullBytes: true,
  escapeHtml: true,
  removeComments: true,
  allowedTags: [],
  blockedPatterns: [
    // Script injection
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /data:(?:text\/html|application\/javascript)/gi,
    
    // Event handlers
    /on\w+\s*=/gi,
    
    // Function calls
    /\beval\s*\(/gi,
    /\bexec\s*\(/gi,
    /\bsetTimeout\s*\(/gi,
    /\bsetInterval\s*\(/gi,
    
    // SQL injection patterns
    /(\bunion\b.*\bselect\b)|(\bselect\b.*\bfrom\b)/gi,
    /(\binsert\b.*\binto\b)|(\bupdate\b.*\bset\b)/gi,
    /(\bdelete\b.*\bfrom\b)|(\bdrop\b.*\btable\b)/gi,
    
    // Command injection
    /[;&|`$(){}[\]\\]/g,
    
    // Path traversal
    /\.\.[\/\\]/g,
    
    // Null bytes
    /\x00/g,
  ],
  customSanitizers: {}
}

/**
 * Input Sanitizer Class
 */
export class InputSanitizer {
  private options: Required<SanitizationOptions>

  constructor(options: Partial<SanitizationOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  /**
   * Sanitize any input value
   */
  sanitize(input: any, fieldName: string = 'input'): SanitizationResult {
    const result: SanitizationResult = {
      sanitized: input,
      originalValue: input,
      changes: [],
      riskLevel: 'low',
      riskScore: 0,
      warnings: [],
      blocked: false
    }

    try {
      // Handle different input types
      if (typeof input === 'string') {
        result.sanitized = this.sanitizeString(input, fieldName, result)
      } else if (Array.isArray(input)) {
        result.sanitized = this.sanitizeArray(input, fieldName, result)
      } else if (typeof input === 'object' && input !== null) {
        result.sanitized = this.sanitizeObject(input, fieldName, result)
      } else if (typeof input === 'number') {
        result.sanitized = this.sanitizeNumber(input, fieldName, result)
      } else if (typeof input === 'boolean') {
        result.sanitized = input // Booleans are safe
      } else {
        // Handle undefined, null, etc.
        result.sanitized = input
      }

      // Apply custom sanitizers if provided
      if (this.options.customSanitizers[fieldName]) {
        const customResult = this.options.customSanitizers[fieldName](result.sanitized)
        if (customResult !== result.sanitized) {
          result.changes.push({
            type: 'replaced',
            field: fieldName,
            original: String(result.sanitized),
            sanitized: String(customResult),
            reason: 'Custom sanitization applied'
          })
          result.sanitized = customResult
        }
      }

      // Calculate final risk assessment
      this.assessRisk(result)

    } catch (error) {
      result.blocked = true
      result.riskLevel = 'critical'
      result.riskScore = 100
      result.warnings.push(`Sanitization failed: ${(error as Error).message}`)
      result.sanitized = '' // Safe fallback
    }

    return result
  }

  /**
   * Sanitize multiple fields at once
   */
  sanitizeFields(
    fields: Record<string, any>, 
    fieldOptions?: Record<string, Partial<SanitizationOptions>>
  ): Record<string, SanitizationResult> {
    const results: Record<string, SanitizationResult> = {}

    for (const [fieldName, value] of Object.entries(fields)) {
      // Create field-specific sanitizer if options provided
      const sanitizer = fieldOptions?.[fieldName] 
        ? new InputSanitizer({ ...this.options, ...fieldOptions[fieldName] })
        : this

      results[fieldName] = sanitizer.sanitize(value, fieldName)
    }

    return results
  }

  /**
   * Quick sanitization for common use cases
   */
  static quick = {
    /**
     * Sanitize user input for display (HTML safe)
     */
    display: (input: string): string => {
      const sanitizer = new InputSanitizer({
        allowHtml: false,
        escapeHtml: true,
        stripWhitespace: true,
        maxLength: 1000
      })
      return sanitizer.sanitize(input).sanitized
    },

    /**
     * Sanitize search query
     */
    search: (input: string): string => {
      const sanitizer = new InputSanitizer({
        allowHtml: false,
        escapeHtml: false, // Don't escape, just remove HTML completely
        stripWhitespace: true,
        maxLength: 200,
        removeComments: true
      })
      return sanitizer.sanitize(input).sanitized
    },

    /**
     * Sanitize email input
     */
    email: (input: string): string => {
      const sanitizer = new InputSanitizer({
        allowHtml: false,
        convertToLowercase: true,
        stripWhitespace: true,
        maxLength: 320 // RFC 5321 limit
      })
      const result = sanitizer.sanitize(input).sanitized
      
      // Additional email-specific validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(result) ? result : ''
    },

    /**
     * Sanitize URL input
     */
    url: (input: string): string => {
      const sanitizer = new InputSanitizer({
        allowHtml: false,
        allowUrls: true,
        escapeHtml: false, // Don't escape URLs
        stripWhitespace: true,
        maxLength: 2048
      })
      const result = sanitizer.sanitize(input).sanitized
      
      try {
        new URL(result)
        return result
      } catch {
        return ''
      }
    },

    /**
     * Sanitize filename
     */
    filename: (input: string): string => {
      const sanitizer = new InputSanitizer({
        allowHtml: false,
        blockedPatterns: [
          /[<>:"/\\|?*\x00-\x1F]/g, // Invalid filename characters
          /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/gi, // Windows reserved names
          /\.(exe|bat|cmd|scr|pif|com)$/gi // Potentially dangerous extensions
        ],
        maxLength: 255
      })
      return sanitizer.sanitize(input).sanitized
    },

    /**
     * Sanitize JSON input
     */
    json: (input: string): any => {
      try {
        const parsed = JSON.parse(input)
        const sanitizer = new InputSanitizer({
          allowHtml: false,
          maxLength: 100000
        })
        return sanitizer.sanitize(parsed).sanitized
      } catch {
        return null
      }
    }
  }

  // Private helper methods

  private sanitizeString(input: string, fieldName: string, result: SanitizationResult): string {
    let sanitized = input

    // Remove null bytes
    if (this.options.removeNullBytes && sanitized.includes('\x00')) {
      sanitized = sanitized.replace(/\x00/g, '')
      result.changes.push({
        type: 'removed',
        field: fieldName,
        original: input,
        sanitized,
        reason: 'Removed null bytes'
      })
      result.riskScore += 20
    }

    // Convert to lowercase
    if (this.options.convertToLowercase) {
      const lowercase = sanitized.toLowerCase()
      if (lowercase !== sanitized) {
        result.changes.push({
          type: 'replaced',
          field: fieldName,
          original: sanitized,
          sanitized: lowercase,
          reason: 'Converted to lowercase'
        })
        sanitized = lowercase
      }
    }

    // Check length
    if (sanitized.length > this.options.maxLength) {
      const truncated = sanitized.substring(0, this.options.maxLength)
      result.changes.push({
        type: 'truncated',
        field: fieldName,
        original: sanitized,
        sanitized: truncated,
        reason: `Truncated to ${this.options.maxLength} characters`
      })
      sanitized = truncated
      result.riskScore += 10
      result.warnings.push(`Input truncated to ${this.options.maxLength} characters`)
    }

    // Check for blocked patterns
    for (const pattern of this.options.blockedPatterns) {
      if (pattern.test(sanitized)) {
        const cleaned = sanitized.replace(pattern, '')
        if (cleaned !== sanitized) {
          result.changes.push({
            type: 'removed',
            field: fieldName,
            original: sanitized,
            sanitized: cleaned,
            reason: `Removed blocked pattern: ${pattern.source}`
          })
          sanitized = cleaned
          // Score based on pattern danger level and context
          if (pattern.source.includes('script')) {
            // Lower score for scripts embedded in longer text (likely accidental/safer)
            const match = sanitized.match(pattern)?.[0] || ''
            const isEmbeddedScript = sanitized.length > match.length * 1.5
            result.riskScore += isEmbeddedScript ? 35 : 45
          } else {
            result.riskScore += 30
          }
        }
      }
    }

    // Remove comments first (before HTML escaping)
    if (this.options.removeComments) {
      const withoutComments = sanitized.replace(/<!--[\s\S]*?-->/g, '')
      if (withoutComments !== sanitized) {
        result.changes.push({
          type: 'removed',
          field: fieldName,
          original: sanitized,
          sanitized: withoutComments,
          reason: 'Removed HTML comments'
        })
        sanitized = withoutComments
        result.riskScore += 10
      }
    }

    // HTML processing - either escape or remove based on preference
    if (!this.options.allowHtml) {
      if (this.options.escapeHtml) {
        // Escape HTML first
        const escaped = this.escapeHtml(sanitized)
        if (escaped !== sanitized) {
          result.changes.push({
            type: 'encoded',
            field: fieldName,
            original: sanitized,
            sanitized: escaped,
            reason: 'HTML escaped'
          })
          sanitized = escaped
          result.riskScore += 25
        }
      } else {
        // Remove HTML tags when not escaping
        const withoutHtml = this.stripHtml(sanitized)
        if (withoutHtml !== sanitized) {
          result.changes.push({
            type: 'removed',
            field: fieldName,
            original: sanitized,
            sanitized: withoutHtml,
            reason: 'Removed HTML tags'
          })
          sanitized = withoutHtml
          result.riskScore += 25
        }
      }
    }

    // Strip whitespace (after all HTML processing)
    if (this.options.stripWhitespace) {
      let trimmed = sanitized.trim()
      // Also collapse multiple whitespace into single spaces
      trimmed = trimmed.replace(/\s+/g, ' ')
      if (trimmed !== sanitized) {
        result.changes.push({
          type: 'replaced',
          field: fieldName,
          original: sanitized,
          sanitized: trimmed,
          reason: 'Stripped whitespace'
        })
        sanitized = trimmed
      }
    }

    return sanitized
  }

  private sanitizeArray(input: any[], fieldName: string, result: SanitizationResult): any[] {
    const sanitized: any[] = []

    input.forEach((item, index) => {
      const itemFieldName = `${fieldName}[${index}]`
      const itemResult = this.sanitize(item, itemFieldName)
      
      sanitized.push(itemResult.sanitized)
      result.changes.push(...itemResult.changes)
      result.warnings.push(...itemResult.warnings)
      result.riskScore += itemResult.riskScore
      
      if (itemResult.blocked) {
        result.blocked = true
      }
    })

    return sanitized
  }

  private sanitizeObject(input: Record<string, any>, fieldName: string, result: SanitizationResult): Record<string, any> {
    const sanitized: Record<string, any> = {}

    for (const [key, value] of Object.entries(input)) {
      // Sanitize the key itself
      const keyResult = this.sanitize(key, `${fieldName}.key`)
      const sanitizedKey = keyResult.sanitized

      // Sanitize the value
      const valueFieldName = `${fieldName}.${key}`
      const valueResult = this.sanitize(value, valueFieldName)
      
      sanitized[sanitizedKey] = valueResult.sanitized
      
      result.changes.push(...keyResult.changes, ...valueResult.changes)
      result.warnings.push(...keyResult.warnings, ...valueResult.warnings)
      result.riskScore += keyResult.riskScore + valueResult.riskScore
      
      if (keyResult.blocked || valueResult.blocked) {
        result.blocked = true
      }
    }

    return sanitized
  }

  private sanitizeNumber(input: number, fieldName: string, result: SanitizationResult): number {
    if (!isFinite(input)) {
      result.changes.push({
        type: 'replaced',
        field: fieldName,
        original: String(input),
        sanitized: '0',
        reason: 'Replaced infinite or NaN with 0'
      })
      result.riskScore += 10
      return 0
    }

    // Check for reasonable bounds
    const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER
    const MIN_SAFE_INTEGER = Number.MIN_SAFE_INTEGER

    if (input > MAX_SAFE_INTEGER || input < MIN_SAFE_INTEGER) {
      const clamped = Math.max(MIN_SAFE_INTEGER, Math.min(MAX_SAFE_INTEGER, input))
      result.changes.push({
        type: 'replaced',
        field: fieldName,
        original: String(input),
        sanitized: String(clamped),
        reason: 'Clamped to safe integer range'
      })
      result.riskScore += 15
      return clamped
    }

    return input
  }

  private escapeHtml(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }

  private stripHtml(input: string): string {
    return input.replace(/<[^>]*>/g, '')
  }

  private assessRisk(result: SanitizationResult): void {
    const score = result.riskScore

    if (score >= 80) {
      result.riskLevel = 'critical'
      if (score >= 90) {
        result.blocked = true
        result.warnings.push('Input blocked due to critical security risk')
      }
    } else if (score >= 40) {
      result.riskLevel = 'high'
    } else if (score >= 15) {
      result.riskLevel = 'medium'
    } else {
      result.riskLevel = 'low'
    }

    // Additional risk factors
    const highRiskChanges = result.changes.filter(change => 
      change.type === 'removed' && change.reason.includes('blocked pattern')
    )

    if (highRiskChanges.length >= 3) {
      result.riskLevel = 'critical'
      result.riskScore += 20
    }
  }
}

/**
 * Validation patterns for common input types
 */
export const ValidationPatterns = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^\+?[\d\s\-\(\)]{10,}$/,
  url: /^https?:\/\/[^\s/$.?#].[^\s]*$/i,
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  ipv6: /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
  uuid: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  hex: /^[0-9a-fA-F]+$/,
  base64: /^[A-Za-z0-9+/]+=*$/
}

/**
 * Helper functions for common validation tasks
 */
export const ValidationHelpers = {
  /**
   * Check if a string matches a pattern
   */
  matches: (input: string, pattern: RegExp): boolean => {
    return pattern.test(input)
  },

  /**
   * Validate string length
   */
  length: (input: string, min: number, max: number): boolean => {
    return input.length >= min && input.length <= max
  },

  /**
   * Check if input contains only allowed characters
   */
  allowedChars: (input: string, allowedPattern: RegExp): boolean => {
    return allowedPattern.test(input)
  },

  /**
   * Check for presence of required fields
   */
  required: (input: any): boolean => {
    if (input === null || input === undefined) return false
    if (typeof input === 'string') return input.trim().length > 0
    if (Array.isArray(input)) return input.length > 0
    return true
  },

  /**
   * Validate numeric range
   */
  range: (input: number, min: number, max: number): boolean => {
    return input >= min && input <= max
  }
}

export default InputSanitizer