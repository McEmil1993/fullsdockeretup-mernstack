const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

// Create or update attendance
router.post(
  '/',
  authenticate,
  [
    body('scheduleId')
      .notEmpty()
      .withMessage('Schedule ID is required')
      .isMongoId()
      .withMessage('Invalid schedule ID format'),
    body('student_id')
      .notEmpty()
      .withMessage('Student ID is required')
      .trim(),
    body('date')
      .notEmpty()
      .withMessage('Date is required')
      .isISO8601()
      .withMessage('Date must be in ISO 8601 format (YYYY-MM-DD)'),
    body('attendance')
      .notEmpty()
      .withMessage('Attendance status is required')
      .isIn(['present', 'absent', 'late', 'excused'])
      .withMessage('Attendance must be one of: present, absent, late, excused'),
    body('school_year')
      .notEmpty()
      .withMessage('School year is required')
      .trim(),
    body('term')
      .notEmpty()
      .withMessage('Term is required')
      .isIn(['prelim', 'midterm', 'semi-final', 'final'])
      .withMessage('Term must be one of: prelim, midterm, semi-final, final'),
  ],
  validateRequest,
  attendanceController.createOrUpdateAttendance.bind(attendanceController)
);

// Get attendance records
router.post(
  '/get',
  authenticate,
  [
    body('scheduleId')
      .notEmpty()
      .withMessage('Schedule ID is required')
      .isMongoId()
      .withMessage('Invalid schedule ID format'),
    body('date')
      .notEmpty()
      .withMessage('Date is required')
      .isISO8601()
      .withMessage('Date must be in ISO 8601 format (YYYY-MM-DD)'),
    body('school_year')
      .notEmpty()
      .withMessage('School year is required')
      .trim(),
    body('term')
      .notEmpty()
      .withMessage('Term is required')
      .isIn(['prelim', 'midterm', 'semi-final', 'final'])
      .withMessage('Term must be one of: prelim, midterm, semi-final, final'),
    body('student_id')
      .optional()
      .trim(),
    body('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    body('limit')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Limit must be between 1 and 1000'),
  ],
  validateRequest,
  attendanceController.getAttendance.bind(attendanceController)
);

// Get attendance summary
router.post(
  '/get-summary',
  authenticate,
  [
    body('scheduleId')
      .notEmpty()
      .withMessage('Schedule ID is required')
      .isMongoId()
      .withMessage('Invalid schedule ID format'),
    body('school_year')
      .notEmpty()
      .withMessage('School year is required')
      .trim(),
    body('term')
      .notEmpty()
      .withMessage('Term is required')
      .isIn(['prelim', 'midterm', 'semi-final', 'final'])
      .withMessage('Term must be one of: prelim, midterm, semi-final, final'),
  ],
  validateRequest,
  attendanceController.getAttendanceSummary.bind(attendanceController)
);

module.exports = router;

