/**
 * 💉 Dependency Injection Container
 * 
 * Type-safe dependency injection container with lifecycle management
 * Supports singleton/transient scopes, conditional bindings, and async resolution
 */

import type {
  DIContainer as IDIContainer,
  BindingBuilder,
  BindingConfiguration,
  ResolutionContext,
  DISnapshot,
  FactoryFunction,
  AsyncFactoryFunction
} from './types'

class BindingBuilderImpl<T> implements BindingBuilder<T> {
  private binding: Partial<BindingConfiguration> = {}

  constructor(private container: DIContainerImpl, private token: string) {
    this.binding.token = token
    this.binding.scope = 'singleton' // Default scope
  }

  to(implementation: new (...args: any[]) => T): BindingBuilder<T> {
    this.binding.type = 'class'
    this.binding.implementation = implementation
    this.container.setBinding(this.token, this.binding as BindingConfiguration)
    return this
  }

  toValue(value: T): BindingBuilder<T> {
    this.binding.type = 'value'
    this.binding.implementation = value
    this.binding.scope = 'singleton' // Values are always singleton
    this.container.setBinding(this.token, this.binding as BindingConfiguration)
    return this
  }

  toFactory(factory: FactoryFunction<T>): BindingBuilder<T> {
    this.binding.type = 'factory'
    this.binding.implementation = factory
    this.container.setBinding(this.token, this.binding as BindingConfiguration)
    return this
  }

  toAsync(factory: AsyncFactoryFunction<T>): BindingBuilder<T> {
    this.binding.type = 'async'
    this.binding.implementation = factory
    this.container.setBinding(this.token, this.binding as BindingConfiguration)
    return this
  }

  inSingletonScope(): BindingBuilder<T> {
    this.binding.scope = 'singleton'
    this.container.setBinding(this.token, this.binding as BindingConfiguration)
    return this
  }

  inTransientScope(): BindingBuilder<T> {
    this.binding.scope = 'transient'
    this.container.setBinding(this.token, this.binding as BindingConfiguration)
    return this
  }

  when(condition: (context: ResolutionContext) => boolean): BindingBuilder<T> {
    this.binding.condition = condition
    this.container.setBinding(this.token, this.binding as BindingConfiguration)
    return this
  }
}

class DIContainerImpl implements IDIContainer {
  private bindings: Map<string, BindingConfiguration> = new Map()
  private instances: Map<string, any> = new Map()
  private resolutionStack: Set<string> = new Set()

  bind<T>(token: string): BindingBuilder<T> {
    return new BindingBuilderImpl<T>(this, token)
  }

  get<T>(token: string): T {
    return this.resolve<T>(token, { token, metadata: {} })
  }

  async getAsync<T>(token: string): Promise<T> {
    return this.resolveAsync<T>(token, { token, metadata: {} })
  }

  has(token: string): boolean {
    return this.bindings.has(token)
  }

  unbind(token: string): void {
    this.bindings.delete(token)
    this.instances.delete(token)
  }

  snapshot(): DISnapshot {
    const bindings: Record<string, BindingConfiguration> = {}
    for (const [token, binding] of this.bindings) {
      bindings[token] = { ...binding }
    }
    
    return {
      bindings,
      timestamp: Date.now()
    }
  }

  restore(snapshot: DISnapshot): void {
    this.bindings.clear()
    this.instances.clear()
    
    for (const [token, binding] of Object.entries(snapshot.bindings)) {
      this.bindings.set(token, binding)
    }
  }

  setBinding(token: string, binding: BindingConfiguration): void {
    this.bindings.set(token, binding)
  }

  private resolve<T>(token: string, context: ResolutionContext): T {
    // Check for circular dependencies
    if (this.resolutionStack.has(token)) {
      throw new Error(`Circular dependency detected: ${Array.from(this.resolutionStack).join(' -> ')} -> ${token}`)
    }

    const binding = this.bindings.get(token)
    if (!binding) {
      throw new Error(`No binding found for token: ${token}`)
    }

    // Check conditional binding
    if (binding.condition && !binding.condition(context)) {
      throw new Error(`Conditional binding not satisfied for token: ${token}`)
    }

    // Return existing singleton instance
    if (binding.scope === 'singleton' && this.instances.has(token)) {
      return this.instances.get(token) as T
    }

    this.resolutionStack.add(token)
    
    try {
      const instance = this.createInstance<T>(binding, context)
      
      // Store singleton instance
      if (binding.scope === 'singleton') {
        this.instances.set(token, instance)
      }
      
      return instance
    } finally {
      this.resolutionStack.delete(token)
    }
  }

  private async resolveAsync<T>(token: string, context: ResolutionContext): Promise<T> {
    // Check for circular dependencies
    if (this.resolutionStack.has(token)) {
      throw new Error(`Circular dependency detected: ${Array.from(this.resolutionStack).join(' -> ')} -> ${token}`)
    }

    const binding = this.bindings.get(token)
    if (!binding) {
      throw new Error(`No binding found for token: ${token}`)
    }

    // Check conditional binding
    if (binding.condition && !binding.condition(context)) {
      throw new Error(`Conditional binding not satisfied for token: ${token}`)
    }

    // Return existing singleton instance
    if (binding.scope === 'singleton' && this.instances.has(token)) {
      return this.instances.get(token) as T
    }

    this.resolutionStack.add(token)
    
    try {
      const instance = await this.createInstanceAsync<T>(binding, context)
      
      // Store singleton instance
      if (binding.scope === 'singleton') {
        this.instances.set(token, instance)
      }
      
      return instance
    } finally {
      this.resolutionStack.delete(token)
    }
  }

  private createInstance<T>(binding: BindingConfiguration, context: ResolutionContext): T {
    switch (binding.type) {
      case 'value':
        return binding.implementation as T

      case 'factory':
        return (binding.implementation as FactoryFunction<T>)(this)

      case 'class':
        // Auto-inject dependencies based on constructor parameters
        const Constructor = binding.implementation as new (...args: any[]) => T
        const dependencies = this.resolveDependencies(Constructor, context)
        return new Constructor(...dependencies)

      case 'async':
        throw new Error(`Async binding ${binding.token} cannot be resolved synchronously. Use getAsync() instead.`)

      default:
        throw new Error(`Unknown binding type: ${binding.type}`)
    }
  }

  private async createInstanceAsync<T>(binding: BindingConfiguration, context: ResolutionContext): Promise<T> {
    switch (binding.type) {
      case 'value':
        return binding.implementation as T

      case 'factory':
        const result = (binding.implementation as FactoryFunction<T>)(this)
        return Promise.resolve(result)

      case 'async':
        return (binding.implementation as AsyncFactoryFunction<T>)(this)

      case 'class':
        // Auto-inject dependencies based on constructor parameters
        const Constructor = binding.implementation as new (...args: any[]) => T
        const dependencies = await this.resolveDependenciesAsync(Constructor, context)
        return new Constructor(...dependencies)

      default:
        throw new Error(`Unknown binding type: ${binding.type}`)
    }
  }

  private resolveDependencies(Constructor: any, context: ResolutionContext): any[] {
    // Get dependency tokens from metadata (if available) or return empty array
    const tokens = Reflect.getMetadata?.('design:paramtypes', Constructor) || []
    const dependencies: any[] = []

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]
      if (token && this.has(token.name || token.toString())) {
        const childContext: ResolutionContext = {
          token: token.name || token.toString(),
          parent: context,
          metadata: {}
        }
        dependencies.push(this.resolve(token.name || token.toString(), childContext))
      } else {
        dependencies.push(undefined)
      }
    }

    return dependencies
  }

  private async resolveDependenciesAsync(Constructor: any, context: ResolutionContext): Promise<any[]> {
    // Get dependency tokens from metadata (if available) or return empty array
    const tokens = Reflect.getMetadata?.('design:paramtypes', Constructor) || []
    const dependencies: any[] = []

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]
      if (token && this.has(token.name || token.toString())) {
        const childContext: ResolutionContext = {
          token: token.name || token.toString(),
          parent: context,
          metadata: {}
        }
        dependencies.push(await this.resolveAsync(token.name || token.toString(), childContext))
      } else {
        dependencies.push(undefined)
      }
    }

    return dependencies
  }
}

// Global DI container instance
let globalContainer: DIContainer | null = null

export const getDIContainer = (): IDIContainer => {
  if (!globalContainer) {
    globalContainer = new DIContainerImpl()
  }
  return globalContainer
}

export const createDIContainer = (): IDIContainer => {
  return new DIContainerImpl()
}

export { DIContainerImpl as DIContainer }