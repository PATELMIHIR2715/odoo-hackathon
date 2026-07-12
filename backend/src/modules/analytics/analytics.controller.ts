import type { RequestHandler } from "express";
import { successResponse } from "../../lib/response.js";
import { analyticsService } from "./analytics.service.js";
import { analyticsQuerySchema } from "./analytics.validation.js";

export const getFuelEfficiencyReport: RequestHandler = async (req, res) => {
  return successResponse(
    res,
    await analyticsService.fuelEfficiency(
      analyticsQuerySchema.parse(req.query),
    ),
  );
};

export const getFleetUtilizationReport: RequestHandler = async (_req, res) => {
  return successResponse(res, await analyticsService.fleetUtilization());
};

export const getOperationalCostReport: RequestHandler = async (req, res) => {
  return successResponse(
    res,
    await analyticsService.operationalCost(
      analyticsQuerySchema.parse(req.query),
    ),
  );
};
