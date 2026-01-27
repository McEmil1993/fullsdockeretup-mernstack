import { Bell, Search, User, LogOut, Menu, Settings } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'

const TopNav = ({ onMenuClick }) => {
  const { user, logout } = useAuth()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const notificationRef = useRef(null)
  const userMenuRef = useRef(null)

  // Sample notifications
  const notifications = [
    { id: 1, title: 'New user registered', message: 'John Doe has joined the platform', time: '5 minutes ago', read: false },
    { id: 2, title: 'System update', message: 'System maintenance scheduled for tonight', time: '1 hour ago', read: false },
    { id: 3, title: 'Payment received', message: 'Payment of $500 has been received', time: '2 hours ago', read: true },
    { id: 4, title: 'New message', message: 'You have a new message from admin', time: '3 hours ago', read: true },
  ]

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
      console.error('Logout error:', error)
      // Navigate anyway if logout fails
      navigate('/login')
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

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
            className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 lg:w-64"
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
            className={`relative p-2 rounded-lg transition-colors ${
              settings.darkMode || topNavFontColor === '#ffffff'
                ? 'hover:bg-white hover:bg-opacity-20' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            } ${isNotificationOpen ? (settings.darkMode || topNavFontColor === '#ffffff' ? 'bg-white bg-opacity-20' : 'bg-gray-100 dark:bg-gray-700') : ''}`}
            style={{ color: topNavFontColor }}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>

          {/* Notification Dropdown */}
          {isNotificationOpen && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 animate-slideUp">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                          !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                            !notification.read ? 'bg-blue-500' : 'bg-transparent'
                          }`}></div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${
                              !notification.read 
                                ? 'text-gray-900 dark:text-white' 
                                : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                  <button className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium py-2">
                    Mark all as read
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
  )
}

export default TopNav
