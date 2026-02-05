import api from './api';

/**
 * Send chat message to AI
 * @param {Array} messages - Array of message objects with role and content
 * @param {Object} options - Additional options (model, temperature, etc.)
 * @returns {Promise} - Response from the API
 */
export const chat = async (messages, options = {}) => {
  try {
    const response = await api.post('/api/ai/chat', {
      messages,
      options,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Send chat message with streaming response
 * @param {Array} messages - Array of message objects with role and content
 * @param {Function} onChunk - Callback for each chunk of response
 * @param {Object} options - Additional options (model, temperature, etc.)
 * @returns {Promise} - Resolves when stream completes
 */
export const chatStream = async (messages, onChunk, options = {}, abortSignal = null) => {
  try {
    const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';
    const response = await fetch(`${API_URL}/api/ai/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ messages, options }),
      signal: abortSignal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Stream response not ok:', response.status, errorText);
      throw new Error('Failed to start streaming chat');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (parsed.content) {
              onChunk(parsed.content);
            }
          } catch (e) {
            console.error('Error parsing chunk:', e, 'Line:', line);
          }
        }
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Stream was aborted by user');
      throw new Error('Generation stopped');
    }
    throw error;
  }
};

/**
 * Get available AI models
 * @returns {Promise} - List of available models
 */
export const getModels = async () => {
  try {
    const response = await api.get('/api/ai/models');
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Check AI service status
 * @returns {Promise} - Status of AI service
 */
export const checkStatus = async () => {
  try {
    const response = await api.get('/api/ai/status');
    return response;
  } catch (error) {
    throw error;
  }
};
