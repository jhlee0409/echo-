/**
 * 🔌 WebSocket Manager
 * 
 * Manages WebSocket connections for real-time features
 * Handles reconnection, message queuing, and state synchronization
 */

import type { WSMessage, WSConnectionState } from './types'
import { DEFAULT_API_CONFIG } from './index'

interface WebSocketConfig {
  url?: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
}

type MessageHandler = (message: WSMessage) => void
type ConnectionHandler = (state: WSConnectionState) => void

export class WebSocketManager {
  private ws: WebSocket | null = null
  private config: Required<WebSocketConfig>
  private connectionState: WSConnectionState
  
  private messageHandlers = new Set<MessageHandler>()
  private connectionHandlers = new Set<ConnectionHandler>()
  private messageQueue: WSMessage[] = []
  
  private heartbeatTimer: NodeJS.Timeout | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private pingStartTime = 0

  constructor(config: WebSocketConfig = {}) {
    this.config = {
      url: config.url || this.getWSUrl(),
      reconnectInterval: config.reconnectInterval || 5000,
      maxReconnectAttempts: config.maxReconnectAttempts || 5,
      heartbeatInterval: config.heartbeatInterval || 30000
    }
    
    this.connectionState = {
      connected: false,
      latency: 0,
      reconnectAttempts: 0,
      lastError: undefined
    }
  }

  private getWSUrl(): string {
    const baseUrl = DEFAULT_API_CONFIG.baseURL
    return baseUrl.replace(/^http/, 'ws').replace('/api', '/ws')
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.CONNECTING || 
        this.ws?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      this.ws = new WebSocket(this.config.url)
      this.setupEventHandlers()
    } catch (error) {
      this.handleError(error as Error)
    }
  }

  disconnect(): void {
    this.clearTimers()
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
    
    this.updateConnectionState({
      connected: false,
      reconnectAttempts: 0
    })
  }

  send(message: WSMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(message)
      
      // Try to reconnect if not connected
      if (!this.connectionState.connected) {
        this.connect()
      }
    }
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler)
    return () => this.messageHandlers.delete(handler)
  }

  onConnectionChange(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler)
    return () => this.connectionHandlers.delete(handler)
  }

  getConnectionState(): WSConnectionState {
    return { ...this.connectionState }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return

    this.ws.onopen = () => {
      this.updateConnectionState({
        connected: true,
        reconnectAttempts: 0,
        lastError: undefined
      })
      
      this.startHeartbeat()
      this.sendQueuedMessages()
    }

    this.ws.onclose = (event) => {
      this.updateConnectionState({ connected: false })
      this.clearTimers()
      
      // Attempt reconnection unless it was a clean close
      if (event.code !== 1000 && 
          this.connectionState.reconnectAttempts < this.config.maxReconnectAttempts) {
        this.scheduleReconnect()
      }
    }

    this.ws.onerror = (event) => {
      this.handleError(new Error('WebSocket error'))
    }

    this.ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data)
        
        // Handle system messages
        if (message.type === 'pong') {
          this.handlePong()
          return
        }
        
        // Notify handlers
        this.messageHandlers.forEach(handler => {
          try {
            handler(message)
          } catch (error) {
            console.error('WebSocket message handler error:', error)
          }
        })
      } catch (error) {
        console.error('WebSocket message parse error:', error)
      }
    }
  }

  private updateConnectionState(updates: Partial<WSConnectionState>): void {
    this.connectionState = { ...this.connectionState, ...updates }
    
    // Notify connection handlers
    this.connectionHandlers.forEach(handler => {
      try {
        handler(this.connectionState)
      } catch (error) {
        console.error('WebSocket connection handler error:', error)
      }
    })
  }

  private startHeartbeat(): void {
    this.clearTimers()
    
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.pingStartTime = Date.now()
        this.send({
          type: 'ping',
          timestamp: this.pingStartTime
        })
      }
    }, this.config.heartbeatInterval)
  }

  private handlePong(): void {
    const latency = Date.now() - this.pingStartTime
    this.updateConnectionState({ latency })
  }

  private scheduleReconnect(): void {
    this.clearTimers()
    
    const attempts = this.connectionState.reconnectAttempts + 1
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, attempts - 1),
      30000
    )
    
    this.updateConnectionState({ reconnectAttempts: attempts })
    
    this.reconnectTimer = setTimeout(() => {
      this.connect()
    }, delay)
  }

  private sendQueuedMessages(): void {
    while (this.messageQueue.length > 0 && 
           this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift()!
      this.ws.send(JSON.stringify(message))
    }
  }

  private handleError(error: Error): void {
    this.updateConnectionState({ 
      lastError: error.message 
    })
    
    console.error('WebSocket error:', error)
  }

  private clearTimers(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }
}

// Singleton instance
let wsManager: WebSocketManager | null = null

export const getWebSocketManager = (config?: WebSocketConfig): WebSocketManager => {
  if (!wsManager) {
    wsManager = new WebSocketManager(config)
  }
  return wsManager
}

// React hook
import { useEffect, useState } from 'react'

export const useWebSocket = (config?: WebSocketConfig) => {
  const [wsManager] = useState(() => getWebSocketManager(config))
  const [connectionState, setConnectionState] = useState(wsManager.getConnectionState())

  useEffect(() => {
    const unsubscribe = wsManager.onConnectionChange(setConnectionState)
    
    // Auto-connect
    wsManager.connect()
    
    return () => {
      unsubscribe()
      wsManager.disconnect()
    }
  }, [wsManager])

  return {
    send: wsManager.send.bind(wsManager),
    onMessage: wsManager.onMessage.bind(wsManager),
    connectionState,
    connect: wsManager.connect.bind(wsManager),
    disconnect: wsManager.disconnect.bind(wsManager)
  }
}