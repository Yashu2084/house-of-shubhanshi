// ==============================================================================
// HOUSE OF SHUBHANSHI — GLOBAL ERROR HANDLER
// ==============================================================================
const { sendError } = require('../utils/response');

function errorHandler(err, req, res, next) {
  console.error('[Error Occurred]', err.stack || err.message);

  if (err.name === 'ValidationError') {
    return sendError(res, err.message, 400, err.errors);
  }

  // PostgreSQL unique violation error code 23505 or Prisma P2002
  if (err.code === '23505' || err.code === 'P2002') {
    return sendError(res, 'An account with this email address already exists.', 409);
  }

  const statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  if (message === 'Validation failed' && err.errors) {
    message = Object.values(err.errors)[0] || message;
  }

  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'An unexpected error occurred. Please try again later.';
  }

  return sendError(res, message, statusCode, err.errors);
}

module.exports = errorHandler;
