import { usePermissions } from '../contexts/PermissionContext'
import NoPermission from './NoPermission'
import Skeleton from './Skeleton'

/**
 * ProtectedPage component - Wraps entire pages with permission checks
 * Shows loading state while checking permissions
 * Shows NoPermission component if user lacks access
 * 
 * @param {string} permission - Required permission to view the page
 * @param {ReactNode} children - Page content
 * @param {string} message - Custom no permission message
 */
const ProtectedPage = ({ permission, children, message }) => {
  const { hasPermission, loading } = usePermissions()

  // While loading, show skeleton
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton variant="title" className="w-64 mb-2" />
          <Skeleton variant="text" className="w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="card" />
          ))}
        </div>
      </div>
    )
  }

  // Check permission - if hasPermission returns false, show no permission page
  // Note: hasPermission defaults to true if permissions haven't loaded
  const allowed = hasPermission(permission)
  
  if (!allowed) {
    return <NoPermission message={message} />
  }

  return children
}

export default ProtectedPage
