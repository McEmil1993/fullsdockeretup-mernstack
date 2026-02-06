const DockerNotification = require('../models/DockerNotification');
const DockerActionLog = require('../models/DockerActionLog');

class DockerNotificationService {
  /**
   * Get notifications for a user
   */
  async getNotifications(userId, options = {}) {
    try {
      const { limit = 50, skip = 0, unreadOnly = false } = options;
      
      const query = { userId };
      if (unreadOnly) {
        query.isRead = false;
      }
      
      const notifications = await DockerNotification.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);
      
      const total = await DockerNotification.countDocuments(query);
      const unreadCount = await DockerNotification.countDocuments({ userId, isRead: false });
      
      return {
        notifications,
        total,
        unreadCount,
        limit,
        skip
      };
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  /**
   * Create notification
   */
  async createNotification(userId, data) {
    try {
      // Try to get user info from recent Docker action logs
      let actionBy = data.actionBy || 'Admin';
      let actionByUserId = data.actionByUserId || null;
      
      if (!data.actionBy && data.containerName) {
        // Look up the most recent action for this container
        const recentAction = await DockerActionLog.findOne({
          targetName: data.containerName,
          targetType: 'container'
        }).sort({ createdAt: -1 }).limit(1);
        
        if (recentAction && recentAction.userName) {
          actionBy = recentAction.userName;
          actionByUserId = recentAction.userId;
          console.log(`Found action by ${actionBy} for container ${data.containerName}`);
        }
      }
      
      const notification = await DockerNotification.create({
        userId,
        message: data.message,
        type: data.type || 'info',
        containerId: data.containerId || null,
        containerName: data.containerName || null,
        actionBy,
        actionByUserId
      });
      
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(userId, notificationId) {
    try {
      const notification = await DockerNotification.findOneAndUpdate(
        { _id: notificationId, userId },
        { 
          $set: { 
            isRead: true,
            readAt: new Date()
          } 
        },
        { new: true }
      );
      
      if (!notification) {
        throw new Error('Notification not found');
      }
      
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    try {
      const result = await DockerNotification.updateMany(
        { userId, isRead: false },
        { 
          $set: { 
            isRead: true,
            readAt: new Date()
          } 
        }
      );
      
      return result.modifiedCount;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(userId, notificationId) {
    try {
      const notification = await DockerNotification.findOneAndDelete({
        _id: notificationId,
        userId
      });
      
      if (!notification) {
        throw new Error('Notification not found');
      }
      
      return notification;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllNotifications(userId) {
    try {
      const result = await DockerNotification.deleteMany({ userId });
      return result.deletedCount;
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  }

  /**
   * Delete old read notifications
   */
  async deleteOldReadNotifications(userId, daysOld = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const result = await DockerNotification.deleteMany({
        userId,
        isRead: true,
        readAt: { $lte: cutoffDate }
      });
      
      return result.deletedCount;
    } catch (error) {
      console.error('Error deleting old notifications:', error);
      throw error;
    }
  }
}

module.exports = new DockerNotificationService();
