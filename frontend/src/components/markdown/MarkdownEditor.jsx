import { useRef, useEffect } from 'react'

const MarkdownEditor = ({ value, onChange, placeholder, fontFamily = 'monospace', fontSize = '14' }) => {
  const textareaRef = useRef(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const handleKeyDown = (e) => {
      // Handle Tab key for indentation
      if (e.key === 'Tab') {
        e.preventDefault()
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const newValue = value.substring(0, start) + '  ' + value.substring(end)
        onChange(newValue)
        
        // Move cursor after the tab
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2
        }, 0)
      }
    }

    textarea.addEventListener('keydown', handleKeyDown)
    return () => textarea.removeEventListener('keydown', handleKeyDown)
  }, [value, onChange])

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-full p-4 resize-none focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-0"
      spellCheck="false"
      style={{
        fontFamily: fontFamily,
        fontSize: `${fontSize}px`,
        lineHeight: '1.6'
      }}
    />
  )
}

export default MarkdownEditor
