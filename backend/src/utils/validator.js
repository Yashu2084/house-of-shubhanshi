// ==============================================================================
// HOUSE OF SHUBHANSHI — INPUT VALIDATION UTILITY
// ==============================================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9\s\-()]{7,20}$/;
const PASSWORD_LETTER_REGEX = /[a-zA-Z]/;
const PASSWORD_NUMBER_REGEX = /[0-9]/;

/**
 * Validate Signup Data
 * @param {object} data
 * @returns {{ isValid: boolean, errors: object }}
 */
function validateSignup(data = {}) {
  const errors = {};
  const { name, email, phone, password, confirmPassword } = data;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.name = 'Full name is required (minimum 2 characters)';
  }

  if (!email || !EMAIL_REGEX.test(String(email).trim())) {
    errors.email = 'A valid email address is required';
  }

  if (phone && !PHONE_REGEX.test(String(phone).trim())) {
    errors.phone = 'Please provide a valid phone number (e.g. +91 9560011351)';
  }

  if (!password || typeof password !== 'string') {
    errors.password = 'Password is required';
  } else {
    if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!PASSWORD_LETTER_REGEX.test(password)) {
      errors.password = 'Password must contain at least one letter';
    } else if (!PASSWORD_NUMBER_REGEX.test(password)) {
      errors.password = 'Password must contain at least one number';
    }
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }


  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate Login Data
 * @param {object} data
 */
function validateLogin(data = {}) {
  const errors = {};
  const { email, password } = data;

  if (!email || !EMAIL_REGEX.test(String(email).trim())) {
    errors.email = 'A valid email address is required';
  }

  if (!password || typeof password !== 'string') {
    errors.password = 'Password is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

module.exports = {
  EMAIL_REGEX,
  PHONE_REGEX,
  validateSignup,
  validateLogin
};
