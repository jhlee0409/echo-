/**
 * Service Integration Tests
 * 
 * Tests the service integration system including ServiceManager,
 * DIContainer, InterceptorManager, and unified service access
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ServiceIntegration } from '../ServiceIntegration'
import { ServiceManager } from '../ServiceManager'
import { DIContainer } from '../DIContainer'
import { InterceptorManager } from '../InterceptorManager'
import type { ServiceDefinition } from '../types'

// Mock service implementations
const mockAIService = {
  async processMessage(content: string) {
    return { response: `AI response to: ${content}`, emotion: 'happy' }
  },
  async initialize() {},
  async shutdown() {},
  async healthCheck() {
    return { healthy: true, message: 'AI service operational' }
  }
}

const mockSecurityService = {
  validateInput(input: string) {
    return input.length > 0 && input.length < 1000
  },
  sanitizeInput(input: string) {
    return input.replace(/<[^>]*>/g, '') // Remove HTML tags
  },
  async initialize() {},
  async shutdown() {},
  async healthCheck() {
    return { healthy: true, message: 'Security service operational' }
  }
}

const mockCharacterService = {
  getCharacter() {
    return { id: 'test-char', name: 'Test Character', emotion: 'neutral' }
  },
  async updateEmotion(emotion: string, intensity: number) {
    console.log(`Emotion updated: ${emotion} (${intensity})`)
  },
  async initialize() {},
  async shutdown() {},
  async healthCheck() {
    return { healthy: true, message: 'Character service operational' }
  }
}

describe('ServiceIntegration', () => {
  let integration: ServiceIntegration
  let testServiceDefinitions: ServiceDefinition<any>[]

  beforeEach(() => {
    // Define test services
    testServiceDefinitions = [
      {
        name: 'SecurityService',
        factory: () => mockSecurityService,
        dependencies: [],
        singleton: true,
        healthCheck: (service) => service.healthCheck()
      },
      {
        name: 'AIService',
        factory: (deps) => mockAIService,
        dependencies: ['SecurityService'],
        singleton: true,
        healthCheck: (service) => service.healthCheck()
      },
      {
        name: 'CharacterService',
        factory: () => mockCharacterService,
        dependencies: [],
        singleton: true,
        healthCheck: (service) => service.healthCheck()
      }
    ]

    integration = new ServiceIntegration({
      enableHealthChecks: true,
      healthCheckInterval: 5000,
      enableInterceptors: true,
      enableMiddleware: true
    })
  })

  afterEach(async () => {
    if (integration.isReady()) {
      await integration.shutdown()
    }
  })

  describe('Initialization', () => {
    it('should initialize with service definitions', async () => {
      await integration.initialize(testServiceDefinitions)
      
      expect(integration.isReady()).toBe(true)
      
      const status = integration.getStatus()
      expect(status.initialized).toBe(true)
      expect(status.servicesRegistered).toBeGreaterThan(0)
    })

    it('should handle initialization without service definitions', async () => {
      await integration.initialize()
      
      expect(integration.isReady()).toBe(true)
    })

    it('should not double initialize', async () => {
      await integration.initialize(testServiceDefinitions)
      
      // Second initialization should be a no-op
      await integration.initialize()
      
      expect(integration.isReady()).toBe(true)
    })
  })

  describe('Service Registration and Resolution', () => {
    beforeEach(async () => {
      await integration.initialize(testServiceDefinitions)
    })

    it('should register and resolve services', () => {
      expect(integration.hasService('SecurityService')).toBe(true)
      expect(integration.hasService('AIService')).toBe(true)
      expect(integration.hasService('CharacterService')).toBe(true)
      
      const securityService = integration.getService('SecurityService')
      expect(securityService).toBeDefined()
      expect(typeof securityService.validateInput).toBe('function')
    })

    it('should resolve services with dependencies', () => {
      const aiService = integration.getService('AIService')
      expect(aiService).toBeDefined()
      expect(typeof aiService.processMessage).toBe('function')
    })

    it('should throw error for non-existent service', () => {
      expect(() => {
        integration.getService('NonExistentService')
      }).toThrow('Service not found: NonExistentService')
    })

    it('should resolve services asynchronously', async () => {
      const aiService = await integration.getServiceAsync('AIService')
      expect(aiService).toBeDefined()
      
      const result = await aiService.processMessage('test message')
      expect(result.response).toContain('test message')
    })
  })

  describe('Health Monitoring', () => {
    beforeEach(async () => {
      await integration.initialize(testServiceDefinitions)
    })

    it('should provide health report', async () => {
      const healthReport = await integration.getHealthReport()
      
      expect(healthReport.healthy).toBe(true)
      expect(healthReport.services).toBeDefined()
      
      // All test services should be healthy
      expect(healthReport.services.SecurityService.status).toBe('healthy')
      expect(healthReport.services.AIService.status).toBe('healthy')
      expect(healthReport.services.CharacterService.status).toBe('healthy')
    })

    it('should collect service metrics', () => {
      const metrics = integration.getMetrics()
      expect(metrics).toBeDefined()
      
      // Should have metrics for each service
      expect(Object.keys(metrics).length).toBeGreaterThan(0)
      
      const securityMetrics = metrics.SecurityService
      if (securityMetrics) {
        expect(securityMetrics.initializationTime).toBeGreaterThanOrEqual(0)
        expect(securityMetrics.accessCount).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('Interceptors', () => {
    beforeEach(async () => {
      await integration.initialize(testServiceDefinitions)
    })

    it('should apply interceptors to service methods', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      const aiService = integration.getService('AIService')
      await aiService.processMessage('intercepted message')
      
      // Should log method completion (from performance interceptor)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AIService.processMessage] Completed')
      )
      
      consoleSpy.mockRestore()
    })

    it('should get interceptor statistics', () => {
      const stats = integration.getInterceptorStats()
      
      expect(stats.enabled).toBe(true)
      expect(stats.globalInterceptors).toBeGreaterThan(0)
    })
  })

  describe('Middleware', () => {
    beforeEach(async () => {
      await integration.initialize(testServiceDefinitions)
    })

    it('should execute operations with middleware', async () => {
      const result = await integration.executeWithMiddleware(
        'TestService',
        'testOperation',
        { data: 'test' },
        async () => ({ success: true, data: 'processed' })
      )
      
      expect(result.success).toBe(true)
      expect(result.data).toBe('processed')
    })
  })

  describe('Configuration', () => {
    beforeEach(async () => {
      await integration.initialize(testServiceDefinitions)
    })

    it('should update service configuration', () => {
      expect(() => {
        integration.updateServiceConfig('AIService', { timeout: 5000 })
      }).not.toThrow()
    })

    it('should update integration configuration', () => {
      integration.updateIntegrationConfig({
        enableInterceptors: false,
        enableMiddleware: false
      })
      
      const status = integration.getStatus()
      expect(status.interceptorsEnabled).toBe(false)
      expect(status.middlewareEnabled).toBe(false)
    })
  })

  describe('Shutdown', () => {
    it('should shutdown gracefully', async () => {
      await integration.initialize(testServiceDefinitions)
      expect(integration.isReady()).toBe(true)
      
      await integration.shutdown()
      expect(integration.isReady()).toBe(false)
    })

    it('should handle shutdown when not initialized', async () => {
      expect(integration.isReady()).toBe(false)
      
      // Should not throw
      await integration.shutdown()
      expect(integration.isReady()).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle service registration errors', () => {
      const badDefinition: ServiceDefinition<any> = {
        name: 'BadService',
        factory: () => {
          throw new Error('Service creation failed')
        },
        dependencies: []
      }

      integration.registerService(badDefinition)
      
      expect(() => {
        integration.getService('BadService')
      }).toThrow()
    })

    it('should handle circular dependencies', async () => {
      // Use a separate integration instance for this test
      const testIntegration = new ServiceIntegration()
      
      const circularDefinitions: ServiceDefinition<any>[] = [
        {
          name: 'ServiceA',
          factory: () => ({ name: 'A' }),
          dependencies: ['ServiceB']
        },
        {
          name: 'ServiceB',
          factory: () => ({ name: 'B' }),
          dependencies: ['ServiceA']
        }
      ]

      await expect(
        testIntegration.initialize(circularDefinitions)
      ).rejects.toThrow(/circular dependency/i)
      
      // Clean up
      if (testIntegration.isReady()) {
        await testIntegration.shutdown()
      }
    })
  })

  describe('Integration Components', () => {
    it('should have ServiceManager instance', () => {
      expect(integration['serviceManager']).toBeInstanceOf(ServiceManager)
    })

    it('should have DIContainer instance', () => {
      expect(integration['diContainer']).toBeInstanceOf(DIContainer)
    })

    it('should have InterceptorManager instance', () => {
      expect(integration['interceptorManager']).toBeInstanceOf(InterceptorManager)
    })
  })
})

describe('Integration Bootstrap', () => {
  // Reset module state before each test
  beforeEach(async () => {
    // Clear any global state
    vi.resetModules()
  })

  afterEach(async () => {
    // Ensure clean shutdown
    try {
      const { shutdownServiceIntegration } = await import('../index')
      await shutdownServiceIntegration()
    } catch {
      // Ignore shutdown errors in tests
    }
    vi.resetModules()
  })

  it('should bootstrap and shutdown integration system', async () => {
    const { 
      bootstrapServiceIntegration, 
      shutdownServiceIntegration, 
      isServiceIntegrationReady,
      getServiceIntegrationStatus
    } = await import('../index')

    expect(isServiceIntegrationReady()).toBe(false)

    await bootstrapServiceIntegration({
      enableHealthChecks: false,
      enableInterceptors: true
    })

    expect(isServiceIntegrationReady()).toBe(true)
    
    const status = getServiceIntegrationStatus()
    expect(status.ready).toBe(true)
    expect(status.status?.initialized).toBe(true)

    await shutdownServiceIntegration()
    expect(isServiceIntegrationReady()).toBe(false)
  })

  it('should provide service accessor functions', async () => {
    const { 
      bootstrapServiceIntegration,
      shutdownServiceIntegration,
      getService,
      hasService
    } = await import('../index')

    await bootstrapServiceIntegration({
      enableHealthChecks: false,
      enableInterceptors: false
    })

    // Test generic service accessor
    expect(hasService('SecurityService')).toBe(true)
    
    const securityService = getService('SecurityService')
    expect(securityService).toBeDefined()

    await shutdownServiceIntegration()
  })
})