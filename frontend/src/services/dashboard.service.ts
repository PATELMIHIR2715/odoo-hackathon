import { getDashboardOverviewRequest } from "@/api/dashboard.api"
import type { DashboardOverviewResponse } from "@/types/dashboard"
import type { VehicleStatus, VehicleType } from "@/types/vehicle"

export async function getDashboardOverviewService(params?: {
  vehicleType?: VehicleType | ""
  status?: VehicleStatus | ""
  region?: string
  recentTripsLimit?: number
}): Promise<DashboardOverviewResponse> {
  return getDashboardOverviewRequest(params)
}
