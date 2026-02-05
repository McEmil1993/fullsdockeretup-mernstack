import { useState, useEffect } from 'react'
import Notification from './Notification'

export default function NotificationContainer({ notifications, onRemove }) {
  return (
    <div className="fixed top-20 right-2 sm:right-4 z-50 w-full sm:w-96 max-w-[calc(100vw-1rem)] sm:max-w-full space-y-2 px-2 sm:px-0">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          notification={notification}
          onClose={() => onRemove(notification.id)}
          autoClose={notification.type !== 'critical'}
          duration={notification.type === 'warning' ? 15000 : 10000}
        />
      ))}
    </div>
  )
}
