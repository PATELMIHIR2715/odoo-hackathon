import {
  closeMaintenanceRequest,
  createMaintenanceRequest,
  getMaintenancesRequest,
} from "@/api/maintenance.api"
import type {
  CreateMaintenancePayload,
  MaintenanceListResponse,
  MaintenanceResponse,
} from "@/types/maintenance"

export async function getMaintenancesService(params?: {
  page?: number
  pageSize?: number
}): Promise<MaintenanceListResponse> {
  return getMaintenancesRequest(params)
}

export async function createMaintenanceService(
  payload: CreateMaintenancePayload
): Promise<MaintenanceResponse> {
  return createMaintenanceRequest(payload)
}

export async function closeMaintenanceService(id: string): Promise<MaintenanceResponse> {
  return closeMaintenanceRequest(id)
}
