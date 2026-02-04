import api from './api';

/**
 * Get all markdown documents
 */
export const getDocuments = async (options = {}) => {
  const { limit = 100, skip = 0, sortBy = 'order', sortOrder = 'asc' } = options;
  const response = await api.get('/documents', {
    params: { limit, skip, sortBy, sortOrder }
  });
  return response.data;
};

/**
 * Get single document by ID
 */
export const getDocumentById = async (id) => {
  const response = await api.get(`/documents/${id}`);
  return response.data;
};

/**
 * Create new document
 */
export const createDocument = async (data) => {
  const response = await api.post('/documents', data);
  return response.data;
};

/**
 * Update document
 */
export const updateDocument = async (id, updates) => {
  const response = await api.put(`/documents/${id}`, updates);
  return response.data;
};

/**
 * Delete document
 */
export const deleteDocument = async (id) => {
  const response = await api.delete(`/documents/${id}`);
  return response.data;
};

/**
 * Update document order
 */
export const updateDocumentOrder = async (documentOrders) => {
  const response = await api.post('/documents/order', { documentOrders });
  return response.data;
};

/**
 * Search documents
 */
export const searchDocuments = async (query) => {
  const response = await api.get('/documents/search', {
    params: { q: query }
  });
  return response.data;
};

/**
 * Delete all documents
 */
export const deleteAllDocuments = async () => {
  const response = await api.delete('/documents');
  return response.data;
};
