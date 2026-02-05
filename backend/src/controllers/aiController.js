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

    // Stream the response (Ollama format - each line is a JSON object)
    let buffer = '';
    let streamClosed = false;
    
    // Cleanup function to destroy stream
    const cleanup = () => {
      if (!streamClosed) {
        streamClosed = true;
        stream.destroy();
      }
    };

    // Handle client disconnect
    req.on('close', () => {
      console.log('Client disconnected, cleaning up stream');
      cleanup();
    });

    stream.on('data', (chunk) => {
      if (streamClosed) return;
      
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      
      // Keep last incomplete line in buffer
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const json = JSON.parse(line);
            if (json.response) {
              res.write(`data: ${JSON.stringify({ content: json.response })}\n\n`);
            }
            if (json.done) {
              res.write('data: [DONE]\n\n');
              cleanup();
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }
    });

    stream.on('end', () => {
      if (!streamClosed) {
        res.end();
        cleanup();
      }
    });

    stream.on('error', (error) => {
      if (!streamClosed) {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
        cleanup();
      }
    });
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
 * Check Ollama status
 */
const checkStatus = async (req, res) => {
  try {
    const axios = require('axios');
    const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    
    // Try to ping Ollama
    await axios.get(`${OLLAMA_BASE_URL}/api/tags`, { timeout: 2000 });

    data = {
        configured: true,
        message: 'Ollama is running and ready',
        url: OLLAMA_BASE_URL,
        model: process.env.OLLAMA_MODEL || 'deepseek-coder:6.7b',
      }

    console.log(data);
    
    
    res.json({
      success: true,
      data: {
        configured: true,
        message: 'Ollama is running and ready',
        url: OLLAMA_BASE_URL,
        model: process.env.OLLAMA_MODEL || 'deepseek-coder:6.7b',
      },
    });
  } catch (error) {
    res.json({
      success: false,
      data: {
        configured: false,
        message: 'Ollama is not running or not accessible',
        error: error.message,
      },
    });
  }
};

module.exports = {
  chat,
  chatStream,
  getModels,
  checkStatus,
};
