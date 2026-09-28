// ==============================================================================
// HOUSE OF SHUBHANSHI — GLOBAL ERROR HANDLER
// ==============================================================================
const { sendError } = require('../utils/response');

function errorHandler(err, req, res, next) {
  console.error('[Error Occurred]', err.stack || err.message);

  if (err.name === 'ValidationError') {
    return sendError(res, err.message, 400);
  }

  if (err.code === 'P2002') {
    return sendError(res, 'A unique constraint was violated on the database.', 409);
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = statusCode === 500 && process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred. Please try again later.'
    : err.message || 'Internal Server Error';

  return sendError(res, message, statusCode);
}

module.exports = errorHandler;
