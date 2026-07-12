import {
  createExpenseRequest,
  createFuelLogRequest,
  getExpensesRequest,
  getFuelLogsRequest,
} from "@/api/finance.api"
import type {
  CreateExpensePayload,
  CreateFuelLogPayload,
  ExpenseListResponse,
  ExpenseResponse,
  FuelLogListResponse,
  FuelLogResponse,
} from "@/types/finance"

export async function getFuelLogsService(params?: {
  page?: number
  pageSize?: number
}): Promise<FuelLogListResponse> {
  return getFuelLogsRequest(params)
}

export async function createFuelLogService(
  payload: CreateFuelLogPayload
): Promise<FuelLogResponse> {
  return createFuelLogRequest(payload)
}

export async function getExpensesService(params?: {
  page?: number
  pageSize?: number
}): Promise<ExpenseListResponse> {
  return getExpensesRequest(params)
}

export async function createExpenseService(payload: CreateExpensePayload): Promise<ExpenseResponse> {
  return createExpenseRequest(payload)
}
