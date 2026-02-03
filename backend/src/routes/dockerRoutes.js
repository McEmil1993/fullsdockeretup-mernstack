const express = require('express');
const router = express.Router();
const dockerController = require('../controllers/dockerController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Images routes
router.get('/images', dockerController.getAllImages);
router.delete('/images/:id', dockerController.removeImage);
router.post('/images/prune', dockerController.pruneImages);

// Containers routes
router.get('/containers', dockerController.getAllContainers);
router.get('/containers/running', dockerController.getRunningContainers);
router.get('/containers/:id/stats', dockerController.getContainerStats);
router.get('/containers/:id/logs', dockerController.getContainerLogs);
router.get('/containers/:id/inspect', dockerController.inspectContainer);

// Container actions
router.post('/containers/:id/restart', dockerController.restartContainer);
router.post('/containers/:id/stop', dockerController.stopContainer);
router.post('/containers/:id/start', dockerController.startContainer);
router.post('/containers/:id/recreate', dockerController.recreateContainer);
router.delete('/containers/:id', dockerController.removeContainer);
router.post('/containers/:serviceName/rebuild', dockerController.rebuildContainer);

// Container bash history
router.get('/containers/:id/bash-history', dockerController.getContainerBashHistory);

// Stats routes
router.get('/stats', dockerController.getAllContainerStats);

// System routes
router.get('/system/info', dockerController.getSystemInfo);
router.get('/system/disk-usage', dockerController.getDiskUsage);

module.exports = router;
