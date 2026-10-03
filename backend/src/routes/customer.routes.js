// ==============================================================================
// HOUSE OF SHUBHANSHI — CUSTOMER PROFILE ROUTES
// ==============================================================================
const express = require('express');
const router = express.Router();
const authService = require('../services/auth.service');
const { requireAuth } = require('../middleware/auth');
const { sendSuccess } = require('../utils/response');

// Strict Protection: Patron must be logged in
router.use(requireAuth);

/**
 * GET /api/customer/profile
 * Returns authenticated patron profile
 */
router.get('/profile', async (req, res, next) => {
  try {
    const profile = await authService.getMe(req.user.id);
    return sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/customer/profile or PATCH /api/customer/profile
 * Update patron personal information
 */
router.put('/profile', async (req, res, next) => {
  try {
    const updated = await authService.updateProfile(req.user.id, req.body);
    return sendSuccess(res, { user: updated }, 'Profile updated successfully.');
  } catch (err) {
    next(err);
  }
});

router.patch('/profile', async (req, res, next) => {
  try {
    const updated = await authService.updateProfile(req.user.id, req.body);
    return sendSuccess(res, { user: updated }, 'Profile updated successfully.');
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/customer/change-password
 * Update patron password securely
 */
router.post('/change-password', async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    return sendSuccess(res, { updated: true }, 'Password updated successfully.');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
