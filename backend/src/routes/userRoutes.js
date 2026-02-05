const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

router.post(
  '/',
  authenticate,
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2 })
      .withMessage('Name must be at least 2 characters'),
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('role')
      .trim()
      .notEmpty()
      .withMessage('role is required')
      .isLength({ min: 2 })
      .withMessage('Role must be at least 2 characters'),
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'suspended'])
      .withMessage('Status must be one of: active, inactive, suspended'),
  ],
  validateRequest,
  userController.createUser.bind(userController)
);

router.post(
  '/update',
  authenticate,
  [
    body('userId')
      .notEmpty()
      .withMessage('User ID is required')
      .isMongoId()
      .withMessage('Invalid user ID format'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage('Name must be at least 2 characters'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('role')
      .trim()
      .notEmpty()
      .withMessage('role is required')
      .isLength({ min: 2 })
      .withMessage('Role must be at least 2 characters'),
  ],
  validateRequest,
  userController.updateUser.bind(userController)
);

router.post(
  '/status',
  authenticate,
  [
    body('userId')
      .notEmpty()
      .withMessage('User ID is required')
      .isMongoId()
      .withMessage('Invalid user ID format'),
    body('status')
      .notEmpty()
      .withMessage('Status is required')
      .isIn(['active', 'inactive', 'suspended'])
      .withMessage('Status must be one of: active, inactive, suspended'),
  ],
  validateRequest,
  userController.updateUserStatus.bind(userController)
);

router.post(
  '/get',
  authenticate,
  [
    body('userId')
      .notEmpty()
      .withMessage('User ID is required')
      .isMongoId()
      .withMessage('Invalid user ID format'),
  ],
  validateRequest,
  userController.getUserById.bind(userController)
);

router.post(
  '/get-all',
  authenticate,
  [
    body('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    body('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ],
  validateRequest,
  userController.getAllUsers.bind(userController)
);

router.post(
  '/change-password',
  authenticate,
  [
    body('userId')
      .notEmpty()
      .withMessage('User ID is required')
      .isMongoId()
      .withMessage('Invalid user ID format'),
    body('newPassword')
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
  ],
  validateRequest,
  userController.changePassword.bind(userController)
);

router.post(
  '/verify-password',
  authenticate,
  [
    body('userId')
      .notEmpty()
      .withMessage('User ID is required')
      .isMongoId()
      .withMessage('Invalid user ID format'),
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
  ],
  validateRequest,
  userController.verifyCurrentPassword.bind(userController)
);

module.exports = router;

