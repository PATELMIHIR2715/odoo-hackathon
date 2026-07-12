import { TripStatus } from "@prisma/client";
import { z } from "zod";

export const tripIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const tripStatusSchema = z.nativeEnum(TripStatus);

export const listTripsQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  status: z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toUpperCase() : value),
    z.nativeEnum(TripStatus),
  ).optional(),
  driverId: z.string().uuid().optional(),
  vehicleId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(["createdAt", "updatedAt", "source", "destination", "status"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const tripInputSchema = z.object({
  source: z.string().min(2),
  destination: z.string().min(2),
  vehicleId: z.string().uuid(),
  driverId: z.string().uuid(),
  cargoWeightKg: z.coerce.number().positive(),
  plannedDistance: z.coerce.number().positive(),
});

export const tripCompletionSchema = z.object({
  actualDistance: z.coerce.number().nonnegative(),
  fuelConsumedL: z.coerce.number().nonnegative().optional(),
  fuelCost: z.coerce.number().nonnegative().optional(),
});
