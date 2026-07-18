import { Request, Response, NextFunction } from 'express';
import { createError } from './error-handler.js';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

const store: RateLimitStore = {};

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, maxRequests, message = 'Too many requests' } = options;
  
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${req.ip}-${req.path}`;
    const now = Date.now();
    
    if (!store[key] || store[key].resetAt < now) {
      store[key] = {
        count: 1,
        resetAt: now + windowMs,
      };
      next();
      return;
    }
    
    store[key].count++;
    
    if (store[key].count > maxRequests) {
      throw createError(429, message, 'RATE_LIMIT_EXCEEDED');
    }
    
    next();
  };
}

// Default rate limits
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  message: 'API rate limit exceeded',
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
  message: 'Too many authentication attempts',
});
