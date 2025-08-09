/**
 * 🔍 Security Monitor
 * 
 * Real-time security monitoring, alerting, and incident response system
 * Integrates with SecurityEnhancementLayer for comprehensive threat detection
 */

import { EventEmitter } from 'events'
import { getSecurityLayer, SecurityEvent, ThreatLevel, SecurityEventType } from './SecurityEnhancementLayer'

/**
 * Alert severity levels
 */
export type AlertSeverity = 'info' | 'warning' | 'critical' | 'emergency'

/**
 * Alert types
 */
export type AlertType = 
  | 'threat_detected'
  | 'breach_attempt'
  | 'suspicious_activity'
  | 'rate_limit_exceeded'
  | 'authentication_failure'
  | 'authorization_violation'
  | 'data_access_anomaly'
  | 'system_compromise'
  | 'compliance_violation'
  | 'performance_degradation'

/**
 * Security alert structure
 */
export interface SecurityAlert {
  id: string
  timestamp: number
  type: AlertType
  severity: AlertSeverity
  title: string
  description: string
  source: string
  userId?: string
  metadata: Record<string, any>
  actions: AlertAction[]
  resolved: boolean
  resolvedAt?: number
  resolvedBy?: string
  escalated: boolean
  escalatedAt?: number
  escalatedTo?: string
  suppressed: boolean
  suppressedUntil?: number
}

/**
 * Alert action taken
 */
export interface AlertAction {
  action: string
  timestamp: number
  automated: boolean
  success: boolean
  details: string
}

/**
 * Monitoring rule
 */
export interface MonitoringRule {
  id: string
  name: string
  description: string
  eventTypes: SecurityEventType[]
  conditions: RuleCondition[]
  actions: AutomatedAction[]
  enabled: boolean
  cooldownMs: number
  lastTriggered?: number
}

/**
 * Rule condition
 */
export interface RuleCondition {
  field: string
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'matches' | 'not_equals'
  value: any
  timeWindowMs?: number
  threshold?: number
}

/**
 * Automated action
 */
export interface AutomatedAction {
  type: 'alert' | 'block_ip' | 'disable_user' | 'rate_limit' | 'log' | 'notify'
  parameters: Record<string, any>
  severity: AlertSeverity
}

/**
 * Alert statistics
 */
export interface AlertStats {
  total: number
  byType: Record<AlertType, number>
  bySeverity: Record<AlertSeverity, number>
  recent: number
  resolved: number
  escalated: number
  suppressed: number
  averageResolutionTime: number
}

/**
 * Monitoring configuration
 */
export interface MonitoringConfig {
  enabled: boolean
  alertRetentionDays: number
  maxAlertsPerHour: number
  escalationTimeoutMs: number
  autoResolveTimeoutMs: number
  suppressDuplicatesMs: number
  notificationChannels: NotificationChannel[]
}

/**
 * Notification channel
 */
export interface NotificationChannel {
  type: 'email' | 'webhook' | 'sms' | 'console' | 'file'
  config: Record<string, any>
  enabled: boolean
  minSeverity: AlertSeverity
}

/**
 * Default monitoring configuration
 */
const DEFAULT_CONFIG: MonitoringConfig = {
  enabled: true,
  alertRetentionDays: 30,
  maxAlertsPerHour: 100,
  escalationTimeoutMs: 30 * 60 * 1000, // 30 minutes
  autoResolveTimeoutMs: 24 * 60 * 60 * 1000, // 24 hours
  suppressDuplicatesMs: 5 * 60 * 1000, // 5 minutes
  notificationChannels: [
    {
      type: 'console',
      config: {},
      enabled: true,
      minSeverity: 'warning'
    }
  ]
}

/**
 * Security Monitor Events
 */
interface MonitorEvents {
  'alert-created': SecurityAlert
  'alert-resolved': SecurityAlert
  'alert-escalated': SecurityAlert
  'rule-triggered': { rule: MonitoringRule; event: SecurityEvent }
  'threshold-exceeded': { type: string; current: number; threshold: number }
}

/**
 * Security Monitor Class
 */
export class SecurityMonitor extends EventEmitter {
  private config: MonitoringConfig
  private alerts: Map<string, SecurityAlert> = new Map()
  private rules: Map<string, MonitoringRule> = new Map()
  private blockedIPs: Set<string> = new Set()
  private disabledUsers: Set<string> = new Set()
  private alertCounts: Map<string, number> = new Map()

  constructor(config: Partial<MonitoringConfig> = {}) {
    super()
    this.config = { ...DEFAULT_CONFIG, ...config }
    
    this.setupDefaultRules()
    this.startMonitoring()
  }

  /**
   * Start monitoring security events
   */
  private startMonitoring(): void {
    const securityLayer = getSecurityLayer()
    
    // Listen to security events
    securityLayer.on('threat-detected', (event: SecurityEvent) => {
      this.processSecurityEvent(event)
    })
    
    securityLayer.on('security-breach', (event: SecurityEvent) => {
      this.createAlert({
        type: 'breach_attempt',
        severity: 'emergency',
        title: 'Security Breach Detected',
        description: `Critical security breach: ${event.description}`,
        source: event.source,
        userId: event.userId,
        metadata: { event }
      })
    })
    
    securityLayer.on('rate-limit-exceeded', (data: any) => {
      this.createAlert({
        type: 'rate_limit_exceeded',
        severity: 'warning',
        title: 'Rate Limit Exceeded',
        description: `Rate limit exceeded for ${data.identifier}`,
        source: 'rate-limiter',
        metadata: data
      })
    })
    
    // Periodic cleanup
    setInterval(() => {
      this.cleanup()
    }, 60 * 60 * 1000) // Every hour
  }

  /**
   * Process security event through monitoring rules
   */
  private processSecurityEvent(event: SecurityEvent): void {
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue
      
      if (this.evaluateRule(rule, event)) {
        this.triggerRule(rule, event)
      }
    }
  }

  /**
   * Evaluate if a rule should trigger
   */
  private evaluateRule(rule: MonitoringRule, event: SecurityEvent): boolean {
    // Check if event type matches
    if (!rule.eventTypes.includes(event.type)) {
      return false
    }
    
    // Check cooldown
    if (rule.lastTriggered && Date.now() - rule.lastTriggered < rule.cooldownMs) {
      return false
    }
    
    // Evaluate conditions
    for (const condition of rule.conditions) {
      if (!this.evaluateCondition(condition, event)) {
        return false
      }
    }
    
    return true
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: RuleCondition, event: SecurityEvent): boolean {
    const value = this.getEventFieldValue(event, condition.field)
    
    switch (condition.operator) {
      case 'equals':
        return value === condition.value
      case 'not_equals':
        return value !== condition.value
      case 'contains':
        return String(value).includes(String(condition.value))
      case 'greater_than':
        return Number(value) > Number(condition.value)
      case 'less_than':
        return Number(value) < Number(condition.value)
      case 'matches':
        return new RegExp(condition.value).test(String(value))
      default:
        return false
    }
  }

  /**
   * Get field value from event
   */
  private getEventFieldValue(event: SecurityEvent, field: string): any {
    const fields = field.split('.')
    let value: any = event
    
    for (const f of fields) {
      if (value && typeof value === 'object') {
        value = value[f]
      } else {
        return undefined
      }
    }
    
    return value
  }

  /**
   * Trigger a monitoring rule
   */
  private triggerRule(rule: MonitoringRule, event: SecurityEvent): void {
    rule.lastTriggered = Date.now()
    
    this.emit('rule-triggered', { rule, event })
    
    // Execute automated actions
    for (const action of rule.actions) {
      this.executeAutomatedAction(action, rule, event)
    }
  }

  /**
   * Execute automated action
   */
  private executeAutomatedAction(
    action: AutomatedAction, 
    rule: MonitoringRule, 
    event: SecurityEvent
  ): void {
    try {
      switch (action.type) {
        case 'alert':
          this.createAlert({
            type: this.mapEventToAlertType(event.type),
            severity: action.severity,
            title: `Rule Triggered: ${rule.name}`,
            description: rule.description,
            source: rule.id,
            userId: event.userId,
            metadata: { rule, event, action: action.parameters }
          })
          break
          
        case 'block_ip':
          if (event.metadata?.ip) {
            this.blockIP(event.metadata.ip, action.parameters.durationMs || 3600000)
          }
          break
          
        case 'disable_user':
          if (event.userId) {
            this.disableUser(event.userId, action.parameters.durationMs || 3600000)
          }
          break
          
        case 'rate_limit':
          // Implementation would depend on rate limiter
          console.log(`🔄 Rate limit applied: ${JSON.stringify(action.parameters)}`)
          break
          
        case 'log':
          console.log(`🔍 Security Monitor: ${rule.name} - ${event.description}`, {
            event,
            rule,
            action: action.parameters
          })
          break
          
        case 'notify':
          this.sendNotification(action.severity, rule.name, event.description, action.parameters)
          break
      }
    } catch (error) {
      console.error(`❌ Failed to execute automated action ${action.type}:`, error)
    }
  }

  /**
   * Create a security alert
   */
  createAlert(alertData: Omit<SecurityAlert, 'id' | 'timestamp' | 'actions' | 'resolved' | 'escalated' | 'suppressed'>): SecurityAlert {
    const alertId = this.generateAlertId()
    
    const alert: SecurityAlert = {
      id: alertId,
      timestamp: Date.now(),
      actions: [],
      resolved: false,
      escalated: false,
      suppressed: false,
      ...alertData
    }
    
    // Check for duplicate suppression
    if (this.shouldSuppressAlert(alert)) {
      alert.suppressed = true
      alert.suppressedUntil = Date.now() + this.config.suppressDuplicatesMs
    }
    
    this.alerts.set(alertId, alert)
    
    // Track alert counts
    const hourKey = Math.floor(Date.now() / (60 * 60 * 1000)).toString()
    this.alertCounts.set(hourKey, (this.alertCounts.get(hourKey) || 0) + 1)
    
    // Check alert rate limits
    this.checkAlertRateLimits(hourKey)
    
    if (!alert.suppressed) {
      this.emit('alert-created', alert)
      this.notifyAlert(alert)
      
      // Schedule auto-escalation
      if (alert.severity === 'critical' || alert.severity === 'emergency') {
        setTimeout(() => {
          if (!alert.resolved && !alert.escalated) {
            this.escalateAlert(alertId)
          }
        }, this.config.escalationTimeoutMs)
      }
      
      // Schedule auto-resolution
      setTimeout(() => {
        if (!alert.resolved) {
          this.resolveAlert(alertId, 'system', 'Auto-resolved after timeout')
        }
      }, this.config.autoResolveTimeoutMs)
    }
    
    return alert
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string, resolvedBy: string, reason?: string): boolean {
    const alert = this.alerts.get(alertId)
    if (!alert || alert.resolved) {
      return false
    }
    
    alert.resolved = true
    alert.resolvedAt = Date.now()
    alert.resolvedBy = resolvedBy
    
    alert.actions.push({
      action: 'resolved',
      timestamp: Date.now(),
      automated: resolvedBy === 'system',
      success: true,
      details: reason || 'Alert resolved'
    })
    
    this.emit('alert-resolved', alert)
    
    return true
  }

  /**
   * Escalate an alert
   */
  escalateAlert(alertId: string, escalatedTo?: string): boolean {
    const alert = this.alerts.get(alertId)
    if (!alert || alert.resolved || alert.escalated) {
      return false
    }
    
    alert.escalated = true
    alert.escalatedAt = Date.now()
    alert.escalatedTo = escalatedTo || 'security-team'
    
    alert.actions.push({
      action: 'escalated',
      timestamp: Date.now(),
      automated: !escalatedTo,
      success: true,
      details: `Escalated to ${alert.escalatedTo}`
    })
    
    this.emit('alert-escalated', alert)
    
    // Send escalation notification
    this.sendNotification(
      'emergency',
      `ESCALATED: ${alert.title}`,
      `Alert ${alertId} has been escalated: ${alert.description}`,
      { alertId, escalatedTo: alert.escalatedTo }
    )
    
    return true
  }

  /**
   * Add monitoring rule
   */
  addRule(rule: Omit<MonitoringRule, 'id'>): string {
    const ruleId = this.generateRuleId()
    const fullRule: MonitoringRule = {
      id: ruleId,
      ...rule
    }
    
    this.rules.set(ruleId, fullRule)
    return ruleId
  }

  /**
   * Remove monitoring rule
   */
  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId)
  }

  /**
   * Get alert statistics
   */
  getAlertStats(timeWindowMs?: number): AlertStats {
    const now = Date.now()
    const cutoff = timeWindowMs ? now - timeWindowMs : 0
    
    const relevantAlerts = Array.from(this.alerts.values())
      .filter(alert => alert.timestamp > cutoff)
    
    const byType: Record<AlertType, number> = {} as any
    const bySeverity: Record<AlertSeverity, number> = {} as any
    
    let totalResolutionTime = 0
    let resolvedCount = 0
    
    relevantAlerts.forEach(alert => {
      byType[alert.type] = (byType[alert.type] || 0) + 1
      bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1
      
      if (alert.resolved && alert.resolvedAt) {
        totalResolutionTime += alert.resolvedAt - alert.timestamp
        resolvedCount++
      }
    })
    
    const recent24h = now - (24 * 60 * 60 * 1000)
    const recentAlerts = relevantAlerts.filter(alert => alert.timestamp > recent24h)
    
    return {
      total: relevantAlerts.length,
      byType,
      bySeverity,
      recent: recentAlerts.length,
      resolved: relevantAlerts.filter(alert => alert.resolved).length,
      escalated: relevantAlerts.filter(alert => alert.escalated).length,
      suppressed: relevantAlerts.filter(alert => alert.suppressed).length,
      averageResolutionTime: resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0
    }
  }

  /**
   * Get all alerts
   */
  getAlerts(filters?: {
    type?: AlertType[]
    severity?: AlertSeverity[]
    resolved?: boolean
    escalated?: boolean
    timeRange?: { start: number; end: number }
  }): SecurityAlert[] {
    let alerts = Array.from(this.alerts.values())
    
    if (filters) {
      if (filters.type) {
        alerts = alerts.filter(alert => filters.type!.includes(alert.type))
      }
      
      if (filters.severity) {
        alerts = alerts.filter(alert => filters.severity!.includes(alert.severity))
      }
      
      if (filters.resolved !== undefined) {
        alerts = alerts.filter(alert => alert.resolved === filters.resolved)
      }
      
      if (filters.escalated !== undefined) {
        alerts = alerts.filter(alert => alert.escalated === filters.escalated)
      }
      
      if (filters.timeRange) {
        alerts = alerts.filter(alert => 
          alert.timestamp >= filters.timeRange!.start && 
          alert.timestamp <= filters.timeRange!.end
        )
      }
    }
    
    return alerts.sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Block IP address
   */
  blockIP(ip: string, durationMs: number): void {
    this.blockedIPs.add(ip)
    
    setTimeout(() => {
      this.blockedIPs.delete(ip)
    }, durationMs)
    
    console.log(`🚫 IP ${ip} blocked for ${durationMs}ms`)
  }

  /**
   * Disable user
   */
  disableUser(userId: string, durationMs: number): void {
    this.disabledUsers.add(userId)
    
    setTimeout(() => {
      this.disabledUsers.delete(userId)
    }, durationMs)
    
    console.log(`🚫 User ${userId} disabled for ${durationMs}ms`)
  }

  /**
   * Check if IP is blocked
   */
  isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip)
  }

  /**
   * Check if user is disabled
   */
  isUserDisabled(userId: string): boolean {
    return this.disabledUsers.has(userId)
  }

  // Private helper methods

  private setupDefaultRules(): void {
    // High-frequency failed login attempts
    this.addRule({
      name: 'Multiple Failed Logins',
      description: 'Multiple authentication failures detected',
      eventTypes: ['authentication_attempt'],
      conditions: [
        { field: 'level', operator: 'equals', value: 'high' },
        { field: 'metadata.success', operator: 'equals', value: false }
      ],
      actions: [
        {
          type: 'alert',
          severity: 'warning',
          parameters: {}
        },
        {
          type: 'rate_limit',
          severity: 'warning',
          parameters: { factor: 2 }
        }
      ],
      enabled: true,
      cooldownMs: 5 * 60 * 1000 // 5 minutes
    })
    
    // SQL injection attempts
    this.addRule({
      name: 'SQL Injection Detected',
      description: 'Potential SQL injection attack detected',
      eventTypes: ['input_validation_failure', 'suspicious_activity'],
      conditions: [
        { field: 'description', operator: 'contains', value: 'injection' }
      ],
      actions: [
        {
          type: 'alert',
          severity: 'critical',
          parameters: {}
        },
        {
          type: 'block_ip',
          severity: 'critical',
          parameters: { durationMs: 3600000 } // 1 hour
        }
      ],
      enabled: true,
      cooldownMs: 60 * 1000 // 1 minute
    })
    
    // Multiple security events from same source
    this.addRule({
      name: 'Repeated Security Violations',
      description: 'Multiple security events from same source',
      eventTypes: ['suspicious_activity', 'input_validation_failure'],
      conditions: [
        { field: 'level', operator: 'greater_than', value: 'medium' }
      ],
      actions: [
        {
          type: 'alert',
          severity: 'critical',
          parameters: {}
        }
      ],
      enabled: true,
      cooldownMs: 10 * 60 * 1000 // 10 minutes
    })
  }

  private shouldSuppressAlert(alert: SecurityAlert): boolean {
    const now = Date.now()
    
    // Check for similar recent alerts
    for (const existingAlert of this.alerts.values()) {
      if (existingAlert.type === alert.type &&
          existingAlert.source === alert.source &&
          now - existingAlert.timestamp < this.config.suppressDuplicatesMs) {
        return true
      }
    }
    
    return false
  }

  private checkAlertRateLimits(hourKey: string): void {
    const count = this.alertCounts.get(hourKey) || 0
    
    if (count > this.config.maxAlertsPerHour) {
      this.emit('threshold-exceeded', {
        type: 'alerts_per_hour',
        current: count,
        threshold: this.config.maxAlertsPerHour
      })
    }
  }

  private notifyAlert(alert: SecurityAlert): void {
    for (const channel of this.config.notificationChannels) {
      if (!channel.enabled) continue
      
      if (this.getSeverityLevel(alert.severity) < this.getSeverityLevel(channel.minSeverity)) {
        continue
      }
      
      this.sendNotification(alert.severity, alert.title, alert.description, {
        channel: channel.type,
        config: channel.config
      })
    }
  }

  private sendNotification(severity: AlertSeverity, title: string, description: string, config: any): void {
    // Simple console notification - in real implementation would use actual notification services
    const timestamp = new Date().toISOString()
    const icon = this.getSeverityIcon(severity)
    
    console.log(`${icon} [${timestamp}] ${severity.toUpperCase()}: ${title}`)
    console.log(`   ${description}`)
    
    if (config.channel && config.channel !== 'console') {
      console.log(`   📡 Would notify via ${config.channel}:`, config.config)
    }
  }

  private getSeverityLevel(severity: AlertSeverity): number {
    const levels = { info: 0, warning: 1, critical: 2, emergency: 3 }
    return levels[severity] || 0
  }

  private getSeverityIcon(severity: AlertSeverity): string {
    const icons = { info: 'ℹ️', warning: '⚠️', critical: '🚨', emergency: '🆘' }
    return icons[severity] || 'ℹ️'
  }

  private mapEventToAlertType(eventType: SecurityEventType): AlertType {
    const mapping: Record<SecurityEventType, AlertType> = {
      'authentication_attempt': 'authentication_failure',
      'authorization_failure': 'authorization_violation',
      'suspicious_activity': 'suspicious_activity',
      'data_access': 'data_access_anomaly',
      'input_validation_failure': 'threat_detected',
      'rate_limit_exceeded': 'rate_limit_exceeded',
      'malicious_request': 'breach_attempt',
      'system_compromise': 'system_compromise',
      'data_breach': 'breach_attempt',
      'compliance_violation': 'compliance_violation'
    }
    
    return mapping[eventType] || 'threat_detected'
  }

  private generateAlertId(): string {
    return 'alert_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
  }

  private generateRuleId(): string {
    return 'rule_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
  }

  private cleanup(): void {
    const cutoff = Date.now() - (this.config.alertRetentionDays * 24 * 60 * 60 * 1000)
    
    // Clean up old alerts
    for (const [alertId, alert] of this.alerts.entries()) {
      if (alert.timestamp < cutoff && alert.resolved) {
        this.alerts.delete(alertId)
      }
    }
    
    // Clean up old alert counts
    const currentHour = Math.floor(Date.now() / (60 * 60 * 1000))
    for (const hourKey of this.alertCounts.keys()) {
      const hour = parseInt(hourKey)
      if (currentHour - hour > 24) { // Keep 24 hours of data
        this.alertCounts.delete(hourKey)
      }
    }
  }
}

// Export singleton instance
let monitorInstance: SecurityMonitor | null = null

export const getSecurityMonitor = (config?: Partial<MonitoringConfig>): SecurityMonitor => {
  if (!monitorInstance) {
    monitorInstance = new SecurityMonitor(config)
  }
  return monitorInstance
}

export default SecurityMonitor