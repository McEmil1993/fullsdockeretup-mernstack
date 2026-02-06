import { Bell, CheckCircle, Clock, Trash2 } from 'lucide-react'

const NotificationStats = ({ total, unread, read }) => {
  const stats = [
    { label: 'Total', value: total, icon: Bell, color: 'blue' },
    { label: 'Unread', value: unread, icon: Clock, color: 'yellow' },
    { label: 'Read', value: read, icon: CheckCircle, color: 'green' }
  ]

  const getColorClasses = (color) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
      case 'yellow':
        return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
      case 'green':
        return 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${getColorClasses(stat.color)}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default NotificationStats
