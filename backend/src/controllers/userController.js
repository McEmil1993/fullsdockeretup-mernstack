const userService = require('../services/userService');
const authController = require('./authController');

class UserController {
  async login(req, res) {
    // Keep backwards-compatibility: delegate to the dedicated auth controller.
    // IMPORTANT: do not return tokens in JSON; use HttpOnly cookies instead.
    return authController.login(req, res);
  }

  async createUser(req, res) {
    try {
      const { name, email, role, status, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, and password are required',
        });
      }

      const user = await userService.createUser({
        name,
        email,
        role,
        status,
        password,
      });

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create user',
      });
    }
  }

  async updateUser(req, res) {
    try {
      const { userId, name, email, role } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (role) updateData.role = role;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one field (name, email, role) must be provided for update',
        });
      }

      const user = await userService.updateUser(userId, updateData);

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: user,
      });
    } catch (error) {
      const statusCode = error.message === 'User not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update user',
      });
    }
  }

  async updateUserStatus(req, res) {
    try {
      const { userId, status } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
      }

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required',
        });
      }

      const user = await userService.updateUserStatus(userId, status);

      res.status(200).json({
        success: true,
        message: 'User status updated successfully',
        data: user,
      });
    } catch (error) {
      const statusCode = error.message === 'User not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update user status',
      });
    }
  }

  async getUserById(req, res) {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
      }

      const user = await userService.getUserById(userId);

      res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: user,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message || 'User not found',
      });
    }
  }

  async getAllUsers(req, res) {
    try {
      const { page, limit } = req.body;

      // Exclude the currently logged-in user from the list
      const excludeUserId = req.userId || null;

      const result = await userService.getAllUsers(page, limit, excludeUserId);

      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: result.data,
        count: result.count,
        page: result.page,
        total_count: result.total_count,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve users',
      });
    }
  }

  async changePassword(req, res) {
    try {
      const { userId, newPassword } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
      }

      if (!newPassword) {
        return res.status(400).json({
          success: false,
          message: 'New password is required',
        });
      }

      const user = await userService.changePassword(userId, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
        data: user,
      });
    } catch (error) {
      const statusCode = error.message === 'User not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to change password',
      });
    }
  }

  async verifyCurrentPassword(req, res) {
    try {
      const { userId, currentPassword } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
      }

      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required',
        });
      }

      const isValid = await userService.verifyCurrentPassword(userId, currentPassword);

      if (isValid) {
        return res.status(200).json({
          success: true,
          message: 'Password is correct',
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Wrong password',
        });
      }
    } catch (error) {
      const statusCode = error.message === 'User not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to verify password',
      });
    }
  }
}

module.exports = new UserController();

