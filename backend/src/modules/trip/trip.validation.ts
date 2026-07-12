import { TripStatus } from "@prisma/client";
import { z } from "zod";

export const tripIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const tripStatusSchema = z.nativeEnum(TripStatus);

export const listTripsQuerySchema = z.object({
  status: z.string().optional(),
  driverId: z.string().uuid().optional(),
  vehicleId: z.string().uuid().optional(),
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
