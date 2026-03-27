/**
 * Wrap a controller handler with async error catching.
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Build a success response.
 */
function ok(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

/**
 * Build an error response.
 */
function fail(res, message, statusCode = 400) {
  return res.status(statusCode).json({ success: false, error: message });
}

module.exports = { asyncHandler, ok, fail };
