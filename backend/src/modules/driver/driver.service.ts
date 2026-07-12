import { DriverStatus } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { parseUuid } from "../shared/operations.shared.js";
import {
  driverInputSchema,
  driverStatusSchema,
} from "./driver.validation.js";

export const driversService = {
  async listDrivers(query: {
    search?: string;
    status?: DriverStatus;
    page: number;
    pageSize: number;
  }) {
    const status = query.status ? driverStatusSchema.parse(query.status) : undefined;

    const where = {
      ...(status ? { status } : {}),
      ...(query.search
        ? {
            OR: [
              {
                name: { contains: query.search, mode: "insensitive" as const },
              },
              {
                licenseNumber: {
                  contains: query.search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      prisma.driver.count({ where }),
      prisma.driver.findMany({
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
