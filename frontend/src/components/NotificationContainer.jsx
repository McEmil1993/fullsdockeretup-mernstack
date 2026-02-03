import { useState, useEffect } from 'react'
import Notification from './Notification'

export default function NotificationContainer({ notifications, onRemove }) {
  return (
    <div className="fixed top-20 right-4 z-50 w-96 max-w-full space-y-2">
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
