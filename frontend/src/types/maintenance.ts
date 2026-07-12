import type { ApiResponse, PaginatedListData } from "@/types/api"

export type MaintenanceStatus = "OPEN" | "CLOSED"

export interface MaintenanceVehicle {
  id: string
  registrationNumber: string
  name: string
  type: string
  status: string
}

export interface Maintenance {
  id: string
  vehicleId: string
  description: string
  cost: number
  status: MaintenanceStatus
  openedAt: string
  closedAt: string | null
  vehicle: MaintenanceVehicle
}

export interface CreateMaintenancePayload {
  vehicleId: string
  description: string
  cost: number
}

export type MaintenanceListResponse = ApiResponse<PaginatedListData<Maintenance>>
export type MaintenanceResponse = ApiResponse<Maintenance>
