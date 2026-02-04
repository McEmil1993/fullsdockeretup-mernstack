const UserPreference = require('../models/UserPreference');

class UserPreferenceService {
  /**
   * Get user preferences (creates default if doesn't exist)
   */
  async getPreferences(userId) {
    try {
      let preferences = await UserPreference.findOne({ userId });
      
      if (!preferences) {
        // Create default preferences
        preferences = await UserPreference.create({ userId });
      }
      
      return preferences;
    } catch (error) {
      console.error('Error getting preferences:', error);
      throw error;
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(userId, updates) {
    try {
      const preferences = await UserPreference.findOneAndUpdate(
        { userId },
        { $set: updates },
        { new: true, upsert: true, runValidators: true }
      );
      
      return preferences;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }

  /**
   * Update specific preference field
   */
  async updatePreference(userId, field, value) {
    try {
      const update = { [field]: value };
      return await this.updatePreferences(userId, update);
    } catch (error) {
      console.error('Error updating preference:', error);
      throw error;
    }
  }

  /**
   * Delete user preferences
   */
  async deletePreferences(userId) {
    try {
      await UserPreference.findOneAndDelete({ userId });
      return true;
    } catch (error) {
      console.error('Error deleting preferences:', error);
      throw error;
    }
  }
}

module.exports = new UserPreferenceService();
