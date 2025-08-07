import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AIManager } from './AIManager'
import { ClaudeProvider } from './providers/ClaudeProvider'
import { OpenAIProvider } from './providers/OpenAIProvider'
import { MockProvider } from './providers/MockProvider'
import { createMockAIRequest, createMockAIResponse, mockFetch } from '@/tests/utils/test-utils'
import type { ProviderConfig, AIRequest, AIResponse } from './types'

// Mock providers
vi.mock('./providers/ClaudeProvider')
vi.mock('./providers/OpenAIProvider')
vi.mock('./providers/MockProvider')

describe('AIManager', () => {
  let aiManager: AIManager
  let mockConfig: ProviderConfig

  beforeEach(() => {
    // Setup mock config
    mockConfig = {
      claude: {
        apiKey: 'test-claude-key',
        baseUrl: 'https://api.anthropic.com',
        model: 'claude-3-haiku',
        maxTokens: 2048,
        defaultTemperature: 0.7,
        rateLimits: {
          requestsPerMinute: 50,
          tokensPerMinute: 100000,
          dailyTokenLimit: 1000000,
        },
      },
      openai: {
        apiKey: 'test-openai-key',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-3.5-turbo',
        maxTokens: 2048,
        defaultTemperature: 0.7,
        rateLimits: {
          requestsPerMinute: 60,
          tokensPerMinute: 150000,
          dailyTokenLimit: 1000000,
        },
      },
      fallback: {
        enabled: true,
        providers: ['claude', 'openai', 'mock'],
        maxRetries: 3,
        retryDelay: 1000,
      },
    }

    // Reset fetch mock
    global.fetch = mockFetch({})
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with all providers when API keys are provided', () => {
      aiManager = new AIManager(mockConfig)
      
      expect(ClaudeProvider).toHaveBeenCalledWith(mockConfig.claude)
      expect(OpenAIProvider).toHaveBeenCalledWith(mockConfig.openai)
      expect(MockProvider).toHaveBeenCalled()
    })

    it('should initialize without Claude provider when API key is missing', () => {
      const configWithoutClaude = {
        ...mockConfig,
        claude: { ...mockConfig.claude, apiKey: '' },
      }
      
      aiManager = new AIManager(configWithoutClaude)
      
      expect(ClaudeProvider).not.toHaveBeenCalled()
      expect(OpenAIProvider).toHaveBeenCalled()
      expect(MockProvider).toHaveBeenCalled()
    })

    it('should always initialize mock provider', () => {
      const minimalConfig = {
        ...mockConfig,
        claude: { ...mockConfig.claude, apiKey: '' },
        openai: { ...mockConfig.openai, apiKey: '' },
      }
      
      aiManager = new AIManager(minimalConfig)
      
      expect(MockProvider).toHaveBeenCalled()
    })
  })

  describe('Response Generation', () => {
    let mockClaudeProvider: any
    let mockOpenAIProvider: any
    let mockMockProvider: any

    beforeEach(() => {
      // Setup provider mocks
      mockClaudeProvider = {
        name: 'claude',
        priority: 1,
        isEnabled: true,
        generateResponse: vi.fn().mockResolvedValue(createMockAIResponse({ provider: 'claude' })),
        isHealthy: vi.fn().mockResolvedValue(true),
      }

      mockOpenAIProvider = {
        name: 'openai',
        priority: 2,
        isEnabled: true,
        generateResponse: vi.fn().mockResolvedValue(createMockAIResponse({ provider: 'openai' })),
        isHealthy: vi.fn().mockResolvedValue(true),
      }

      mockMockProvider = {
        name: 'mock',
        priority: 10,
        isEnabled: true,
        generateResponse: vi.fn().mockResolvedValue(createMockAIResponse({ provider: 'mock' })),
        isHealthy: vi.fn().mockResolvedValue(true),
      }

      vi.mocked(ClaudeProvider).mockImplementation(() => mockClaudeProvider as any)
      vi.mocked(OpenAIProvider).mockImplementation(() => mockOpenAIProvider as any)
      vi.mocked(MockProvider).mockImplementation(() => mockMockProvider as any)

      aiManager = new AIManager(mockConfig)
    })

    it('should generate response using primary provider', async () => {
      const request = createMockAIRequest()
      const response = await aiManager.generateResponse(request)

      expect(response).toBeDefined()
      expect(response.provider).toBe('claude')
      expect(mockClaudeProvider.generateResponse).toHaveBeenCalledWith(expect.objectContaining({
        messages: request.messages,
        context: request.context,
      }))
    })

    it('should use cache for repeated requests', async () => {
      const request = createMockAIRequest()
      
      // First request
      const response1 = await aiManager.generateResponse(request)
      expect(response1.cached).toBe(false)
      
      // Second request with same content
      const response2 = await aiManager.generateResponse(request)
      expect(response2.cached).toBe(true)
      expect(response2.content).toBe(response1.content)
      
      // Provider should only be called once
      expect(mockClaudeProvider.generateResponse).toHaveBeenCalledTimes(1)
    })

    it('should fallback to secondary provider on primary failure', async () => {
      // Make Claude fail
      mockClaudeProvider.generateResponse.mockRejectedValue({
        code: 'SERVER_ERROR',
        message: 'Internal server error',
        provider: 'claude',
        recoverable: true,
      })

      const request = createMockAIRequest()
      const response = await aiManager.generateResponse(request)

      expect(response.provider).toBe('openai')
      expect(mockOpenAIProvider.generateResponse).toHaveBeenCalled()
    })

    it('should fallback to mock provider when all API providers fail', async () => {
      // Make all API providers fail
      mockClaudeProvider.generateResponse.mockRejectedValue({
        code: 'SERVER_ERROR',
        message: 'Claude error',
        provider: 'claude',
        recoverable: true,
      })

      mockOpenAIProvider.generateResponse.mockRejectedValue({
        code: 'SERVER_ERROR',
        message: 'OpenAI error',
        provider: 'openai',
        recoverable: true,
      })

      const request = createMockAIRequest()
      const response = await aiManager.generateResponse(request)

      expect(response.provider).toBe('mock')
      expect(mockMockProvider.generateResponse).toHaveBeenCalled()
    })

    it('should respect circuit breaker when provider fails repeatedly', async () => {
      const error = {
        code: 'SERVER_ERROR',
        message: 'Server error',
        provider: 'claude',
        recoverable: true,
      }

      // Fail 5 times to trigger circuit breaker
      for (let i = 0; i < 5; i++) {
        mockClaudeProvider.generateResponse.mockRejectedValueOnce(error)
        try {
          await aiManager.generateResponse(createMockAIRequest())
        } catch (e) {
          // Expected to fail
        }
      }

      // Reset the mock
      mockClaudeProvider.generateResponse.mockResolvedValue(createMockAIResponse())

      // Next request should skip Claude due to open circuit
      const response = await aiManager.generateResponse(createMockAIRequest())
      expect(response.provider).toBe('openai')
      expect(mockClaudeProvider.generateResponse).toHaveBeenCalledTimes(5) // Not called again
    })

    it('should retry on retryable errors', async () => {
      const request = createMockAIRequest()
      const successResponse = createMockAIResponse({ provider: 'claude' })

      // Fail twice, then succeed
      mockClaudeProvider.generateResponse
        .mockRejectedValueOnce({
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit',
          provider: 'claude',
          recoverable: true,
        })
        .mockRejectedValueOnce({
          code: 'NETWORK_ERROR',
          message: 'Network error',
          provider: 'claude',
          recoverable: true,
        })
        .mockResolvedValueOnce(successResponse)

      // Use fake timers for retry delays
      vi.useFakeTimers()
      
      const responsePromise = aiManager.generateResponse(request)
      
      // Advance timers to handle retries
      await vi.runAllTimersAsync()
      
      const response = await responsePromise
      
      vi.useRealTimers()

      expect(response.provider).toBe('claude')
      expect(mockClaudeProvider.generateResponse).toHaveBeenCalledTimes(3)
    })

    it('should not retry on non-retryable errors', async () => {
      mockClaudeProvider.generateResponse.mockRejectedValue({
        code: 'INVALID_API_KEY',
        message: 'Invalid API key',
        provider: 'claude',
        recoverable: false,
      })

      const request = createMockAIRequest()
      const response = await aiManager.generateResponse(request)

      // Should immediately fallback without retrying
      expect(response.provider).toBe('openai')
      expect(mockClaudeProvider.generateResponse).toHaveBeenCalledTimes(1)
    })
  })

  describe('Usage Statistics', () => {
    let mockProvider: any

    beforeEach(() => {
      mockProvider = {
        name: 'claude',
        priority: 1,
        isEnabled: true,
        generateResponse: vi.fn().mockResolvedValue(createMockAIResponse({
          provider: 'claude',
          tokensUsed: 100,
          metadata: { totalCost: 0.025 },
        })),
        isHealthy: vi.fn().mockResolvedValue(true),
      }

      vi.mocked(ClaudeProvider).mockImplementation(() => mockProvider as any)
      aiManager = new AIManager(mockConfig)
    })

    it('should track usage statistics correctly', async () => {
      const request = createMockAIRequest()
      
      // Make several requests
      await aiManager.generateResponse(request)
      await aiManager.generateResponse(request) // Cached
      await aiManager.generateResponse({ ...request, messages: [{ role: 'user', content: 'Different message' }] })

      const stats = aiManager.getUsageStats()

      expect(stats.totalRequests).toBe(3)
      expect(stats.totalTokens).toBe(200) // 2 non-cached requests
      expect(stats.totalCost).toBe(0.05)
      expect(stats.cacheHitRate).toBeGreaterThan(0)
    })

    it('should track provider-specific statistics', async () => {
      const request = createMockAIRequest()
      await aiManager.generateResponse(request)

      const stats = aiManager.getUsageStats()
      const claudeStats = stats.providerUsage['claude']

      expect(claudeStats).toBeDefined()
      expect(claudeStats.requests).toBe(1)
      expect(claudeStats.tokens).toBe(100)
      expect(claudeStats.cost).toBe(0.025)
    })

    it('should track error rates', async () => {
      mockProvider.generateResponse.mockRejectedValue({
        code: 'SERVER_ERROR',
        message: 'Error',
        provider: 'claude',
        recoverable: false,
      })

      try {
        await aiManager.generateResponse(createMockAIRequest())
      } catch (e) {
        // Expected
      }

      const stats = aiManager.getUsageStats()
      expect(stats.errorRate).toBeGreaterThan(0)
    })
  })

  describe('Health Checks', () => {
    let providers: any

    beforeEach(() => {
      providers = {
        claude: {
          name: 'claude',
          priority: 1,
          isHealthy: vi.fn().mockResolvedValue(true),
        },
        openai: {
          name: 'openai',
          priority: 2,
          isHealthy: vi.fn().mockResolvedValue(false),
        },
        mock: {
          name: 'mock',
          priority: 10,
          isHealthy: vi.fn().mockResolvedValue(true),
        },
      }

      vi.mocked(ClaudeProvider).mockImplementation(() => providers.claude as any)
      vi.mocked(OpenAIProvider).mockImplementation(() => providers.openai as any)
      vi.mocked(MockProvider).mockImplementation(() => providers.mock as any)

      aiManager = new AIManager(mockConfig)
    })

    it('should check health of all providers', async () => {
      const health = await aiManager.checkHealth()

      expect(health).toEqual({
        claude: true,
        openai: false,
        mock: true,
      })

      expect(providers.claude.isHealthy).toHaveBeenCalled()
      expect(providers.openai.isHealthy).toHaveBeenCalled()
      expect(providers.mock.isHealthy).toHaveBeenCalled()
    })

    it('should handle health check errors gracefully', async () => {
      providers.claude.isHealthy.mockRejectedValue(new Error('Network error'))

      const health = await aiManager.checkHealth()

      expect(health.claude).toBe(false)
      expect(health.openai).toBe(false)
      expect(health.mock).toBe(true)
    })
  })

  describe('Cleanup', () => {
    it('should cleanup resources on shutdown', async () => {
      aiManager = new AIManager(mockConfig)
      const cleanupSpy = vi.spyOn(aiManager['cacheManager'], 'cleanup')

      await aiManager.shutdown()

      expect(cleanupSpy).toHaveBeenCalled()
    })
  })
})