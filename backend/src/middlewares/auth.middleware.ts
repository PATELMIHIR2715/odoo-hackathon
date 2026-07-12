import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@prisma/client';
import { verifyAccessToken } from '../lib/jwt.js';
import { ApiError } from '../utils/ApiError.js';

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return next(new ApiError(401, 'UNAUTHORIZED', 'Access token is required'));
  try {
    const payload = verifyAccessToken(token);
    if (payload.type !== 'access') throw new Error('invalid token type');
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch { next(new ApiError(401, 'UNAUTHORIZED', 'Access token is invalid or expired')); }
}

export const allowRoles = (...roles: Role[]) => (req: Request, _res: Response, next: NextFunction) =>
  !req.user ? next(new ApiError(401, 'UNAUTHORIZED', 'Authentication is required')) : roles.includes(req.user.role) ? next() : next(new ApiError(403, 'FORBIDDEN', 'You do not have permission for this action'));
