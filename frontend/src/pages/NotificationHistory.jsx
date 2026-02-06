import { useState, useEffect } from 'react'
import { Bell, Trash2, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react'
import NotificationCard from '../components/notifications/NotificationCard'
import NotificationFilters from '../components/notifications/NotificationFilters'
import NotificationStats from '../components/notifications/NotificationStats'
import Button from '../components/Button'
import Toast from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import Pagination from '../components/Pagination'
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification, 
  deleteAllNotifications,
  deleteOldReadNotifications 
} from '../services/notifications'

const NotificationHistory = () => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [total, setTotal] = useState(0)
  const [selectedType, setSelectedType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' })
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null })

  // Load notifications
  useEffect(() => {
    loadNotifications()
  }, [currentPage, selectedStatus])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const skip = (currentPage - 1) * itemsPerPage
      const options = {
        limit: itemsPerPage,
        skip,
        unreadOnly: selectedStatus === 'unread'
      }

      const response = await getNotifications(options)
      setNotifications(response.data)
      setUnreadCount(response.unreadCount)
      setTotal(response.pagination.total)
    } catch (error) {
      console.error('Error loading notifications:', error)
      showToast('Failed to load notifications', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Filter notifications by type
  const filteredNotifications = selectedType === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === selectedType)

  // Filter by read status (client-side for 'read' filter)
  const displayNotifications = selectedStatus === 'read'
    ? filteredNotifications.filter(n => n.isRead)
    : filteredNotifications

  const readCount = total - unreadCount

  const showToast = (message, type = 'success') => {
    setToast({ isOpen: true, message, type })
  }

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id)
      await loadNotifications()
      showToast('Notification marked as read')
    } catch (error) {
      console.error('Error marking as read:', error)
      showToast('Failed to mark notification as read', 'error')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      await loadNotifications()
      showToast('All notifications marked as read')
    } catch (error) {
      console.error('Error marking all as read:', error)
      showToast('Failed to mark all as read', 'error')
    }
  }

  const handleDelete = async (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Notification',
      message: 'Are you sure you want to delete this notification?',
      onConfirm: async () => {
        try {
          await deleteNotification(id)
          await loadNotifications()
          showToast('Notification deleted')
          setConfirmDialog({ ...confirmDialog, isOpen: false })
        } catch (error) {
          console.error('Error deleting notification:', error)
          showToast('Failed to delete notification', 'error')
        }
      }
    })
  }

  const handleDeleteAll = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete All Notifications',
      message: 'Are you sure you want to delete all notifications? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteAllNotifications()
          await loadNotifications()
          showToast('All notifications deleted')
          setConfirmDialog({ ...confirmDialog, isOpen: false })
        } catch (error) {
          console.error('Error deleting all notifications:', error)
          showToast('Failed to delete all notifications', 'error')
        }
      }
    })
  }

  const handleDeleteOld = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Old Notifications',
      message: 'Delete all read notifications older than 7 days?',
      onConfirm: async () => {
        try {
          const response = await deleteOldReadNotifications(7)
          await loadNotifications()
          showToast(response.message || 'Old notifications deleted')
          setConfirmDialog({ ...confirmDialog, isOpen: false })
        } catch (error) {
          console.error('Error deleting old notifications:', error)
          showToast('Failed to delete old notifications', 'error')
        }
      }
    })
  }

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id)
    }
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Bell className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Notification History
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          View and manage all your notifications
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6">
        <NotificationStats total={total} unread={unreadCount} read={readCount} />
      </div>

      {/* Filters and Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 dark:border-gray-700 mb-6">
        <div className="space-y-4">
          {/* Filters */}
          <NotificationFilters
            selectedType={selectedType}
            selectedStatus={selectedStatus}
            onTypeChange={setSelectedType}
            onStatusChange={(status) => {
              setSelectedStatus(status)
              setCurrentPage(1)
            }}
          />

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={loadNotifications}
              variant="secondary"
              size="sm"
              disabled={loading}
            >
              {/* <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> */}
              Refresh
            </Button>
            
            {unreadCount > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                variant="primary"
                size="sm"
              >
                {/* <CheckCircle className="w-4 h-4 mr-2" /> */}
                Mark All as Read ({unreadCount})
              </Button>
            )}

            <Button
              onClick={handleDeleteOld}
              variant="warning"
              size="sm"
            >
              {/* <Trash2 className="w-4 h-4 mr-2" /> */}
              Delete Old (7+ days)
            </Button>

            {total > 0 && (
              <Button
                onClick={handleDeleteAll}
                variant="danger"
                size="sm"
              >
                {/* <Trash2 className="w-4 h-4 mr-2" /> */}
                Delete All
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : displayNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
            <Bell className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No notifications</p>
            <p className="text-sm">
              {selectedType !== 'all' || selectedStatus !== 'all' 
                ? 'Try changing the filters' 
                : 'You\'re all caught up!'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayNotifications.map((notification) => (
              <NotificationCard
                key={notification._id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
                onClick={() => handleNotificationClick(notification)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && displayNotifications.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(total / itemsPerPage)}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      {/* Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        isOpen={toast.isOpen}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  )
}

export default NotificationHistory
