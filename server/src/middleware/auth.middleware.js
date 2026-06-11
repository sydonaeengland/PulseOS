import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { error } from '../utils/response.js';

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'No token provided', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = decoded;
    next();
  } catch {
    return error(res, 'Invalid or expired token', 401);
  }
};

export default requireAuth;
