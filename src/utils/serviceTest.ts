/**
 * 🧪 Service Integration Test Utility
 * 실제 환경에서 서비스들이 정상 작동하는지 테스트
 */

import { ENV, validateEnvironment, log } from '@config/env'
import { supabase } from '@/lib/supabase'
import { getAIManager } from '@services/ai/AIManager'

export interface ServiceTestResult {
  service: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: any
}

/**
 * 환경 변수 검증 테스트
 */
export async function testEnvironmentConfig(): Promise<ServiceTestResult> {
  try {
    const validation = validateEnvironment()
    
    if (validation.valid) {
      log.info('Environment validation passed', ENV)
      return {
        service: 'Environment',
        status: 'success',
        message: 'All environment variables are properly configured',
        details: {
          nodeEnv: ENV.NODE_ENV,
          hasClaudeKey: !!ENV.CLAUDE_API_KEY,
          hasSupabaseConfig: !!ENV.SUPABASE_URL && !!ENV.SUPABASE_ANON_KEY,
          debugMode: ENV.ENABLE_DEBUG_MODE,
          featureFlags: {
            voiceChat: ENV.ENABLE_VOICE_CHAT,
            analytics: ENV.ENABLE_ANALYTICS,
            payment: ENV.ENABLE_PAYMENT
          }
        }
      }
    } else {
      return {
        service: 'Environment',
        status: 'error',
        message: 'Environment validation failed',
        details: validation.errors
      }
    }
  } catch (error) {
    return {
      service: 'Environment',
      status: 'error',
      message: `Environment test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    }
  }
}

/**
 * Supabase 연결 테스트
 */
export async function testSupabaseConnection(): Promise<ServiceTestResult> {
  try {
    log.debug('Testing Supabase connection...')
    
    // 간단한 연결 테스트 (public health check)
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count', { count: 'exact', head: true })
      .limit(1)
    
    if (error) {
      // 테이블이 존재하지 않거나 권한 문제일 수 있음
      log.warn('Supabase table access issue (expected in development)', error)
      
      // 기본 연결 테스트
      const { data: healthData, error: healthError } = await supabase.auth.getSession()
      
      if (healthError) {
        throw new Error(`Auth service error: ${healthError.message}`)
      }
      
      return {
        service: 'Supabase',
        status: 'warning',
        message: 'Connected to Supabase but tables may not be set up yet',
        details: {
          url: ENV.SUPABASE_URL,
          authService: 'working',
          tableAccess: 'limited',
          suggestion: 'Run database migrations if needed'
        }
      }
    }
    
    log.info('Supabase connection successful')
    return {
      service: 'Supabase',
      status: 'success',
      message: 'Successfully connected to Supabase database',
      details: {
        url: ENV.SUPABASE_URL,
        tableAccess: 'working',
        recordCount: data || 0
      }
    }
    
  } catch (error) {
    log.error('Supabase connection failed', error)
    return {
      service: 'Supabase',
      status: 'error',
      message: `Supabase connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: {
        url: ENV.SUPABASE_URL,
        error
      }
    }
  }
}

/**
 * AI Manager 초기화 테스트
 */
export async function testAIManager(): Promise<ServiceTestResult> {
  try {
    log.debug('Testing AI Manager initialization...')
    
    const aiManager = getAIManager()
    
    if (!aiManager) {
      throw new Error('AI Manager initialization failed')
    }
    
    // 간단한 테스트 요청 (캐시되지 않은 요청)
    const testRequest = {
      messages: [
        {
          role: 'user' as const,
          content: 'Hello! This is a connection test. Please respond with "Connection successful" if you can see this.'
        }
      ],
      context: {
        companionName: 'Test Assistant',
        companionPersonality: {
          cheerful: 0.8,
          caring: 0.7,
          playful: 0.6,
          curious: 0.9,
          thoughtful: 0.7,
          supportive: 0.8,
          independent: 0.5,
          emotional: 0.6,
          adaptability: 0.7,
          consistency: 0.8,
          authenticity: 0.9,
        },
        userPreferences: {
          communicationStyle: 'balanced',
          topics: ['general'],
          responseLength: 'medium',
          formality: 'casual',
          humor: 'light',
          supportLevel: 'moderate',
        },
        relationshipStatus: {
          intimacyLevel: 3,
          trustLevel: 3,
          totalInteractions: 1,
        },
        sessionContext: {
          gameMode: 'conversation',
          currentMood: 'neutral',
          recentTopics: [],
          timeOfDay: 'afternoon',
          location: 'home',
        },
        systemContext: {
          appVersion: '1.0.0',
          platform: 'web',
          features: ['basic-chat'],
          settings: {
            language: 'en',
            theme: 'default',
          },
        },
      },
    }
    
    log.debug('Sending test request to AI Manager...')
    const response = await aiManager.generateResponse(testRequest)
    
    if (response.success && response.response) {
      log.info('AI Manager test successful', {
        provider: response.provider,
        tokens: response.response.usage
      })
      
      return {
        service: 'AI Manager',
        status: 'success',
        message: 'AI Manager successfully generated response',
        details: {
          provider: response.provider,
          responsePreview: response.response.content.substring(0, 100) + '...',
          usage: response.response.usage,
          cached: response.cached || false
        }
      }
    } else {
      throw new Error(`AI response failed: ${response.error?.message || 'Unknown error'}`)
    }
    
  } catch (error) {
    log.error('AI Manager test failed', error)
    return {
      service: 'AI Manager',
      status: 'error',
      message: `AI Manager test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: {
        hasClaudeKey: !!ENV.CLAUDE_API_KEY,
        error
      }
    }
  }
}

/**
 * 전체 서비스 통합 테스트 실행
 */
export async function runServiceIntegrationTest(): Promise<ServiceTestResult[]> {
  log.info('🧪 Starting Service Integration Test...')
  
  const results: ServiceTestResult[] = []
  
  // 1. 환경 변수 검증
  results.push(await testEnvironmentConfig())
  
  // 2. Supabase 연결 테스트
  results.push(await testSupabaseConnection())
  
  // 3. AI Manager 테스트
  results.push(await testAIManager())
  
  // 결과 요약
  const successful = results.filter(r => r.status === 'success').length
  const warnings = results.filter(r => r.status === 'warning').length
  const errors = results.filter(r => r.status === 'error').length
  
  log.info('🧪 Service Integration Test Results:', {
    total: results.length,
    successful,
    warnings,
    errors,
    overallStatus: errors === 0 ? (warnings === 0 ? 'success' : 'warning') : 'error'
  })
  
  return results
}

/**
 * 브라우저 콘솔에서 쉽게 실행할 수 있는 글로벌 함수
 */
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.testServices = runServiceIntegrationTest
  // @ts-ignore
  window.testEnv = testEnvironmentConfig
  // @ts-ignore
  window.testSupabase = testSupabaseConnection
  // @ts-ignore
  window.testAI = testAIManager
}