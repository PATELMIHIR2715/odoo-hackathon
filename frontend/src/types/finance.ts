import type { ApiResponse, PaginatedListData } from "@/types/api"

export type ExpenseType = "TOLL" | "MAINTENANCE" | "OTHER"

export interface FuelLogVehicle {
  id: string
  registrationNumber: string
  name: string
  type: string
  status: string
}

export interface FuelLog {
  id: string
  vehicleId: string
  liters: number
  cost: number
  date: string
  vehicle: FuelLogVehicle
}

export interface ExpenseVehicle {
  id: string
  registrationNumber: string
  name: string
  type: string
  status: string
}

export interface Expense {
  id: string
  vehicleId: string
  type: ExpenseType
  amount: number
  note: string
  date: string
  vehicle: ExpenseVehicle
}

export interface CreateFuelLogPayload {
  vehicleId: string
  liters: number
  cost: number
  date: string
}

export interface CreateExpensePayload {
  vehicleId: string
  type: ExpenseType
  amount: number
  note: string
  date: string
}

export type FuelLogListResponse = ApiResponse<PaginatedListData<FuelLog>>
export type FuelLogResponse = ApiResponse<FuelLog>

export type ExpenseListResponse = ApiResponse<PaginatedListData<Expense>>
export type ExpenseResponse = ApiResponse<Expense>
