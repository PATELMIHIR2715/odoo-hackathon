import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, allowRoles } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { listRbac, updateRbac } from './settings.controller.js';

export const settingsRouter = Router();

settingsRouter.get('/rbac', authenticate, allowRoles(Role.ADMIN), asyncHandler(listRbac));
settingsRouter.patch('/rbac/:profileId', authenticate, allowRoles(Role.ADMIN), asyncHandler(updateRbac));
