import type { RequestHandler } from "express";
import { authService } from "./auth.service.js";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "./auth.validation.js";
import { successResponse } from "../../lib/response.js";
import { ApiError } from "../../utils/ApiError.js";
import { ERROR_MESSAGES } from "../../constants/messages.js";

export const register: RequestHandler = async (req, res) =>
  successResponse(
    res,
    await authService.register(registerSchema.parse(req.body)),
    201,
  );
export const login: RequestHandler = async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  return successResponse(res, await authService.login(email, password));
};
export const refresh: RequestHandler = async (req, res) => {
  const { refreshToken } = refreshSchema.parse(req.body);
  const token = refreshToken ?? req.cookies?.refreshToken;
  if (!token)
    throw new ApiError(401, "UNAUTHORIZED", ERROR_MESSAGES.REFRESH_TOKEN_REQUIRED);
  return successResponse(res, await authService.refresh(token));
};
export const logout: RequestHandler = async (req, res) => {
  await authService.logout(req.user!.id);
  return successResponse(res, null);
};
export const me: RequestHandler = async (req, res) =>
  successResponse(res, await authService.me(req.user!.id));
export const updateProfile: RequestHandler = async (req, res) => {
  const { fullName } = updateProfileSchema.parse(req.body);
  return successResponse(
    res,
    await authService.updateProfile(req.user!.id, fullName),
  );
};
export const changePassword: RequestHandler = async (req, res) => {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
  await authService.changePassword(req.user!.id, currentPassword, newPassword);
  return successResponse(res, null);
};
export const forgotPassword: RequestHandler = async (req, res) => {
  const { email } = forgotPasswordSchema.parse(req.body);
  const resetToken = await authService.requestPasswordReset(email);
  return successResponse(
    res,
    {
      message:
        "If an account exists, password-reset instructions have been issued.",
      ...(resetToken ? { resetToken } : {}),
    },
    202,
  );
};
export const resetPassword: RequestHandler = async (req, res) => {
  const { token, newPassword } = resetPasswordSchema.parse(req.body);
  await authService.resetPassword(token, newPassword);
  return successResponse(res, null);
};
