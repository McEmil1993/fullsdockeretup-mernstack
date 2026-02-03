const dockerService = require('../services/dockerService');
const DockerActionLog = require('../models/DockerActionLog');

/**
 * Docker Controller
 * Handles HTTP requests for Docker operations
 */

/**
 * Helper function to log docker actions
 */
async function logDockerAction(action, targetType, targetId, targetName, targetImage, success, errorMessage, req) {
  try {
    console.log(`Logging action: ${action} on ${targetType} ${targetName}`);
    const logEntry = await DockerActionLog.create({
      action,
      targetType,
      targetId,
      targetName,
      targetImage,
      success,
      errorMessage,
      userId: req.user?._id,
      userName: req.user?.name || req.user?.email,
      ipAddress: req.ip || req.connection.remoteAddress
    });
    console.log(`Successfully logged action: ${logEntry._id}`);
  } catch (error) {
    console.error('Failed to log docker action:', error.message);
    console.error('Error details:', error);
    // Don't throw - logging failure shouldn't break the main operation
  }
}

/**
 * Get all Docker images
 */
exports.getAllImages = async (req, res, next) => {
  try {
    const images = await dockerService.getAllImages();
    res.json({
      success: true,
      data: images,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all containers (running and stopped)
 */
exports.getAllContainers = async (req, res, next) => {
  try {
    const containers = await dockerService.getAllContainers();
    res.json({
      success: true,
      data: containers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get running containers
 */
exports.getRunningContainers = async (req, res, next) => {
  try {
    const containers = await dockerService.getRunningContainers();
    res.json({
      success: true,
      data: containers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get container stats
 */
exports.getContainerStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const stats = await dockerService.getContainerStats(id);
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all container stats
 */
exports.getAllContainerStats = async (req, res, next) => {
  try {
    const stats = await dockerService.getAllContainerStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get container logs
 */
exports.getContainerLogs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tail = 100 } = req.query;
    const logs = await dockerService.getContainerLogs(id, tail);
    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Restart container
 */
exports.restartContainer = async (req, res, next) => {
  let containerInfo = null;
  try {
    const { id } = req.params;
    
    // Get container info before restart
    try {
      const containers = await dockerService.getAllContainers();
      containerInfo = containers.find(c => c.id.startsWith(id) || c.name === id);
    } catch (e) {
      console.error('Failed to get container info:', e);
    }
    
    const result = await dockerService.restartContainer(id);
    
    // Log successful restart
    await logDockerAction(
      'restart',
      'container',
      containerInfo?.id || id,
      containerInfo?.name || id,
      containerInfo?.image,
      true,
      null,
      req
    );
    
    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    // Log failed restart
    await logDockerAction(
      'restart',
      'container',
      containerInfo?.id || req.params.id,
      containerInfo?.name || req.params.id,
      containerInfo?.image,
      false,
      error.message,
      req
    );
    next(error);
  }
};

/**
 * Stop container
 */
exports.stopContainer = async (req, res, next) => {
  let containerInfo = null;
  try {
    const { id } = req.params;
    
    // Get container info before stop
    try {
      const containers = await dockerService.getAllContainers();
      containerInfo = containers.find(c => c.id.startsWith(id) || c.name === id);
    } catch (e) {
      console.error('Failed to get container info:', e);
    }
    
    const result = await dockerService.stopContainer(id);
    
    // Log successful stop
    await logDockerAction(
      'stop',
      'container',
      containerInfo?.id || id,
      containerInfo?.name || id,
      containerInfo?.image,
      true,
      null,
      req
    );
    
    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    // Log failed stop
    await logDockerAction(
      'stop',
      'container',
      containerInfo?.id || req.params.id,
      containerInfo?.name || req.params.id,
      containerInfo?.image,
      false,
      error.message,
      req
    );
    next(error);
  }
};

/**
 * Start container
 */
exports.startContainer = async (req, res, next) => {
  let containerInfo = null;
  try {
    const { id } = req.params;
    
    // Get container info before start
    try {
      const containers = await dockerService.getAllContainers();
      containerInfo = containers.find(c => c.id.startsWith(id) || c.name === id);
    } catch (e) {
      console.error('Failed to get container info:', e);
    }
    
    const result = await dockerService.startContainer(id);
    
    // Log successful start
    await logDockerAction(
      'start',
      'container',
      containerInfo?.id || id,
      containerInfo?.name || id,
      containerInfo?.image,
      true,
      null,
      req
    );
    
    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    // Log failed start
    await logDockerAction(
      'start',
      'container',
      containerInfo?.id || req.params.id,
      containerInfo?.name || req.params.id,
      containerInfo?.image,
      false,
      error.message,
      req
    );
    next(error);
  }
};

/**
 * Remove container
 */
exports.removeContainer = async (req, res, next) => {
  let containerInfo = null;
  try {
    const { id } = req.params;
    const { force = false } = req.query;
    
    // Get container info before removal
    try {
      const containers = await dockerService.getAllContainers();
      containerInfo = containers.find(c => c.id.startsWith(id) || c.name === id);
    } catch (e) {
      console.error('Failed to get container info:', e);
    }
    
    const result = await dockerService.removeContainer(id, force === 'true');
    
    // Log successful removal
    await logDockerAction(
      'remove',
      'container',
      containerInfo?.id || id,
      containerInfo?.name || id,
      containerInfo?.image,
      true,
      null,
      req
    );
    
    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    // Log failed removal
    await logDockerAction(
      'remove',
      'container',
      containerInfo?.id || req.params.id,
      containerInfo?.name || req.params.id,
      containerInfo?.image,
      false,
      error.message,
      req
    );
    next(error);
  }
};

/**
 * Remove image
 */
exports.removeImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { force = false } = req.query;
    const result = await dockerService.removeImage(id, force === 'true');
    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Prune unused images
 */
exports.pruneImages = async (req, res, next) => {
  try {
    const result = await dockerService.pruneImages();
    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Docker system info
 */
exports.getSystemInfo = async (req, res, next) => {
  try {
    const info = await dockerService.getSystemInfo();
    res.json({
      success: true,
      data: info,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Docker disk usage
 */
exports.getDiskUsage = async (req, res, next) => {
  try {
    const usage = await dockerService.getDiskUsage();
    res.json({
      success: true,
      data: usage,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Rebuild container
 */
exports.rebuildContainer = async (req, res, next) => {
  try {
    const { serviceName } = req.params;
    const { composePath } = req.body;
    const result = await dockerService.rebuildContainer(serviceName, composePath);
    res.json({
      success: true,
      message: result.message,
      output: result.output,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Inspect container
 */
exports.inspectContainer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const details = await dockerService.inspectContainer(id);
    res.json({
      success: true,
      data: details,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Recreate container (stop, remove, and recreate with same image)
 */
exports.recreateContainer = async (req, res, next) => {
  let containerInfo = null;
  try {
    const { id } = req.params;
    
    // Get container info before recreation
    try {
      const containers = await dockerService.getAllContainers();
      containerInfo = containers.find(c => c.id.startsWith(id) || c.name === id);
    } catch (e) {
      console.error('Failed to get container info:', e);
    }
    
    const result = await dockerService.recreateContainer(id);
    
    // Log successful recreation
    await logDockerAction(
      'recreate',
      'container',
      containerInfo?.id || id,
      containerInfo?.name || id,
      containerInfo?.image,
      true,
      null,
      req
    );
    
    res.json({
      success: true,
      message: result.message,
      data: result.newContainer,
    });
  } catch (error) {
    // Log failed recreation
    await logDockerAction(
      'recreate',
      'container',
      containerInfo?.id || req.params.id,
      containerInfo?.name || req.params.id,
      containerInfo?.image,
      false,
      error.message,
      req
    );
    next(error);
  }
};

/**
 * Get container bash history
 */
exports.getContainerBashHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const history = await dockerService.getContainerBashHistory(id);
    
    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};
