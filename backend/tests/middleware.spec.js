/**
 * Middleware Tests
 * Tests for auth, errorHandler, validate, and helpers
 */

const jwt = require('jsonwebtoken');

// ── Auth Middleware ─────────────────────────────────
describe('Auth Middleware', () => {
  // Fresh require to avoid mock contamination
  let requireAuth, optionalAuth, generateToken;

  beforeAll(() => {
    const auth = require('../middleware/auth');
    requireAuth = auth.requireAuth;
    optionalAuth = auth.optionalAuth;
    generateToken = auth.generateToken;
  });

  function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  }

  describe('requireAuth', () => {
    test('SCENARIO: No Authorization header returns 401', () => {
      const req = { headers: {} };
      const res = mockRes();
      const next = jest.fn();

      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: 'Authentication required' })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('SCENARIO: Non-Bearer token returns 401', () => {
      const req = { headers: { authorization: 'Basic abc123' } };
      const res = mockRes();
      const next = jest.fn();

      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: 'Authentication required' })
      );
    });

    test('SCENARIO: Invalid token returns 401', () => {
      const req = { headers: { authorization: 'Bearer invalidtoken' } };
      const res = mockRes();
      const next = jest.fn();

      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: 'Invalid or expired token' })
      );
    });

    test('SCENARIO: Valid token sets req.user and calls next', () => {
      const { signToken } = require('../utils/jwtHelper');
      const token = signToken({ id: 456, email: 'test@test.com', role: 'user' });

      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = mockRes();
      const next = jest.fn();

      requireAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(456);
      expect(req.user.email).toBe('test@test.com');
      expect(req.user.role).toBe('user');
    });
  });

  describe('optionalAuth', () => {
    test('SCENARIO: No token sets req.user to null and calls next', () => {
      const req = { headers: {} };
      const res = mockRes();
      const next = jest.fn();

      optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeNull();
    });

    test('SCENARIO: Invalid token sets req.user to null and calls next', () => {
      const req = { headers: { authorization: 'Bearer badtoken' } };
      const res = mockRes();
      const next = jest.fn();

      optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeNull();
    });

    test('SCENARIO: Valid token sets req.user and calls next', () => {
      const { signToken } = require('../utils/jwtHelper');
      const token = signToken({ id: 1, email: 'a@b.com', role: 'admin' });

      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = mockRes();
      const next = jest.fn();

      optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user.id).toBe(1);
    });
  });

  describe('generateToken', () => {
    test('SCENARIO: Generates valid JWT with user data', () => {
      const token = generateToken({ id: 123, email: 'test@e.com', role: 'user' });
      expect(typeof token).toBe('string');

      const decoded = jwt.decode(token);
      expect(decoded.id).toBe(123);
      expect(decoded.email).toBe('test@e.com');
      expect(decoded.role).toBe('user');
    });
  });
});

// ── Error Handler Middleware ────────────────────────
describe('Error Handler Middleware', () => {
  const { notFoundHandler, globalErrorHandler } = require('../middleware/errorHandler');

  function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  }

  const mockReq = { method: 'GET', originalUrl: '/test', query: {}, params: {}, body: {} };

  test('SCENARIO: notFoundHandler returns 404', () => {
    const res = mockRes();
    notFoundHandler({}, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: 'Route not found' })
    );
  });

  test('SCENARIO: MySQL duplicate entry returns 409', () => {
    const res = mockRes();
    const err = new Error('Duplicate');
    err.code = 'ER_DUP_ENTRY';
    globalErrorHandler(err, mockReq, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'This record already exists', code: 'DUPLICATE_ENTRY' })
    );
  });

  test('SCENARIO: JsonWebTokenError returns 401', () => {
    const res = mockRes();
    const err = new Error('jwt malformed');
    err.name = 'JsonWebTokenError';
    globalErrorHandler(err, mockReq, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Invalid token', code: 'INVALID_TOKEN' })
    );
  });

  test('SCENARIO: TokenExpiredError returns 401', () => {
    const res = mockRes();
    const err = new Error('expired');
    err.name = 'TokenExpiredError';
    globalErrorHandler(err, mockReq, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Token expired', code: 'TOKEN_EXPIRED' })
    );
  });

  test('SCENARIO: File too large returns 400', () => {
    const res = mockRes();
    const err = new Error('File too large');
    err.code = 'LIMIT_FILE_SIZE';
    globalErrorHandler(err, mockReq, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'File too large. Max size: 10MB', code: 'FILE_TOO_LARGE' })
    );
  });

  test('SCENARIO: Generic error returns 500 with error message', () => {
    const res = mockRes();
    const err = new Error('Something broke');
    globalErrorHandler(err, mockReq, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, code: 'SERVER_ERROR' })
    );
  });

  test('SCENARIO: Error with custom status code is respected', () => {
    const res = mockRes();
    const err = new Error('Not allowed');
    err.status = 403;
    globalErrorHandler(err, mockReq, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

// ── Validate Middleware ─────────────────────────────
describe('Validate Middleware', () => {
  const { validate } = require('../middleware/validate');

  function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  }

  test('SCENARIO: Valid data passes through', () => {
    const middleware = validate({
      email: { required: true, type: 'email' },
      name: { required: true },
    });

    const req = { body: { email: 'test@test.com', name: 'John' } };
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('SCENARIO: Missing required field returns 422', () => {
    const middleware = validate({
      email: { required: true },
    });

    const req = { body: {} };
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, code: 'VALIDATION_ERROR' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('SCENARIO: Invalid email format returns 422', () => {
    const middleware = validate({
      email: { required: true, type: 'email' },
    });

    const req = { body: { email: 'not-an-email' } };
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(422);
  });

  test('SCENARIO: String too short returns 422', () => {
    const middleware = validate({
      password: { required: true, minLength: 8 },
    });

    const req = { body: { password: 'short' } };
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(422);
  });
});

// ── Helpers (asyncHandler, ok, fail) ───────────────
describe('Helpers', () => {
  const { asyncHandler, ok, fail } = require('../utils/helpers');

  function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  }

  test('SCENARIO: ok() returns success response with data', () => {
    const res = mockRes();
    ok(res, { id: 1 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1 } });
  });

  test('SCENARIO: ok() with custom status code', () => {
    const res = mockRes();
    ok(res, { id: 1 }, 201);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('SCENARIO: fail() returns error response', () => {
    const res = mockRes();
    fail(res, 'Something went wrong');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Something went wrong' });
  });

  test('SCENARIO: fail() with custom status code', () => {
    const res = mockRes();
    fail(res, 'Not found', 404);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('SCENARIO: asyncHandler catches and forwards errors to next', async () => {
    const error = new Error('Async error');
    const handler = asyncHandler(async () => { throw error; });
    const next = jest.fn();

    await handler({}, {}, next);
    expect(next).toHaveBeenCalledWith(error);
  });

  test('SCENARIO: asyncHandler passes through successful execution', async () => {
    const res = mockRes();
    const handler = asyncHandler(async (_req, res) => {
      ok(res, { done: true });
    });

    await handler({}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ── Date Helper ────────────────────────────────────
describe('Date Helper', () => {
  const { formatDate, formatDateTime, calculateAge, calculateAgeMonths } = require('../utils/dateHelper');

  test('SCENARIO: formatDate returns YYYY-MM-DD format', () => {
    const result = formatDate(new Date('2026-04-05T10:30:00Z'));
    expect(result).toBe('2026-04-05');
  });

  test('SCENARIO: formatDate returns null for invalid input', () => {
    expect(formatDate(null)).toBeNull();
    expect(formatDate(undefined)).toBeNull();
  });

  test('SCENARIO: formatDateTime returns ISO string', () => {
    const date = new Date('2026-04-05T10:30:00Z');
    const result = formatDateTime(date);
    expect(result).toBe(date.toISOString());
  });

  test('SCENARIO: calculateAge returns correct age in years', () => {
    const now = new Date();
    const age = calculateAge(now.getFullYear() - 4, now.getMonth() + 1, 1);
    expect(age).toBe(4);
  });

  test('SCENARIO: calculateAge returns null for missing year', () => {
    expect(calculateAge(null)).toBeNull();
  });

  test('SCENARIO: calculateAgeMonths returns age in months', () => {
    const now = new Date();
    const months = calculateAgeMonths(now.getFullYear() - 1, now.getMonth() + 1);
    expect(months).toBe(12);
  });
});

// ── JWT Helper ─────────────────────────────────────
describe('JWT Helper', () => {
  const { signToken, verifyToken, JWT_SECRET } = require('../utils/jwtHelper');

  test('SCENARIO: signToken creates a valid JWT', () => {
    const token = signToken({ id: 1, role: 'user' });
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  test('SCENARIO: verifyToken decodes valid token', () => {
    const token = signToken({ id: 42, email: 'a@b.com', role: 'admin' });
    const decoded = verifyToken(token);
    expect(decoded.id).toBe(42);
    expect(decoded.email).toBe('a@b.com');
    expect(decoded.role).toBe('admin');
  });

  test('SCENARIO: verifyToken throws for invalid token', () => {
    expect(() => verifyToken('garbage')).toThrow();
  });

  test('SCENARIO: Token has expiration', () => {
    const token = signToken({ id: 1 }, '1h');
    const decoded = jwt.decode(token);
    expect(decoded.exp).toBeDefined();
    expect(decoded.exp).toBeGreaterThan(decoded.iat);
  });
});
