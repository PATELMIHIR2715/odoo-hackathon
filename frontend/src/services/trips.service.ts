import {
  cancelTripRequest,
  completeTripRequest,
  createTripRequest,
  dispatchTripRequest,
  getTripsRequest,
} from "@/api/trips.api"
import type {
  CreateTripPayload,
  CompleteTripPayload,
  TripListResponse,
  TripResponse,
} from "@/types/trip"

export async function getTripsService(params?: {
  page?: number
  pageSize?: number
}): Promise<TripListResponse> {
  return getTripsRequest(params)
}

export async function createTripService(payload: CreateTripPayload): Promise<TripResponse> {
  return createTripRequest(payload)
}

export async function dispatchTripService(id: string): Promise<TripResponse> {
  return dispatchTripRequest(id)
}

export async function completeTripService(
  id: string,
  payload: CompleteTripPayload
): Promise<TripResponse> {
  return completeTripRequest(id, payload)
}

export async function cancelTripService(id: string): Promise<TripResponse> {
  return cancelTripRequest(id)
}
