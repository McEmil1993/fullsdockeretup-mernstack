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
  
  // Get current user ID from localStorage
  const getCurrentUserId = () => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        return user._id || user.id
      }
    } catch (error) {
      console.error('Error getting current user ID:', error)
    }
    return null
  }
  
  // Track user's own recent actions to filter out self-notifications
  const recentActionsRef = useRef(new Set())

  // Load UNREAD notifications from MongoDB on init
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await notificationService.getNotifications({ 
          limit: 10, 
          unreadOnly: true // Only load unread notifications for the bell
        })
        if (response.data) {
          console.log('Loaded notifications from MongoDB:', response.data.length, 'unread')
          console.log('Raw data from MongoDB:', response.data)
          // Map MongoDB notifications to match local state format and filter out read ones
          const mappedNotifications = response.data
            .filter(n => !n.isRead) // Double check - only unread
            .map(n => ({
              id: n._id,
              type: n.type,
              category: n.category || 'docker',
              message: n.message,
              containerId: n.containerId,
              containerName: n.containerName,
              timestamp: n.createdAt,
              isRead: n.isRead
            }))
          console.log('Mapped notifications for bell:', mappedNotifications.length)
          setNotifications(mappedNotifications)
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
      console.log('🐳 Docker event received:', event)
      console.log('Action:', event.action, 'Container:', event.containerName)
      console.log('Current tracked actions:', Array.from(recentActionsRef.current))
      
      // Skip notification if this is user's own action
      // Note: "die" is automatic (container crashed), "kill" is user action
      if (isOwnAction(event.action, event.containerName)) {
        console.log('⏭️ Skipping self-notification:', event.action, event.containerName)
        return
      }
      
      console.log('✅ Creating notification for:', event.action, event.containerName)
      
      // Save to MongoDB first
      try {
        const response = await notificationService.createNotification({
          message: event.message,
          type: event.type || 'info',
          containerId: event.containerId,
          containerName: event.containerName,
          category: event.category
        })
        
        // Use MongoDB response to create notification
        const notification = {
          id: response.data._id,
          type: event.type,
          category: event.category,
          action: event.action,
          message: event.message,
          recommendation: event.recommendation,
          containerId: event.containerId,
          containerName: event.containerName,
          image: event.image,
          timestamp: event.timestamp || response.data.createdAt,
          isRead: false,
          actionBy: response.data.actionBy,
          actionByUserId: response.data.actionByUserId
        }
        
        // Filter out if this notification is from current user's action
        const currentUserId = getCurrentUserId()
        if (currentUserId && response.data.actionByUserId && response.data.actionByUserId === currentUserId) {
          console.log('⏭️ Skipping self-notification (userId match):', currentUserId, '===', response.data.actionByUserId)
          return
        }
        console.log('✅ Different user - showing notification. Current:', currentUserId, 'Action by:', response.data.actionByUserId)
        
        // Add to state only if not already present (prevent duplicates)
        setNotifications(prev => {
          const exists = prev.some(n => n.id === notification.id)
          if (exists) {
            console.warn('Duplicate notification prevented:', notification.id)
            return prev
          }
          return [notification, ...prev].slice(0, 10)
        })
      } catch (error) {
        console.error('Failed to save notification to MongoDB:', error)
        // Still show notification even if save fails
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
          timestamp: event.timestamp,
          isRead: false
        }
        // Add to state only if not already present (prevent duplicates)
        setNotifications(prev => {
          const exists = prev.some(n => n.id === notification.id || (n.message === notification.message && n.containerName === notification.containerName))
          if (exists) {
            console.warn('Duplicate notification prevented (fallback)', notification.id)
            return prev
          }
          return [notification, ...prev].slice(0, 10)
        })
      }
      
      // Call custom callback if provided
      if (onDockerEvent) {
        onDockerEvent(event)
      }
    })

    // Listen for Docker alerts (CPU/Memory warnings)
    socketRef.current.on('dockerAlert', async (alert) => {
      // console.log('⚠️ Docker alert received:', alert)
      
      // Save to MongoDB first
      try {
        const response = await notificationService.createNotification({
          message: alert.message,
          type: alert.type || 'warning',
          containerId: alert.containerId,
          containerName: alert.containerName,
          category: alert.category
        })
        
        // Use MongoDB response to create notification
        const notification = {
          id: response.data._id,
          type: alert.type,
          category: alert.category,
          message: alert.message,
          recommendation: alert.recommendation,
          value: alert.value,
          threshold: alert.threshold,
          containerId: alert.containerId,
          containerName: alert.containerName,
          timestamp: alert.timestamp || response.data.createdAt,
          isRead: false,
          actionBy: response.data.actionBy,
          actionByUserId: response.data.actionByUserId
        }
        
        // Alerts are system-generated, so show to everyone (no userId filtering needed)
        
        // Add to state only if not already present (prevent duplicates)
        setNotifications(prev => {
          const exists = prev.some(n => n.id === notification.id)
          if (exists) {
            console.warn('Duplicate alert prevented:', notification.id)
            return prev
          }
          return [notification, ...prev].slice(0, 10)
        })
      } catch (error) {
        console.error('Failed to save alert notification to MongoDB:', error)
        // Still show notification even if save fails
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
          timestamp: alert.timestamp,
          isRead: false
        }
        // Add to state only if not already present (prevent duplicates)
        setNotifications(prev => {
          const exists = prev.some(n => n.id === notification.id || (n.message === notification.message && n.containerName === notification.containerName))
          if (exists) {
            console.warn('Duplicate alert prevented (fallback)', notification.id)
            return prev
          }
          return [notification, ...prev].slice(0, 10)
        })
      }
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

  // Remove notification and mark as read in MongoDB
  const removeNotification = async (id) => {
    try {
      // Mark as read in MongoDB
      console.log('Marking notification as read:', id)
      await notificationService.markAsRead(id)
      console.log('Successfully marked as read')
    } catch (error) {
      console.error('Failed to mark notification as read in MongoDB:', error)
    }
    // Remove from local state
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  // Clear all notifications and mark all as read in MongoDB
  const clearNotifications = async () => {
    try {
      // Mark all as read in MongoDB
      console.log('Marking all notifications as read')
      await notificationService.markAllAsRead()
      console.log('Successfully marked all as read')
    } catch (error) {
      console.error('Failed to mark all notifications as read in MongoDB:', error)
    }
    // Clear local state
    setNotifications([])
  }
  
  // Track user's own action to filter out self-notification
  const trackUserAction = (action, containerName) => {
    const key = `${action}:${containerName}`
    recentActionsRef.current.add(key)
    console.log('Tracking user action:', key)
    // Remove after 60 seconds to catch all duplicate events
    setTimeout(() => {
      recentActionsRef.current.delete(key)
      console.log('Removed tracked action:', key)
    }, 60000) // Changed from 5000 to 60000 (1 minute)
  }
  
  // Check if notification is from user's own action
  const isOwnAction = (action, containerName) => {
    const key = `${action}:${containerName}`
    return recentActionsRef.current.has(key)
  }

  return {
    socket: socketRef.current,
    connected,
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    trackUserAction // Export to track user actions from Docker page
  }
}

export default useWebSocket
