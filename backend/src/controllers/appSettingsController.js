const appSettingsService = require('../services/appSettingsService');

class AppSettingsController {
  async getSettings(req, res) {
    try {
      const settings = await appSettingsService.getSettings();

      res.status(200).json({
        success: true,
        message: 'Settings retrieved successfully',
        data: settings,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve settings',
      });
    }
  }

  async updateSettings(req, res) {
    try {
      const updateData = req.body;

      // Remove _id and timestamps from update data if present
      delete updateData._id;
      delete updateData.createdAt;
      delete updateData.updatedAt;

      const settings = await appSettingsService.updateSettings(updateData);

      res.status(200).json({
        success: true,
        message: 'Settings updated successfully',
        data: settings,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update settings',
      });
    }
  }

  async resetToDefault(req, res) {
    try {
      const settings = await appSettingsService.resetToDefault();

      res.status(200).json({
        success: true,
        message: 'Settings reset to default successfully',
        data: settings,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to reset settings',
      });
    }
  }
}

module.exports = new AppSettingsController();

