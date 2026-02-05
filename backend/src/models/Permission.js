const mongoose = require('mongoose');

// Permission template schema for defining available permissions
const permissionSchema = new mongoose.Schema({
  key: {
    type: String,
    required: [true, 'Permission key is required'],
    unique: true,
    trim: true,
    // e.g., 'dashboard.canView', 'dockerMonitor.canCreateContainer'
  },
  module: {
    type: String,
    required: [true, 'Module is required'],
    enum: [
      'dashboard',
      'dockerMonitor',
      'serversManagement',
      'fileUpload',
      'userManagement',
      'documents',
      'settings',
      'aiChat',
      'roles',
      'permissions',
      'notifications'
    ],
  },
  name: {
    type: String,
    required: [true, 'Permission name is required'],
    // Human-readable name
  },
  description: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    default: 'general',
    // e.g., 'view', 'edit', 'delete', 'containers', 'images'
  },
  isAlwaysVisible: {
    type: Boolean,
    default: false,
    // For permissions like systemStatus that are always shown
  },
}, {
  timestamps: true,
});

const Permission = mongoose.model('Permission', permissionSchema);

module.exports = Permission;
