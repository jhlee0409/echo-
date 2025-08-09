import { describe, it, expect } from 'vitest'
import InputSanitizer, { ValidationPatterns, ValidationHelpers } from '../InputSanitizer'

describe('InputSanitizer', () => {
  let sanitizer: InputSanitizer

  beforeEach(() => {
    sanitizer = new InputSanitizer()
  })

  describe('String Sanitization', () => {
    it('should sanitize clean strings without changes', () => {
      const result = sanitizer.sanitize('Hello World', 'test')
      
      expect(result.sanitized).toBe('Hello World')
      expect(result.changes).toHaveLength(0)
      expect(result.riskLevel).toBe('low')
      expect(result.riskScore).toBe(0)
      expect(result.blocked).toBe(false)
    })

    it('should remove script tags', () => {
      const maliciousInput = 'Hello <script>alert("xss")</script> World'
      const result = sanitizer.sanitize(maliciousInput, 'test')
      
      expect(result.sanitized).not.toContain('<script>')
      expect(result.changes.length).toBeGreaterThan(0)
      expect(result.riskScore).toBeGreaterThan(0)
      expect(result.riskLevel).toBe('medium')
    })

    it('should escape HTML entities', () => {
      const htmlInput = '<div>Content</div>'
      const result = sanitizer.sanitize(htmlInput, 'test')
      
      expect(result.sanitized).toContain('&lt;')
      expect(result.sanitized).toContain('&gt;')
      expect(result.changes.some(change => change.reason === 'HTML escaped')).toBe(true)
    })

    it('should remove null bytes', () => {
      const nullByteInput = 'test\x00string'
      const result = sanitizer.sanitize(nullByteInput, 'test')
      
      expect(result.sanitized).not.toContain('\x00')
      expect(result.changes.some(change => change.reason === 'Removed null bytes')).toBe(true)
    })

    it('should truncate long strings', () => {
      const longString = 'a'.repeat(15000)
      const result = sanitizer.sanitize(longString, 'test')
      
      expect(result.sanitized.length).toBeLessThanOrEqual(10000)
      expect(result.changes.some(change => change.type === 'truncated')).toBe(true)
      expect(result.warnings.some(warning => warning.includes('truncated'))).toBe(true)
    })

    it('should strip whitespace', () => {
      const whitespaceInput = '  hello world  '
      const result = sanitizer.sanitize(whitespaceInput, 'test')
      
      expect(result.sanitized).toBe('hello world')
      expect(result.changes.some(change => change.reason === 'Stripped whitespace')).toBe(true)
    })

    it('should convert to lowercase when configured', () => {
      const lowercaseSanitizer = new InputSanitizer({ convertToLowercase: true })
      const result = lowercaseSanitizer.sanitize('HELLO WORLD', 'test')
      
      expect(result.sanitized).toBe('hello world')
      expect(result.changes.some(change => change.reason === 'Converted to lowercase')).toBe(true)
    })

    it('should remove JavaScript protocol', () => {
      const jsInput = 'javascript:alert("xss")'
      const result = sanitizer.sanitize(jsInput, 'test')
      
      expect(result.sanitized).not.toContain('javascript:')
      expect(result.riskScore).toBeGreaterThan(40)
    })

    it('should remove event handlers', () => {
      const eventInput = '<img src="x" onerror="alert(1)">'
      const result = sanitizer.sanitize(eventInput, 'test')
      
      expect(result.sanitized).not.toContain('onerror=')
      expect(result.riskScore).toBeGreaterThan(0)
    })

    it('should remove SQL injection patterns', () => {
      const sqlInput = "'; DROP TABLE users; --"
      const result = sanitizer.sanitize(sqlInput, 'test')
      
      expect(result.sanitized).not.toContain('DROP TABLE')
      expect(result.riskScore).toBeGreaterThan(40)
    })

    it('should remove HTML comments', () => {
      const commentInput = 'Hello <!-- malicious comment --> World'
      const result = sanitizer.sanitize(commentInput, 'test')
      
      expect(result.sanitized).not.toContain('<!--')
      expect(result.changes.some(change => change.reason === 'Removed HTML comments')).toBe(true)
    })
  })

  describe('Array Sanitization', () => {
    it('should sanitize array elements', () => {
      const arrayInput = [
        'clean string',
        '<script>alert("xss")</script>',
        'another clean string'
      ]
      
      const result = sanitizer.sanitize(arrayInput, 'test')
      
      expect(Array.isArray(result.sanitized)).toBe(true)
      expect(result.sanitized[0]).toBe('clean string')
      expect(result.sanitized[1]).not.toContain('<script>')
      expect(result.sanitized[2]).toBe('another clean string')
      expect(result.changes.length).toBeGreaterThan(0)
    })

    it('should handle nested arrays', () => {
      const nestedArray = [
        ['clean', '<script>alert(1)</script>'],
        ['also clean', 'javascript:void(0)']
      ]
      
      const result = sanitizer.sanitize(nestedArray, 'test')
      
      expect(Array.isArray(result.sanitized)).toBe(true)
      expect(Array.isArray(result.sanitized[0])).toBe(true)
      expect(result.sanitized[0][1]).not.toContain('<script>')
      expect(result.sanitized[1][1]).not.toContain('javascript:')
    })

    it('should handle mixed type arrays', () => {
      const mixedArray = [
        'string',
        123,
        { key: '<script>alert(1)</script>' },
        true,
        null
      ]
      
      const result = sanitizer.sanitize(mixedArray, 'test')
      
      expect(result.sanitized[0]).toBe('string')
      expect(result.sanitized[1]).toBe(123)
      expect(result.sanitized[2].key).not.toContain('<script>')
      expect(result.sanitized[3]).toBe(true)
      expect(result.sanitized[4]).toBe(null)
    })
  })

  describe('Object Sanitization', () => {
    it('should sanitize object properties', () => {
      const objectInput = {
        name: 'John<script>alert("xss")</script>',
        email: 'john@example.com',
        description: 'A <b>bold</b> description'
      }
      
      const result = sanitizer.sanitize(objectInput, 'test')
      
      expect(result.sanitized.name).not.toContain('<script>')
      expect(result.sanitized.email).toBe('john@example.com')
      expect(result.sanitized.description).not.toContain('<b>')
      expect(result.changes.length).toBeGreaterThan(0)
    })

    it('should sanitize nested objects', () => {
      const nestedObject = {
        user: {
          profile: {
            bio: '<script>alert(1)</script>'
          }
        }
      }
      
      const result = sanitizer.sanitize(nestedObject, 'test')
      
      expect(result.sanitized.user.profile.bio).not.toContain('<script>')
    })

    it('should sanitize object keys', () => {
      const objectWithMaliciousKey = {
        'normal_key': 'value',
        '<script>alert(1)</script>': 'malicious key'
      }
      
      const result = sanitizer.sanitize(objectWithMaliciousKey, 'test')
      
      const keys = Object.keys(result.sanitized)
      expect(keys.some(key => key.includes('<script>'))).toBe(false)
    })
  })

  describe('Number Sanitization', () => {
    it('should pass through normal numbers', () => {
      const result = sanitizer.sanitize(42, 'test')
      
      expect(result.sanitized).toBe(42)
      expect(result.changes).toHaveLength(0)
    })

    it('should handle infinity', () => {
      const result = sanitizer.sanitize(Infinity, 'test')
      
      expect(result.sanitized).toBe(0)
      expect(result.changes.some(change => change.reason.includes('infinite'))).toBe(true)
    })

    it('should handle NaN', () => {
      const result = sanitizer.sanitize(NaN, 'test')
      
      expect(result.sanitized).toBe(0)
      expect(result.changes.some(change => change.reason.includes('NaN'))).toBe(true)
    })

    it('should clamp unsafe integers', () => {
      const unsafeNumber = Number.MAX_SAFE_INTEGER + 1000
      const result = sanitizer.sanitize(unsafeNumber, 'test')
      
      expect(result.sanitized).toBe(Number.MAX_SAFE_INTEGER)
      expect(result.changes.some(change => change.reason.includes('safe integer'))).toBe(true)
    })
  })

  describe('Boolean and Other Types', () => {
    it('should pass through booleans unchanged', () => {
      const trueResult = sanitizer.sanitize(true, 'test')
      const falseResult = sanitizer.sanitize(false, 'test')
      
      expect(trueResult.sanitized).toBe(true)
      expect(falseResult.sanitized).toBe(false)
      expect(trueResult.changes).toHaveLength(0)
      expect(falseResult.changes).toHaveLength(0)
    })

    it('should handle null and undefined', () => {
      const nullResult = sanitizer.sanitize(null, 'test')
      const undefinedResult = sanitizer.sanitize(undefined, 'test')
      
      expect(nullResult.sanitized).toBe(null)
      expect(undefinedResult.sanitized).toBe(undefined)
    })
  })

  describe('Custom Sanitizers', () => {
    it('should apply custom sanitizers', () => {
      const customSanitizer = new InputSanitizer({
        customSanitizers: {
          username: (value) => value.toLowerCase().replace(/[^a-z0-9]/g, '')
        }
      })
      
      const result = customSanitizer.sanitize('User@Name!123', 'username')
      
      expect(result.sanitized).toBe('username123')
      expect(result.changes.some(change => change.reason === 'Custom sanitization applied')).toBe(true)
    })
  })

  describe('Multiple Field Sanitization', () => {
    it('should sanitize multiple fields', () => {
      const fields = {
        name: '<script>alert(1)</script>John',
        email: 'JOHN@EXAMPLE.COM',
        age: 25,
        bio: 'A very long bio that exceeds limits'
      }
      
      const fieldOptions = {
        email: { convertToLowercase: true },
        bio: { maxLength: 20 }
      }
      
      const results = sanitizer.sanitizeFields(fields, fieldOptions)
      
      expect(results.name.sanitized).not.toContain('<script>')
      expect(results.email.sanitized).toBe('john@example.com')
      expect(results.age.sanitized).toBe(25)
      expect(results.bio.sanitized.length).toBeLessThanOrEqual(20)
    })
  })

  describe('Risk Assessment', () => {
    it('should assess low risk for clean input', () => {
      const result = sanitizer.sanitize('clean input', 'test')
      
      expect(result.riskLevel).toBe('low')
      expect(result.riskScore).toBe(0)
      expect(result.blocked).toBe(false)
    })

    it('should assess medium risk for HTML content', () => {
      const result = sanitizer.sanitize('<div>content</div>', 'test')
      
      expect(result.riskLevel).toBe('medium')
      expect(result.riskScore).toBeGreaterThan(20)
      expect(result.blocked).toBe(false)
    })

    it('should assess high risk for script content', () => {
      const result = sanitizer.sanitize('<script>alert(1)</script>', 'test')
      
      expect(result.riskLevel).toBe('high')
      expect(result.riskScore).toBeGreaterThan(40)
    })

    it('should block critical risk content', () => {
      const multipleThreats = [
        '<script>alert(1)</script>',
        'javascript:void(0)',
        'vbscript:msgbox(1)',
        'onload=alert(1)',
        'eval(malicious)'
      ].join(' ')
      
      const result = sanitizer.sanitize(multipleThreats, 'test')
      
      expect(result.riskLevel).toBe('critical')
      expect(result.blocked).toBe(true)
      expect(result.warnings.some(w => w.includes('blocked'))).toBe(true)
    })
  })

  describe('Quick Sanitization Methods', () => {
    describe('display', () => {
      it('should sanitize for display', () => {
        const result = InputSanitizer.quick.display('<script>alert(1)</script>Hello')
        
        expect(result).not.toContain('<script>')
        expect(result).toContain('Hello')
      })
    })

    describe('search', () => {
      it('should sanitize search queries', () => {
        const result = InputSanitizer.quick.search('  search <script>  ')
        
        expect(result).toBe('search')
        expect(result).not.toContain('<script>')
      })
    })

    describe('email', () => {
      it('should sanitize and validate emails', () => {
        const validResult = InputSanitizer.quick.email('  JOHN@EXAMPLE.COM  ')
        const invalidResult = InputSanitizer.quick.email('invalid-email')
        
        expect(validResult).toBe('john@example.com')
        expect(invalidResult).toBe('')
      })
    })

    describe('url', () => {
      it('should sanitize and validate URLs', () => {
        const validResult = InputSanitizer.quick.url('  https://example.com  ')
        const invalidResult = InputSanitizer.quick.url('not-a-url')
        
        expect(validResult).toBe('https://example.com')
        expect(invalidResult).toBe('')
      })
    })

    describe('filename', () => {
      it('should sanitize filenames', () => {
        const result = InputSanitizer.quick.filename('file<>name?.txt')
        
        expect(result).not.toContain('<')
        expect(result).not.toContain('>')
        expect(result).not.toContain('?')
      })

      it('should block dangerous extensions', () => {
        const result = InputSanitizer.quick.filename('malware.exe')
        
        expect(result).not.toContain('.exe')
      })

      it('should block Windows reserved names', () => {
        const result = InputSanitizer.quick.filename('CON.txt')
        
        expect(result).not.toBe('CON.txt')
      })
    })

    describe('json', () => {
      it('should sanitize JSON input', () => {
        const jsonString = '{"name": "<script>alert(1)</script>", "age": 25}'
        const result = InputSanitizer.quick.json(jsonString)
        
        expect(result.name).not.toContain('<script>')
        expect(result.age).toBe(25)
      })

      it('should handle invalid JSON', () => {
        const result = InputSanitizer.quick.json('invalid json')
        
        expect(result).toBe(null)
      })
    })
  })

  describe('Validation Patterns', () => {
    it('should validate email patterns', () => {
      expect(ValidationPatterns.email.test('user@example.com')).toBe(true)
      expect(ValidationPatterns.email.test('invalid-email')).toBe(false)
    })

    it('should validate URL patterns', () => {
      expect(ValidationPatterns.url.test('https://example.com')).toBe(true)
      expect(ValidationPatterns.url.test('not-a-url')).toBe(false)
    })

    it('should validate UUID patterns', () => {
      expect(ValidationPatterns.uuid.test('123e4567-e89b-12d3-a456-426614174000')).toBe(true)
      expect(ValidationPatterns.uuid.test('invalid-uuid')).toBe(false)
    })

    it('should validate alphanumeric patterns', () => {
      expect(ValidationPatterns.alphanumeric.test('abc123')).toBe(true)
      expect(ValidationPatterns.alphanumeric.test('abc-123')).toBe(false)
    })
  })

  describe('Validation Helpers', () => {
    it('should check pattern matches', () => {
      expect(ValidationHelpers.matches('abc123', /^[a-z0-9]+$/)).toBe(true)
      expect(ValidationHelpers.matches('abc-123', /^[a-z0-9]+$/)).toBe(false)
    })

    it('should validate string length', () => {
      expect(ValidationHelpers.length('hello', 3, 10)).toBe(true)
      expect(ValidationHelpers.length('hi', 3, 10)).toBe(false)
      expect(ValidationHelpers.length('very long string', 3, 10)).toBe(false)
    })

    it('should check allowed characters', () => {
      expect(ValidationHelpers.allowedChars('abc123', /^[a-z0-9]+$/)).toBe(true)
      expect(ValidationHelpers.allowedChars('abc-123', /^[a-z0-9]+$/)).toBe(false)
    })

    it('should validate required fields', () => {
      expect(ValidationHelpers.required('hello')).toBe(true)
      expect(ValidationHelpers.required('   ')).toBe(false)
      expect(ValidationHelpers.required('')).toBe(false)
      expect(ValidationHelpers.required(null)).toBe(false)
      expect(ValidationHelpers.required(undefined)).toBe(false)
      expect(ValidationHelpers.required([1, 2])).toBe(true)
      expect(ValidationHelpers.required([])).toBe(false)
    })

    it('should validate numeric ranges', () => {
      expect(ValidationHelpers.range(5, 1, 10)).toBe(true)
      expect(ValidationHelpers.range(0, 1, 10)).toBe(false)
      expect(ValidationHelpers.range(15, 1, 10)).toBe(false)
    })
  })

  describe('Configuration Options', () => {
    it('should respect maxLength option', () => {
      const shortSanitizer = new InputSanitizer({ maxLength: 5 })
      const result = shortSanitizer.sanitize('hello world', 'test')
      
      expect(result.sanitized).toBe('hello')
      expect(result.changes.some(change => change.type === 'truncated')).toBe(true)
    })

    it('should respect allowHtml option', () => {
      const htmlSanitizer = new InputSanitizer({ allowHtml: true, escapeHtml: false })
      const result = htmlSanitizer.sanitize('<div>content</div>', 'test')
      
      expect(result.sanitized).toBe('<div>content</div>')
      expect(result.riskScore).toBe(0)
    })

    it('should use custom blocked patterns', () => {
      const customSanitizer = new InputSanitizer({
        blockedPatterns: [/badword/gi]
      })
      const result = customSanitizer.sanitize('This contains badword', 'test')
      
      expect(result.sanitized).not.toContain('badword')
    })
  })

  describe('Error Handling', () => {
    it('should handle sanitization errors gracefully', () => {
      // Mock a scenario that would cause an error
      const faultySanitizer = new InputSanitizer({
        customSanitizers: {
          test: () => {
            throw new Error('Custom sanitizer error')
          }
        }
      })
      
      const result = faultySanitizer.sanitize('input', 'test')
      
      expect(result.blocked).toBe(true)
      expect(result.riskLevel).toBe('critical')
      expect(result.sanitized).toBe('')
      expect(result.warnings.some(w => w.includes('failed'))).toBe(true)
    })
  })
})