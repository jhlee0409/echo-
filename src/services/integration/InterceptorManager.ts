/**
 * 🔍 Interceptor Manager
 * 
 * Manages service method interceptors for cross-cutting concerns
 * Provides logging, monitoring, error handling, and security enforcement
 */

import type {
  Interceptor,
  InterceptorContext,
  Middleware,
  MiddlewareContext,
  MiddlewareFunction
} from './types'
// Simple ID generator
const generateRequestId = () => `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

export class InterceptorManager {
  private interceptors: Map<string, Interceptor[]> = new Map()
  private globalInterceptors: Interceptor[] = []
  private middleware: Middleware[] = []
  private isEnabled = true

  // Interceptor Registration
  addInterceptor(serviceName: string, interceptor: Interceptor): void {
    if (!this.interceptors.has(serviceName)) {
      this.interceptors.set(serviceName, [])
    }
    
    const interceptors = this.interceptors.get(serviceName)!
    interceptors.push(interceptor)
    
    // Sort by priority (higher priority first)
    interceptors.sort((a, b) => b.priority - a.priority)
    
    console.log(`🔍 Interceptor registered for ${serviceName}: ${interceptor.name}`)
  }

  addGlobalInterceptor(interceptor: Interceptor): void {
    this.globalInterceptors.push(interceptor)
    this.globalInterceptors.sort((a, b) => b.priority - a.priority)
    
    console.log(`🔍 Global interceptor registered: ${interceptor.name}`)
  }

  removeInterceptor(serviceName: string, interceptorName: string): void {
    const interceptors = this.interceptors.get(serviceName)
    if (interceptors) {
      const index = interceptors.findIndex(i => i.name === interceptorName)
      if (index >= 0) {
        interceptors.splice(index, 1)
        console.log(`🔍 Interceptor removed from ${serviceName}: ${interceptorName}`)
      }
    }
  }

  removeGlobalInterceptor(interceptorName: string): void {
    const index = this.globalInterceptors.findIndex(i => i.name === interceptorName)
    if (index >= 0) {
      this.globalInterceptors.splice(index, 1)
      console.log(`🔍 Global interceptor removed: ${interceptorName}`)
    }
  }

  // Middleware Registration
  addMiddleware(middleware: Middleware): void {
    this.middleware.push(middleware)
    console.log(`🔧 Middleware registered: ${middleware.name}`)
  }

  removeMiddleware(middlewareName: string): void {
    const index = this.middleware.findIndex(m => m.name === middlewareName)
    if (index >= 0) {
      this.middleware.splice(index, 1)
      console.log(`🔧 Middleware removed: ${middlewareName}`)
    }
  }

  // Service Proxy Creation
  createProxy<T extends object>(serviceName: string, service: T): T {
    if (!this.isEnabled) {
      return service
    }

    return new Proxy(service, {
      get: (target, prop, receiver) => {
        const originalValue = Reflect.get(target, prop, receiver)
        
        if (typeof originalValue === 'function') {
          return async (...args: any[]) => {
            const context: InterceptorContext = {
              serviceName,
              methodName: String(prop),
              args,
              metadata: {},
              timestamp: Date.now(),
              requestId: generateRequestId()
            }

            return this.executeWithInterceptors(context, () => {
              return originalValue.apply(target, args)
            })
          }
        }
        
        return originalValue
      }
    })
  }

  // Middleware Execution
  async executeWithMiddleware<T>(
    serviceName: string,
    operation: string,
    payload: any,
    executor: () => Promise<T>,
    metadata: Record<string, any> = {}
  ): Promise<T> {
    if (!this.isEnabled || this.middleware.length === 0) {
      return executor()
    }

    const context: MiddlewareContext = {
      serviceName,
      operation,
      payload,
      metadata
    }

    let index = 0
    
    const next = async (): Promise<T> => {
      if (index >= this.middleware.length) {
        return executor()
      }
      
      const middleware = this.middleware[index++]
      return middleware.execute(context, next)
    }

    return next()
  }

  // Control Methods
  enable(): void {
    this.isEnabled = true
    console.log('🔍 Interceptor system enabled')
  }

  disable(): void {
    this.isEnabled = false
    console.log('🔍 Interceptor system disabled')
  }

  isInterceptionEnabled(): boolean {
    return this.isEnabled
  }

  // Statistics
  getInterceptorStats(): Record<string, any> {
    const serviceStats: Record<string, number> = {}
    
    for (const [serviceName, interceptors] of this.interceptors) {
      serviceStats[serviceName] = interceptors.length
    }

    return {
      globalInterceptors: this.globalInterceptors.length,
      serviceInterceptors: serviceStats,
      middleware: this.middleware.length,
      enabled: this.isEnabled
    }
  }

  // Private Methods
  private async executeWithInterceptors<T>(
    context: InterceptorContext,
    executor: () => Promise<T> | T
  ): Promise<T> {
    const serviceInterceptors = this.interceptors.get(context.serviceName) || []
    const allInterceptors = [...this.globalInterceptors, ...serviceInterceptors]

    try {
      // Execute beforeCall interceptors
      for (const interceptor of allInterceptors) {
        if (interceptor.beforeCall) {
          await interceptor.beforeCall(context)
        }
      }

      // Execute the original method
      let result = await executor()

      // Execute afterCall interceptors (in reverse order)
      for (const interceptor of allInterceptors.reverse()) {
        if (interceptor.afterCall) {
          result = await interceptor.afterCall(context, result)
        }
      }

      return result

    } catch (error) {
      // Execute error interceptors
      for (const interceptor of allInterceptors) {
        if (interceptor.onError) {
          await interceptor.onError(context, error as Error)
        }
      }
      
      throw error
    }
  }
}

// Built-in Interceptors
export const createLoggingInterceptor = (logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info'): Interceptor => ({
  name: 'logging-interceptor',
  priority: 100,
  beforeCall: (context) => {
    if (logLevel === 'debug') {
      console.log(`🔍 [${context.serviceName}.${context.methodName}] Called with args:`, context.args)
    }
  },
  afterCall: (context, result) => {
    const duration = Date.now() - context.timestamp
    console.log(`✅ [${context.serviceName}.${context.methodName}] Completed in ${duration}ms`)
    return result
  },
  onError: (context, error) => {
    const duration = Date.now() - context.timestamp
    console.error(`❌ [${context.serviceName}.${context.methodName}] Failed in ${duration}ms:`, error.message)
  }
})

export const createPerformanceInterceptor = (thresholdMs: number = 1000): Interceptor => ({
  name: 'performance-interceptor',
  priority: 90,
  beforeCall: (context) => {
    context.metadata.startTime = Date.now()
  },
  afterCall: (context, result) => {
    const duration = Date.now() - context.metadata.startTime
    if (duration > thresholdMs) {
      console.warn(`⚠️ [${context.serviceName}.${context.methodName}] Slow operation: ${duration}ms`)
    }
    context.metadata.duration = duration
    return result
  }
})

export const createErrorHandlingInterceptor = (): Interceptor => ({
  name: 'error-handling-interceptor',
  priority: 80,
  onError: (context, error) => {
    // Log error with context
    console.error(`💥 Service Error [${context.serviceName}.${context.methodName}]:`, {
      error: error.message,
      stack: error.stack,
      args: context.args,
      requestId: context.requestId,
      timestamp: new Date(context.timestamp).toISOString()
    })

    // Could send to error tracking service here
  }
})

export const createSecurityInterceptor = (
  checkPermissions: (serviceName: string, methodName: string) => Promise<boolean>
): Interceptor => ({
  name: 'security-interceptor',
  priority: 95,
  beforeCall: async (context) => {
    const hasPermission = await checkPermissions(context.serviceName, context.methodName)
    if (!hasPermission) {
      throw new Error(`Access denied to ${context.serviceName}.${context.methodName}`)
    }
  }
})

// Built-in Middleware
export const createRateLimitingMiddleware = (
  requestsPerSecond: number = 10,
  windowMs: number = 1000
): Middleware => {
  const requests: Map<string, number[]> = new Map()

  return {
    name: 'rate-limiting-middleware',
    execute: async (context, next) => {
      const key = `${context.serviceName}:${context.operation}`
      const now = Date.now()
      
      if (!requests.has(key)) {
        requests.set(key, [])
      }
      
      const timestamps = requests.get(key)!
      
      // Remove old timestamps
      const cutoff = now - windowMs
      const validTimestamps = timestamps.filter(t => t > cutoff)
      
      if (validTimestamps.length >= requestsPerSecond) {
        throw new Error(`Rate limit exceeded for ${key}`)
      }
      
      validTimestamps.push(now)
      requests.set(key, validTimestamps)
      
      return next()
    }
  }
}

export const createAuthenticationMiddleware = (
  getUser: (context: MiddlewareContext) => Promise<any>
): Middleware => ({
  name: 'authentication-middleware',
  execute: async (context, next) => {
    try {
      const user = await getUser(context)
      context.user = user
      return next()
    } catch (error) {
      throw new Error(`Authentication failed: ${error}`)
    }
  }
})

// Global interceptor manager instance
let globalInterceptorManager: InterceptorManager | null = null

export const getInterceptorManager = (): InterceptorManager => {
  if (!globalInterceptorManager) {
    globalInterceptorManager = new InterceptorManager()
  }
  return globalInterceptorManager
}

export const createInterceptorManager = (): InterceptorManager => {
  return new InterceptorManager()
}