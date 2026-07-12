import type { ErrorRequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { errorResponse } from '../lib/response.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) return errorResponse(res, 400, 'VALIDATION_ERROR', 'Invalid request data', err.flatten());
  if (err instanceof ApiError) return errorResponse(res, err.status, err.code, err.message);
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') return errorResponse(res, 409, 'DUPLICATE_RECORD', 'A record with that value already exists');
  console.error(err);
  return errorResponse(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred');
};
