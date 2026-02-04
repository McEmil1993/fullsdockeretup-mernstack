const markdownDocumentService = require('../services/markdownDocumentService');

/**
 * Get all documents for the logged-in user
 */
exports.getDocuments = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit, skip, sortBy, sortOrder } = req.query;
    
    const options = {
      limit: parseInt(limit) || 100,
      skip: parseInt(skip) || 0,
      sortBy: sortBy || 'order',
      sortOrder: sortOrder || 'asc'
    };
    
    const result = await markdownDocumentService.getDocuments(userId, options);
    
    res.status(200).json({
      success: true,
      data: result.documents,
      pagination: {
        total: result.total,
        limit: result.limit,
        skip: result.skip
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single document by ID
 */
exports.getDocumentById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const document = await markdownDocumentService.getDocumentById(userId, id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: document
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new document
 */
exports.createDocument = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = req.body;
    
    const document = await markdownDocumentService.createDocument(userId, data);
    
    res.status(201).json({
      success: true,
      data: document,
      message: 'Document created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update document
 */
exports.updateDocument = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updates = req.body;
    
    const document = await markdownDocumentService.updateDocument(userId, id, updates);
    
    res.status(200).json({
      success: true,
      data: document,
      message: 'Document updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete document
 */
exports.deleteDocument = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    await markdownDocumentService.deleteDocument(userId, id);
    
    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update document order
 */
exports.updateDocumentOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { documentOrders } = req.body;
    
    if (!Array.isArray(documentOrders)) {
      return res.status(400).json({
        success: false,
        message: 'documentOrders must be an array'
      });
    }
    
    await markdownDocumentService.updateDocumentOrder(userId, documentOrders);
    
    res.status(200).json({
      success: true,
      message: 'Document order updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search documents
 */
exports.searchDocuments = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const documents = await markdownDocumentService.searchDocuments(userId, q);
    
    res.status(200).json({
      success: true,
      data: documents
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete all documents
 */
exports.deleteAllDocuments = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const count = await markdownDocumentService.deleteAllDocuments(userId);
    
    res.status(200).json({
      success: true,
      message: `${count} documents deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};
