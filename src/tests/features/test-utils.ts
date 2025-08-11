import { vi } from 'vitest'
import type { AICompanion, GameState, Settings, EmotionType } from '@types'
import type { AIResponse } from '@services/ai/types'

/**
 * Test Utilities for Feature Tests
 * Provides common fixtures, mocks, and utilities for feature testing
 */

// Test Data Fixtures
export const createTestCompanion = (overrides: Partial<AICompanion> = {}): AICompanion => ({
  id: 'test_companion_001',
  name: '테스트 아리아',
  avatar: '/avatars/test-aria.png',
  personalityTraits: {
    cheerful: 0.7,
    careful: 0.4,
    curious: 0.8,
    emotional: 0.6,
    independent: 0.3,
  },
  relationshipStatus: {
    level: 1,
    experience: 0,
    experienceToNext: 100,
    intimacyLevel: 0.1,
    trustLevel: 0.1,
  },
  currentEmotion: {
    dominant: 'curious',
    intensity: 0.6,
    stability: 0.8,
  },
  memoryBank: {
    shortTerm: [],
    longTerm: [],
    preferences: {},
    keyMoments: [],
  },
  conversationContext: {
    currentTopic: null,
    recentTopics: [],
    moodHistory: [],
    responseStyle: 'friendly',
  },
  gameProgress: {
    unlockedFeatures: ['basic_chat'],
    completedEvents: [],
    availableEvents: ['first_meeting'],
    relationshipMilestones: [],
  },
  ...overrides
})

export const createTestGameState = (overrides: Partial<GameState> = {}): GameState => ({
  level: 1,
  experience: 0,
  conversationCount: 0,
  daysSinceStart: 0,
  playTime: 0,
  lastPlayed: Date.now(),
  lastSaved: null,
  isFirstTime: true,
  currentScene: 'main_room',
  unlockedFeatures: ['chat', 'status'],
  gameVersion: '1.0.0-test',
  ...overrides
})

export const createTestSettings = (overrides: Partial<Settings> = {}): Settings => ({
  soundEnabled: true,
  musicEnabled: true,
  animationsEnabled: true,
  darkMode: true,
  language: 'ko',
  notifications: true,
  autoSave: true,
  debugMode: true,
  ...overrides
})

export const mockAIResponse = (
  content: string, 
  emotion: EmotionType = 'happy',
  overrides: Partial<AIResponse> = {}
): AIResponse => ({
  content,
  emotion,
  confidence: 0.8,
  tokensUsed: 45,
  provider: 'claude',
  processingTime: 1000,
  cached: false,
  metadata: {
    model: 'claude-3-haiku-20240307',
    finishReason: 'stop',
    totalCost: 0.001,
    promptTokens: 25,
    completionTokens: 20,
    cacheHit: false,
    retryCount: 0,
  },
  ...overrides
})

// Mock AI Managers for Different Test Scenarios
export const createMockAIManager = (scenario: 'success' | 'failure' | 'slow' | 'variable') => {
  const baseManager = {
    isHealthy: vi.fn().mockResolvedValue(true),
    getHealthStatus: vi.fn().mockResolvedValue({ claude: true, mock: true }),
    shutdown: vi.fn().mockResolvedValue(undefined)
  }

  switch (scenario) {
    case 'success':
      return {
        ...baseManager,
        generateResponse: vi.fn().mockResolvedValue(
          mockAIResponse('성공적인 테스트 응답입니다!', 'happy')
        )
      }

    case 'failure':
      return {
        ...baseManager,
        isHealthy: vi.fn().mockResolvedValue(false),
        generateResponse: vi.fn().mockRejectedValue(new Error('AI service unavailable'))
      }

    case 'slow':
      return {
        ...baseManager,
        generateResponse: vi.fn().mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 3000))
          return mockAIResponse('느린 응답입니다.', 'thoughtful', { processingTime: 3000 })
        })
      }

    case 'variable':
      let callCount = 0
      return {
        ...baseManager,
        generateResponse: vi.fn().mockImplementation(async () => {
          callCount++
          const delay = Math.random() * 2000 + 500 // 500-2500ms
          await new Promise(resolve => setTimeout(resolve, delay))
          
          const emotions: EmotionType[] = ['happy', 'curious', 'playful', 'thoughtful']
          const emotion = emotions[callCount % emotions.length]
          
          return mockAIResponse(
            `가변적인 응답 ${callCount}번째입니다.`, 
            emotion,
            { processingTime: delay }
          )
        })
      }

    default:
      return baseManager
  }
}

// Performance Measurement Utilities
export const measurePerformance = async <T>(
  operation: () => Promise<T>,
  label?: string
): Promise<{ result: T; duration: number; memory: { before: number; after: number } }> => {
  const memoryBefore = process.memoryUsage().heapUsed
  const startTime = performance.now()
  
  const result = await operation()
  
  const endTime = performance.now()
  const memoryAfter = process.memoryUsage().heapUsed
  const duration = endTime - startTime
  
  if (label) {
    console.log(`Performance [${label}]: ${duration.toFixed(2)}ms, Memory: ${((memoryAfter - memoryBefore) / 1024 / 1024).toFixed(2)}MB`)
  }
  
  return {
    result,
    duration,
    memory: { before: memoryBefore, after: memoryAfter }
  }
}

// Test Data Validation Utilities
export const validateKoreanText = (text: string): boolean => {
  return /[가-힣]/.test(text)
}

export const validateEmotionType = (emotion: string): emotion is EmotionType => {
  const validEmotions: EmotionType[] = [
    'happy', 'excited', 'calm', 'sad', 'surprised', 
    'confused', 'angry', 'neutral', 'curious', 
    'thoughtful', 'playful', 'caring'
  ]
  return validEmotions.includes(emotion as EmotionType)
}

export const validatePersonalityTraits = (traits: Record<string, number>): boolean => {
  return Object.values(traits).every(value => 
    typeof value === 'number' && value >= 0 && value <= 1
  )
}

// Custom Test Matchers (for extending expect)
export const customMatchers = {
  toBeKoreanText: (received: string) => ({
    pass: validateKoreanText(received),
    message: () => `Expected "${received}" to contain Korean characters`
  }),
  
  toBeValidEmotion: (received: string) => ({
    pass: validateEmotionType(received),
    message: () => `Expected "${received}" to be a valid emotion type`
  }),
  
  toMaintainContext: (conversation: any[]) => {
    // Check if conversation maintains reasonable context
    const userMessages = conversation.filter(msg => msg.sender === 'user')
    const aiMessages = conversation.filter(msg => msg.sender === 'ai')
    
    const pass = userMessages.length === aiMessages.length && 
                 conversation.length > 0 &&
                 conversation.every(msg => msg.timestamp && msg.id)
    
    return {
      pass,
      message: () => `Expected conversation to maintain proper context structure`
    }
  },
  
  toBeWithinPerformanceThreshold: (duration: number, threshold: number) => ({
    pass: duration <= threshold,
    message: () => `Expected ${duration}ms to be within ${threshold}ms threshold`
  })
}

// Test Environment Setup Helpers
export const setupTestEnvironment = () => {
  // Mock console methods to reduce test noise while preserving errors
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'debug').mockImplementation(() => {})
  vi.spyOn(console, 'info').mockImplementation(() => {})
  
  // Preserve warnings and errors for debugging
  const originalWarn = console.warn
  const originalError = console.error
  
  return {
    cleanup: () => {
      vi.restoreAllMocks()
      console.warn = originalWarn
      console.error = originalError
    }
  }
}

// Load Testing Utilities
export const createLoadTestScenario = (
  messageCount: number, 
  concurrent: boolean = false
) => {
  const messages = Array.from({ length: messageCount }, (_, i) => 
    `부하 테스트 메시지 ${i + 1}`
  )
  
  return {
    messages,
    concurrent,
    expectedResponseCount: messageCount * 2, // User messages + AI responses
    estimatedTime: concurrent ? 
      Math.ceil(messageCount / 5) * 2000 : // Assume 5 concurrent max, 2s each
      messageCount * 2000 // Sequential: 2s per message
  }
}

// Memory Leak Detection
export const createMemoryLeakDetector = () => {
  const snapshots: number[] = []
  
  return {
    takeSnapshot: () => {
      if (global.gc) global.gc()
      snapshots.push(process.memoryUsage().heapUsed)
    },
    
    detectLeak: (thresholdMB: number = 50): {
      hasLeak: boolean
      growth: number
      snapshots: number[]
    } => {
      const growth = snapshots.length > 1 ? 
        snapshots[snapshots.length - 1] - snapshots[0] : 0
      const growthMB = growth / 1024 / 1024
      
      return {
        hasLeak: growthMB > thresholdMB,
        growth: growthMB,
        snapshots: [...snapshots]
      }
    }
  }
}

// Export all utilities
export const testUtils = {
  fixtures: {
    createTestCompanion,
    createTestGameState,
    createTestSettings,
    mockAIResponse
  },
  mocks: {
    createMockAIManager
  },
  performance: {
    measurePerformance,
    createLoadTestScenario,
    createMemoryLeakDetector
  },
  validation: {
    validateKoreanText,
    validateEmotionType,
    validatePersonalityTraits
  },
  matchers: customMatchers,
  environment: {
    setupTestEnvironment
  }
}