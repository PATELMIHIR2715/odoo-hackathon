import type { ModuleName } from "@/constants/modules"
import type { ApiResponse } from "@/types/api"

export type AppRole =
  | "ADMIN"
  | "FLEET_MANAGER"
  | "DRIVER"
  | "SAFETY_OFFICER"
  | "FINANCIAL_ANALYST"

export interface OrganizationSettings {
  id: number
  orgName: string
  depotName: string
  currency: string
  distanceUnit: string
  timezone: string
  contactEmail: string | null
  contactPhone: string | null
  address: string | null
  createdAt: string
  updatedAt: string
}

export interface SettingsProfile {
  id: string
  fullName: string
  email: string
  role: AppRole
  moduleAccess: ModuleName[]
  createdAt: string
  updatedAt: string
}

export interface SettingsRbacData {
  availableModules: ModuleName[]
  roleDefaults: Record<AppRole, ModuleName[]>
  profiles: SettingsProfile[]
}

export interface UpdateOrganizationSettingsPayload {
  orgName?: string
  depotName?: string
  currency?: string
  distanceUnit?: string
  timezone?: string
  contactEmail?: string | null
  contactPhone?: string | null
  address?: string | null
}

export interface UpdateRbacPayload {
  role?: AppRole
  moduleAccess?: ModuleName[]
}

export type OrganizationSettingsResponse = ApiResponse<OrganizationSettings>
export type SettingsRbacResponse = ApiResponse<SettingsRbacData>
export type UpdateOrganizationSettingsResponse = ApiResponse<OrganizationSettings>
export type UpdateRbacResponse = ApiResponse<SettingsProfile>
