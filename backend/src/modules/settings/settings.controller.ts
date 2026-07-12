import type { RequestHandler } from 'express';
import { settingsService } from './settings.service.js';
import { updateRbacSchema } from './settings.validation.js';
import { successResponse } from '../../lib/response.js';

export const listRbac: RequestHandler = async (_req, res) => {
  return successResponse(res, await settingsService.listRbac());
};

export const updateRbac: RequestHandler = async (req, res) => {
  const payload = updateRbacSchema.parse(req.body);
  return successResponse(res, await settingsService.updateRbac(String(req.params.profileId), payload));
};
