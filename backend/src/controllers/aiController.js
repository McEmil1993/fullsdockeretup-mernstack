const aiService = require('../services/aiService');

/**
 * Handle chat requests
 */
const chat = async (req, res, next) => {
  try {
    const { messages, options } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Messages array is required',
      });
    }

    // Validate message format
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return res.status(400).json({
          success: false,
          message: 'Each message must have role and content',
        });
      }
      if (!['system', 'user', 'assistant'].includes(msg.role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid message role. Must be system, user, or assistant',
        });
      }
    }

    const response = await aiService.chat(messages, options);

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle streaming chat requests
 */
const chatStream = async (req, res, next) => {
  try {
    const { messages, options } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Messages array is required',
      });
    }

    // Set headers for SSE (Server-Sent Events)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await aiService.chatStream(messages, options);

    // Stream the response (Cohere format)
    for await (const chunk of stream) {
      if (chunk.eventType === 'text-generation') {
        const content = chunk.text || '';
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    // Send error through SSE
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
};

/**
 * Get available models
 */
const getModels = async (req, res, next) => {
  try {
    const models = await aiService.getModels();

    res.json({
      success: true,
      data: models,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check API key status
 */
const checkStatus = async (req, res) => {
  const hasApiKey = !!process.env.COHERE_API_KEY;
  
  res.json({
    success: true,
    data: {
      configured: hasApiKey,
      message: hasApiKey 
        ? 'Cohere API is configured and ready' 
        : 'Cohere API key is not configured',
    },
  });
};

module.exports = {
  chat,
  chatStream,
  getModels,
  checkStatus,
};
