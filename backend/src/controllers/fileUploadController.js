const { log } = require('console');
const fileUploadService = require('../services/fileUploadService');
const fs = require('fs');
const path = require('path');

class FileUploadController {
  async uploadFiles(req, res) {
    try {
      console.log("res.req.files:", req.files);
      
      // Check if files were uploaded
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded',
        });
      }

      // Get user info from auth middleware
      const userId = req.userId;
      
      // Fetch user details to get username
      const User = require('../models/User');
      const user = await User.findById(userId).select('username email');
      const userName = user?.username || user?.email || 'Unknown User';

      // Process all uploaded files
      const uploadedFiles = [];
      const errors = [];

      for (const file of req.files) {
        try {
          const fileUpload = await fileUploadService.createFileUpload(file, userId, userName);
          uploadedFiles.push(fileUpload);
        } catch (error) {
          errors.push({
            fileName: file.originalname,
            error: error.message
          });
        }
      }

      // Return response
      if (uploadedFiles.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'All file uploads failed',
          errors: errors,
        });
      }

      res.status(201).json({
        success: true,
        message: `${uploadedFiles.length} file(s) uploaded successfully`,
        data: uploadedFiles,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      // Clean up uploaded files on error
      if (req.files) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload files',
      });
    }
  }

  async getAllFiles(req, res) {
    try {
      const { page, limit, category, search } = req.body;

      const filters = {};
      if (category) filters.category = category;
      if (search) filters.search = search;

      const result = await fileUploadService.getAllFiles(page, limit, filters);

      res.status(200).json({
        success: true,
        message: 'Files retrieved successfully',
        data: result.data,
        count: result.count,
        page: result.page,
        total_count: result.total_count,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve files',
      });
    }
  }

  async getFileById(req, res) {
    try {
      const { fileId } = req.body;

      if (!fileId) {
        return res.status(400).json({
          success: false,
          message: 'File ID is required',
        });
      }

      const file = await fileUploadService.getFileById(fileId);

      res.status(200).json({
        success: true,
        message: 'File retrieved successfully',
        data: file,
      });
    } catch (error) {
      const statusCode = error.message === 'File not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to retrieve file',
      });
    }
  }

  async deleteFile(req, res) {
    try {
      const { fileId } = req.body;

      if (!fileId) {
        return res.status(400).json({
          success: false,
          message: 'File ID is required',
        });
      }

      const file = await fileUploadService.deleteFile(fileId);

      res.status(200).json({
        success: true,
        message: 'File deleted successfully',
        data: file,
      });
    } catch (error) {
      const statusCode = error.message === 'File not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete file',
      });
    }
  }

  async updateFile(req, res) {
    try {
      const { fileId, ...updateData } = req.body;

      if (!fileId) {
        return res.status(400).json({
          success: false,
          message: 'File ID is required',
        });
      }

      const file = await fileUploadService.updateFile(fileId, updateData);

      res.status(200).json({
        success: true,
        message: 'File updated successfully',
        data: file,
      });
    } catch (error) {
      const statusCode = error.message === 'File not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update file',
      });
    }
  }

  async downloadFile(req, res) {
    try {
      const { fileId } = req.body;

      if (!fileId) {
        return res.status(400).json({
          success: false,
          message: 'File ID is required',
        });
      }

      const file = await fileUploadService.getFileById(fileId);

      // Check if file exists on disk
      if (!fs.existsSync(file.filePath)) {
        return res.status(404).json({
          success: false,
          message: 'File not found on server',
        });
      }

      // Set headers for download
      res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
      res.setHeader('Content-Type', file.mimeType);

      // Stream file to response
      const fileStream = fs.createReadStream(file.filePath);
      fileStream.pipe(res);
    } catch (error) {
      const statusCode = error.message === 'File not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to download file',
      });
    }
  }

  async getFileStats(req, res) {
    try {
      const userId = req.body.userId || req.userId;

      const stats = await fileUploadService.getFileStats(userId);

      res.status(200).json({
        success: true,
        message: 'File statistics retrieved successfully',
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve file statistics',
      });
    }
  }

  // Chunked Upload Methods
  async initializeChunkedUpload(req, res) {
    try {
      const { fileName, fileSize, totalChunks, mimeType } = req.body;
      const userId = req.userId;

      if (!fileName || !fileSize || !totalChunks) {
        return res.status(400).json({
          success: false,
          message: 'fileName, fileSize, and totalChunks are required',
        });
      }

      const uploadSession = await fileUploadService.initializeChunkedUpload({
        fileName,
        fileSize,
        totalChunks,
        mimeType,
        userId,
      });

      res.status(200).json({
        success: true,
        message: 'Chunked upload initialized',
        data: uploadSession,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to initialize chunked upload',
      });
    }
  }

  async uploadChunk(req, res) {
    try {
      const { uploadId, chunkIndex } = req.body;

      if (!uploadId || chunkIndex === undefined) {
        return res.status(400).json({
          success: false,
          message: 'uploadId and chunkIndex are required',
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No chunk uploaded',
        });
      }

      const result = await fileUploadService.uploadChunk({
        uploadId,
        chunkIndex: parseInt(chunkIndex),
        chunkPath: req.file.path,
      });

      res.status(200).json({
        success: true,
        message: 'Chunk uploaded successfully',
        data: result,
      });
    } catch (error) {
      // Clean up uploaded chunk on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload chunk',
      });
    }
  }

  async finalizeChunkedUpload(req, res) {
    try {
      const { uploadId, category } = req.body;
      const userId = req.userId;

      if (!uploadId) {
        return res.status(400).json({
          success: false,
          message: 'uploadId is required',
        });
      }

      // Get user details
      const User = require('../models/User');
      const user = await User.findById(userId).select('username email');
      const userName = user?.username || user?.email || 'Unknown User';

      const fileUpload = await fileUploadService.finalizeChunkedUpload({
        uploadId,
        userId,
        userName,
        category,
      });

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: fileUpload,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to finalize chunked upload',
      });
    }
  }

  async cancelChunkedUpload(req, res) {
    try {
      const { uploadId } = req.body;

      if (!uploadId) {
        return res.status(400).json({
          success: false,
          message: 'uploadId is required',
        });
      }

      await fileUploadService.cancelChunkedUpload(uploadId);

      res.status(200).json({
        success: true,
        message: 'Chunked upload cancelled',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to cancel chunked upload',
      });
    }
  }

  // Public file access methods (no authentication required)
  async getPublicFile(req, res) {
    try {
      const { fileId } = req.params;

      if (!fileId) {
        return res.status(400).json({
          success: false,
          message: 'File ID is required',
        });
      }

      const file = await fileUploadService.getFileById(fileId);

      // Return file info without sensitive data
      res.status(200).json({
        success: true,
        message: 'File retrieved successfully',
        data: {
          _id: file._id,
          originalName: file.originalName,
          fileName: file.fileName,
          mimeType: file.mimeType,
          fileSize: file.fileSize,
          fileType: file.fileType,
          category: file.category,
          uploadedBy: file.uploadedBy,
          uploadDate: file.uploadDate,
        },
      });
    } catch (error) {
      const statusCode = error.message === 'File not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to retrieve file',
      });
    }
  }

  async downloadPublicFile(req, res) {
    try {
      const { fileId } = req.params;

      if (!fileId) {
        return res.status(400).json({
          success: false,
          message: 'File ID is required',
        });
      }

      const file = await fileUploadService.getFileById(fileId);

      // Check if file exists on disk
      if (!fs.existsSync(file.filePath)) {
        return res.status(404).json({
          success: false,
          message: 'File not found on server',
        });
      }

      // Set headers for download
      res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Length', file.fileSize);

      // Stream file to response
      const fileStream = fs.createReadStream(file.filePath);
      fileStream.pipe(res);
    } catch (error) {
      const statusCode = error.message === 'File not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to download file',
      });
    }
  }
}

module.exports = new FileUploadController();
