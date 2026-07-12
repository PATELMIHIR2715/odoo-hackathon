import {
  DriverStatus,
  Prisma,
  Role,
  TripStatus,
  VehicleStatus,
  VehicleType,
} from "@prisma/client";
import { z } from "zod";
import { ApiError } from "../../utils/ApiError.js";
import { successResponse } from "../../lib/response.js";

export const allRoles = Object.values(Role);

export const idSchema = z.string().uuid();

export const vehicleInputSchema = z.object({
  registrationNumber: z.string().min(2),
  name: z.string().min(2),
  type: z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toUpperCase() : value),
    z.nativeEnum(VehicleType),
  ),
  maxLoadCapacityKg: z.coerce.number().positive(),
  odometerKm: z.coerce.number().min(0).optional(),
  acquisitionCost: z.coerce.number().min(0),
  region: z.string().max(80).optional().nullable(),
});

export const driverInputSchema = z.object({
  name: z.string().min(2),
  licenseNumber: z.string().min(2),
  licenseCategory: z.string().min(1),
  licenseExpiryDate: z.coerce.date(),
  contactNumber: z.string().min(5),
  safetyScore: z.coerce.number().min(0).max(100).optional(),
  status: z.nativeEnum(DriverStatus).optional(),
});

export const tripInputSchema = z.object({
  source: z.string().min(2),
  destination: z.string().min(2),
  vehicleId: z.string().uuid(),
  driverId: z.string().uuid(),
  cargoWeightKg: z.coerce.number().positive(),
  plannedDistance: z.coerce.number().positive(),
});

export function sendJson(
  res: { status: (code: number) => { json: (body: unknown) => unknown } },
  data: unknown,
  status = 200,
) {
  return successResponse(res as never, data, status);
}

export function parseUuid(value: unknown) {
  return idSchema.parse(value);
}

export async function assertVehicleAndDriverForTrip(
  tx: Prisma.TransactionClient,
  vehicleId: string,
  driverId: string,
  cargoWeightKg: number,
) {
  const [vehicle, driver] = await Promise.all([
    tx.vehicle.findUnique({ where: { id: vehicleId } }),
    tx.driver.findUnique({ where: { id: driverId } }),
  ]);

  if (!vehicle || !driver) {
    throw new ApiError(
      404,
      "RESOURCE_NOT_FOUND",
      "Vehicle or driver was not found",
    );
  }

  if (vehicle.status !== VehicleStatus.AVAILABLE) {
    throw new ApiError(409, "VEHICLE_UNAVAILABLE", "Vehicle is not available");
  }

  if (
    driver.status !== DriverStatus.AVAILABLE ||
    driver.licenseExpiryDate <= new Date()
  ) {
    throw new ApiError(
      409,
      "DRIVER_UNAVAILABLE",
      "Driver is unavailable or has an expired license",
    );
  }

  if (cargoWeightKg > vehicle.maxLoadCapacityKg) {
    throw new ApiError(
      400,
      "CAPACITY_EXCEEDED",
      "Cargo weight exceeds vehicle capacity",
    );
  }

  return { vehicle, driver };
}

export const tripStatusSchema = z.nativeEnum(TripStatus);
export const vehicleStatusSchema = z.nativeEnum(VehicleStatus);
export const vehicleTypeSchema = z.nativeEnum(VehicleType);
