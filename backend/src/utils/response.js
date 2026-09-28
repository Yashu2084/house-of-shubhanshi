// ==============================================================================
// HOUSE OF SHUBHANSHI — API RESPONSE UTILITIES
// ==============================================================================

/**
 * Standard Success Response
 * @param {import('express').Response} res
 * @param {any} data
 * @param {string} message
 * @param {number} statusCode
 */
function sendSuccess(res, data = null, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

/**
 * Standard Error Response
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} statusCode
 * @param {any} errors
 */
function sendError(res, message = 'An error occurred', statusCode = 500, errors = null) {
  const payload = {
    success: false,
    message
  };
  if (errors) {
    payload.errors = errors;
  }
  return res.status(statusCode).json(payload);
}

module.exports = {
  sendSuccess,
  sendError
};
