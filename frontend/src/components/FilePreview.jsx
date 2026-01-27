import { useState, useEffect } from 'react'
import { FileText, AlertCircle } from 'lucide-react'

const FilePreview = ({ file, apiBaseUrl }) => {
  const [previewContent, setPreviewContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Get file extension
  const getFileExtension = (filename) => {
    return filename.split('.').pop().toLowerCase()
  }

  // Check if file can be previewed
  const canPreview = (mimeType, filename) => {
    const ext = getFileExtension(filename)
    
    // Images
    if (mimeType.startsWith('image/')) return true
    
    // Videos
    if (mimeType.startsWith('video/')) return true
    
    // PDF
    if (mimeType === 'application/pdf' || ext === 'pdf') return true
    
    // Text and code files
    const textExtensions = ['txt', 'js', 'jsx', 'ts', 'tsx', 'json', 'xml', 'html', 'css', 'scss', 'sass', 'md', 'py', 'java', 'cpp', 'c', 'h', 'php', 'rb', 'go', 'rs', 'sql', 'sh', 'yaml', 'yml', 'env', 'log']
    if (mimeType.startsWith('text/') || textExtensions.includes(ext)) return true
    
    // CSV
    if (mimeType === 'text/csv' || ext === 'csv') return true
    
    return false
  }

  // Get file URL
  const getFileUrl = () => {
    // Construct the file URL from the backend
    const baseUrl = apiBaseUrl || 'https://back.markemilcajesdacoylo.online'
    return `${baseUrl}/api/uploads/${file.fileName}`
  }

  // Fetch text content
  const fetchTextContent = async () => {
    try {
      const response = await fetch(getFileUrl())
      const text = await response.text()
      setPreviewContent(text)
      setLoading(false)
    } catch (err) {
      setError('Failed to load file content')
      setLoading(false)
    }
  }

  useEffect(() => {
    const ext = getFileExtension(file.originalName)
    
    if (!canPreview(file.mimeType, file.originalName)) {
      setLoading(false)
      return
    }

    // Load text/code files
    const textExtensions = ['txt', 'js', 'jsx', 'ts', 'tsx', 'json', 'xml', 'html', 'css', 'scss', 'sass', 'md', 'py', 'java', 'cpp', 'c', 'h', 'php', 'rb', 'go', 'rs', 'sql', 'sh', 'yaml', 'yml', 'env', 'log', 'csv']
    if (file.mimeType.startsWith('text/') || textExtensions.includes(ext)) {
      fetchTextContent()
    } else {
      setLoading(false)
    }
  }, [file])

  // Render preview based on file type
  const renderPreview = () => {
    const ext = getFileExtension(file.originalName)
    const fileUrl = getFileUrl()

    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading preview...</span>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex items-center justify-center py-12 text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )
    }

    if (!canPreview(file.mimeType, file.originalName)) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
          <FileText className="w-12 h-12 mb-4" />
          <p className="text-lg font-medium">Preview not available for this file type</p>
          <p className="text-sm mt-2">File type: {file.fileType}</p>
          <p className="text-xs mt-1 text-gray-400">Supported: PDF, Images, Videos, Text/Code files</p>
        </div>
      )
    }

    // Image preview
    if (file.mimeType.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-900 rounded-lg p-4 min-h-[400px]">
          <img 
            src={fileUrl} 
            alt={file.originalName}
            className="max-w-full max-h-[600px] object-contain rounded"
            onError={(e) => {
              e.target.style.display = 'none'
              setError('Failed to load image')
            }}
          />
        </div>
      )
    }

    // Video preview
    if (file.mimeType.startsWith('video/')) {
      return (
        <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-900 rounded-lg p-4">
          <video 
            controls 
            className="max-w-full max-h-[600px] rounded"
            onError={() => setError('Failed to load video')}
          >
            <source src={fileUrl} type={file.mimeType} />
            Your browser does not support the video tag.
          </video>
        </div>
      )
    }

    // PDF preview
    if (file.mimeType === 'application/pdf' || ext === 'pdf') {
      return (
        <div className="bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
          <iframe
            src={`${fileUrl}#view=FitH`}
            className="w-full h-[600px] border-0"
            title="PDF Preview"
            onError={() => setError('Failed to load PDF')}
          />
        </div>
      )
    }

    // Text/Code preview with syntax highlighting
    const textExtensions = ['txt', 'js', 'jsx', 'ts', 'tsx', 'json', 'xml', 'html', 'css', 'scss', 'sass', 'md', 'py', 'java', 'cpp', 'c', 'h', 'php', 'rb', 'go', 'rs', 'sql', 'sh', 'yaml', 'yml', 'env', 'log', 'csv']
    if (file.mimeType.startsWith('text/') || textExtensions.includes(ext)) {
      // Get language for syntax highlighting class
      const getLanguageClass = () => {
        const langMap = {
          'js': 'language-javascript',
          'jsx': 'language-jsx',
          'ts': 'language-typescript',
          'tsx': 'language-tsx',
          'json': 'language-json',
          'xml': 'language-xml',
          'html': 'language-html',
          'css': 'language-css',
          'scss': 'language-scss',
          'py': 'language-python',
          'java': 'language-java',
          'cpp': 'language-cpp',
          'c': 'language-c',
          'php': 'language-php',
          'rb': 'language-ruby',
          'go': 'language-go',
          'rs': 'language-rust',
          'sql': 'language-sql',
          'sh': 'language-bash',
          'yaml': 'language-yaml',
          'yml': 'language-yaml',
          'md': 'language-markdown',
        }
        return langMap[ext] || 'language-text'
      }

      return (
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
            <span className="text-sm text-gray-300 font-mono">{file.originalName}</span>
            <span className="text-xs text-gray-400 uppercase">{ext}</span>
          </div>
          <pre className="p-4 overflow-auto max-h-[600px] text-sm">
            <code className={`${getLanguageClass()} text-gray-100 font-mono`}>
              {previewContent}
            </code>
          </pre>
        </div>
      )
    }

    return null
  }

  return (
    <div className="space-y-4">
      {renderPreview()}
    </div>
  )
}

export default FilePreview
