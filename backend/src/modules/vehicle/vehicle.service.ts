import { Role, VehicleStatus } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { parseUuid } from "../shared/operations.shared.js";
import { vehicleInputSchema, vehicleStatusSchema } from "./vehicle.validation.js";

export const vehiclesService = {
  async listVehicles(query: { status?: string; type?: string; region?: string }) {
    const where = {
      ...(query.status ? { status: vehicleStatusSchema.parse(query.status) } : {}),
      ...(query.type ? { type: String(query.type) } : {}),
      ...(query.region ? { region: String(query.region) } : {}),
    };

    return prisma.vehicle.findMany({ where, orderBy: { createdAt: "desc" } });
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
      throw new ApiError(404, "VEHICLE_NOT_FOUND", "Vehicle not found");
    }

    return item;
  },

  async createVehicle(input: unknown) {
    return prisma.vehicle.create({ data: vehicleInputSchema.parse(input) });
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
