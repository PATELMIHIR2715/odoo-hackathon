import { Router } from "express";
import { Role } from "@prisma/client";
import { allowModules, allowRoles } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { APP_MODULES } from "../../constants/modules.js";
import {
  closeMaintenance,
  createMaintenance,
  listMaintenance,
} from "./maintenance.controller.js";

export const maintenanceRouter = Router();

maintenanceRouter.use(allowModules(APP_MODULES.MAINTENANCE));

maintenanceRouter.get(
  "/",
  allowRoles(Role.ADMIN, Role.FLEET_MANAGER),
  asyncHandler(listMaintenance),
);

maintenanceRouter.post(
  "/",
  allowRoles(Role.ADMIN, Role.FLEET_MANAGER),
  asyncHandler(createMaintenance),
);

maintenanceRouter.patch(
  "/:id/close",
  allowRoles(Role.ADMIN, Role.FLEET_MANAGER),
  asyncHandler(closeMaintenance),
);
