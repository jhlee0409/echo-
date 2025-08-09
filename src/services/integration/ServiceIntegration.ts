/**
 * 🎯 Service Integration
 * 
 * Main facade for the service integration system
 * Coordinates ServiceManager, DIContainer, and InterceptorManager
 */

import { getServiceManager, ServiceManager } from './ServiceManager'
import { getDIContainer, DIContainer } from './DIContainer'
import { 
  getInterceptorManager, 
  InterceptorManager,
  createLoggingInterceptor,
  createPerformanceInterceptor,
  createErrorHandlingInterceptor,
  createRateLimitingMiddleware
} from './InterceptorManager'
import type {
  ServiceDefinition,
  ServiceIntegrationConfig,
  ServiceHealthReport,
  ServiceMetrics,
  CoreServiceInterface
} from './types'

export class ServiceIntegration {
  private serviceManager: ServiceManager
  private diContainer: DIContainer
  private interceptorManager: InterceptorManager
  private config: ServiceIntegrationConfig
  private isInitialized = false

  constructor(config: Partial<ServiceIntegrationConfig> = {}) {
    this.config = {
      enableHealthChecks: true,
      healthCheckInterval: 30000,
      enableMetrics: true,
      metricsInterval: 60000,
      enableInterceptors: true,
      enableMiddleware: true,
      shutdownTimeout: 10000,
      circuitBreakerConfig: {
        enabled: false,
        failureThreshold: 5,
        resetTimeout: 30000,
        monitoringWindow: 60000
      },
      rateLimitConfig: {
        enabled: false,
        requestsPerSecond: 10,
        burstSize: 20,
        windowSize: 1000
      },
      ...config
    }

    this.serviceManager = getServiceManager()
    this.diContainer = getDIContainer() as DIContainer
    this.interceptorManager = getInterceptorManager()
    
    this.setupDefaultInterceptors()
  }

  // Initialization
  async initialize(serviceDefinitions?: ServiceDefinition<any>[]): Promise<void> {
    if (this.isInitialized) {
      console.log('Service Integration already initialized')
      return
    }

    try {
      console.log('🚀 Initializing Service Integration...')

      // Register services with both ServiceManager and DI Container
      if (serviceDefinitions) {
        for (const definition of serviceDefinitions) {
          this.registerService(definition)
        }
      }

      // Initialize ServiceManager
      await this.serviceManager.initialize()

      // Start health checks if enabled
      if (this.config.enableHealthChecks) {
        this.startHealthChecks()
      }

      // Start metrics collection if enabled
      if (this.config.enableMetrics) {
        this.startMetricsCollection()
      }

      this.isInitialized = true
      console.log('✅ Service Integration initialized successfully')

    } catch (error) {
      console.error('❌ Failed to initialize Service Integration:', error)
      throw error
    }
  }

  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return
    }

    console.log('🛑 Shutting down Service Integration...')

    try {
      // Shutdown ServiceManager with timeout
      const shutdownPromise = this.serviceManager.shutdown()
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Shutdown timeout')), this.config.shutdownTimeout)
      )

      await Promise.race([shutdownPromise, timeoutPromise])

      this.isInitialized = false
      console.log('✅ Service Integration shutdown complete')

    } catch (error) {
      console.error('❌ Error during Service Integration shutdown:', error)
      throw error
    }
  }

  // Service Registration (unified)
  registerService<T>(definition: ServiceDefinition<T>): void {
    // Register with ServiceManager
    this.serviceManager.register(definition)

    // Register with DI Container
    const binding = this.diContainer.bind<T>(definition.name)

    if (definition.singleton) {
      binding.toFactory((container) => {
        return this.serviceManager.get<T>(definition.name)
      }).inSingletonScope()
    } else {
      binding.toFactory((container) => {
        return this.serviceManager.get<T>(definition.name)
      }).inTransientScope()
    }

    console.log(`🔧 Service registered in integration system: ${definition.name}`)
  }

  // Service Resolution (unified)
  getService<T>(name: string): T {
    try {
      // Try ServiceManager first
      if (this.serviceManager.has(name)) {
        const service = this.serviceManager.get<T>(name)
        
        // Apply interceptors if enabled
        if (this.config.enableInterceptors && typeof service === 'object' && service !== null) {
          return this.interceptorManager.createProxy(name, service)
        }
        
        return service
      }

      // Fallback to DI Container
      if (this.diContainer.has(name)) {
        return this.diContainer.get<T>(name)
      }

      throw new Error(`Service not found: ${name}`)
      
    } catch (error) {
      console.error(`❌ Failed to get service ${name}:`, error)
      throw error
    }
  }

  async getServiceAsync<T>(name: string): Promise<T> {
    try {
      // Try ServiceManager first
      if (this.serviceManager.has(name)) {
        const service = await this.serviceManager.getAsync<T>(name)
        
        // Apply interceptors if enabled
        if (this.config.enableInterceptors && typeof service === 'object' && service !== null) {
          return this.interceptorManager.createProxy(name, service)
        }
        
        return service
      }

      // Fallback to DI Container
      if (this.diContainer.has(name)) {
        return await this.diContainer.getAsync<T>(name)
      }

      throw new Error(`Service not found: ${name}`)
      
    } catch (error) {
      console.error(`❌ Failed to get service async ${name}:`, error)
      throw error
    }
  }

  hasService(name: string): boolean {
    return this.serviceManager.has(name) || this.diContainer.has(name)
  }

  // Health & Monitoring
  async getHealthReport(): Promise<ServiceHealthReport> {
    return this.serviceManager.healthCheck()
  }

  getMetrics(): Record<string, ServiceMetrics> {
    return this.serviceManager.getMetrics()
  }

  getInterceptorStats(): Record<string, any> {
    return this.interceptorManager.getInterceptorStats()
  }

  // Configuration
  updateServiceConfig(serviceName: string, config: Record<string, any>): void {
    this.serviceManager.updateConfiguration(serviceName, config)
  }

  updateIntegrationConfig(config: Partial<ServiceIntegrationConfig>): void {
    this.config = { ...this.config, ...config }
    
    if (config.enableInterceptors !== undefined) {
      if (config.enableInterceptors) {
        this.interceptorManager.enable()
      } else {
        this.interceptorManager.disable()
      }
    }
  }

  // Utility Methods
  async executeWithMiddleware<T>(
    serviceName: string,
    operation: string,
    payload: any,
    executor: () => Promise<T>,
    metadata: Record<string, any> = {}
  ): Promise<T> {
    if (!this.config.enableMiddleware) {
      return executor()
    }

    return this.interceptorManager.executeWithMiddleware(
      serviceName,
      operation,
      payload,
      executor,
      metadata
    )
  }

  // Status
  isReady(): boolean {
    return this.isInitialized
  }

  getStatus(): {
    initialized: boolean
    servicesRegistered: number
    healthChecksEnabled: boolean
    interceptorsEnabled: boolean
    middlewareEnabled: boolean
  } {
    return {
      initialized: this.isInitialized,
      servicesRegistered: Object.keys(this.serviceManager.getMetrics()).length,
      healthChecksEnabled: this.config.enableHealthChecks,
      interceptorsEnabled: this.config.enableInterceptors,
      middlewareEnabled: this.config.enableMiddleware
    }
  }

  // Private Methods
  private setupDefaultInterceptors(): void {
    if (!this.config.enableInterceptors) {
      return
    }

    // Add default global interceptors
    this.interceptorManager.addGlobalInterceptor(createLoggingInterceptor('info'))
    this.interceptorManager.addGlobalInterceptor(createPerformanceInterceptor(1000))
    this.interceptorManager.addGlobalInterceptor(createErrorHandlingInterceptor())

    // Add rate limiting middleware if enabled
    if (this.config.rateLimitConfig.enabled) {
      this.interceptorManager.addMiddleware(
        createRateLimitingMiddleware(
          this.config.rateLimitConfig.requestsPerSecond,
          this.config.rateLimitConfig.windowSize
        )
      )
    }

    console.log('🔍 Default interceptors and middleware configured')
  }

  private startHealthChecks(): void {
    setInterval(async () => {
      try {
        const healthReport = await this.getHealthReport()
        
        if (!healthReport.healthy) {
          console.warn('⚠️ Some services are unhealthy:', healthReport.services)
        }
      } catch (error) {
        console.error('❌ Health check failed:', error)
      }
    }, this.config.healthCheckInterval)

    console.log(`💓 Health checks started (interval: ${this.config.healthCheckInterval}ms)`)
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      try {
        const metrics = this.getMetrics()
        const interceptorStats = this.getInterceptorStats()
        
        // Could send to monitoring service here
        console.debug('📊 Service metrics collected:', { metrics, interceptorStats })
      } catch (error) {
        console.error('❌ Metrics collection failed:', error)
      }
    }, this.config.metricsInterval)

    console.log(`📊 Metrics collection started (interval: ${this.config.metricsInterval}ms)`)
  }
}

// Global service integration instance
let globalServiceIntegration: ServiceIntegration | null = null

export const getServiceIntegration = (config?: Partial<ServiceIntegrationConfig>): ServiceIntegration => {
  if (!globalServiceIntegration) {
    globalServiceIntegration = new ServiceIntegration(config)
  }
  return globalServiceIntegration
}

export const createServiceIntegration = (config?: Partial<ServiceIntegrationConfig>): ServiceIntegration => {
  return new ServiceIntegration(config)
}

// Convenience export
export { ServiceManager, DIContainer, InterceptorManager }
export * from './types'