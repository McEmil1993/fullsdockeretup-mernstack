import { Send, Loader } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

const ChatInput = ({ onSend, disabled, placeholder = 'Type your message...' }) => {
  const [input, setInput] = useState('')
  const textareaRef = useRef(null)

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      // Reset to minimum height first
      textarea.style.height = '48px'
      
      // If input is empty, stay at minimum
      if (!input) {
        textarea.style.height = '48px'
        return
      }
      
      // Calculate new height (max 300px / ~10 lines)
      const newHeight = Math.min(textarea.scrollHeight, 300)
      textarea.style.height = `${newHeight}px`
    }
  }, [input])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim() && !disabled) {
      onSend(input.trim())
      setInput('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleChange = (e) => {
    setInput(e.target.value)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex items-end">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows="1"
          className="w-full px-4 py-3 pr-24 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none overflow-y-auto transition-all duration-100"
          style={{ minHeight: '48px', maxHeight: '300px' }}
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="absolute right-2 bottom-2 
                    w-12 h-12 
                    bg-gray-800 text-white 
                    rounded-full 
                    hover:bg-gray-700 
                    disabled:bg-gray-600 disabled:cursor-not-allowed 
                    transition-colors 
                    flex items-center justify-center"
        >
          {disabled ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </form>
  )
}

export default ChatInput
