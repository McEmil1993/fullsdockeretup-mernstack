import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

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
      <code className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600 dark:text-pink-400">
        {children}
      </code>
    )
  }

  // Extract language from className (format: "language-javascript")
  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1] : 'text'

  return (
    <div className="relative group my-4 w-full min-w-0">
      <div className="flex items-center justify-between bg-[#1e1e1e] px-4 py-2 rounded-t-lg border-b border-gray-700">
        <span className="text-xs text-gray-400 uppercase font-mono font-semibold">{language}</span>
        <button
          onClick={handleCopy}
          className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          title="Copy code"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-gray-300" />
          )}
        </button>
      </div>
      <div className="w-full overflow-x-auto" style={{ maxWidth: '100%' }}>
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            borderRadius: '0 0 0.5rem 0.5rem',
            fontSize: '0.875rem',
            padding: '1rem',
            width: '100%',
            maxWidth: '100%',
            whiteSpace: 'pre',
            overflowWrap: 'normal',
            wordBreak: 'normal',
          }}
          PreTag="div"
          wrapLongLines={false}
          showLineNumbers={false}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}

export default CodeBlock
