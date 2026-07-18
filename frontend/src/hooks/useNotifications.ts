import { useEffect, useState, useCallback } from 'react'
import { wsClient } from '../services/websocket'

export interface Notification {
  type: string
  data: any
  timestamp: string
}

interface NotificationState {
  notifications: Notification[]
  pendingCallsCount: number
  unreadCount: number
}

/**
 * Hook to manage WebSocket notifications
 */
export function useNotifications() {
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    pendingCallsCount: 0,
    unreadCount: 0,
  })

  useEffect(() => {
    // Connect to WebSocket on mount
    wsClient.connect()

    // Subscribe to all notifications
    const unsubscribe = wsClient.on('*', (notification: Notification) => {
      setState((prev) => ({
        notifications: [notification, ...prev.notifications].slice(0, 50),
        pendingCallsCount:
          notification.type === 'zalo_call_request'
            ? prev.pendingCallsCount + 1
            : prev.pendingCallsCount,
        unreadCount: prev.unreadCount + 1,
      }))

      // Play notification sound
      playNotificationSound()

      // Show browser notification if permitted
      showBrowserNotification(notification)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const markAllRead = useCallback(() => {
    setState((prev) => ({ ...prev, unreadCount: 0 }))
  }, [])

  const clearPendingCalls = useCallback(() => {
    setState((prev) => ({ ...prev, pendingCallsCount: 0 }))
  }, [])

  const dismissNotification = useCallback((timestamp: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((n) => n.timestamp !== timestamp),
    }))
  }, [])

  return {
    ...state,
    markAllRead,
    clearPendingCalls,
    dismissNotification,
  }
}

/**
 * Play notification sound using Web Audio API
 */
function playNotificationSound(): void {
  try {
    const AudioContext =
      window.AudioContext || (window as any).webkitAudioContext
    const ctx = new AudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.value = 880 // A5 note
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)

    oscillator.start()
    oscillator.stop(ctx.currentTime + 0.3)
  } catch (error) {
    // Audio not available, silently ignore
  }
}

/**
 * Show browser notification if permitted
 */
function showBrowserNotification(notification: Notification): void {
  if (!('Notification' in window)) return

  if (Notification.permission === 'granted') {
    let title = 'Thông báo mới'
    let body = ''

    switch (notification.type) {
      case 'zalo_call_request':
        title = '📞 Yêu cầu gọi Zalo mới'
        body = `Khách: ${notification.data.customerName} - Ưu tiên: ${notification.data.priority}`
        break
      default:
        title = 'Thông báo'
        body = notification.type
    }

    new Notification(title, { body })
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false

  if (Notification.permission === 'granted') return true

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}
