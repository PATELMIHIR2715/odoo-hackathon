import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { Role } from "@prisma/client";

export type TokenPayload = {
  sub: string;
  role: Role;
  type: "access" | "refresh";
};
const refreshSecret = env.JWT_REFRESH_SECRET ?? env.JWT_SECRET;
export const signAccessToken = (sub: string, role: Role) =>
  jwt.sign({ sub, role, type: "access" }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
export const signRefreshToken = (sub: string, role: Role) =>
  jwt.sign({ sub, role, type: "refresh" }, refreshSecret, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.JWT_SECRET) as TokenPayload;
export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, refreshSecret) as TokenPayload;
