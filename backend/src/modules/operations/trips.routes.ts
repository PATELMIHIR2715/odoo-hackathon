import { Router } from 'express';
import { DriverStatus, Role, TripStatus, VehicleStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { allowRoles } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { allRoles, assertVehicleAndDriverForTrip, parseUuid, sendJson, tripInputSchema, tripStatusSchema } from './operations.shared.js';
import { z } from 'zod';

export const tripsRouter = Router();

tripsRouter.get('/', allowRoles(...allRoles), asyncHandler(async (req, res) => {
  const where = {
    ...(req.query.status ? { status: tripStatusSchema.parse(req.query.status) } : {}),
    ...(req.query.driverId ? { driverId: String(req.query.driverId) } : {}),
    ...(req.query.vehicleId ? { vehicleId: String(req.query.vehicleId) } : {}),
  };

  sendJson(res, await prisma.trip.findMany({ where, include: { vehicle: true, driver: true }, orderBy: { createdAt: 'desc' } }));
}));

tripsRouter.get('/:id', allowRoles(...allRoles), asyncHandler(async (req, res) => {
  const item = await prisma.trip.findUnique({ where: { id: parseUuid(req.params.id) }, include: { vehicle: true, driver: true } });
  if (!item) throw new ApiError(404, 'TRIP_NOT_FOUND', 'Trip not found');
  sendJson(res, item);
}));

tripsRouter.post('/', allowRoles(Role.ADMIN, Role.DRIVER), asyncHandler(async (req, res) => {
  const data = tripInputSchema.parse(req.body);
  await prisma.$transaction((tx) => assertVehicleAndDriverForTrip(tx, data.vehicleId, data.driverId, data.cargoWeightKg));
  sendJson(res, await prisma.trip.create({ data: { ...data, createdByProfileId: req.user!.id } }), 201);
}));

tripsRouter.patch('/:id/dispatch', allowRoles(Role.ADMIN, Role.DRIVER), asyncHandler(async (req, res) => {
  const tripId = parseUuid(req.params.id);
  const item = await prisma.$transaction(async tx => {
    const trip = await tx.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new ApiError(404, 'TRIP_NOT_FOUND', 'Trip not found');
    if (trip.status !== TripStatus.DRAFT) throw new ApiError(409, 'INVALID_TRIP_STATE', 'Only draft trips can be dispatched');
    await assertVehicleAndDriverForTrip(tx, trip.vehicleId, trip.driverId, trip.cargoWeightKg);
    await Promise.all([
      tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: VehicleStatus.ON_TRIP } }),
      tx.driver.update({ where: { id: trip.driverId }, data: { status: DriverStatus.ON_TRIP } }),
    ]);
    return tx.trip.update({ where: { id: tripId }, data: { status: TripStatus.DISPATCHED, dispatchedAt: new Date() } });
  });

  sendJson(res, item);
}));

tripsRouter.patch('/:id/complete', allowRoles(Role.ADMIN, Role.DRIVER), asyncHandler(async (req, res) => {
  const input = z.object({
    actualDistance: z.coerce.number().nonnegative(),
    fuelConsumedL: z.coerce.number().nonnegative().optional(),
    fuelCost: z.coerce.number().nonnegative().optional(),
  }).parse(req.body);

  const tripId = parseUuid(req.params.id);
  const item = await prisma.$transaction(async tx => {
    const trip = await tx.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new ApiError(404, 'TRIP_NOT_FOUND', 'Trip not found');
    if (trip.status !== TripStatus.DISPATCHED) throw new ApiError(409, 'INVALID_TRIP_STATE', 'Only dispatched trips can be completed');

    await Promise.all([
      tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: VehicleStatus.AVAILABLE, odometerKm: { increment: input.actualDistance } } }),
      tx.driver.update({ where: { id: trip.driverId }, data: { status: DriverStatus.AVAILABLE } }),
    ]);

    if (input.fuelConsumedL !== undefined) {
      await tx.fuelLog.create({ data: { vehicleId: trip.vehicleId, liters: input.fuelConsumedL, cost: input.fuelCost ?? 0 } });
    }

    return tx.trip.update({
      where: { id: tripId },
      data: { status: TripStatus.COMPLETED, completedAt: new Date(), actualDistance: input.actualDistance, fuelConsumedL: input.fuelConsumedL },
    });
  });

  sendJson(res, item);
}));

tripsRouter.patch('/:id/cancel', allowRoles(Role.ADMIN, Role.DRIVER), asyncHandler(async (req, res) => {
  const tripId = parseUuid(req.params.id);
  const item = await prisma.$transaction(async tx => {
    const trip = await tx.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new ApiError(404, 'TRIP_NOT_FOUND', 'Trip not found');
    if (trip.status !== TripStatus.DRAFT && trip.status !== TripStatus.DISPATCHED) {
      throw new ApiError(409, 'INVALID_TRIP_STATE', 'Only draft or dispatched trips can be cancelled');
    }

    if (trip.status === TripStatus.DISPATCHED) {
      await Promise.all([
        tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: VehicleStatus.AVAILABLE } }),
        tx.driver.update({ where: { id: trip.driverId }, data: { status: DriverStatus.AVAILABLE } }),
      ]);
    }

    return tx.trip.update({ where: { id: tripId }, data: { status: TripStatus.CANCELLED, cancelledAt: new Date() } });
  });

  sendJson(res, item);
}));
