import { ExpenseType } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import {
  expenseCreateSchema,
  expenseTypeSchema,
  fuelLogCreateSchema,
} from "./finance.validation.js";

export const financeService = {
  async listFuelLogs(query: {
    search?: string;
    vehicleId?: string;
    sortBy: "date" | "createdAt" | "liters" | "cost" | "amount";
    sortOrder: "asc" | "desc";
    page: number;
    pageSize: number;
  }) {
    const where = {
      ...(query.vehicleId ? { vehicleId: query.vehicleId } : {}),
      ...(query.search
        ? {
            vehicle: {
              is: {
                OR: [
                  {
                    registrationNumber: {
                      contains: query.search,
                      mode: "insensitive" as const,
                    },
                  },
                  {
                    vehicleCode: {
                      contains: query.search,
                      mode: "insensitive" as const,
                    },
                  },
                  { name: { contains: query.search, mode: "insensitive" as const } },
                ],
              },
            },
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      prisma.fuelLog.count({ where }),
      prisma.fuelLog.findMany({
        where,
        include: { vehicle: true },
        orderBy: { [query.sortBy]: query.sortOrder },
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
    search?: string;
    vehicleId?: string;
    type?: ExpenseType;
    sortBy: "date" | "createdAt" | "liters" | "cost" | "amount";
    sortOrder: "asc" | "desc";
    page: number;
    pageSize: number;
  }) {
    const where = {
      ...(query.vehicleId ? { vehicleId: query.vehicleId } : {}),
      ...(query.type ? { type: expenseTypeSchema.parse(query.type) } : {}),
      ...(query.search
        ? {
            vehicle: {
              is: {
                OR: [
                  {
                    registrationNumber: {
                      contains: query.search,
                      mode: "insensitive" as const,
                    },
                  },
                  {
                    vehicleCode: {
                      contains: query.search,
                      mode: "insensitive" as const,
                    },
                  },
                  { name: { contains: query.search, mode: "insensitive" as const } },
                ],
              },
            },
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      prisma.expense.count({ where }),
      prisma.expense.findMany({
        where,
        include: { vehicle: true },
        orderBy: { [query.sortBy]: query.sortOrder },
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

  async getSummary(query: { vehicleId?: string }) {
    const where = query.vehicleId ? { vehicleId: query.vehicleId } : {};

    const [fuel, expenses, maintenance] = await Promise.all([
      prisma.fuelLog.aggregate({ where, _sum: { cost: true } }),
      prisma.expense.aggregate({ where, _sum: { amount: true } }),
      prisma.maintenanceLog.aggregate({ where, _sum: { cost: true } }),
    ]);

    const fuelCost = fuel._sum.cost ?? 0;
    const expenseCost = expenses._sum.amount ?? 0;
    const maintenanceCost = maintenance._sum.cost ?? 0;

    return {
      fuelCost,
      expenseCost,
      maintenanceCost,
      totalOperationalCost: fuelCost + expenseCost + maintenanceCost,
    };
  },
};
