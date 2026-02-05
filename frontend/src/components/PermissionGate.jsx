import { usePermissions } from '../contexts/PermissionContext'

/**
 * PermissionGate component - Conditionally render children based on permissions
 * 
 * @param {string} permission - Single permission key to check (e.g., 'dockerMonitor.canCreateContainer')
 * @param {array} permissions - Array of permission keys (checks if user has ANY)
 * @param {array} requireAll - Array of permission keys (checks if user has ALL)
 * @param {ReactNode} children - Content to render if permission check passes
 * @param {ReactNode} fallback - Content to render if permission check fails (optional)
 */
const PermissionGate = ({ 
  permission, 
  permissions, 
  requireAll, 
  children, 
  fallback = null 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions()

  if (loading) {
    return null // Or return a loading skeleton
  }

  let hasAccess = false

  if (permission) {
    hasAccess = hasPermission(permission)
  } else if (permissions && Array.isArray(permissions)) {
    hasAccess = hasAnyPermission(permissions)
  } else if (requireAll && Array.isArray(requireAll)) {
    hasAccess = hasAllPermissions(requireAll)
  }

  return hasAccess ? children : fallback
}

export default PermissionGate
