const MarkdownEditor = ({ value, onChange, placeholder = 'Start writing your markdown...', className = '' }) => {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full h-full p-4 font-mono text-sm border-none focus:outline-none resize-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${className}`}
      spellCheck="false"
    />
  )
}

export default MarkdownEditor
