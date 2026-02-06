const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    trim: true,
    lowercase: true,
    // No enum restriction - allow dynamic roles
    validate: {
      validator: function(v) {
        // Only allow lowercase letters, numbers, and underscores
        return /^[a-z0-9_]+$/.test(v);
      },
      message: 'Role name can only contain lowercase letters, numbers, and underscores'
    }
  },
  displayName: {
    type: String,
    required: [true, 'Display name is required'],
  },
  description: {
    type: String,
    default: '',
  },
  permissions: {
    // Dashboard permissions
    dashboard: {
      canView: { type: Boolean, default: true },
      canViewWidgets: {
        type: [String],
        default: [],
        // Array of widget names that can be viewed
        // e.g., ['activeUsers', 'totalServers', 'containerStatus', 'systemHealth', 'recentActivity']
      },
      systemStatus: { type: Boolean, default: true }, // Always show
      realtimeMetrics: { type: Boolean, default: true }, // Always show
    },
    
    // Docker Monitor permissions
    dockerMonitor: {
      canView: { type: Boolean, default: false },
      canCreateContainer: { type: Boolean, default: false },
      containers: {
        canView: { type: Boolean, default: false },
        canStop: { type: Boolean, default: false },
        canRestart: { type: Boolean, default: false },
        canViewDetails: { type: Boolean, default: false },
        canViewActionHistory: { type: Boolean, default: false },
        canViewLogs: { type: Boolean, default: false },
        canRecreate: { type: Boolean, default: false },
        canOpenTerminal: { type: Boolean, default: false },
        canDelete: { type: Boolean, default: false },
        canLongPressSelect: { type: Boolean, default: false },
      },
      images: {
        canView: { type: Boolean, default: false },
        canPrune: { type: Boolean, default: false },
      },
    },
    
    // Servers Management permissions
    serversManagement: {
      canView: { type: Boolean, default: false },
      canAddNewServer: { type: Boolean, default: false },
      servers: {
        canView: { type: Boolean, default: false },
        canViewDetails: { type: Boolean, default: false },
        canEdit: { type: Boolean, default: false },
        canDeactivate: { type: Boolean, default: false },
      },
    },
    
    // File Upload permissions
    fileUpload: {
      canView: { type: Boolean, default: false },
      canUpload: { type: Boolean, default: false },
      canDelete: { type: Boolean, default: false },
      canDownload: { type: Boolean, default: false },
      canShare: { type: Boolean, default: false },
    },
    
    // User Management permissions
    userManagement: {
      canView: { type: Boolean, default: false },
      canAddNewUser: { type: Boolean, default: false },
      users: {
        canView: { type: Boolean, default: false },
        canEdit: { type: Boolean, default: false },
        canSetInactive: { type: Boolean, default: false },
        canSetActive: { type: Boolean, default: false },
        canResetPassword: { type: Boolean, default: false },
      },
    },
    
    // Documents permissions
    documents: {
      canView: { type: Boolean, default: false },
      canCreate: { type: Boolean, default: false },
      canEdit: { type: Boolean, default: false },
      canDelete: { type: Boolean, default: false },
    },
    
    // Settings permissions
    settings: {
      canView: { type: Boolean, default: false },
      canEdit: { type: Boolean, default: false },
    },
    
    // AI Chat permissions
    aiChat: {
      canView: { type: Boolean, default: false },
      canUse: { type: Boolean, default: false },
      allowedModels: {
        type: [String],
        default: [],
        // Array of model IDs that can be used
        // e.g., ['tinyllama:latest', 'deepseek-coder:1.3b', 'qwen2.5:3b']
        // Empty array means all models are allowed
      },
    },
    
    // Roles Management permissions
    roles: {
      canView: { type: Boolean, default: false },
      canCreate: { type: Boolean, default: false },
      canEdit: { type: Boolean, default: false },
      canDelete: { type: Boolean, default: false },
    },
    
    // Permissions Management permissions
    permissions: {
      canView: { type: Boolean, default: false },
      canAssign: { type: Boolean, default: false },
      canResetDefaults: { type: Boolean, default: false },
    },
    
    // Notifications
    notifications: {
      canReceiveNotif: { type: Boolean, default: true },
    },
  },
  isSystemRole: {
    type: Boolean,
    default: false,
    // System roles (superadmin, admin, user) cannot be deleted
  },
}, {
  timestamps: true,
});

// Prevent deletion of system roles
roleSchema.pre('remove', function(next) {
  if (this.isSystemRole) {
    return next(new Error('Cannot delete system roles'));
  }
  next();
});

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;
