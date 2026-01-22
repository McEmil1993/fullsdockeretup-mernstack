import { AlertTriangle } from 'lucide-react'
import Button from './Button'

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
}) => {
  if (!isOpen) return null

  const typeStyles = {
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
    danger: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
  }

  const buttonVariants = {
    warning: 'warning',
    danger: 'danger',
    info: 'primary',
  }

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300 animate-fadeIn"
        onClick={onClose}
      ></div>

      {/* Dialog */}
      <div
        className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full border-2 ${typeStyles[type]} animate-slideUp z-10`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 p-2 rounded-full ${typeStyles[type]}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                {title}
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {message}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={onClose}>
              {cancelText}
            </Button>
            <Button variant={buttonVariants[type]} onClick={handleConfirm}>
              {confirmText}
            </Button>
          </div>
        </div>
      </div>

    </div>
  )
}

export default ConfirmDialog
