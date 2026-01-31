import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Download, FileText, Loader, Link2, LogIn, LayoutDashboard } from 'lucide-react'
import FilePreview from '../components/FilePreview'

const PublicFileViewer = () => {
  const { fileId } = useParams()
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://back.markemilcajesdacoylo.online'

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = () => {
      // Check for accessToken in localStorage or cookies
      const hasToken = localStorage.getItem('accessToken') || 
                       document.cookie.includes('accessToken') ||
                       document.cookie.includes('refreshToken')
      setIsLoggedIn(!!hasToken)
    }
    checkAuth()
  }, [])

  useEffect(() => {
    fetchFile()
  }, [fileId])

  const fetchFile = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`${apiBaseUrl}/api/file-uploads/public/${fileId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('File not found')
        } else {
          setError(`Failed to load file (${response.status})`)
        }
        return
      }
      
      const data = await response.json()

      if (data.success && data.data) {
        setFile(data.data)
      } else {
        setError(data.message || 'File not found')
      }
    } catch (err) {
      console.error('Error fetching file:', err)
      setError('Failed to load file. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    window.open(`${apiBaseUrl}/api/file-uploads/public/${fileId}/download`, '_blank')
  }

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    const size = Math.round(bytes / Math.pow(k, i) * 100) / 100
    return `${size} ${sizes[i]}`
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid date'
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (e) {
      return 'Invalid date'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader className="w-16 h-16 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-700 dark:text-gray-300">Loading file...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">File Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{String(error)}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => alert('Link copied to clipboard!'))
      .catch(() => alert('Failed to copy link'))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header with Login Button */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {/* {file?.originalName || 'File Viewer'} */} Viewing file
                </h1>
                {/* <p className="text-sm text-gray-500 dark:text-gray-400">
                  Public file sharing
                </p> */}
              </div>
            </div>
            {/* {isLoggedIn ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Login</span>
              </button>
            )} */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="space-y-6">
          {/* File Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* File Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 sm:px-8 py-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
                    {file?.originalName || 'Unknown File'}
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
                    Uploaded by {
                      typeof file?.uploadedBy === 'object'
                        ? file.uploadedBy.email
                        : file?.uploadedBy || 'Anonymous'
                    }
                  </p>
                  <div className="flex flex-wrap gap-3 mt-3 text-blue-100 text-sm">
                    <span>{formatFileSize(file?.fileSize || 0)}</span>
                    <span>•</span>
                    <span>{file?.fileType || 'Unknown type'}</span>
                    <span>•</span>
                    <span>{file?.category || 'Other'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 sm:p-8 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleCopyLink}
                  className="w-full py-4 px-6 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                >
                  <Link2 className="w-5 h-5" />
                  Copy link
                </button>
                <button
                  onClick={handleDownload}
                  className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download file
                </button>
              </div>
              
              {/* File Details */}
              
            </div>

            {/* Preview Section */}
            <div className="p-6 sm:p-8 bg-gray-50 dark:bg-gray-900/50">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Preview
              </h3>
              {file ? (
                <FilePreview 
                  file={file} 
                  apiBaseUrl={apiBaseUrl}
                />
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  Loading preview...
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Secure file sharing powered by your platform
          </p>
        </div>
      </footer>
    </div>
  )
}

export default PublicFileViewer
