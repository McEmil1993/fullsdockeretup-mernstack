const mongoose = require('mongoose');

const appSettingsSchema = new mongoose.Schema({
  darkMode: {
    type: Boolean,
    default: false,
  },
  fontFamily: {
    type: String,
    default: 'Poppins',
  },
  fontSize: {
    type: String,
    default: '13px',
  },
  activeSchoolYear: {
    type: String,
    default: '2025-2026',
  },
  activeTerm: {
    type: String,
    default: 'Prelim',
  },
  sideNavColor: {
    type: String,
    default: '#1e293b',
  },
  topNavColor: {
    type: String,
    default: '#ffffff',
  },
  sideNavFontColor: {
    type: String,
    default: '#e2e8f0',
  },
  sideNavHoverColor: {
    type: String,
    default: '#ffffff',
  },
  sideNavActiveColor: {
    type: String,
    default: '#ffffff',
  },
  topNavFontColor: {
    type: String,
    default: '#1f2937',
  },
  loginBackgroundType: {
    type: String,
    default: 'color',
  },
  loginBackgroundColor: {
    type: String,
    default: '#d6d6d6',
  },
  loginBackgroundImage: {
    type: String,
    default: '',
  },
  loginFormBgColor: {
    type: String,
    default: '#ffffff',
  },
  loginFormBgOpacity: {
    type: Number,
    default: 89,
  },
}, {
  timestamps: true,
});

// Ensure only one settings document exists
appSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const AppSettings = mongoose.model('AppSettings', appSettingsSchema);

module.exports = AppSettings;

