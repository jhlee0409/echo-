/**
 * 🎯 Service Integration System
 * 
 * Main entry point for the service integration system
 * Provides unified access to all application services
 */

export * from './ServiceManager'
export * from './DIContainer'
export * from './InterceptorManager'
export * from './ServiceIntegration'
export * from './serviceDefinitions'
export * from './types'

import { getServiceIntegration } from './ServiceIntegration'
import { allServiceDefinitions, SERVICE_NAMES } from './serviceDefinitions'
import type { ServiceIntegrationConfig } from './types'

// Main integration instance
let isBootstrapped = false

/**
 * Bootstrap the service integration system
 * Should be called during application initialization
 */
export async function bootstrapServiceIntegration(
  config: Partial<ServiceIntegrationConfig> = {}
): Promise<void> {
  if (isBootstrapped) {
    console.log('Service integration already bootstrapped')
    return
  }

  try {
    console.log('🚀 Bootstrapping Service Integration System...')
    
    const integration = getServiceIntegration(config)
    
    // Initialize with all service definitions
    await integration.initialize(allServiceDefinitions)
    
    isBootstrapped = true
    
    console.log('✅ Service Integration System bootstrapped successfully')
    
    // Log system status
    const status = integration.getStatus()
    console.log('📊 Integration Status:', status)
    
  } catch (error) {
    console.error('❌ Failed to bootstrap Service Integration System:', error)
    throw error
  }
}

/**
 * Get a service instance from the integration system
 */
export function getService<T>(serviceName: string): T {
  const integration = getServiceIntegration()
  return integration.getService<T>(serviceName)
}

/**
 * Get a service instance asynchronously
 */
export async function getServiceAsync<T>(serviceName: string): Promise<T> {
  const integration = getServiceIntegration()
  return integration.getServiceAsync<T>(serviceName)
}

/**
 * Check if a service is available
 */
export function hasService(serviceName: string): boolean {
  const integration = getServiceIntegration()
  return integration.hasService(serviceName)
}

/**
 * Get system health report
 */
export async function getHealthReport() {
  const integration = getServiceIntegration()
  return integration.getHealthReport()
}

/**
 * Get service metrics
 */
export function getServiceMetrics() {
  const integration = getServiceIntegration()
  return integration.getMetrics()
}

/**
 * Shutdown the service integration system
 * Should be called during application cleanup
 */
export async function shutdownServiceIntegration(): Promise<void> {
  if (!isBootstrapped) {
    return
  }

  try {
    console.log('🛑 Shutting down Service Integration System...')
    
    const integration = getServiceIntegration()
    await integration.shutdown()
    
    isBootstrapped = false
    
    console.log('✅ Service Integration System shutdown complete')
    
  } catch (error) {
    console.error('❌ Error during Service Integration shutdown:', error)
    throw error
  }
}

// Convenience service accessors
export const useAIService = () => getService(SERVICE_NAMES.AI)
export const useBattleService = () => getService(SERVICE_NAMES.BATTLE)
export const useCharacterService = () => getService(SERVICE_NAMES.CHARACTER)
export const useSecurityService = () => getService(SERVICE_NAMES.SECURITY)
export const useAPIService = () => getService(SERVICE_NAMES.API)
export const useGameStateService = () => getService(SERVICE_NAMES.GAME_STATE)
export const useConversationService = () => getService(SERVICE_NAMES.CONVERSATION)

// Type-safe service accessor hooks
export const useServices = () => ({
  ai: useAIService(),
  battle: useBattleService(),
  character: useCharacterService(),
  security: useSecurityService(),
  api: useAPIService(),
  gameState: useGameStateService(),
  conversation: useConversationService()
})

// System utilities
export const isServiceIntegrationReady = () => isBootstrapped

export const getServiceIntegrationStatus = () => {
  if (!isBootstrapped) {
    return { ready: false, message: 'Not bootstrapped' }
  }
  
  const integration = getServiceIntegration()
  return { ready: true, status: integration.getStatus() }
}