import { Filter, CheckCircle, AlertCircle, AlertTriangle, Info, Skull } from 'lucide-react'

const NotificationFilters = ({ selectedType, selectedStatus, onTypeChange, onStatusChange }) => {
  const types = [
    { value: 'all', label: 'All Types', icon: Filter },
    { value: 'info', label: 'Info', icon: Info },
    { value: 'success', label: 'Success', icon: CheckCircle },
    { value: 'warning', label: 'Warning', icon: AlertTriangle },
    { value: 'error', label: 'Error', icon: AlertCircle },
    { value: 'critical', label: 'Critical', icon: Skull }
  ]

  const statuses = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: 'Unread' },
    { value: 'read', label: 'Read' }
  ]

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Type Filter */}
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Type
        </label>
        <div className="flex flex-wrap gap-2">
          {types.map((type) => {
            const Icon = type.icon
            const isSelected = selectedType === type.value
            return (
              <button
                key={type.value}
                onClick={() => onTypeChange(type.value)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {type.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Status Filter */}
      <div className="w-full sm:w-48">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Status
        </label>
        <select
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          {statuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default NotificationFilters
