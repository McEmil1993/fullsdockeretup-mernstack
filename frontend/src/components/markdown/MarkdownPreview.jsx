import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import CodeBlock from './CodeBlock'

const MarkdownPreview = ({ content, className = '' }) => {
  return (
    <div className={`prose prose-lg dark:prose-invert max-w-none p-8 md:p-12 overflow-auto ${className}`}>
      <style>{`
        /* Enhanced spacing and typography */
        .prose {
          font-size: 1.05rem;
          line-height: 1.8;
        }
        
        .prose p {
          margin-top: 1.5rem;
          margin-bottom: 1.5rem;
        }
        
        .prose p:first-child {
          margin-top: 0;
        }
        
        .prose h1 {
          margin-top: 0;
          margin-bottom: 2rem;
          font-size: 2.5rem;
          font-weight: 800;
          padding-bottom: 0.5rem;
          border-bottom: 3px solid #e5e7eb;
        }
        
        .dark .prose h1 {
          border-bottom-color: #374151;
        }
        
        .prose h2 {
          margin-top: 3rem;
          margin-bottom: 1.5rem;
          font-size: 2rem;
          font-weight: 700;
          padding-bottom: 0.4rem;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .dark .prose h2 {
          border-bottom-color: #374151;
        }
        
        .prose h3 {
          margin-top: 2.5rem;
          margin-bottom: 1.25rem;
          font-size: 1.5rem;
          font-weight: 600;
        }
        
        .prose h4, .prose h5, .prose h6 {
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        
        .prose ul, .prose ol {
          margin-top: 1.5rem;
          margin-bottom: 1.5rem;
          padding-left: 2rem;
        }
        
        .prose li {
          margin-top: 0.75rem;
          margin-bottom: 0.75rem;
        }
        
        .prose li > p {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        
        .prose blockquote {
          margin-top: 2rem;
          margin-bottom: 2rem;
          padding: 1.25rem 1.5rem;
          border-left: 4px solid #3b82f6;
          background: linear-gradient(to right, #eff6ff 0%, transparent 100%);
          border-radius: 0 0.375rem 0.375rem 0;
        }
        
        .dark .prose blockquote {
          background: linear-gradient(to right, #1e3a8a 0%, transparent 100%);
          border-left-color: #60a5fa;
        }
        
        .prose pre {
          margin-top: 2rem;
          margin-bottom: 2rem;
        }
        
        .prose hr {
          margin-top: 3rem;
          margin-bottom: 3rem;
          border-top: 2px solid #e5e7eb;
        }
        
        .dark .prose hr {
          border-top-color: #374151;
        }
        
        .prose img {
          margin-top: 2rem;
          margin-bottom: 2rem;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
      `}</style>
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
            <a className="text-blue-600 dark:text-blue-400 hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...props}>
              {children}
            </a>
          ),
          table: ({ node, children, ...props }) => (
            <div className="overflow-x-auto my-6">
              <table className="min-w-full border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm" {...props}>
                {children}
              </table>
            </div>
          ),
          th: ({ node, children, ...props }) => (
            <th className="border border-gray-300 dark:border-gray-700 px-4 py-3 bg-gray-100 dark:bg-gray-800 font-semibold" {...props}>
              {children}
            </th>
          ),
          td: ({ node, children, ...props }) => (
            <td className="border border-gray-300 dark:border-gray-700 px-4 py-3" {...props}>
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
