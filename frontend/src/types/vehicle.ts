import type { ApiResponse } from "@/types/api"

export type VehicleType = "VAN" | "TRUCK" | "MINI" | "CAR" | "BUS" | "SUV" | "PICKUP" | "OTHER"

export type VehicleStatus = "AVAILABLE" | "ON_TRIP" | "IN_SHOP" | "RETIRED"

export interface Vehicle {
  id: string
  registrationNumber: string
  name: string
  type: VehicleType
  status: VehicleStatus
  maxLoadCapacityKg: number
  odometerKm: number
  acquisitionCost: number
  region: string
  createdAt: string
  updatedAt: string
}

export interface CreateVehiclePayload {
  registrationNumber: string
  name: string
  type: VehicleType
  maxLoadCapacityKg: number
  odometerKm: number
  acquisitionCost: number
  region: string
}

export interface UpdateVehiclePayload {
  registrationNumber?: string
  name?: string
  type?: VehicleType
  status?: VehicleStatus
  maxLoadCapacityKg?: number
  odometerKm?: number
  acquisitionCost?: number
  region?: string
}

export type VehicleListResponse = ApiResponse<Vehicle[]>
export type VehicleResponse = ApiResponse<Vehicle>
