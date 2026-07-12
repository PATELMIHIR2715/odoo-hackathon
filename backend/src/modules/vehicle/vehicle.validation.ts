import { VehicleStatus } from "@prisma/client";
import { z } from "zod";

export const vehicleIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const vehicleStatusSchema = z.nativeEnum(VehicleStatus);

export const listVehiclesQuerySchema = z.object({
  status: z.string().optional(),
  type: z.string().optional(),
  region: z.string().optional(),
});

export const vehicleInputSchema = z.object({
  registrationNumber: z.string().min(2),
  name: z.string().min(2),
  type: z.string().min(2),
  vehicleCode: z.string().min(2).optional(),
  manufacturer: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  maxLoadCapacityKg: z.coerce.number().positive(),
  odometerKm: z.coerce.number().min(0).optional(),
  acquisitionCost: z.coerce.number().min(0),
  region: z.string().max(80).optional().nullable(),
});
