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
    return sendError(res, 'Authentication required. Please log in.', 401);
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await db.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return sendError(res, 'User session invalid or user no longer exists.', 401);
    }

    // Exclude passwordHash from req.user
    const { passwordHash, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Session expired. Please log in again.', 401);
    }
    return sendError(res, 'Invalid authentication token.', 401);
  }
}

/**
 * Require Admin Role Middleware
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return sendError(res, 'Authentication required.', 401);
  }

  if (req.user.role !== 'ADMIN') {
    return sendError(res, 'Forbidden. Administrator privileges required.', 403);
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
