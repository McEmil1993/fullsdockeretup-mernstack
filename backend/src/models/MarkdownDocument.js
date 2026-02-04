const mongoose = require('mongoose');

const markdownDocumentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    default: 'Untitled Document'
  },
  content: {
    type: String,
    default: ''
  },
  // For ordering documents
  order: {
    type: Number,
    default: 0
  },
  // Optional metadata
  tags: [{
    type: String
  }],
  isFavorite: {
    type: Boolean,
    default: false
  },
}, {
  timestamps: true,
});

// Index for faster queries
markdownDocumentSchema.index({ userId: 1, createdAt: -1 });
markdownDocumentSchema.index({ userId: 1, order: 1 });

module.exports = mongoose.model('MarkdownDocument', markdownDocumentSchema);
