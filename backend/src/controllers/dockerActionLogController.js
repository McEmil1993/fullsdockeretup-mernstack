/**
 * Docker Action Log Controller
 * Handles requests for Docker action logs
 */

const DockerActionLog = require('../models/DockerActionLog');

/**
 * Get all docker action logs with filters
 */
exports.getActionLogs = async (req, res, next) => {
  try {
    const {
      action,
      targetType,
      targetName,
      success,
      limit = 100,
      page = 1
    } = req.query;

    // Build query
    const query = {};
    if (action) query.action = action;
    if (targetType) query.targetType = targetType;
    if (targetName) query.targetName = new RegExp(targetName, 'i'); // Case-insensitive search
    if (success !== undefined) query.success = success === 'true';

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch logs with pagination
    const logs = await DockerActionLog.find(query)
      .sort({ createdAt: -1 }) // Newest first
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Get total count for pagination
    const total = await DockerActionLog.countDocuments(query);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent docker action logs (last 50)
 */
exports.getRecentLogs = async (req, res, next) => {
  try {
    const logs = await DockerActionLog.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get action logs for a specific container
 */
exports.getContainerLogs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 20 } = req.query;

    const logs = await DockerActionLog.find({
      targetType: 'container',
      $or: [
        { targetId: new RegExp(id, 'i') },
        { targetName: new RegExp(id, 'i') }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get action statistics
 */
exports.getActionStats = async (req, res, next) => {
  try {
    const stats = await DockerActionLog.aggregate([
      {
        $group: {
          _id: {
            action: '$action',
            success: '$success'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.action',
          total: { $sum: '$count' },
          successful: {
            $sum: {
              $cond: [{ $eq: ['$_id.success', true] }, '$count', 0]
            }
          },
          failed: {
            $sum: {
              $cond: [{ $eq: ['$_id.success', false] }, '$count', 0]
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete old logs (cleanup)
 */
exports.deleteOldLogs = async (req, res, next) => {
  try {
    const { days = 90 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await DockerActionLog.deleteMany({
      createdAt: { $lt: cutoffDate }
    });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} logs older than ${days} days`
    });
  } catch (error) {
    next(error);
  }
};
