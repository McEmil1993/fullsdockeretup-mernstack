import Skeleton from './Skeleton'

const SkeletonImageGrid = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700"
        >
          <Skeleton variant="image" className="w-full" />
          <div className="p-4">
            <Skeleton variant="text" className="h-4 w-3/4 mb-2" />
            <Skeleton variant="text" className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default SkeletonImageGrid
