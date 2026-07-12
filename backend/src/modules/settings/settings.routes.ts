import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, allowRoles } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { listRbac, updateRbac } from './settings.controller.js';
import { getOrgSettings, updateOrgSettings } from './org-settings.controller.js';

export const settingsRouter = Router();

settingsRouter.get('/org', authenticate, allowRoles(Role.ADMIN), asyncHandler(getOrgSettings));
settingsRouter.patch('/org', authenticate, allowRoles(Role.ADMIN), asyncHandler(updateOrgSettings));
settingsRouter.get('/rbac', authenticate, allowRoles(Role.ADMIN), asyncHandler(listRbac));
settingsRouter.patch('/rbac/:profileId', authenticate, allowRoles(Role.ADMIN), asyncHandler(updateRbac));
