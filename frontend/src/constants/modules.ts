export const MODULES = {
  DASHBOARD: "dashboard",
  VEHICLES: "fleet",
  DRIVERS: "drivers",
  TRIPS: "trips",
  MAINTENANCE: "maintenance",
  FUEL_AND_EXPENSES: "fuel_expenses",
  ANALYTICS: "analytics",
  SETTINGS: "settings",
} as const

export type ModuleName = (typeof MODULES)[keyof typeof MODULES]
