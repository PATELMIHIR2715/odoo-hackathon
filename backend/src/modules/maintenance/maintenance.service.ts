import { MaintenanceStatus, VehicleStatus } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { parseUuid } from "../shared/operations.shared.js";
import {
  createMaintenanceSchema,
  maintenanceStatusSchema,
} from "./maintenance.validation.js";

export const maintenanceService = {
  async listMaintenance(query: { vehicleId?: string; status?: string }) {
    return prisma.maintenanceLog.findMany({
      where: {
        ...(query.vehicleId ? { vehicleId: query.vehicleId } : {}),
        ...(query.status
          ? { status: maintenanceStatusSchema.parse(query.status) }
          : {}),
      },
      include: { vehicle: true },
    });
  },

  async createMaintenanceLog(input: unknown) {
    const data = createMaintenanceSchema.parse(input);

    return prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findUnique({
        where: { id: data.vehicleId },
      });

      if (!vehicle) {
        throw new ApiError(404, "VEHICLE_NOT_FOUND", "Vehicle not found");
      }

      if (
        vehicle.status === VehicleStatus.ON_TRIP ||
        vehicle.status === VehicleStatus.RETIRED
      ) {
        throw new ApiError(
          409,
          "VEHICLE_UNAVAILABLE",
          "Vehicle cannot be put into maintenance",
        );
      }

      await tx.vehicle.update({
        where: { id: data.vehicleId },
        data: { status: VehicleStatus.IN_SHOP },
      });

      return tx.maintenanceLog.create({ data });
    });
  },

  async closeMaintenanceLog(id: string) {
    const logId = parseUuid(id);

    return prisma.$transaction(async (tx) => {
      const log = await tx.maintenanceLog.findUnique({ where: { id: logId } });

      if (!log) {
        throw new ApiError(
          404,
          "MAINTENANCE_NOT_FOUND",
          "Maintenance record not found",
        );
      }

      if (log.status !== MaintenanceStatus.OPEN) {
        throw new ApiError(
          409,
          "INVALID_MAINTENANCE_STATE",
          "Maintenance record is already closed",
        );
      }

      const vehicle = await tx.vehicle.findUniqueOrThrow({
        where: { id: log.vehicleId },
      });

      if (vehicle.status !== VehicleStatus.RETIRED) {
        await tx.vehicle.update({
          where: { id: log.vehicleId },
          data: { status: VehicleStatus.AVAILABLE },
        });
      }

      return tx.maintenanceLog.update({
        where: { id: logId },
        data: { status: MaintenanceStatus.CLOSED, closedAt: new Date() },
      });
    });
  },
};
