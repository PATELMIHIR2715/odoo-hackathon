import { z } from "zod";
export const registerSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.email(),
  password: z.string().min(8).max(128),
});
export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
export const refreshSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});
export const forgotPasswordSchema = z.object({ email: z.email() });
export const resetPasswordSchema = z.object({
  token: z.string().min(32),
  newPassword: z.string().min(8).max(128),
});
export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(120),
});
