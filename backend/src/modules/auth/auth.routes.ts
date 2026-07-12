import { Router } from "express";
import * as controller from "./auth.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const authRouter = Router();

authRouter.post("/register", asyncHandler(controller.register));
authRouter.post("/login", asyncHandler(controller.login));
authRouter.post("/refresh", asyncHandler(controller.refresh));
authRouter.post("/forgot-password", asyncHandler(controller.forgotPassword));
authRouter.post("/reset-password", asyncHandler(controller.resetPassword));
authRouter.post("/logout", authenticate, asyncHandler(controller.logout));
authRouter.get("/me", authenticate, asyncHandler(controller.me));
authRouter.patch("/me", authenticate, asyncHandler(controller.updateProfile));
authRouter.post(
  "/change-password",
  authenticate,
  asyncHandler(controller.changePassword),
);
