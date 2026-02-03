import api from './api';

/**
 * Get all conversations for current user
 */
export const getConversations = async (options = {}) => {
  try {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit);
    if (options.skip) params.append('skip', options.skip);
    if (options.sort) params.append('sort', JSON.stringify(options.sort));

    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`/api/conversations${query}`);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Get a single conversation by ID
 */
export const getConversation = async (conversationId) => {
  try {
    const response = await api.get(`/api/conversations/${conversationId}`);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new conversation
 */
export const createConversation = async (data) => {
  try {
    const response = await api.post('/api/conversations', data);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Update conversation (title, messages, etc.)
 */
export const updateConversation = async (conversationId, updates) => {
  try {
    const response = await api.put(`/api/conversations/${conversationId}`, updates);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Add a message to conversation
 */
export const addMessage = async (conversationId, message) => {
  try {
    const response = await api.post(`/api/conversations/${conversationId}/messages`, message);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete conversation
 */
export const deleteConversation = async (conversationId) => {
  try {
    const response = await api.delete(`/api/conversations/${conversationId}`);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Get conversation count
 */
export const getConversationCount = async () => {
  try {
    const response = await api.get('/api/conversations/count');
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Search conversations
 */
export const searchConversations = async (searchTerm) => {
  try {
    const response = await api.get(`/api/conversations/search?q=${encodeURIComponent(searchTerm)}`);
    return response;
  } catch (error) {
    throw error;
  }
};
