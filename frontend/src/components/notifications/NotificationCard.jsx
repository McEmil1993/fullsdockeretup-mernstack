import { AlertCircle, AlertTriangle, Info, CheckCircle, Trash2, Eye, EyeOff } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const NotificationCard = ({ notification, onMarkAsRead, onDelete, onClick }) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getNotificationBgColor = (type, isRead) => {
    if (isRead) {
      return 'bg-gray-50 dark:bg-gray-900/50'
    }
    switch (type) {
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20'
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20'
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20'
      case 'info':
      default:
        return 'bg-blue-50 dark:bg-blue-900/20'
    }
  }

  const getBorderColor = (type, isRead) => {
    if (isRead) {
      return 'border-gray-200 dark:border-gray-700'
    }
    switch (type) {
      case 'error':
        return 'border-red-200 dark:border-red-800'
      case 'warning':
        return 'border-yellow-200 dark:border-yellow-800'
      case 'success':
        return 'border-green-200 dark:border-green-800'
      case 'info':
      default:
        return 'border-blue-200 dark:border-blue-800'
    }
  }

  return (
    <div
      className={`p-4 rounded-lg border transition-all hover:shadow-md ${getBorderColor(notification.type, notification.isRead)} ${getNotificationBgColor(notification.type, notification.isRead)}`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div 
          className="flex-1 min-w-0 cursor-pointer" 
          onClick={onClick}
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className={`text-sm ${notification.isRead ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white font-medium'}`}>
              {notification.message}
            </p>
            {!notification.isRead && (
              <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1.5" />
            )}
          </div>

          {/* Container info if available */}
          {notification.containerName && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">
              Container: <span className="font-mono">{notification.containerName}</span>
            </p>
          )}

          {/* Action by user */}
          {notification.actionBy && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">
              By: <span className="font-semibold">{notification.actionBy}</span>
            </p>
          )}

          {/* Timestamp */}
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {!notification.isRead && onMarkAsRead && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onMarkAsRead(notification._id)
              }}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title="Mark as read"
            >
              <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          )}
          {notification.isRead && (
            <div className="p-1.5" title="Read">
              <EyeOff className="w-4 h-4 text-gray-400 dark:text-gray-600" />
            </div>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(notification._id)
              }}
              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationCard
