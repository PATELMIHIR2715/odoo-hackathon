import { DriverStatus } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { parseUuid } from "../shared/operations.shared.js";
import {
  driverInputSchema,
  driverStatusSchema,
} from "./driver.validation.js";

export const driversService = {
  async listDrivers(query: { status?: string }) {
    const status = query.status ? driverStatusSchema.parse(query.status) : undefined;

    return prisma.driver.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
    });
  },

  async listAvailableDrivers() {
    return prisma.driver.findMany({
      where: {
        status: DriverStatus.AVAILABLE,
        licenseExpiryDate: { gt: new Date() },
      },
    });
  },

  async getDriverById(id: string) {
    const item = await prisma.driver.findUnique({
      where: { id: parseUuid(id) },
    });

    if (!item) {
      throw new ApiError(404, "DRIVER_NOT_FOUND", "Driver not found");
    }

    return item;
  },

  async createDriver(input: unknown) {
    return prisma.driver.create({ data: driverInputSchema.parse(input) });
  },

  async updateDriver(id: string, input: unknown) {
    return prisma.driver.update({
      where: { id: parseUuid(id) },
      data: driverInputSchema.partial().parse(input),
    });
  },
};
