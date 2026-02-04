const express = require('express');
const router = express.Router();
const userPreferenceController = require('../controllers/userPreferenceController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get and update preferences
router.get('/', userPreferenceController.getPreferences);
router.put('/', userPreferenceController.updatePreferences);
router.patch('/', userPreferenceController.updatePreference);
router.delete('/', userPreferenceController.deletePreferences);

module.exports = router;
