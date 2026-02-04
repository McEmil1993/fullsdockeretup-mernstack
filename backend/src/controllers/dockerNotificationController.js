const dockerNotificationService = require('../services/dockerNotificationService');

/**
 * Get notifications for the logged-in user
 */
exports.getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit, skip, unreadOnly } = req.query;
    
    const options = {
      limit: parseInt(limit) || 50,
      skip: parseInt(skip) || 0,
      unreadOnly: unreadOnly === 'true'
    };
    
    const result = await dockerNotificationService.getNotifications(userId, options);
    
    res.status(200).json({
      success: true,
      data: result.notifications,
      unreadCount: result.unreadCount,
      pagination: {
        total: result.total,
        limit: result.limit,
        skip: result.skip
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create notification
 */
exports.createNotification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = req.body;
    
    const notification = await dockerNotificationService.createNotification(userId, data);
    
    res.status(201).json({
      success: true,
      data: notification,
      message: 'Notification created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark notification as read
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const notification = await dockerNotificationService.markAsRead(userId, id);
    
    res.status(200).json({
      success: true,
      data: notification,
      message: 'Notification marked as read'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read
 */
exports.markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const count = await dockerNotificationService.markAllAsRead(userId);
    
    res.status(200).json({
      success: true,
      message: `${count} notifications marked as read`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete notification
 */
exports.deleteNotification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    await dockerNotificationService.deleteNotification(userId, id);
    
    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete all notifications
 */
exports.deleteAllNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const count = await dockerNotificationService.deleteAllNotifications(userId);
    
    res.status(200).json({
      success: true,
      message: `${count} notifications deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete old read notifications
 */
exports.deleteOldReadNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { daysOld } = req.query;
    
    const count = await dockerNotificationService.deleteOldReadNotifications(
      userId,
      parseInt(daysOld) || 7
    );
    
    res.status(200).json({
      success: true,
      message: `${count} old notifications deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};
