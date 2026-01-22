const express = require('express');
const router = express.Router();
const appSettingsController = require('../controllers/appSettingsController');
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

// Get settings
router.post(
  '/get',
  authenticate,
  appSettingsController.getSettings.bind(appSettingsController)
);

// Update settings
router.post(
  '/update',
  authenticate,
  [
    body('darkMode')
      .optional()
      .isBoolean()
      .withMessage('darkMode must be a boolean'),
    body('fontFamily')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('fontFamily must be a non-empty string'),
    body('fontSize')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('fontSize must be a non-empty string'),
    body('activeSchoolYear')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('activeSchoolYear must be a non-empty string'),
    body('activeTerm')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('activeTerm must be a non-empty string'),
    body('sideNavColor')
      .optional()
      .isString()
      .trim()
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('sideNavColor must be a valid hex color'),
    body('topNavColor')
      .optional()
      .isString()
      .trim()
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('topNavColor must be a valid hex color'),
    body('sideNavFontColor')
      .optional()
      .isString()
      .trim()
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('sideNavFontColor must be a valid hex color'),
    body('sideNavHoverColor')
      .optional()
      .isString()
      .trim()
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('sideNavHoverColor must be a valid hex color'),
    body('sideNavActiveColor')
      .optional()
      .isString()
      .trim()
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('sideNavActiveColor must be a valid hex color'),
    body('topNavFontColor')
      .optional()
      .isString()
      .trim()
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('topNavFontColor must be a valid hex color'),
    body('loginBackgroundType')
      .optional()
      .isIn(['color', 'image'])
      .withMessage('loginBackgroundType must be either "color" or "image"'),
    body('loginBackgroundColor')
      .optional()
      .isString()
      .trim()
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('loginBackgroundColor must be a valid hex color'),
    body('loginBackgroundImage')
      .optional()
      .isString()
      .withMessage('loginBackgroundImage must be a string'),
    body('loginFormBgColor')
      .optional()
      .isString()
      .trim()
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('loginFormBgColor must be a valid hex color'),
    body('loginFormBgOpacity')
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage('loginFormBgOpacity must be between 0 and 100'),
  ],
  validateRequest,
  appSettingsController.updateSettings.bind(appSettingsController)
);

// Reset to default
router.post(
  '/reset',
  authenticate,
  appSettingsController.resetToDefault.bind(appSettingsController)
);

module.exports = router;

