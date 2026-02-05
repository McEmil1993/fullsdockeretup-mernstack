const axios = require('axios');

// Ollama API configuration
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'deepseek-coder:6.7b';

/**
 * Chat with Ollama AI
 * @param {Array} messages - Array of message objects with role and content
 * @param {Object} options - Additional options for the API call
 * @returns {Promise<Object>} - Response from Ollama
 */
const chat = async (messages, options = {}) => {
  try {
    const {
      model = OLLAMA_MODEL,
      temperature = 0.7,
    } = options;

    console.log("model", model);

    // Build the prompt from messages
    let prompt = '';
    for (const msg of messages) {
      if (msg.role === 'user') {
        prompt += `User: ${msg.content}\n`;
      } else if (msg.role === 'assistant') {
        prompt += `Assistant: ${msg.content}\n`;
      }
    }
    prompt += 'Assistant: ';

    // Call Ollama API (non-streaming)
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
      model: model,
      prompt: prompt,
      stream: false,
      options: {
        temperature: temperature,
      }
    });

    return {
      message: response.data.response,
      model: model,
      usage: {
        prompt_tokens: response.data.prompt_eval_count || 0,
        completion_tokens: response.data.eval_count || 0,
        total_tokens: (response.data.prompt_eval_count || 0) + (response.data.eval_count || 0),
      },
      finishReason: response.data.done ? 'stop' : 'incomplete',
    };
  } catch (error) {
    console.error('Ollama API Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Ollama server is not running. Please start Ollama.');
    }
    
    throw new Error(error.response?.data?.error || error.message || 'Failed to communicate with Ollama');
  }
};

/**
 * Chat with streaming response
 * @param {Array} messages - Array of message objects with role and content
 * @param {Object} options - Additional options for the API call
 * @returns {Promise<Stream>} - Streaming response from Ollama
 */
const chatStream = async (messages, options = {}) => {
  try {
    const {
      model = OLLAMA_MODEL,
      temperature = 0.7,
    } = options;

    console.log("model", model);
    

    // Build the prompt from messages
    let prompt = '';
    for (const msg of messages) {
      if (msg.role === 'user') {
        prompt += `User: ${msg.content}\n`;
      } else if (msg.role === 'assistant') {
        prompt += `Assistant: ${msg.content}\n`;
      }
    }
    prompt += 'Assistant: ';

    // Call Ollama streaming API
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
      model: model,
      prompt: prompt,
      stream: true,
      options: {
        temperature: temperature,
      }
    }, {
      responseType: 'stream'
    });

    return response.data;
  } catch (error) {
    console.error('Ollama Streaming Error:', error.message);
    throw new Error(error.message || 'Failed to start streaming chat');
  }
};

/**
 * Get available models from Ollama
 * @returns {Promise<Array>} - List of available models
 */
const getModels = async () => {
  try {
    // Get list of models from Ollama
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`);
    
    const models = response.data.models.map(model => ({
      id: model.name,
      name: model.name,
      description: `Size: ${(model.size / 1024 / 1024 / 1024).toFixed(2)} GB`,
      modified: model.modified_at,
    }));

    return models;
  } catch (error) {
    console.error('Ollama Models Error:', error.message);
    
    // Return default model if API fails
    return [
      {
        id: OLLAMA_MODEL,
        name: OLLAMA_MODEL,
        description: 'Default Ollama model',
      }
    ];
  }
};

module.exports = {
  chat,
  chatStream,
  getModels,
};
