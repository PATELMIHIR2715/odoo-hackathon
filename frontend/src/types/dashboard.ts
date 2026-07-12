import type { ApiResponse } from "@/types/api"
import type { Trip, TripStatus } from "@/types/trip"
import type { VehicleStatus, VehicleType } from "@/types/vehicle"

export interface DashboardKpis {
  activeVehicles: number
  availableVehicles: number
  inMaintenanceVehicles: number
  activeTrips: number
  pendingTrips: number
  driversOnDuty: number
  fleetUtilizationPercent: number
}

export interface DashboardOverview {
  kpis: DashboardKpis
  recentTrips: Trip[]
  vehicleStatusBreakdown: Array<{
    status: VehicleStatus
    count: number
  }>
  tripStatusBreakdown: Array<{
    status: TripStatus
    count: number
  }>
  driverStatusBreakdown: Array<{
    status: string
    count: number
  }>
  filters: {
    vehicleType: VehicleType | null
    status: VehicleStatus | null
    region: string | null
  }
}

export type DashboardOverviewResponse = ApiResponse<DashboardOverview>
