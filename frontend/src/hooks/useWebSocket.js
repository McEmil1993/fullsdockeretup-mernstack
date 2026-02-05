import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import * as notificationService from '../services/notifications'

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3060'

/**
 * Custom hook for managing WebSocket connections and notifications
 * @param {Function} onDockerEvent - Callback for Docker events (start, stop, restart, etc.)
 * @returns {Object} - { socket, connected, notifications, addNotification, removeNotification }
 */
export function useWebSocket(onDockerEvent = null) {
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true)

  // Load notifications from MongoDB on init
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await notificationService.getNotifications({ limit: 10 })
        if (response.data) {
          setNotifications(response.data)
        }
      } catch (error) {
        console.error('Failed to load notifications from MongoDB:', error)
      } finally {
        setIsLoadingNotifications(false)
      }
    }
    
    loadNotifications()
  }, [])

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
      // console.log(' Connected to WebSocket service:', data)
      console.log(' Connected to WebSocket service:')
    })

    // Listen for Docker events (start, stop, restart, die, kill, pause, etc.)
    socketRef.current.on('dockerEvent', async (event) => {
      // console.log('🐳 Docker event received:', event)
      
      const notification = {
        id: Date.now() + Math.random(),
        type: event.type,
        category: event.category,
        action: event.action,
        message: event.message,
        recommendation: event.recommendation,
        containerId: event.containerId,
        containerName: event.containerName,
        image: event.image,
        timestamp: event.timestamp
      }
      
      // Save to MongoDB
      try {
        const response = await notificationService.createNotification({
          message: event.message,
          type: event.type || 'info',
          containerId: event.containerId,
          containerName: event.containerName
        })
        // Use server-generated ID if available
        notification.id = response.data?._id || notification.id
      } catch (error) {
        console.error('Failed to save notification to MongoDB:', error)
      }
      
      setNotifications(prev => [notification, ...prev].slice(0, 10))
      
      // Call custom callback if provided
      if (onDockerEvent) {
        onDockerEvent(event)
      }
    })

    // Listen for Docker alerts (CPU/Memory warnings)
    socketRef.current.on('dockerAlert', async (alert) => {
      // console.log('⚠️ Docker alert received:', alert)
      
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
      
      // Save to MongoDB
      try {
        const response = await notificationService.createNotification({
          message: alert.message,
          type: alert.type || 'warning',
          containerId: alert.containerId,
          containerName: alert.containerName
        })
        notification.id = response.data?._id || notification.id
      } catch (error) {
        console.error('Failed to save alert notification to MongoDB:', error)
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

export default useWebSocket
