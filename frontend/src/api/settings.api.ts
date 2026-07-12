import api from "@/api/axios"
import type {
  OrganizationSettingsResponse,
  SettingsRbacResponse,
  UpdateOrganizationSettingsPayload,
  UpdateOrganizationSettingsResponse,
  UpdateRbacPayload,
  UpdateRbacResponse,
} from "@/types/settings"

export async function getOrganizationSettingsRequest(): Promise<OrganizationSettingsResponse> {
  const response = await api.get<OrganizationSettingsResponse>("/settings/org")
  return response.data
}

export async function updateOrganizationSettingsRequest(
  payload: UpdateOrganizationSettingsPayload
): Promise<UpdateOrganizationSettingsResponse> {
  const response = await api.patch<UpdateOrganizationSettingsResponse>("/settings/org", payload)
  return response.data
}

export async function getSettingsRbacRequest(): Promise<SettingsRbacResponse> {
  const response = await api.get<SettingsRbacResponse>("/settings/rbac")
  return response.data
}

export async function updateSettingsRbacRequest(
  profileId: string,
  payload: UpdateRbacPayload
): Promise<UpdateRbacResponse> {
  const response = await api.patch<UpdateRbacResponse>(`/settings/rbac/${profileId}`, payload)
  return response.data
}
