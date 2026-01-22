const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class UserService {
  async loginUser(email, password) {
    try {
      const user = await User.findOne({ email }).select('+password');
      
      if (!user) {
        throw new Error('Email does not exist');
      }

      if (user.status !== 'active') {
        throw new Error('Account is not active. Please contact administrator.');
      }

      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        throw new Error('Wrong password');
      }

      const userData = user.toObject();
      delete userData.password;

      return {
        user: userData,
        accessToken: this.generateAccessToken(user),
        refreshToken: await this.issueAndStoreRefreshToken(user._id),
      };
    } catch (error) {
      throw error;
    }
  }

  async createUser(userData) {
    try {
      const { name, email, role, status, password } = userData;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      const user = new User({
        name,
        email,
        role: role || 'student',
        status: status || 'active',
        password,
      });

      await user.save();

      const userResponse = user.toObject();
      delete userResponse.password;

      return userResponse;
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('User with this email already exists');
      }
      throw error;
    }
  }

  async updateUser(userId, updateData) {
    try {
      const { name, email, role } = updateData;

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          throw new Error('Email is already taken by another user');
        }
      }

      if (name) user.name = name;
      if (email) user.email = email;
      if (role) user.role = role;

      await user.save();

      const userResponse = user.toObject();
      delete userResponse.password;

      return userResponse;
    } catch (error) {
      throw error;
    }
  }

  async updateUserStatus(userId, status) {
    try {
      const validStatuses = ['active', 'inactive', 'suspended'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid status. Must be one of: active, inactive, suspended');
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { status },
        { new: true, runValidators: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      const userResponse = user.toObject();
      delete userResponse.password;

      return userResponse;
    } catch (error) {
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      const userResponse = user.toObject();
      delete userResponse.password;

      return userResponse;
    } catch (error) {
      throw error;
    }
  }

  async getUserByIdWithRefresh(userId) {
    return await User.findById(userId).select('+refreshTokenHash +refreshTokenExpiresAt');
  }

  async issueAndStoreRefreshToken(userId) {
    const refreshToken = this.generateRefreshToken({ _id: userId });
    const refreshTokenHash = this.hashToken(refreshToken);
    const refreshTokenExpiresAt = this.getRefreshExpiryDate();

    await User.findByIdAndUpdate(
      userId,
      { refreshTokenHash, refreshTokenExpiresAt },
      { new: false }
    );

    return refreshToken;
  }

  async rotateRefreshToken(userId) {
    // Generate and store a NEW refresh token (rotation)
    return await this.issueAndStoreRefreshToken(userId);
  }

  async clearRefreshToken(userId) {
    await User.findByIdAndUpdate(
      userId,
      { refreshTokenHash: null, refreshTokenExpiresAt: null },
      { new: false }
    );
  }

  async verifyRefreshTokenAndGetUser(refreshToken) {
    const refreshSecret = this.getJwtRefreshSecret();
    const decoded = jwt.verify(refreshToken, refreshSecret);

    const user = await this.getUserByIdWithRefresh(decoded.userId);
    if (!user) throw new Error('User not found');

    if (!user.refreshTokenHash || !user.refreshTokenExpiresAt) {
      throw new Error('Refresh token is not valid');
    }

    if (user.refreshTokenExpiresAt.getTime() < Date.now()) {
      throw new Error('Refresh token has expired');
    }

    const incomingHash = this.hashToken(refreshToken);
    if (incomingHash !== user.refreshTokenHash) {
      throw new Error('Refresh token is not valid');
    }

    return user;
  }

  async getAllUsers(page, limit, excludeUserId = null) {
    try {
      // Build query - exclude current user if provided
      const query = excludeUserId ? { _id: { $ne: excludeUserId } } : {};

      // Get total count (excluding current user)
      const totalCount = await User.countDocuments(query);

      // Get users with or without pagination
      let users;
      if (page !== undefined && limit !== undefined) {
        // Pagination enabled
        const skip = (page - 1) * limit;
        users = await User.find(query)
          .select('-password')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);
      } else {
        // No pagination - return all results
        users = await User.find(query)
          .select('-password')
          .sort({ createdAt: -1 });
      }

      // Convert to plain objects and ensure password is not included
      const usersData = users.map(user => {
        const userObj = user.toObject();
        delete userObj.password;
        return userObj;
      });

      return {
        data: usersData,
        count: usersData.length,
        page: page !== undefined ? parseInt(page) : undefined,
        total_count: totalCount,
      };
    } catch (error) {
      throw error;
    }
  }

  getJwtAccessSecret() {
    return process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  }

  getJwtRefreshSecret() {
    return process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  }

  generateAccessToken(user) {
    const secret = this.getJwtAccessSecret();
    if (!secret) throw new Error('JWT secret is not configured');
    const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
    const tokenVersion = typeof user.tokenVersion === 'number' ? user.tokenVersion : 0;
    return jwt.sign({ userId: user._id, tokenVersion }, secret, { expiresIn });
  }

  generateRefreshToken(user) {
    const secret = this.getJwtRefreshSecret();
    if (!secret) throw new Error('JWT secret is not configured');
    const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    return jwt.sign({ userId: user._id }, secret, { expiresIn });
  }

  getRefreshExpiryDate() {
    const days = Number(process.env.JWT_REFRESH_DAYS || 7);
    const ms = Number.isFinite(days) ? days * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
    return new Date(Date.now() + ms);
  }

  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async changePassword(userId, newPassword) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      if (!newPassword || newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Set new password (will be hashed by pre-save hook)
      user.password = newPassword;
      await user.save();

      const userResponse = user.toObject();
      delete userResponse.password;

      return userResponse;
    } catch (error) {
      throw error;
    }
  }

  async verifyCurrentPassword(userId, currentPassword) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      if (!currentPassword) {
        throw new Error('Current password is required');
      }

      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new Error('User not found');
      }

      const isPasswordValid = await user.comparePassword(currentPassword);
      
      return isPasswordValid;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new UserService();

