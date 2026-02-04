const userPreferenceService = require('../services/userPreferenceService');

/**
 * Get user preferences
 */
exports.getPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const preferences = await userPreferenceService.getPreferences(userId);
    
    res.status(200).json({
      success: true,
      data: preferences
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user preferences
 */
exports.updatePreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const updates = req.body;
    
    const preferences = await userPreferenceService.updatePreferences(userId, updates);
    
    res.status(200).json({
      success: true,
      data: preferences,
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update single preference field
 */
exports.updatePreference = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { field, value } = req.body;
    
    if (!field) {
      return res.status(400).json({
        success: false,
        message: 'Field name is required'
      });
    }
    
    const preferences = await userPreferenceService.updatePreference(userId, field, value);
    
    res.status(200).json({
      success: true,
      data: preferences,
      message: 'Preference updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user preferences
 */
exports.deletePreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await userPreferenceService.deletePreferences(userId);
    
    res.status(200).json({
      success: true,
      message: 'Preferences deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
