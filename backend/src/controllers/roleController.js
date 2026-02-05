const roleService = require('../services/roleService');

class RoleController {
  // Get all roles
  async getAllRoles(req, res) {
    try {
      const roles = await roleService.getAllRoles();
      
      res.status(200).json({
        success: true,
        data: roles,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get role by name
  async getRoleByName(req, res) {
    try {
      const { name } = req.params;
      const role = await roleService.getRoleByName(name);
      
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found',
        });
      }
      
      res.status(200).json({
        success: true,
        data: role,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Create or update role
  async createOrUpdateRole(req, res) {
    try {
      const { name, displayName, description, permissions } = req.body;
      
      if (!name || !displayName) {
        return res.status(400).json({
          success: false,
          message: 'Name and display name are required',
        });
      }
      
      const role = await roleService.createOrUpdateRole(name, {
        displayName,
        description,
        permissions,
      });
      
      res.status(200).json({
        success: true,
        message: 'Role saved successfully',
        data: role,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Update role details (displayName, description)
  async updateRole(req, res) {
    try {
      const { name } = req.params;
      const { displayName, description } = req.body;
      
      if (!displayName) {
        return res.status(400).json({
          success: false,
          message: 'Display name is required',
        });
      }
      
      const role = await roleService.updateRole(name, {
        displayName,
        description,
      });
      
      res.status(200).json({
        success: true,
        message: 'Role updated successfully',
        data: role,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Update role permissions
  async updateRolePermissions(req, res) {
    try {
      const { name } = req.params;
      const { permissions } = req.body;
      
      if (!permissions) {
        return res.status(400).json({
          success: false,
          message: 'Permissions are required',
        });
      }
      
      const role = await roleService.updateRolePermissions(name, permissions);
      
      res.status(200).json({
        success: true,
        message: 'Permissions updated successfully',
        data: role,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Delete role
  async deleteRole(req, res) {
    try {
      const { name } = req.params;
      
      const result = await roleService.deleteRole(name);
      
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get user permissions
  async getUserPermissions(req, res) {
    try {
      const userId = req.userId; // From auth middleware
      
      const permissions = await roleService.getUserPermissions(userId);
      
      res.status(200).json({
        success: true,
        data: permissions,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Check specific permission
  async checkPermission(req, res) {
    try {
      const userId = req.userId; // From auth middleware
      const { permission } = req.body;
      
      if (!permission) {
        return res.status(400).json({
          success: false,
          message: 'Permission key is required',
        });
      }
      
      const hasPermission = await roleService.checkPermission(userId, permission);
      
      res.status(200).json({
        success: true,
        data: { hasPermission },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Initialize default roles
  async initializeDefaultRoles(req, res) {
    try {
      const result = await roleService.initializeDefaultRoles();
      
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new RoleController();
