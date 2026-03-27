const { verifyToken, signToken } = require('../utils/jwtHelper');

/**
 * Strict auth middleware — rejects if no valid token.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { id, email, role }
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

/**
 * Optional auth — attaches req.user if token present, but doesn't reject.
 */
function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const token = header.split(' ')[1];
    try {
      req.user = verifyToken(token);
    } catch {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}

/**
 * Generate a JWT token for a user.
 */
function generateToken(user) {
  return signToken({ id: user.id, email: user.email, role: user.role });
}

module.exports = { requireAuth, optionalAuth, generateToken };
