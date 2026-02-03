import { Search, Filter } from 'lucide-react'

const ServerFilters = ({ searchQuery, setSearchQuery, itemsPerPage, setItemsPerPage, onFilterClick }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search servers, domains, or SSH connections..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Items per page */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
          Show:
        </label>
        <select
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span className="text-sm text-gray-600 dark:text-gray-400">entries</span>
      </div>

      {/* Filter button (optional) */}
      {onFilterClick && (
        <button
          onClick={onFilterClick}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
      )}
    </div>
  )
}

export default ServerFilters
