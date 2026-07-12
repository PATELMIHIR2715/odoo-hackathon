import { VehicleStatus, VehicleType } from "@prisma/client";
import { z } from "zod";

export const vehicleIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const vehicleStatusSchema = z.nativeEnum(VehicleStatus);
export const vehicleTypeSchema = z.nativeEnum(VehicleType);

export const listVehiclesQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .min(1)
    .optional(),
  status: z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toUpperCase() : value),
    z.nativeEnum(VehicleStatus),
  ).optional(),
  type: z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toUpperCase() : value),
    z.nativeEnum(VehicleType),
  ).optional(),
  region: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export const vehicleInputSchema = z.object({
  registrationNumber: z.string().min(2),
  name: z.string().min(2),
  type: z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toUpperCase() : value),
    z.nativeEnum(VehicleType),
  ),
  vehicleCode: z.string().min(2).optional(),
  manufacturer: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  maxLoadCapacityKg: z.coerce.number().positive(),
  odometerKm: z.coerce.number().min(0).optional(),
  acquisitionCost: z.coerce.number().min(0),
  region: z.string().max(80).optional().nullable(),
});
