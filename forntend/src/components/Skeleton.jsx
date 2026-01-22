const Skeleton = ({ variant = 'text', width, height, className = '' }) => {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded'
  
  const variants = {
    text: 'h-4',
    heading: 'h-6',
    title: 'h-8',
    avatar: 'rounded-full',
    button: 'h-10',
    image: 'aspect-square',
    card: 'h-48',
    table: 'h-12',
  }

  const style = {}
  if (width) style.width = width
  if (height) style.height = height

  return (
    <div
      className={`${baseClasses} ${variants[variant]} ${className}`}
      style={style}
    />
  )
}

export default Skeleton
