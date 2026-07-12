import { ExpenseType } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import {
  expenseCreateSchema,
  expenseTypeSchema,
  fuelLogCreateSchema,
} from "./finance.validation.js";

export const financeService = {
  async listFuelLogs(query: {
    vehicleId?: string;
    page: number;
    pageSize: number;
  }) {
    const where = query.vehicleId ? { vehicleId: query.vehicleId } : {};

    const [total, items] = await Promise.all([
      prisma.fuelLog.count({ where }),
      prisma.fuelLog.findMany({
        where,
        include: { vehicle: true },
        orderBy: { date: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    return {
      items,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  },

  async createFuelLog(input: unknown) {
    return prisma.fuelLog.create({
      data: fuelLogCreateSchema.parse(input),
    });
  },

  async listExpenses(query: {
    vehicleId?: string;
    type?: ExpenseType;
    page: number;
    pageSize: number;
  }) {
    const where = {
      ...(query.vehicleId ? { vehicleId: query.vehicleId } : {}),
      ...(query.type ? { type: expenseTypeSchema.parse(query.type) } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.expense.count({ where }),
      prisma.expense.findMany({
        where,
        include: { vehicle: true },
        orderBy: { date: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    return {
      items,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  },

  async createExpense(input: unknown) {
    return prisma.expense.create({
      data: expenseCreateSchema.parse(input),
    });
  },
};
