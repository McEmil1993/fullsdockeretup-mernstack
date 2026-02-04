import { useState, useEffect } from 'react'
import { FileText, AlertCircle, Table as TableIcon, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import VideoPlayer from './VideoPlayer'

const FilePreview = ({ file, apiBaseUrl }) => {
  const [previewContent, setPreviewContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [excelData, setExcelData] = useState(null)

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
    
    // Audio
    if (mimeType.startsWith('audio/')) return true
    
    // PDF
    if (mimeType === 'application/pdf' || ext === 'pdf') return true
    
    // Word documents
    const wordExtensions = ['doc', 'docx']
    if (wordExtensions.includes(ext)) return true
    if (mimeType === 'application/msword' || 
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return true
    
    // PowerPoint documents
    const pptExtensions = ['ppt', 'pptx']
    if (pptExtensions.includes(ext)) return true
    if (mimeType === 'application/vnd.ms-powerpoint' || 
        mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return true
    
    // Excel files
    const excelExtensions = ['xlsx', 'xls', 'csv']
    if (excelExtensions.includes(ext)) return true
    if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        mimeType === 'application/vnd.ms-excel' ||
        mimeType === 'text/csv') return true
    
    // Text and code files
    const textExtensions = ['txt', 'js', 'jsx', 'ts', 'tsx', 'json', 'xml', 'html', 'css', 'scss', 'sass', 'md', 'py', 'java', 'cpp', 'c', 'h', 'php', 'rb', 'go', 'rs', 'sql', 'sh', 'yaml', 'yml', 'env', 'log']
    if (mimeType.startsWith('text/') || textExtensions.includes(ext)) return true
    
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

  // Fetch Excel content
  const fetchExcelContent = async () => {
    try {
      const response = await fetch(getFileUrl())
      const arrayBuffer = await response.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      
      // Get first sheet
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      
      setExcelData({
        sheetNames: workbook.SheetNames,
        currentSheet: firstSheetName,
        data: jsonData,
        workbook: workbook
      })
      setLoading(false)
    } catch (err) {
      setError('Failed to load Excel file')
      setLoading(false)
    }
  }

  useEffect(() => {
    const ext = getFileExtension(file.originalName)
    
    if (!canPreview(file.mimeType, file.originalName)) {
      setLoading(false)
      return
    }

    // Load Excel files
    const excelExtensions = ['xlsx', 'xls']
    if (excelExtensions.includes(ext) || 
        file.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimeType === 'application/vnd.ms-excel') {
      fetchExcelContent()
      return
    }

    // Load text/code files (excluding CSV for now, handle separately)
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
          <p className="text-xs mt-1 text-gray-400">Supported: PDF, Word, PowerPoint, Excel, Images, Videos, Audio, Text/Code files</p>
        </div>
      )
    }

    // Image preview
    if (file.mimeType.startsWith('image/')) {
      return (
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-t-lg border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{file.originalName}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">{ext}</span>
          </div>
          <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-b-lg p-4 min-h-[400px]">
            <img 
              src={fileUrl} 
              alt={file.originalName}
              className="max-w-full max-h-[600px] object-contain rounded shadow-lg"
              onError={(e) => {
                e.target.style.display = 'none'
                setError('Failed to load image')
              }}
            />
          </div>
        </div>
      )
    }

    // Video preview with custom YouTube-style player
    if (file.mimeType.startsWith('video/')) {
      return (
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-t-lg border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{file.originalName}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">{ext}</span>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-b-lg p-4">
            <VideoPlayer 
              src={fileUrl} 
              fileName={file.originalName}
              mimeType={file.mimeType}
            />
          </div>
        </div>
      )
    }

    // Audio preview
    if (file.mimeType.startsWith('audio/')) {
      return (
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-t-lg border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{file.originalName}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">{ext}</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-b-lg p-8 space-y-4">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
            </div>
            <audio 
              controls 
              className="w-full max-w-md"
              onError={() => setError('Failed to load audio')}
            >
              <source src={fileUrl} type={file.mimeType} />
              Your browser does not support the audio tag.
            </audio>
          </div>
        </div>
      )
    }

    // Excel preview
    const excelExtensions = ['xlsx', 'xls']
    if (excelData || excelExtensions.includes(ext)) {
      if (!excelData) return null
      
      return (
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-t-lg border-b border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{file.originalName}</span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">{ext} • {excelData.data.length} rows</span>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-b-lg overflow-auto max-h-[600px]">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                {excelData.data[0] && (
                  <tr>
                    {excelData.data[0].map((header, idx) => (
                      <th
                        key={idx}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 last:border-r-0"
                      >
                        {header || `Column ${idx + 1}`}
                      </th>
                    ))}
                  </tr>
                )}
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {excelData.data.slice(1, 101).map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    {row.map((cell, cellIdx) => (
                      <td
                        key={cellIdx}
                        className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700 last:border-r-0"
                      >
                        {cell !== null && cell !== undefined ? String(cell) : ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {excelData.data.length > 101 && (
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400 text-center border-t border-gray-200 dark:border-gray-700">
                Showing first 100 rows of {excelData.data.length - 1} total rows
              </div>
            )}
          </div>
        </div>
      )
    }

    // CSV preview (as table)
    if (ext === 'csv' && previewContent) {
      const rows = previewContent.split('\n').filter(row => row.trim())
      const headers = rows[0]?.split(',') || []
      const dataRows = rows.slice(1, 101)
      
      return (
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-t-lg border-b border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-2">
              <TableIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{file.originalName}</span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">CSV • {rows.length} rows</span>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-b-lg overflow-auto max-h-[600px]">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr>
                  {headers.map((header, idx) => (
                    <th
                      key={idx}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 last:border-r-0"
                    >
                      {header.trim() || `Column ${idx + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {dataRows.map((row, rowIdx) => {
                  const cells = row.split(',')
                  return (
                    <tr key={rowIdx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      {cells.map((cell, cellIdx) => (
                        <td
                          key={cellIdx}
                          className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700 last:border-r-0"
                        >
                          {cell.trim()}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {rows.length > 101 && (
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400 text-center border-t border-gray-200 dark:border-gray-700">
                Showing first 100 rows of {rows.length} total rows
              </div>
            )}
          </div>
        </div>
      )
    }

    // Word document preview
    const wordExtensions = ['doc', 'docx']
    if (wordExtensions.includes(ext) || 
        file.mimeType === 'application/msword' || 
        file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // Use Microsoft Office Online Viewer
      const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`
      
      return (
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-t-lg border-b border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{file.originalName}</span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Word Document</span>
          </div>
          <div className="bg-gray-100 dark:bg-gray-900 rounded-b-lg overflow-hidden">
            <iframe
              src={viewerUrl}
              className="w-full h-[600px] border-0"
              title="Word Document Preview"
              onError={() => setError('Failed to load document. Try downloading instead.')}
            />
          </div>
          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-gray-600 dark:text-gray-400 text-center">
            Powered by Microsoft Office Online Viewer
          </div>
        </div>
      )
    }

    // PowerPoint preview
    const pptExtensions = ['ppt', 'pptx']
    if (pptExtensions.includes(ext) || 
        file.mimeType === 'application/vnd.ms-powerpoint' || 
        file.mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`
      
      return (
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between px-4 py-2 bg-orange-50 dark:bg-orange-900/20 rounded-t-lg border-b border-orange-200 dark:border-orange-800">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{file.originalName}</span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">PowerPoint</span>
          </div>
          <div className="bg-gray-100 dark:bg-gray-900 rounded-b-lg overflow-hidden">
            <iframe
              src={viewerUrl}
              className="w-full h-[600px] border-0"
              title="PowerPoint Preview"
              onError={() => setError('Failed to load presentation. Try downloading instead.')}
            />
          </div>
          <div className="px-4 py-2 bg-orange-50 dark:bg-orange-900/20 rounded text-xs text-gray-600 dark:text-gray-400 text-center">
            Powered by Microsoft Office Online Viewer
          </div>
        </div>
      )
    }

    // PDF preview
    if (file.mimeType === 'application/pdf' || ext === 'pdf') {
      return (
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-t-lg border-b border-red-200 dark:border-red-800">
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{file.originalName}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">PDF</span>
          </div>
          <div className="bg-gray-100 dark:bg-gray-900 rounded-b-lg overflow-hidden">
            <iframe
              src={`${fileUrl}#view=FitH`}
              className="w-full h-[600px] border-0"
              title="PDF Preview"
              onError={() => setError('Failed to load PDF')}
            />
          </div>
        </div>
      )
    }

    // HTML preview - Render the actual HTML design
    if (ext === 'html' && previewContent) {
      return (
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between px-4 py-2 bg-orange-50 dark:bg-orange-900/20 rounded-t-lg border-b border-orange-200 dark:border-orange-800">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{file.originalName}</span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">HTML Preview</span>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-b-lg overflow-hidden">
            <iframe
              srcDoc={previewContent}
              className="w-full h-[600px] border-0 bg-white"
              title="HTML Preview"
              sandbox="allow-scripts allow-same-origin"
              onError={() => setError('Failed to load HTML preview')}
            />
          </div>
          <div className="px-4 py-2 bg-orange-50 dark:bg-orange-900/20 rounded text-xs text-gray-600 dark:text-gray-400 flex justify-between items-center">
            <span>Rendered HTML Preview</span>
            <button
              onClick={() => {
                const blob = new Blob([previewContent], { type: 'text/html' })
                const url = URL.createObjectURL(blob)
                window.open(url, '_blank')
              }}
              className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs"
            >
              Open in New Tab
            </button>
          </div>
        </div>
      )
    }

    // Markdown preview with formatting
    if (ext === 'md' && previewContent) {
      // Simple markdown to HTML renderer
      const renderMarkdown = (content) => {
        let html = content
        
        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">$1</h3>')
        html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-6 mb-3 text-gray-800 dark:text-gray-200">$1</h2>')
        html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4 text-gray-900 dark:text-gray-100">$1</h1>')
        
        // Bold
        html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold text-gray-900 dark:text-gray-100">$1</strong>')
        
        // Italic
        html = html.replace(/\*(.*?)\*/gim, '<em class="italic text-gray-800 dark:text-gray-200">$1</em>')
        
        // Code blocks
        html = html.replace(/```([\s\S]*?)```/gim, '<pre class="bg-gray-800 text-gray-100 p-4 rounded my-4 overflow-x-auto"><code>$1</code></pre>')
        
        // Inline code
        html = html.replace(/`([^`]+)`/gim, '<code class="bg-gray-200 dark:bg-gray-700 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
        
        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
        
        // Lists
        html = html.replace(/^\* (.*$)/gim, '<li class="ml-6 list-disc text-gray-700 dark:text-gray-300">$1</li>')
        html = html.replace(/^\- (.*$)/gim, '<li class="ml-6 list-disc text-gray-700 dark:text-gray-300">$1</li>')
        html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-6 list-decimal text-gray-700 dark:text-gray-300">$1</li>')
        
        // Paragraphs
        html = html.split('\n\n').map(para => {
          if (para.trim() && !para.startsWith('<')) {
            return `<p class="mb-4 text-gray-700 dark:text-gray-300">${para}</p>`
          }
          return para
        }).join('\n')
        
        return html
      }
      
      return (
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-t-lg border-b border-blue-200 dark:border-blue-800">
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{file.originalName}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Markdown</span>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-b-lg p-6 prose dark:prose-invert max-w-none overflow-auto max-h-[600px]">
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(previewContent) }} />
          </div>
        </div>
      )
    }

    // Text/Code preview with syntax highlighting
    const textExtensions = ['txt', 'js', 'jsx', 'ts', 'tsx', 'json', 'xml', 'html', 'css', 'scss', 'sass', 'py', 'java', 'cpp', 'c', 'h', 'php', 'rb', 'go', 'rs', 'sql', 'sh', 'yaml', 'yml', 'env', 'log']
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
          'txt': 'language-text',
        }
        return langMap[ext] || 'language-text'
      }
      
      // Get language label
      const getLanguageLabel = () => {
        const labelMap = {
          'js': 'JavaScript',
          'jsx': 'React JSX',
          'ts': 'TypeScript',
          'tsx': 'React TSX',
          'json': 'JSON',
          'xml': 'XML',
          'html': 'HTML',
          'css': 'CSS',
          'scss': 'SCSS',
          'py': 'Python',
          'java': 'Java',
          'cpp': 'C++',
          'c': 'C',
          'php': 'PHP',
          'rb': 'Ruby',
          'go': 'Go',
          'rs': 'Rust',
          'sql': 'SQL',
          'sh': 'Shell Script',
          'yaml': 'YAML',
          'yml': 'YAML',
          'txt': 'Plain Text',
          'log': 'Log File',
          'env': 'Environment',
        }
        return labelMap[ext] || ext.toUpperCase()
      }

      return (
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800 rounded-t-lg border-b border-gray-700">
            <span className="text-sm text-gray-100 font-mono">{file.originalName}</span>
            <span className="text-xs text-gray-400 uppercase">{getLanguageLabel()}</span>
          </div>
          <div className="bg-gray-900 rounded-b-lg overflow-hidden">
            <pre className="p-4 overflow-auto max-h-[600px] text-sm">
              <code className={`${getLanguageClass()} text-gray-100 font-mono whitespace-pre-wrap break-words`}>
                {previewContent}
              </code>
            </pre>
          </div>
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
