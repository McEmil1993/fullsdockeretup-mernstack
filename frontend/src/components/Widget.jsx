const Widget = ({ title, value, change, icon: Icon, trend = 'up', color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
  }

  const textColors = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    red: 'text-red-600 dark:text-red-400',
    purple: 'text-purple-600 dark:text-purple-400',
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {value}
          </p>
          <div className="flex items-center gap-1">
            <span
              className={`text-sm font-medium ${
                trend === 'up' ? textColors.green : textColors.red
              }`}
            >
              {trend === 'up' ? '↑' : '↓'} {change}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              vs last month
            </span>
          </div>
        </div>
        <div className={`${colors[color]} p-3 rounded-lg`}>
          {Icon && <Icon className="w-6 h-6 text-white" />}
        </div>
      </div>
    </div>
  )
}

export default Widget
