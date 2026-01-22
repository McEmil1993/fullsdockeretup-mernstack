const AppSettings = require('../models/AppSettings');

class AppSettingsService {
  async getSettings() {
    try {
      const settings = await AppSettings.getSettings();
      return settings;
    } catch (error) {
      throw error;
    }
  }

  async updateSettings(updateData) {
    try {
      // Get existing settings or create new one
      let settings = await AppSettings.findOne();
      
      if (!settings) {
        settings = await AppSettings.create(updateData);
      } else {
        // Update only provided fields
        Object.keys(updateData).forEach(key => {
          if (updateData[key] !== undefined) {
            settings[key] = updateData[key];
          }
        });
        await settings.save();
      }

      return settings;
    } catch (error) {
      throw error;
    }
  }

  async resetToDefault() {
    try {
      const defaultSettings = {
        darkMode: false,
        fontFamily: 'Poppins',
        fontSize: '13px',
        activeSchoolYear: '2025-2026',
        activeTerm: 'Prelim',
        sideNavColor: '#1e293b',
        topNavColor: '#ffffff',
        sideNavFontColor: '#e2e8f0',
        sideNavHoverColor: '#ffffff',
        sideNavActiveColor: '#ffffff',
        topNavFontColor: '#1f2937',
        loginBackgroundType: 'color',
        loginBackgroundColor: '#d6d6d6',
        loginBackgroundImage: '',
        loginFormBgColor: '#ffffff',
        loginFormBgOpacity: 89,
      };

      let settings = await AppSettings.findOne();
      
      if (!settings) {
        settings = await AppSettings.create(defaultSettings);
      } else {
        Object.assign(settings, defaultSettings);
        await settings.save();
      }

      return settings;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AppSettingsService();

