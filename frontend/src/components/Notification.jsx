import { useEffect, useState } from 'react'
import { AlertCircle, AlertTriangle, X, Bell } from 'lucide-react'

export default function Notification({ notification, onClose, autoClose = true, duration = 10000 }) {
  const [isVisible, setIsVisible] = useState(true)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (!autoClose) return

    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)

      if (remaining === 0) {
        handleClose()
      }
    }, 50)

    return () => clearInterval(interval)
  }, [autoClose, duration])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose && onClose(), 300)
  }

  const getStyles = () => {
    switch (notification.type) {
      case 'critical':
        return {
          container: 'bg-red-50 dark:bg-red-900/20 border-red-500',
          icon: 'text-red-600 dark:text-red-400',
          text: 'text-red-900 dark:text-red-100',
          progress: 'bg-red-500',
          Icon: AlertCircle,
        }
      case 'warning':
        return {
          container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500',
          icon: 'text-yellow-600 dark:text-yellow-400',
          text: 'text-yellow-900 dark:text-yellow-100',
          progress: 'bg-yellow-500',
          Icon: AlertTriangle,
        }
      default:
        return {
          container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-500',
          icon: 'text-blue-600 dark:text-blue-400',
          text: 'text-blue-900 dark:text-blue-100',
          progress: 'bg-blue-500',
          Icon: Bell,
        }
    }
  }

  const styles = getStyles()
  const IconComponent = styles.Icon

  return (
    <div
      className={`${
        isVisible ? 'animate-slide-in-right' : 'animate-slide-out-right'
      } mb-4 border-l-4 ${styles.container} rounded-lg shadow-lg overflow-hidden transition-all duration-300`}
      role="alert"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <IconComponent className={`w-5 h-5 mt-0.5 flex-shrink-0 ${styles.icon}`} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${styles.text}`}>
              {notification.message}
            </p>
            {notification.recommendation && (
              <p className={`text-xs mt-1 ${styles.text} opacity-90`}>
                💡 {notification.recommendation}
              </p>
            )}
            {notification.value !== undefined && (
              <div className="mt-2 text-xs opacity-75">
                <span className={styles.text}>
                  Current: {notification.value.toFixed(2)}% | Threshold: {notification.threshold}%
                </span>
              </div>
            )}
          </div>
          <button
            onClick={handleClose}
            className={`flex-shrink-0 p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${styles.icon}`}
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      {autoClose && (
        <div className="h-1 bg-gray-200 dark:bg-gray-700">
          <div
            className={`h-full ${styles.progress} transition-all duration-50 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}
