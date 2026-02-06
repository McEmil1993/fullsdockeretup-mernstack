const Role = require('../models/Role');
const User = require('../models/User');

class RoleService {
  // Get all roles
  async getAllRoles() {
    return await Role.find().sort({ createdAt: 1 });
  }

  // Get role by name
  async getRoleByName(name) {
    return await Role.findOne({ name });
  }

  // Get role by ID
  async getRoleById(id) {
    return await Role.findById(id);
  }

  // Create or update a role
  async createOrUpdateRole(name, roleData) {
    const existingRole = await Role.findOne({ name });
    
    if (existingRole) {
      // Update existing role
      Object.assign(existingRole, roleData);
      return await existingRole.save();
    } else {
      // Create new role
      const role = new Role({
        name,
        ...roleData,
      });
      return await role.save();
    }
  }

  // Update role permissions
  async updateRolePermissions(name, permissions) {
    const role = await Role.findOne({ name });
    
    if (!role) {
      throw new Error('Role not found');
    }

    // Deep merge permissions - properly handle nested objects
    const deepMerge = (target, source) => {
      const output = { ...target };
      
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          // Recursively merge nested objects
          output[key] = deepMerge(target[key] || {}, source[key]);
        } else {
          // Direct assignment for primitives and arrays
          output[key] = source[key];
        }
      }
      
      return output;
    };

    role.permissions = deepMerge(role.permissions || {}, permissions);
    role.markModified('permissions'); // Important: tell Mongoose the nested object changed

    return await role.save();
  }

  // Update role details (displayName, description)
  async updateRole(name, roleData) {
    const role = await Role.findOne({ name });
    
    if (!role) {
      throw new Error('Role not found');
    }

    // Update only displayName and description
    if (roleData.displayName) {
      role.displayName = roleData.displayName;
    }
    if (roleData.description !== undefined) {
      role.description = roleData.description;
    }

    return await role.save();
  }

  // Delete role (only non-system roles)
  async deleteRole(name) {
    const role = await Role.findOne({ name });
    
    if (!role) {
      throw new Error('Role not found');
    }

    if (role.isSystemRole) {
      throw new Error('Cannot delete system roles');
    }

    // Check if any users have this role
    const usersWithRole = await User.countDocuments({ role: name });
    if (usersWithRole > 0) {
      throw new Error(`Cannot delete role: ${usersWithRole} user(s) still assigned to this role`);
    }

    await Role.deleteOne({ name });
    return { message: 'Role deleted successfully' };
  }

  // Get user permissions by user ID
  async getUserPermissions(userId) {
    const user = await User.findById(userId).select('role');
    
    if (!user) {
      throw new Error('User not found');
    }

    const role = await Role.findOne({ name: user.role });
    
    if (!role) {
      throw new Error('Role not found');
    }

    return {
      role: user.role,
      permissions: role.permissions,
    };
  }

  // Check if user has specific permission
  async checkPermission(userId, permissionKey) {
    const userPermissions = await this.getUserPermissions(userId);
    
    // Parse permission key (e.g., 'dockerMonitor.canCreateContainer')
    const keys = permissionKey.split('.');
    let permission = userPermissions.permissions;
    
    for (const key of keys) {
      if (permission && typeof permission === 'object' && key in permission) {
        permission = permission[key];
      } else {
        return false;
      }
    }
    
    return permission === true;
  }

  // Initialize default roles
  async initializeDefaultRoles() {
    // Super Admin - Full access
    await this.createOrUpdateRole('superadmin', {
      displayName: 'Super Admin',
      description: 'Full system access',
      isSystemRole: true,
      permissions: {
        dashboard: {
          canView: true,
          canViewWidgets: ['activeUsers', 'totalServers', 'containerStatus', 'systemHealth', 'recentActivity'],
          systemStatus: true,
          realtimeMetrics: true,
        },
        dockerMonitor: {
          canView: true,
          canCreateContainer: true,
          containers: {
            canView: true,
            canStop: true,
            canRestart: true,
            canViewDetails: true,
            canViewActionHistory: true,
            canViewLogs: true,
            canRecreate: true,
            canOpenTerminal: true,
            canDelete: true,
            canLongPressSelect: true,
          },
          images: {
            canView: true,
            canPrune: true,
          },
        },
        serversManagement: {
          canView: true,
          canAddNewServer: true,
          servers: {
            canView: true,
            canViewDetails: true,
            canEdit: true,
            canDeactivate: true,
          },
        },
        fileUpload: {
          canView: true,
          canUpload: true,
          canDelete: true,
          canDownload: true,
          canShare: true,
        },
        userManagement: {
          canView: true,
          canAddNewUser: true,
          users: {
            canView: true,
            canEdit: true,
            canSetInactive: true,
            canSetActive: true,
            canResetPassword: true,
          },
        },
        documents: {
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true,
        },
        settings: {
          canView: true,
          canEdit: true,
        },
        aiChat: {
          canView: true,
          canUse: true,
          allowedModels: [],
        },
        roles: {
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true,
        },
        permissions: {
          canView: true,
          canAssign: true,
          canResetDefaults: true,
        },
        notifications: {
          canReceiveNotif: true,
        },
      },
    });

    // Admin - Most access except some critical features
    await this.createOrUpdateRole('admin', {
      displayName: 'Admin',
      description: 'Administrative access',
      isSystemRole: true,
      permissions: {
        dashboard: {
          canView: true,
          canViewWidgets: ['activeUsers', 'totalServers', 'containerStatus', 'systemHealth', 'recentActivity'],
          systemStatus: true,
          realtimeMetrics: true,
        },
        dockerMonitor: {
          canView: true,
          canCreateContainer: true,
          containers: {
            canView: true,
            canStop: true,
            canRestart: true,
            canViewDetails: true,
            canViewActionHistory: true,
            canViewLogs: true,
            canRecreate: true,
            canOpenTerminal: false,
            canDelete: false,
            canLongPressSelect: true,
          },
          images: {
            canView: true,
            canPrune: false,
          },
        },
        serversManagement: {
          canView: true,
          canAddNewServer: true,
          servers: {
            canView: true,
            canViewDetails: true,
            canEdit: true,
            canDeactivate: false,
          },
        },
        fileUpload: {
          canView: true,
          canUpload: true,
          canDelete: true,
          canDownload: true,
          canShare: true,
        },
        userManagement: {
          canView: true,
          canAddNewUser: true,
          users: {
            canView: true,
            canEdit: true,
            canSetInactive: true,
            canSetActive: true,
            canResetPassword: true,
          },
        },
        documents: {
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true,
        },
        settings: {
          canView: true,
          canEdit: false,
        },
        aiChat: {
          canView: true,
          canUse: true,
          allowedModels: [],
        },
        roles: {
          canView: true,
          canCreate: false,
          canEdit: true,
          canDelete: false,
        },
        permissions: {
          canView: true,
          canAssign: true,
          canResetDefaults: false,
        },
        notifications: {
          canReceiveNotif: true,
        },
      },
    });

    // User - Limited access
    await this.createOrUpdateRole('user', {
      displayName: 'User',
      description: 'Basic user access',
      isSystemRole: true,
      permissions: {
        dashboard: {
          canView: true,
          canViewWidgets: ['systemHealth', 'recentActivity'],
          systemStatus: true,
          realtimeMetrics: true,
        },
        dockerMonitor: {
          canView: true,
          canCreateContainer: false,
          containers: {
            canView: true,
            canStop: false,
            canRestart: false,
            canViewDetails: true,
            canViewActionHistory: true,
            canViewLogs: true,
            canRecreate: false,
            canOpenTerminal: false,
            canDelete: false,
            canLongPressSelect: false,
          },
          images: {
            canView: true,
            canPrune: false,
          },
        },
        serversManagement: {
          canView: true,
          canAddNewServer: false,
          servers: {
            canView: true,
            canViewDetails: true,
            canEdit: false,
            canDeactivate: false,
          },
        },
        fileUpload: {
          canView: true,
          canUpload: true,
          canDelete: false,
          canDownload: true,
          canShare: false,
        },
        userManagement: {
          canView: false,
          canAddNewUser: false,
          users: {
            canView: false,
            canEdit: false,
            canSetInactive: false,
            canSetActive: false,
            canResetPassword: false,
          },
        },
        documents: {
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: false,
        },
        settings: {
          canView: false,
          canEdit: false,
        },
        aiChat: {
          canView: true,
          canUse: true,
          allowedModels: [],
        },
        roles: {
          canView: false,
          canCreate: false,
          canEdit: false,
          canDelete: false,
        },
        permissions: {
          canView: false,
          canAssign: false,
          canResetDefaults: false,
        },
        notifications: {
          canReceiveNotif: true,
        },
      },
    });

    return { message: 'Default roles initialized successfully' };
  }
}

module.exports = new RoleService();
