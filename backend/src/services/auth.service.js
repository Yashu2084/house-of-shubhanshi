// ==============================================================================
// HOUSE OF SHUBHANSHI — AUTHENTICATION SERVICE
// ==============================================================================
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const env = require('../config/env');
const { validateSignup, validateLogin } = require('../utils/validator');

/**
 * Generate signed JWT token
 * @param {object} user
 * @param {boolean} rememberMe
 */
function generateToken(user, rememberMe = false) {
  const expiresIn = rememberMe ? '30d' : '7d';
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    env.JWT_SECRET,
    { expiresIn }
  );
}

/**
 * Register a new customer
 */
async function signup(payload) {
  const validation = validateSignup(payload);
  if (!validation.isValid) {
    const errorMsg = Object.values(validation.errors)[0] || 'Validation failed';
    const error = new Error(errorMsg);
    error.statusCode = 400;
    error.errors = validation.errors;
    throw error;
  }

  const emailNormalized = String(payload.email).trim().toLowerCase();

  // Check if user already exists
  const existing = await db.user.findUnique({
    where: { email: emailNormalized }
  });

  if (existing) {
    const error = new Error('An account with this email address already exists.');
    error.statusCode = 409;
    throw error;
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(payload.password, salt);

  // Security: ALWAYS enforce CUSTOMER role for public signup
  const newUser = await db.user.create({
    data: {
      name: payload.name.trim(),
      email: emailNormalized,
      phone: payload.phone ? payload.phone.trim() : null,
      passwordHash,
      role: 'CUSTOMER',
      dob: payload.dob ? String(payload.dob).trim() : null
    }
  });

  const token = generateToken(newUser, false);
  const { passwordHash: _, ...safeUser } = newUser;

  return { user: safeUser, token };
}

/**
 * Authenticate customer or admin
 */
async function login(payload) {
  const validation = validateLogin(payload);
  if (!validation.isValid) {
    const errorMsg = Object.values(validation.errors)[0] || 'Please provide a valid email and password.';
    const error = new Error(errorMsg);
    error.statusCode = 400;
    error.errors = validation.errors;
    throw error;
  }

  const emailNormalized = String(payload.email).trim().toLowerCase();

  const user = await db.user.findUnique({
    where: { email: emailNormalized }
  });

  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(payload.password, user.passwordHash);
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user, !!payload.rememberMe);
  const { passwordHash: _, ...safeUser } = user;

  return { user: safeUser, token };
}

/**
 * Get Current User Profile
 */
async function getMe(userId) {
  const user = await db.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

/**
 * Update Customer Profile
 */
async function updateProfile(userId, { name, phone, email, dob }) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  const updateData = {};
  if (name && typeof name === 'string') updateData.name = name.trim();
  if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
  if (dob !== undefined) updateData.dob = dob ? String(dob).trim() : null;

  if (email && typeof email === 'string' && email.trim().toLowerCase() !== user.email.toLowerCase()) {
    const cleanEmail = email.trim().toLowerCase();
    const existing = await db.user.findUnique({ where: { email: cleanEmail } });
    if (existing && existing.id !== userId) {
      const error = new Error('This email address is already registered to another account.');
      error.statusCode = 409;
      throw error;
    }
    updateData.email = cleanEmail;
  }

  const updatedUser = await db.user.update({
    where: { id: userId },
    data: updateData
  });

  const { passwordHash, ...safeUser } = updatedUser;
  return safeUser;
}

/**
 * Change Customer Password
 */
async function changePassword(userId, currentPassword, newPassword) {
  if (!currentPassword || !newPassword) {
    const error = new Error('Both current and new password are required.');
    error.statusCode = 400;
    throw error;
  }
  if (newPassword.length < 8) {
    const error = new Error('New password must be at least 8 characters.');
    error.statusCode = 400;
    throw error;
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash || user.password_hash || '');
  if (!isMatch) {
    const error = new Error('Current password is incorrect.');
    error.statusCode = 400;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  await db.user.update({
    where: { id: userId },
    data: { passwordHash }
  });

  return { success: true };
}

module.exports = {
  signup,
  login,
  getMe,
  updateProfile,
  changePassword,
  generateToken
};
