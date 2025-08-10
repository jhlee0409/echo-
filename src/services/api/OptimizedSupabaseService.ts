/**
 * Optimized Supabase Service Layer
 * Implements connection pooling, batch operations, caching, and retry logic
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { ENV } from '@/config/env'
import type { Database } from '@/lib/supabase'

interface QueryCache {
  data: any
  timestamp: number
  ttl: number
}

interface BatchOperation {
  table: string
  operation: 'insert' | 'update' | 'delete'
  data: any
  filters?: any
}

/**
 * Connection Pool for Supabase
 * Manages multiple client instances for better performance
 */
class SupabasePool {
  private clients: SupabaseClient<Database>[] = []
  private currentIndex = 0
  private readonly poolSize = 3

  constructor() {
    // Create pool of clients
    for (let i = 0; i < this.poolSize; i++) {
      this.clients.push(
        createClient<Database>(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false // Disable for better performance
          },
          db: {
            schema: 'public'
          },
          global: {
            headers: {
              'x-application-name': 'soulmate-ai-companion',
              'x-pool-instance': `${i}` // Track which instance
            }
          },
          // Performance optimizations
          realtime: {
            params: {
              eventsPerSecond: 10 // Rate limiting
            }
          }
        })
      )
    }
  }

  /**
   * Get next available client (round-robin)
   */
  getClient(): SupabaseClient<Database> {
    const client = this.clients[this.currentIndex]
    this.currentIndex = (this.currentIndex + 1) % this.poolSize
    return client
  }

  /**
   * Get specific client for long operations
   */
  getDedicatedClient(): SupabaseClient<Database> {
    // Always return the last client for dedicated operations
    return this.clients[this.poolSize - 1]
  }
}

/**
 * Optimized Supabase Service
 */
export class OptimizedSupabaseService {
  private static instance: OptimizedSupabaseService
  private pool: SupabasePool
  private cache = new Map<string, QueryCache>()
  private batchQueue = new Map<string, BatchOperation[]>()
  private batchTimer: NodeJS.Timeout | null = null
  private readonly maxBatchSize = 100
  private readonly batchDelay = 50 // ms
  private readonly defaultCacheTTL = 5 * 60 * 1000 // 5 minutes

  private constructor() {
    this.pool = new SupabasePool()
    this.startCacheCleanup()
  }

  static getInstance(): OptimizedSupabaseService {
    if (!OptimizedSupabaseService.instance) {
      OptimizedSupabaseService.instance = new OptimizedSupabaseService()
    }
    return OptimizedSupabaseService.instance
  }

  /**
   * Execute query with automatic retry and exponential backoff
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    let lastError: any

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error: any) {
        lastError = error
        
        // Don't retry on non-recoverable errors
        if (error.code === 'PGRST204' || error.code === '23505') {
          throw error
        }

        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
          console.log(`⚠️ Retry attempt ${attempt + 1} after ${Math.round(delay)}ms`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError
  }

  /**
   * Cached query execution
   */
  async cachedQuery<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl = this.defaultCacheTTL
  ): Promise<T> {
    // Check cache
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log(`💾 Cache hit: ${key}`)
      return cached.data as T
    }

    // Execute query
    const result = await queryFn()
    
    // Store in cache
    this.cache.set(key, {
      data: result,
      timestamp: Date.now(),
      ttl
    })

    return result
  }

  /**
   * Batch insert operations
   */
  async batchInsert<T extends Record<string, any>>(
    table: string,
    records: T[],
    chunkSize = 500
  ): Promise<{ success: boolean; inserted: number; errors: any[] }> {
    const errors: any[] = []
    let inserted = 0
    const client = this.pool.getDedicatedClient()

    // Process in chunks
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize)
      
      try {
        const { data, error } = await this.executeWithRetry(
          () => client.from(table).insert(chunk).select('id')
        )

        if (error) {
          errors.push({ chunk: i / chunkSize, error })
        } else {
          inserted += data?.length || 0
        }
      } catch (error) {
        errors.push({ chunk: i / chunkSize, error })
      }
    }

    return {
      success: errors.length === 0,
      inserted,
      errors
    }
  }

  /**
   * Optimized pagination with cursor
   */
  async *paginateWithCursor<T>(
    table: string,
    {
      pageSize = 100,
      orderBy = 'created_at',
      filters = {},
      select = '*'
    }: {
      pageSize?: number
      orderBy?: string
      filters?: Record<string, any>
      select?: string
    }
  ): AsyncGenerator<T[], void, unknown> {
    let lastValue: any = null
    const client = this.pool.getClient()

    while (true) {
      let query = client.from(table).select(select)

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })

      // Apply cursor pagination
      if (lastValue !== null) {
        query = query.gt(orderBy, lastValue)
      }

      query = query.order(orderBy).limit(pageSize)

      const { data, error } = await query

      if (error) throw error
      if (!data || data.length === 0) break

      yield data as T[]

      // Update cursor
      lastValue = data[data.length - 1][orderBy]

      if (data.length < pageSize) break
    }
  }

  /**
   * Parallel query execution
   */
  async parallelQueries<T extends Record<string, () => Promise<any>>>(
    queries: T
  ): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> {
    const entries = Object.entries(queries)
    const results = await Promise.all(
      entries.map(([key, queryFn]) => 
        queryFn()
          .then(result => ({ key, result, error: null }))
          .catch(error => ({ key, result: null, error }))
      )
    )

    const output: any = {}
    for (const { key, result, error } of results) {
      if (error) {
        console.error(`❌ Parallel query failed for ${key}:`, error)
        output[key] = { data: null, error }
      } else {
        output[key] = result
      }
    }

    return output
  }

  /**
   * Real-time subscription with automatic reconnection
   */
  subscribeWithReconnect(
    table: string,
    filters: Record<string, any>,
    callback: (payload: any) => void,
    onError?: (error: any) => void
  ) {
    const client = this.pool.getDedicatedClient()
    let subscription: any
    let reconnectAttempts = 0
    const maxReconnectAttempts = 5

    const connect = () => {
      let query = client.from(table).on('*', callback)
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })

      subscription = query.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Subscribed to ${table}`)
          reconnectAttempts = 0
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.warn(`⚠️ Subscription to ${table} closed, attempting reconnect...`)
          
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++
            setTimeout(connect, 1000 * Math.pow(2, reconnectAttempts))
          } else {
            onError?.(new Error('Max reconnection attempts reached'))
          }
        }
      })
    }

    connect()

    // Return unsubscribe function
    return () => {
      if (subscription) {
        client.removeSubscription(subscription)
      }
    }
  }

  /**
   * Transaction-like operation using RLS
   */
  async transaction<T>(
    operations: Array<{
      table: string
      operation: 'insert' | 'update' | 'delete'
      data?: any
      filters?: Record<string, any>
    }>
  ): Promise<{ success: boolean; results: any[]; errors: any[] }> {
    const client = this.pool.getDedicatedClient()
    const results: any[] = []
    const errors: any[] = []

    // Execute operations sequentially
    for (const op of operations) {
      try {
        let query = client.from(op.table)

        switch (op.operation) {
          case 'insert':
            query = query.insert(op.data)
            break
          case 'update':
            query = query.update(op.data)
            break
          case 'delete':
            query = query.delete()
            break
        }

        // Apply filters for update/delete
        if (op.filters && op.operation !== 'insert') {
          Object.entries(op.filters).forEach(([key, value]) => {
            query = query.eq(key, value)
          })
        }

        const { data, error } = await query.select()

        if (error) {
          errors.push({ operation: op, error })
          // Stop on first error
          break
        } else {
          results.push(data)
        }
      } catch (error) {
        errors.push({ operation: op, error })
        break
      }
    }

    return {
      success: errors.length === 0,
      results,
      errors
    }
  }

  /**
   * Optimized count query
   */
  async getCount(
    table: string,
    filters: Record<string, any> = {}
  ): Promise<number> {
    const cacheKey = `count:${table}:${JSON.stringify(filters)}`
    
    return this.cachedQuery(cacheKey, async () => {
      const client = this.pool.getClient()
      let query = client.from(table).select('*', { count: 'exact', head: true })

      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })

      const { count, error } = await query

      if (error) throw error
      return count || 0
    }, 60000) // Cache for 1 minute
  }

  /**
   * Smart prefetching for related data
   */
  async prefetchRelated<T>(
    primaryTable: string,
    primaryId: string,
    relations: Array<{
      table: string
      foreignKey: string
      select?: string
    }>
  ): Promise<Record<string, any>> {
    const queries: Record<string, () => Promise<any>> = {
      [primaryTable]: () => 
        this.pool.getClient()
          .from(primaryTable)
          .select('*')
          .eq('id', primaryId)
          .single()
    }

    // Add relation queries
    relations.forEach(({ table, foreignKey, select = '*' }) => {
      queries[table] = () =>
        this.pool.getClient()
          .from(table)
          .select(select)
          .eq(foreignKey, primaryId)
    })

    return this.parallelQueries(queries)
  }

  /**
   * Cleanup old cache entries
   */
  private startCacheCleanup() {
    setInterval(() => {
      const now = Date.now()
      const keysToDelete: string[] = []

      this.cache.forEach((value, key) => {
        if (now - value.timestamp > value.ttl) {
          keysToDelete.push(key)
        }
      })

      keysToDelete.forEach(key => this.cache.delete(key))

      if (keysToDelete.length > 0) {
        console.log(`🧹 Cleaned ${keysToDelete.length} expired cache entries`)
      }
    }, 60000) // Every minute
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      batchQueueSize: this.batchQueue.size,
      poolSize: this.pool['poolSize']
    }
  }
}

// Export singleton instance
export const optimizedSupabase = OptimizedSupabaseService.getInstance()