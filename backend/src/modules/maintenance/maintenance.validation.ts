import { MaintenanceStatus } from "@prisma/client";
import { z } from "zod";

export const maintenanceIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const maintenanceStatusSchema = z.nativeEnum(MaintenanceStatus);

export const listMaintenanceQuerySchema = z.object({
  vehicleId: z.string().uuid().optional(),
  status: z.string().optional(),
});

export const createMaintenanceSchema = z.object({
  vehicleId: z.string().uuid(),
  description: z.string().min(2),
  cost: z.coerce.number().min(0).optional(),
});
