import {
  getOrganizationSettingsRequest,
  getSettingsRbacRequest,
  updateOrganizationSettingsRequest,
  updateSettingsRbacRequest,
} from "@/api/settings.api"
import type {
  OrganizationSettingsResponse,
  SettingsRbacResponse,
  UpdateOrganizationSettingsPayload,
  UpdateOrganizationSettingsResponse,
  UpdateRbacPayload,
  UpdateRbacResponse,
} from "@/types/settings"

export async function getOrganizationSettingsService(): Promise<OrganizationSettingsResponse> {
  return getOrganizationSettingsRequest()
}

export async function updateOrganizationSettingsService(
  payload: UpdateOrganizationSettingsPayload
): Promise<UpdateOrganizationSettingsResponse> {
  return updateOrganizationSettingsRequest(payload)
}

export async function getSettingsRbacService(): Promise<SettingsRbacResponse> {
  return getSettingsRbacRequest()
}

export async function updateSettingsRbacService(
  profileId: string,
  payload: UpdateRbacPayload
): Promise<UpdateRbacResponse> {
  return updateSettingsRbacRequest(profileId, payload)
}
