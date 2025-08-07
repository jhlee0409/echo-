import { AuthManager } from './AuthManager'
import { 
  SessionInfo, 
  DeviceInfo, 
  TrustedDevice, 
  SecuritySettings,
  AuthUser,
  LoginAttempt
} from './types'
import { supabase } from '@lib/supabase'

/**
 * Session Manager
 * Handles session lifecycle, security monitoring, and device management
 */
export class SessionManager {
  private authManager: AuthManager
  private sessionCheckInterval: NodeJS.Timeout | null = null
  private activityTrackingInterval: NodeJS.Timeout | null = null
  private lastActivityTime: number = Date.now()
  private securitySettings: SecuritySettings | null = null

  constructor(authManager: AuthManager) {
    this.authManager = authManager
    this.setupActivityTracking()
    this.setupSessionMonitoring()
  }

  /**
   * Initialize session management
   */
  async initialize() {
    try {
      if (this.authManager.isAuthenticated) {
        await this.loadSecuritySettings()
        await this.startSessionTracking()
        await this.verifyCurrentSession()
      }
    } catch (error) {
      console.error('❌ Failed to initialize session manager:', error)
    }
  }

  /**
   * Setup activity tracking
   */
  private setupActivityTracking() {
    // Track user activity events
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    
    const updateActivity = () => {
      this.lastActivityTime = Date.now()
    }

    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true })
    })

    // Check for inactivity every minute
    this.activityTrackingInterval = setInterval(() => {
      this.checkSessionTimeout()
    }, 60 * 1000)
  }

  /**
   * Setup session monitoring
   */
  private setupSessionMonitoring() {
    // Check session validity every 5 minutes
    this.sessionCheckInterval = setInterval(async () => {
      if (this.authManager.isAuthenticated) {
        await this.validateSession()
      }
    }, 5 * 60 * 1000)
  }

  /**
   * Load user's security settings
   */
  private async loadSecuritySettings() {
    try {
      const user = this.authManager.user
      if (!user) return

      const { data, error } = await supabase
        .from('user_security_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // Not found error is ok
        console.error('❌ Failed to load security settings:', error)
        return
      }

      this.securitySettings = data || {
        two_factor_enabled: false,
        backup_codes_generated: false,
        trusted_devices: [],
        login_notifications: true,
        suspicious_activity_alerts: true,
        session_timeout: 480 // 8 hours default
      }

    } catch (error) {
      console.error('❌ Error loading security settings:', error)
    }
  }

  /**
   * Start session tracking
   */
  private async startSessionTracking() {
    try {
      const user = this.authManager.user
      const session = this.authManager.session
      
      if (!user || !session) return

      const sessionInfo = await this.createSessionInfo(user, session.access_token)
      
      // Store session in database
      const { error } = await supabase
        .from('user_sessions')
        .upsert({
          session_id: session.access_token,
          user_id: user.id,
          device_info: sessionInfo.device_info,
          ip_address: sessionInfo.ip_address,
          user_agent: sessionInfo.user_agent,
          created_at: new Date().toISOString(),
          last_active: new Date().toISOString(),
          expires_at: new Date(Date.now() + (this.securitySettings?.session_timeout || 480) * 60 * 1000).toISOString(),
          is_current: true
        }, {
          onConflict: 'session_id'
        })

      if (error) {
        console.error('❌ Failed to track session:', error)
      }

    } catch (error) {
      console.error('❌ Error starting session tracking:', error)
    }
  }

  /**
   * Create session information
   */
  private async createSessionInfo(user: AuthUser, sessionId: string): Promise<SessionInfo> {
    const deviceInfo = this.getDeviceInfo()
    const ipAddress = await this.getClientIP()
    
    return {
      session_id: sessionId,
      user_id: user.id,
      device_info: deviceInfo,
      ip_address: ipAddress,
      user_agent: navigator.userAgent,
      created_at: new Date().toISOString(),
      last_active: new Date().toISOString(),
      expires_at: new Date(Date.now() + (this.securitySettings?.session_timeout || 480) * 60 * 1000).toISOString(),
      is_current: true
    }
  }

  /**
   * Get device information
   */
  private getDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent
    let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop'
    let os = 'Unknown'
    let browser = 'Unknown'

    // Detect device type
    if (/tablet|ipad/i.test(userAgent)) {
      deviceType = 'tablet'
    } else if (/mobile|android|iphone/i.test(userAgent)) {
      deviceType = 'mobile'
    }

    // Detect OS
    if (/windows/i.test(userAgent)) os = 'Windows'
    else if (/macintosh|mac os x/i.test(userAgent)) os = 'macOS'
    else if (/linux/i.test(userAgent)) os = 'Linux'
    else if (/android/i.test(userAgent)) os = 'Android'
    else if (/iphone|ipad|ipod/i.test(userAgent)) os = 'iOS'

    // Detect browser
    if (/firefox/i.test(userAgent)) browser = 'Firefox'
    else if (/chrome/i.test(userAgent)) browser = 'Chrome'
    else if (/safari/i.test(userAgent)) browser = 'Safari'
    else if (/edge/i.test(userAgent)) browser = 'Edge'

    return { deviceType, os, browser }
  }

  /**
   * Get client IP address (simplified - would need server-side implementation)
   */
  private async getClientIP(): Promise<string> {
    try {
      // In a real application, this would be handled server-side
      // For now, return a placeholder
      return '0.0.0.0'
    } catch (error) {
      return '0.0.0.0'
    }
  }

  /**
   * Check for session timeout due to inactivity
   */
  private async checkSessionTimeout() {
    if (!this.authManager.isAuthenticated || !this.securitySettings) return

    const inactiveTime = Date.now() - this.lastActivityTime
    const timeoutMs = this.securitySettings.session_timeout * 60 * 1000

    if (inactiveTime > timeoutMs) {
      console.warn('⚠️ Session timeout due to inactivity')
      await this.handleSessionTimeout()
    }
  }

  /**
   * Handle session timeout
   */
  private async handleSessionTimeout() {
    try {
      // Notify user before logout
      const timeLeft = 60 // 1 minute warning
      const shouldContinue = confirm(
        `세션이 ${timeLeft}초 후 만료됩니다. 계속 사용하시겠습니까?`
      )

      if (shouldContinue) {
        this.lastActivityTime = Date.now()
        await this.refreshSession()
      } else {
        await this.authManager.signOut()
      }
    } catch (error) {
      console.error('❌ Error handling session timeout:', error)
      await this.authManager.signOut()
    }
  }

  /**
   * Refresh current session
   */
  private async refreshSession() {
    try {
      const { error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('❌ Session refresh failed:', error)
        await this.authManager.signOut()
      } else {
        console.log('✅ Session refreshed successfully')
        await this.updateSessionActivity()
      }
    } catch (error) {
      console.error('❌ Session refresh error:', error)
    }
  }

  /**
   * Update session activity timestamp
   */
  private async updateSessionActivity() {
    try {
      const session = this.authManager.session
      if (!session) return

      const { error } = await supabase
        .from('user_sessions')
        .update({
          last_active: new Date().toISOString()
        })
        .eq('session_id', session.access_token)

      if (error) {
        console.error('❌ Failed to update session activity:', error)
      }
    } catch (error) {
      console.error('❌ Error updating session activity:', error)
    }
  }

  /**
   * Validate current session
   */
  private async validateSession() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        console.warn('⚠️ Session validation failed, signing out')
        await this.authManager.signOut()
      } else {
        await this.updateSessionActivity()
      }
    } catch (error) {
      console.error('❌ Session validation error:', error)
    }
  }

  /**
   * Verify current session on startup
   */
  private async verifyCurrentSession() {
    try {
      const session = this.authManager.session
      if (!session) return

      // Check if session exists in database
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('session_id', session.access_token)
        .single()

      if (error || !data) {
        console.warn('⚠️ Session not found in database, creating new entry')
        await this.startSessionTracking()
      } else if (new Date(data.expires_at) < new Date()) {
        console.warn('⚠️ Session expired, signing out')
        await this.authManager.signOut()
      }
    } catch (error) {
      console.error('❌ Session verification error:', error)
    }
  }

  /**
   * Get all user sessions
   */
  async getUserSessions(): Promise<SessionInfo[]> {
    try {
      const user = this.authManager.user
      if (!user) return []

      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('last_active', { ascending: false })

      if (error) {
        console.error('❌ Failed to fetch user sessions:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('❌ Error fetching user sessions:', error)
      return []
    }
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string): Promise<{ error: any }> {
    try {
      const user = this.authManager.user
      if (!user) {
        return { error: new Error('User not authenticated') }
      }

      // Mark session as revoked in database
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', user.id)

      if (error) {
        console.error('❌ Failed to revoke session:', error)
        return { error }
      }

      console.log('✅ Session revoked successfully')
      return { error: null }
    } catch (error) {
      console.error('❌ Error revoking session:', error)
      return { error }
    }
  }

  /**
   * Revoke all other sessions except current
   */
  async revokeAllOtherSessions(): Promise<{ error: any }> {
    try {
      const user = this.authManager.user
      const currentSession = this.authManager.session
      
      if (!user || !currentSession) {
        return { error: new Error('User not authenticated') }
      }

      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', user.id)
        .neq('session_id', currentSession.access_token)

      if (error) {
        console.error('❌ Failed to revoke other sessions:', error)
        return { error }
      }

      console.log('✅ All other sessions revoked successfully')
      return { error: null }
    } catch (error) {
      console.error('❌ Error revoking other sessions:', error)
      return { error }
    }
  }

  /**
   * Add device to trusted list
   */
  async addTrustedDevice(deviceName: string): Promise<{ error: any }> {
    try {
      const user = this.authManager.user
      if (!user) {
        return { error: new Error('User not authenticated') }
      }

      const deviceFingerprint = this.generateDeviceFingerprint()
      const trustedDevice: TrustedDevice = {
        id: crypto.randomUUID(),
        device_name: deviceName,
        device_fingerprint: deviceFingerprint,
        created_at: new Date().toISOString(),
        last_used: new Date().toISOString()
      }

      // Update security settings
      if (this.securitySettings) {
        const updatedDevices = [...this.securitySettings.trusted_devices, trustedDevice]
        
        const { error } = await supabase
          .from('user_security_settings')
          .update({
            trusted_devices: updatedDevices
          })
          .eq('user_id', user.id)

        if (error) {
          console.error('❌ Failed to add trusted device:', error)
          return { error }
        }

        this.securitySettings.trusted_devices = updatedDevices
      }

      console.log('✅ Device added to trusted list')
      return { error: null }
    } catch (error) {
      console.error('❌ Error adding trusted device:', error)
      return { error }
    }
  }

  /**
   * Generate device fingerprint
   */
  private generateDeviceFingerprint(): string {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx!.textBaseline = 'top'
    ctx!.font = '14px Arial'
    ctx!.fillText('Device fingerprint', 2, 2)
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset().toString(),
      canvas.toDataURL()
    ].join('|')
    
    // Simple hash function
    let hash = 0
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    
    return Math.abs(hash).toString(16)
  }

  /**
   * Check if current device is trusted
   */
  isCurrentDeviceTrusted(): boolean {
    if (!this.securitySettings) return false
    
    const currentFingerprint = this.generateDeviceFingerprint()
    return this.securitySettings.trusted_devices.some(
      device => device.device_fingerprint === currentFingerprint
    )
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(event: string, details: Record<string, any>) {
    try {
      const user = this.authManager.user
      if (!user) return

      const securityEvent = {
        user_id: user.id,
        event_type: event,
        event_details: details,
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
        device_fingerprint: this.generateDeviceFingerprint(),
        created_at: new Date().toISOString()
      }

      console.log('🔐 Security event:', securityEvent)
      
      // In a real app, you'd store this in a security_events table
      
    } catch (error) {
      console.error('❌ Failed to log security event:', error)
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval)
    }
    if (this.activityTrackingInterval) {
      clearInterval(this.activityTrackingInterval)
    }
  }

  // Getters
  get currentSecuritySettings(): SecuritySettings | null {
    return this.securitySettings
  }

  get isDeviceTrusted(): boolean {
    return this.isCurrentDeviceTrusted()
  }

  get lastActivity(): number {
    return this.lastActivityTime
  }
}

export default SessionManager