import { DriverStatus, TripStatus, VehicleStatus } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { ERROR_MESSAGES } from "../../constants/messages.js";
import { parseUuid, assertVehicleAndDriverForTrip } from "../shared/operations.shared.js";
import { tripCompletionSchema, tripInputSchema, tripStatusSchema } from "./trip.validation.js";

export const tripsService = {
  async listTrips(query: {
    search?: string;
    status?: TripStatus;
    driverId?: string;
    vehicleId?: string;
    page: number;
    pageSize: number;
    sortBy: "createdAt" | "updatedAt" | "source" | "destination" | "status";
    sortOrder: "asc" | "desc";
  }) {
    const where = {
      ...(query.status ? { status: tripStatusSchema.parse(query.status) } : {}),
      ...(query.driverId ? { driverId: query.driverId } : {}),
      ...(query.vehicleId ? { vehicleId: query.vehicleId } : {}),
      ...(query.search
        ? {
            OR: [
              { source: { contains: query.search, mode: "insensitive" as const } },
              { destination: { contains: query.search, mode: "insensitive" as const } },
              {
                vehicle: {
                  is: {
                    OR: [
                      {
                        registrationNumber: {
                          contains: query.search,
                          mode: "insensitive" as const,
                        },
                      },
                      { name: { contains: query.search, mode: "insensitive" as const } },
                      {
                        vehicleCode: {
                          contains: query.search,
                          mode: "insensitive" as const,
                        },
                      },
                    ],
                  },
                },
              },
              {
                driver: {
                  is: {
                    name: { contains: query.search, mode: "insensitive" as const },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      prisma.trip.count({ where }),
      prisma.trip.findMany({
        where,
        include: { vehicle: true, driver: true },
        orderBy: { [query.sortBy]: query.sortOrder },
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

  async getTripBoard() {
    const [items, counts, vehicles, drivers] = await Promise.all([
      prisma.trip.findMany({
        include: { vehicle: true, driver: true },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
      prisma.trip.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.vehicle.count({ where: { status: VehicleStatus.AVAILABLE } }),
      prisma.driver.count({
        where: { status: DriverStatus.AVAILABLE, licenseExpiryDate: { gt: new Date() } },
      }),
    ]);

    return {
      items,
      counts: counts.reduce<Record<string, number>>((acc, row) => {
        acc[row.status] = row._count._all;
        return acc;
      }, {}),
      availableResources: {
        vehicles,
        drivers,
      },
    };
  },

  async getTripById(id: string) {
    const item = await prisma.trip.findUnique({
      where: { id: parseUuid(id) },
      include: { vehicle: true, driver: true },
    });

    if (!item) {
      throw new ApiError(404, "TRIP_NOT_FOUND", ERROR_MESSAGES.TRIP_NOT_FOUND);
    }

    return item;
  },

  async createTrip(input: unknown, createdByProfileId: string) {
    const data = tripInputSchema.parse(input);

    return prisma.$transaction(async (tx) => {
      await assertVehicleAndDriverForTrip(
        tx,
        data.vehicleId,
        data.driverId,
        data.cargoWeightKg,
      );

      return tx.trip.create({
        data: { ...data, createdByProfileId },
      });
    });
  },

  async dispatchTrip(id: string) {
    const tripId = parseUuid(id);

    return prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id: tripId } });
      if (!trip) {
        throw new ApiError(404, "TRIP_NOT_FOUND", ERROR_MESSAGES.TRIP_NOT_FOUND);
      }

      if (trip.status !== TripStatus.DRAFT) {
        throw new ApiError(
          409,
          "INVALID_TRIP_STATE",
          ERROR_MESSAGES.ONLY_DRAFT_DISPATCHABLE,
        );
      }

      await assertVehicleAndDriverForTrip(
        tx,
        trip.vehicleId,
        trip.driverId,
        trip.cargoWeightKg,
      );

      await Promise.all([
        tx.vehicle.update({
          where: { id: trip.vehicleId },
          data: { status: VehicleStatus.ON_TRIP },
        }),
        tx.driver.update({
          where: { id: trip.driverId },
          data: { status: DriverStatus.ON_TRIP },
        }),
      ]);

      return tx.trip.update({
        where: { id: tripId },
        data: { status: TripStatus.DISPATCHED, dispatchedAt: new Date() },
      });
    });
  },

  async completeTrip(id: string, input: unknown) {
    const tripId = parseUuid(id);
    const payload = tripCompletionSchema.parse(input);

    return prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id: tripId } });
      if (!trip) {
        throw new ApiError(404, "TRIP_NOT_FOUND", "Trip not found");
      }

      if (trip.status !== TripStatus.DISPATCHED) {
        throw new ApiError(
          409,
          "INVALID_TRIP_STATE",
          ERROR_MESSAGES.ONLY_DISPATCHED_COMPLETABLE,
        );
      }

      await Promise.all([
        tx.vehicle.update({
          where: { id: trip.vehicleId },
          data: {
            status: VehicleStatus.AVAILABLE,
            odometerKm: { increment: payload.actualDistance },
          },
        }),
        tx.driver.update({
          where: { id: trip.driverId },
          data: { status: DriverStatus.AVAILABLE },
        }),
      ]);

      if (payload.fuelConsumedL !== undefined) {
        await tx.fuelLog.create({
          data: {
            vehicleId: trip.vehicleId,
            liters: payload.fuelConsumedL,
            cost: payload.fuelCost ?? 0,
          },
        });
      }

      return tx.trip.update({
        where: { id: tripId },
        data: {
          status: TripStatus.COMPLETED,
          completedAt: new Date(),
          actualDistance: payload.actualDistance,
          fuelConsumedL: payload.fuelConsumedL,
        },
      });
    });
  },

  async cancelTrip(id: string) {
    const tripId = parseUuid(id);

    return prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id: tripId } });
      if (!trip) {
        throw new ApiError(404, "TRIP_NOT_FOUND", "Trip not found");
      }

      if (trip.status !== TripStatus.DRAFT && trip.status !== TripStatus.DISPATCHED) {
        throw new ApiError(
          409,
          "INVALID_TRIP_STATE",
          ERROR_MESSAGES.ONLY_ACTIVE_CANCELLABLE,
        );
      }

      if (trip.status === TripStatus.DISPATCHED) {
        await Promise.all([
          tx.vehicle.update({
            where: { id: trip.vehicleId },
            data: { status: VehicleStatus.AVAILABLE },
          }),
          tx.driver.update({
            where: { id: trip.driverId },
            data: { status: DriverStatus.AVAILABLE },
          }),
        ]);
      }

      return tx.trip.update({
        where: { id: tripId },
        data: { status: TripStatus.CANCELLED, cancelledAt: new Date() },
      });
    });
  },
};
