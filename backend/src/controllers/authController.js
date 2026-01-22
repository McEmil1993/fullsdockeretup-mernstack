const userService = require('../services/userService');
const { accessTokenCookieOptions, refreshTokenCookieOptions } = require('../config/authCookies');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

function getCookieName(kind) {
  if (kind === 'access') return process.env.ACCESS_TOKEN_COOKIE_NAME || 'access_token';
  if (kind === 'refresh') return process.env.REFRESH_TOKEN_COOKIE_NAME || 'refresh_token';
  return '';
}

function parseExpiresInToMs(expiresIn, fallbackMs) {
  if (!expiresIn) return fallbackMs;
  if (typeof expiresIn === 'number') return expiresIn * 1000;
  const s = String(expiresIn).trim().toLowerCase();
  const match = s.match(/^(\d+)\s*([smhd])$/);
  if (!match) return fallbackMs;
  const n = Number(match[1]);
  const unit = match[2];
  const mult = unit === 's' ? 1000 : unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : 86_400_000;
  return n * mult;
}

class AuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      const result = await userService.loginUser(email, password);

      const accessCookieName = getCookieName('access');
      const refreshCookieName = getCookieName('refresh');

      const accessMaxAge =
        Number(process.env.ACCESS_COOKIE_MAX_AGE_MS) ||
        parseExpiresInToMs(process.env.JWT_ACCESS_EXPIRES_IN, 15 * 60 * 1000);
      const refreshMaxAge =
        Number(process.env.REFRESH_COOKIE_MAX_AGE_MS) ||
        Number(process.env.JWT_REFRESH_DAYS || 7) * 24 * 60 * 60 * 1000;

      res.cookie(accessCookieName, result.accessToken, {
        ...accessTokenCookieOptions(),
        maxAge: accessMaxAge,
      });

      res.cookie(refreshCookieName, result.refreshToken, {
        ...refreshTokenCookieOptions(),
        maxAge: refreshMaxAge,
      });

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
        },
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: error.message || 'Login failed',
      });
    }
  }

  async me(req, res) {
    try {
      const user = await userService.getUserById(req.userId);
      return res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error.message || 'User not found',
      });
    }
  }

  async refresh(req, res) {
    try {
      const refreshCookieName = getCookieName('refresh');
      const refreshToken = req.cookies?.[refreshCookieName];

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'No refresh token provided',
        });
      }

      const user = await userService.verifyRefreshTokenAndGetUser(refreshToken);

      // Rotate refresh token for better security
      const newRefreshToken = await userService.rotateRefreshToken(user._id);
      const newAccessToken = userService.generateAccessToken(user);

      const accessCookieName = getCookieName('access');

      const accessMaxAge =
        Number(process.env.ACCESS_COOKIE_MAX_AGE_MS) ||
        parseExpiresInToMs(process.env.JWT_ACCESS_EXPIRES_IN, 15 * 60 * 1000);
      const refreshMaxAge =
        Number(process.env.REFRESH_COOKIE_MAX_AGE_MS) ||
        Number(process.env.JWT_REFRESH_DAYS || 7) * 24 * 60 * 60 * 1000;

      res.cookie(accessCookieName, newAccessToken, {
        ...accessTokenCookieOptions(),
        maxAge: accessMaxAge,
      });

      res.cookie(refreshCookieName, newRefreshToken, {
        ...refreshTokenCookieOptions(),
        maxAge: refreshMaxAge,
      });

      return res.status(200).json({
        success: true,
        message: 'Session refreshed',
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: error.message || 'Refresh failed',
      });
    }
  }

  async logout(req, res) {
    const accessCookieName = getCookieName('access');
    const refreshCookieName = getCookieName('refresh');

    // Since authenticate middleware already validated the token,
    // req.userId is available. Revoke tokens and increment tokenVersion.
    try {
      if (req.userId) {
        await userService.clearRefreshToken(req.userId);
        await User.findByIdAndUpdate(req.userId, { $inc: { tokenVersion: 1 } });
      }
    } catch (error) {
      // Log error but still clear cookies
      console.error('Error during logout token revocation:', error.message);
    }

    res.clearCookie(accessCookieName, { ...accessTokenCookieOptions() });
    res.clearCookie(refreshCookieName, { ...refreshTokenCookieOptions() });

    return res.status(200).json({
      success: true,
      message: 'Logged out',
    });
  }
}

module.exports = new AuthController();


