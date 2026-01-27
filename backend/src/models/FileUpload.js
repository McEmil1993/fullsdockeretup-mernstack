const mongoose = require('mongoose');

const fileUploadSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: [true, 'File name is required'],
    trim: true,
  },
  originalName: {
    type: String,
    required: [true, 'Original file name is required'],
    trim: true,
  },
  fileType: {
    type: String,
    required: [true, 'File type is required'],
    trim: true,
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required'],
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required'],
  },
  filePath: {
    type: String,
    required: [true, 'File path is required'],
  },
  category: {
    type: String,
    enum: ['Documents', 'Reports', 'Images', 'Videos', 'Audio', 'Archives', 'Other'],
    default: 'Other',
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  uploadedByName: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'failed'],
    default: 'completed',
  },
  uploadProgress: {
    type: Number,
    default: 100,
    min: 0,
    max: 100,
  },
}, {
  timestamps: true,
});

// Index for better query performance
fileUploadSchema.index({ uploadedBy: 1, createdAt: -1 });
fileUploadSchema.index({ category: 1 });
fileUploadSchema.index({ fileName: 'text', originalName: 'text' });

const FileUpload = mongoose.model('FileUpload', fileUploadSchema);

module.exports = FileUpload;
