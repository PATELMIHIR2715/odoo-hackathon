import { MODULES, type ModuleName } from "@/constants/modules"
import type { AuthUser } from "@/types/auth"

export function hasModuleAccess(user: AuthUser | null, moduleName: ModuleName): boolean {
  if (!user?.moduleAccess) {
    return false
  }

  return user.moduleAccess.includes(moduleName)
}

export function hasAnyModuleAccess(user: AuthUser | null, modules: ModuleName[]): boolean {
  return modules.some((module) => hasModuleAccess(user, module))
}

export function hasAllModuleAccess(user: AuthUser | null, modules: ModuleName[]): boolean {
  return modules.every((module) => hasModuleAccess(user, module))
}

export function isDashboardAccessible(user: AuthUser | null): boolean {
  return hasModuleAccess(user, MODULES.DASHBOARD)
}
