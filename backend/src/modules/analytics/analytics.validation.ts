import { z } from "zod";

export const analyticsQuerySchema = z.object({
  vehicleId: z.string().uuid().optional(),
});
