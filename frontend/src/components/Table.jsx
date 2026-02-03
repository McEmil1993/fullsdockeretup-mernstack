import { Edit2, CheckCircle, XCircle, RotateCcw } from 'lucide-react'
import { useState } from 'react'

const Table = ({ 
  data, 
  columns, 
  onEdit, 
  onStatusChange,
  onResetPassword,
  showActions = true 
}) => {
  const [hoveredRow, setHoveredRow] = useState(null)

  const handleStatusChange = (item, newStatus) => {
    if (onStatusChange) {
      onStatusChange(item, newStatus)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  style={col.width ? { width: col.width } : {}}
                >
                  {col.label}
                </th>
              ))}
              {showActions && (
                <th className="px-3 md:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((item, index) => (
              <tr
                key={item.id || index}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onMouseEnter={() => setHoveredRow(index)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                    style={col.width ? { width: col.width } : {}}
                  >
                    {/* Render function supports index for count column */}
                    {col.render ? col.render(item[col.key], item, index) : item[col.key]}
                  </td>
                ))}

                {showActions && (
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(item)}
                          className="p-1.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </button>
                      )}

                      {onStatusChange && (
                        <button
                          onClick={() => {
                            const newStatus = item.status === 'active' ? 'inactive' : 'active'
                            handleStatusChange(item, newStatus)
                          }}
                          className={`p-1.5 rounded transition-colors ${
                            item.status === 'active'
                              ? 'hover:bg-red-100 dark:hover:bg-red-900'
                              : 'hover:bg-green-100 dark:hover:bg-green-900'
                          }`}
                          title={item.status === 'active' ? 'Set Inactive' : 'Set Active'}
                        >
                          {item.status === 'active' ? (
                            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                          )}
                        </button>
                      )}

                      {onResetPassword && (
                        <button
                          onClick={() => onResetPassword(item)}
                          className="p-1.5 rounded hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors"
                          title="Reset Password"
                        >
                          <RotateCcw className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No data available
        </div>
      )}
    </div>
  )
}

export default Table
