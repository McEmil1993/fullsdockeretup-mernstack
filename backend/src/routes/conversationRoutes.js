const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// GET /api/conversations - Get all conversations
router.get('/', conversationController.getConversations);

// GET /api/conversations/count - Get conversation count
router.get('/count', conversationController.getConversationCount);

// GET /api/conversations/search - Search conversations
router.get('/search', conversationController.searchConversations);

// POST /api/conversations - Create new conversation
router.post('/', conversationController.createConversation);

// GET /api/conversations/:id - Get single conversation
router.get('/:id', conversationController.getConversation);

// PUT /api/conversations/:id - Update conversation
router.put('/:id', conversationController.updateConversation);

// POST /api/conversations/:id/messages - Add message to conversation
router.post('/:id/messages', conversationController.addMessage);

// DELETE /api/conversations/:id - Delete conversation
router.delete('/:id', conversationController.deleteConversation);

module.exports = router;
