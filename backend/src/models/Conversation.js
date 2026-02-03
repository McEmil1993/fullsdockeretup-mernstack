const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const conversationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    default: 'New Conversation',
  },
  messages: [messageSchema],
  model: {
    type: String,
    default: 'command-r-08-2024',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update updatedAt on save
conversationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Auto-generate title from first user message
conversationSchema.pre('save', function(next) {
  if (this.isNew && this.messages.length > 0 && this.title === 'New Conversation') {
    const firstUserMessage = this.messages.find(m => m.role === 'user');
    if (firstUserMessage) {
      // Take first 50 characters as title
      this.title = firstUserMessage.content.substring(0, 50) + 
                   (firstUserMessage.content.length > 50 ? '...' : '');
    }
  }
  next();
});

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
