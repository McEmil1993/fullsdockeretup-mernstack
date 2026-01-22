import Skeleton from './Skeleton'

const SkeletonCard = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <Skeleton variant="text" className="h-4 w-24 mb-2" />
              <Skeleton variant="heading" className="h-6 w-32 mb-2" />
              <Skeleton variant="text" className="h-3 w-20" />
            </div>
            <Skeleton variant="avatar" className="w-12 h-12" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default SkeletonCard
