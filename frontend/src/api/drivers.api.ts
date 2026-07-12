import api from "@/api/axios"
import type {
  CreateDriverPayload,
  UpdateDriverPayload,
  DriverListResponse,
  DriverResponse,
} from "@/types/driver"

export async function getDriversRequest(params?: {
  search?: string
  page?: number
  pageSize?: number
}): Promise<DriverListResponse> {
  const response = await api.get<DriverListResponse>("/drivers", { params })
  return response.data
}

export async function getDriverByIdRequest(id: string): Promise<DriverResponse> {
  const response = await api.get<DriverResponse>(`/drivers/${id}`)
  return response.data
}

export async function createDriverRequest(payload: CreateDriverPayload): Promise<DriverResponse> {
  const response = await api.post<DriverResponse>("/drivers", payload)
  return response.data
}

export async function updateDriverRequest(
  id: string,
  payload: UpdateDriverPayload
): Promise<DriverResponse> {
  const response = await api.patch<DriverResponse>(`/drivers/${id}`, payload)
  return response.data
}

export async function deleteDriverRequest(id: string): Promise<DriverResponse> {
  const response = await api.delete<DriverResponse>(`/drivers/${id}`)
  return response.data
}
