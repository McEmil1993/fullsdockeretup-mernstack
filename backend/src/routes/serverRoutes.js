const express = require('express');
const router = express.Router();
const serverController = require('../controllers/serverController');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for Excel file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'server-import-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// All routes require authentication
router.use(authenticate);

// Get all servers (all authenticated users can view)
router.get('/', serverController.getAllServers.bind(serverController));

// Get server by ID (all authenticated users can view)
router.get('/:id', serverController.getServerById.bind(serverController));

// Create server (admin and superadmin only - role check in controller)
router.post('/', serverController.createServer.bind(serverController));

// Update server (admin and superadmin only - role check in controller)
router.put('/:id', serverController.updateServer.bind(serverController));

// Deactivate server (admin and superadmin only - role check in controller)
router.patch('/:id/deactivate', serverController.deactivateServer.bind(serverController));

// Reactivate server (admin and superadmin only - role check in controller)
router.patch('/:id/reactivate', serverController.reactivateServer.bind(serverController));

// Import servers from Excel (admin and superadmin only - role check in controller)
router.post('/import/excel', upload.single('file'), serverController.importServersFromExcel.bind(serverController));

module.exports = router;
