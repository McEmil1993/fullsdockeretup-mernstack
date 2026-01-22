const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

// Create student
router.post(
  '/',
  authenticate,
  [
    body('student_id')
      .notEmpty()
      .withMessage('Student ID is required')
      .trim(),
    body('last_name')
      .notEmpty()
      .withMessage('Last name is required')
      .trim(),
    body('first_name')
      .notEmpty()
      .withMessage('First name is required')
      .trim(),
    body('middle_initial')
      .optional()
      .trim()
      .isLength({ max: 1 })
      .withMessage('Middle initial must be a single character'),
    body('gender')
      .notEmpty()
      .withMessage('Gender is required')
      .isIn(['MALE', 'FEMALE', 'OTHER'])
      .withMessage('Gender must be one of: MALE, FEMALE, OTHER'),
    body('course_year')
      .notEmpty()
      .withMessage('Course year is required')
      .trim(),
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'graduated', 'dropped'])
      .withMessage('Status must be one of: active, inactive, graduated, dropped'),
  ],
  validateRequest,
  studentController.createStudent.bind(studentController)
);

// Update student
router.post(
  '/update',
  authenticate,
  [
    body('studentId')
      .notEmpty()
      .withMessage('Student ID is required')
      .isMongoId()
      .withMessage('Invalid student ID format'),
    body('student_id')
      .optional({ checkFalsy: true, nullable: true })
      .trim()
      .notEmpty()
      .withMessage('Student ID cannot be empty'),
    body('last_name')
      .optional({ checkFalsy: true, nullable: true })
      .trim()
      .notEmpty()
      .withMessage('Last name cannot be empty'),
    body('first_name')
      .optional({ checkFalsy: true, nullable: true })
      .trim()
      .notEmpty()
      .withMessage('First name cannot be empty'),
    body('middle_initial')
      .optional({ checkFalsy: true, nullable: true })
      .trim()
      .isLength({ max: 1 })
      .withMessage('Middle initial must be a single character'),
    body('gender')
      .optional({ checkFalsy: true, nullable: true })
      .isIn(['MALE', 'FEMALE', 'OTHER'])
      .withMessage('Gender must be one of: MALE, FEMALE, OTHER'),
    body('course_year')
      .optional({ checkFalsy: true, nullable: true })
      .trim()
      .notEmpty()
      .withMessage('Course year cannot be empty'),
    body('status')
      .optional({ checkFalsy: true, nullable: true })
      .isIn(['active', 'inactive', 'graduated', 'dropped'])
      .withMessage('Status must be one of: active, inactive, graduated, dropped'),
  ],
  validateRequest,
  studentController.updateStudent.bind(studentController)
);

// Update student status
router.post(
  '/status',
  authenticate,
  [
    body('studentId')
      .notEmpty()
      .withMessage('Student ID is required')
      .isMongoId()
      .withMessage('Invalid student ID format'),
    body('status')
      .notEmpty()
      .withMessage('Status is required')
      .isIn(['active', 'inactive', 'graduated', 'dropped'])
      .withMessage('Status must be one of: active, inactive, graduated, dropped'),
  ],
  validateRequest,
  studentController.updateStudentStatus.bind(studentController)
);

// Get student by MongoDB ID
router.post(
  '/get',
  authenticate,
  [
    body('studentId')
      .notEmpty()
      .withMessage('Student ID is required')
      .isMongoId()
      .withMessage('Invalid student ID format'),
  ],
  validateRequest,
  studentController.getStudentById.bind(studentController)
);

// Get student by student_id (e.g., "24-019536")
router.post(
  '/get-by-student-id',
  authenticate,
  [
    body('student_id')
      .notEmpty()
      .withMessage('Student ID (student_id) is required')
      .trim(),
  ],
  validateRequest,
  studentController.getStudentByStudentId.bind(studentController)
);

// Get all students
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
      .isInt({ min: 1, max: 1000 })
      .withMessage('Limit must be between 1 and 1000'),
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'graduated', 'dropped'])
      .withMessage('Status must be one of: active, inactive, graduated, dropped'),
    body('gender')
      .optional()
      .isIn(['MALE', 'FEMALE', 'OTHER'])
      .withMessage('Gender must be one of: MALE, FEMALE, OTHER'),
    body('student_id')
      .optional()
      .trim(),
    body('last_name')
      .optional()
      .trim(),
    body('first_name')
      .optional()
      .trim(),
    body('course_year')
      .optional()
      .trim(),
  ],
  validateRequest,
  studentController.getAllStudents.bind(studentController)
);

module.exports = router;

