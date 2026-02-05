const Permission = require('../models/Permission');

class PermissionService {
  // Get all permissions
  async getAllPermissions() {
    return await Permission.find().sort({ module: 1, category: 1 });
  }

  // Get permissions by module
  async getPermissionsByModule(module) {
    return await Permission.find({ module }).sort({ category: 1 });
  }

  // Initialize default permissions catalog
  async initializeDefaultPermissions() {
    const permissions = [
      // Dashboard permissions
      { key: 'dashboard.canView', module: 'dashboard', name: 'View Dashboard', category: 'view', description: 'Access to dashboard page' },
      { key: 'dashboard.canViewWidgets', module: 'dashboard', name: 'View Widgets', category: 'view', description: 'Select which widgets to display' },
      { key: 'dashboard.systemStatus', module: 'dashboard', name: 'System Status', category: 'view', description: 'Always visible system status', isAlwaysVisible: true },
      { key: 'dashboard.realtimeMetrics', module: 'dashboard', name: 'Real-time Metrics', category: 'view', description: 'Always visible container metrics', isAlwaysVisible: true },
      
      // Docker Monitor permissions
      { key: 'dockerMonitor.canView', module: 'dockerMonitor', name: 'View Docker Monitor', category: 'view', description: 'Access to Docker Monitor page' },
      { key: 'dockerMonitor.canCreateContainer', module: 'dockerMonitor', name: 'Create Container', category: 'containers', description: 'Create new containers' },
      { key: 'dockerMonitor.containers.canView', module: 'dockerMonitor', name: 'View Containers', category: 'containers', description: 'View container list' },
      { key: 'dockerMonitor.containers.canStop', module: 'dockerMonitor', name: 'Stop Container', category: 'containers', description: 'Stop running containers' },
      { key: 'dockerMonitor.containers.canRestart', module: 'dockerMonitor', name: 'Restart Container', category: 'containers', description: 'Restart containers' },
      { key: 'dockerMonitor.containers.canViewDetails', module: 'dockerMonitor', name: 'View Container Details', category: 'containers', description: 'View detailed container information' },
      { key: 'dockerMonitor.containers.canViewActionHistory', module: 'dockerMonitor', name: 'View Action History', category: 'containers', description: 'View container action history' },
      { key: 'dockerMonitor.containers.canViewLogs', module: 'dockerMonitor', name: 'View Container Logs', category: 'containers', description: 'View container logs' },
      { key: 'dockerMonitor.containers.canRecreate', module: 'dockerMonitor', name: 'Recreate Container', category: 'containers', description: 'Recreate containers' },
      { key: 'dockerMonitor.containers.canOpenTerminal', module: 'dockerMonitor', name: 'Open Terminal', category: 'containers', description: 'Open container terminal' },
      { key: 'dockerMonitor.containers.canDelete', module: 'dockerMonitor', name: 'Delete Container', category: 'containers', description: 'Delete containers' },
      { key: 'dockerMonitor.containers.canLongPressSelect', module: 'dockerMonitor', name: 'Long Press Select', category: 'containers', description: 'Long press to select multiple containers' },
      { key: 'dockerMonitor.images.canView', module: 'dockerMonitor', name: 'View Images', category: 'images', description: 'View Docker images' },
      { key: 'dockerMonitor.images.canPrune', module: 'dockerMonitor', name: 'Prune Images', category: 'images', description: 'Remove unused images' },
      
      // Servers Management permissions
      { key: 'serversManagement.canView', module: 'serversManagement', name: 'View Servers', category: 'view', description: 'Access to Servers page' },
      { key: 'serversManagement.canAddNewServer', module: 'serversManagement', name: 'Add New Server', category: 'servers', description: 'Add new servers' },
      { key: 'serversManagement.servers.canView', module: 'serversManagement', name: 'View Server List', category: 'servers', description: 'View server list' },
      { key: 'serversManagement.servers.canViewDetails', module: 'serversManagement', name: 'View Server Details', category: 'servers', description: 'View detailed server information' },
      { key: 'serversManagement.servers.canEdit', module: 'serversManagement', name: 'Edit Server', category: 'servers', description: 'Edit server details' },
      { key: 'serversManagement.servers.canDeactivate', module: 'serversManagement', name: 'Deactivate Server', category: 'servers', description: 'Deactivate servers' },
      
      // File Upload permissions
      { key: 'fileUpload.canView', module: 'fileUpload', name: 'View File Upload', category: 'view', description: 'Access to File Upload page' },
      { key: 'fileUpload.canUpload', module: 'fileUpload', name: 'Upload Files', category: 'edit', description: 'Upload new files' },
      { key: 'fileUpload.canDelete', module: 'fileUpload', name: 'Delete Files', category: 'delete', description: 'Delete files' },
      { key: 'fileUpload.canDownload', module: 'fileUpload', name: 'Download Files', category: 'view', description: 'Download files' },
      { key: 'fileUpload.canShare', module: 'fileUpload', name: 'Share Files', category: 'edit', description: 'Share files with others' },
      
      // User Management permissions
      { key: 'userManagement.canView', module: 'userManagement', name: 'View Users', category: 'view', description: 'Access to User Management page' },
      { key: 'userManagement.canAddNewUser', module: 'userManagement', name: 'Add New User', category: 'users', description: 'Add new users' },
      { key: 'userManagement.users.canView', module: 'userManagement', name: 'View User List', category: 'users', description: 'View user list' },
      { key: 'userManagement.users.canEdit', module: 'userManagement', name: 'Edit User', category: 'users', description: 'Edit user details' },
      { key: 'userManagement.users.canSetInactive', module: 'userManagement', name: 'Deactivate User', category: 'users', description: 'Set user to inactive' },
      { key: 'userManagement.users.canSetActive', module: 'userManagement', name: 'Activate User', category: 'users', description: 'Set user to active' },
      { key: 'userManagement.users.canResetPassword', module: 'userManagement', name: 'Reset Password', category: 'users', description: 'Reset user password' },
      
      // Documents permissions
      { key: 'documents.canView', module: 'documents', name: 'View Documents', category: 'view', description: 'Access to Documents page' },
      { key: 'documents.canCreate', module: 'documents', name: 'Create Document', category: 'edit', description: 'Create new documents' },
      { key: 'documents.canEdit', module: 'documents', name: 'Edit Document', category: 'edit', description: 'Edit documents' },
      { key: 'documents.canDelete', module: 'documents', name: 'Delete Document', category: 'delete', description: 'Delete documents' },
      
      // Settings permissions
      { key: 'settings.canView', module: 'settings', name: 'View Settings', category: 'view', description: 'Access to Settings page' },
      { key: 'settings.canEdit', module: 'settings', name: 'Edit Settings', category: 'edit', description: 'Modify system settings' },
      
      // AI Chat permissions
      { key: 'aiChat.canView', module: 'aiChat', name: 'View AI Chat', category: 'view', description: 'Access to AI Chat page' },
      { key: 'aiChat.canUse', module: 'aiChat', name: 'Use AI Chat', category: 'edit', description: 'Use AI Chat functionality' },
      
      // Roles Management permissions
      { key: 'roles.canView', module: 'roles', name: 'View Roles', category: 'view', description: 'Access to Roles Management page' },
      { key: 'roles.canCreate', module: 'roles', name: 'Create Role', category: 'edit', description: 'Create new roles' },
      { key: 'roles.canEdit', module: 'roles', name: 'Edit Role', category: 'edit', description: 'Edit existing roles' },
      { key: 'roles.canDelete', module: 'roles', name: 'Delete Role', category: 'delete', description: 'Delete roles' },
      
      // Permissions Management permissions
      { key: 'permissions.canView', module: 'permissions', name: 'View Permissions', category: 'view', description: 'Access to Permissions Management page' },
      { key: 'permissions.canAssign', module: 'permissions', name: 'Assign Permissions', category: 'edit', description: 'Assign permissions to roles' },
      { key: 'permissions.canResetDefaults', module: 'permissions', name: 'Reset to Defaults', category: 'edit', description: 'Reset permissions to default values' },
      
      // Notifications permissions
      { key: 'notifications.canReceiveNotif', module: 'notifications', name: 'Receive Notifications', category: 'view', description: 'Receive system notifications' },
    ];

    // Upsert permissions
    for (const perm of permissions) {
      await Permission.findOneAndUpdate(
        { key: perm.key },
        perm,
        { upsert: true, new: true }
      );
    }

    return { message: 'Default permissions initialized successfully', count: permissions.length };
  }
}

module.exports = new PermissionService();
