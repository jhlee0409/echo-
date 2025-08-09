/**
 * 🌐 API Client
 * 
 * Low-level HTTP client for external API communication
 * Handles authentication, retries, and error responses
 */

import axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosError 
} from 'axios'
import type { 
  APIResponse, 
  APIError, 
  APIErrorCode 
} from './types'
import { DEFAULT_API_CONFIG, type APIConfig } from './index'

export class APIClient {
  private client: AxiosInstance
  private config: Required<APIConfig>

  constructor(config: APIConfig = {}) {
    this.config = { ...DEFAULT_API_CONFIG, ...config }
    
    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })

    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    // Request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = this.getAuthToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        
        // Add request timestamp
        config.metadata = { startTime: Date.now() }
        
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        const startTime = response.config.metadata?.startTime || Date.now()
        const processingTime = Date.now() - startTime

        // Wrap response in standard format
        return {
          ...response,
          data: {
            success: true,
            data: response.data,
            metadata: {
              requestId: response.headers['x-request-id'] || 'unknown',
              processingTime,
              serverTime: Date.now()
            }
          }
        }
      },
      (error: AxiosError) => {
        const apiError = this.mapAxiosError(error)
        return Promise.reject(apiError)
      }
    )
  }

  private mapAxiosError(error: AxiosError): APIError {
    let code: APIErrorCode = 'UNKNOWN'
    let message = 'An unknown error occurred'
    let retryable = false

    if (error.code === 'ECONNABORTED') {
      code = 'TIMEOUT'
      message = 'Request timeout'
      retryable = true
    } else if (!error.response) {
      code = 'NETWORK_ERROR'
      message = 'Network connection failed'
      retryable = true
    } else {
      const status = error.response.status
      
      switch (true) {
        case status === 400:
          code = 'VALIDATION_ERROR'
          message = 'Invalid request data'
          break
        case status === 401:
          code = 'AUTHENTICATION'
          message = 'Authentication failed'
          break
        case status === 429:
          code = 'RATE_LIMIT'
          message = 'Rate limit exceeded'
          retryable = true
          break
        case status >= 500:
          code = 'SERVER_ERROR'
          message = 'Server error occurred'
          retryable = true
          break
      }
    }

    return {
      code,
      message,
      details: error.response?.data,
      retryable,
      timestamp: Date.now()
    }
  }

  private getAuthToken(): string | null {
    // Would integrate with auth system
    return localStorage.getItem('auth_token')
  }

  // Generic request method with retry logic
  async request<T>(
    config: AxiosRequestConfig,
    retryCount = 0
  ): Promise<APIResponse<T>> {
    try {
      const response = await this.client.request<APIResponse<T>>(config)
      return response.data
    } catch (error) {
      const apiError = error as APIError
      
      // Retry logic
      if (
        apiError.retryable && 
        retryCount < this.config.retries
      ) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000)
        await new Promise(resolve => setTimeout(resolve, delay))
        
        return this.request<T>(config, retryCount + 1)
      }
      
      // Return error response
      return {
        success: false,
        error: apiError
      }
    }
  }

  // Convenience methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<APIResponse<T>> {
    return this.request<T>({ method: 'GET', url, ...config })
  }

  async post<T>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<APIResponse<T>> {
    return this.request<T>({ method: 'POST', url, data, ...config })
  }

  async put<T>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<APIResponse<T>> {
    return this.request<T>({ method: 'PUT', url, data, ...config })
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<APIResponse<T>> {
    return this.request<T>({ method: 'DELETE', url, ...config })
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get<{ status: string }>('/health')
      return response.success && response.data?.status === 'ok'
    } catch {
      return false
    }
  }

  // Set auth token
  setAuthToken(token: string): void {
    localStorage.setItem('auth_token', token)
  }

  // Clear auth token
  clearAuthToken(): void {
    localStorage.removeItem('auth_token')
  }
}

// Singleton instance
let apiClient: APIClient | null = null

export const getAPIClient = (config?: APIConfig): APIClient => {
  if (!apiClient) {
    apiClient = new APIClient(config)
  }
  return apiClient
}