import type { RequestHandler } from "express";
import { successResponse } from "../../lib/response.js";
import { dashboardService } from "./dashboard.service.js";
import { dashboardOverviewQuerySchema } from "./dashboard.validation.js";

export const getDashboardKpis: RequestHandler = async (_req, res) => {
  return successResponse(res, await dashboardService.getKpis());
};

export const getDashboardOverview: RequestHandler = async (req, res) => {
  return successResponse(
    res,
    await dashboardService.getOverview(dashboardOverviewQuerySchema.parse(req.query)),
  );
};
