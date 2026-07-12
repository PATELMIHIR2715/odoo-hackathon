import type { ApiResponse, PaginatedListData } from "@/types/api"

export type TripStatus = "DRAFT" | "DISPATCHED" | "COMPLETED" | "CANCELLED"

export interface TripVehicle {
  id: string
  registrationNumber: string
  name: string
  vehicleCode?: string
  manufacturer?: string
  model?: string
}

export interface TripDriver {
  id: string
  name: string
  licenseNumber: string
  status?: string
}

export interface Trip {
  id: string
  source: string
  destination: string
  vehicleId: string
  driverId: string
  cargoWeightKg: number
  plannedDistance: number
  actualDistance: number | null
  fuelConsumedL: number | null
  fuelCost: number | null
  status: TripStatus
  dispatchedAt: string | null
  completedAt: string | null
  cancelledAt: string | null
  createdAt: string
  updatedAt: string
  vehicle: TripVehicle
  driver: TripDriver
}

export interface CreateTripPayload {
  source: string
  destination: string
  vehicleId: string
  driverId: string
  cargoWeightKg: number
  plannedDistance: number
}

export interface CompleteTripPayload {
  actualDistance: number
  fuelConsumedL?: number
  fuelCost?: number
}

export type TripListResponse = ApiResponse<PaginatedListData<Trip>>
export type TripResponse = ApiResponse<Trip>
