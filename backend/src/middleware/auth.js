// ==============================================================================
// HOUSE OF SHUBHANSHI — AUTHENTICATION & AUTHORIZATION MIDDLEWARE
// ==============================================================================
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const db = require('../config/db');
const { sendError } = require('../utils/response');

/**
 * Extract token from HTTP-only Cookie or Bearer Authorization Header
 */
function extractToken(req) {
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return null;
}

/**
 * Require Authenticated User Middleware
 */
async function requireAuth(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      authenticated: false,
      message: 'Authentication required. Please log in.'
    });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await db.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        authenticated: false,
        message: 'User session invalid or user no longer exists.'
      });
    }

    // Exclude passwordHash from req.user
    const { passwordHash, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        authenticated: false,
        message: 'Session expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      authenticated: false,
      message: 'Invalid authentication token.'
    });
  }
}

/**
 * Require Admin Role Middleware
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      authenticated: false,
      message: 'Authentication required.'
    });
  }

  if (String(req.user.role).toUpperCase() !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Administrator privileges required.'
    });
  }

  next();
}

/**
 * Optional Auth Middleware (Doesn't block, only populates req.user if token present)
 */
async function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await db.user.findUnique({
      where: { id: decoded.id }
    });
    if (user) {
      const { passwordHash, ...safeUser } = user;
      req.user = safeUser;
    } else {
      req.user = null;
    }
  } catch (err) {
    req.user = null;
  }
  next();
}

module.exports = {
  requireAuth,
  requireAdmin,
  optionalAuth
};
