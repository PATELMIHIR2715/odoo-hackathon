import type { RequestHandler } from "express";
import { Role } from "@prisma/client";
import { successResponse } from "../../lib/response.js";
import { vehiclesService } from "./vehicle.service.js";
import { listVehiclesQuerySchema, vehicleIdParamSchema } from "./vehicle.validation.js";

export const listVehicles: RequestHandler = async (req, res) => {
  return successResponse(res, await vehiclesService.listVehicles(listVehiclesQuerySchema.parse(req.query)));
};

export const listAvailableVehicles: RequestHandler = async (_req, res) => {
  return successResponse(res, await vehiclesService.listAvailableVehicles());
};

export const getVehicle: RequestHandler = async (req, res) => {
  return successResponse(res, await vehiclesService.getVehicleById(vehicleIdParamSchema.parse(req.params).id));
};

export const createVehicle: RequestHandler = async (req, res) => {
  return successResponse(res, await vehiclesService.createVehicle(req.body), 201);
};

export const updateVehicle: RequestHandler = async (req, res) => {
  const { id } = vehicleIdParamSchema.parse(req.params);
  return successResponse(res, await vehiclesService.updateVehicle(id, req.body));
};

export const retireVehicle: RequestHandler = async (req, res) => {
  const { id } = vehicleIdParamSchema.parse(req.params);
  return successResponse(res, await vehiclesService.retireVehicle(id));
};

export const getVehicleTotalCost: RequestHandler = async (req, res) => {
  const { id } = vehicleIdParamSchema.parse(req.params);
  return successResponse(res, await vehiclesService.getVehicleTotalCost(id));
};
