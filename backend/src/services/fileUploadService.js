const FileUpload = require('../models/FileUpload');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// In-memory storage for upload sessions (consider using Redis for production)
const uploadSessions = new Map();

class FileUploadService {
  // Helper function to determine file category based on mime type
  getCategoryFromMimeType(mimeType, fileName = '') {
    // Handle null or undefined mimeType
    if (!mimeType) {
      // Fallback to extension-based detection if mimeType is missing
      const ext = path.extname(fileName).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'].includes(ext)) return 'Images';
      if (['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm'].includes(ext)) return 'Videos';
      if (['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'].includes(ext)) return 'Audio';
      if (['.pdf', '.doc', '.docx', '.txt', '.rtf'].includes(ext)) return 'Documents';
      if (['.xls', '.xlsx', '.csv'].includes(ext)) return 'Reports';
      if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(ext)) return 'Archives';
      return 'Other';
    }

    // MIME type-based detection
    if (mimeType.startsWith('image/')) return 'Images';
    if (mimeType.startsWith('video/')) return 'Videos';
    if (mimeType.startsWith('audio/')) return 'Audio';
    if (mimeType === 'application/pdf' || 
        mimeType === 'application/msword' || 
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'text/plain') return 'Documents';
    if (mimeType === 'application/vnd.ms-excel' || 
        mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        mimeType === 'text/csv') return 'Reports';
    if (mimeType === 'application/zip' || 
        mimeType === 'application/x-rar-compressed' ||
        mimeType === 'application/x-7z-compressed' ||
        mimeType === 'application/x-tar' ||
        mimeType === 'application/gzip') return 'Archives';
    return 'Other';
  }

  // Helper function to get file type from mime type
  getFileTypeFromMimeType(mimeType, filename) {
    const ext = path.extname(filename).toLowerCase();
    
    if (mimeType.startsWith('image/')) return 'Image';
    if (mimeType.startsWith('video/')) return 'Video';
    if (mimeType.startsWith('audio/')) return 'Audio';
    if (mimeType === 'application/pdf') return 'PDF Document';
    if (mimeType === 'application/msword' || ext === '.doc') return 'Word Document';
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || ext === '.docx') return 'Word Document';
    if (mimeType === 'application/vnd.ms-excel' || ext === '.xls') return 'Excel Spreadsheet';
    if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || ext === '.xlsx') return 'Excel Spreadsheet';
    if (mimeType === 'text/csv' || ext === '.csv') return 'CSV File';
    if (mimeType === 'text/plain') return 'Text File';
    if (mimeType === 'application/zip') return 'ZIP Archive';
    if (mimeType === 'application/x-rar-compressed') return 'RAR Archive';
    
    return mimeType || 'Unknown';
  }

  async createFileUpload(fileData, userId, userName) {
    try {
      const category = this.getCategoryFromMimeType(fileData.mimetype, fileData.originalname);
      const fileType = this.getFileTypeFromMimeType(fileData.mimetype, fileData.originalname);

      const fileUpload = new FileUpload({
        fileName: fileData.filename,
        originalName: fileData.originalname,
        fileType: fileType,
        mimeType: fileData.mimetype,
        fileSize: fileData.size,
        filePath: fileData.path,
        category: category,
        uploadedBy: userId,
        uploadedByName: userName,
        status: 'completed',
        uploadProgress: 100,
      });

      await fileUpload.save();
      return fileUpload;
    } catch (error) {
      // If save fails, delete the uploaded file
      if (fileData.path && fs.existsSync(fileData.path)) {
        fs.unlinkSync(fileData.path);
      }
      throw error;
    }
  }

  async getAllFiles(page, limit, filters = {}) {
    try {
      const query = {};
      
      // Build query from filters
      if (filters.category && filters.category !== 'all') {
        query.category = filters.category;
      }
      if (filters.uploadedBy) {
        query.uploadedBy = filters.uploadedBy;
      }
      if (filters.search) {
        query.$or = [
          { fileName: { $regex: filters.search, $options: 'i' } },
          { originalName: { $regex: filters.search, $options: 'i' } },
          { uploadedByName: { $regex: filters.search, $options: 'i' } }
        ];
      }

      // Get total count
      const totalCount = await FileUpload.countDocuments(query);

      // Get files with or without pagination
      let files;
      if (page !== undefined && limit !== undefined) {
        const skip = (page - 1) * limit;
        files = await FileUpload.find(query)
          .sort({ uploadProgress: 1, createdAt: -1 }) // ascending by progress, descending by time
          .skip(skip)
          .limit(limit)
          .populate('uploadedBy', 'username email');
      } else {
        files = await FileUpload.find(query)
          .sort({ uploadProgress: 1, createdAt: -1 })
          .populate('uploadedBy', 'username email');
      }

      return {
        data: files,
        count: files.length,
        page: page !== undefined ? parseInt(page) : undefined,
        total_count: totalCount,
      };
    } catch (error) {
      throw error;
    }
  }

  async getFileById(fileId) {
    try {
      const file = await FileUpload.findById(fileId).populate('uploadedBy', 'username email');
      
      if (!file) {
        throw new Error('File not found');
      }

      return file;
    } catch (error) {
      throw error;
    }
  }

  async deleteFile(fileId) {
    try {
      const file = await FileUpload.findById(fileId);
      
      if (!file) {
        throw new Error('File not found');
      }

      // Delete physical file
      if (file.filePath && fs.existsSync(file.filePath)) {
        fs.unlinkSync(file.filePath);
      }

      // Delete database record
      await FileUpload.findByIdAndDelete(fileId);

      return file;
    } catch (error) {
      throw error;
    }
  }

  async updateFile(fileId, updateData) {
    try {
      const file = await FileUpload.findById(fileId);
      
      if (!file) {
        throw new Error('File not found');
      }

      // Only allow updating certain fields
      const allowedFields = ['category', 'status'];
      
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          file[field] = updateData[field];
        }
      });

      await file.save();
      return file;
    } catch (error) {
      throw error;
    }
  }

  async getFileStats(userId = null) {
    try {
      const query = userId ? { uploadedBy: userId } : {};

      const totalFiles = await FileUpload.countDocuments(query);
      const totalSize = await FileUpload.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$fileSize' } } }
      ]);

      const categories = await FileUpload.aggregate([
        { $match: query },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]);

      return {
        totalFiles,
        totalSize: totalSize.length > 0 ? totalSize[0].total : 0,
        categories: categories.map(c => ({ category: c._id, count: c.count }))
      };
    } catch (error) {
      throw error;
    }
  }

  // Chunked Upload Methods
  async initializeChunkedUpload({ fileName, fileSize, totalChunks, mimeType, userId }) {
    try {
      // Generate unique upload ID
      const uploadId = crypto.randomBytes(16).toString('hex');
      
      // Create temporary directory for chunks
      const chunksDir = path.join(__dirname, '../../public/uploads/chunks', uploadId);
      if (!fs.existsSync(chunksDir)) {
        fs.mkdirSync(chunksDir, { recursive: true });
      }

      // Store upload session
      const session = {
        uploadId,
        fileName,
        fileSize,
        totalChunks,
        mimeType,
        userId,
        chunksDir,
        uploadedChunks: new Set(),
        createdAt: Date.now(),
      };

      uploadSessions.set(uploadId, session);

      // Auto-cleanup after 24 hours
      setTimeout(() => {
        this.cancelChunkedUpload(uploadId).catch(console.error);
      }, 24 * 60 * 60 * 1000);

      return {
        uploadId,
        totalChunks,
      };
    } catch (error) {
      throw error;
    }
  }

  async uploadChunk({ uploadId, chunkIndex, chunkPath }) {
    try {
      const session = uploadSessions.get(uploadId);
      
      if (!session) {
        // Clean up uploaded chunk
        if (fs.existsSync(chunkPath)) {
          fs.unlinkSync(chunkPath);
        }
        throw new Error('Upload session not found or expired');
      }

      // Move chunk to session directory with proper naming
      const chunkFileName = `chunk_${chunkIndex}`;
      const targetPath = path.join(session.chunksDir, chunkFileName);
      
      fs.renameSync(chunkPath, targetPath);
      
      // Mark chunk as uploaded
      session.uploadedChunks.add(chunkIndex);

      return {
        uploadId,
        chunkIndex,
        uploadedChunks: session.uploadedChunks.size,
        totalChunks: session.totalChunks,
      };
    } catch (error) {
      throw error;
    }
  }

  async finalizeChunkedUpload({ uploadId, userId, userName, category }) {
    try {
      const session = uploadSessions.get(uploadId);
      
      if (!session) {
        throw new Error('Upload session not found or expired');
      }

      if (session.userId.toString() !== userId.toString()) {
        throw new Error('Unauthorized');
      }

      // Check if all chunks are uploaded
      if (session.uploadedChunks.size !== session.totalChunks) {
        throw new Error(`Missing chunks. Expected ${session.totalChunks}, got ${session.uploadedChunks.size}`);
      }

      // Generate final file name and path
      const ext = path.extname(session.fileName);
      const nameWithoutExt = path.basename(session.fileName, ext);
      const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9_-]/g, '_');
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const finalFileName = sanitizedName + '-' + uniqueSuffix + ext;
      const finalPath = path.join(__dirname, '../../public/uploads', finalFileName);

      // Combine chunks into final file
      const writeStream = fs.createWriteStream(finalPath);
      
      for (let i = 0; i < session.totalChunks; i++) {
        const chunkPath = path.join(session.chunksDir, `chunk_${i}`);
        
        if (!fs.existsSync(chunkPath)) {
          throw new Error(`Chunk ${i} is missing`);
        }

        const chunkData = fs.readFileSync(chunkPath);
        writeStream.write(chunkData);
      }

      writeStream.end();

      // Wait for write to complete
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      // Verify file size
      const stats = fs.statSync(finalPath);
      if (stats.size !== session.fileSize) {
        fs.unlinkSync(finalPath);
        throw new Error(`File size mismatch. Expected ${session.fileSize}, got ${stats.size}`);
      }

      // Create file upload record
      // Always auto-detect category if not explicitly provided or if null
      const fileCategory = (category && category !== null) ? category : this.getCategoryFromMimeType(session.mimeType, session.fileName);
      const fileType = this.getFileTypeFromMimeType(session.mimeType, session.fileName);

      const fileUpload = new FileUpload({
        fileName: finalFileName,
        originalName: session.fileName,
        fileType: fileType,
        mimeType: session.mimeType,
        fileSize: session.fileSize,
        filePath: finalPath,
        category: fileCategory,
        uploadedBy: userId,
        uploadedByName: userName,
        status: 'completed',
        uploadProgress: 100,
      });

      await fileUpload.save();

      // Clean up chunks
      this.cleanupChunks(session.chunksDir);
      uploadSessions.delete(uploadId);

      return fileUpload;
    } catch (error) {
      // Clean up on error
      const session = uploadSessions.get(uploadId);
      if (session) {
        this.cleanupChunks(session.chunksDir);
        uploadSessions.delete(uploadId);
      }
      throw error;
    }
  }

  async cancelChunkedUpload(uploadId) {
    try {
      const session = uploadSessions.get(uploadId);
      
      if (session) {
        this.cleanupChunks(session.chunksDir);
        uploadSessions.delete(uploadId);
      }
    } catch (error) {
      console.error('Error cancelling chunked upload:', error);
      throw error;
    }
  }

  cleanupChunks(chunksDir) {
    try {
      if (fs.existsSync(chunksDir)) {
        const files = fs.readdirSync(chunksDir);
        files.forEach(file => {
          const filePath = path.join(chunksDir, file);
          fs.unlinkSync(filePath);
        });
        fs.rmdirSync(chunksDir);
      }
    } catch (error) {
      console.error('Error cleaning up chunks:', error);
    }
  }
}

module.exports = new FileUploadService();
