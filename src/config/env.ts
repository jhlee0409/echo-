// 환경 변수 설정 및 검증
// Environment Variables Configuration and Validation

interface EnvConfig {
  // API Keys
  CLAUDE_API_KEY: string
  
  // Supabase Configuration
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  
  // Development Settings
  NODE_ENV: 'development' | 'production' | 'test'
  API_BASE_URL: string
  
  // Game Configuration
  MAX_DAILY_MESSAGES: number
  ENABLE_DEBUG_MODE: boolean
  
  // Feature Flags
  ENABLE_VOICE_CHAT: boolean
  ENABLE_ANALYTICS: boolean
  ENABLE_PAYMENT: boolean
}

// 환경 변수 기본값
const DEFAULT_CONFIG: Partial<EnvConfig> = {
  NODE_ENV: 'development',
  API_BASE_URL: 'http://localhost:3000',
  MAX_DAILY_MESSAGES: 50,
  ENABLE_DEBUG_MODE: true,
  ENABLE_VOICE_CHAT: false,
  ENABLE_ANALYTICS: false,
  ENABLE_PAYMENT: false,
}

// 환경 변수 파싱 및 타입 변환
function parseEnvVar<T>(
  value: string | undefined,
  type: 'string' | 'number' | 'boolean',
  defaultValue?: T
): T {
  if (!value) {
    if (defaultValue !== undefined) return defaultValue
    throw new Error(`Environment variable is required but not provided`)
  }

  switch (type) {
    case 'string':
      return value as T
    case 'number':
      const num = parseInt(value, 10)
      if (isNaN(num)) {
        throw new Error(`Invalid number: ${value}`)
      }
      return num as T
    case 'boolean':
      return (value.toLowerCase() === 'true') as T
    default:
      return value as T
  }
}

// 환경 변수 로딩 및 검증
function loadEnvConfig(): EnvConfig {
  try {
    const config: EnvConfig = {
      // API Keys (필수)
      CLAUDE_API_KEY: parseEnvVar(
        import.meta.env.VITE_CLAUDE_API_KEY,
        'string'
      ),
      
      // Supabase (필수)
      SUPABASE_URL: parseEnvVar(
        import.meta.env.VITE_SUPABASE_URL,
        'string'
      ),
      SUPABASE_ANON_KEY: parseEnvVar(
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        'string'
      ),
      
      // Development Settings
      NODE_ENV: parseEnvVar(
        import.meta.env.VITE_NODE_ENV || import.meta.env.MODE,
        'string',
        DEFAULT_CONFIG.NODE_ENV
      ) as 'development' | 'production' | 'test',
      
      API_BASE_URL: parseEnvVar(
        import.meta.env.VITE_API_BASE_URL,
        'string',
        DEFAULT_CONFIG.API_BASE_URL
      ),
      
      // Game Configuration
      MAX_DAILY_MESSAGES: parseEnvVar(
        import.meta.env.VITE_MAX_DAILY_MESSAGES,
        'number',
        DEFAULT_CONFIG.MAX_DAILY_MESSAGES
      ),
      
      ENABLE_DEBUG_MODE: parseEnvVar(
        import.meta.env.VITE_ENABLE_DEBUG_MODE,
        'boolean',
        DEFAULT_CONFIG.ENABLE_DEBUG_MODE
      ),
      
      // Feature Flags
      ENABLE_VOICE_CHAT: parseEnvVar(
        import.meta.env.VITE_ENABLE_VOICE_CHAT,
        'boolean',
        DEFAULT_CONFIG.ENABLE_VOICE_CHAT
      ),
      
      ENABLE_ANALYTICS: parseEnvVar(
        import.meta.env.VITE_ENABLE_ANALYTICS,
        'boolean',
        DEFAULT_CONFIG.ENABLE_ANALYTICS
      ),
      
      ENABLE_PAYMENT: parseEnvVar(
        import.meta.env.VITE_ENABLE_PAYMENT,
        'boolean',
        DEFAULT_CONFIG.ENABLE_PAYMENT
      ),
    }

    // 개발 모드에서 설정 검증 로그
    if (config.ENABLE_DEBUG_MODE && config.NODE_ENV === 'development') {
      console.log('🔧 Environment Configuration:', {
        NODE_ENV: config.NODE_ENV,
        API_BASE_URL: config.API_BASE_URL,
        MAX_DAILY_MESSAGES: config.MAX_DAILY_MESSAGES,
        ENABLE_DEBUG_MODE: config.ENABLE_DEBUG_MODE,
        HAS_CLAUDE_KEY: !!config.CLAUDE_API_KEY,
        HAS_SUPABASE_URL: !!config.SUPABASE_URL,
        HAS_SUPABASE_KEY: !!config.SUPABASE_ANON_KEY,
        FEATURE_FLAGS: {
          VOICE_CHAT: config.ENABLE_VOICE_CHAT,
          ANALYTICS: config.ENABLE_ANALYTICS,
          PAYMENT: config.ENABLE_PAYMENT,
        }
      })
    }

    return config
  } catch (error) {
    console.error('❌ Environment configuration error:', error)
    throw new Error(
      `Environment configuration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

// 환경별 API 엔드포인트
export const API_ENDPOINTS = {
  development: {
    ai: '/api/ai',
    auth: '/api/auth',
    game: '/api/game',
    analytics: '/api/analytics',
  },
  production: {
    ai: '/api/ai',
    auth: '/api/auth',  
    game: '/api/game',
    analytics: '/api/analytics',
  },
  test: {
    ai: '/mock/ai',
    auth: '/mock/auth',
    game: '/mock/game', 
    analytics: '/mock/analytics',
  },
} as const

// 환경 설정 내보내기
export const ENV = loadEnvConfig()

// API 엔드포인트 내보내기
export const ENDPOINTS = API_ENDPOINTS[ENV.NODE_ENV]

// 환경 변수 검증 함수
export function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // 필수 API 키 검증
  if (!ENV.CLAUDE_API_KEY) {
    errors.push('CLAUDE_API_KEY is required for AI functionality')
  }

  if (!ENV.SUPABASE_URL) {
    errors.push('SUPABASE_URL is required for database functionality')
  }

  if (!ENV.SUPABASE_ANON_KEY) {
    errors.push('SUPABASE_ANON_KEY is required for database functionality')
  }

  // API 키 형식 검증 (간단한 검증)
  if (ENV.CLAUDE_API_KEY && !ENV.CLAUDE_API_KEY.startsWith('sk-')) {
    errors.push('CLAUDE_API_KEY appears to be invalid (should start with sk-)')
  }


  // Supabase URL 형식 검증
  if (ENV.SUPABASE_URL && !ENV.SUPABASE_URL.startsWith('https://')) {
    errors.push('SUPABASE_URL should start with https://')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// 개발자 도우미 함수들
export const isDevelopment = ENV.NODE_ENV === 'development'
export const isProduction = ENV.NODE_ENV === 'production'
export const isTest = ENV.NODE_ENV === 'test'

// 로깅 도우미
export const log = {
  debug: (...args: any[]) => {
    if (ENV.ENABLE_DEBUG_MODE) {
      console.log('🐛', ...args)
    }
  },
  info: (...args: any[]) => {
    console.log('ℹ️', ...args)
  },
  warn: (...args: any[]) => {
    console.warn('⚠️', ...args)
  },
  error: (...args: any[]) => {
    console.error('❌', ...args)
  },
}