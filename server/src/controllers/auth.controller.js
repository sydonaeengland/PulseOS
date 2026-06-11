import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { findByEmail } from '../models/user.model.js';
import { success, error } from '../utils/response.js';

const signAccessToken = (payload) =>
  jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

const signRefreshToken = (payload) =>
  jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshExpiresIn });

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return error(res, 'Email and password are required', 400);
    }

    const user = await findByEmail(email);
    if (!user) {
      return error(res, 'Invalid email or password', 401);
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return error(res, 'Invalid email or password', 401);
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken({ id: user.id });

    return success(res, { accessToken, refreshToken, user: payload });
  } catch (err) {
    console.error('login error:', err);
    return error(res, 'Something went wrong', 500);
  }
};

export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return error(res, 'Refresh token required', 400);
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, env.jwtRefreshSecret);
    } catch {
      return error(res, 'Invalid or expired refresh token', 401);
    }

    // re-fetch by id to get fresh role/status in the new token
    const { findById } = await import('../models/user.model.js');
    const freshUser = await findById(decoded.id);

    if (!freshUser || !freshUser.is_active) {
      return error(res, 'User not found or inactive', 401);
    }

    const payload = {
      id: freshUser.id,
      email: freshUser.email,
      role: freshUser.role,
      first_name: freshUser.first_name,
      last_name: freshUser.last_name,
    };

    const accessToken = signAccessToken(payload);

    return success(res, { accessToken });
  } catch (err) {
    console.error('refresh error:', err);
    return error(res, 'Something went wrong', 500);
  }
};

export const logout = (_req, res) => {
  return success(res, { message: 'Logged out successfully' });
};
