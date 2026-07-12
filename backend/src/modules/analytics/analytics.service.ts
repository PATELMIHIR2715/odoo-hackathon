import { TripStatus, VehicleStatus } from "@prisma/client";
import { prisma } from "../../config/prisma.js";

export const analyticsService = {
  async fuelEfficiency(query: { vehicleId?: string }) {
    const trips = await prisma.trip.findMany({
      where: {
        status: TripStatus.COMPLETED,
        ...(query.vehicleId ? { vehicleId: query.vehicleId } : {}),
      },
      select: { vehicleId: true, actualDistance: true, fuelConsumedL: true },
    });

    return Object.values(
      trips.reduce<
        Record<
          string,
          { vehicleId: string; distanceKm: number; fuelLiters: number }
        >
      >((acc, trip) => {
        const entry = (acc[trip.vehicleId] ??= {
          vehicleId: trip.vehicleId,
          distanceKm: 0,
          fuelLiters: 0,
        });
        entry.distanceKm += trip.actualDistance ?? 0;
        entry.fuelLiters += trip.fuelConsumedL ?? 0;
        return acc;
      }, {}),
    ).map((item) => ({
      ...item,
      kmPerLiter: item.fuelLiters
        ? Number((item.distanceKm / item.fuelLiters).toFixed(2))
        : null,
    }));
  },

  async fleetUtilization() {
    const [active, total] = await Promise.all([
      prisma.vehicle.count({ where: { status: VehicleStatus.ON_TRIP } }),
      prisma.vehicle.count({
        where: { status: { not: VehicleStatus.RETIRED } },
      }),
    ]);

    return {
      activeVehicles: active,
      totalEligibleVehicles: total,
      utilizationPercent: total
        ? Number(((active / total) * 100).toFixed(2))
        : 0,
    };
  },

  async operationalCost(query: { vehicleId?: string }) {
    const [fuel, maintenance, expenses] = await Promise.all([
      prisma.fuelLog.aggregate({
        where: query.vehicleId ? { vehicleId: query.vehicleId } : {},
        _sum: { cost: true },
      }),
      prisma.maintenanceLog.aggregate({
        where: query.vehicleId ? { vehicleId: query.vehicleId } : {},
        _sum: { cost: true },
      }),
      prisma.expense.aggregate({
        where: query.vehicleId ? { vehicleId: query.vehicleId } : {},
        _sum: { amount: true },
      }),
    ]);

    return {
      vehicleId: query.vehicleId ?? null,
      fuelCost: fuel._sum.cost ?? 0,
      maintenanceCost: maintenance._sum.cost ?? 0,
      expensesCost: expenses._sum.amount ?? 0,
      totalOperationalCost:
        (fuel._sum.cost ?? 0) +
        (maintenance._sum.cost ?? 0) +
        (expenses._sum.amount ?? 0),
    };
  },
};
