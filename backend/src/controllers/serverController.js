const serverService = require('../services/serverService');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

class ServerController {
  // Helper method to check if user has permission
  async checkPermission(req, res) {
    try {
      const user = await User.findById(req.userId).select('role');
      if (!user) {
        return { hasPermission: false, error: 'User not found' };
      }
      const hasPermission = user.role === 'admin' || user.role === 'teacher';
      return { hasPermission, user };
    } catch (error) {
      return { hasPermission: false, error: error.message };
    }
  }
  // Get all servers
  async getAllServers(req, res, next) {
    try {
      const { status, block, group } = req.query;
      const filters = {};
      
      if (status) filters.status = status;
      if (block) filters.block = block;
      if (group) filters.group = group;

      const servers = await serverService.getAllServers(filters);

      res.json({
        success: true,
        data: servers
      });
    } catch (error) {
      next(error);
    }
  }

  // Get server by ID
  async getServerById(req, res, next) {
    try {
      const server = await serverService.getServerById(req.params.id);

      res.json({
        success: true,
        data: server
      });
    } catch (error) {
      next(error);
    }
  }

  // Create new server
  async createServer(req, res, next) {
    try {
      // Check permission
      const { hasPermission, error } = await this.checkPermission(req, res);
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: error || 'You do not have permission to create servers'
        });
      }

      const serverData = {
        block: req.body.block,
        group: req.body.group,
        sshUser: req.body.sshUser,
        sshHost: req.body.sshHost,
        sshPassword: req.body.sshPassword,
        webHost: req.body.webHost,
        backendHost: req.body.backendHost,
        socketHost: req.body.socketHost,
        portsInsideDocker: req.body.portsInsideDocker || '3000 / 3001 / 3002'
      };

      const server = await serverService.createServer(serverData);

      res.status(201).json({
        success: true,
        message: 'Server created successfully',
        data: server
      });
    } catch (error) {
      next(error);
    }
  }

  // Update server
  async updateServer(req, res, next) {
    try {
      // Check permission
      const { hasPermission, error } = await this.checkPermission(req, res);
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: error || 'You do not have permission to update servers'
        });
      }

      const updateData = {};
      
      // Only include fields that are provided
      if (req.body.block !== undefined) updateData.block = req.body.block;
      if (req.body.group !== undefined) updateData.group = req.body.group;
      if (req.body.sshUser) updateData.sshUser = req.body.sshUser;
      if (req.body.sshHost) updateData.sshHost = req.body.sshHost;
      if (req.body.sshPassword) updateData.sshPassword = req.body.sshPassword;
      if (req.body.webHost) updateData.webHost = req.body.webHost;
      if (req.body.backendHost) updateData.backendHost = req.body.backendHost;
      if (req.body.socketHost) updateData.socketHost = req.body.socketHost;
      if (req.body.portsInsideDocker) updateData.portsInsideDocker = req.body.portsInsideDocker;

      const server = await serverService.updateServer(req.params.id, updateData);

      res.json({
        success: true,
        message: 'Server updated successfully',
        data: server
      });
    } catch (error) {
      next(error);
    }
  }

  // Deactivate server
  async deactivateServer(req, res, next) {
    try {
      // Check permission
      const { hasPermission, error } = await this.checkPermission(req, res);
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: error || 'You do not have permission to deactivate servers'
        });
      }

      const server = await serverService.deactivateServer(req.params.id);

      res.json({
        success: true,
        message: 'Server deactivated successfully',
        data: server
      });
    } catch (error) {
      next(error);
    }
  }

  // Reactivate server
  async reactivateServer(req, res, next) {
    try {
      // Check permission
      const { hasPermission, error } = await this.checkPermission(req, res);
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: error || 'You do not have permission to reactivate servers'
        });
      }

      const server = await serverService.reactivateServer(req.params.id);

      res.json({
        success: true,
        message: 'Server reactivated successfully',
        data: server
      });
    } catch (error) {
      next(error);
    }
  }

  // Import servers from Excel
  async importServersFromExcel(req, res, next) {
    try {
      // Check permission
      const { hasPermission, error } = await this.checkPermission(req, res);
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: error || 'You do not have permission to import servers'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      // Check file extension
      const ext = path.extname(req.file.originalname).toLowerCase();
      if (ext !== '.xlsx' && ext !== '.xls') {
        // Delete uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'Invalid file format. Only .xlsx and .xls files are allowed'
        });
      }

      // Get skipDuplicates option from request body
      const skipDuplicates = req.body.skipDuplicates === 'true' || req.body.skipDuplicates === true;

      // Import servers from Excel
      const results = await serverService.importServersFromExcel(req.file.path, skipDuplicates);

      // Delete uploaded file after import
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        message: `Import completed: ${results.success} succeeded, ${results.failed} failed${results.skipped ? `, ${results.skipped} skipped` : ''}`,
        data: results
      });
    } catch (error) {
      // Clean up file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      next(error);
    }
  }
}

module.exports = new ServerController();
