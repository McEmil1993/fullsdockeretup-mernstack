const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/assessmentController');
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

// Create or update highest scores
router.post(
  '/highest-scores',
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
    body('highest_scores')
      .notEmpty()
      .withMessage('Highest scores are required')
      .isObject()
      .withMessage('Highest scores must be an object'),
  ],
  validateRequest,
  assessmentController.createOrUpdateHighestScores.bind(assessmentController)
);

// Create or update individual student assessment (one score at a time)
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
    body('school_year')
      .notEmpty()
      .withMessage('School year is required')
      .trim(),
    body('term')
      .notEmpty()
      .withMessage('Term is required')
      .isIn(['prelim', 'midterm', 'semi-final', 'final'])
      .withMessage('Term must be one of: prelim, midterm, semi-final, final'),
    body('scores')
      .optional()
      .isObject()
      .withMessage('Scores must be an object'),
  ],
  validateRequest,
  assessmentController.createOrUpdateAssessment.bind(assessmentController)
);

// Get highest scores
router.post(
  '/highest-scores/get',
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
      .optional()
      .isIn(['prelim', 'midterm', 'semi-final', 'final'])
      .withMessage('Term must be one of: prelim, midterm, semi-final, final'),
  ],
  validateRequest,
  assessmentController.getHighestScores.bind(assessmentController)
);

// Get assessment for a specific student
router.post(
  '/get',
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
    body('school_year')
      .notEmpty()
      .withMessage('School year is required')
      .trim(),
    body('term')
      .optional()
      .isIn(['prelim', 'midterm', 'semi-final', 'final'])
      .withMessage('Term must be one of: prelim, midterm, semi-final, final'),
  ],
  validateRequest,
  assessmentController.getAssessment.bind(assessmentController)
);

// Get all assessments for a schedule (with filters)
router.post(
  '/get-all',
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
      .optional()
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
  assessmentController.getAllAssessments.bind(assessmentController)
);

// Get assessments by filters (for filtering by school_year and term)
router.post(
  '/get-by-filters',
  authenticate,
  [
    body('scheduleId')
      .optional()
      .isMongoId()
      .withMessage('Invalid schedule ID format'),
    body('school_year')
      .optional()
      .trim(),
    body('term')
      .optional()
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
  assessmentController.getAssessmentsByFilters.bind(assessmentController)
);

module.exports = router;

