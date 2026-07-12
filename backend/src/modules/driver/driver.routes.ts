import { Router } from "express";
import { Role } from "@prisma/client";
import { allowModules, allowRoles } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { APP_MODULES } from "../../constants/modules.js";
import {
  createDriver,
  getDriver,
  listAvailableDrivers,
  listDrivers,
  updateDriver,
} from "./driver.controller.js";

export const driversRouter = Router();

driversRouter.use(allowModules(APP_MODULES.DRIVERS));

driversRouter.get(
  "/",
  allowRoles(Role.ADMIN, Role.SAFETY_OFFICER, Role.FLEET_MANAGER),
  asyncHandler(listDrivers),
);

driversRouter.get(
  "/available",
  allowRoles(Role.ADMIN, Role.SAFETY_OFFICER, Role.FLEET_MANAGER),
  asyncHandler(listAvailableDrivers),
);

driversRouter.get(
  "/:id",
  allowRoles(Role.ADMIN, Role.SAFETY_OFFICER, Role.FLEET_MANAGER),
  asyncHandler(getDriver),
);

driversRouter.post(
  "/",
  allowRoles(Role.ADMIN, Role.SAFETY_OFFICER),
  asyncHandler(createDriver),
);

driversRouter.patch(
  "/:id",
  allowRoles(Role.ADMIN, Role.SAFETY_OFFICER),
  asyncHandler(updateDriver),
);
