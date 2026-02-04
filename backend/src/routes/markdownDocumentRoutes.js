const express = require('express');
const router = express.Router();
const markdownDocumentController = require('../controllers/markdownDocumentController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Document CRUD operations
router.get('/', markdownDocumentController.getDocuments);
router.post('/', markdownDocumentController.createDocument);
router.get('/search', markdownDocumentController.searchDocuments);
router.get('/:id', markdownDocumentController.getDocumentById);
router.put('/:id', markdownDocumentController.updateDocument);
router.delete('/:id', markdownDocumentController.deleteDocument);

// Bulk operations
router.post('/order', markdownDocumentController.updateDocumentOrder);
router.delete('/', markdownDocumentController.deleteAllDocuments);

module.exports = router;
