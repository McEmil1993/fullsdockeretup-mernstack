import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import CodeBlock from './CodeBlock'

const MarkdownPreview = ({ content, className = '' }) => {
  return (
    <div className={`prose prose-sm md:prose-base lg:prose-lg dark:prose-invert max-w-none p-4 overflow-auto ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          code: ({ node, inline, className, children, ...props }) => (
            <CodeBlock inline={inline} className={className} {...props}>
              {children}
            </CodeBlock>
          ),
          a: ({ node, children, ...props }) => (
            <a className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props}>
              {children}
            </a>
          ),
          table: ({ node, children, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border border-gray-300 dark:border-gray-700" {...props}>
                {children}
              </table>
            </div>
          ),
          th: ({ node, children, ...props }) => (
            <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 bg-gray-100 dark:bg-gray-800" {...props}>
              {children}
            </th>
          ),
          td: ({ node, children, ...props }) => (
            <td className="border border-gray-300 dark:border-gray-700 px-4 py-2" {...props}>
              {children}
            </td>
          ),
        }}
      >
        {content || '*Preview will appear here...*'}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownPreview
