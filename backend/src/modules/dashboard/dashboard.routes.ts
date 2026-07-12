import { Router } from "express";
import { allowModules } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { APP_MODULES } from "../../constants/modules.js";
import { getDashboardKpis, getDashboardOverview } from "./dashboard.controller.js";

export const dashboardRouter = Router();

dashboardRouter.use(allowModules(APP_MODULES.DASHBOARD));

dashboardRouter.get("/kpis", asyncHandler(getDashboardKpis));
dashboardRouter.get("/overview", asyncHandler(getDashboardOverview));
