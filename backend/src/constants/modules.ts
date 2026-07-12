import { Role } from '@prisma/client';

export const APP_MODULES = {
  DASHBOARD: 'dashboard',
  FLEET: 'fleet',
  DRIVERS: 'drivers',
  TRIPS: 'trips',
  MAINTENANCE: 'maintenance',
  FUEL_EXPENSES: 'fuel_expenses',
  ANALYTICS: 'analytics',
  SETTINGS: 'settings',
} as const;

export const APP_MODULE_LIST = Object.values(APP_MODULES) as readonly AppModule[];

export type AppModule = (typeof APP_MODULES)[keyof typeof APP_MODULES];

export const ALL_APP_MODULES: AppModule[] = [...APP_MODULE_LIST];

export const ROLE_DEFAULT_MODULES: Record<Role, AppModule[]> = {
  [Role.ADMIN]: ALL_APP_MODULES,
  [Role.FLEET_MANAGER]: [
    APP_MODULES.DASHBOARD,
    APP_MODULES.FLEET,
    APP_MODULES.DRIVERS,
    APP_MODULES.MAINTENANCE,
    APP_MODULES.ANALYTICS,
  ],
  [Role.DRIVER]: [APP_MODULES.DASHBOARD, APP_MODULES.TRIPS],
  [Role.SAFETY_OFFICER]: [APP_MODULES.DASHBOARD, APP_MODULES.DRIVERS, APP_MODULES.TRIPS],
  [Role.FINANCIAL_ANALYST]: [
    APP_MODULES.DASHBOARD,
    APP_MODULES.FLEET,
    APP_MODULES.FUEL_EXPENSES,
    APP_MODULES.ANALYTICS,
  ],
};

export function defaultModulesForRole(role: Role) {
  return ROLE_DEFAULT_MODULES[role];
}
