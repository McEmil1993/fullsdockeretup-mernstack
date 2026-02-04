const express = require('express');
const router = express.Router();
const dockerNotificationController = require('../controllers/dockerNotificationController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Notification operations
router.get('/', dockerNotificationController.getNotifications);
router.post('/', dockerNotificationController.createNotification);
router.patch('/:id/read', dockerNotificationController.markAsRead);
router.patch('/read-all', dockerNotificationController.markAllAsRead);
router.delete('/:id', dockerNotificationController.deleteNotification);
router.delete('/', dockerNotificationController.deleteAllNotifications);
router.delete('/old/cleanup', dockerNotificationController.deleteOldReadNotifications);

module.exports = router;
