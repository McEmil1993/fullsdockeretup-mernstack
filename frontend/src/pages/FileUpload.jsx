import { useState, useEffect, useRef } from 'react'
import FileUploadCard from '../components/FileUploadCard'
import Button from '../components/Button'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import Table from '../components/Table'
import Pagination from '../components/Pagination'
import FilePreview from '../components/FilePreview'
import { Upload, Trash2, Download, Eye, Search, Filter, CheckSquare, Square, Link2, Check, Share2, Users, Globe } from 'lucide-react'
import fileUploadService from '../services/fileUploads'
import { getUsers } from '../services/users'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../contexts/PermissionContext'
import TomSelect from 'tom-select'
import 'tom-select/dist/css/tom-select.css'

const FileUpload = () => {
  const { user: currentUser } = useAuth()
  const { hasPermission } = usePermissions()
  const userSelectRef = useRef(null)
  const tomSelectInstance = useRef(null)
  const [uploadedFiles, setUploadedFiles] = useState([])

  const [selectedFiles, setSelectedFiles] = useState([])
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [viewingFile, setViewingFile] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [viewType, setViewType] = useState('myFiles') // Default to 'myFiles' - show only user's files
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [uploadStartTime, setUploadStartTime] = useState(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [uploadSpeed, setUploadSpeed] = useState(0)

  // Selection state
  const [selectedFileIds, setSelectedFileIds] = useState([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const longPressTimerRef = useRef(null)
  const [longPressTarget, setLongPressTarget] = useState(null)

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'warning'
  })

  // Toast state
  const [toast, setToast] = useState({
    isOpen: false,
    message: '',
    type: 'success',
  })

  // Share modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [sharingFile, setSharingFile] = useState(null)
  const [allUsers, setAllUsers] = useState([])
  const [selectedUserIds, setSelectedUserIds] = useState([])
  const [sharePermissions, setSharePermissions] = useState({
    canView: true,
    canDownload: false,
    canCopyLink: false,
    canShare: false,
    canDelete: false
  })

  const showToast = (message, type = 'success') => {
    setToast({ isOpen: true, message, type })
  }

  // Helper function to check user permissions for a file
  const getUserPermissions = (file) => {
    if (!currentUser) {
      return {
        canView: false,
        canDownload: false,
        canCopyLink: false,
        canShare: false,
        canDelete: false,
        isOwner: false
      }
    }

    const currentUserId = currentUser._id || currentUser.id
    const fileOwnerId = file.uploadedBy?._id || file.uploadedBy
    
    // Check if current user is the owner
    const isOwner = currentUserId === fileOwnerId
    
    // Get global role permissions
    const globalCanDownload = hasPermission('fileUpload.canDownload')
    const globalCanShare = hasPermission('fileUpload.canShare')
    const globalCanDelete = hasPermission('fileUpload.canDelete')
    
    if (isOwner) {
      // Owner has all permissions BUT respects global role permissions
      return {
        canView: true,
        canDownload: globalCanDownload,
        canCopyLink: true,
        canShare: globalCanShare,
        canDelete: globalCanDelete,
        isOwner: true
      }
    }
    
    // Find user in sharedWith array
    const shareEntry = file.sharedWith?.find(share => {
      const sharedUserId = share.userId?._id || share.userId
      return sharedUserId === currentUserId
    })
    
    if (shareEntry && shareEntry.permissions) {
      // Combine file-level permissions with global role permissions
      return {
        canView: shareEntry.permissions.canView,
        canDownload: shareEntry.permissions.canDownload && globalCanDownload,
        canCopyLink: shareEntry.permissions.canCopyLink,
        canShare: shareEntry.permissions.canShare && globalCanShare,
        canDelete: shareEntry.permissions.canDelete && globalCanDelete,
        isOwner: false
      }
    }
    
    // No access
    return {
      canView: false,
      canDownload: false,
      canCopyLink: false,
      canShare: false,
      canDelete: false,
      isOwner: false
    }
  }

  // Fetch files from backend
  const fetchFiles = async () => {
    try {
      setIsLoading(true)
      
      

      const response = await fileUploadService.getAllFiles(
        currentPage,
        pageSize,
        filterCategory,
        searchQuery,
        viewType
      )
      
      if (response.success) {
        setUploadedFiles(response.data)
        setTotalCount(response.total_count)
      }
    } catch (error) {
      showToast(error.message || 'Failed to fetch files', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Load files on mount and when filters change
  useEffect(() => {
    fetchFiles()
  }, [currentPage, pageSize, filterCategory, searchQuery, viewType])

  const handleFileSelect = (files) => {
    setSelectedFiles([...selectedFiles, ...files])
    showToast(`${files.length} file(s) selected`, 'success')
  }

  const handleRemoveFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    showToast('File removed from selection', 'info')
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      showToast('Please select files to upload', 'warning')
      return
    }

    try {
      setIsUploading(true)
      setUploadProgress(0)
      const startTime = Date.now()
      setUploadStartTime(startTime)
      setElapsedTime(0)

      // Start timer
      const timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        setElapsedTime(elapsed)
      }, 100)

      const LARGE_FILE_THRESHOLD = 5 * 1024 * 1024 // 5MB

      // Check if any file is larger than threshold
      const hasLargeFiles = selectedFiles.some(file => file.size > LARGE_FILE_THRESHOLD)

      let uploadedCount = 0

      if (hasLargeFiles && selectedFiles.length === 1) {
        // Use chunked upload for single large file
        const file = selectedFiles[0]
        
        const response = await fileUploadService.uploadFileInChunks(
          file,
          (progressEvent) => {
            const progress = Math.round(progressEvent.progress * 100)
            setUploadProgress(progress)
            
            // Calculate upload speed
            const currentTime = Date.now()
            const timeElapsed = (currentTime - startTime) / 1000 // seconds
            
            if (progressEvent.loaded && timeElapsed > 0) {
              const speed = progressEvent.loaded / timeElapsed // bytes per second
              setUploadSpeed(speed)
            }
          }
        )

        if (response.success) {
          uploadedCount = 1
        }
      } else if (hasLargeFiles && selectedFiles.length > 1) {
        // Upload large files one by one using chunked upload
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i]
          
          if (file.size > LARGE_FILE_THRESHOLD) {
            // Use chunked upload
            await fileUploadService.uploadFileInChunks(
              file,
              (progressEvent) => {
                const fileProgress = progressEvent.progress * 100
                const overallProgress = ((i + (progressEvent.progress)) / selectedFiles.length) * 100
                setUploadProgress(Math.round(overallProgress))
                
                // Calculate upload speed
                const currentTime = Date.now()
                const timeElapsed = (currentTime - startTime) / 1000
                
                if (progressEvent.loaded && timeElapsed > 0) {
                  const speed = progressEvent.loaded / timeElapsed
                  setUploadSpeed(speed)
                }
              }
            )
          } else {
            // Use regular upload for small files
            await fileUploadService.uploadFiles(
              [file],
              (progressEvent) => {
                const fileProgress = (progressEvent.loaded / progressEvent.total) * 100
                const overallProgress = ((i + (progressEvent.loaded / progressEvent.total)) / selectedFiles.length) * 100
                setUploadProgress(Math.round(overallProgress))
                
                // Calculate upload speed
                const currentTime = Date.now()
                const timeElapsed = (currentTime - startTime) / 1000
                
                if (progressEvent.loaded && timeElapsed > 0) {
                  const speed = progressEvent.loaded / timeElapsed
                  setUploadSpeed(speed)
                }
              }
            )
          }
          
          uploadedCount++
        }
      } else {
        // Use regular upload for all small files
        const response = await fileUploadService.uploadFiles(
          selectedFiles,
          (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(progress)
            
            // Calculate upload speed
            const currentTime = Date.now()
            const timeElapsed = (currentTime - startTime) / 1000
            
            if (progressEvent.loaded && timeElapsed > 0) {
              const speed = progressEvent.loaded / timeElapsed
              setUploadSpeed(speed)
            }
          }
        )

        if (response.success) {
          uploadedCount = response.data.length
        }
      }

      clearInterval(timerInterval)

      if (uploadedCount > 0) {
        showToast(`${uploadedCount} file(s) uploaded successfully!`, 'success')
        setSelectedFiles([])
        setIsUploadModalOpen(false)
        setUploadProgress(0)
        setElapsedTime(0)
        setUploadSpeed(0)
        
        // Refresh file list
        fetchFiles()
      }
    } catch (error) {
      showToast(error.message || 'Failed to upload files', 'error')
    } finally {
      setIsUploading(false)
    }
  }

  // Selection handlers
  const toggleFileSelection = (fileId, file) => {
    // Check if user has delete permission for this file
    if (file) {
      const permissions = getUserPermissions(file)
      if (!permissions.canDelete) {
        showToast('You do not have permission to delete this file', 'warning')
        return
      }
    }
    
    setSelectedFileIds(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedFileIds.length === uploadedFiles.length) {
      setSelectedFileIds([])
    } else {
      // Only select files that user can delete
      const deletableFiles = uploadedFiles.filter(file => {
        const permissions = getUserPermissions(file)
        return permissions.canDelete
      })
      setSelectedFileIds(deletableFiles.map(f => f._id))
    }
  }

  const handleLongPressStart = (e, fileId, file) => {
    e.preventDefault()
    
    // Check if user has delete permission for this file
    const permissions = getUserPermissions(file)
    if (!permissions.canDelete) {
      // User doesn't have delete permission, don't activate selection mode
      return
    }
    
    setLongPressTarget(fileId)
    longPressTimerRef.current = setTimeout(() => {
      setIsSelectionMode(true)
      toggleFileSelection(fileId, file)
      showToast('Selection mode activated', 'info')
    }, 500) // 500ms long press
  }

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    setLongPressTarget(null)
  }

  const exitSelectionMode = () => {
    setIsSelectionMode(false)
    setSelectedFileIds([])
  }

  const handleDeleteFile = async (file) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete File',
      message: `Are you sure you want to delete "${file.originalName}"? This action cannot be undone.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const response = await fileUploadService.deleteFile(file._id)
          
          if (response.success) {
            showToast(`${file.originalName} deleted successfully`, 'success')
            fetchFiles()
          }
        } catch (error) {
          showToast(error.message || 'Failed to delete file', 'error')
        } finally {
          setConfirmDialog({ ...confirmDialog, isOpen: false })
        }
      }
    })
  }

  const handleBulkDelete = async () => {
    const count = selectedFileIds.length
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Multiple Files',
      message: `Are you sure you want to delete ${count} file${count > 1 ? 's' : ''}? This action cannot be undone.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          let successCount = 0
          let failCount = 0

          for (const fileId of selectedFileIds) {
            try {
              const response = await fileUploadService.deleteFile(fileId)
              if (response.success) successCount++
            } catch (error) {
              failCount++
            }
          }

          if (successCount > 0) {
            showToast(`${successCount} file${successCount > 1 ? 's' : ''} deleted successfully`, 'success')
          }
          if (failCount > 0) {
            showToast(`Failed to delete ${failCount} file${failCount > 1 ? 's' : ''}`, 'error')
          }

          exitSelectionMode()
          fetchFiles()
        } catch (error) {
          showToast(error.message || 'Failed to delete files', 'error')
        } finally {
          setConfirmDialog({ ...confirmDialog, isOpen: false })
        }
      }
    })
  }

  const handleViewFile = (file) => {
    setViewingFile(file)
    setIsViewModalOpen(true)
  }

  const handleDownloadFile = async (file) => {
    try {
      showToast(`Downloading ${file.originalName}...`, 'info')
      await fileUploadService.downloadFile(file._id, file.originalName)
      showToast(`${file.originalName} downloaded successfully`, 'success')
    } catch (error) {
      showToast(error.message || 'Failed to download file', 'error')
    }
  }

  const handleCopyLink = async (file) => {
    try {
      const publicUrl = `${window.location.origin}/file/${file._id}`
      
      await navigator.clipboard.writeText(publicUrl)
      showToast('Link copied to clipboard!', 'success')
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = `${window.location.origin}/file/${file._id}`
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        showToast('Link copied to clipboard!', 'success')
      } catch (err) {
        showToast('Failed to copy link', 'error')
      }
      document.body.removeChild(textArea)
    }
  }

  const handleShareFile = async (file) => {
    setSharingFile(file)
    
    // Load all users
    try {
      const response = await getUsers()
      console.log('getUsers response:', response) // Debug log
      
      // getAllUsers returns { users: [...], success: true/false }
      const usersList = response.users || response.data || []
      
      if (usersList.length > 0) {
        // Filter out the file owner
        const ownerId = file.uploadedBy?._id || file.uploadedBy
        const filteredUsers = usersList.filter(u => u._id !== ownerId)
        console.log('Filtered users:', filteredUsers) // Debug log
        setAllUsers(filteredUsers)
      } else {
        console.log('No users found in response')
        setAllUsers([])
      }
    } catch (error) {
      console.error('Failed to load users:', error)
      showToast('Failed to load users', 'error')
      return
    }
    
    // Load already shared users
    try {
      const response = await fileUploadService.getSharedUsers(file._id)
      if (response.success) {
        setSelectedUserIds(response.data.map(u => u.userId._id || u.userId))
      }
    } catch (error) {
      console.error('Failed to load shared users:', error)
      setSelectedUserIds([])
    }
    
    setIsShareModalOpen(true)
  }

  // Initialize TomSelect when modal opens
  useEffect(() => {
    if (isShareModalOpen && userSelectRef.current && allUsers.length > 0) {
      // Destroy existing instance if any
      
      if (tomSelectInstance.current) {
        tomSelectInstance.current.destroy()
      }

      // Initialize TomSelect
      tomSelectInstance.current = new TomSelect(userSelectRef.current, {
        valueField: '_id',
        labelField: 'name',
        searchField: ['name', 'email'],
        placeholder: 'Search and select users...',
        maxItems: null,
        plugins: ['remove_button'],
        options: allUsers.map(user => ({
          _id: user._id,
          name: user.name || user.email?.split('@')[0] || 'Unknown',
          email: user.email
        })),
        render: {
          option: function(data, escape) {
            return `<div class="py-2">
              <div class="font-medium text-gray-900 dark:text-white">${escape(data.name)}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">${escape(data.email)}</div>
            </div>`
          },
          item: function(data, escape) {
            return `<div class="px-2 py-1">${escape(data.name)}</div>`
          }
        },
        onChange: function(values) {
          setSelectedUserIds(values)
        }
      })

      // Set initial selected values
      if (selectedUserIds.length > 0) {
        tomSelectInstance.current.setValue(selectedUserIds, true)
      }
    }

    // Cleanup on modal close
    return () => {
      if (tomSelectInstance.current) {
        tomSelectInstance.current.destroy()
        tomSelectInstance.current = null
      }
    }
  }, [isShareModalOpen, allUsers])

  const handleConfirmShare = async () => {
    try {
      // Call API with selected users (empty array = unshare all)
      const response = await fileUploadService.shareFile(
        sharingFile._id,
        selectedUserIds,
        sharePermissions
      )
      
      if (response.success) {
        if (selectedUserIds.length === 0) {
          showToast('All shares removed successfully', 'success')
        } else {
          showToast(`File shared with ${selectedUserIds.length} user(s)`, 'success')
        }
        
        setIsShareModalOpen(false)
        setSharingFile(null)
        setSelectedUserIds([])
        setSharePermissions({
          canView: true,
          canDownload: false,
          canCopyLink: false,
          canShare: false,
          canDelete: false
        })
        fetchFiles()
      }
    } catch (error) {
      showToast(error.message || 'Failed to update shares', 'error')
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Format time for display (HH:MM:SS)
  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  const columns = [
    { 
      key: 'originalName', 
      label: 'FILE NAME',
      render: (value) => (
        <span className="font-medium text-gray-900 dark:text-white">{value}</span>
      )
    },
    { 
      key: 'fileType', 
      label: 'TYPE',
      render: (value) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">{value}</span>
      )
    },
    { 
      key: 'fileSize', 
      label: 'SIZE',
      render: (value) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">{formatFileSize(value)}</span>
      )
    },
    { 
      key: 'category', 
      label: 'CATEGORY',
      render: (value) => {
        const colors = {
          Documents: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          Reports: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          Images: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
          Videos: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          Audio: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
          Archives: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
        }
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[value] || 'bg-gray-100 text-gray-800'}`}>
            {value}
          </span>
        )
      }
    },
    { 
      key: 'uploadedByName', 
      label: 'UPLOADED BY',
      render: (value) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">{value}</span>
      )
    },
    { 
      key: 'uploadDate', 
      label: 'DATE',
      render: (value, file) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(file.createdAt)}</span>
      )
    },
    { 
      key: 'uploadTime', 
      label: 'TIME',
      render: (value, file) => (
        <span className="text-sm font-mono text-gray-900 dark:text-white">{formatTime(file.createdAt)}</span>
      )
    },
    { 
      key: 'uploadProgress', 
      label: 'PROGRESS',
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 w-full sm:min-w-[60px]">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all" 
              style={{ width: `${value}%` }}
            ></div>
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400">{value}%</span>
        </div>
      )
    }
  ]

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            File Upload
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
            {isSelectionMode 
              ? `${selectedFileIds.length} file${selectedFileIds.length !== 1 ? 's' : ''} selected`
              : 'Manage and upload your files'
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSelectionMode ? (
            <>
              <Button
                variant="secondary"
                onClick={exitSelectionMode}
                className="flex items-center gap-1 text-sm px-3 py-2"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleBulkDelete}
                disabled={selectedFileIds.length === 0}
                className="flex items-center gap-1 text-sm px-3 py-2"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Delete</span> ({selectedFileIds.length})
              </Button>
            </>
          ) : (
            hasPermission('fileUpload.canUpload') && (
              <Button
                variant="primary"
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-1 text-sm px-3 py-2"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Upload Files</span>
              </Button>
            )
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Files</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {uploadedFiles.length}
              </h3>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Size</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatFileSize(uploadedFiles.reduce((sum, file) => sum + file.fileSize, 0))}
              </h3>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Download className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Categories</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {[...new Set(uploadedFiles.map(f => f.category))].length}
              </h3>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Filter className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 sm:px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Categories</option>
          <option value="Documents">Documents</option>
          <option value="Reports">Reports</option>
          <option value="Images">Images</option>
          <option value="Videos">Videos</option>
          <option value="Audio">Audio</option>
          <option value="Archives">Archives</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Files Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {isSelectionMode && (
                  <th className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-left">
                    <button
                      onClick={toggleSelectAll}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      title={selectedFileIds.length === uploadedFiles.length ? 'Deselect All' : 'Select All'}
                    >
                      {selectedFileIds.length === uploadedFiles.length ? (
                        <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Square className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      )}
                    </button>
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    {col.label}
                  </th>
                ))}
                {!isSelectionMode && (
                  <th className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-600 dark:text-gray-400">Loading files...</span>
                    </div>
                  </td>
                </tr>
              ) : uploadedFiles.length > 0 ? (
                uploadedFiles
                  .filter(file => {
                    // In selection mode, only show files that user can delete
                    if (isSelectionMode) {
                      const permissions = getUserPermissions(file)
                      return permissions.canDelete
                    }
                    return true // Show all files in normal mode
                  })
                  .map((file) => (
                  <tr 
                    key={file._id} 
                    className={`transition-colors ${
                      selectedFileIds.includes(file._id) 
                        ? 'bg-blue-50 dark:bg-blue-900/20' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    } ${isSelectionMode ? 'cursor-pointer' : ''}`}
                    onClick={(e) => {
                      if (isSelectionMode && !e.target.closest('button')) {
                        toggleFileSelection(file._id, file)
                      }
                    }}
                    onMouseDown={(e) => {
                      if (!isSelectionMode && e.button === 0) {
                        handleLongPressStart(e, file._id, file)
                      }
                    }}
                    onMouseUp={handleLongPressEnd}
                    onMouseLeave={handleLongPressEnd}
                    onTouchStart={(e) => {
                      if (!isSelectionMode) {
                        handleLongPressStart(e, file._id, file)
                      }
                    }}
                    onTouchEnd={handleLongPressEnd}
                    onTouchCancel={handleLongPressEnd}
                  >
                    {(() => {
                      const permissions = getUserPermissions(file)
                      // Only show selection column if user can delete
                      if (isSelectionMode && permissions.canDelete) {
                        return (
                          <td className="px-2 sm:px-3 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleFileSelection(file._id, file)
                              }}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                            >
                              {selectedFileIds.includes(file._id) ? (
                                <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                              ) : (
                                <Square className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                              )}
                            </button>
                          </td>
                        )
                      }
                      return null
                    })()}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="px-2 sm:px-3 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white"
                      >
                        {col.render ? col.render(file[col.key], file) : file[col.key]}
                      </td>
                    ))}
                    {!isSelectionMode && (
                      <td className="px-2 sm:px-3 md:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
                        {(() => {
                          const permissions = getUserPermissions(file)
                          return (
                            <div className="flex items-center justify-end gap-1">
                              {/* View - Always show if user can see the file */}
                              {permissions.canView && (
                                <button
                                  onClick={() => handleViewFile(file)}
                                  className="p-1 sm:p-1.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                                  title="View"
                                >
                                  <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
                                </button>
                              )}
                              
                              {/* Copy Link - Only if has permission */}
                              {permissions.canCopyLink && (
                                <button
                                  onClick={() => handleCopyLink(file)}
                                  className="p-1 sm:p-1.5 rounded hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors"
                                  title="Copy Link"
                                >
                                  <Link2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />
                                </button>
                              )}
                              
                              {/* Download - Only if has permission */}
                              {permissions.canDownload && (
                                <button
                                  onClick={() => handleDownloadFile(file)}
                                  className="p-1 sm:p-1.5 rounded hover:bg-green-100 dark:hover:bg-green-900 transition-colors"
                                  title="Download"
                                >
                                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 dark:text-green-400" />
                                </button>
                              )}
                              
                              {/* Share - Hidden on small screens */}
                              {permissions.canShare && (
                                <button
                                  onClick={() => handleShareFile(file)}
                                  className="hidden sm:block p-1 sm:p-1.5 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
                                  title="Share with users"
                                >
                                  <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400" />
                                </button>
                              )}
                              
                              {/* Delete - Only if has permission (usually owner only) */}
                              {permissions.canDelete && (
                                <button
                                  onClick={() => handleDeleteFile(file)}
                                  className="p-1 sm:p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 dark:text-red-400" />
                                </button>
                              )}
                              
                              {/* Show lock icon if no permissions */}
                              {!permissions.canDownload && !permissions.canCopyLink && !permissions.canShare && !permissions.canDelete && (
                                <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500" title="Limited access">
                                  🔒
                                </span>
                              )}
                            </div>
                          )
                        })()}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No files found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalCount > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalCount / pageSize)}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPageSize(size)
            setCurrentPage(1)
          }}
          totalItems={totalCount}
        />
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Files"
        size="lg"
      >
        <div className="space-y-6">
          <FileUploadCard
            onFileSelect={handleFileSelect}
            onRemove={handleRemoveFile}
            files={selectedFiles}
            multiple={true}
            maxSize={10240}
            accept="*"
          />

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Uploading...</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all flex items-center justify-end pr-2" 
                  style={{ width: `${uploadProgress}%` }}
                >
                  {uploadProgress > 10 && (
                    <span className="text-xs text-white font-bold">{uploadProgress}%</span>
                  )}
                </div>
              </div>
              
              {/* Real-time Stats */}
              <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Progress</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {uploadProgress}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Elapsed Time</p>
                  <p className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
                    {Math.floor(elapsedTime / 60).toString().padStart(2, '0')}:
                    {(elapsedTime % 60).toString().padStart(2, '0')}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Speed</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {uploadSpeed > 0 ? `${(uploadSpeed / 1024 / 1024).toFixed(1)} MB/s` : '-- MB/s'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={() => {
                setIsUploadModalOpen(false)
                setSelectedFiles([])
                setUploadProgress(0)
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || isUploading}
            >
              {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* View File Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="File Details"
        size="lg"
      >
        {viewingFile && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">File Name</p>
                <p className="font-medium text-gray-900 dark:text-white">{viewingFile.originalName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">File Type</p>
                <p className="font-medium text-gray-900 dark:text-white">{viewingFile.fileType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">File Size</p>
                <p className="font-medium text-gray-900 dark:text-white">{formatFileSize(viewingFile.fileSize)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Category</p>
                <p className="font-medium text-gray-900 dark:text-white">{viewingFile.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Uploaded By</p>
                <p className="font-medium text-gray-900 dark:text-white">{viewingFile.uploadedByName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Upload Date</p>
                <p className="font-medium text-gray-900 dark:text-white">{formatDate(viewingFile.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Upload Time</p>
                <p className="font-mono font-medium text-gray-900 dark:text-white">{formatTime(viewingFile.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Progress</p>
                <p className="font-medium text-gray-900 dark:text-white">{viewingFile.uploadProgress}%</p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Preview</p>
              <FilePreview 
                file={viewingFile} 
                apiBaseUrl={import.meta.env.VITE_API_BASE_URL || 'https://back.markemilcajesdacoylo.online'}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="secondary"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => handleDownloadFile(viewingFile)}
              >
                Download
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Share Modal */}
      <Modal
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false)
          setSharingFile(null)
          setSelectedUserIds([])
        }}
        title="Share File"
        size="md"
      >
        {sharingFile && (
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">File</p>
              <p className="font-medium text-gray-900 dark:text-white">{sharingFile.originalName}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Share with users
              </label>
              {allUsers.length > 0 ? (
                <select
                  ref={userSelectRef}
                  multiple
                  placeholder="Search and select users..."
                  className="w-full"
                />
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4 border border-gray-300 dark:border-gray-600 rounded-lg">
                  No other users available
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Permissions
              </label>
              <div className="space-y-3 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                {/* Can View - Always checked and disabled */}
                <label className="flex items-start cursor-not-allowed opacity-75">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled={true}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      👁️ Can View
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Required - User can see the file in their list
                    </p>
                  </div>
                </label>

                {/* Can Download */}
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sharePermissions.canDownload}
                    onChange={(e) => setSharePermissions({
                      ...sharePermissions,
                      canDownload: e.target.checked
                    })}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      ⬇️ Can Download
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      User can download the file to their device
                    </p>
                  </div>
                </label>

                {/* Can Copy Link */}
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sharePermissions.canCopyLink}
                    onChange={(e) => setSharePermissions({
                      ...sharePermissions,
                      canCopyLink: e.target.checked
                    })}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      📋 Can Copy Link
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      User can copy public link to share with others
                    </p>
                  </div>
                </label>

                {/* Can Share */}
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sharePermissions.canShare}
                    onChange={(e) => setSharePermissions({
                      ...sharePermissions,
                      canShare: e.target.checked
                    })}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      🔗 Can Share with Others
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      User can share this file with more people
                    </p>
                  </div>
                </label>

                {/* Can Delete - DANGEROUS */}
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sharePermissions.canDelete}
                    onChange={(e) => setSharePermissions({
                      ...sharePermissions,
                      canDelete: e.target.checked
                    })}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">
                      🗑️ Can Delete (DANGEROUS)
                    </p>
                    <p className="text-xs text-red-500 dark:text-red-400">
                      ⚠️ User can permanently delete this file!
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsShareModalOpen(false)
                  setSharingFile(null)
                  setSelectedUserIds([])
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmShare}
              >
        
                {selectedUserIds.length === 0 
                  ? 'Remove All Shares' 
                  : `Share with ${selectedUserIds.length} user${selectedUserIds.length !== 1 ? 's' : ''}`
                }
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        isOpen={toast.isOpen}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </div>
  )
}

export default FileUpload
