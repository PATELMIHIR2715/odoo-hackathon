import { MaintenanceStatus } from "@prisma/client";
import { z } from "zod";

export const maintenanceIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const maintenanceStatusSchema = z.nativeEnum(MaintenanceStatus);

export const listMaintenanceQuerySchema = z.object({
  vehicleId: z.string().uuid().optional(),
  status: z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toUpperCase() : value),
    z.nativeEnum(MaintenanceStatus),
  ).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export const createMaintenanceSchema = z.object({
  vehicleId: z.string().uuid(),
  description: z.string().min(2),
  cost: z.coerce.number().min(0).optional(),
});
