const SkeletonWidget = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Icon skeleton */}
          <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
          {/* Title skeleton */}
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
        </div>
      </div>
      {/* Value skeleton */}
      <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-16 mb-2"></div>
      {/* Trend skeleton */}
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
    </div>
  )
}

export default SkeletonWidget
