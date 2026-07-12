import {
  createDriverRequest,
  deleteDriverRequest,
  getDriverByIdRequest,
  getDriversRequest,
  updateDriverRequest,
} from "@/api/drivers.api"
import type {
  CreateDriverPayload,
  UpdateDriverPayload,
  DriverListResponse,
  DriverResponse,
} from "@/types/driver"

export async function getDriversService(params?: {
  search?: string
  page?: number
  pageSize?: number
}): Promise<DriverListResponse> {
  return getDriversRequest(params)
}

export async function getDriverByIdService(id: string): Promise<DriverResponse> {
  return getDriverByIdRequest(id)
}

export async function createDriverService(payload: CreateDriverPayload): Promise<DriverResponse> {
  return createDriverRequest(payload)
}

export async function updateDriverService(
  id: string,
  payload: UpdateDriverPayload
): Promise<DriverResponse> {
  return updateDriverRequest(id, payload)
}

export async function deleteDriverService(id: string): Promise<DriverResponse> {
  return deleteDriverRequest(id)
}
