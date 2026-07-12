import { Router } from "express";
import { Role } from "@prisma/client";
import { allowModules, allowRoles } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { APP_MODULES } from "../../constants/modules.js";
import {
  createExpense,
  createFuelLog,
  getFinanceSummary,
  listExpenses,
  listFuelLogs,
} from "./finance.controller.js";

export const financeRouter = Router();

financeRouter.use(allowModules(APP_MODULES.FUEL_EXPENSES));

financeRouter.get(
  "/summary",
  allowRoles(Role.ADMIN, Role.FINANCIAL_ANALYST, Role.FLEET_MANAGER, Role.DRIVER),
  asyncHandler(getFinanceSummary),
);

financeRouter.get(
  "/fuel-logs",
  allowRoles(Role.ADMIN, Role.FINANCIAL_ANALYST, Role.FLEET_MANAGER, Role.DRIVER),
  asyncHandler(listFuelLogs),
);

financeRouter.post(
  "/fuel-logs",
  allowRoles(Role.ADMIN, Role.FLEET_MANAGER, Role.DRIVER),
  asyncHandler(createFuelLog),
);

financeRouter.get(
  "/expenses",
  allowRoles(Role.ADMIN, Role.FINANCIAL_ANALYST, Role.FLEET_MANAGER, Role.DRIVER),
  asyncHandler(listExpenses),
);

financeRouter.post(
  "/expenses",
  allowRoles(Role.ADMIN, Role.FLEET_MANAGER, Role.DRIVER),
  asyncHandler(createExpense),
);
