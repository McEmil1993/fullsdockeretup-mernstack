import api from './api';

/**
 * Get notifications
 */
export const getNotifications = async (options = {}) => {
  const { limit = 50, skip = 0, unreadOnly = false } = options;
  const response = await api.get('/notifications', {
    params: { limit, skip, unreadOnly }
  });
  return response.data;
};

/**
 * Create notification
 */
export const createNotification = async (data) => {
  const response = await api.post('/notifications', data);
  return response.data;
};

/**
 * Mark notification as read
 */
export const markAsRead = async (id) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async () => {
  const response = await api.patch('/notifications/read-all');
  return response.data;
};

/**
 * Delete notification
 */
export const deleteNotification = async (id) => {
  const response = await api.delete(`/notifications/${id}`);
  return response.data;
};

/**
 * Delete all notifications
 */
export const deleteAllNotifications = async () => {
  const response = await api.delete('/notifications');
  return response.data;
};

/**
 * Delete old read notifications
 */
export const deleteOldReadNotifications = async (daysOld = 7) => {
  const response = await api.delete('/notifications/old/cleanup', {
    params: { daysOld }
  });
  return response.data;
};
