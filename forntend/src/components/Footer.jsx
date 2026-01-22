const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 px-4 md:px-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          © 2024 React Dashboard App. All rights reserved.
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Version 1.0.0
        </p>
      </div>
    </footer>
  )
}

export default Footer
