import type { ApiResponse, PaginatedListData } from "@/types/api"

export type DriverStatus = "AVAILABLE" | "ON_TRIP" | "SUSPENDED" | "OFF_DUTY"

export interface Driver {
  id: string
  name: string
  licenseNumber: string
  licenseCategory: string
  licenseExpiryDate: string
  contactNumber: string
  safetyScore: number
  status: DriverStatus
  createdAt: string
  updatedAt: string
}

export interface CreateDriverPayload {
  name: string
  licenseNumber: string
  licenseCategory: string
  licenseExpiryDate: string
  contactNumber: string
  safetyScore: number
  status: DriverStatus
}

export interface UpdateDriverPayload {
  name?: string
  licenseNumber?: string
  licenseCategory?: string
  licenseExpiryDate?: string
  contactNumber?: string
  safetyScore?: number
  status?: DriverStatus
}

export type DriverListResponse = ApiResponse<PaginatedListData<Driver>>
export type DriverResponse = ApiResponse<Driver>
