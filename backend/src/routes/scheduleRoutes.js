const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

// Create schedule
router.post(
  '/',
  authenticate,
  [
    body('subject_code')
      .notEmpty()
      .withMessage('Subject code is required')
      .trim(),
    body('description')
      .notEmpty()
      .withMessage('Description is required')
      .trim(),
    body('semester')
      .notEmpty()
      .withMessage('Semester is required')
      .trim(),
    body('academic_year')
      .notEmpty()
      .withMessage('Academic year is required')
      .trim(),
    body('units')
      .notEmpty()
      .withMessage('Units is required')
      .isInt({ min: 1 })
      .withMessage('Units must be a positive integer'),
    body('days')
      .notEmpty()
      .withMessage('Days is required')
      .trim()
      .isString()
      .withMessage('Days must be a string'),
    body('time')
      .notEmpty()
      .withMessage('Time is required')
      .trim()
      .isString()
      .withMessage('Time must be a string'),
    body('room')
      .notEmpty()
      .withMessage('Room is required')
      .trim(),
    body('block')
      .optional({ nullable: true })
      .trim(),
    body('students')
      .optional()
      .isArray()
      .withMessage('Students must be an array'),
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'cancelled'])
      .withMessage('Status must be one of: active, inactive, cancelled'),
  ],
  validateRequest,
  scheduleController.createSchedule.bind(scheduleController)
);

// Update schedule
router.post(
  '/update',
  authenticate,
  [
    body('scheduleId')
      .notEmpty()
      .withMessage('Schedule ID is required')
      .isMongoId()
      .withMessage('Invalid schedule ID format'),
    body('subject_code')
      .optional({ checkFalsy: true, nullable: true })
      .trim()
      .notEmpty()
      .withMessage('Subject code cannot be empty'),
    body('description')
      .optional({ checkFalsy: true, nullable: true })
      .trim()
      .notEmpty()
      .withMessage('Description cannot be empty'),
    body('semester')
      .optional({ checkFalsy: true, nullable: true })
      .trim()
      .notEmpty()
      .withMessage('Semester cannot be empty'),
    body('academic_year')
      .optional({ checkFalsy: true, nullable: true })
      .trim()
      .notEmpty()
      .withMessage('Academic year cannot be empty'),
    body('units')
      .optional({ checkFalsy: true, nullable: true })
      .isInt({ min: 1 })
      .withMessage('Units must be a positive integer'),
    body('days')
      .optional({ checkFalsy: true, nullable: true })
      .trim()
      .isString()
      .notEmpty()
      .withMessage('Days must be a non-empty string'),
    body('time')
      .optional({ checkFalsy: true, nullable: true })
      .trim()
      .isString()
      .notEmpty()
      .withMessage('Time must be a non-empty string'),
    body('room')
      .optional({ checkFalsy: true, nullable: true })
      .trim()
      .notEmpty()
      .withMessage('Room cannot be empty'),
    body('block')
      .optional({ nullable: true })
      .trim(),
    body('students')
      .optional({ checkFalsy: true, nullable: true })
      .isArray()
      .withMessage('Students must be an array'),
    body('status')
      .optional({ checkFalsy: true, nullable: true })
      .isIn(['active', 'inactive', 'cancelled'])
      .withMessage('Status must be one of: active, inactive, cancelled'),
  ],
  validateRequest,
  scheduleController.updateSchedule.bind(scheduleController)
);

// Update schedule status
router.post(
  '/status',
  authenticate,
  [
    body('scheduleId')
      .notEmpty()
      .withMessage('Schedule ID is required')
      .isMongoId()
      .withMessage('Invalid schedule ID format'),
    body('status')
      .notEmpty()
      .withMessage('Status is required')
      .isIn(['active', 'inactive', 'cancelled'])
      .withMessage('Status must be one of: active, inactive, cancelled'),
  ],
  validateRequest,
  scheduleController.updateScheduleStatus.bind(scheduleController)
);

// Get schedule by ID
router.post(
  '/get',
  authenticate,
  [
    body('scheduleId')
      .notEmpty()
      .withMessage('Schedule ID is required')
      .isMongoId()
      .withMessage('Invalid schedule ID format'),
  ],
  validateRequest,
  scheduleController.getScheduleById.bind(scheduleController)
);

// Get all schedules
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
    body('semester')
      .optional()
      .trim(),
    body('academic_year')
      .optional()
      .trim(),
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'cancelled'])
      .withMessage('Status must be one of: active, inactive, cancelled'),
    body('subject_code')
      .optional()
      .trim(),
    body('block')
      .optional()
      .trim(),
  ],
  validateRequest,
  scheduleController.getAllSchedules.bind(scheduleController)
);

module.exports = router;

