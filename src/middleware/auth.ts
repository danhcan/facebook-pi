import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { createError } from './error-handler.js';

export interface AuthPayload {
  userId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: '24h' });
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, config.jwt.secret) as AuthPayload;
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError(401, 'Authentication required', 'AUTH_REQUIRED');
  }
  
  const token = authHeader.substring(7);
  
  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    throw createError(401, 'Invalid or expired token', 'INVALID_TOKEN');
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }
  
  const token = authHeader.substring(7);
  
  try {
    const payload = verifyToken(token);
    req.user = payload;
  } catch {
    // Token invalid, continue without auth
  }
  
  next();
}
