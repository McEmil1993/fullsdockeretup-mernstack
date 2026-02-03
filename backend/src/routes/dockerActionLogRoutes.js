/**
 * Docker Action Log Routes
 */

const express = require('express');
const router = express.Router();
const dockerActionLogController = require('../controllers/dockerActionLogController');
const { authenticate } = require('../middleware/auth');

// Authentication required for logs
router.use(authenticate);

// Get all action logs with filters
router.get('/', dockerActionLogController.getActionLogs);

// Get recent logs
router.get('/recent', dockerActionLogController.getRecentLogs);

// Get logs for specific container
router.get('/container/:id', dockerActionLogController.getContainerLogs);

// Get action statistics
router.get('/stats', dockerActionLogController.getActionStats);

// Delete old logs (admin only)
router.delete('/cleanup', dockerActionLogController.deleteOldLogs);

module.exports = router;
