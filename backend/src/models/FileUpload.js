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
  // Sharing feature with granular permissions
  sharedWith: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sharedAt: {
      type: Date,
      default: Date.now
    },
    permissions: {
      canView: {
        type: Boolean,
        default: true  // Always true - must see the file
      },
      canDownload: {
        type: Boolean,
        default: false
      },
      canCopyLink: {
        type: Boolean,
        default: false
      },
      canShare: {
        type: Boolean,
        default: false  // Share with others
      },
      canDelete: {
        type: Boolean,
        default: false  // DANGEROUS - owner only usually
      }
    }
  }],
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
});

// Index for better query performance
fileUploadSchema.index({ uploadedBy: 1, createdAt: -1 });
fileUploadSchema.index({ 'sharedWith.userId': 1 });
fileUploadSchema.index({ category: 1 });
fileUploadSchema.index({ fileName: 'text', originalName: 'text' });

const FileUpload = mongoose.model('FileUpload', fileUploadSchema);

module.exports = FileUpload;
