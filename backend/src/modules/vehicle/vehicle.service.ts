import { Role, VehicleStatus, VehicleType } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { ERROR_MESSAGES } from "../../constants/messages.js";
import { parseUuid } from "../shared/operations.shared.js";
import {
  vehicleInputSchema,
  vehicleStatusSchema,
  vehicleTypeSchema,
} from "./vehicle.validation.js";
import { randomUUID } from "node:crypto";

export const vehiclesService = {
  async listVehicles(query: {
    search?: string;
    status?: VehicleStatus;
    type?: VehicleType;
    region?: string;
    page: number;
    pageSize: number;
  }) {
    const search = query.search?.trim();
    const where = {
      ...(query.status ? { status: vehicleStatusSchema.parse(query.status) } : {}),
      ...(query.type ? { type: vehicleTypeSchema.parse(query.type) } : {}),
      ...(query.region ? { region: String(query.region).trim() } : {}),
      ...(search
        ? {
            OR: [
              { registrationNumber: { contains: search, mode: "insensitive" as const } },
              { name: { contains: search, mode: "insensitive" as const } },
              { vehicleCode: { contains: search, mode: "insensitive" as const } },
              { manufacturer: { contains: search, mode: "insensitive" as const } },
              { model: { contains: search, mode: "insensitive" as const } },
              { region: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      prisma.vehicle.count({ where }),
      prisma.vehicle.findMany({
        where,
        orderBy: { createdAt: "desc" },
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

  async listAvailableVehicles() {
    return prisma.vehicle.findMany({
      where: { status: VehicleStatus.AVAILABLE },
    });
  },

  async getVehicleById(id: string) {
    const item = await prisma.vehicle.findUnique({
      where: { id: parseUuid(id) },
    });

    if (!item) {
      throw new ApiError(404, "VEHICLE_NOT_FOUND", ERROR_MESSAGES.VEHICLE_NOT_FOUND);
    }

    return item;
  },

  async createVehicle(input: unknown) {
    const parsed = vehicleInputSchema.parse(input);
    return prisma.vehicle.create({
      data: {
        ...parsed,
        vehicleCode: parsed.vehicleCode ?? `VEH-${randomUUID().slice(0, 8)}`,
        manufacturer: parsed.manufacturer ?? "Unknown",
        model: parsed.model ?? parsed.name,
      },
    });
  },

  async updateVehicle(id: string, input: unknown) {
    return prisma.vehicle.update({
      where: { id: parseUuid(id) },
      data: vehicleInputSchema.partial().parse(input),
    });
  },

  async retireVehicle(id: string) {
    return prisma.vehicle.update({
      where: { id: parseUuid(id) },
      data: { status: VehicleStatus.RETIRED },
    });
  },

  async getVehicleTotalCost(id: string) {
    const vehicleId = parseUuid(id);
    const [fuel, maintenance, expenses] = await Promise.all([
      prisma.fuelLog.aggregate({ where: { vehicleId }, _sum: { cost: true } }),
      prisma.maintenanceLog.aggregate({
        where: { vehicleId },
        _sum: { cost: true },
      }),
      prisma.expense.aggregate({
        where: { vehicleId },
        _sum: { amount: true },
      }),
    ]);

    return {
      vehicleId,
      fuelCost: fuel._sum.cost ?? 0,
      maintenanceCost: maintenance._sum.cost ?? 0,
      expenseCost: expenses._sum.amount ?? 0,
      totalCost:
        (fuel._sum.cost ?? 0) +
        (maintenance._sum.cost ?? 0) +
        (expenses._sum.amount ?? 0),
    };
  },
};
