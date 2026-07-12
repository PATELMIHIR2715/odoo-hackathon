import type { RequestHandler } from "express";
import { successResponse } from "../../lib/response.js";
import { driversService } from "./driver.service.js";
import { driverIdParamSchema, listDriversQuerySchema } from "./driver.validation.js";

export const listDrivers: RequestHandler = async (req, res) => {
  return successResponse(
    res,
    await driversService.listDrivers(listDriversQuerySchema.parse(req.query)),
  );
};

export const listAvailableDrivers: RequestHandler = async (_req, res) => {
  return successResponse(res, await driversService.listAvailableDrivers());
};

export const getDriver: RequestHandler = async (req, res) => {
  return successResponse(
    res,
    await driversService.getDriverById(driverIdParamSchema.parse(req.params).id),
  );
};

export const createDriver: RequestHandler = async (req, res) => {
  return successResponse(res, await driversService.createDriver(req.body), 201);
};

export const updateDriver: RequestHandler = async (req, res) => {
  const { id } = driverIdParamSchema.parse(req.params);
  return successResponse(res, await driversService.updateDriver(id, req.body));
};
