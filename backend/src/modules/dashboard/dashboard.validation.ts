import { VehicleStatus, VehicleType } from "@prisma/client";
import { z } from "zod";

export const dashboardOverviewQuerySchema = z.object({
  vehicleType: z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toUpperCase() : value),
    z.nativeEnum(VehicleType),
  ).optional(),
  status: z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toUpperCase() : value),
    z.nativeEnum(VehicleStatus),
  ).optional(),
  region: z.string().trim().min(1).optional(),
  recentTripsLimit: z.coerce.number().int().min(1).max(20).default(5),
});
