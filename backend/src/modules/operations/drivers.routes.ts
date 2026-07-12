import { Router } from 'express';
import { DriverStatus, Role } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { allowRoles } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { allRoles, driverInputSchema, parseUuid, sendJson } from './operations.shared.js';

export const driversRouter = Router();

driversRouter.get('/', allowRoles(...allRoles), asyncHandler(async (req, res) => {
  const status = req.query.status ? z.nativeEnum(DriverStatus).parse(req.query.status) : undefined;
  sendJson(res, await prisma.driver.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: 'desc' },
  }));
}));

driversRouter.get('/available', allowRoles(...allRoles), asyncHandler(async (_req, res) => {
  sendJson(res, await prisma.driver.findMany({
    where: { status: DriverStatus.AVAILABLE, licenseExpiryDate: { gt: new Date() } },
  }));
}));

driversRouter.get('/:id', allowRoles(...allRoles), asyncHandler(async (req, res) => {
  const item = await prisma.driver.findUnique({ where: { id: parseUuid(req.params.id) } });
  if (!item) throw new ApiError(404, 'DRIVER_NOT_FOUND', 'Driver not found');
  sendJson(res, item);
}));

driversRouter.post('/', allowRoles(Role.ADMIN, Role.SAFETY_OFFICER), asyncHandler(async (req, res) => {
  sendJson(res, await prisma.driver.create({ data: driverInputSchema.parse(req.body) }), 201);
}));

driversRouter.patch('/:id', allowRoles(Role.ADMIN, Role.SAFETY_OFFICER), asyncHandler(async (req, res) => {
  sendJson(res, await prisma.driver.update({ where: { id: parseUuid(req.params.id) }, data: driverInputSchema.partial().parse(req.body) }));
}));
