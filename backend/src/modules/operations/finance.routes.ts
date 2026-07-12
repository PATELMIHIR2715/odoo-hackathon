import { Router } from 'express';
import { DriverStatus, ExpenseType, Role, TripStatus, VehicleStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { allowRoles } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { allRoles, sendJson } from './operations.shared.js';
import { z } from 'zod';

export const financeRouter = Router();

financeRouter.get('/fuel-logs', allowRoles(Role.ADMIN, Role.FINANCIAL_ANALYST, Role.FLEET_MANAGER, Role.DRIVER), asyncHandler(async (req, res) => {
  sendJson(res, await prisma.fuelLog.findMany({
    where: req.query.vehicleId ? { vehicleId: String(req.query.vehicleId) } : {},
    include: { vehicle: true },
  }));
}));

financeRouter.post('/fuel-logs', allowRoles(Role.ADMIN, Role.FLEET_MANAGER, Role.DRIVER), asyncHandler(async (req, res) => {
  sendJson(res, await prisma.fuelLog.create({
    data: z.object({
      vehicleId: z.string().uuid(),
      liters: z.coerce.number().positive(),
      cost: z.coerce.number().min(0),
      date: z.coerce.date().optional(),
    }).parse(req.body),
  }), 201);
}));

financeRouter.get('/expenses', allowRoles(Role.ADMIN, Role.FINANCIAL_ANALYST, Role.FLEET_MANAGER, Role.DRIVER), asyncHandler(async (req, res) => {
  sendJson(res, await prisma.expense.findMany({
    where: {
      ...(req.query.vehicleId ? { vehicleId: String(req.query.vehicleId) } : {}),
      ...(req.query.type ? { type: z.nativeEnum(ExpenseType).parse(req.query.type) } : {}),
    },
    include: { vehicle: true },
  }));
}));

financeRouter.post('/expenses', allowRoles(Role.ADMIN, Role.FLEET_MANAGER, Role.DRIVER), asyncHandler(async (req, res) => {
  sendJson(res, await prisma.expense.create({
    data: z.object({
      vehicleId: z.string().uuid(),
      type: z.nativeEnum(ExpenseType),
      amount: z.coerce.number().positive(),
      note: z.string().max(500).optional(),
      date: z.coerce.date().optional(),
    }).parse(req.body),
  }), 201);
}));

financeRouter.get('/dashboard/kpis', allowRoles(...allRoles), asyncHandler(async (_req, res) => {
  const [availableVehicles, activeVehicles, inShopVehicles, activeTrips, draftTrips, driversOnDuty, totalFleet] = await Promise.all([
    prisma.vehicle.count({ where: { status: VehicleStatus.AVAILABLE } }),
    prisma.vehicle.count({ where: { status: VehicleStatus.ON_TRIP } }),
    prisma.vehicle.count({ where: { status: VehicleStatus.IN_SHOP } }),
    prisma.trip.count({ where: { status: TripStatus.DISPATCHED } }),
    prisma.trip.count({ where: { status: TripStatus.DRAFT } }),
    prisma.driver.count({ where: { status: DriverStatus.ON_TRIP } }),
    prisma.vehicle.count({ where: { status: { not: VehicleStatus.RETIRED } } }),
  ]);

  sendJson(res, {
    activeVehicles,
    availableVehicles,
    inMaintenanceVehicles: inShopVehicles,
    activeTrips,
    pendingTrips: draftTrips,
    driversOnDuty,
    fleetUtilizationPercent: totalFleet ? Number(((activeVehicles / totalFleet) * 100).toFixed(2)) : 0,
  });
}));

financeRouter.get('/reports/fuel-efficiency', allowRoles(Role.ADMIN, Role.FINANCIAL_ANALYST, Role.FLEET_MANAGER), asyncHandler(async (req, res) => {
  const trips = await prisma.trip.findMany({
    where: { status: TripStatus.COMPLETED, ...(req.query.vehicleId ? { vehicleId: String(req.query.vehicleId) } : {}) },
    select: { vehicleId: true, actualDistance: true, fuelConsumedL: true },
  });

  const result = Object.values(trips.reduce<Record<string, { vehicleId: string; distanceKm: number; fuelLiters: number }>>((acc, trip) => {
    const entry = acc[trip.vehicleId] ??= { vehicleId: trip.vehicleId, distanceKm: 0, fuelLiters: 0 };
    entry.distanceKm += trip.actualDistance ?? 0;
    entry.fuelLiters += trip.fuelConsumedL ?? 0;
    return acc;
  }, {})).map(item => ({
    ...item,
    kmPerLiter: item.fuelLiters ? Number((item.distanceKm / item.fuelLiters).toFixed(2)) : null,
  }));

  sendJson(res, result);
}));

financeRouter.get('/reports/fleet-utilization', allowRoles(Role.ADMIN, Role.FINANCIAL_ANALYST, Role.FLEET_MANAGER), asyncHandler(async (_req, res) => {
  const [active, total] = await Promise.all([
    prisma.vehicle.count({ where: { status: VehicleStatus.ON_TRIP } }),
    prisma.vehicle.count({ where: { status: { not: VehicleStatus.RETIRED } } }),
  ]);

  sendJson(res, {
    activeVehicles: active,
    totalEligibleVehicles: total,
    utilizationPercent: total ? Number(((active / total) * 100).toFixed(2)) : 0,
  });
}));

financeRouter.get('/reports/operational-cost', allowRoles(Role.ADMIN, Role.FINANCIAL_ANALYST, Role.FLEET_MANAGER), asyncHandler(async (req, res) => {
  const vehicleId = req.query.vehicleId ? String(req.query.vehicleId) : undefined;
  const [fuel, maintenance, expenses] = await Promise.all([
    prisma.fuelLog.aggregate({ where: vehicleId ? { vehicleId } : {}, _sum: { cost: true } }),
    prisma.maintenanceLog.aggregate({ where: vehicleId ? { vehicleId } : {}, _sum: { cost: true } }),
    prisma.expense.aggregate({ where: vehicleId ? { vehicleId } : {}, _sum: { amount: true } }),
  ]);

  sendJson(res, {
    vehicleId: vehicleId ?? null,
    fuelCost: fuel._sum.cost ?? 0,
    maintenanceCost: maintenance._sum.cost ?? 0,
    expensesCost: expenses._sum.amount ?? 0,
    totalOperationalCost: (fuel._sum.cost ?? 0) + (maintenance._sum.cost ?? 0) + (expenses._sum.amount ?? 0),
  });
}));
