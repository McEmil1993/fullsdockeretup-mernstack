import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

const CodeBlock = ({ children, inline, className }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const code = children?.toString() || ''
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (inline) {
    return (
      <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm">
        {children}
      </code>
    )
  }

  return (
    <div className="relative group my-4">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
        title="Copy code"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4 text-gray-300" />
        )}
      </button>
      <pre className="bg-[#e8e8e8] dark:bg-gray-900 p-4 rounded-lg overflow-x-auto">
       <code className={`text-gray-800 dark:text-gray-300 text-sm font-mono font-bold ${className}`}>
          {children}
        </code>
      </pre>
    </div>
  )
}

export default CodeBlock
