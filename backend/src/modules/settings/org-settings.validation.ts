import { z } from 'zod';

export const orgSettingsSchema = z.object({
  orgName: z.string().min(2),
  depotName: z.string().min(2),
  currency: z.string().min(2).max(8),
  distanceUnit: z.string().min(1).max(10),
  timezone: z.string().min(2).max(64),
  contactEmail: z.string().email().optional().nullable(),
  contactPhone: z.string().min(5).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
});

export const updateOrgSettingsSchema = orgSettingsSchema.partial();
