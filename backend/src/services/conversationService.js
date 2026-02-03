const Conversation = require('../models/Conversation');

/**
 * Create a new conversation
 */
const createConversation = async (userId, data = {}) => {
  try {
    const conversation = new Conversation({
      user_id: userId,
      title: data.title || 'New Conversation',
      messages: data.messages || [],
      model: data.model || 'command-r-08-2024',
    });

    await conversation.save();
    return conversation;
  } catch (error) {
    throw new Error(`Failed to create conversation: ${error.message}`);
  }
};

/**
 * Get all conversations for a user
 */
const getUserConversations = async (userId, options = {}) => {
  try {
    const { limit = 50, skip = 0, sort = { updatedAt: -1 } } = options;

    const conversations = await Conversation.find({ user_id: userId })
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .select('-__v')
      .lean();

    return conversations;
  } catch (error) {
    throw new Error(`Failed to get conversations: ${error.message}`);
  }
};

/**
 * Get a single conversation by ID
 */
const getConversationById = async (conversationId, userId) => {
  try {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      user_id: userId,
    }).lean();

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    return conversation;
  } catch (error) {
    throw new Error(`Failed to get conversation: ${error.message}`);
  }
};

/**
 * Update conversation (add messages, change title, etc.)
 */
const updateConversation = async (conversationId, userId, updates) => {
  try {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      user_id: userId,
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Update fields
    if (updates.title) conversation.title = updates.title;
    if (updates.messages) conversation.messages = updates.messages;
    if (updates.model) conversation.model = updates.model;

    await conversation.save();
    return conversation;
  } catch (error) {
    throw new Error(`Failed to update conversation: ${error.message}`);
  }
};

/**
 * Add a message to conversation
 */
const addMessage = async (conversationId, userId, message) => {
  try {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      user_id: userId,
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    conversation.messages.push({
      role: message.role,
      content: message.content,
      timestamp: message.timestamp || new Date(),
    });

    await conversation.save();
    return conversation;
  } catch (error) {
    throw new Error(`Failed to add message: ${error.message}`);
  }
};

/**
 * Delete conversation
 */
const deleteConversation = async (conversationId, userId) => {
  try {
    const result = await Conversation.findOneAndDelete({
      _id: conversationId,
      user_id: userId,
    });

    if (!result) {
      throw new Error('Conversation not found');
    }

    return { message: 'Conversation deleted successfully' };
  } catch (error) {
    throw new Error(`Failed to delete conversation: ${error.message}`);
  }
};

/**
 * Get conversation count for user
 */
const getConversationCount = async (userId) => {
  try {
    const count = await Conversation.countDocuments({ user_id: userId });
    return count;
  } catch (error) {
    throw new Error(`Failed to get conversation count: ${error.message}`);
  }
};

/**
 * Search conversations by title or content
 */
const searchConversations = async (userId, searchTerm) => {
  try {
    const conversations = await Conversation.find({
      user_id: userId,
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } },
        { 'messages.content': { $regex: searchTerm, $options: 'i' } },
      ],
    })
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();

    return conversations;
  } catch (error) {
    throw new Error(`Failed to search conversations: ${error.message}`);
  }
};

module.exports = {
  createConversation,
  getUserConversations,
  getConversationById,
  updateConversation,
  addMessage,
  deleteConversation,
  getConversationCount,
  searchConversations,
};
