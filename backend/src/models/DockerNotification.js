const mongoose = require('mongoose');

const dockerNotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'critical'],
    default: 'info'
  },
  containerId: {
    type: String,
    default: null
  },
  containerName: {
    type: String,
    default: null
  },
  actionBy: {
    type: String,
    default: 'Admin'
  },
  actionByUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
}, {
  timestamps: true,
});

// Index for faster queries
dockerNotificationSchema.index({ userId: 1, createdAt: -1 });
dockerNotificationSchema.index({ userId: 1, isRead: 1 });

// Auto-delete old notifications after 30 days
dockerNotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('DockerNotification', dockerNotificationSchema);
