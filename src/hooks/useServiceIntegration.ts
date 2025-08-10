/**
 * 🎯 Service Integration React Hook
 * 
 * React hook for accessing the service integration system
 * Provides type-safe service access and lifecycle management
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { 
  getService, 
  getServiceAsync, 
  hasService,
  getHealthReport,
  getServiceMetrics,
  isServiceIntegrationReady,
  useServices,
  SERVICE_NAMES
} from '@services/integration'
import type { ServiceHealthReport, ServiceMetrics } from '@services/integration/types'

// Generic service hook
export function useService<T>(serviceName: string, lazy: boolean = false) {
  const [service, setService] = useState<T | null>(null)
  const [loading, setLoading] = useState(!lazy)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (lazy || !isServiceIntegrationReady()) {
      return
    }

    const loadService = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const serviceInstance = await getServiceAsync<T>(serviceName)
        setService(serviceInstance)
      } catch (err) {
        setError(err as Error)
        console.error(`Failed to load service ${serviceName}:`, err)
      } finally {
        setLoading(false)
      }
    }

    loadService()
  }, [serviceName, lazy])

  const loadService = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const serviceInstance = await getServiceAsync<T>(serviceName)
      setService(serviceInstance)
      return serviceInstance
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [serviceName])

  return {
    service,
    loading,
    error,
    loadService,
    isAvailable: hasService(serviceName)
  }
}

// Specific service hooks
export const useAIService = () => useService(SERVICE_NAMES.AI)
export const useBattleService = () => useService(SERVICE_NAMES.BATTLE, true) // Lazy load
export const useCharacterService = () => useService(SERVICE_NAMES.CHARACTER)
export const useSecurityService = () => useService(SERVICE_NAMES.SECURITY)
export const useAPIService = () => useService(SERVICE_NAMES.API)
export const useGameStateService = () => useService(SERVICE_NAMES.GAME_STATE)
export const useConversationService = () => useService(SERVICE_NAMES.CONVERSATION)

// All services hook
export function useAllServices() {
  const [services, setServices] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!isServiceIntegrationReady()) {
      return
    }

    const loadServices = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const allServices = useServices()
        setServices(allServices)
      } catch (err) {
        setError(err as Error)
        console.error('Failed to load services:', err)
      } finally {
        setLoading(false)
      }
    }

    loadServices()
  }, [])

  return {
    services,
    loading,
    error,
    isReady: isServiceIntegrationReady()
  }
}

// Health monitoring hook
export function useServiceHealth(interval: number = 30000) {
  const [healthReport, setHealthReport] = useState<ServiceHealthReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const checkHealth = useCallback(async () => {
    try {
      setError(null)
      const report = await getHealthReport()
      setHealthReport(report)
      return report
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isServiceIntegrationReady()) {
      return
    }

    // Initial health check
    checkHealth()

    // Set up periodic health checks
    intervalRef.current = setInterval(checkHealth, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [checkHealth, interval])

  const refresh = useCallback(async () => {
    setLoading(true)
    return checkHealth()
  }, [checkHealth])

  return {
    healthReport,
    loading,
    error,
    refresh,
    isHealthy: healthReport?.healthy ?? false
  }
}

// Service metrics hook
export function useServiceMetrics(interval: number = 60000) {
  const [metrics, setMetrics] = useState<Record<string, ServiceMetrics>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const collectMetrics = useCallback(async () => {
    try {
      setError(null)
      const serviceMetrics = getServiceMetrics()
      setMetrics(serviceMetrics)
      return serviceMetrics
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isServiceIntegrationReady()) {
      return
    }

    // Initial metrics collection
    collectMetrics()

    // Set up periodic metrics collection
    intervalRef.current = setInterval(collectMetrics, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [collectMetrics, interval])

  const refresh = useCallback(async () => {
    setLoading(true)
    return collectMetrics()
  }, [collectMetrics])

  return {
    metrics,
    loading,
    error,
    refresh
  }
}

// Service operation hook
export function useServiceOperation<T, R>(
  serviceName: string,
  operationName: string
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [result, setResult] = useState<R | null>(null)

  const execute = useCallback(async (...args: T[]): Promise<R> => {
    try {
      setLoading(true)
      setError(null)
      
      const service = await getServiceAsync<any>(serviceName)
      const operation = service[operationName]
      
      if (typeof operation !== 'function') {
        throw new Error(`Operation ${operationName} not found on service ${serviceName}`)
      }
      
      const operationResult = await operation.apply(service, args)
      setResult(operationResult)
      return operationResult
      
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [serviceName, operationName])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    execute,
    loading,
    error,
    result,
    reset
  }
}

// Service integration status hook
export function useServiceIntegrationStatus() {
  const [isReady, setIsReady] = useState(isServiceIntegrationReady())
  const [status, setStatus] = useState<any>(null)

  useEffect(() => {
    // Check status periodically
    const checkStatus = () => {
      const ready = isServiceIntegrationReady()
      setIsReady(ready)
      
      if (ready) {
        try {
          import('../services/integration/index').then(module => {
            const currentStatus = module.getServiceIntegrationStatus()
            setStatus(currentStatus)
          }).catch(error => {
            console.error('Failed to get service integration status:', error)
          })
        } catch (error) {
          console.error('Failed to get service integration status:', error)
        }
      }
    }

    checkStatus()
    
    // Check every 5 seconds
    const interval = setInterval(checkStatus, 5000)
    
    return () => clearInterval(interval)
  }, [])

  return {
    isReady,
    status
  }
}