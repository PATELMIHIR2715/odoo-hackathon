import api from "@/api/axios"
import type {
  CreateFuelLogPayload,
  CreateExpensePayload,
  FuelLogListResponse,
  FuelLogResponse,
  ExpenseListResponse,
  ExpenseResponse,
} from "@/types/finance"

export async function getFuelLogsRequest(params?: {
  page?: number
  pageSize?: number
}): Promise<FuelLogListResponse> {
  const response = await api.get<FuelLogListResponse>("/finance/fuel-logs", { params })
  return response.data
}

export async function createFuelLogRequest(payload: CreateFuelLogPayload): Promise<FuelLogResponse> {
  const response = await api.post<FuelLogResponse>("/finance/fuel-logs", payload)
  return response.data
}

export async function getExpensesRequest(params?: {
  page?: number
  pageSize?: number
}): Promise<ExpenseListResponse> {
  const response = await api.get<ExpenseListResponse>("/finance/expenses", { params })
  return response.data
}

export async function createExpenseRequest(payload: CreateExpensePayload): Promise<ExpenseResponse> {
  const response = await api.post<ExpenseResponse>("/finance/expenses", payload)
  return response.data
}
