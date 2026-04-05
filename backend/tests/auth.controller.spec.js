/**
 * Auth Controller Tests
 * Scenarios from: frontend-scenarios-api-guide.md Section 4.2
 */
const bcrypt = require('bcrypt');

// ── mocks ──────────────────────────────────────────
jest.mock('../models/user.model');
jest.mock('../config/db');
jest.mock('../middleware/auth', () => ({
  requireAuth: (req, res, next) => next(),
  optionalAuth: (req, res, next) => next(),
  generateToken: jest.fn(() => 'mock-jwt-token'),
}));
jest.mock('../utils/helpers', () => {
  const original = jest.requireActual('../utils/helpers');
  return {
    ...original,
    asyncHandler: (fn) => fn,
  };
});

const UserModel = require('../models/user.model');
const { query } = require('../config/db');
const { generateToken } = require('../middleware/auth');
const authCtrl = require('../controllers/auth.controller');

// ── helpers ────────────────────────────────────────
function mockReq(body = {}, headers = {}, user = null) {
  return { body, headers, user, params: {} };
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// ── Registration Scenarios ─────────────────────────
describe('Auth Controller - register', () => {
  beforeEach(() => jest.clearAllMocks());

  test('SCENARIO: Successful registration returns 201 with user and token', async () => {
    const body = {
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah.johnson@example.com',
      password: 'MySecurePass123',
      phone: '+1-555-123-4567',
      preferred_language: 'en',
    };

    UserModel.findByEmail.mockResolvedValue(null);
    UserModel.create.mockResolvedValue(456);
    UserModel.findById.mockResolvedValue({
      id: 456,
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah.johnson@example.com',
      phone: '+1-555-123-4567',
      preferred_language: 'en',
      role: 'user',
      theme: 0,
      is_verified: false,
    });
    query.mockResolvedValue({});

    const req = mockReq(body);
    const res = mockRes();
    await authCtrl.register(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          user: expect.objectContaining({ id: 456, email: 'sarah.johnson@example.com' }),
          token: 'mock-jwt-token',
        }),
      })
    );
    expect(UserModel.create).toHaveBeenCalled();
    expect(generateToken).toHaveBeenCalled();
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO auth_session'),
      expect.any(Array)
    );
  });

  test('SCENARIO: Missing required fields returns 400', async () => {
    const bodies = [
      { first_name: 'John', email: 'j@e.com' },
      { first_name: 'John', last_name: 'S', password: '1234' },
      { email: 'j@e.com', password: '1234' },
      {},
    ];

    for (const body of bodies) {
      const req = mockReq(body);
      const res = mockRes();
      await authCtrl.register(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'first_name, last_name, email, and password are required',
        })
      );
    }
  });

  test('SCENARIO: Email already registered returns 409', async () => {
    UserModel.findByEmail.mockResolvedValue({ id: 1, email: 'existing@example.com' });

    const req = mockReq({
      first_name: 'John',
      last_name: 'Smith',
      email: 'existing@example.com',
      password: 'password123',
    });
    const res = mockRes();
    await authCtrl.register(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: 'Email already registered' })
    );
  });

  test('SCENARIO: Password is hashed with bcrypt before storage', async () => {
    UserModel.findByEmail.mockResolvedValue(null);
    UserModel.create.mockImplementation(async (data) => {
      // Verify the password_hash was created by bcrypt
      expect(data.password_hash).toBeDefined();
      expect(data.password_hash).not.toBe('MySecurePass123');
      const matches = await bcrypt.compare('MySecurePass123', data.password_hash);
      expect(matches).toBe(true);
      return 1;
    });
    UserModel.findById.mockResolvedValue({ id: 1, email: 'a@b.com', role: 'user' });
    query.mockResolvedValue({});

    const req = mockReq({
      first_name: 'A',
      last_name: 'B',
      email: 'a@b.com',
      password: 'MySecurePass123',
    });
    const res = mockRes();
    await authCtrl.register(req, res, jest.fn());

    expect(UserModel.create).toHaveBeenCalled();
  });
});

// ── Login Scenarios ────────────────────────────────
describe('Auth Controller - login', () => {
  beforeEach(() => jest.clearAllMocks());

  test('SCENARIO: Successful login returns 200 with user (no password_hash) and token', async () => {
    const hash = await bcrypt.hash('MySecurePass123', 10);
    UserModel.findByEmail.mockResolvedValue({
      id: 456,
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah.johnson@example.com',
      password_hash: hash,
      role: 'user',
      theme: 1,
    });
    query.mockResolvedValue({});

    const req = mockReq({ email: 'sarah.johnson@example.com', password: 'MySecurePass123' });
    const res = mockRes();
    await authCtrl.login(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.success).toBe(true);
    expect(jsonCall.data.token).toBe('mock-jwt-token');
    expect(jsonCall.data.user.password_hash).toBeUndefined();
    expect(jsonCall.data.user.email).toBe('sarah.johnson@example.com');
  });

  test('SCENARIO: Missing email or password returns 400', async () => {
    const cases = [
      { email: 'a@b.com' },
      { password: '123' },
      {},
    ];

    for (const body of cases) {
      const res = mockRes();
      await authCtrl.login(mockReq(body), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: 'Email and password are required' })
      );
    }
  });

  test('SCENARIO: Invalid email returns 401', async () => {
    UserModel.findByEmail.mockResolvedValue(null);

    const res = mockRes();
    await authCtrl.login(mockReq({ email: 'nobody@e.com', password: '1234' }), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: 'Invalid email or password' })
    );
  });

  test('SCENARIO: Wrong password returns 401', async () => {
    const hash = await bcrypt.hash('correct', 10);
    UserModel.findByEmail.mockResolvedValue({ id: 1, password_hash: hash });

    const res = mockRes();
    await authCtrl.login(mockReq({ email: 'a@b.com', password: 'wrong' }), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: 'Invalid email or password' })
    );
  });

  test('SCENARIO: Auth session is created on successful login', async () => {
    const hash = await bcrypt.hash('pass', 10);
    UserModel.findByEmail.mockResolvedValue({ id: 10, password_hash: hash, role: 'user', email: 'x@y.com' });
    query.mockResolvedValue({});

    const res = mockRes();
    await authCtrl.login(mockReq({ email: 'x@y.com', password: 'pass' }), res, jest.fn());

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO auth_session'),
      expect.arrayContaining([10, 'mock-jwt-token', 'local', 10])
    );
  });
});

// ── Logout Scenarios ───────────────────────────────
describe('Auth Controller - logout', () => {
  beforeEach(() => jest.clearAllMocks());

  test('SCENARIO: Successful logout deactivates session and returns 200', async () => {
    query.mockResolvedValue({});

    const req = mockReq({}, { authorization: 'Bearer some-token' }, { id: 1 });
    const res = mockRes();
    await authCtrl.logout(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: { message: 'Logged out successfully' },
      })
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE auth_session SET is_active = FALSE'),
      ['some-token']
    );
  });

  test('SCENARIO: Logout without token still returns 200', async () => {
    const req = mockReq({}, {}, { id: 1 });
    const res = mockRes();
    await authCtrl.logout(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(query).not.toHaveBeenCalled();
  });
});

// ── Get Current User (me) Scenarios ────────────────
describe('Auth Controller - me', () => {
  beforeEach(() => jest.clearAllMocks());

  test('SCENARIO: Returns current user profile', async () => {
    UserModel.findById.mockResolvedValue({
      id: 456,
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah.johnson@example.com',
      role: 'user',
      theme: 1,
    });

    const req = mockReq({}, {}, { id: 456 });
    const res = mockRes();
    await authCtrl.me(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          user: expect.objectContaining({ id: 456 }),
        }),
      })
    );
  });

  test('SCENARIO: User not found returns 404', async () => {
    UserModel.findById.mockResolvedValue(null);

    const req = mockReq({}, {}, { id: 999 });
    const res = mockRes();
    await authCtrl.me(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: 'User not found' })
    );
  });
});

// ── Update Profile Scenarios ───────────────────────
describe('Auth Controller - updateProfile', () => {
  beforeEach(() => jest.clearAllMocks());

  test('SCENARIO: Successful profile update returns updated user', async () => {
    UserModel.update.mockResolvedValue({
      id: 456,
      first_name: 'Sarah',
      last_name: 'Johnson-Smith',
      phone: '+1-555-987-6543',
      preferred_language: 'es',
    });

    const req = mockReq(
      { first_name: 'Sarah', last_name: 'Johnson-Smith', phone: '+1-555-987-6543', preferred_language: 'es' },
      {},
      { id: 456 }
    );
    const res = mockRes();
    await authCtrl.updateProfile(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          user: expect.objectContaining({ last_name: 'Johnson-Smith' }),
        }),
      })
    );
  });

  test('SCENARIO: Missing first_name or last_name returns 400', async () => {
    const cases = [
      { last_name: 'S' },
      { first_name: 'J' },
      {},
    ];

    for (const body of cases) {
      const res = mockRes();
      await authCtrl.updateProfile(mockReq(body, {}, { id: 1 }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'first_name and last_name are required',
        })
      );
    }
  });
});

// ── Update Theme Scenarios ─────────────────────────
describe('Auth Controller - updateTheme', () => {
  beforeEach(() => jest.clearAllMocks());

  test('SCENARIO: Set theme to dark (1) returns updated user', async () => {
    UserModel.updateTheme.mockResolvedValue({ id: 456, theme: 1 });

    const req = mockReq({ theme: 1 }, {}, { id: 456 });
    const res = mockRes();
    await authCtrl.updateTheme(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(UserModel.updateTheme).toHaveBeenCalledWith(456, 1);
  });

  test('SCENARIO: Set theme to light (0) returns updated user', async () => {
    UserModel.updateTheme.mockResolvedValue({ id: 456, theme: 0 });

    const req = mockReq({ theme: 0 }, {}, { id: 456 });
    const res = mockRes();
    await authCtrl.updateTheme(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(UserModel.updateTheme).toHaveBeenCalledWith(456, 0);
  });

  test('SCENARIO: Invalid theme value returns 400', async () => {
    const invalidThemes = [2, -1, 'dark', null, undefined, true];

    for (const theme of invalidThemes) {
      const res = mockRes();
      await authCtrl.updateTheme(mockReq({ theme }, {}, { id: 1 }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'theme must be 0 (light) or 1 (dark)',
        })
      );
    }
  });
});

// ── Change Password Scenarios ──────────────────────
describe('Auth Controller - changePassword', () => {
  beforeEach(() => jest.clearAllMocks());

  test('SCENARIO: Successful password change returns 200', async () => {
    const hash = await bcrypt.hash('MySecurePass123', 10);
    UserModel.findByIdWithPassword.mockResolvedValue({ id: 456, password_hash: hash });
    UserModel.updatePassword.mockResolvedValue(true);

    const req = mockReq(
      { current_password: 'MySecurePass123', new_password: 'MyNewSecurePass456' },
      {},
      { id: 456 }
    );
    const res = mockRes();
    await authCtrl.changePassword(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: { message: 'Password changed successfully' },
      })
    );
    expect(UserModel.updatePassword).toHaveBeenCalled();
  });

  test('SCENARIO: Missing current or new password returns 400', async () => {
    const cases = [
      { current_password: 'old' },
      { new_password: 'new12345' },
      {},
    ];

    for (const body of cases) {
      const res = mockRes();
      await authCtrl.changePassword(mockReq(body, {}, { id: 1 }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'current_password and new_password are required',
        })
      );
    }
  });

  test('SCENARIO: New password too short (< 8 chars) returns 400', async () => {
    const res = mockRes();
    await authCtrl.changePassword(
      mockReq({ current_password: 'old', new_password: 'short' }, {}, { id: 1 }),
      res,
      jest.fn()
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'New password must be at least 8 characters',
      })
    );
  });

  test('SCENARIO: Wrong current password returns 401', async () => {
    const hash = await bcrypt.hash('correct', 10);
    UserModel.findByIdWithPassword.mockResolvedValue({ id: 1, password_hash: hash });

    const res = mockRes();
    await authCtrl.changePassword(
      mockReq({ current_password: 'wrong', new_password: 'newpassword1' }, {}, { id: 1 }),
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: 'Current password is incorrect' })
    );
  });
});
