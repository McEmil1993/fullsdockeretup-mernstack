const conversationService = require('../services/conversationService');

/**
 * Create a new conversation
 */
const createConversation = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { title, messages, model } = req.body;

    const conversation = await conversationService.createConversation(userId, {
      title,
      messages,
      model,
    });

    res.status(201).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all conversations for current user
 */
const getConversations = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { limit, skip, sort } = req.query;

    const conversations = await conversationService.getUserConversations(userId, {
      limit: parseInt(limit) || 50,
      skip: parseInt(skip) || 0,
      sort: sort ? JSON.parse(sort) : { updatedAt: -1 },
    });

    res.json({
      success: true,
      data: conversations,
      count: conversations.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single conversation
 */
const getConversation = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const conversation = await conversationService.getConversationById(id, userId);

    res.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update conversation
 */
const updateConversation = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const updates = req.body;

    const conversation = await conversationService.updateConversation(id, userId, updates);

    res.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add message to conversation
 */
const addMessage = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const message = req.body;

    if (!message.role || !message.content) {
      return res.status(400).json({
        success: false,
        message: 'Message must have role and content',
      });
    }

    const conversation = await conversationService.addMessage(id, userId, message);

    res.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete conversation
 */
const deleteConversation = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const result = await conversationService.deleteConversation(id, userId);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get conversation count
 */
const getConversationCount = async (req, res, next) => {
  try {
    const userId = req.userId;
    const count = await conversationService.getConversationCount(userId);

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search conversations
 */
const searchConversations = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search term is required',
      });
    }

    const conversations = await conversationService.searchConversations(userId, q);

    res.json({
      success: true,
      data: conversations,
      count: conversations.length,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createConversation,
  getConversations,
  getConversation,
  updateConversation,
  addMessage,
  deleteConversation,
  getConversationCount,
  searchConversations,
};
