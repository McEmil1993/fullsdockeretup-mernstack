import { Bell, Search, User, LogOut, Menu, Settings, Container, AlertCircle, AlertTriangle, Info, Volume2, VolumeX } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import { useWebSocket } from '../hooks/useWebSocket'
import Toast from './Toast'
import * as preferenceService from '../services/preferences'

const TopNav = ({ onMenuClick }) => {
  const { user, logout } = useAuth()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(false)
  const [toastNotification, setToastNotification] = useState(null)
  const notificationRef = useRef(null)
  const userMenuRef = useRef(null)
  const audioRef = useRef(null)
  const previousNotificationsCount = useRef(0)

  // WebSocket notifications for Docker events
  const { connected, notifications, removeNotification, clearNotifications } = useWebSocket()

  // Request browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        setBrowserNotificationsEnabled(permission === 'granted')
      })
    } else if ('Notification' in window && Notification.permission === 'granted') {
      setBrowserNotificationsEnabled(true)
    }
  }, [])

  // Play sound and show browser notification when new notification arrives
  useEffect(() => {
    if (notifications.length > previousNotificationsCount.current && previousNotificationsCount.current > 0) {
      const latestNotification = notifications[0]
      
      // Play sound for all notifications (critical, warning, and info)
      if (soundEnabled) {
        playNotificationSound(latestNotification.type)
      }

      // Show browser notification
      if (browserNotificationsEnabled && document.hidden) {
        showBrowserNotification(latestNotification)
      }

      // Show toast notification
      showToastNotification(latestNotification)

      // Visual alert - briefly highlight the bell icon
      const bellButton = document.querySelector('[data-notification-bell]')
      if (bellButton) {
        bellButton.classList.add('animate-bounce')
        setTimeout(() => {
          bellButton.classList.remove('animate-bounce')
        }, 1000)
      }
    }
    
    previousNotificationsCount.current = notifications.length
  }, [notifications, soundEnabled, browserNotificationsEnabled])

  // Play notification sound
  const playNotificationSound = (type) => {
    try {
      // Create audio context for different sounds
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Different frequencies for different notification types
      if (type === 'critical') {
        // Critical: Two quick beeps (high pitch)
        oscillator.frequency.value = 800
        gainNode.gain.value = 0.3
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.1)
        
        const oscillator2 = audioContext.createOscillator()
        const gainNode2 = audioContext.createGain()
        oscillator2.connect(gainNode2)
        gainNode2.connect(audioContext.destination)
        oscillator2.frequency.value = 800
        gainNode2.gain.value = 0.3
        oscillator2.start(audioContext.currentTime + 0.15)
        oscillator2.stop(audioContext.currentTime + 0.25)
      } else if (type === 'warning') {
        // Warning: Single medium beep
        oscillator.frequency.value = 600
        gainNode.gain.value = 0.2
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.15)
      } else {
        // Info: Soft single beep
        oscillator.frequency.value = 400
        gainNode.gain.value = 0.1
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.1)
      }
    } catch (error) {
      console.warn('Could not play notification sound:', error)
    }
  }

  // Show browser notification
  const showBrowserNotification = (notification) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return
    }

    const title = notification.type === 'critical' ? '🚨 Critical Alert' : 
                  notification.type === 'warning' ? '⚠️ Warning' : 
                  'ℹ️ Info'
    
    const body = notification.message + 
                 (notification.containerName ? `\n\nContainer: ${notification.containerName}` : '') +
                 (notification.action ? `\nAction: ${notification.action}` : '')

    const browserNotification = new Notification(title, {
      body: body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: notification.id,
      requireInteraction: notification.type === 'critical',
      silent: false
    })

    browserNotification.onclick = () => {
      window.focus()
      navigate('/docker')
      browserNotification.close()
    }

    // Auto close after 5 seconds for non-critical
    if (notification.type !== 'critical') {
      setTimeout(() => {
        browserNotification.close()
      }, 5000)
    }
  }

  // Toggle sound
  const toggleSound = async () => {
    const newValue = !soundEnabled
    setSoundEnabled(newValue)
    // Save to MongoDB only
    try {
      await preferenceService.updatePreference('notificationSoundEnabled', newValue)
    } catch (error) {
      console.error('Failed to save notification sound preference to MongoDB:', error)
    }
  }

  // Load sound preference from MongoDB
  useEffect(() => {
    const loadSoundPreference = async () => {
      try {
        const response = await preferenceService.getPreferences()
        if (response.data && response.data.notificationSoundEnabled !== undefined) {
          setSoundEnabled(response.data.notificationSoundEnabled)
        }
      } catch (error) {
        console.error('Failed to load sound preference from MongoDB:', error)
      }
    }
    loadSoundPreference()
  }, [])

  // Show toast notification
  const showToastNotification = (notification) => {
    // Get emoji and title based on type
    const emoji = notification.type === 'critical' ? '🚨' : 
                  notification.type === 'warning' ? '⚠️' : 
                  '🔔'
    
    const title = notification.type === 'critical' ? 'Critical Alert' : 
                  notification.type === 'warning' ? 'Warning' : 
                  'New Notification'
    
    // Create short, informative message for toast
    let shortMessage = ''
    
    if (notification.containerName) {
      // For Docker container notifications
      const actionText = notification.action ? notification.action.toUpperCase() : 'ALERT'
      shortMessage = `${emoji} ${title}: ${notification.containerName} - ${actionText}`
    } else if (notification.message) {
      // For general notifications
      const truncatedMsg = notification.message.length > 60 
        ? notification.message.substring(0, 60) + '...' 
        : notification.message
      shortMessage = `${emoji} ${title}: ${truncatedMsg}`
    } else {
      shortMessage = `${emoji} ${title}`
    }

    // Map notification type to toast type
    const toastType = notification.type === 'critical' ? 'error' :
                      notification.type === 'warning' ? 'warning' :
                      'info'

    setToastNotification({
      message: shortMessage,
      type: toastType,
      isOpen: true
    })

    // Auto-close toast after duration (critical stays longer)
    const duration = notification.type === 'critical' ? 6000 : 
                     notification.type === 'warning' ? 5000 : 
                     4000
    
    setTimeout(() => {
      setToastNotification(null)
    }, duration)
  }

  // Close toast
  const closeToast = () => {
    setToastNotification(null)
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false)
      }
    }

    if (isNotificationOpen || isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isNotificationOpen, isUserMenuOpen])

  const handleProfile = () => {
    navigate('/profile')
    setIsUserMenuOpen(false)
  }

  const handleSettings = () => {
    navigate('/settings')
    setIsUserMenuOpen(false)
  }

  const handleLogout = async () => {
    setIsUserMenuOpen(false)
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      // Navigate anyway if logout fails
      navigate('/login')
    }
  }

  // Mark notification as read (remove it) and navigate to Docker page
  const handleNotificationClick = (notificationId, notification) => {
    removeNotification(notificationId)
    
    // If it's a Docker-related notification, navigate to Docker page
    if (notification.category === 'container' || notification.category === 'docker') {
      setIsNotificationOpen(false)
      navigate('/docker')
    }
  }

  // Mark all as read
  const handleMarkAllAsRead = () => {
    clearNotifications()
    setIsNotificationOpen(false)
  }

  // Get icon based on notification type
  const getNotificationIcon = (type, category) => {
    if (category === 'container' || category === 'docker') {
      return Container
    }
    
    switch (type) {
      case 'critical':
        return AlertCircle
      case 'warning':
        return AlertTriangle
      default:
        return Info
    }
  }

  // Get color based on notification type
  const getNotificationColor = (type) => {
    switch (type) {
      case 'critical':
        return 'text-red-600 dark:text-red-400'
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400'
      default:
        return 'text-blue-600 dark:text-blue-400'
    }
  }

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now'
    
    const now = new Date()
    const eventTime = new Date(timestamp)
    const diffMs = now - eventTime
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSecs < 60) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  const unreadCount = notifications.length

  // If dark mode is enabled, use dark colors for top nav
  const topNavBgColor = settings.darkMode ? '#1f2937' : settings.topNavColor
  
  // Font color - if dark mode, use white, otherwise use the custom color or calculate from background
  const topNavFontColor = settings.darkMode 
    ? '#ffffff' 
    : (settings.topNavFontColor || (() => {
        const hex = settings.topNavColor.replace('#', '')
        const r = parseInt(hex.substr(0, 2), 16)
        const g = parseInt(hex.substr(2, 2), 16)
        const b = parseInt(hex.substr(4, 2), 16)
        const brightness = (r * 299 + g * 587 + b * 114) / 1000
        return brightness > 128 ? '#1f2937' : '#ffffff'
      })())

  return (
    <>
      {/* Toast Notification */}
      {toastNotification && (
        <Toast
          message={toastNotification.message}
          type={toastNotification.type}
          isOpen={toastNotification.isOpen}
          onClose={closeToast}
          duration={toastNotification.type === 'error' ? 5000 : 4000}
        />
      )}

      <nav 
        className="h-16 px-4 md:px-6 flex items-center justify-between shadow-md transition-colors duration-300"
        style={{ backgroundColor: topNavBgColor, color: topNavFontColor }}
      >
      <div className="flex items-center gap-3 md:gap-4 flex-1">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg transition-colors"
          style={{ color: topNavFontColor }}
          aria-label="Toggle menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Search Bar - Hidden on mobile, visible on tablet+ */}
        {/* <div className="hidden md:block relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-32 sm:w-48 lg:w-64"
          />
        </div> */}
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Search Icon for Mobile */}
        <button 
          className="md:hidden p-2 rounded-lg transition-colors"
          style={{ color: topNavFontColor }}
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Active School Year & Term Display */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border"
          style={{ 
            borderColor: settings.darkMode || topNavFontColor === '#ffffff' 
              ? 'rgba(255, 255, 255, 0.2)' 
              : 'rgba(0, 0, 0, 0.1)',
            backgroundColor: settings.darkMode || topNavFontColor === '#ffffff'
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.05)'
          }}
        >
          <span className="text-sm font-medium" style={{ color: topNavFontColor }}>
            {settings.activeSchoolYear || '2025-2026'}
          </span>
          <span className="text-xs opacity-70" style={{ color: topNavFontColor }}>
            |
          </span>
          <span className="text-sm font-medium" style={{ color: topNavFontColor }}>
            {settings.activeTerm || 'Prelim'}
          </span>
        </div>

        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            data-notification-bell
            className={`relative p-2 rounded-lg transition-colors ${
              settings.darkMode || topNavFontColor === '#ffffff'
                ? 'hover:bg-white hover:bg-opacity-20' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            } ${isNotificationOpen ? (settings.darkMode || topNavFontColor === '#ffffff' ? 'bg-white bg-opacity-20' : 'bg-gray-100 dark:bg-gray-700') : ''}`}
            style={{ color: topNavFontColor }}
            title={`${unreadCount} new notification${unreadCount !== 1 ? 's' : ''}`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </>
            )}
          </button>

          {/* Notification Dropdown */}
          {isNotificationOpen && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 animate-slideUp">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    Notifications
                    {connected && (
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Real-time connected"></span>
                    )}
                  </h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {/* Sound and Browser Notification Controls */}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={toggleSound}
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title={soundEnabled ? 'Disable sound' : 'Enable sound'}
                  >
                    {soundEnabled ? (
                      <>
                        <Volume2 className="w-3 h-3 text-green-600 dark:text-green-400" />
                        <span className="text-gray-700 dark:text-gray-300">Sound On</span>
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-3 h-3 text-gray-500" />
                        <span className="text-gray-500">Sound Off</span>
                      </>
                    )}
                  </button>
                  {browserNotificationsEnabled && (
                    <span className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md">
                      <Bell className="w-3 h-3" />
                      Browser alerts
                    </span>
                  )}
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No notifications</p>
                    {connected && (
                      <p className="text-xs mt-2 text-green-600 dark:text-green-400">
                        🟢 Real-time monitoring active
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {notifications.map((notification) => {
                      const NotificationIcon = getNotificationIcon(notification.type, notification.category)
                      const iconColor = getNotificationColor(notification.type)
                      
                      return (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification.id, notification)}
                          className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer border-l-4 ${
                            notification.type === 'critical' 
                              ? 'bg-red-50 dark:bg-red-900/10 border-red-500 hover:border-red-600' 
                              : notification.type === 'warning' 
                              ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-500 hover:border-yellow-600' 
                              : 'bg-blue-50 dark:bg-blue-900/10 border-blue-500 hover:border-blue-600'
                          }`}
                          title="Click to view details and dismiss"
                        >
                          <div className="flex items-start gap-3">
                            <NotificationIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconColor}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {notification.message}
                              </p>
                              {notification.recommendation && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  💡 {notification.recommendation}
                                </p>
                              )}
                              {notification.containerName && (
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded font-mono text-gray-700 dark:text-gray-300">
                                    {notification.containerName}
                                  </span>
                                  {notification.action && (
                                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                      notification.type === 'critical' ? 'bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200' :
                                      notification.type === 'warning' ? 'bg-yellow-200 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                                      'bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                    }`}>
                                      {notification.action}
                                    </span>
                                  )}
                                </div>
                              )}
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                {formatTime(notification.timestamp)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                  <button 
                    onClick={handleMarkAllAsRead}
                    className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                  >
                    Clear all notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Menu Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className={`p-2 rounded-lg transition-colors ${
              settings.darkMode || topNavFontColor === '#ffffff'
                ? 'hover:bg-white hover:bg-opacity-20' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            } ${isUserMenuOpen ? (settings.darkMode || topNavFontColor === '#ffffff' ? 'bg-white bg-opacity-20' : 'bg-gray-100 dark:bg-gray-700') : ''}`}
            style={{ color: topNavFontColor }}
          >
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0) || 'U'}
            </div>
          </button>

          {/* User Menu Dropdown */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 animate-slideUp">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {user?.email}
                </p>
              </div>
              
              <div className="py-2">
                <button
                  onClick={handleProfile}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </button>
                
                <button
                  onClick={handleSettings}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
    </>
  )
}

export default TopNav
