import axios, { type InternalAxiosRequestConfig } from "axios"

import { API_BASE_URL, REQUEST_TIMEOUT } from "@/constants/api"
import { getAccessToken } from "@/lib/storage"

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const accessToken = getAccessToken()

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

export default api
