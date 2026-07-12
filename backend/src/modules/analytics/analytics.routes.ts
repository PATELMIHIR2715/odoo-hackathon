import { Router } from "express";
import { Role } from "@prisma/client";
import { allowModules, allowRoles } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { APP_MODULES } from "../../constants/modules.js";
import {
  getAnalyticsOverview,
  getFleetUtilizationReport,
  getFuelEfficiencyReport,
  getOperationalCostReport,
} from "./analytics.controller.js";

export const analyticsRouter = Router();

analyticsRouter.use(allowModules(APP_MODULES.ANALYTICS));

analyticsRouter.get(
  "/overview",
  allowRoles(Role.ADMIN, Role.FINANCIAL_ANALYST, Role.FLEET_MANAGER),
  asyncHandler(getAnalyticsOverview),
);

analyticsRouter.get(
  "/reports/fuel-efficiency",
  allowRoles(Role.ADMIN, Role.FINANCIAL_ANALYST, Role.FLEET_MANAGER),
  asyncHandler(getFuelEfficiencyReport),
);

analyticsRouter.get(
  "/reports/fleet-utilization",
  allowRoles(Role.ADMIN, Role.FINANCIAL_ANALYST, Role.FLEET_MANAGER),
  asyncHandler(getFleetUtilizationReport),
);

analyticsRouter.get(
  "/reports/operational-cost",
  allowRoles(Role.ADMIN, Role.FINANCIAL_ANALYST, Role.FLEET_MANAGER),
  asyncHandler(getOperationalCostReport),
);
