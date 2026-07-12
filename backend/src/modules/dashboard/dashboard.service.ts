import { DriverStatus, TripStatus, VehicleStatus } from "@prisma/client";
import { prisma } from "../../config/prisma.js";

export const dashboardService = {
  async getKpis() {
    const [
      availableVehicles,
      activeVehicles,
      inShopVehicles,
      activeTrips,
      draftTrips,
      driversOnDuty,
      totalFleet,
    ] = await Promise.all([
      prisma.vehicle.count({ where: { status: VehicleStatus.AVAILABLE } }),
      prisma.vehicle.count({ where: { status: VehicleStatus.ON_TRIP } }),
      prisma.vehicle.count({ where: { status: VehicleStatus.IN_SHOP } }),
      prisma.trip.count({ where: { status: TripStatus.DISPATCHED } }),
      prisma.trip.count({ where: { status: TripStatus.DRAFT } }),
      prisma.driver.count({ where: { status: DriverStatus.ON_TRIP } }),
      prisma.vehicle.count({ where: { status: { not: VehicleStatus.RETIRED } } }),
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
};
