import { Upload, X, File, FileText, Image as ImageIcon, FileCode, FileArchive, FileVideo, Music } from 'lucide-react'
import { useState } from 'react'

const FileUploadCard = ({ 
  onFileSelect, 
  onRemove, 
  accept = '*', 
  maxSize = 100, // MB
  multiple = false,
  files = [],
  disabled = false 
}) => {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) return

    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files)
    handleFiles(selectedFiles)
  }

  const handleFiles = (selectedFiles) => {
    // Validate file size
    const validFiles = selectedFiles.filter(file => {
      const sizeInMB = file.size / (1024 * 1024)
      return sizeInMB <= maxSize
    })

    if (validFiles.length !== selectedFiles.length) {
      alert(`Some files exceed the ${maxSize}MB size limit and were not added.`)
    }

    if (onFileSelect) {
      onFileSelect(validFiles)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase()
    
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext)) {
      return <ImageIcon className="w-8 h-8" />
    } else if (['pdf'].includes(ext)) {
      return <FileText className="w-8 h-8" />
    } else if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'xml', 'py', 'java', 'cpp'].includes(ext)) {
      return <FileCode className="w-8 h-8" />
    } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return <FileArchive className="w-8 h-8" />
    } else if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) {
      return <FileVideo className="w-8 h-8" />
    } else if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) {
      return <Music className="w-8 h-8" />
    } else {
      return <File className="w-8 h-8" />
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400 dark:hover:border-blue-500'}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && document.getElementById('fileInput').click()}
      >
        <input
          id="fileInput"
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          disabled={disabled}
        />
        
        <Upload className={`w-12 h-12 mx-auto mb-4 ${
          isDragging ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'
        }`} />
        
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {isDragging ? 'Drop files here' : 'Drop files here or click to browse'}
        </h3>
        
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {multiple ? 'Multiple files allowed' : 'Single file only'} • Max size: {maxSize}MB
        </p>
        
        {accept !== '*' && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Accepted: {accept}
          </p>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Selected Files ({files.length})
          </h4>
          
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="text-blue-500 dark:text-blue-400">
                  {getFileIcon(file.name)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                
                {onRemove && !disabled && (
                  <button
                    onClick={() => onRemove(index)}
                    className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                    title="Remove file"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUploadCard
