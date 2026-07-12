import type { ErrorRequestHandler } from 'express';
import { errorResponseStandard } from '../lib/response.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  return errorResponseStandard(err, res, 500);
};
