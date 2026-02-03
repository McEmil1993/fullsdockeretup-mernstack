/**
 * Docker Action Log Model
 * Tracks all container and image actions (start, stop, restart, remove)
 */

const mongoose = require('mongoose')

const dockerActionLogSchema = new mongoose.Schema({
  // Action type
  action: {
    type: String,
    required: true,
    enum: ['start', 'stop', 'restart', 'remove'],
    index: true
  },
  
  // Target type
  targetType: {
    type: String,
    required: true,
    enum: ['container', 'image'],
    index: true
  },
  
  // Target details
  targetId: {
    type: String,
    required: true,
    index: true
  },
  
  targetName: {
    type: String,
    required: true
  },
  
  targetImage: {
    type: String // For containers, store the image name
  },
  
  // Action result
  success: {
    type: Boolean,
    required: true,
    default: true
  },
  
  errorMessage: {
    type: String
  },
  
  // User who performed the action (if authentication is implemented)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  userName: {
    type: String
  },
  
  // IP address
  ipAddress: {
    type: String
  },
  
  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
})

// Indexes for efficient querying
dockerActionLogSchema.index({ createdAt: -1 }) // Sort by date descending
dockerActionLogSchema.index({ targetType: 1, action: 1 }) // Filter by type and action
dockerActionLogSchema.index({ targetName: 1 }) // Search by name

// TTL index - automatically delete logs older than 90 days (optional)
// dockerActionLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }) // 90 days

module.exports = mongoose.model('DockerActionLog', dockerActionLogSchema)
