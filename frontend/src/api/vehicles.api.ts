import api from "@/api/axios"
import type {
  CreateVehiclePayload,
  UpdateVehiclePayload,
  VehicleListResponse,
  VehicleResponse,
} from "@/types/vehicle"

export async function getVehiclesRequest(params?: {
  type?: string
  status?: string
  search?: string
}): Promise<VehicleListResponse> {
  const response = await api.get<VehicleListResponse>("/vehicles", { params })
  return response.data
}

export async function getVehicleByIdRequest(id: string): Promise<VehicleResponse> {
  const response = await api.get<VehicleResponse>(`/vehicles/${id}`)
  return response.data
}

export async function createVehicleRequest(payload: CreateVehiclePayload): Promise<VehicleResponse> {
  const response = await api.post<VehicleResponse>("/vehicles", payload)
  return response.data
}

export async function updateVehicleRequest(
  id: string,
  payload: UpdateVehiclePayload
): Promise<VehicleResponse> {
  const response = await api.patch<VehicleResponse>(`/vehicles/${id}`, payload)
  return response.data
}

export async function deleteVehicleRequest(id: string): Promise<VehicleResponse> {
  const response = await api.delete<VehicleResponse>(`/vehicles/${id}`)
  return response.data
}
