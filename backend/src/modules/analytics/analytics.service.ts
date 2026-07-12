import {
  ExpenseType,
  TripStatus,
  VehicleStatus,
} from "@prisma/client";
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

  async overview(query: { vehicleId?: string }) {
    const [fuelEfficiency, fleetUtilization, operationalCost, topVehicles, trend] =
      await Promise.all([
        this.fuelEfficiency(query),
        this.fleetUtilization(),
        this.operationalCost(query),
        this.topCostlyVehicles(query),
        this.monthlyTrend(query),
      ]);

    const totalFuelLiters = await prisma.fuelLog.aggregate({
      where: query.vehicleId ? { vehicleId: query.vehicleId } : {},
      _sum: { liters: true },
    });

    return {
      fuelEfficiency,
      fleetUtilization,
      operationalCost,
      vehicleROI: null,
      totalFuelLiters: totalFuelLiters._sum.liters ?? 0,
      monthlyTrend: trend,
      topCostlyVehicles: topVehicles,
    };
  },

  async topCostlyVehicles(query: { vehicleId?: string }) {
    const [fuelLogs, maintenanceLogs, expenses] = await Promise.all([
      prisma.fuelLog.findMany({
        where: query.vehicleId ? { vehicleId: query.vehicleId } : {},
        include: { vehicle: true },
      }),
      prisma.maintenanceLog.findMany({
        where: query.vehicleId ? { vehicleId: query.vehicleId } : {},
        include: { vehicle: true },
      }),
      prisma.expense.findMany({
        where: query.vehicleId ? { vehicleId: query.vehicleId } : {},
        include: { vehicle: true },
      }),
    ]);

    const totals = new Map<
      string,
      {
        vehicleId: string;
        registrationNumber: string;
        name: string;
        totalCost: number;
      }
    >();

    const add = (
      vehicleId: string,
      registrationNumber: string,
      name: string,
      cost: number,
    ) => {
      const entry = totals.get(vehicleId) ?? {
        vehicleId,
        registrationNumber,
        name,
        totalCost: 0,
      };
      entry.totalCost += cost;
      totals.set(vehicleId, entry);
    };

    for (const log of fuelLogs) {
      add(
        log.vehicleId,
        log.vehicle.registrationNumber,
        log.vehicle.name,
        log.cost,
      );
    }

    for (const log of maintenanceLogs) {
      add(
        log.vehicleId,
        log.vehicle.registrationNumber,
        log.vehicle.name,
        log.cost,
      );
    }

    for (const expense of expenses) {
      add(
        expense.vehicleId,
        expense.vehicle.registrationNumber,
        expense.vehicle.name,
        expense.amount,
      );
    }

    return [...totals.values()]
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 5);
  },

  async monthlyTrend(query: { vehicleId?: string }) {
    const vehicleFilter = query.vehicleId ? { vehicleId: query.vehicleId } : {};
    const [fuelLogs, maintenanceLogs, expenses] = await Promise.all([
      prisma.fuelLog.findMany({ where: vehicleFilter }),
      prisma.maintenanceLog.findMany({ where: vehicleFilter }),
      prisma.expense.findMany({ where: vehicleFilter }),
    ]);

    const buckets = new Map<
      string,
      { month: string; fuelCost: number; maintenanceCost: number; expenseCost: number }
    >();

    const ensureBucket = (date: Date) => {
      const month = date.toISOString().slice(0, 7);
      const existing = buckets.get(month);
      if (existing) return existing;
      const next = { month, fuelCost: 0, maintenanceCost: 0, expenseCost: 0 };
      buckets.set(month, next);
      return next;
    };

    for (const log of fuelLogs) {
      ensureBucket(log.date).fuelCost += log.cost;
    }

    for (const log of maintenanceLogs) {
      ensureBucket(log.openedAt).maintenanceCost += log.cost;
    }

    for (const expense of expenses) {
      ensureBucket(expense.date).expenseCost += expense.amount;
    }

    return [...buckets.values()]
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((item) => ({
        ...item,
        totalCost: item.fuelCost + item.maintenanceCost + item.expenseCost,
      }));
  },
};
