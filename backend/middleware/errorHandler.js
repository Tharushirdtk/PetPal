function notFoundHandler(_req, res) {
  res.status(404).json({ success: false, error: 'Route not found' });
}

function globalErrorHandler(err, _req, res, _next) {
  console.error('Unhandled error:', err.stack || err);

  // MySQL duplicate entry
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ success: false, error: 'This record already exists', code: 'DUPLICATE_ENTRY' });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, error: 'Invalid token', code: 'INVALID_TOKEN' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, error: 'Token expired', code: 'TOKEN_EXPIRED' });
  }

  // Multer file size
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, error: 'File too large. Max size: 10MB', code: 'FILE_TOO_LARGE' });
  }

  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  res.status(status).json({ success: false, error: message, code: 'SERVER_ERROR' });
}

module.exports = { notFoundHandler, globalErrorHandler };
