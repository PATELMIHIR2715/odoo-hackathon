const ACCESS_TOKEN_KEY = "auth.accessToken"
const REFRESH_TOKEN_KEY = "auth.refreshToken"
const USER_KEY = "auth.user"

function readStorage<T>(key: string): T | null {
  if (typeof window === "undefined") {
    return null
  }

  const value = window.localStorage.getItem(key)
  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function writeStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

function removeStorage(key: string): void {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(key)
}

export function getAccessToken(): string | null {
  return readStorage<string>(ACCESS_TOKEN_KEY)
}

export function setAccessToken(token: string): void {
  writeStorage(ACCESS_TOKEN_KEY, token)
}

export function removeAccessToken(): void {
  removeStorage(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return readStorage<string>(REFRESH_TOKEN_KEY)
}

export function setRefreshToken(token: string): void {
  writeStorage(REFRESH_TOKEN_KEY, token)
}

export function removeRefreshToken(): void {
  removeStorage(REFRESH_TOKEN_KEY)
}

export function getUser<T>(): T | null {
  return readStorage<T>(USER_KEY)
}

export function setUser<T>(user: T): void {
  writeStorage(USER_KEY, user)
}

export function removeUser(): void {
  removeStorage(USER_KEY)
}

export function clearAuth(): void {
  removeAccessToken()
}
