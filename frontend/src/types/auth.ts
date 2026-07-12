import type { ApiResponse } from "@/types/api"

export interface AuthUser {
  id: string
  fullName: string
  email: string
  role: string
  moduleAccess: string[]
  createdAt: string
  updatedAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponseData extends AuthTokens {
  user: AuthUser
}

export type CurrentUserResponseData = AuthUser

export type LoginResponse = ApiResponse<LoginResponseData>
export type CurrentUserResponse = ApiResponse<CurrentUserResponseData>
