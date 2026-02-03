const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// POST /api/ai/chat - Send chat message
router.post('/chat', aiController.chat);

// POST /api/ai/chat/stream - Send chat message with streaming response
router.post('/chat/stream', aiController.chatStream);

// GET /api/ai/models - Get available models
router.get('/models', aiController.getModels);

// GET /api/ai/status - Check API configuration status
router.get('/status', aiController.checkStatus);

module.exports = router;
