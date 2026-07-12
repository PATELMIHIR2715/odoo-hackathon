import {
  createVehicleRequest,
  deleteVehicleRequest,
  getVehicleByIdRequest,
  getVehiclesRequest,
  updateVehicleRequest,
} from "@/api/vehicles.api"
import type {
  CreateVehiclePayload,
  UpdateVehiclePayload,
  VehicleListResponse,
  VehicleResponse,
} from "@/types/vehicle"

export async function getVehiclesService(params?: {
  type?: string
  status?: string
  search?: string
}): Promise<VehicleListResponse> {
  return getVehiclesRequest(params)
}

export async function getVehicleByIdService(id: string): Promise<VehicleResponse> {
  return getVehicleByIdRequest(id)
}

export async function createVehicleService(payload: CreateVehiclePayload): Promise<VehicleResponse> {
  return createVehicleRequest(payload)
}

export async function updateVehicleService(
  id: string,
  payload: UpdateVehiclePayload
): Promise<VehicleResponse> {
  return updateVehicleRequest(id, payload)
}

export async function deleteVehicleService(id: string): Promise<VehicleResponse> {
  return deleteVehicleRequest(id)
}
