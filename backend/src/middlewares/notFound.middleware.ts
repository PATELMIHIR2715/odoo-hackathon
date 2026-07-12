import type { RequestHandler } from 'express';
import { errorResponse } from '../lib/response.js';

export const notFound: RequestHandler = (req, res) => errorResponse(res, 404, 'NOT_FOUND', `Route ${req.method} ${req.path} was not found`);
