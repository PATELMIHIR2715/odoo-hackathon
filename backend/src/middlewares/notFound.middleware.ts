import type { RequestHandler } from "express";
import { errorResponseStandard } from "../lib/response.js";
import { ApiError } from "../utils/ApiError.js";

export const notFound: RequestHandler = (req, res) =>
  errorResponseStandard(
    new ApiError(
      404,
      "NOT_FOUND",
      `Route ${req.method} ${req.path} was not found`,
    ),
    res,
    404,
  );
