const express = require('express');
const router = express.Router();
const fileUploadController = require('../controllers/fileUploadController');
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const upload = require('../config/multer');

// Upload files (multiple files allowed)
router.post(
  '/upload',
  authenticate,
  upload.array('files', 10), // Allow up to 10 files at once
  fileUploadController.uploadFiles.bind(fileUploadController)
);

// Get all files
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
    body('category')
      .optional()
      .isIn(['all', 'Documents', 'Reports', 'Images', 'Videos', 'Audio', 'Archives', 'Other'])
      .withMessage('Invalid category'),
    body('search')
      .optional()
      .trim(),
  ],
  validateRequest,
  fileUploadController.getAllFiles.bind(fileUploadController)
);

// Get file by ID
router.post(
  '/get',
  authenticate,
  [
    body('fileId')
      .notEmpty()
      .withMessage('File ID is required')
      .isMongoId()
      .withMessage('Invalid file ID format'),
  ],
  validateRequest,
  fileUploadController.getFileById.bind(fileUploadController)
);

// Update file
router.post(
  '/update',
  authenticate,
  [
    body('fileId')
      .notEmpty()
      .withMessage('File ID is required')
      .isMongoId()
      .withMessage('Invalid file ID format'),
    body('category')
      .optional()
      .isIn(['Documents', 'Reports', 'Images', 'Videos', 'Audio', 'Archives', 'Other'])
      .withMessage('Invalid category'),
    body('status')
      .optional()
      .isIn(['completed', 'pending', 'failed'])
      .withMessage('Invalid status'),
  ],
  validateRequest,
  fileUploadController.updateFile.bind(fileUploadController)
);

// Delete file
router.post(
  '/delete',
  authenticate,
  [
    body('fileId')
      .notEmpty()
      .withMessage('File ID is required')
      .isMongoId()
      .withMessage('Invalid file ID format'),
  ],
  validateRequest,
  fileUploadController.deleteFile.bind(fileUploadController)
);

// Download file
router.post(
  '/download',
  authenticate,
  [
    body('fileId')
      .notEmpty()
      .withMessage('File ID is required')
      .isMongoId()
      .withMessage('Invalid file ID format'),
  ],
  validateRequest,
  fileUploadController.downloadFile.bind(fileUploadController)
);

// Get file statistics
router.post(
  '/stats',
  authenticate,
  fileUploadController.getFileStats.bind(fileUploadController)
);

// Chunked Upload Routes
// Initialize chunked upload
router.post(
  '/chunked/initialize',
  authenticate,
  [
    body('fileName')
      .notEmpty()
      .withMessage('File name is required'),
    body('fileSize')
      .isInt({ min: 1 })
      .withMessage('File size must be a positive integer'),
    body('totalChunks')
      .isInt({ min: 1 })
      .withMessage('Total chunks must be a positive integer'),
    body('mimeType')
      .optional(),
  ],
  validateRequest,
  fileUploadController.initializeChunkedUpload.bind(fileUploadController)
);

// Upload a chunk
router.post(
  '/chunked/upload',
  authenticate,
  upload.single('chunk'),
  fileUploadController.uploadChunk.bind(fileUploadController)
);

// Finalize chunked upload
router.post(
  '/chunked/finalize',
  authenticate,
  [
    body('uploadId')
      .notEmpty()
      .withMessage('Upload ID is required'),
    body('category')
      .optional()
      .isIn(['Documents', 'Reports', 'Images', 'Videos', 'Audio', 'Archives', 'Other'])
      .withMessage('Invalid category'),
  ],
  validateRequest,
  fileUploadController.finalizeChunkedUpload.bind(fileUploadController)
);

// Cancel chunked upload
router.post(
  '/chunked/cancel',
  authenticate,
  [
    body('uploadId')
      .notEmpty()
      .withMessage('Upload ID is required'),
  ],
  validateRequest,
  fileUploadController.cancelChunkedUpload.bind(fileUploadController)
);

module.exports = router;
