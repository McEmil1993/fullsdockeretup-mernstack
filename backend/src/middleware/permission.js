const roleService = require('../services/roleService');

// Middleware to check if user has required permission
const requirePermission = (permissionKey) => {
  return async (req, res, next) => {
    try {
      const userId = req.userId; // From auth middleware
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
      }

      const hasPermission = await roleService.checkPermission(userId, permissionKey);
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this resource',
          requiredPermission: permissionKey,
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking permissions',
      });
    }
  };
};

// Middleware to check if user has any of the required permissions
const requireAnyPermission = (permissionKeys) => {
  return async (req, res, next) => {
    try {
      const userId = req.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
      }

      let hasAnyPermission = false;
      for (const permissionKey of permissionKeys) {
        const hasPermission = await roleService.checkPermission(userId, permissionKey);
        if (hasPermission) {
          hasAnyPermission = true;
          break;
        }
      }
      
      if (!hasAnyPermission) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this resource',
          requiredPermissions: permissionKeys,
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking permissions',
      });
    }
  };
};

// Middleware to check if user has all of the required permissions
const requireAllPermissions = (permissionKeys) => {
  return async (req, res, next) => {
    try {
      const userId = req.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
      }

      for (const permissionKey of permissionKeys) {
        const hasPermission = await roleService.checkPermission(userId, permissionKey);
        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to access this resource',
            requiredPermission: permissionKey,
          });
        }
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking permissions',
      });
    }
  };
};

// Middleware to attach user permissions to request
const attachPermissions = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return next();
    }

    const userPermissions = await roleService.getUserPermissions(userId);
    req.permissions = userPermissions.permissions;
    req.userRole = userPermissions.role;
    
    next();
  } catch (error) {
    // Continue without permissions if there's an error
    next();
  }
};

module.exports = {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  attachPermissions,
};
