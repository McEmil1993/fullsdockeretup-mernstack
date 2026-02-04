import api from './api';

/**
 * Get user preferences
 */
export const getPreferences = async () => {
  const response = await api.get('/preferences');
  return response.data;
};

/**
 * Update user preferences
 */
export const updatePreferences = async (preferences) => {
  const response = await api.put('/preferences', preferences);
  return response.data;
};

/**
 * Update single preference field
 */
export const updatePreference = async (field, value) => {
  const response = await api.patch('/preferences', { field, value });
  return response.data;
};

/**
 * Delete user preferences
 */
export const deletePreferences = async () => {
  const response = await api.delete('/preferences');
  return response.data;
};
