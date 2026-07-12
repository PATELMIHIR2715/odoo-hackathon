import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { Role } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import {
  ALL_APP_MODULES,
  defaultModulesForRole,
  type AppModule,
} from "../../constants/modules.js";
import { ApiError } from "../../utils/ApiError.js";
import { ERROR_MESSAGES } from "../../constants/messages.js";

const profileSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  moduleAccess: true,
  createdAt: true,
  updatedAt: true,
} as const;

function normalizeModuleAccess(role: Role, moduleAccess?: AppModule[]) {
  return moduleAccess?.length ? moduleAccess : defaultModulesForRole(role);
}

export const settingsService = {
  async listRbac() {
    const profiles = await prisma.profile.findMany({
      select: profileSelect,
      orderBy: { createdAt: "desc" },
    });

    return {
      availableModules: ALL_APP_MODULES,
      roleDefaults: {
        [Role.ADMIN]: ALL_APP_MODULES,
        [Role.FLEET_MANAGER]: defaultModulesForRole(Role.FLEET_MANAGER),
        [Role.DRIVER]: defaultModulesForRole(Role.DRIVER),
        [Role.SAFETY_OFFICER]: defaultModulesForRole(Role.SAFETY_OFFICER),
        [Role.FINANCIAL_ANALYST]: defaultModulesForRole(Role.FINANCIAL_ANALYST),
      },
      profiles: profiles.map((profile) => ({
        ...profile,
        moduleAccess: normalizeModuleAccess(
          profile.role,
          profile.moduleAccess as AppModule[],
        ),
      })),
    };
  },

  async updateRbac(
    profileId: string,
    payload: { role?: Role; moduleAccess?: AppModule[] },
  ) {
    try {
      const existing = await prisma.profile.findUnique({
        where: { id: profileId },
        select: { id: true, role: true },
      });

      if (!existing) {
        throw new ApiError(404, "USER_NOT_FOUND", ERROR_MESSAGES.USER_NOT_FOUND);
      }

      const nextRole = payload.role ?? existing.role;
      const nextModuleAccess = normalizeModuleAccess(
        nextRole,
        payload.moduleAccess,
      );

      const profile = await prisma.profile.update({
        where: { id: profileId },
        data: {
          ...(payload.role ? { role: payload.role } : {}),
          moduleAccess: nextModuleAccess,
        },
        select: profileSelect,
      });

      return {
        ...profile,
        moduleAccess: normalizeModuleAccess(
          profile.role,
          profile.moduleAccess as AppModule[],
        ),
      };
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ApiError(
          409,
          "DUPLICATE_RECORD",
          ERROR_MESSAGES.DUPLICATE_RECORD,
        );
      }

      throw error;
    }
  },
};
