// ==============================================================================
// HOUSE OF SHUBHANSHI — AUTH CONTROLLER
// ==============================================================================
const authService = require('../services/auth.service');
const env = require('../config/env');
const { sendSuccess, sendError } = require('../utils/response');

function setAuthCookie(res, token, rememberMe = false) {
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : env.COOKIE_EXPIRES_IN_MS;
  res.cookie('token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge
  });
}

function clearAuthCookie(res) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
}

async function signup(req, res, next) {
  try {
    const { user, token } = await authService.signup(req.body);
    setAuthCookie(res, token, false);
    return sendSuccess(res, { user }, 'Account created successfully. Welcome to House of Shubhanshi.', 201);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { user, token } = await authService.login(req.body);
    setAuthCookie(res, token, !!req.body.rememberMe);
    return sendSuccess(res, { user }, 'Login successful. Welcome back.');
  } catch (err) {
    next(err);
  }
}

async function logout(req, res) {
  clearAuthCookie(res);
  return sendSuccess(res, null, 'Logged out successfully.');
}

async function getMe(req, res) {
  // req.user was populated by requireAuth middleware
  return sendSuccess(res, { user: req.user });
}

async function updateProfile(req, res, next) {
  try {
    const updated = await authService.updateProfile(req.user.id, req.body);
    return sendSuccess(res, { user: updated }, 'Profile updated successfully.');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  signup,
  login,
  logout,
  getMe,
  updateProfile
};
