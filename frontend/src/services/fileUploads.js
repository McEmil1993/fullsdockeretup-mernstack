import api from './api'

export const fileUploadService = {
  // Upload files with progress tracking
  uploadFiles: async (files, onProgress) => {
    const formData = new FormData()
    
    // Append all files to FormData
    files.forEach((file) => {
      formData.append('files', file)
    })

    try {
      const response = await api.post('/api/file-uploads/upload', formData, {
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            
            onProgress(progressEvent)
          }
        },
      })
      return response.data || response
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Get all files with pagination and filters
  getAllFiles: async (page = 1, limit = 10, category = 'all', search = '') => {
    try {
      

      
      const response = await api.post('/api/file-uploads/get-all', {
        page,
        limit,
        category,
        search,
      })
      return response.data || response
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Get file by ID
  getFileById: async (fileId) => {
    try {
      const response = await api.post('/api/file-uploads/get', {
        fileId,
      })
      return response.data || response
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Update file (category, status)
  updateFile: async (fileId, updateData) => {
    try {
      const response = await api.post('/api/file-uploads/update', {
        fileId,
        ...updateData,
      })
      return response.data || response
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Delete file
  deleteFile: async (fileId) => {
    try {
      const response = await api.post('/api/file-uploads/delete', {
        fileId,
      })
      return response.data || response
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Download file
  downloadFile: async (fileId, fileName) => {
    try {
      const response = await api.post('/api/file-uploads/download', 
        { fileId },
        {
          responseType: 'blob',
        }
      )
      
      // Create a blob URL and trigger download
      const blob = response.data || response
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      return { success: true }
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Get file statistics
  getFileStats: async () => {
    try {
      const response = await api.post('/api/file-uploads/stats')
      return response.data || response
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Chunked Upload Methods
  initializeChunkedUpload: async (fileName, fileSize, totalChunks, mimeType) => {
    try {
      const response = await api.post('/api/file-uploads/chunked/initialize', {
        fileName,
        fileSize,
        totalChunks,
        mimeType,
      })
      return response.data || response
    } catch (error) {
      throw error.response?.data || error
    }
  },

  uploadChunk: async (uploadId, chunkIndex, chunkBlob, onUploadProgress) => {
    try {
      const formData = new FormData()
      formData.append('chunk', chunkBlob)
      formData.append('uploadId', uploadId)
      formData.append('chunkIndex', chunkIndex)

      const response = await api.post('/api/file-uploads/chunked/upload', formData, {
        onUploadProgress,
      })
      return response.data || response
    } catch (error) {
      throw error.response?.data || error
    }
  },

  finalizeChunkedUpload: async (uploadId, category) => {
    try {
      const payload = { uploadId }
      // Only include category if explicitly provided (not null or undefined)
      if (category) {
        payload.category = category
      }
      
      const response = await api.post('/api/file-uploads/chunked/finalize', payload)
      return response.data || response
    } catch (error) {
      throw error.response?.data || error
    }
  },

  cancelChunkedUpload: async (uploadId) => {
    try {
      const response = await api.post('/api/file-uploads/chunked/cancel', {
        uploadId,
      })
      return response.data || response
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Utility function to upload file in chunks with progress tracking
  uploadFileInChunks: async (file, onProgress) => {
    // Dynamic chunk size based on file size for better performance
    // Small files (<100MB): 2MB chunks
    // Medium files (100MB-1GB): 10MB chunks
    // Large files (>1GB): 50MB chunks
    let CHUNK_SIZE
    if (file.size < 100 * 1024 * 1024) {
      CHUNK_SIZE = 2 * 1024 * 1024 // 2MB for small files
    } else if (file.size < 1024 * 1024 * 1024) {
      CHUNK_SIZE = 10 * 1024 * 1024 // 10MB for medium files
    } else {
      CHUNK_SIZE = 50 * 1024 * 1024 // 50MB for large files (1GB+)
    }
    
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
    let uploadId = null
    
    try {
      // Initialize upload
      const initResponse = await fileUploadService.initializeChunkedUpload(
        file.name,
        file.size,
        totalChunks,
        file.type
      )
      
      uploadId = initResponse.data.uploadId
      
      // Upload chunks
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE
        const end = Math.min(start + CHUNK_SIZE, file.size)
        const chunkBlob = file.slice(start, end)
        
        await fileUploadService.uploadChunk(uploadId, chunkIndex, chunkBlob, (progressEvent) => {
          // Calculate overall progress
          const chunkProgress = progressEvent.loaded / progressEvent.total
          const overallProgress = ((chunkIndex + chunkProgress) / totalChunks) * 100
          
          if (onProgress) {
            onProgress({
              loaded: start + progressEvent.loaded,
              total: file.size,
              progress: overallProgress / 100,
              currentChunk: chunkIndex + 1,
              totalChunks,
              chunkProgress: progressEvent,
            })
          }
        })
      }
      
      // Finalize upload
      const finalResponse = await fileUploadService.finalizeChunkedUpload(uploadId)
      return finalResponse
      
    } catch (error) {
      // Cancel upload on error
      if (uploadId) {
        try {
          await fileUploadService.cancelChunkedUpload(uploadId)
        } catch (cancelError) {
        }
      }
      throw error
    }
  },
}

export default fileUploadService
