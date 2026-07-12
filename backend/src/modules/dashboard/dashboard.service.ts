import {
  DriverStatus,
  TripStatus,
  VehicleStatus,
  VehicleType,
} from "@prisma/client";
import { prisma } from "../../config/prisma.js";

async function fetchDashboardAggregates(filters?: {
  vehicleType?: VehicleType;
  status?: VehicleStatus;
  region?: string;
  recentTripsLimit?: number;
}) {
  const vehicleWhere = {
    ...(filters?.vehicleType ? { type: filters.vehicleType } : {}),
    ...(filters?.status ? { status: filters.status } : {}),
    ...(filters?.region ? { region: filters.region } : {}),
  };

  const tripVehicleWhere =
    Object.keys(vehicleWhere).length > 0
      ? { vehicle: { is: vehicleWhere } }
      : {};

  const [vehicleGroups, tripGroups, driverGroups, recentTrips] = await Promise.all([
    prisma.vehicle.groupBy({
      by: ["status"],
      where: vehicleWhere,
      _count: { _all: true },
    }),
    prisma.trip.groupBy({
      by: ["status"],
      where: tripVehicleWhere,
      _count: { _all: true },
    }),
    prisma.driver.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    filters?.recentTripsLimit
      ? prisma.trip.findMany({
          where: tripVehicleWhere,
          take: filters.recentTripsLimit,
          orderBy: { createdAt: "desc" },
          include: {
            vehicle: {
              select: {
                id: true,
                registrationNumber: true,
                name: true,
                type: true,
                status: true,
              },
            },
            driver: {
              select: {
                id: true,
                name: true,
                licenseNumber: true,
                status: true,
              },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const vehicleCountByStatus = Object.fromEntries(
    vehicleGroups.map((group) => [group.status, group._count._all]),
  ) as Record<VehicleStatus, number>;
  const tripCountByStatus = Object.fromEntries(
    tripGroups.map((group) => [group.status, group._count._all]),
  ) as Record<TripStatus, number>;
  const driverCountByStatus = Object.fromEntries(
    driverGroups.map((group) => [group.status, group._count._all]),
  ) as Record<DriverStatus, number>;
  const totalFleet = Object.values(vehicleCountByStatus).reduce((sum, count) => sum + count, 0);
  const activeVehicles = vehicleCountByStatus[VehicleStatus.ON_TRIP] ?? 0;

  return {
    recentTrips,
    vehicleCountByStatus,
    tripCountByStatus,
    driverCountByStatus,
    totalFleet,
    activeVehicles,
  };
}

export const dashboardService = {
  async getKpis(filters?: {
    vehicleType?: VehicleType;
    status?: VehicleStatus;
    region?: string;
  }) {
    const aggregates = await fetchDashboardAggregates(filters)
    const availableVehicles = aggregates.vehicleCountByStatus[VehicleStatus.AVAILABLE] ?? 0;
    const activeVehicles = aggregates.vehicleCountByStatus[VehicleStatus.ON_TRIP] ?? 0;
    const inShopVehicles = aggregates.vehicleCountByStatus[VehicleStatus.IN_SHOP] ?? 0;
    const activeTrips = aggregates.tripCountByStatus[TripStatus.DISPATCHED] ?? 0;
    const draftTrips = aggregates.tripCountByStatus[TripStatus.DRAFT] ?? 0;
    const driversOnDuty = aggregates.driverCountByStatus[DriverStatus.ON_TRIP] ?? 0;

    return {
      activeVehicles,
      availableVehicles,
      inMaintenanceVehicles: inShopVehicles,
      activeTrips,
      pendingTrips: draftTrips,
      driversOnDuty,
      fleetUtilizationPercent: aggregates.totalFleet
        ? Number(((activeVehicles / aggregates.totalFleet) * 100).toFixed(2))
        : 0,
    };
  },

  async getOverview(query: {
    recentTripsLimit: number;
    vehicleType?: VehicleType;
    status?: VehicleStatus;
    region?: string;
  }) {
    const aggregates = await fetchDashboardAggregates({
      ...query,
      recentTripsLimit: query.recentTripsLimit,
    });
    const kpis = {
      activeVehicles: aggregates.vehicleCountByStatus[VehicleStatus.ON_TRIP] ?? 0,
      availableVehicles: aggregates.vehicleCountByStatus[VehicleStatus.AVAILABLE] ?? 0,
      inMaintenanceVehicles: aggregates.vehicleCountByStatus[VehicleStatus.IN_SHOP] ?? 0,
      activeTrips: aggregates.tripCountByStatus[TripStatus.DISPATCHED] ?? 0,
      pendingTrips: aggregates.tripCountByStatus[TripStatus.DRAFT] ?? 0,
      driversOnDuty: aggregates.driverCountByStatus[DriverStatus.ON_TRIP] ?? 0,
      fleetUtilizationPercent: aggregates.totalFleet
        ? Number(
            (
              ((aggregates.vehicleCountByStatus[VehicleStatus.ON_TRIP] ?? 0) /
                aggregates.totalFleet) *
              100
            ).toFixed(2),
          )
        : 0,
    };

    const vehicleStatusBreakdown = Object.values(VehicleStatus).map((status) => ({
      status,
      count: aggregates.vehicleCountByStatus[status] ?? 0,
    }));
    const tripStatusBreakdown = Object.values(TripStatus).map((status) => ({
      status,
      count: aggregates.tripCountByStatus[status] ?? 0,
    }));
    const driverStatusBreakdown = Object.values(DriverStatus).map((status) => ({
      status,
      count: aggregates.driverCountByStatus[status] ?? 0,
    }));

    return {
      kpis,
      recentTrips: aggregates.recentTrips,
      vehicleStatusBreakdown,
      tripStatusBreakdown,
      driverStatusBreakdown,
      filters: {
        vehicleType: query.vehicleType ?? null,
        status: query.status ?? null,
        region: query.region ?? null,
      },
    };
  },
};
