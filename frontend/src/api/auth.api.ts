import api from "@/api/axios"
import type { LoginCredentials, LoginResponse } from "@/types/auth"

export async function loginRequest(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>("/auth/login", credentials)
  return response.data
}

export async function getCurrentUserRequest(): Promise<LoginResponse> {
  const response = await api.get<LoginResponse>("/auth/me")
  return response.data
}

export async function logoutRequest(): Promise<void> {
  await api.post("/auth/logout")
}
