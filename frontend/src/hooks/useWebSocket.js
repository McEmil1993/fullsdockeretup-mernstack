import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3060'

/**
 * Custom hook for managing WebSocket connections and notifications
 * @param {Function} onDockerEvent - Callback for Docker events (start, stop, restart, etc.)
 * @returns {Object} - { socket, connected, notifications, addNotification, removeNotification }
 */
export function useWebSocket(onDockerEvent = null) {
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [notifications, setNotifications] = useState(() => {
    // Load notifications from localStorage on init
    try {
      const saved = localStorage.getItem('dockerNotifications')
      if (saved) {
        const parsed = JSON.parse(saved)
        // Keep only notifications from last 24 hours
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000)
        return parsed.filter(n => new Date(n.timestamp).getTime() > oneDayAgo).slice(0, 10)
      }
    } catch (error) {
      console.error('Failed to load notifications from localStorage:', error)
    }
    return []
  })

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('dockerNotifications', JSON.stringify(notifications))
    } catch (error) {
      console.error('Failed to save notifications to localStorage:', error)
    }
  }, [notifications])

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    })

    // Connection handlers
    socketRef.current.on('connect', () => {
      console.log('✅ WebSocket connected')
      setConnected(true)
    })

    socketRef.current.on('disconnect', () => {
      console.log('❌ WebSocket disconnected')
      setConnected(false)
    })

    socketRef.current.on('connected', (data) => {
      console.log('🔌 Connected to WebSocket service:', data)
    })

    // Listen for Docker events (start, stop, restart, die, kill, pause, etc.)
    socketRef.current.on('dockerEvent', (event) => {
      console.log('🐳 Docker event received:', event)
      
      // Add notification to the list
      const notification = {
        id: Date.now() + Math.random(),
        type: event.type, // 'critical', 'warning', 'info'
        category: event.category,
        action: event.action,
        message: event.message,
        recommendation: event.recommendation,
        containerId: event.containerId,
        containerName: event.containerName,
        image: event.image,
        timestamp: event.timestamp
      }
      
      setNotifications(prev => [notification, ...prev].slice(0, 10)) // Keep last 10
      
      // Call custom callback if provided
      if (onDockerEvent) {
        onDockerEvent(event)
      }
    })

    // Listen for Docker alerts (CPU/Memory warnings)
    socketRef.current.on('dockerAlert', (alert) => {
      console.log('⚠️ Docker alert received:', alert)
      
      const notification = {
        id: Date.now() + Math.random(),
        type: alert.type,
        category: alert.category,
        message: alert.message,
        recommendation: alert.recommendation,
        value: alert.value,
        threshold: alert.threshold,
        containerId: alert.containerId,
        containerName: alert.containerName,
        timestamp: alert.timestamp
      }
      
      setNotifications(prev => [notification, ...prev].slice(0, 10))
    })

    // Listen for errors
    socketRef.current.on('dockerError', (error) => {
      console.error('❌ Docker error:', error)
    })

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [onDockerEvent])

  // Add notification manually
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      ...notification,
      timestamp: notification.timestamp || new Date().toISOString()
    }
    setNotifications(prev => [newNotification, ...prev].slice(0, 10))
  }

  // Remove notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([])
  }

  return {
    socket: socketRef.current,
    connected,
    notifications,
    addNotification,
    removeNotification,
    clearNotifications
  }
}
