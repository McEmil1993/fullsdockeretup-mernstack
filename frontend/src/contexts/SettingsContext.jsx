import { createContext, useContext, useState, useEffect } from 'react'
import * as settingsService from '../services/appSettings'

const SettingsContext = createContext()

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider')
  }
  return context
}

// Default settings
const defaultSettings = {
  darkMode: false,
  fontFamily: 'Poppins',
  fontSize: '12px',
  activeSchoolYear: '2025-2026',
  activeTerm: 'Prelim',
  sideNavColor: '#1e293b',
  topNavColor: '#ffffff',
  sideNavFontColor: '#e2e8f0',
  sideNavHoverColor: '#ffffff',
  sideNavActiveColor: '#ffffff',
  topNavFontColor: '#1f2937',
  loginBackgroundType: 'color',
  loginBackgroundColor: '#d6d6d6',
  loginBackgroundImage: '',
  loginFormBgColor: '#ffffff',
  loginFormBgOpacity: 89,
}

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings)
  const [loading, setLoading] = useState(true)

  // Load settings on mount
  useEffect(() => {
    // Check if we're on login page or public file viewer - don't make API calls
    const isLoginPage = window.location.pathname === '/login'
    const isPublicRoute = window.location.pathname.startsWith('/file/')
    
    if (isLoginPage || isPublicRoute) {
      // Just use defaults and apply them
      setSettings(defaultSettings)
      applySettingsToDocument(defaultSettings)
      setLoading(false)
      return
    }

    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      let currentSettings = defaultSettings

      // Fetch from API (will work if user is logged in)
      try {
        const response = await settingsService.getSettings()
        
        // Handle different response structures
        let settingsData = null
        if (response) {
          if (response.data && response.data.settings) {
            settingsData = response.data.settings
          } else if (response.settings) {
            settingsData = response.settings
          } else if (response.data) {
            settingsData = response.data
          } else if (typeof response === 'object' && !response.error && !response.message) {
            // Response itself might be the settings object
            settingsData = response
          }
        }
        
        if (settingsData) {
          currentSettings = { ...defaultSettings, ...settingsData }
        }
      } catch (error) {
        // API failed (not logged in or error) - use defaults
        // Don't log warning if it's a 401 (expected when not logged in)
        if (error.message && !error.message.includes('401')) {
        }
        currentSettings = defaultSettings
      }

      setSettings(currentSettings)
      applySettingsToDocument(currentSettings)
    } catch (error) {
      setSettings(defaultSettings)
      applySettingsToDocument(defaultSettings)
    } finally {
      setLoading(false)
    }
  }

  const applySettingsToDocument = (settingsToApply) => {
    // Apply dark mode
    if (settingsToApply.darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    
    // Apply font family
    document.documentElement.style.setProperty('--font-family', settingsToApply.fontFamily)
    
    // Apply font size
    document.documentElement.style.fontSize = settingsToApply.fontSize
  }

  const updateSettings = async (newSettings) => {
    // Update local state immediately for real-time UI update
    const updated = { ...settings, ...newSettings }
    setSettings(updated)
    applySettingsToDocument(updated)

    // Sync to API immediately in real-time (will work if user is logged in)
    // Don't await - update happens in background for better UX
    settingsService.updateSettings(newSettings)
      .then(() => {
        // Successfully saved to database
      })
      .catch((error) => {
        // API failed - settings are still updated locally
        // Only log if it's not a 401 (not logged in)
        if (error.message && !error.message.includes('401')) {
        }
      })
  }

  const resetSettings = async () => {
    const reset = { ...defaultSettings }
    setSettings(reset)
    applySettingsToDocument(reset)

    // Reset on API (will work if user is logged in)
    try {
      const data = await settingsService.resetSettings()
      if (data.settings) {
        const serverSettings = { ...defaultSettings, ...data.settings }
        setSettings(serverSettings)
        applySettingsToDocument(serverSettings)
      }
    } catch (error) {
      // API failed - settings are still reset locally
    }
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  )
}
