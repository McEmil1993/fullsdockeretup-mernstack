const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get all roles
router.get('/', roleController.getAllRoles);

// Get user's permissions
router.get('/my-permissions', roleController.getUserPermissions);

// Check specific permission
router.post('/check-permission', roleController.checkPermission);

// Initialize default roles (should be protected in production)
router.post('/initialize', roleController.initializeDefaultRoles);

// Get role by name
router.get('/:name', roleController.getRoleByName);

// Create or update role
router.post('/', roleController.createOrUpdateRole);

// Update role details
router.put('/:name', roleController.updateRole);

// Update role permissions
router.put('/:name/permissions', roleController.updateRolePermissions);

// Delete role
router.delete('/:name', roleController.deleteRole);

module.exports = router;
