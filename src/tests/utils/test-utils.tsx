import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { vi } from 'vitest'

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Mock data generators
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
  user_metadata: {
    display_name: 'Test User',
    language: 'ko',
    timezone: 'Asia/Seoul',
  },
  app_metadata: {
    role: 'user',
    subscription: 'free',
  },
  ...overrides,
})

export const createMockCompanion = (overrides = {}) => ({
  id: 'companion-001',
  name: '루나',
  personality: {
    cheerful: 0.7,
    careful: 0.4,
    curious: 0.8,
    emotional: 0.6,
    independent: 0.3,
    playful: 0.7,
    supportive: 0.8,
  },
  relationship: {
    level: 1,
    experience: 0,
    experienceToNext: 100,
    intimacyLevel: 0.1,
    trustLevel: 0.2,
  },
  currentEmotion: 'happy' as const,
  ...overrides,
})

export const createMockAIRequest = (overrides = {}) => ({
  messages: [
    { role: 'user' as const, content: '안녕하세요!' }
  ],
  context: {
    companionName: '루나',
    companionPersonality: createMockCompanion().personality,
    relationshipLevel: 1,
    intimacyLevel: 0.1,
    companionEmotion: 'happy' as const,
    currentScene: 'home',
    timeOfDay: 'afternoon' as const,
    recentTopics: [],
    recentMemories: [],
    conversationTone: 'casual' as const,
    userEmotionalState: 'neutral' as const,
  },
  options: {
    maxTokens: 150,
    temperature: 0.7,
  },
  ...overrides,
})

export const createMockAIResponse = (overrides = {}) => ({
  content: '안녕! 오늘은 어떤 하루를 보내고 있어?',
  emotion: 'happy' as const,
  confidence: 0.9,
  tokensUsed: 25,
  provider: 'mock' as const,
  processingTime: 150,
  cached: false,
  metadata: {
    model: 'mock-v1',
    finishReason: 'stop',
    totalCost: 0,
    promptTokens: 15,
    completionTokens: 10,
    cacheHit: false,
    retryCount: 0,
  },
  ...overrides,
})

// Mock timers utility
export const mockTimers = () => {
  vi.useFakeTimers()
  return {
    advance: (ms: number) => vi.advanceTimersByTime(ms),
    runAll: () => vi.runAllTimers(),
    restore: () => vi.useRealTimers(),
  }
}

// Wait utility
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Mock fetch utility
export const mockFetch = (response: any, options = {}) => {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => response,
    text: async () => JSON.stringify(response),
    headers: new Headers(),
    ...options,
  })
}