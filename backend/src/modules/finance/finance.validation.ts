import { ExpenseType } from "@prisma/client";
import { z } from "zod";

export const expenseTypeSchema = z.nativeEnum(ExpenseType);

export const financeQuerySchema = z.object({
  vehicleId: z.string().uuid().optional(),
  type: z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toUpperCase() : value),
    expenseTypeSchema,
  ).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

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
