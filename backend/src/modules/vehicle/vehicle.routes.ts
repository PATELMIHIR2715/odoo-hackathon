import { Router } from "express";
import { Role } from "@prisma/client";
import { allowModules, allowRoles } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { APP_MODULES } from "../../constants/modules.js";
import {
  createVehicle,
  getVehicle,
  getVehicleTotalCost,
  listAvailableVehicles,
  listVehicles,
  retireVehicle,
  updateVehicle,
} from "./vehicle.controller.js";

export const vehiclesRouter = Router();

vehiclesRouter.use(allowModules(APP_MODULES.FLEET));

vehiclesRouter.get(
  "/",
  allowRoles(Role.ADMIN, Role.FLEET_MANAGER, Role.FINANCIAL_ANALYST),
  asyncHandler(listVehicles),
);

vehiclesRouter.get(
  "/available",
  allowRoles(Role.ADMIN, Role.FLEET_MANAGER, Role.FINANCIAL_ANALYST),
  asyncHandler(listAvailableVehicles),
);

vehiclesRouter.get(
  "/:id",
  allowRoles(Role.ADMIN, Role.FLEET_MANAGER, Role.FINANCIAL_ANALYST),
  asyncHandler(getVehicle),
);

vehiclesRouter.post(
  "/",
  allowRoles(Role.ADMIN, Role.FLEET_MANAGER),
  asyncHandler(createVehicle),
);

vehiclesRouter.patch(
  "/:id",
  allowRoles(Role.ADMIN, Role.FLEET_MANAGER),
  asyncHandler(updateVehicle),
);

vehiclesRouter.delete(
  "/:id",
  allowRoles(Role.ADMIN, Role.FLEET_MANAGER),
  asyncHandler(retireVehicle),
);

vehiclesRouter.get(
  "/:id/total-cost",
  allowRoles(
    Role.ADMIN,
    Role.FLEET_MANAGER,
    Role.FINANCIAL_ANALYST,
    Role.DRIVER,
    Role.SAFETY_OFFICER,
  ),
  asyncHandler(getVehicleTotalCost),
);
