import { create } from "zustand"

import { clearAuth, getAccessToken, setAccessToken } from "@/lib/storage"
import { getCurrentUserService, loginService, logoutService } from "@/services/auth.service"
import type { AuthUser, LoginCredentials } from "@/types/auth"

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  initializeAuth: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (credentials) => {
    set({ isLoading: true })

    try {
      const response = await loginService(credentials)
      if (response.success === false) {
        throw new Error(response.error)
      }

      const { accessToken } = response.data
      setAccessToken(accessToken)

      const userResponse = await getCurrentUserService()
      if (userResponse.success === false) {
        throw new Error(userResponse.error)
      }

      set({
        user: userResponse.data as unknown as AuthUser,
        accessToken,
        refreshToken: null,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (error) {
      clearAuth()
      set({ isLoading: false })
      throw error
    }
  },

  logout: async () => {
    await logoutService()
    clearAuth()
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    })
  },

  initializeAuth: async () => {
    const persistedAccessToken = getAccessToken()

    if (!persistedAccessToken) {
      set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false })
      return
    }

    try {
      const response = await getCurrentUserService()
      if (response.success === false) {
        clearAuth()
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false })
        return
      }

      set({
        user: response.data as unknown as AuthUser,
        accessToken: persistedAccessToken,
        refreshToken: null,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch {
      clearAuth()
      set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false })
    }
  },
}))

export function useAuthUser() {
  return useAuthStore((state) => state.user)
}

export function useIsAuthenticated() {
  return useAuthStore((state) => state.isAuthenticated)
}

export function useIsAuthLoading() {
  return useAuthStore((state) => state.isLoading)
}
