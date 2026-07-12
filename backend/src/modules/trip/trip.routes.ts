import { Router } from "express";
import { Role } from "@prisma/client";
import { allowModules, allowRoles } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { APP_MODULES } from "../../constants/modules.js";
import {
  cancelTrip,
  completeTrip,
  createTrip,
  dispatchTrip,
  getTrip,
  getTripBoard,
  listTrips,
} from "./trip.controller.js";

export const tripsRouter = Router();

tripsRouter.use(allowModules(APP_MODULES.TRIPS));

tripsRouter.get(
  "/board",
  allowRoles(Role.ADMIN, Role.DRIVER, Role.SAFETY_OFFICER),
  asyncHandler(getTripBoard),
);

tripsRouter.get(
  "/",
  allowRoles(Role.ADMIN, Role.DRIVER, Role.SAFETY_OFFICER),
  asyncHandler(listTrips),
);

tripsRouter.get(
  "/:id",
  allowRoles(Role.ADMIN, Role.DRIVER, Role.SAFETY_OFFICER),
  asyncHandler(getTrip),
);

tripsRouter.post(
  "/",
  allowRoles(Role.ADMIN, Role.DRIVER),
  asyncHandler(createTrip),
);

tripsRouter.patch(
  "/:id/dispatch",
  allowRoles(Role.ADMIN, Role.DRIVER),
  asyncHandler(dispatchTrip),
);

tripsRouter.patch(
  "/:id/complete",
  allowRoles(Role.ADMIN, Role.DRIVER),
  asyncHandler(completeTrip),
);

tripsRouter.patch(
  "/:id/cancel",
  allowRoles(Role.ADMIN, Role.DRIVER),
  asyncHandler(cancelTrip),
);
