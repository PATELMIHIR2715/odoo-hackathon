import type { RequestHandler } from "express";
import { successResponse } from "../../lib/response.js";
import { tripsService } from "./trip.service.js";
import { tripIdParamSchema, listTripsQuerySchema } from "./trip.validation.js";

export const listTrips: RequestHandler = async (req, res) => {
  return successResponse(res, await tripsService.listTrips(listTripsQuerySchema.parse(req.query)));
};

export const getTrip: RequestHandler = async (req, res) => {
  return successResponse(res, await tripsService.getTripById(tripIdParamSchema.parse(req.params).id));
};

export const createTrip: RequestHandler = async (req, res) => {
  return successResponse(res, await tripsService.createTrip(req.body, req.user!.id), 201);
};

export const dispatchTrip: RequestHandler = async (req, res) => {
  return successResponse(res, await tripsService.dispatchTrip(tripIdParamSchema.parse(req.params).id));
};

export const completeTrip: RequestHandler = async (req, res) => {
  return successResponse(res, await tripsService.completeTrip(tripIdParamSchema.parse(req.params).id, req.body));
};

export const cancelTrip: RequestHandler = async (req, res) => {
  return successResponse(res, await tripsService.cancelTrip(tripIdParamSchema.parse(req.params).id));
};
