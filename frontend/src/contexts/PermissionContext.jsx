import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import * as roleService from '../services/roles'

const PermissionContext = createContext()

// Default super admin permissions (fallback)
const getDefaultSuperAdminPermissions = () => ({
  dashboard: {
    canView: true,
    canViewWidgets: ['activeUsers', 'totalServers', 'containerStatus', 'systemHealth', 'recentActivity'],
    systemStatus: true,
    realtimeMetrics: true,
  },
  dockerMonitor: {
    canView: true,
    canCreateContainer: true,
    containers: {
      canView: true,
      canStop: true,
      canRestart: true,
      canViewDetails: true,
      canViewActionHistory: true,
      canViewLogs: true,
      canRecreate: true,
      canOpenTerminal: true,
      canDelete: true,
      canLongPressSelect: true,
    },
    images: {
      canView: true,
      canPrune: true,
    },
  },
  serversManagement: {
    canView: true,
    canAddNewServer: true,
    servers: {
      canView: true,
      canViewDetails: true,
      canEdit: true,
      canDeactivate: true,
    },
  },
  fileUpload: {
    canView: true,
    canUpload: true,
    canDelete: true,
    canDownload: true,
    canShare: true,
  },
  userManagement: {
    canView: true,
    canAddNewUser: true,
    users: {
      canView: true,
      canEdit: true,
      canSetInactive: true,
      canSetActive: true,
      canResetPassword: true,
    },
  },
  documents: {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
  },
  settings: {
    canView: true,
    canEdit: true,
  },
  aiChat: {
    canView: true,
    canUse: true,
    allowedModels: [],
  },
  notifications: {
    canReceiveNotif: true,
  },
})

export const usePermissions = () => {
  const context = useContext(PermissionContext)
  if (!context) {
    throw new Error('usePermissions must be used within PermissionProvider')
  }
  return context
}

export const PermissionProvider = ({ children }) => {
  const { user } = useAuth()
  const [permissions, setPermissions] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user) {
        setPermissions(null)
        setRole(null)
        setLoading(false)
        // Clear cached permissions on logout
        localStorage.removeItem('userPermissions')
        localStorage.removeItem('userRole')
        return
      }

      try {
        // OPTIMIZATION: Load cached permissions immediately (instant!)
        const cachedPermissions = localStorage.getItem('userPermissions')
        const cachedRole = localStorage.getItem('userRole')
        if (cachedPermissions && cachedRole) {
          try {
            setPermissions(JSON.parse(cachedPermissions))
            setRole(cachedRole)
            setLoading(false) // Stop loading immediately with cached data
          } catch (e) {
            console.error('Error parsing cached permissions:', e)
          }
        }

        // Fetch fresh permissions from API in background
        const response = await roleService.getMyPermissions()
        if (response.success && response.data) {
          const freshPermissions = response.data.permissions
          const freshRole = response.data.role
          
          setPermissions(freshPermissions)
          setRole(freshRole)
          
          // Update cache for next page load
          localStorage.setItem('userPermissions', JSON.stringify(freshPermissions))
          localStorage.setItem('userRole', freshRole)
        } else {
          // If no permissions found, set default full access (supreadmin-like)
          console.warn('No permissions found, defaulting to full access')
          setPermissions(getDefaultSuperAdminPermissions())
          setRole('supreadmin')
        }
      } catch (error) {
        console.warn('Error fetching permissions, defaulting to full access:', error.message)
        // Default to full access if there's an error
        setPermissions(getDefaultSuperAdminPermissions())
        setRole('supreadmin')
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [user])

  // Helper function to check if user has a specific permission
  const hasPermission = (permissionKey) => {
    // If permissions haven't loaded yet, default to true (prevent blocking during load)
    if (!permissions) return true

    const keys = permissionKey.split('.')
    let current = permissions

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key]
      } else {
        return false
      }
    }

    return current === true
  }

  // Helper function to check if user can view a specific widget
  const canViewWidget = (widgetName) => {
    if (!permissions || !permissions.dashboard) return false
    
    const widgets = permissions.dashboard.canViewWidgets
    return Array.isArray(widgets) && widgets.includes(widgetName)
  }

  // Helper function to check if user has any of the permissions
  const hasAnyPermission = (permissionKeys) => {
    return permissionKeys.some(key => hasPermission(key))
  }

  // Helper function to check if user has all permissions
  const hasAllPermissions = (permissionKeys) => {
    return permissionKeys.every(key => hasPermission(key))
  }

  // Helper function to get module access
  const canAccessModule = (module) => {
    return hasPermission(`${module}.canView`)
  }

  // Helper function to get allowed AI models for current user
  const getAllowedModels = () => {
    if (!permissions || !permissions.aiChat) return []
    
    const allowedModels = permissions.aiChat.allowedModels
    // If allowedModels is empty array, return empty (means all models allowed - handled by caller)
    return Array.isArray(allowedModels) ? allowedModels : []
  }

  const value = {
    permissions,
    role,
    loading,
    hasPermission,
    canViewWidget,
    hasAnyPermission,
    hasAllPermissions,
    canAccessModule,
    getAllowedModels,
  }

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  )
}
