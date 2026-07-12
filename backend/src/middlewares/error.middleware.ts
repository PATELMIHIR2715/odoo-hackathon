import type { ErrorRequestHandler } from "express";
import { env } from "../config/env.js";
import { errorResponseStandard } from "../lib/response.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (env.NODE_ENV !== "production") {
    console.error("Unhandled backend error:", err);
  }
  return errorResponseStandard(err, res, 500);
};
