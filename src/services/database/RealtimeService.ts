/**
 * Realtime Service
 * Handles Supabase realtime subscriptions for live updates
 */

import { supabase } from '@/lib/supabase'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { log } from '@config/env'

export type DatabaseEvent = 'INSERT' | 'UPDATE' | 'DELETE'
export type TableName = 'user_profiles' | 'companions' | 'game_states' | 'messages' | 'user_settings'

export interface RealtimeSubscription {
  id: string
  channel: RealtimeChannel
  table: TableName
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
  isActive: boolean
}

export interface RealtimeOptions {
  event?: DatabaseEvent | DatabaseEvent[]
  schema?: string
  filter?: string
}

/**
 * Realtime Service for managing live data subscriptions
 */
export class RealtimeService {
  private static instance: RealtimeService
  private subscriptions = new Map<string, RealtimeSubscription>()
  private connectionStatus: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED' = 'DISCONNECTED'

  static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService()
    }
    return RealtimeService.instance
  }

  /**
   * Initialize realtime connection
   */
  async initialize(): Promise<void> {
    try {
      this.connectionStatus = 'CONNECTING'
      
      // Listen to auth changes
      supabase.auth.onAuthStateChange((event, session) => {
        log.debug('Auth state changed:', event, session?.user?.id)
        
        if (event === 'SIGNED_IN' && session?.user) {
          this.handleUserSignIn(session.user.id)
        } else if (event === 'SIGNED_OUT') {
          this.handleUserSignOut()
        }
      })

      this.connectionStatus = 'CONNECTED'
      log.info('Realtime service initialized successfully')
    } catch (error) {
      this.connectionStatus = 'DISCONNECTED'
      log.error('Failed to initialize realtime service:', error)
      throw error
    }
  }

  /**
   * Subscribe to table changes
   */
  subscribe<T = any>(
    table: TableName,
    callback: (payload: RealtimePostgresChangesPayload<T>) => void,
    options: RealtimeOptions = {}
  ): string {
    const subscriptionId = this.generateSubscriptionId(table, options)
    
    try {
      const channelName = `${table}-${subscriptionId}`
      const channel = supabase.channel(channelName)

      // Configure the subscription based on options
      const events = Array.isArray(options.event) 
        ? options.event 
        : options.event 
          ? [options.event] 
          : ['INSERT', 'UPDATE', 'DELETE']

      events.forEach(event => {
        const config: any = {
          event: event as any,
          schema: options.schema || 'public',
          table
        }

        if (options.filter) {
          config.filter = options.filter
        }

        channel.on('postgres_changes', config, callback)
      })

      channel.subscribe((status) => {
        log.debug(`Subscription ${subscriptionId} status:`, status)
        
        if (status === 'SUBSCRIBED') {
          const subscription: RealtimeSubscription = {
            id: subscriptionId,
            channel,
            table,
            callback,
            isActive: true
          }
          this.subscriptions.set(subscriptionId, subscription)
          log.info(`Successfully subscribed to ${table} changes`)
        } else if (status === 'CHANNEL_ERROR') {
          log.error(`Error subscribing to ${table}:`, status)
        }
      })

      return subscriptionId
    } catch (error) {
      log.error(`Failed to subscribe to ${table}:`, error)
      throw error
    }
  }

  /**
   * Subscribe to user-specific companion changes
   */
  subscribeToUserCompanions(
    userId: string,
    callback: (payload: RealtimePostgresChangesPayload<any>) => void
  ): string {
    return this.subscribe(
      'companions',
      callback,
      { filter: `user_id=eq.${userId}` }
    )
  }

  /**
   * Subscribe to conversation messages
   */
  subscribeToConversation(
    sessionId: string,
    callback: (payload: RealtimePostgresChangesPayload<any>) => void
  ): string {
    return this.subscribe(
      'messages',
      callback,
      { 
        event: ['INSERT', 'UPDATE'],
        filter: `conversation_session_id=eq.${sessionId}` 
      }
    )
  }

  /**
   * Subscribe to game state changes
   */
  subscribeToGameState(
    userId: string,
    callback: (payload: RealtimePostgresChangesPayload<any>) => void
  ): string {
    return this.subscribe(
      'game_states',
      callback,
      { filter: `user_id=eq.${userId}` }
    )
  }

  /**
   * Subscribe to user settings changes
   */
  subscribeToUserSettings(
    userId: string,
    callback: (payload: RealtimePostgresChangesPayload<any>) => void
  ): string {
    return this.subscribe(
      'user_settings',
      callback,
      { filter: `user_id=eq.${userId}` }
    )
  }

  /**
   * Unsubscribe from specific subscription
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId)
    
    if (subscription) {
      try {
        subscription.channel.unsubscribe()
        subscription.isActive = false
        this.subscriptions.delete(subscriptionId)
        log.info(`Unsubscribed from ${subscription.table}: ${subscriptionId}`)
      } catch (error) {
        log.error(`Failed to unsubscribe from ${subscriptionId}:`, error)
      }
    } else {
      log.warn(`Subscription not found: ${subscriptionId}`)
    }
  }

  /**
   * Unsubscribe from all subscriptions
   */
  unsubscribeAll(): void {
    log.info(`Unsubscribing from ${this.subscriptions.size} subscriptions`)
    
    for (const [subscriptionId] of this.subscriptions) {
      this.unsubscribe(subscriptionId)
    }
  }

  /**
   * Get active subscriptions
   */
  getActiveSubscriptions(): RealtimeSubscription[] {
    return Array.from(this.subscriptions.values()).filter(sub => sub.isActive)
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED' {
    return this.connectionStatus
  }

  /**
   * Check if subscription exists
   */
  hasSubscription(subscriptionId: string): boolean {
    return this.subscriptions.has(subscriptionId) && 
           this.subscriptions.get(subscriptionId)?.isActive === true
  }

  /**
   * Reconnect all subscriptions (useful after network issues)
   */
  async reconnectAll(): Promise<void> {
    log.info('Reconnecting all realtime subscriptions...')
    
    const subscriptionsToReconnect = Array.from(this.subscriptions.values())
    
    // Unsubscribe all current subscriptions
    this.unsubscribeAll()
    
    // Recreate subscriptions
    for (const subscription of subscriptionsToReconnect) {
      try {
        this.subscribe(subscription.table, subscription.callback)
      } catch (error) {
        log.error(`Failed to reconnect subscription for ${subscription.table}:`, error)
      }
    }
  }

  /**
   * Handle user sign in
   */
  private handleUserSignIn(userId: string): void {
    log.info(`User signed in: ${userId}`)
    // You can add automatic subscriptions here if needed
  }

  /**
   * Handle user sign out
   */
  private handleUserSignOut(): void {
    log.info('User signed out, cleaning up subscriptions')
    this.unsubscribeAll()
  }

  /**
   * Generate unique subscription ID
   */
  private generateSubscriptionId(table: TableName, options: RealtimeOptions): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const optionsHash = JSON.stringify(options)
    return `${table}-${timestamp}-${random}-${btoa(optionsHash).substring(0, 8)}`
  }

  /**
   * Cleanup on service shutdown
   */
  async shutdown(): Promise<void> {
    log.info('Shutting down realtime service...')
    this.unsubscribeAll()
    this.connectionStatus = 'DISCONNECTED'
  }
}

/**
 * Realtime Hook for React components
 * Provides easy-to-use realtime functionality in React
 */
export class RealtimeHook {
  private static subscriptions = new Set<string>()

  /**
   * Use realtime subscription (for React hooks)
   */
  static useRealtimeSubscription<T = any>(
    table: TableName,
    callback: (payload: RealtimePostgresChangesPayload<T>) => void,
    options: RealtimeOptions = {},
    dependencies: any[] = []
  ): {
    subscriptionId: string | null
    isActive: boolean
    unsubscribe: () => void
  } {
    const realtimeService = RealtimeService.getInstance()
    let subscriptionId: string | null = null
    let isActive = false

    try {
      subscriptionId = realtimeService.subscribe(table, callback, options)
      isActive = true
      RealtimeHook.subscriptions.add(subscriptionId)

      return {
        subscriptionId,
        isActive,
        unsubscribe: () => {
          if (subscriptionId) {
            realtimeService.unsubscribe(subscriptionId)
            RealtimeHook.subscriptions.delete(subscriptionId)
          }
        }
      }
    } catch (error) {
      log.error('Failed to create realtime subscription:', error)
      return {
        subscriptionId: null,
        isActive: false,
        unsubscribe: () => {}
      }
    }
  }

  /**
   * Cleanup all hook subscriptions
   */
  static cleanupAll(): void {
    const realtimeService = RealtimeService.getInstance()
    
    for (const subscriptionId of RealtimeHook.subscriptions) {
      realtimeService.unsubscribe(subscriptionId)
    }
    
    RealtimeHook.subscriptions.clear()
  }
}

// Export singleton instance
export const realtimeService = RealtimeService.getInstance()

// Export hook for convenience
export { RealtimeHook as useRealtime }