import type { ApiResponse } from "@/types/api"

export interface FuelEfficiencyMetric {
  vehicleId: string
  distanceKm: number
  fuelLiters: number
  kmPerLiter: number
}

export interface FleetUtilizationMetric {
  activeVehicles: number
  totalEligibleVehicles: number
  utilizationPercent: number
}

export interface OperationalCostMetric {
  vehicleId: string | null
  fuelCost: number
  maintenanceCost: number
  expensesCost: number
  totalOperationalCost: number
}

export interface MonthlyTrendMetric {
  month: string
  fuelCost: number
  maintenanceCost: number
  expenseCost: number
  totalCost: number
}

export interface TopCostlyVehicle {
  vehicleId: string
  registrationNumber: string
  name: string
  totalCost: number
}

export interface AnalyticsOverviewData {
  fuelEfficiency: FuelEfficiencyMetric[]
  fleetUtilization: FleetUtilizationMetric
  operationalCost: OperationalCostMetric
  vehicleROI: number | null
  totalFuelLiters: number
  monthlyTrend: MonthlyTrendMetric[]
  topCostlyVehicles: TopCostlyVehicle[]
}

export type AnalyticsOverviewResponse = ApiResponse<AnalyticsOverviewData>
