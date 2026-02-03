import { Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Link, Code, Image, Quote, Minus, Table } from 'lucide-react'

const MarkdownToolbar = ({ onInsert, className = '' }) => {
  const insertMarkdown = (before, after = '', placeholder = '') => {
    onInsert(before, after, placeholder)
  }

  const buttons = [
    { icon: Bold, label: 'Bold', action: () => insertMarkdown('**', '**', 'bold text') },
    { icon: Italic, label: 'Italic', action: () => insertMarkdown('*', '*', 'italic text') },
    { icon: Heading1, label: 'Heading 1', action: () => insertMarkdown('# ', '', 'Heading 1') },
    { icon: Heading2, label: 'Heading 2', action: () => insertMarkdown('## ', '', 'Heading 2') },
    { icon: Heading3, label: 'Heading 3', action: () => insertMarkdown('### ', '', 'Heading 3') },
    { icon: List, label: 'Bullet List', action: () => insertMarkdown('- ', '', 'List item') },
    { icon: ListOrdered, label: 'Numbered List', action: () => insertMarkdown('1. ', '', 'List item') },
    { icon: Link, label: 'Link', action: () => insertMarkdown('[', '](url)', 'link text') },
    { icon: Image, label: 'Image', action: () => insertMarkdown('![', '](image-url)', 'alt text') },
    { icon: Code, label: 'Code', action: () => insertMarkdown('`', '`', 'code') },
    { icon: Quote, label: 'Quote', action: () => insertMarkdown('> ', '', 'Quote') },
    { icon: Minus, label: 'Divider', action: () => insertMarkdown('\n\n---\n\n', '', '') },
    { icon: Table, label: 'Table', action: () => insertMarkdown('\n| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n\n', '', '') },
  ]

  return (
    <div className={`flex flex-wrap gap-1 p-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      {buttons.map((btn, index) => (
        <button
          key={index}
          onClick={btn.action}
          title={btn.label}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <btn.icon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        </button>
      ))}
    </div>
  )
}

export default MarkdownToolbar
