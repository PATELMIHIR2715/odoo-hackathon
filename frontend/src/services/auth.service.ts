import { getCurrentUserRequest, loginRequest, logoutRequest } from "@/api/auth.api"
import type { LoginCredentials, LoginResponse } from "@/types/auth"

export async function loginService(credentials: LoginCredentials): Promise<LoginResponse> {
  return loginRequest(credentials)
}

export async function getCurrentUserService(): Promise<LoginResponse> {
  return getCurrentUserRequest()
}

export async function logoutService(): Promise<void> {
  try {
    await logoutRequest()
  } catch {
    // Ignore backend errors for now since logout is not the main flow.
  }
}
