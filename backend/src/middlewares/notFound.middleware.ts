import type { RequestHandler } from "express";
import { errorResponseStandard } from "../lib/response.js";
import { ApiError } from "../utils/ApiError.js";
import { ERROR_MESSAGES } from "../constants/messages.js";

export const notFound: RequestHandler = (req, res) =>
  errorResponseStandard(
    new ApiError(
      404,
      "NOT_FOUND",
      `${ERROR_MESSAGES.ROUTE_NOT_FOUND}: ${req.method} ${req.path}`,
    ),
    res,
    404,
  );
