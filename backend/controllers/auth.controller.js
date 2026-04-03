const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const UserModel = require('../models/user.model');
const { query } = require('../config/db');
const { generateToken } = require('../middleware/auth');
const { asyncHandler, ok, fail } = require('../utils/helpers');

const SALT_ROUNDS = 12;

exports.register = asyncHandler(async (req, res) => {
  const { first_name, last_name, email, password, phone, preferred_language } = req.body;

  if (!first_name || !last_name || !email || !password) {
    return fail(res, 'first_name, last_name, email, and password are required');
  }

  const existing = await UserModel.findByEmail(email);
  if (existing) {
    return fail(res, 'Email already registered', 409);
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  const userId = await UserModel.create({ first_name, last_name, email, password_hash, phone, preferred_language });

  const user = await UserModel.findById(userId);
  const token = generateToken(user);

  // Create auth session
  await query(
    'INSERT INTO auth_session (user_id, session_token, provider, created_by) VALUES (?, ?, ?, ?)',
    [userId, token, 'local', userId]
  );

  return ok(res, { user, token }, 201);
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return fail(res, 'Email and password are required');
  }

  const user = await UserModel.findByEmail(email);
  if (!user) {
    return fail(res, 'Invalid email or password', 401);
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return fail(res, 'Invalid email or password', 401);
  }

  const token = generateToken(user);

  // Create auth session
  await query(
    'INSERT INTO auth_session (user_id, session_token, provider, created_by) VALUES (?, ?, ?, ?)',
    [user.id, token, 'local', user.id]
  );

  const { password_hash, ...safeUser } = user;
  return ok(res, { user: safeUser, token });
});

exports.logout = asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    await query(
      'UPDATE auth_session SET is_active = FALSE WHERE session_token = ?',
      [token]
    );
  }
  return ok(res, { message: 'Logged out successfully' });
});

exports.me = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.user.id);
  if (!user) {
    return fail(res, 'User not found', 404);
  }
  return ok(res, { user });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { first_name, last_name, phone, preferred_language } = req.body;
  if (!first_name || !last_name) {
    return fail(res, 'first_name and last_name are required');
  }
  const user = await UserModel.update(req.user.id, { first_name, last_name, phone, preferred_language });
  return ok(res, { user });
});

exports.updateTheme = asyncHandler(async (req, res) => {
  const { theme } = req.body;
  if (![0, 1].includes(theme)) {
    return fail(res, 'theme must be 0 (light) or 1 (dark)');
  }
  const user = await UserModel.updateTheme(req.user.id, theme);
  return ok(res, { user });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) {
    return fail(res, 'current_password and new_password are required');
  }
  if (new_password.length < 8) {
    return fail(res, 'New password must be at least 8 characters');
  }
  const user = await UserModel.findByIdWithPassword(req.user.id);
  const valid = await bcrypt.compare(current_password, user.password_hash);
  if (!valid) {
    return fail(res, 'Current password is incorrect', 401);
  }
  const password_hash = await bcrypt.hash(new_password, SALT_ROUNDS);
  await UserModel.updatePassword(req.user.id, password_hash);
  return ok(res, { message: 'Password changed successfully' });
});
