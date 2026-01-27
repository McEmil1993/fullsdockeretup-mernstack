import Skeleton from './Skeleton'

const SkeletonChart = ({ count = 2 }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
        >
          <Skeleton variant="heading" className="h-6 w-48 mb-4" />
          <Skeleton variant="card" className="h-64 w-full" />
        </div>
      ))}
    </div>
  )
}

export default SkeletonChart
