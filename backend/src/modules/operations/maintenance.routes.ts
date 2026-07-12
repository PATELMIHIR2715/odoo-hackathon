import { Router } from 'express';
import { MaintenanceStatus, Role, VehicleStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { allowRoles } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { parseUuid, sendJson } from './operations.shared.js';
import { z } from 'zod';

export const maintenanceRouter = Router();

maintenanceRouter.get('/', allowRoles(Role.ADMIN, Role.FLEET_MANAGER), asyncHandler(async (req, res) => {
  sendJson(res, await prisma.maintenanceLog.findMany({
    where: {
      ...(req.query.vehicleId ? { vehicleId: String(req.query.vehicleId) } : {}),
      ...(req.query.status ? { status: z.nativeEnum(MaintenanceStatus).parse(req.query.status) } : {}),
    },
    include: { vehicle: true },
  }));
}));

maintenanceRouter.post('/', allowRoles(Role.ADMIN, Role.FLEET_MANAGER), asyncHandler(async (req, res) => {
  const data = z.object({
    vehicleId: z.string().uuid(),
    description: z.string().min(2),
    cost: z.coerce.number().min(0).optional(),
  }).parse(req.body);

  const item = await prisma.$transaction(async tx => {
    const vehicle = await tx.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (!vehicle) throw new ApiError(404, 'VEHICLE_NOT_FOUND', 'Vehicle not found');
    if (vehicle.status === VehicleStatus.ON_TRIP || vehicle.status === VehicleStatus.RETIRED) {
      throw new ApiError(409, 'VEHICLE_UNAVAILABLE', 'Vehicle cannot be put into maintenance');
    }

    await tx.vehicle.update({ where: { id: data.vehicleId }, data: { status: VehicleStatus.IN_SHOP } });
    return tx.maintenanceLog.create({ data });
  });

  sendJson(res, item, 201);
}));

maintenanceRouter.patch('/:id/close', allowRoles(Role.ADMIN, Role.FLEET_MANAGER), asyncHandler(async (req, res) => {
  const logId = parseUuid(req.params.id);
  const item = await prisma.$transaction(async tx => {
    const log = await tx.maintenanceLog.findUnique({ where: { id: logId } });
    if (!log) throw new ApiError(404, 'MAINTENANCE_NOT_FOUND', 'Maintenance record not found');
    if (log.status !== MaintenanceStatus.OPEN) throw new ApiError(409, 'INVALID_MAINTENANCE_STATE', 'Maintenance record is already closed');

    const vehicle = await tx.vehicle.findUniqueOrThrow({ where: { id: log.vehicleId } });
    if (vehicle.status !== VehicleStatus.RETIRED) {
      await tx.vehicle.update({ where: { id: log.vehicleId }, data: { status: VehicleStatus.AVAILABLE } });
    }

    return tx.maintenanceLog.update({ where: { id: logId }, data: { status: MaintenanceStatus.CLOSED, closedAt: new Date() } });
  });

  sendJson(res, item);
}));
