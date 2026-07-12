import api from "@/api/axios"
import type {
  CreateTripPayload,
  CompleteTripPayload,
  TripListResponse,
  TripResponse,
} from "@/types/trip"

export async function getTripsRequest(params?: {
  page?: number
  pageSize?: number
}): Promise<TripListResponse> {
  const response = await api.get<TripListResponse>("/trips", { params })
  return response.data
}

export async function createTripRequest(payload: CreateTripPayload): Promise<TripResponse> {
  const response = await api.post<TripResponse>("/trips", payload)
  return response.data
}

export async function dispatchTripRequest(id: string): Promise<TripResponse> {
  const response = await api.patch<TripResponse>(`/trips/${id}/dispatch`)
  return response.data
}

export async function completeTripRequest(
  id: string,
  payload: CompleteTripPayload
): Promise<TripResponse> {
  const response = await api.patch<TripResponse>(`/trips/${id}/complete`, payload)
  return response.data
}

export async function cancelTripRequest(id: string): Promise<TripResponse> {
  const response = await api.patch<TripResponse>(`/trips/${id}/cancel`)
  return response.data
}
