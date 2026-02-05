const jwt = require('jsonwebtoken');
require('dotenv').config();
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const accessCookieName = process.env.ACCESS_TOKEN_COOKIE_NAME || 'access_token';
    const allowAuthHeader = String(process.env.ALLOW_AUTH_HEADER || '').toLowerCase() === 'true';

    // Preferred: HttpOnly cookie
    let token = req.cookies?.[accessCookieName];

    // Backward compatible: Authorization: Bearer <token>
    if (!token && allowAuthHeader) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    // Verify token
    const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({
        success: false,
        message: 'JWT secret is not configured.',
      });
    }

    const decoded = jwt.verify(token, secret);

    // Attach user ID to request object
    req.userId = decoded.userId;
    
    // Also attach user object for compatibility
    req.user = { id: decoded.userId };

    // Optional immediate revocation: tokenVersion must match user.tokenVersion
    const user = await User.findById(decoded.userId).select('tokenVersion status');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed.',
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is not active.',
      });
    }

    const currentVersion = typeof user.tokenVersion === 'number' ? user.tokenVersion : 0;
    const tokenVersion = typeof decoded.tokenVersion === 'number' ? decoded.tokenVersion : 0;
    if (tokenVersion !== currentVersion) {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked.',
      });
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Authentication failed.',
    });
  }
};

module.exports = { authenticate };

