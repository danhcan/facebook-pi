type NotificationHandler = (notification: any) => void

/**
 * WebSocket client for realtime notifications
 */
class WebSocketClient {
  private ws: WebSocket | null = null
  private handlers: Map<string, Set<NotificationHandler>> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private shouldReconnect = true

  /**
   * Connect to WebSocket server with JWT token
   */
  connect(): void {
    const token = localStorage.getItem('fbm_token')
    if (!token) {
      console.warn('[WS] No token found, skipping connection')
      return
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`

    try {
      this.ws = new WebSocket(wsUrl)
      this.shouldReconnect = true

      this.ws.onopen = () => {
        console.log('[WS] Connected')
        this.reconnectAttempts = 0
        this.reconnectDelay = 1000
      }

      this.ws.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data)
          console.log('[WS] Notification:', notification)
          this.notifyHandlers(notification.type, notification)
          this.notifyHandlers('*', notification)
        } catch (error) {
          console.error('[WS] Failed to parse message:', error)
        }
      }

      this.ws.onclose = (event) => {
        console.log('[WS] Closed:', event.code, event.reason)
        this.ws = null

        if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++
          const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
          console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)
          setTimeout(() => this.connect(), delay)
        }
      }

      this.ws.onerror = (error) => {
        console.error('[WS] Error:', error)
      }
    } catch (error) {
      console.error('[WS] Failed to connect:', error)
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.shouldReconnect = false
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  /**
   * Subscribe to notification type
   */
  on(type: string, handler: NotificationHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }
    this.handlers.get(type)!.add(handler)

    return () => {
      this.handlers.get(type)?.delete(handler)
    }
  }

  /**
   * Notify all handlers for a notification type
   */
  private notifyHandlers(type: string, notification: any): void {
    const handlers = this.handlers.get(type)
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(notification)
        } catch (error) {
          console.error('[WS] Handler error:', error)
        }
      })
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

export const wsClient = new WebSocketClient()
