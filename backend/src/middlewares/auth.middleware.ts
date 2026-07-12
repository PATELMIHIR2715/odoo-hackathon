import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { verifyAccessToken } from "../lib/jwt.js";
import { ApiError } from "../utils/ApiError.js";
import { prisma } from "../config/prisma.js";
import { defaultModulesForRole, type AppModule } from "../constants/modules.js";

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token)
    return next(new ApiError(401, "UNAUTHORIZED", "Access token is required"));
  try {
    const payload = verifyAccessToken(token);
    if (payload.type !== "access")
      throw new ApiError(401, "UNAUTHORIZED", "Invalid access token");

    prisma.profile
      .findUnique({
        where: { id: payload.sub },
        select: { id: true, role: true, moduleAccess: true },
      })
      .then((profile) => {
        if (!profile)
          throw new ApiError(
            401,
            "UNAUTHORIZED",
            "Access token is invalid or expired",
          );
        const moduleAccess = Array.isArray(profile.moduleAccess)
          ? profile.moduleAccess
          : [];
        req.user = {
          id: profile.id,
          role: profile.role,
          moduleAccess: moduleAccess.length
            ? (moduleAccess as AppModule[])
            : defaultModulesForRole(profile.role),
        };
        next();
      })
      .catch((error) =>
        next(
          error instanceof ApiError
            ? error
            : new ApiError(
                401,
                "UNAUTHORIZED",
                "Access token is invalid or expired",
              ),
        ),
      );
  } catch {
    next(
      new ApiError(401, "UNAUTHORIZED", "Access token is invalid or expired"),
    );
  }
}

export const allowRoles =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) =>
    !req.user
      ? next(new ApiError(401, "UNAUTHORIZED", "Authentication is required"))
      : roles.includes(req.user.role)
        ? next()
        : next(
            new ApiError(
              403,
              "FORBIDDEN",
              "You do not have permission for this action",
            ),
          );

export const allowModules =
  (...modules: AppModule[]) =>
  (req: Request, _res: Response, next: NextFunction) =>
    !req.user
      ? next(new ApiError(401, "UNAUTHORIZED", "Authentication is required"))
      : req.user.role === "ADMIN" ||
          modules.some((module) => req.user!.moduleAccess.includes(module))
        ? next()
        : next(
            new ApiError(
              403,
              "FORBIDDEN",
              "You do not have access to this module",
            ),
          );
