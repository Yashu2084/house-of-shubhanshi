// ==============================================================================
// HOUSE OF SHUBHANSHI — AUTH CONTROLLER
// ==============================================================================
const authService = require('../services/auth.service');
const env = require('../config/env');
const { sendSuccess, sendError } = require('../utils/response');

function isSecureConnection(req) {
  if (env.NODE_ENV === 'production') {
    return true;
  }
  return req ? Boolean(req.secure || req.headers['x-forwarded-proto'] === 'https') : false;
}

function setAuthCookie(res, token, rememberMe = false, req = null) {
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : env.COOKIE_EXPIRES_IN_MS;
  res.cookie('token', token, {
    httpOnly: true,
    secure: isSecureConnection(req),
    sameSite: 'lax',
    path: '/',
    maxAge
  });
}

function clearAuthCookie(res, req = null) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: isSecureConnection(req),
    sameSite: 'lax',
    path: '/'
  });
}

async function signup(req, res, next) {
  try {
    const { user, token } = await authService.signup(req.body);
    setAuthCookie(res, token, false, req);
    return res.status(201).json({
      success: true,
      authenticated: true,
      message: 'Account created successfully. Welcome to House of Shubhanshi.',
      data: { user, token, authenticated: true },
      user,
      token
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { user, token } = await authService.login(req.body);
    setAuthCookie(res, token, !!req.body.rememberMe, req);
    return res.status(200).json({
      success: true,
      authenticated: true,
      message: 'Login successful. Welcome back.',
      data: { user, token, authenticated: true },
      user,
      token
    });
  } catch (err) {
    next(err);
  }
}


async function logout(req, res) {
  clearAuthCookie(res, req);
  return res.status(200).json({
    success: true,
    authenticated: false,
    message: 'Logged out successfully.',
    data: null
  });
}

async function getMe(req, res) {
  // req.user was populated by requireAuth middleware
  return res.status(200).json({
    success: true,
    authenticated: true,
    message: 'Authenticated session active',
    data: {
      authenticated: true,
      user: req.user
    },
    user: req.user
  });
}

async function updateProfile(req, res, next) {
  try {
    const updated = await authService.updateProfile(req.user.id, req.body);
    return sendSuccess(res, { user: updated }, 'Profile updated successfully.');
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    return sendSuccess(res, { updated: true }, 'Password updated successfully.');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  signup,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword
};
