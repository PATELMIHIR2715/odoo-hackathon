import { Router } from "express";
import * as controller from "./auth.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {
  authPublicLimiter,
  authSensitiveLimiter,
} from "../../middlewares/rateLimiter.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  authPublicLimiter,
  asyncHandler(controller.register),
);
authRouter.post("/login", authPublicLimiter, asyncHandler(controller.login));
authRouter.post(
  "/refresh",
  authSensitiveLimiter,
  asyncHandler(controller.refresh),
);
authRouter.post(
  "/forgot-password",
  authSensitiveLimiter,
  asyncHandler(controller.forgotPassword),
);
authRouter.post(
  "/reset-password",
  authSensitiveLimiter,
  asyncHandler(controller.resetPassword),
);
authRouter.post("/logout", authenticate, asyncHandler(controller.logout));
authRouter.get("/me", authenticate, asyncHandler(controller.me));
authRouter.patch("/me", authenticate, asyncHandler(controller.updateProfile));
authRouter.post(
  "/change-password",
  authenticate,
  asyncHandler(controller.changePassword),
);
