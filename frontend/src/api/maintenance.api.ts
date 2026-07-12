import api from "@/api/axios"
import type {
  CreateMaintenancePayload,
  MaintenanceListResponse,
  MaintenanceResponse,
} from "@/types/maintenance"

export async function getMaintenancesRequest(params?: {
  page?: number
  pageSize?: number
}): Promise<MaintenanceListResponse> {
  const response = await api.get<MaintenanceListResponse>("/maintenance", { params })
  return response.data
}

export async function createMaintenanceRequest(
  payload: CreateMaintenancePayload
): Promise<MaintenanceResponse> {
  const response = await api.post<MaintenanceResponse>("/maintenance", payload)
  return response.data
}

export async function closeMaintenanceRequest(id: string): Promise<MaintenanceResponse> {
  const response = await api.patch<MaintenanceResponse>(`/maintenance/${id}/close`)
  return response.data
}
