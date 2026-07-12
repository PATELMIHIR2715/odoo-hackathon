import api from "@/api/axios"
import type { DashboardOverviewResponse } from "@/types/dashboard"
import type { VehicleStatus, VehicleType } from "@/types/vehicle"

export async function getDashboardOverviewRequest(params?: {
  vehicleType?: VehicleType | ""
  status?: VehicleStatus | ""
  region?: string
  recentTripsLimit?: number
}): Promise<DashboardOverviewResponse> {
  const normalizedParams = {
    ...(params?.vehicleType ? { vehicleType: params.vehicleType } : {}),
    ...(params?.status ? { status: params.status } : {}),
    ...(params?.region ? { region: params.region } : {}),
    ...(params?.recentTripsLimit ? { recentTripsLimit: params.recentTripsLimit } : {}),
  }

  const response = await api.get<DashboardOverviewResponse>("/dashboard/overview", {
    params: normalizedParams,
  })

  return response.data
}
