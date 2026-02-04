const MarkdownDocument = require('../models/MarkdownDocument');

class MarkdownDocumentService {
  /**
   * Get all documents for a user
   */
  async getDocuments(userId, options = {}) {
    try {
      const { limit = 100, skip = 0, sortBy = 'order', sortOrder = 'asc' } = options;
      
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      
      const documents = await MarkdownDocument.find({ userId })
        .sort(sort)
        .limit(limit)
        .skip(skip);
      
      const total = await MarkdownDocument.countDocuments({ userId });
      
      return {
        documents,
        total,
        limit,
        skip
      };
    } catch (error) {
      console.error('Error getting documents:', error);
      throw error;
    }
  }

  /**
   * Get single document by ID
   */
  async getDocumentById(userId, documentId) {
    try {
      const document = await MarkdownDocument.findOne({
        _id: documentId,
        userId
      });
      
      return document;
    } catch (error) {
      console.error('Error getting document:', error);
      throw error;
    }
  }

  /**
   * Create new document
   */
  async createDocument(userId, data) {
    try {
      // Get max order and increment
      const maxOrder = await MarkdownDocument.findOne({ userId })
        .sort({ order: -1 })
        .select('order')
        .lean();
      
      const newOrder = maxOrder ? maxOrder.order + 1 : 0;
      
      const document = await MarkdownDocument.create({
        userId,
        title: data.title || 'Untitled Document',
        content: data.content || '',
        order: newOrder,
        tags: data.tags || [],
        isFavorite: data.isFavorite || false
      });
      
      return document;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  /**
   * Update document
   */
  async updateDocument(userId, documentId, updates) {
    try {
      const document = await MarkdownDocument.findOneAndUpdate(
        { _id: documentId, userId },
        { $set: updates },
        { new: true, runValidators: true }
      );
      
      if (!document) {
        throw new Error('Document not found');
      }
      
      return document;
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(userId, documentId) {
    try {
      const document = await MarkdownDocument.findOneAndDelete({
        _id: documentId,
        userId
      });
      
      if (!document) {
        throw new Error('Document not found');
      }
      
      return document;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Bulk update document order
   */
  async updateDocumentOrder(userId, documentOrders) {
    try {
      const bulkOps = documentOrders.map(({ id, order }) => ({
        updateOne: {
          filter: { _id: id, userId },
          update: { $set: { order } }
        }
      }));
      
      await MarkdownDocument.bulkWrite(bulkOps);
      return true;
    } catch (error) {
      console.error('Error updating document order:', error);
      throw error;
    }
  }

  /**
   * Search documents
   */
  async searchDocuments(userId, query) {
    try {
      const documents = await MarkdownDocument.find({
        userId,
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { content: { $regex: query, $options: 'i' } },
          { tags: { $regex: query, $options: 'i' } }
        ]
      }).sort({ order: 1 });
      
      return documents;
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  }

  /**
   * Delete all documents for a user
   */
  async deleteAllDocuments(userId) {
    try {
      const result = await MarkdownDocument.deleteMany({ userId });
      return result.deletedCount;
    } catch (error) {
      console.error('Error deleting all documents:', error);
      throw error;
    }
  }
}

module.exports = new MarkdownDocumentService();
