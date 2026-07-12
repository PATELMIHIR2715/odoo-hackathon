import {
  DriverStatus,
  TripStatus,
  VehicleStatus,
  VehicleType,
} from "@prisma/client";
import { prisma } from "../../config/prisma.js";

export const dashboardService = {
  async getKpis(filters?: {
    vehicleType?: VehicleType;
    status?: VehicleStatus;
    region?: string;
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

    const [
      availableVehicles,
      activeVehicles,
      inShopVehicles,
      activeTrips,
      draftTrips,
      driversOnDuty,
      totalFleet,
    ] = await Promise.all([
      prisma.vehicle.count({
        where: { ...vehicleWhere, status: VehicleStatus.AVAILABLE },
      }),
      prisma.vehicle.count({
        where: { ...vehicleWhere, status: VehicleStatus.ON_TRIP },
      }),
      prisma.vehicle.count({
        where: { ...vehicleWhere, status: VehicleStatus.IN_SHOP },
      }),
      prisma.trip.count({
        where: { status: TripStatus.DISPATCHED, ...tripVehicleWhere },
      }),
      prisma.trip.count({
        where: { status: TripStatus.DRAFT, ...tripVehicleWhere },
      }),
      prisma.driver.count({ where: { status: DriverStatus.ON_TRIP } }),
      prisma.vehicle.count({
        where: {
          ...vehicleWhere,
          status: { not: VehicleStatus.RETIRED },
        },
      }),
    ]);

    return {
      activeVehicles,
      availableVehicles,
      inMaintenanceVehicles: inShopVehicles,
      activeTrips,
      pendingTrips: draftTrips,
      driversOnDuty,
      fleetUtilizationPercent: totalFleet
        ? Number(((activeVehicles / totalFleet) * 100).toFixed(2))
      : 0,
    };
  },

  async getOverview(query: {
    recentTripsLimit: number;
    vehicleType?: VehicleType;
    status?: VehicleStatus;
    region?: string;
  }) {
    const vehicleWhere = {
      ...(query.vehicleType ? { type: query.vehicleType } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.region ? { region: query.region } : {}),
    };

    const tripVehicleWhere =
      Object.keys(vehicleWhere).length > 0
        ? { vehicle: { is: vehicleWhere } }
        : {};

    const [
      kpis,
      recentTrips,
      vehicleStatusBreakdown,
      tripStatusBreakdown,
      driverStatusBreakdown,
    ] = await Promise.all([
      this.getKpis(query),
      prisma.trip.findMany({
        where: tripVehicleWhere,
        take: query.recentTripsLimit,
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
      }),
      Promise.all(
        Object.values(VehicleStatus).map(async (status) => ({
          status,
          count: await prisma.vehicle.count({
            where: { ...vehicleWhere, status },
          }),
        })),
      ),
      Promise.all(
        Object.values(TripStatus).map(async (status) => ({
          status,
          count: await prisma.trip.count({
            where: { ...tripVehicleWhere, status },
          }),
        })),
      ),
      Promise.all(
        Object.values(DriverStatus).map(async (status) => ({
          status,
          count: await prisma.driver.count({ where: { status } }),
        })),
      ),
    ]);

    return {
      kpis,
      recentTrips,
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
