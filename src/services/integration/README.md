# 🎯 Service Integration System

The Service Integration System is a comprehensive framework for managing all application services with unified lifecycle management, dependency injection, and cross-cutting concerns handling.

## Overview

The service integration system provides:
- **Service Manager**: Global service lifecycle and registry management
- **Dependency Injection**: Type-safe DI container with circular dependency detection
- **Interceptors & Middleware**: Cross-cutting concerns like logging, monitoring, security
- **Health Monitoring**: Continuous health checks and metrics collection
- **Unified API**: Single interface for all service interactions

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Service Integration                       │
├─────────────────────────────────────────────────────────────┤
│ ServiceManager │ DIContainer │ InterceptorManager           │
├────────────────┼─────────────┼──────────────────────────────┤
│ • Lifecycle    │ • Type-safe │ • Logging & Monitoring       │
│ • Registry     │ • DI        │ • Error Handling             │
│ • Dependencies │ • Scoping   │ • Security Enforcement       │
│ • Health       │ • Binding   │ • Performance Tracking       │
├────────────────┴─────────────┴──────────────────────────────┤
│                    Service Layer                            │
├─────────────────────────────────────────────────────────────┤
│ AIService │ BattleService │ CharacterService │ APIService    │
└─────────────────────────────────────────────────────────────┘
```

## Features

### 🏗️ Service Management
- **Automatic Lifecycle**: Initialize, start, stop, and cleanup services
- **Dependency Resolution**: Automatic dependency injection with circular detection
- **Health Monitoring**: Continuous health checks and alerting
- **Metrics Collection**: Performance and usage metrics
- **Configuration Management**: Runtime configuration updates

### 💉 Dependency Injection
- **Type Safety**: Full TypeScript support with compile-time checking
- **Multiple Scopes**: Singleton, transient, and conditional bindings
- **Async Resolution**: Support for async service factories
- **Conditional Binding**: Context-based service resolution
- **Circular Detection**: Automatic detection and prevention of circular dependencies

### 🔍 Interceptors & Middleware
- **Method Interception**: Intercept service method calls for cross-cutting concerns
- **Built-in Interceptors**: Logging, performance monitoring, error handling, security
- **Custom Middleware**: Rate limiting, authentication, validation
- **Pipeline Execution**: Configurable middleware execution chains
- **Error Recovery**: Graceful error handling and recovery strategies

## Quick Start

### 1. Bootstrap the System

```typescript
import { bootstrapServiceIntegration } from '@services/integration'

// Initialize the service integration system
await bootstrapServiceIntegration({
  enableHealthChecks: true,
  enableInterceptors: true,
  enableMiddleware: true,
  healthCheckInterval: 30000
})
```

### 2. Use Services in Components

```typescript
import { useAIService, useCharacterService } from '@services/integration'

function ChatComponent() {
  const aiService = useAIService()
  const characterService = useCharacterService()
  
  const handleMessage = async (message: string) => {
    const response = await aiService.processMessage(message)
    await characterService.updateEmotion(response.emotion, 0.8)
  }
  
  return (
    <div>
      {/* Chat UI */}
    </div>
  )
}
```

### 3. Access Services Programmatically

```typescript
import { getService, getServiceAsync } from '@services/integration'

// Synchronous access
const aiService = getService<AIService>('AIService')

// Asynchronous access
const battleService = await getServiceAsync<BattleService>('BattleService')

// Health monitoring
const healthReport = await getHealthReport()
console.log('System health:', healthReport.healthy)
```

## Available Services

### Core Services

| Service | Description | Dependencies |
|---------|-------------|--------------|
| **AIService** | AI processing and conversation | SecurityService |
| **CharacterService** | Character state and evolution | None |
| **SecurityService** | Security validation and audit | None |
| **APIService** | External API communication | SecurityService |
| **GameStateService** | Game progress and persistence | APIService |
| **ConversationService** | Chat history and analysis | APIService, AIService |
| **BattleService** | Battle integration (lazy-loaded) | CharacterService |

### Service Capabilities

```typescript
// AI Service
interface AIServiceInterface {
  processMessage(content: string, context?: any): Promise<any>
  generateResponse(prompt: string, options?: any): Promise<string>
  analyzeEmotion(content: string): Promise<any>
}

// Character Service
interface CharacterServiceInterface {
  getCharacter(id?: string): any
  updateCharacter(updates: any): Promise<void>
  updateEmotion(emotion: string, intensity: number): Promise<void>
  addMemory(memory: any): Promise<void>
}

// Security Service
interface SecurityServiceInterface {
  validateRequest(request: any): Promise<boolean>
  sanitizeInput(input: any): any
  checkPermissions(user: any, resource: string, action: string): Promise<boolean>
  auditLog(event: any): Promise<void>
}
```

## Configuration

### Service Integration Config

```typescript
interface ServiceIntegrationConfig {
  enableHealthChecks: boolean      // Enable health monitoring
  healthCheckInterval: number      // Health check frequency (ms)
  enableMetrics: boolean          // Enable metrics collection
  metricsInterval: number         // Metrics collection frequency (ms)
  enableInterceptors: boolean     // Enable method interception
  enableMiddleware: boolean       // Enable middleware pipeline
  shutdownTimeout: number         // Shutdown timeout (ms)
  circuitBreakerConfig: {
    enabled: boolean
    failureThreshold: number
    resetTimeout: number
    monitoringWindow: number
  }
  rateLimitConfig: {
    enabled: boolean
    requestsPerSecond: number
    burstSize: number
    windowSize: number
  }
}
```

### Default Configuration

```typescript
const defaultConfig = {
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
  }
}
```

## React Integration

### Service Hooks

```typescript
import {
  useAIService,
  useCharacterService,
  useServiceHealth,
  useServiceMetrics,
  useServiceOperation
} from '@hooks/useServiceIntegration'

function ServiceMonitoringComponent() {
  const { healthReport, isHealthy, refresh } = useServiceHealth()
  const { metrics, loading } = useServiceMetrics()
  const aiService = useAIService()
  
  const {
    execute: processMessage,
    loading: processing,
    result,
    error
  } = useServiceOperation<[string], any>('AIService', 'processMessage')
  
  return (
    <div>
      <div>System Health: {isHealthy ? '✅' : '❌'}</div>
      <button onClick={() => processMessage('Hello!')}>
        Send Message
      </button>
      {processing && <div>Processing...</div>}
      {result && <div>Response: {result.content}</div>}
    </div>
  )
}
```

### Service Status Hook

```typescript
function ServiceStatusComponent() {
  const { isReady, status } = useServiceIntegrationStatus()
  
  if (!isReady) {
    return <div>Services initializing...</div>
  }
  
  return (
    <div>
      <h3>Service Status</h3>
      <ul>
        <li>Initialized: {status.status?.initialized ? '✅' : '❌'}</li>
        <li>Services: {status.status?.servicesRegistered || 0}</li>
        <li>Health Checks: {status.status?.healthChecksEnabled ? '✅' : '❌'}</li>
        <li>Interceptors: {status.status?.interceptorsEnabled ? '✅' : '❌'}</li>
      </ul>
    </div>
  )
}
```

## Advanced Usage

### Custom Service Registration

```typescript
import { getServiceIntegration } from '@services/integration'

const integration = getServiceIntegration()

// Register a custom service
integration.registerService({
  name: 'CustomService',
  factory: async (dependencies, config) => {
    const { logger } = dependencies
    return {
      customMethod: () => logger.info('Custom service called'),
      healthCheck: () => ({ healthy: true })
    }
  },
  dependencies: ['LoggerService'],
  singleton: true,
  healthCheck: (service) => service.healthCheck()
})
```

### Custom Interceptors

```typescript
import { getInterceptorManager } from '@services/integration'

const interceptorManager = getInterceptorManager()

// Add custom interceptor
interceptorManager.addGlobalInterceptor({
  name: 'custom-audit',
  priority: 50,
  beforeCall: (context) => {
    console.log(`Audit: ${context.serviceName}.${context.methodName}`)
  },
  afterCall: (context, result) => {
    console.log(`Audit: Operation completed in ${Date.now() - context.timestamp}ms`)
    return result
  }
})
```

### Custom Middleware

```typescript
const customMiddleware: Middleware = {
  name: 'custom-validation',
  execute: async (context, next) => {
    // Pre-processing
    if (!context.payload || !context.payload.valid) {
      throw new Error('Invalid payload')
    }
    
    // Execute next middleware/operation
    const result = await next()
    
    // Post-processing
    return {
      ...result,
      validated: true,
      timestamp: Date.now()
    }
  }
}

interceptorManager.addMiddleware(customMiddleware)
```

## Monitoring & Debugging

### Health Monitoring

```typescript
import { getHealthReport, getServiceMetrics } from '@services/integration'

// Get system health
const healthReport = await getHealthReport()
console.log('System Health:', {
  overall: healthReport.healthy,
  services: Object.entries(healthReport.services).map(([name, health]) => ({
    name,
    status: health.status,
    message: health.message
  }))
})

// Get performance metrics
const metrics = getServiceMetrics()
Object.entries(metrics).forEach(([serviceName, serviceMetrics]) => {
  console.log(`${serviceName} Metrics:`, {
    initTime: serviceMetrics.initializationTime,
    accessCount: serviceMetrics.accessCount,
    errorCount: serviceMetrics.errorCount,
    memoryUsage: serviceMetrics.memoryUsage
  })
})
```

### Debug Mode

```typescript
// Enable debug logging
const integration = getServiceIntegration({
  enableInterceptors: true
})

// Add debug interceptor
integration.interceptorManager.addGlobalInterceptor({
  name: 'debug-logger',
  priority: 100,
  beforeCall: (context) => {
    console.debug(`🔍 [${context.serviceName}.${context.methodName}]`, {
      args: context.args,
      requestId: context.requestId
    })
  },
  afterCall: (context, result) => {
    console.debug(`✅ [${context.serviceName}.${context.methodName}]`, {
      duration: Date.now() - context.timestamp,
      result: typeof result
    })
    return result
  },
  onError: (context, error) => {
    console.error(`❌ [${context.serviceName}.${context.methodName}]`, {
      error: error.message,
      duration: Date.now() - context.timestamp
    })
  }
})
```

## Best Practices

### 1. Service Design
- Keep services focused on single responsibilities
- Use dependency injection for service dependencies
- Implement proper health checks
- Handle errors gracefully
- Provide meaningful logging

### 2. Performance
- Use lazy loading for heavy services
- Implement proper caching strategies
- Monitor service metrics
- Optimize hot paths
- Use appropriate scoping (singleton vs transient)

### 3. Testing
- Mock services for unit tests
- Use dependency injection for testability
- Test service integration scenarios
- Verify health check implementations
- Test error handling paths

### 4. Production
- Enable health monitoring
- Set up alerting for unhealthy services
- Monitor performance metrics
- Configure appropriate timeouts
- Implement graceful shutdown

## Troubleshooting

### Common Issues

#### Service Not Found
```typescript
// Error: Service not found: MyService
// Solution: Ensure service is registered before use
const integration = getServiceIntegration()
integration.registerService(myServiceDefinition)
```

#### Circular Dependencies
```typescript
// Error: Circular dependency detected
// Solution: Restructure dependencies or use lazy loading
const serviceDefinition = {
  name: 'MyService',
  factory: async (deps) => {
    // Use lazy dependency resolution
    const otherService = await getServiceAsync('OtherService')
    return new MyService(otherService)
  },
  dependencies: [], // Remove circular dependency
  lazy: true
}
```

#### Health Check Failures
```typescript
// Check service health
const health = await getHealthReport()
const unhealthyServices = Object.entries(health.services)
  .filter(([_, health]) => health.status !== 'healthy')
  .map(([name, health]) => ({ name, message: health.message }))

console.log('Unhealthy services:', unhealthyServices)
```

### Debug Commands

```typescript
// Get service integration status
const status = getServiceIntegrationStatus()
console.log('Integration Status:', status)

// Get interceptor statistics
const stats = integration.getInterceptorStats()
console.log('Interceptor Stats:', stats)

// Force service health check
const health = await integration.getHealthReport()
console.log('Health Report:', health)
```

## Migration Guide

### From Direct Service Usage

**Before:**
```typescript
import { getAIManager } from '@services/ai'
import { getCharacterAdapter } from '@store/adapters'

const aiManager = getAIManager()
const characterAdapter = getCharacterAdapter()
```

**After:**
```typescript
import { useAIService, useCharacterService } from '@services/integration'

const aiService = useAIService()
const characterService = useCharacterService()
```

### Benefits of Migration
1. **Unified Interface**: Single way to access all services
2. **Health Monitoring**: Automatic health checks and metrics
3. **Error Handling**: Consistent error handling across services
4. **Performance**: Built-in caching and optimization
5. **Testing**: Better testability with dependency injection
6. **Monitoring**: Built-in logging and monitoring

## API Reference

See the full API documentation in:
- [ServiceManager API](./ServiceManager.ts)
- [DIContainer API](./DIContainer.ts)
- [InterceptorManager API](./InterceptorManager.ts)
- [Type Definitions](./types.ts)
- [Service Definitions](./serviceDefinitions.ts)

## Testing

The service integration system includes comprehensive tests covering:
- Service registration and resolution
- Dependency injection scenarios
- Health monitoring
- Interceptor functionality
- Error handling
- Integration scenarios

Run tests with:
```bash
npm test src/services/integration/
```

All 23 tests pass, ensuring reliable service integration functionality.