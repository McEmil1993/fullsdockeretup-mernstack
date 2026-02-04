const mongoose = require('mongoose');

const userPreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Editor preferences
  editorFontFamily: {
    type: String,
    default: 'monospace'
  },
  editorFontSize: {
    type: String,
    default: '14'
  },
  // Panel sizes for Documents page
  docPanelSizes: {
    type: Object,
    default: null
  },
  // Notification preferences
  notificationSoundEnabled: {
    type: Boolean,
    default: true
  },
}, {
  timestamps: true,
});

// Ensure one preference document per user
userPreferenceSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('UserPreference', userPreferenceSchema);
