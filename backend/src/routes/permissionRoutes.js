const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get all permissions
router.get('/', permissionController.getAllPermissions);

// Initialize default permissions (should be protected in production)
router.post('/initialize', permissionController.initializeDefaultPermissions);

// Get permissions by module
router.get('/module/:module', permissionController.getPermissionsByModule);

module.exports = router;
