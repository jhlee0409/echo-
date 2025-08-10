/**
 * API Performance Monitor
 * Tracks performance metrics, errors, costs, and provides alerts
 */

interface PerformanceMetrics {
  responseTime: number
  tokensUsed: number
  cost: number
  success: boolean
  provider: string
  timestamp: number
  cacheHit: boolean
  errorType?: string
}

interface AlertConfig {
  maxResponseTime: number
  maxDailyCost: number
  maxErrorRate: number
  minCacheHitRate: number
}

interface PerformanceStats {
  avgResponseTime: number
  totalCost: number
  totalTokens: number
  successRate: number
  cacheHitRate: number
  requestsPerMinute: number
  errorBreakdown: Record<string, number>
  costByProvider: Record<string, number>
  performanceTrends: {
    responseTime: number[]
    errorRate: number[]
    cost: number[]
  }
}

/**
 * Comprehensive API Performance Monitoring System
 */
export class APIPerformanceMonitor {
  private static instance: APIPerformanceMonitor
  private metrics: PerformanceMetrics[] = []
  private readonly maxMetricsHistory = 10000
  private alertConfig: AlertConfig = {
    maxResponseTime: 5000, // 5 seconds
    maxDailyCost: 10.0, // $10 per day
    maxErrorRate: 0.1, // 10%
    minCacheHitRate: 0.3 // 30%
  }

  private alerts: Array<{
    type: string
    message: string
    timestamp: number
    severity: 'low' | 'medium' | 'high' | 'critical'
  }> = []

  static getInstance(): APIPerformanceMonitor {
    if (!APIPerformanceMonitor.instance) {
      APIPerformanceMonitor.instance = new APIPerformanceMonitor()
    }
    return APIPerformanceMonitor.instance
  }

  /**
   * Record API call performance
   */
  recordAPICall(
    provider: string,
    responseTime: number,
    tokensUsed: number,
    cost: number,
    success: boolean,
    cacheHit: boolean = false,
    errorType?: string
  ): void {
    const metric: PerformanceMetrics = {
      provider,
      responseTime,
      tokensUsed,
      cost,
      success,
      cacheHit,
      errorType,
      timestamp: Date.now()
    }

    this.metrics.push(metric)
    
    // Limit history size
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory)
    }

    // Check for alerts
    this.checkAlerts(metric)

    // Log performance
    const status = success ? '✅' : '❌'
    const cache = cacheHit ? '💾' : '🌐'
    console.log(
      `${status}${cache} ${provider}: ${responseTime}ms, ${tokensUsed} tokens, $${cost.toFixed(4)}`
    )
  }

  /**
   * Get comprehensive performance statistics
   */
  getPerformanceStats(timeWindowHours = 24): PerformanceStats {
    const cutoffTime = Date.now() - timeWindowHours * 60 * 60 * 1000
    const recentMetrics = this.metrics.filter(m => m.timestamp >= cutoffTime)

    if (recentMetrics.length === 0) {
      return this.getEmptyStats()
    }

    // Calculate basic stats
    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length
    const totalCost = recentMetrics.reduce((sum, m) => sum + m.cost, 0)
    const totalTokens = recentMetrics.reduce((sum, m) => sum + m.tokensUsed, 0)
    const successCount = recentMetrics.filter(m => m.success).length
    const cacheHitCount = recentMetrics.filter(m => m.cacheHit).length
    
    // Error breakdown
    const errorBreakdown: Record<string, number> = {}
    recentMetrics.forEach(m => {
      if (!m.success && m.errorType) {
        errorBreakdown[m.errorType] = (errorBreakdown[m.errorType] || 0) + 1
      }
    })

    // Cost by provider
    const costByProvider: Record<string, number> = {}
    recentMetrics.forEach(m => {
      costByProvider[m.provider] = (costByProvider[m.provider] || 0) + m.cost
    })

    // Performance trends (hourly buckets)
    const trends = this.calculateTrends(recentMetrics, timeWindowHours)

    // Requests per minute
    const timeSpanMinutes = Math.max(1, (Date.now() - recentMetrics[0].timestamp) / (60 * 1000))
    const requestsPerMinute = recentMetrics.length / timeSpanMinutes

    return {
      avgResponseTime: Math.round(avgResponseTime),
      totalCost: Math.round(totalCost * 10000) / 10000, // 4 decimal places
      totalTokens,
      successRate: Math.round((successCount / recentMetrics.length) * 1000) / 10, // 1 decimal
      cacheHitRate: Math.round((cacheHitCount / recentMetrics.length) * 1000) / 10,
      requestsPerMinute: Math.round(requestsPerMinute * 10) / 10,
      errorBreakdown,
      costByProvider,
      performanceTrends: trends
    }
  }

  /**
   * Get real-time dashboard data
   */
  getDashboardData(): {
    stats: PerformanceStats
    alerts: typeof this.alerts
    recentActivity: PerformanceMetrics[]
    healthScore: number
  } {
    const stats = this.getPerformanceStats(1) // Last hour
    const recentActivity = this.metrics.slice(-20) // Last 20 calls
    const healthScore = this.calculateHealthScore(stats)

    return {
      stats,
      alerts: this.alerts.slice(-10), // Last 10 alerts
      recentActivity,
      healthScore
    }
  }

  /**
   * Export performance data for analysis
   */
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = 'timestamp,provider,responseTime,tokensUsed,cost,success,cacheHit,errorType'
      const rows = this.metrics.map(m => 
        `${m.timestamp},${m.provider},${m.responseTime},${m.tokensUsed},${m.cost},${m.success},${m.cacheHit},${m.errorType || ''}`
      )
      return [headers, ...rows].join('\n')
    }

    return JSON.stringify(this.metrics, null, 2)
  }

  /**
   * Set custom alert thresholds
   */
  updateAlertConfig(config: Partial<AlertConfig>): void {
    this.alertConfig = { ...this.alertConfig, ...config }
    console.log('🔔 Alert configuration updated:', this.alertConfig)
  }

  /**
   * Get cost projections
   */
  getCostProjection(days = 30): {
    dailyAverage: number
    monthlyProjection: number
    costBreakdown: Record<string, number>
    savingsFromCache: number
  } {
    const recentMetrics = this.metrics.slice(-1000) // Last 1000 calls
    const timeSpanDays = Math.max(1, (Date.now() - recentMetrics[0]?.timestamp) / (24 * 60 * 60 * 1000))
    
    const totalCost = recentMetrics.reduce((sum, m) => sum + m.cost, 0)
    const dailyAverage = totalCost / timeSpanDays
    const monthlyProjection = dailyAverage * days

    // Cost breakdown by provider
    const costBreakdown: Record<string, number> = {}
    recentMetrics.forEach(m => {
      costBreakdown[m.provider] = (costBreakdown[m.provider] || 0) + m.cost
    })

    // Calculate savings from cache
    const cacheHits = recentMetrics.filter(m => m.cacheHit).length
    const avgCostPerCall = totalCost / recentMetrics.length
    const savingsFromCache = cacheHits * avgCostPerCall

    return {
      dailyAverage: Math.round(dailyAverage * 100) / 100,
      monthlyProjection: Math.round(monthlyProjection * 100) / 100,
      costBreakdown,
      savingsFromCache: Math.round(savingsFromCache * 100) / 100
    }
  }

  /**
   * Performance recommendations
   */
  getRecommendations(): Array<{
    type: 'performance' | 'cost' | 'reliability'
    message: string
    priority: 'low' | 'medium' | 'high'
    action?: string
  }> {
    const stats = this.getPerformanceStats(24)
    const recommendations: any[] = []

    // Response time recommendations
    if (stats.avgResponseTime > 3000) {
      recommendations.push({
        type: 'performance',
        message: `Average response time is ${stats.avgResponseTime}ms. Consider enabling caching or optimizing prompts.`,
        priority: 'high',
        action: 'enable_caching'
      })
    }

    // Cache hit rate recommendations
    if (stats.cacheHitRate < 20) {
      recommendations.push({
        type: 'cost',
        message: `Cache hit rate is only ${stats.cacheHitRate}%. Improving cache strategy could reduce costs.`,
        priority: 'medium',
        action: 'improve_caching'
      })
    }

    // Error rate recommendations
    if (stats.successRate < 95) {
      recommendations.push({
        type: 'reliability',
        message: `Success rate is ${stats.successRate}%. Check error patterns and implement better retry logic.`,
        priority: 'high',
        action: 'improve_error_handling'
      })
    }

    // Cost optimization recommendations
    const costProjection = this.getCostProjection(30)
    if (costProjection.monthlyProjection > 100) {
      recommendations.push({
        type: 'cost',
        message: `Monthly cost projection is $${costProjection.monthlyProjection}. Consider optimizing token usage.`,
        priority: 'medium',
        action: 'optimize_tokens'
      })
    }

    return recommendations
  }

  private checkAlerts(metric: PerformanceMetrics): void {
    const now = Date.now()

    // Response time alert
    if (metric.responseTime > this.alertConfig.maxResponseTime) {
      this.addAlert(
        'performance',
        `High response time: ${metric.responseTime}ms (threshold: ${this.alertConfig.maxResponseTime}ms)`,
        'medium'
      )
    }

    // Daily cost check
    const today = new Date().toDateString()
    const todaysMetrics = this.metrics.filter(m => 
      new Date(m.timestamp).toDateString() === today
    )
    const dailyCost = todaysMetrics.reduce((sum, m) => sum + m.cost, 0)
    
    if (dailyCost > this.alertConfig.maxDailyCost) {
      this.addAlert(
        'cost',
        `Daily cost limit exceeded: $${dailyCost.toFixed(2)} (limit: $${this.alertConfig.maxDailyCost})`,
        'critical'
      )
    }

    // Error rate check (last 100 calls)
    const recentCalls = this.metrics.slice(-100)
    if (recentCalls.length >= 10) {
      const errorRate = recentCalls.filter(m => !m.success).length / recentCalls.length
      if (errorRate > this.alertConfig.maxErrorRate) {
        this.addAlert(
          'reliability',
          `High error rate: ${(errorRate * 100).toFixed(1)}% (threshold: ${this.alertConfig.maxErrorRate * 100}%)`,
          'high'
        )
      }
    }
  }

  private addAlert(type: string, message: string, severity: 'low' | 'medium' | 'high' | 'critical'): void {
    this.alerts.push({
      type,
      message,
      timestamp: Date.now(),
      severity
    })

    // Limit alerts history
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100)
    }

    // Log severe alerts
    if (severity === 'high' || severity === 'critical') {
      console.warn(`🚨 ${severity.toUpperCase()} ALERT: ${message}`)
    }
  }

  private calculateTrends(metrics: PerformanceMetrics[], hours: number): {
    responseTime: number[]
    errorRate: number[]
    cost: number[]
  } {
    const buckets = Math.min(24, hours) // Max 24 buckets
    const bucketSize = (hours * 60 * 60 * 1000) / buckets
    const now = Date.now()

    const responseTime: number[] = []
    const errorRate: number[] = []
    const cost: number[] = []

    for (let i = 0; i < buckets; i++) {
      const bucketStart = now - (buckets - i) * bucketSize
      const bucketEnd = bucketStart + bucketSize
      
      const bucketMetrics = metrics.filter(m => 
        m.timestamp >= bucketStart && m.timestamp < bucketEnd
      )

      if (bucketMetrics.length > 0) {
        const avgRT = bucketMetrics.reduce((sum, m) => sum + m.responseTime, 0) / bucketMetrics.length
        const errors = bucketMetrics.filter(m => !m.success).length
        const errorRt = errors / bucketMetrics.length
        const totalCost = bucketMetrics.reduce((sum, m) => sum + m.cost, 0)

        responseTime.push(Math.round(avgRT))
        errorRate.push(Math.round(errorRt * 1000) / 10) // 1 decimal place
        cost.push(Math.round(totalCost * 10000) / 10000) // 4 decimal places
      } else {
        responseTime.push(0)
        errorRate.push(0)
        cost.push(0)
      }
    }

    return { responseTime, errorRate, cost }
  }

  private calculateHealthScore(stats: PerformanceStats): number {
    // Calculate health score out of 100
    let score = 100

    // Response time penalty
    if (stats.avgResponseTime > 2000) score -= 20
    else if (stats.avgResponseTime > 1000) score -= 10

    // Success rate penalty
    if (stats.successRate < 90) score -= 30
    else if (stats.successRate < 95) score -= 15

    // Cache hit rate bonus/penalty
    if (stats.cacheHitRate > 50) score += 5
    else if (stats.cacheHitRate < 20) score -= 10

    // Error frequency penalty
    const errorCount = Object.values(stats.errorBreakdown).reduce((sum, count) => sum + count, 0)
    if (errorCount > 10) score -= 15

    return Math.max(0, Math.min(100, score))
  }

  private getEmptyStats(): PerformanceStats {
    return {
      avgResponseTime: 0,
      totalCost: 0,
      totalTokens: 0,
      successRate: 100,
      cacheHitRate: 0,
      requestsPerMinute: 0,
      errorBreakdown: {},
      costByProvider: {},
      performanceTrends: {
        responseTime: [],
        errorRate: [],
        cost: []
      }
    }
  }

  /**
   * Clear all metrics and alerts (for testing)
   */
  clear(): void {
    this.metrics = []
    this.alerts = []
    console.log('🧹 Performance monitor data cleared')
  }
}

// Export singleton instance
export const apiMonitor = APIPerformanceMonitor.getInstance()

// Helper function to create monitoring wrapper
export function withPerformanceMonitoring<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  provider: string
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now()
    let tokensUsed = 0
    let cost = 0
    let success = true
    let errorType: string | undefined

    try {
      const result = await fn(...args)
      
      // Extract metrics from result if it's an AI response
      if (typeof result === 'object' && result !== null) {
        const aiResponse = result as any
        tokensUsed = aiResponse.tokensUsed || 0
        cost = aiResponse.metadata?.totalCost || 0
      }

      return result
    } catch (error: any) {
      success = false
      errorType = error.code || error.name || 'unknown'
      throw error
    } finally {
      const responseTime = Date.now() - startTime
      apiMonitor.recordAPICall(
        provider,
        responseTime,
        tokensUsed,
        cost,
        success,
        false, // Assume not cached for this wrapper
        errorType
      )
    }
  }
}