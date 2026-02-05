const permissionService = require('../services/permissionService');

class PermissionController {
  // Get all permissions
  async getAllPermissions(req, res) {
    try {
      const permissions = await permissionService.getAllPermissions();
      
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

  // Get permissions by module
  async getPermissionsByModule(req, res) {
    try {
      const { module } = req.params;
      const permissions = await permissionService.getPermissionsByModule(module);
      
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

  // Initialize default permissions
  async initializeDefaultPermissions(req, res) {
    try {
      const result = await permissionService.initializeDefaultPermissions();
      
      res.status(200).json({
        success: true,
        message: result.message,
        count: result.count,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new PermissionController();
