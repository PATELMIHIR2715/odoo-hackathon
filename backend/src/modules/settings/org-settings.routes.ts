import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate, allowRoles } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  getOrgSettings,
  updateOrgSettings,
} from "./org-settings.controller.js";

export const orgSettingsRouter = Router();

orgSettingsRouter.get(
  "/org",
  authenticate,
  allowRoles(Role.ADMIN),
  asyncHandler(getOrgSettings),
);
orgSettingsRouter.patch(
  "/org",
  authenticate,
  allowRoles(Role.ADMIN),
  asyncHandler(updateOrgSettings),
);
