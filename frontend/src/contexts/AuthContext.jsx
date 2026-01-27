import { createContext, useContext, useState, useEffect } from 'react'
import * as authService from '../services/auth'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = async () => {
    try {
      const response = await authService.getCurrentUser()
      
      // Handle different response structures (same as login)
      let userData = null
      
      if (response) {
        // Try different possible structures
        if (response.data && response.data.user && typeof response.data.user === 'object') {
          // Structure: { data: { user: {...} } }
          userData = response.data.user
        } else if (response.user && typeof response.user === 'object') {
          // Structure: { user: {...} }
          userData = response.user
        } else if (response.id || response._id || response.email || response.name) {
          // Response itself is the user object
          userData = response
        }
      }
      
      // Check if we have valid user data
      if (userData && typeof userData === 'object' && !Array.isArray(userData)) {
        const hasUserFields = userData.id || userData._id || userData.email || userData.name || userData.userId
        
        if (hasUserFields) {
          // Valid user found - maintain session
          setUser(userData)
          return
        }
      }
      
      // No valid user data found
      setUser(null)
    } catch (error) {
      // Check error message for 401 or session expired
      const isUnauthorized = error.message && (
        error.message.includes('401') || 
        error.message.includes('Unauthorized') ||
        error.message.includes('Session expired')
      )
      
      if (isUnauthorized) {
        // Session expired or not logged in - clear user
        setUser(null)
      } else {
        // Network error or other issues - don't auto-logout on network errors
        // Keep existing user state if it exists (might be temporary network issue)
        // Only clear if this is initial load (we'll know because user is null initially)
        console.warn('Auth check failed (non-auth error):', error.message)
        // Don't change user state on network errors - keeps user logged in
        // Only set to null if it's the first check and no user exists
        // This is handled by React state persistence, so we can just not call setUser
      }
    } finally {
      setLoading(false)
    }
  }

  // Check if user is logged in on mount and on route changes
  useEffect(() => {
    // Always check auth on mount to maintain session (even on login page)
    // This ensures user stays logged in after page refresh
    checkAuth()
    
    // Listen for logout events (from API service when refresh fails)
    // This only fires when refresh token is truly expired/invalid
    const handleLogout = () => {
      setUser(null)
    }
    window.addEventListener('auth:logout', handleLogout)
    
    return () => {
      window.removeEventListener('auth:logout', handleLogout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password)
      
      // Debug: Log the actual response to see what we're getting
      console.log('=== LOGIN RESPONSE DEBUG ===')
      console.log('Full response:', response)
      console.log('Response type:', typeof response)
      console.log('Response keys:', response ? Object.keys(response) : 'null')
      console.log('===========================')
      
      // Handle different response structures
      // Backend returns: { success: true, message: '...', data: { user: {...} } }
      let userData = null
      
      if (response) {
        // Try different possible structures
        if (response.data && response.data.user && typeof response.data.user === 'object') {
          // Structure: { data: { user: {...} } }
          userData = response.data.user
          console.log('Found user in response.data.user:', userData)
        } else if (response.user && typeof response.user === 'object') {
          // Structure: { user: {...} }
          userData = response.user
          console.log('Found user in response.user:', userData)
        } else if (response.id || response._id || response.email || response.name) {
          // Response itself is the user object
          userData = response
          console.log('Response is user object:', userData)
        } else {
          console.warn('Unknown response structure:', response)
        }
      }
      
      // Check if we have valid user data
      if (userData && typeof userData === 'object' && !Array.isArray(userData)) {
        // Check for common user fields
        const hasUserFields = userData.id || userData._id || userData.email || userData.name || userData.userId
        
        if (hasUserFields) {
          // Valid user object found
          console.log('✅ Valid user data found, setting user:', userData)
          setUser(userData)
          return { success: true, user: userData }
        } else {
          console.warn('UserData found but missing required fields:', userData)
        }
      }
      
      // If no user data found in response, log for debugging
      console.log('❌ Login failed: No valid user data in response')
      console.log('Full response:', JSON.stringify(response, null, 2))
      return { success: false, error: 'Login failed: Invalid response from server. Please check console for details.' }
    } catch (error) {
      // Log the error for debugging
      console.log('❌ Login error caught:', error)
      console.log('Error message:', error.message)
      console.log('Error stack:', error.stack)
      // Return the error message from the backend
      return { 
        success: false, 
        error: error.message || 'Invalid credentials' 
      }
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      // Even if logout fails, clear local state
      console.error('Logout error:', error)
    } finally {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}
