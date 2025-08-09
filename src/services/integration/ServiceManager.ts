/**
 * 🎯 Service Manager
 *
 * Central service coordinator that manages all application services
 * Provides service registration, lifecycle management, and dependency resolution
 */

import type {
  ServiceManager as IServiceManager,
  ServiceDefinition,
  ServiceInstance,
  ServiceConfiguration,
  ServiceMetrics,
  HealthCheckFunction,
} from './types'
// 브라우저 호환 이벤트 emitter (Node 'events' 대체)
class SimpleEventEmitter {
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map()
  private maxListeners = 10

  on(event: string, listener: (...args: any[]) => void) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    this.listeners.get(event)!.add(listener)
    return this
  }

  off(event: string, listener: (...args: any[]) => void) {
    this.listeners.get(event)?.delete(listener)
    return this
  }

  once(event: string, listener: (...args: any[]) => void) {
    const wrapper = (...args: any[]) => {
      this.off(event, wrapper)
      listener(...args)
    }
    return this.on(event, wrapper)
  }

  emit(event: string, ...args: any[]) {
    const set = this.listeners.get(event)
    if (!set) return false
    for (const listener of Array.from(set)) {
      try {
        listener(...args)
      } catch (e) {
        // 오류는 상위에서 처리
        console.error(e)
      }
    }
    return set.size > 0
  }

  setMaxListeners(n: number) {
    this.maxListeners = n
    return this
  }
}

export class ServiceManager
  extends SimpleEventEmitter
  implements IServiceManager
{
  private services: Map<string, ServiceInstance> = new Map()
  private configurations: Map<string, ServiceConfiguration> = new Map()
  private dependencyGraph: Map<string, Set<string>> = new Map()
  private initializationOrder: string[] = []
  private healthChecks: Map<string, HealthCheckFunction<any>> = new Map()
  private metrics: Map<string, ServiceMetrics> = new Map()
  private isInitialized = false

  constructor() {
    super()
    this.setMaxListeners(50) // Allow many service listeners
  }

  // Service Registration
  register<T>(definition: ServiceDefinition<T>): void {
    if (this.services.has(definition.name)) {
      throw new Error(`Service ${definition.name} is already registered`)
    }

    // Store service configuration
    this.configurations.set(definition.name, {
      name: definition.name,
      factory: definition.factory,
      dependencies: definition.dependencies || [],
      singleton: definition.singleton ?? true,
      lazy: definition.lazy ?? false,
      healthCheck: definition.healthCheck,
      config: definition.config || {},
    })

    // Build dependency graph
    this.dependencyGraph.set(
      definition.name,
      new Set(definition.dependencies || [])
    )

    // Emit registration event
    this.emit('service:registered', definition.name)

    console.log(`📦 Service registered: ${definition.name}`)
  }

  // Service Resolution
  get<T>(name: string): T {
    const service = this.getService<T>(name)
    if (!service) {
      throw new Error(`Service ${name} not found or not initialized`)
    }
    return service
  }

  async getAsync<T>(name: string): Promise<T> {
    if (!this.services.has(name)) {
      await this.initializeService(name)
    }
    return this.get<T>(name)
  }

  has(name: string): boolean {
    return this.configurations.has(name)
  }

  isServiceReady(name: string): boolean {
    return (
      this.services.has(name) && this.services.get(name)?.status === 'running'
    )
  }

  // Service Lifecycle
  async initialize(serviceNames?: string[]): Promise<void> {
    if (this.isInitialized && !serviceNames) {
      return // Already initialized
    }

    const targetServices =
      serviceNames || Array.from(this.configurations.keys())

    try {
      // Calculate initialization order
      this.initializationOrder =
        this.calculateInitializationOrder(targetServices)

      // Initialize services in dependency order
      for (const serviceName of this.initializationOrder) {
        if (!this.isServiceReady(serviceName)) {
          await this.initializeService(serviceName)
        }
      }

      this.isInitialized = true
      this.emit('manager:initialized')

      console.log(
        `✅ Service Manager initialized with ${targetServices.length} services`
      )
    } catch (error) {
      this.emit('manager:initialization-failed', error)
      throw new Error(`Service Manager initialization failed: ${error}`)
    }
  }

  async shutdown(): Promise<void> {
    this.emit('manager:shutting-down')

    // Shutdown services in reverse order
    const shutdownOrder = [...this.initializationOrder].reverse()

    for (const serviceName of shutdownOrder) {
      await this.shutdownService(serviceName)
    }

    this.services.clear()
    this.metrics.clear()
    this.isInitialized = false

    this.emit('manager:shutdown')
    console.log('🔴 Service Manager shutdown complete')
  }

  async restart(serviceName?: string): Promise<void> {
    if (serviceName) {
      await this.restartService(serviceName)
    } else {
      await this.shutdown()
      await this.initialize()
    }
  }

  // Health Management
  async healthCheck(): Promise<{
    healthy: boolean
    services: Record<string, any>
  }> {
    const serviceHealth: Record<string, any> = {}
    let allHealthy = true

    for (const [serviceName, service] of this.services) {
      try {
        const config = this.configurations.get(serviceName)
        const healthCheck = config?.healthCheck

        if (healthCheck) {
          const result = await healthCheck(service.instance)
          serviceHealth[serviceName] = {
            status: result.healthy ? 'healthy' : 'unhealthy',
            message: result.message,
            lastCheck: Date.now(),
          }

          if (!result.healthy) {
            allHealthy = false
          }
        } else {
          serviceHealth[serviceName] = {
            status: service.status,
            message: 'No health check configured',
            lastCheck: Date.now(),
          }
        }
      } catch (error) {
        serviceHealth[serviceName] = {
          status: 'error',
          message: `Health check failed: ${error}`,
          lastCheck: Date.now(),
        }
        allHealthy = false
      }
    }

    return { healthy: allHealthy, services: serviceHealth }
  }

  // Metrics and Monitoring
  getMetrics(): Record<string, ServiceMetrics> {
    const allMetrics: Record<string, ServiceMetrics> = {}

    for (const [serviceName, metrics] of this.metrics) {
      allMetrics[serviceName] = { ...metrics }
    }

    return allMetrics
  }

  getServiceMetrics(serviceName: string): ServiceMetrics | null {
    return this.metrics.get(serviceName) || null
  }

  // Configuration Management
  updateConfiguration(serviceName: string, config: Record<string, any>): void {
    const existing = this.configurations.get(serviceName)
    if (!existing) {
      throw new Error(`Service ${serviceName} not found`)
    }

    existing.config = { ...existing.config, ...config }
    this.emit('service:config-updated', serviceName, config)
  }

  getConfiguration(serviceName: string): ServiceConfiguration | null {
    return this.configurations.get(serviceName) || null
  }

  // Private Methods
  private async initializeService(serviceName: string): Promise<void> {
    const config = this.configurations.get(serviceName)
    if (!config) {
      throw new Error(`Service ${serviceName} not registered`)
    }

    if (this.services.has(serviceName)) {
      return // Already initialized
    }

    try {
      this.emit('service:initializing', serviceName)

      // Initialize dependencies first
      for (const dependency of config.dependencies) {
        if (!this.isServiceReady(dependency)) {
          await this.initializeService(dependency)
        }
      }

      // Create service instance
      const startTime = Date.now()
      const dependencies = this.resolveDependencies(config.dependencies)
      const instance = await config.factory(dependencies, config.config)
      const initializationTime = Date.now() - startTime

      // Store service instance
      const serviceInstance: ServiceInstance = {
        name: serviceName,
        instance,
        status: 'running',
        createdAt: Date.now(),
        dependencies: config.dependencies,
      }

      this.services.set(serviceName, serviceInstance)

      // Initialize metrics
      this.metrics.set(serviceName, {
        initializationTime,
        lastAccessed: Date.now(),
        accessCount: 0,
        errorCount: 0,
        memoryUsage: this.estimateMemoryUsage(instance),
      })

      this.emit('service:initialized', serviceName)
      console.log(
        `✅ Service initialized: ${serviceName} (${initializationTime}ms)`
      )
    } catch (error) {
      this.emit('service:initialization-failed', serviceName, error)
      throw new Error(`Failed to initialize service ${serviceName}: ${error}`)
    }
  }

  private async shutdownService(serviceName: string): Promise<void> {
    const service = this.services.get(serviceName)
    if (!service) {
      return // Not initialized
    }

    try {
      this.emit('service:shutting-down', serviceName)

      // Call shutdown method if available
      if (service.instance && typeof service.instance.shutdown === 'function') {
        await service.instance.shutdown()
      }

      service.status = 'stopped'
      this.emit('service:shutdown', serviceName)

      console.log(`🔴 Service shutdown: ${serviceName}`)
    } catch (error) {
      this.emit('service:shutdown-failed', serviceName, error)
      console.error(`Failed to shutdown service ${serviceName}:`, error)
    }
  }

  private async restartService(serviceName: string): Promise<void> {
    await this.shutdownService(serviceName)
    this.services.delete(serviceName)
    await this.initializeService(serviceName)
  }

  private getService<T>(name: string): T | null {
    const service = this.services.get(name)
    if (!service) {
      return null
    }

    // Update access metrics
    const metrics = this.metrics.get(name)
    if (metrics) {
      metrics.lastAccessed = Date.now()
      metrics.accessCount++
    }

    return service.instance as T
  }

  private resolveDependencies(dependencies: string[]): Record<string, any> {
    const resolved: Record<string, any> = {}

    for (const dependency of dependencies) {
      const service = this.getService(dependency)
      if (!service) {
        throw new Error(`Dependency ${dependency} not available`)
      }
      resolved[dependency] = service
    }

    return resolved
  }

  private calculateInitializationOrder(serviceNames: string[]): string[] {
    const visited = new Set<string>()
    const visiting = new Set<string>()
    const order: string[] = []

    const visit = (serviceName: string) => {
      if (visiting.has(serviceName)) {
        throw new Error(
          `Circular dependency detected involving service: ${serviceName}`
        )
      }

      if (visited.has(serviceName)) {
        return
      }

      visiting.add(serviceName)

      const dependencies = this.dependencyGraph.get(serviceName) || new Set()
      for (const dependency of dependencies) {
        if (serviceNames.includes(dependency)) {
          visit(dependency)
        }
      }

      visiting.delete(serviceName)
      visited.add(serviceName)
      order.push(serviceName)
    }

    for (const serviceName of serviceNames) {
      if (!visited.has(serviceName)) {
        visit(serviceName)
      }
    }

    return order
  }

  private estimateMemoryUsage(instance: any): number {
    try {
      return JSON.stringify(instance).length * 2 // Rough estimation
    } catch {
      return 0 // Can't estimate for circular refs
    }
  }
}

// Global service manager instance
let globalServiceManager: ServiceManager | null = null

export const getServiceManager = (): ServiceManager => {
  if (!globalServiceManager) {
    globalServiceManager = new ServiceManager()
  }
  return globalServiceManager
}

export const createServiceManager = (): ServiceManager => {
  return new ServiceManager()
}
