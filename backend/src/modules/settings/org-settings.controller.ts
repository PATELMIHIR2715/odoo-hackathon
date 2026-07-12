import type { RequestHandler } from 'express';
import { successResponse } from '../../lib/response.js';
import { orgSettingsService } from './org-settings.service.js';

export const getOrgSettings: RequestHandler = async (_req, res) => {
  return successResponse(res, await orgSettingsService.getOrgSettings());
};

export const updateOrgSettings: RequestHandler = async (req, res) => {
  return successResponse(res, await orgSettingsService.updateOrgSettings(req.body));
};
