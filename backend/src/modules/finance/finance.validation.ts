import { ExpenseType } from "@prisma/client";
import { z } from "zod";

export const financeQuerySchema = z.object({
  vehicleId: z.string().uuid().optional(),
  type: z.string().optional(),
});

export const expenseTypeSchema = z.nativeEnum(ExpenseType);

export const fuelLogCreateSchema = z.object({
  vehicleId: z.string().uuid(),
  liters: z.coerce.number().positive(),
  cost: z.coerce.number().min(0),
  date: z.coerce.date().optional(),
});

export const expenseCreateSchema = z.object({
  vehicleId: z.string().uuid(),
  type: expenseTypeSchema,
  amount: z.coerce.number().positive(),
  note: z.string().max(500).optional(),
  date: z.coerce.date().optional(),
});
