import type { RequestHandler } from "express";
import { ExpenseType, Role } from "@prisma/client";
import { successResponse } from "../../lib/response.js";
import { financeService } from "./finance.service.js";
import { financeQuerySchema } from "./finance.validation.js";

export const listFuelLogs: RequestHandler = async (req, res) => {
  const query = financeQuerySchema.parse(req.query);
  return successResponse(res, await financeService.listFuelLogs(query));
};

export const createFuelLog: RequestHandler = async (req, res) => {
  return successResponse(res, await financeService.createFuelLog(req.body), 201);
};

export const listExpenses: RequestHandler = async (req, res) => {
  const query = financeQuerySchema.parse(req.query);
  return successResponse(res, await financeService.listExpenses(query));
};

export const createExpense: RequestHandler = async (req, res) => {
  return successResponse(res, await financeService.createExpense(req.body), 201);
};
