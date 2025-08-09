import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { SecurityMonitor, getSecurityMonitor } from '../SecurityMonitor'
import type { SecurityEvent, ThreatLevel } from '../SecurityEnhancementLayer'

describe('SecurityMonitor', () => {
  let monitor: SecurityMonitor
  let consoleSpy: any

  beforeEach(() => {
    monitor = new SecurityMonitor()
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  describe('Alert Creation', () => {
    it('should create alerts successfully', () => {
      const alert = monitor.createAlert({
        type: 'threat_detected',
        severity: 'warning',
        title: 'Test Alert',
        description: 'Test alert description',
        source: 'test',
        metadata: { test: true }
      })

      expect(alert).toBeTruthy()
      expect(alert.id).toBeTruthy()
      expect(alert.timestamp).toBeGreaterThan(0)
      expect(alert.type).toBe('threat_detected')
      expect(alert.severity).toBe('warning')
      expect(alert.resolved).toBe(false)
    })

    it('should emit alert-created events', () => {
      const emitSpy = vi.fn()
      monitor.on('alert-created', emitSpy)

      monitor.createAlert({
        type: 'threat_detected',
        severity: 'warning',
        title: 'Test Alert',
        description: 'Test alert description',
        source: 'test',
        metadata: {}
      })

      expect(emitSpy).toHaveBeenCalled()
    })

    it('should suppress duplicate alerts', () => {
      const alertData = {
        type: 'threat_detected' as any,
        severity: 'warning' as any,
        title: 'Test Alert',
        description: 'Test alert description',
        source: 'test',
        metadata: {}
      }

      const alert1 = monitor.createAlert(alertData)
      const alert2 = monitor.createAlert(alertData)

      expect(alert1.suppressed).toBe(false)
      expect(alert2.suppressed).toBe(true)
    })
  })

  describe('Alert Resolution', () => {
    it('should resolve alerts successfully', () => {
      const alert = monitor.createAlert({
        type: 'threat_detected',
        severity: 'warning',
        title: 'Test Alert',
        description: 'Test alert description',
        source: 'test',
        metadata: {}
      })

      const resolved = monitor.resolveAlert(alert.id, 'admin', 'Test resolution')

      expect(resolved).toBe(true)
      expect(alert.resolved).toBe(true)
      expect(alert.resolvedBy).toBe('admin')
      expect(alert.resolvedAt).toBeGreaterThan(0)
    })

    it('should emit alert-resolved events', () => {
      const emitSpy = vi.fn()
      monitor.on('alert-resolved', emitSpy)

      const alert = monitor.createAlert({
        type: 'threat_detected',
        severity: 'warning',
        title: 'Test Alert',
        description: 'Test alert description',
        source: 'test',
        metadata: {}
      })

      monitor.resolveAlert(alert.id, 'admin')
      expect(emitSpy).toHaveBeenCalled()
    })
  })

  describe('Alert Escalation', () => {
    it('should escalate alerts successfully', () => {
      const alert = monitor.createAlert({
        type: 'threat_detected',
        severity: 'critical',
        title: 'Test Alert',
        description: 'Test alert description',
        source: 'test',
        metadata: {}
      })

      const escalated = monitor.escalateAlert(alert.id, 'security-team')

      expect(escalated).toBe(true)
      expect(alert.escalated).toBe(true)
      expect(alert.escalatedTo).toBe('security-team')
      expect(alert.escalatedAt).toBeGreaterThan(0)
    })

    it('should emit alert-escalated events', () => {
      const emitSpy = vi.fn()
      monitor.on('alert-escalated', emitSpy)

      const alert = monitor.createAlert({
        type: 'threat_detected',
        severity: 'critical',
        title: 'Test Alert',
        description: 'Test alert description',
        source: 'test',
        metadata: {}
      })

      monitor.escalateAlert(alert.id)
      expect(emitSpy).toHaveBeenCalled()
    })
  })

  describe('Monitoring Rules', () => {
    it('should add monitoring rules successfully', () => {
      const ruleId = monitor.addRule({
        name: 'Test Rule',
        description: 'Test monitoring rule',
        eventTypes: ['suspicious_activity'],
        conditions: [
          { field: 'level', operator: 'equals', value: 'high' }
        ],
        actions: [
          { type: 'alert', severity: 'warning', parameters: {} }
        ],
        enabled: true,
        cooldownMs: 60000
      })

      expect(ruleId).toBeTruthy()
    })

    it('should remove monitoring rules successfully', () => {
      const ruleId = monitor.addRule({
        name: 'Test Rule',
        description: 'Test monitoring rule',
        eventTypes: ['suspicious_activity'],
        conditions: [],
        actions: [],
        enabled: true,
        cooldownMs: 60000
      })

      const removed = monitor.removeRule(ruleId)
      expect(removed).toBe(true)
    })
  })

  describe('Alert Statistics', () => {
    it('should provide alert statistics', () => {
      monitor.createAlert({
        type: 'threat_detected',
        severity: 'warning',
        title: 'Test Alert 1',
        description: 'Test alert description',
        source: 'test',
        metadata: {}
      })

      monitor.createAlert({
        type: 'suspicious_activity',
        severity: 'critical',
        title: 'Test Alert 2',
        description: 'Test alert description',
        source: 'test',
        metadata: {}
      })

      const stats = monitor.getAlertStats()

      expect(stats.total).toBe(2)
      expect(stats.byType.threat_detected).toBe(1)
      expect(stats.byType.suspicious_activity).toBe(1)
      expect(stats.bySeverity.warning).toBe(1)
      expect(stats.bySeverity.critical).toBe(1)
    })
  })

  describe('IP Blocking', () => {
    it('should block IP addresses', () => {
      const ip = '192.168.1.100'
      
      monitor.blockIP(ip, 1000)
      expect(monitor.isIPBlocked(ip)).toBe(true)
    })

    it('should unblock IP addresses after duration', () => {
      vi.useFakeTimers()
      
      const ip = '192.168.1.100'
      monitor.blockIP(ip, 1000)
      
      expect(monitor.isIPBlocked(ip)).toBe(true)
      
      vi.advanceTimersByTime(1001)
      expect(monitor.isIPBlocked(ip)).toBe(false)
      
      vi.useRealTimers()
    })
  })

  describe('User Disabling', () => {
    it('should disable users', () => {
      const userId = 'user123'
      
      monitor.disableUser(userId, 1000)
      expect(monitor.isUserDisabled(userId)).toBe(true)
    })

    it('should re-enable users after duration', () => {
      vi.useFakeTimers()
      
      const userId = 'user123'
      monitor.disableUser(userId, 1000)
      
      expect(monitor.isUserDisabled(userId)).toBe(true)
      
      vi.advanceTimersByTime(1001)
      expect(monitor.isUserDisabled(userId)).toBe(false)
      
      vi.useRealTimers()
    })
  })

  describe('Alert Filtering', () => {
    beforeEach(() => {
      monitor.createAlert({
        type: 'threat_detected',
        severity: 'warning',
        title: 'Warning Alert',
        description: 'Warning alert description',
        source: 'test',
        metadata: {}
      })

      monitor.createAlert({
        type: 'suspicious_activity',
        severity: 'critical',
        title: 'Critical Alert',
        description: 'Critical alert description',
        source: 'test',
        metadata: {}
      })
    })

    it('should filter alerts by type', () => {
      const alerts = monitor.getAlerts({
        type: ['threat_detected']
      })

      expect(alerts.length).toBe(1)
      expect(alerts[0].type).toBe('threat_detected')
    })

    it('should filter alerts by severity', () => {
      const alerts = monitor.getAlerts({
        severity: ['critical']
      })

      expect(alerts.length).toBe(1)
      expect(alerts[0].severity).toBe('critical')
    })

    it('should filter alerts by resolution status', () => {
      const alerts = monitor.getAlerts({
        resolved: false
      })

      expect(alerts.length).toBe(2)
      alerts.forEach(alert => expect(alert.resolved).toBe(false))
    })
  })

  describe('Singleton Pattern', () => {
    it('should return same instance from getSecurityMonitor', () => {
      const instance1 = getSecurityMonitor()
      const instance2 = getSecurityMonitor()

      expect(instance1).toBe(instance2)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid alert resolution gracefully', () => {
      const resolved = monitor.resolveAlert('invalid-id', 'admin')
      expect(resolved).toBe(false)
    })

    it('should handle invalid alert escalation gracefully', () => {
      const escalated = monitor.escalateAlert('invalid-id')
      expect(escalated).toBe(false)
    })

    it('should handle invalid rule removal gracefully', () => {
      const removed = monitor.removeRule('invalid-id')
      expect(removed).toBe(false)
    })
  })
})