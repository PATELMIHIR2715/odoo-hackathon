import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/client";
import type { Response } from "express";
import { ZodError } from "zod";
import { env } from "../config/env.js";
import {
  ALREADY_EXISTS,
  DATABASE_ERROR,
  DUPLICATE_RECORD,
  FORBIDDEN,
  INTERNAL_SERVER_ERROR,
  INVALID_DATABASE_DATA,
  INVALID_FIELD,
  INVALID_REFERENCE,
  INVALID_REFRESH_TOKEN,
  RECORD_NOT_FOUND,
  SUCCESS,
  UNAUTHORIZED,
  VALIDATION_ERROR,
} from "../constants/messages.js";
import { ApiError } from "../utils/ApiError.js";

export const successResponse = (
  res: Response,
  data: any,
  messageOrStatusCode: string | number = SUCCESS,
  statusCode: number = 200,
) => {
  const message =
    typeof messageOrStatusCode === "number" ? SUCCESS : messageOrStatusCode;
  const responseStatusCode =
    typeof messageOrStatusCode === "number" ? messageOrStatusCode : statusCode;

  return res.status(responseStatusCode).json({
    success: true,
    message,
    data,
  });
};

const mappedStatusCodes: Record<string, number> = {
  [ALREADY_EXISTS]: 409,
  [DUPLICATE_RECORD]: 409,
  [INVALID_REFRESH_TOKEN]: 401,
  [UNAUTHORIZED]: 401,
  [FORBIDDEN]: 403,
  [RECORD_NOT_FOUND]: 404,
  [INVALID_REFERENCE]: 400,
  [INVALID_FIELD]: 400,
};

export const errorResponseStandard = (
  error: unknown,
  res: Response,
  statusCode = 400,
) => {
  if (error instanceof ZodError && error.issues.length > 0) {
    return res.status(400).json({
      success: false,
      error: VALIDATION_ERROR,
      field: error.issues[0]?.path,
      message: error.issues[0]?.message,
    });
  }

  if (error instanceof PrismaClientKnownRequestError) {
    const prismaMessages: Record<string, string> = {
      P2002: ALREADY_EXISTS,
      P2025: RECORD_NOT_FOUND,
      P2003: INVALID_REFERENCE,
      P2022: INVALID_FIELD,
    };

    const prismaStatusCodes: Record<string, number> = {
      P2002: 409,
      P2025: 404,
      P2003: 400,
      P2022: 400,
    };

    return res.status(prismaStatusCodes[error.code] ?? statusCode).json({
      success: false,
      error: prismaMessages[error.code] || DATABASE_ERROR,
      code: error.code,
      ...(env.NODE_ENV !== "production" ? { meta: error.meta } : {}),
    });
  }

  if (error instanceof PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      error: INVALID_DATABASE_DATA,
      ...(env.NODE_ENV !== "production"
        ? { message: error.message }
        : {}),
    });
  }

  if (error instanceof ApiError) {
    const responseStatus = mappedStatusCodes[error.code] ?? error.status;
    const responseMessage =
      responseStatus >= 500 && env.NODE_ENV === "production"
        ? INTERNAL_SERVER_ERROR
        : error.message;

    return res.status(responseStatus).json({
      success: false,
      error: responseMessage,
      code: error.code,
    });
  }

  const message = (error as Error)?.message ?? INTERNAL_SERVER_ERROR;
  const responseStatus = mappedStatusCodes[message] ?? statusCode;
  const responseMessage =
    responseStatus >= 500 && env.NODE_ENV === "production"
      ? INTERNAL_SERVER_ERROR
      : message;

  return res.status(responseStatus).json({
    success: false,
    error: responseMessage,
    ...(responseStatus >= 500 && env.NODE_ENV !== "production"
      ? { code: "UNHANDLED_ERROR" }
      : {}),
  });
};
