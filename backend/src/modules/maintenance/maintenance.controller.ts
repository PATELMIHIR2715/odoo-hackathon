import type { RequestHandler } from "express";
import { successResponse } from "../../lib/response.js";
import { maintenanceService } from "./maintenance.service.js";
import {
  maintenanceIdParamSchema,
  listMaintenanceQuerySchema,
} from "./maintenance.validation.js";

export const listMaintenance: RequestHandler = async (req, res) => {
  return successResponse(
    res,
    await maintenanceService.listMaintenance(
      listMaintenanceQuerySchema.parse(req.query),
    ),
  );
};

export const createMaintenance: RequestHandler = async (req, res) => {
  return successResponse(
    res,
    await maintenanceService.createMaintenanceLog(req.body),
    201,
  );
};

export const closeMaintenance: RequestHandler = async (req, res) => {
  const { id } = maintenanceIdParamSchema.parse(req.params);
  return successResponse(res, await maintenanceService.closeMaintenanceLog(id));
};
