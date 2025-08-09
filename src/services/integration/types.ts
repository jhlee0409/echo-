/**
 * 🔧 Service Integration Types
 * 
 * Type definitions for the service integration system
 */

// Core Service Types
export interface ServiceManager {
  register<T>(definition: ServiceDefinition<T>): void
  get<T>(name: string): T
  getAsync<T>(name: string): Promise<T>
  has(name: string): boolean
  isServiceReady(name: string): boolean
  
  initialize(serviceNames?: string[]): Promise<void>
  shutdown(): Promise<void>
  restart(serviceName?: string): Promise<void>
  
  healthCheck(): Promise<ServiceHealthReport>
  getMetrics(): Record<string, ServiceMetrics>
  getServiceMetrics(serviceName: string): ServiceMetrics | null
  
  updateConfiguration(serviceName: string, config: Record<string, any>): void
  getConfiguration(serviceName: string): ServiceConfiguration | null
}

export interface ServiceDefinition<T> {
  name: string
  factory: ServiceFactory<T>
  dependencies?: string[]
  singleton?: boolean
  lazy?: boolean
  healthCheck?: HealthCheckFunction<T>
  config?: Record<string, any>
}

export interface ServiceConfiguration {
  name: string
  factory: ServiceFactory<any>
  dependencies: string[]
  singleton: boolean
  lazy: boolean
  healthCheck?: HealthCheckFunction<any>
  config: Record<string, any>
}

export interface ServiceInstance {
  name: string
  instance: any
  status: 'initializing' | 'running' | 'stopped' | 'error'
  createdAt: number
  dependencies: string[]
}

export type ServiceFactory<T> = (
  dependencies: Record<string, any>,
  config: Record<string, any>
) => Promise<T> | T

export type HealthCheckFunction<T> = (
  instance: T
) => Promise<HealthCheckResult> | HealthCheckResult

export interface HealthCheckResult {
  healthy: boolean
  message?: string
  details?: Record<string, any>
}

export interface ServiceHealthReport {
  healthy: boolean
  services: Record<string, {
    status: string
    message: string
    lastCheck: number
    details?: Record<string, any>
  }>
}

export interface ServiceMetrics {
  initializationTime: number
  lastAccessed: number
  accessCount: number
  errorCount: number
  memoryUsage: number
}

// Dependency Injection Types
export interface DIContainer {
  bind<T>(token: string): BindingBuilder<T>
  get<T>(token: string): T
  getAsync<T>(token: string): Promise<T>
  has(token: string): boolean
  unbind(token: string): void
  snapshot(): DISnapshot
  restore(snapshot: DISnapshot): void
}

export interface BindingBuilder<T> {
  to(implementation: new (...args: any[]) => T): BindingBuilder<T>
  toValue(value: T): BindingBuilder<T>
  toFactory(factory: FactoryFunction<T>): BindingBuilder<T>
  toAsync(factory: AsyncFactoryFunction<T>): BindingBuilder<T>
  inSingletonScope(): BindingBuilder<T>
  inTransientScope(): BindingBuilder<T>
  when(condition: (context: ResolutionContext) => boolean): BindingBuilder<T>
}

export type FactoryFunction<T> = (container: DIContainer) => T
export type AsyncFactoryFunction<T> = (container: DIContainer) => Promise<T>

export interface ResolutionContext {
  token: string
  parent?: ResolutionContext
  metadata: Record<string, any>
}

export interface DISnapshot {
  bindings: Record<string, BindingConfiguration>
  timestamp: number
}

export interface BindingConfiguration {
  token: string
  type: 'class' | 'value' | 'factory' | 'async'
  implementation: any
  scope: 'singleton' | 'transient'
  condition?: (context: ResolutionContext) => boolean
}

// Interceptor and Middleware Types
export interface Interceptor {
  name: string
  priority: number
  beforeCall?: (context: InterceptorContext) => Promise<void> | void
  afterCall?: (context: InterceptorContext, result: any) => Promise<any> | any
  onError?: (context: InterceptorContext, error: Error) => Promise<void> | void
}

export interface InterceptorContext {
  serviceName: string
  methodName: string
  args: any[]
  metadata: Record<string, any>
  timestamp: number
  requestId: string
}

export interface Middleware {
  name: string
  execute: MiddlewareFunction
}

export type MiddlewareFunction = (
  context: MiddlewareContext,
  next: () => Promise<any>
) => Promise<any>

export interface MiddlewareContext {
  serviceName: string
  operation: string
  payload: any
  metadata: Record<string, any>
  user?: {
    id: string
    role: string
    permissions: string[]
  }
}

// Service Registry Types
export interface ServiceRegistry {
  register(metadata: ServiceMetadata): void
  unregister(name: string): void
  discover(criteria?: ServiceDiscoveryCriteria): ServiceMetadata[]
  get(name: string): ServiceMetadata | null
  all(): ServiceMetadata[]
}

export interface ServiceMetadata {
  name: string
  version: string
  type: 'core' | 'feature' | 'integration' | 'external'
  capabilities: string[]
  endpoints?: ServiceEndpoint[]
  healthCheckUrl?: string
  dependencies: ServiceDependency[]
  configuration: Record<string, ConfigurationSchema>
}

export interface ServiceEndpoint {
  name: string
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  description: string
  parameters?: ParameterSchema[]
  response?: ResponseSchema
}

export interface ServiceDependency {
  name: string
  version: string
  optional: boolean
  description: string
}

export interface ServiceDiscoveryCriteria {
  type?: string
  capabilities?: string[]
  version?: string
}

export interface ConfigurationSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  required: boolean
  default?: any
  description: string
  validation?: ValidationRule[]
}

export interface ParameterSchema {
  name: string
  type: string
  required: boolean
  description: string
}

export interface ResponseSchema {
  type: string
  properties: Record<string, any>
}

export interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'enum' | 'custom'
  value: any
  message: string
}

// Event Types
export type ServiceEvent = 
  | 'service:registered'
  | 'service:unregistered'
  | 'service:initializing'
  | 'service:initialized'
  | 'service:initialization-failed'
  | 'service:shutting-down'
  | 'service:shutdown'
  | 'service:shutdown-failed'
  | 'service:config-updated'
  | 'service:health-check'
  | 'service:error'
  | 'manager:initialized'
  | 'manager:initialization-failed'
  | 'manager:shutting-down'
  | 'manager:shutdown'

// Integration Configuration
export interface ServiceIntegrationConfig {
  enableHealthChecks: boolean
  healthCheckInterval: number
  enableMetrics: boolean
  metricsInterval: number
  enableInterceptors: boolean
  enableMiddleware: boolean
  shutdownTimeout: number
  circuitBreakerConfig: CircuitBreakerConfig
  rateLimitConfig: RateLimitConfig
}

export interface CircuitBreakerConfig {
  enabled: boolean
  failureThreshold: number
  resetTimeout: number
  monitoringWindow: number
}

export interface RateLimitConfig {
  enabled: boolean
  requestsPerSecond: number
  burstSize: number
  windowSize: number
}

// Application Service Interfaces
export interface CoreServiceInterface {
  initialize(): Promise<void>
  shutdown(): Promise<void>
  healthCheck(): Promise<HealthCheckResult>
}

export interface AIServiceInterface extends CoreServiceInterface {
  processMessage(content: string, context?: any): Promise<any>
  generateResponse(prompt: string, options?: any): Promise<string>
  analyzeEmotion(content: string): Promise<any>
}

export interface BattleServiceInterface extends CoreServiceInterface {
  startBattle(config: any): Promise<any>
  executeTurn(action: any): Promise<any>
  endBattle(): Promise<any>
  getResults(): any
}

export interface CharacterServiceInterface extends CoreServiceInterface {
  getCharacter(id?: string): any
  updateCharacter(updates: any): Promise<void>
  updateEmotion(emotion: string, intensity: number): Promise<void>
  addMemory(memory: any): Promise<void>
}

export interface SecurityServiceInterface extends CoreServiceInterface {
  validateRequest(request: any): Promise<boolean>
  sanitizeInput(input: any): any
  checkPermissions(user: any, resource: string, action: string): Promise<boolean>
  auditLog(event: any): Promise<void>
}

export interface APIServiceInterface extends CoreServiceInterface {
  sendMessage(content: string, options?: any): Promise<any>
  saveGameState(): Promise<any>
  loadGameState(saveId: string): Promise<any>
  getContentRecommendations(): Promise<any>
}