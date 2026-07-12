import { Router } from 'express';
import { Role, VehicleStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { allowRoles } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { allRoles, parseUuid, sendJson, vehicleInputSchema, vehicleStatusSchema } from './operations.shared.js';

export const vehiclesRouter = Router();

vehiclesRouter.get('/', allowRoles(...allRoles), asyncHandler(async (req, res) => {
  const where = {
    ...(req.query.status ? { status: vehicleStatusSchema.parse(req.query.status) } : {}),
    ...(req.query.type ? { type: String(req.query.type) } : {}),
    ...(req.query.region ? { region: String(req.query.region) } : {}),
  };

  sendJson(res, await prisma.vehicle.findMany({ where, orderBy: { createdAt: 'desc' } }));
}));

vehiclesRouter.get('/available', allowRoles(...allRoles), asyncHandler(async (_req, res) => {
  sendJson(res, await prisma.vehicle.findMany({ where: { status: VehicleStatus.AVAILABLE } }));
}));

vehiclesRouter.get('/:id', allowRoles(...allRoles), asyncHandler(async (req, res) => {
  const item = await prisma.vehicle.findUnique({ where: { id: parseUuid(req.params.id) } });
  if (!item) throw new ApiError(404, 'VEHICLE_NOT_FOUND', 'Vehicle not found');
  sendJson(res, item);
}));

vehiclesRouter.post('/', allowRoles(Role.ADMIN, Role.FLEET_MANAGER), asyncHandler(async (req, res) => {
  sendJson(res, await prisma.vehicle.create({ data: vehicleInputSchema.parse(req.body) }), 201);
}));

vehiclesRouter.patch('/:id', allowRoles(Role.ADMIN, Role.FLEET_MANAGER), asyncHandler(async (req, res) => {
  sendJson(res, await prisma.vehicle.update({ where: { id: parseUuid(req.params.id) }, data: vehicleInputSchema.partial().parse(req.body) }));
}));

vehiclesRouter.delete('/:id', allowRoles(Role.ADMIN, Role.FLEET_MANAGER), asyncHandler(async (req, res) => {
  sendJson(res, await prisma.vehicle.update({ where: { id: parseUuid(req.params.id) }, data: { status: VehicleStatus.RETIRED } }));
}));

vehiclesRouter.get('/:id/total-cost', allowRoles(...allRoles), asyncHandler(async (req, res) => {
  const vehicleId = parseUuid(req.params.id);
  const [fuel, maintenance, expenses] = await Promise.all([
    prisma.fuelLog.aggregate({ where: { vehicleId }, _sum: { cost: true } }),
    prisma.maintenanceLog.aggregate({ where: { vehicleId }, _sum: { cost: true } }),
    prisma.expense.aggregate({ where: { vehicleId }, _sum: { amount: true } }),
  ]);

  sendJson(res, {
    vehicleId,
    fuelCost: fuel._sum.cost ?? 0,
    maintenanceCost: maintenance._sum.cost ?? 0,
    expenseCost: expenses._sum.amount ?? 0,
    totalCost: (fuel._sum.cost ?? 0) + (maintenance._sum.cost ?? 0) + (expenses._sum.amount ?? 0),
  });
}));
