import type { RequestHandler } from "express";
import { successResponse } from "../../lib/response.js";
import { dashboardService } from "./dashboard.service.js";

export const getDashboardKpis: RequestHandler = async (_req, res) => {
  return successResponse(res, await dashboardService.getKpis());
};
