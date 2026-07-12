import { DriverStatus } from "@prisma/client";
import { z } from "zod";

export const driverIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const driverStatusSchema = z.nativeEnum(DriverStatus);

export const listDriversQuerySchema = z.object({
  status: z.string().optional(),
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
