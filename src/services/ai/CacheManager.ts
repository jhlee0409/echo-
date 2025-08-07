import { CacheEntry, CacheKey, AIResponse } from './types'

/**
 * Cache Manager for AI responses
 * Implements intelligent caching to reduce API costs and improve response times
 */
export class CacheManager {
  private cache = new Map<string, CacheEntry>()
  private readonly maxCacheSize = 1000
  private readonly defaultTTL = 60 * 60 * 1000 // 1 hour in milliseconds
  private readonly cleanupInterval = 10 * 60 * 1000 // 10 minutes

  constructor() {
    this.startCleanupTimer()
  }

  /**
   * Get cached response if available and not expired
   */
  async get(key: CacheKey): Promise<AIResponse | null> {
    const keyString = this.serializeKey(key)
    const entry = this.cache.get(keyString)

    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(keyString)
      return null
    }

    // Update access statistics
    entry.hitCount++
    entry.lastAccessed = Date.now()
    
    console.log(`💾 Cache hit for key: ${keyString.slice(0, 16)}...`)
    return { ...entry.response }
  }

  /**
   * Store response in cache
   */
  async set(key: CacheKey, response: AIResponse, ttl?: number): Promise<void> {
    // Don't cache low-confidence responses
    if (response.confidence < 0.5) {
      return
    }

    // Don't cache error responses
    if (response.metadata?.finishReason === 'error') {
      return
    }

    const keyString = this.serializeKey(key)
    const expiresAt = Date.now() + (ttl || this.defaultTTL)

    // Check cache size and evict if necessary
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLeastUsed()
    }

    const entry: CacheEntry = {
      key,
      response: { ...response },
      createdAt: Date.now(),
      expiresAt,
      hitCount: 0,
      lastAccessed: Date.now()
    }

    this.cache.set(keyString, entry)
    console.log(`💾 Cached response for key: ${keyString.slice(0, 16)}...`)
  }

  /**
   * Remove expired entries and least used entries if cache is full
   */
  cleanup(): void {
    const now = Date.now()
    let removedCount = 0

    // Remove expired entries
    for (const [keyString, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(keyString)
        removedCount++
      }
    }

    if (removedCount > 0) {
      console.log(`🧹 Cleaned up ${removedCount} expired cache entries`)
    }

    // If still over limit, remove least used
    if (this.cache.size > this.maxCacheSize * 0.8) {
      this.evictLeastUsed(Math.floor(this.maxCacheSize * 0.2))
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    hitRate: number
    totalCost: number
    oldestEntry: number
  } {
    let totalHits = 0
    let totalRequests = 0
    let totalCost = 0
    let oldestTime = Date.now()

    for (const entry of this.cache.values()) {
      totalHits += entry.hitCount
      totalRequests += entry.hitCount + 1 // +1 for initial store
      totalCost += entry.response.metadata?.totalCost || 0
      oldestTime = Math.min(oldestTime, entry.createdAt)
    }

    return {
      size: this.cache.size,
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      totalCost,
      oldestEntry: Date.now() - oldestTime
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
    console.log('🧹 Cache cleared')
  }

  /**
   * Serialize cache key to string
   */
  private serializeKey(key: CacheKey): string {
    return `${key.messages}-${key.context}-${key.options}`
  }

  /**
   * Evict least recently used entries
   */
  private evictLeastUsed(count: number = 1): void {
    // Sort by access time and hit count
    const entries = Array.from(this.cache.entries())
      .map(([keyString, entry]) => ({
        keyString,
        entry,
        score: entry.hitCount * 1000 + entry.lastAccessed
      }))
      .sort((a, b) => a.score - b.score)

    // Remove least used entries
    const toRemove = entries.slice(0, count)
    for (const { keyString } of toRemove) {
      this.cache.delete(keyString)
    }

    if (toRemove.length > 0) {
      console.log(`🧹 Evicted ${toRemove.length} least used cache entries`)
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanup()
    }, this.cleanupInterval)
  }
}