const { CohereClient } = require('cohere-ai');

// Lazy initialize Cohere client only when needed
let cohere = null;

const getCohereClient = () => {
  if (!process.env.COHERE_API_KEY) {
    throw new Error('Cohere API key is not configured');
  }
  
  if (!cohere) {
    cohere = new CohereClient({
      token: process.env.COHERE_API_KEY,
    });
  }
  
  return cohere;
};

/**
 * Chat with Cohere AI
 * @param {Array} messages - Array of message objects with role and content
 * @param {Object} options - Additional options for the API call
 * @returns {Promise<Object>} - Response from Cohere
 */
const chat = async (messages, options = {}) => {
  try {
    // Get Cohere client (lazy initialization)
    const client = getCohereClient();

    // Default options
    const {
      model = 'command-r-08-2024',
      temperature = 0.7,
      max_tokens = 2000,
    } = options;

    // Convert messages to Cohere format
    // Cohere uses chat history format differently
    const chatHistory = [];
    let finalMessage = '';
    
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (i === messages.length - 1) {
        // Last message is the current user message
        finalMessage = msg.content;
      } else {
        // Previous messages go to chat history
        chatHistory.push({
          role: msg.role === 'assistant' ? 'CHATBOT' : 'USER',
          message: msg.content,
        });
      }
    }

    // Call Cohere API
    const response = await client.chat({
      model,
      message: finalMessage,
      chatHistory: chatHistory.length > 0 ? chatHistory : undefined,
      temperature,
      maxTokens: max_tokens,
    });

    return {
      message: response.text,
      model: model,
      usage: {
        prompt_tokens: response.meta?.tokens?.inputTokens || 0,
        completion_tokens: response.meta?.tokens?.outputTokens || 0,
        total_tokens: (response.meta?.tokens?.inputTokens || 0) + (response.meta?.tokens?.outputTokens || 0),
      },
      finishReason: response.finishReason || 'complete',
    };
  } catch (error) {
    console.error('Cohere API Error:', error);
    
    if (error.statusCode === 401) {
      throw new Error('Invalid Cohere API key');
    } else if (error.statusCode === 429) {
      throw new Error('Cohere API rate limit exceeded. Please try again later.');
    } else if (error.statusCode === 500) {
      throw new Error('Cohere service is temporarily unavailable');
    }
    
    throw new Error(error.message || 'Failed to communicate with Cohere');
  }
};

/**
 * Chat with streaming response
 * @param {Array} messages - Array of message objects with role and content
 * @param {Object} options - Additional options for the API call
 * @returns {Promise<Stream>} - Streaming response from Cohere
 */
const chatStream = async (messages, options = {}) => {
  try {
    // Get Cohere client (lazy initialization)
    const client = getCohereClient();

    const {
      model = 'command-r-08-2024',
      temperature = 0.7,
      max_tokens = 2000,
    } = options;

    // Convert messages to Cohere format
    const chatHistory = [];
    let finalMessage = '';
    
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (i === messages.length - 1) {
        finalMessage = msg.content;
      } else {
        chatHistory.push({
          role: msg.role === 'assistant' ? 'CHATBOT' : 'USER',
          message: msg.content,
        });
      }
    }

    // Call Cohere streaming API
    const stream = await client.chatStream({
      model,
      message: finalMessage,
      chatHistory: chatHistory.length > 0 ? chatHistory : undefined,
      temperature,
      maxTokens: max_tokens,
    });

    return stream;
  } catch (error) {
    console.error('Cohere Streaming Error:', error);
    throw new Error(error.message || 'Failed to start streaming chat');
  }
};

/**
 * Get available models
 * @returns {Promise<Array>} - List of available models
 */
const getModels = async () => {
  try {
    // Return list of Cohere models
    // Cohere doesn't have a models.list() endpoint
    const cohereModels = [
      {
        id: 'command-r-08-2024',
        name: 'Command R (Aug 2024)',
        description: 'Latest stable model for conversational AI',
      },
      {
        id: 'command-r-plus-08-2024',
        name: 'Command R+ (Aug 2024)',
        description: 'Most powerful model with best quality',
      },
      {
        id: 'command-r7b-12-2024',
        name: 'Command R7B (Dec 2024)',
        description: 'Lightweight 7B parameter model',
      },
    ];

    return cohereModels;
  } catch (error) {
    console.error('Cohere Models Error:', error);
    throw new Error('Failed to fetch available models');
  }
};

module.exports = {
  chat,
  chatStream,
  getModels,
};
