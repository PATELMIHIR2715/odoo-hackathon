import { MaintenanceStatus, VehicleStatus } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { ERROR_MESSAGES } from "../../constants/messages.js";
import { parseUuid } from "../shared/operations.shared.js";
import {
  createMaintenanceSchema,
  maintenanceStatusSchema,
} from "./maintenance.validation.js";

export const maintenanceService = {
  async listMaintenance(query: {
    vehicleId?: string;
    status?: MaintenanceStatus;
    page: number;
    pageSize: number;
  }) {
    const where = {
      ...(query.vehicleId ? { vehicleId: query.vehicleId } : {}),
      ...(query.status ? { status: maintenanceStatusSchema.parse(query.status) } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.maintenanceLog.count({ where }),
      prisma.maintenanceLog.findMany({
        where,
        include: { vehicle: true },
        orderBy: { openedAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    return {
      items,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  },

  async createMaintenanceLog(input: unknown) {
    const data = createMaintenanceSchema.parse(input);

    return prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findUnique({
        where: { id: data.vehicleId },
      });

      if (!vehicle) {
        throw new ApiError(404, "VEHICLE_NOT_FOUND", ERROR_MESSAGES.VEHICLE_NOT_FOUND);
      }

      if (
        vehicle.status === VehicleStatus.ON_TRIP ||
        vehicle.status === VehicleStatus.RETIRED
      ) {
        throw new ApiError(
          409,
          "VEHICLE_UNAVAILABLE",
          ERROR_MESSAGES.VEHICLE_MAINTENANCE_BLOCKED,
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
          ERROR_MESSAGES.MAINTENANCE_NOT_FOUND,
        );
      }

      if (log.status !== MaintenanceStatus.OPEN) {
        throw new ApiError(
          409,
          "INVALID_MAINTENANCE_STATE",
          ERROR_MESSAGES.MAINTENANCE_ALREADY_CLOSED,
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
