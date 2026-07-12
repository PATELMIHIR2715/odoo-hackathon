import { ExpenseType } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import {
  expenseCreateSchema,
  expenseTypeSchema,
  fuelLogCreateSchema,
} from "./finance.validation.js";

export const financeService = {
  async listFuelLogs(query: { vehicleId?: string }) {
    return prisma.fuelLog.findMany({
      where: query.vehicleId ? { vehicleId: query.vehicleId } : {},
      include: { vehicle: true },
    });
  },

  async createFuelLog(input: unknown) {
    return prisma.fuelLog.create({
      data: fuelLogCreateSchema.parse(input),
    });
  },

  async listExpenses(query: { vehicleId?: string; type?: string }) {
    return prisma.expense.findMany({
      where: {
        ...(query.vehicleId ? { vehicleId: query.vehicleId } : {}),
        ...(query.type ? { type: expenseTypeSchema.parse(query.type) } : {}),
      },
      include: { vehicle: true },
    });
  },

  async createExpense(input: unknown) {
    return prisma.expense.create({
      data: expenseCreateSchema.parse(input),
    });
  },
};
