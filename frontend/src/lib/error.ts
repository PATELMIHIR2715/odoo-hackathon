import axios from "axios"

import type { ApiErrorResponse, ApiValidationErrorResponse } from "@/types/api"

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse | ApiValidationErrorResponse>(error)) {
    const payload = error.response?.data as
      | (ApiErrorResponse | ApiValidationErrorResponse)
      | undefined

    if (payload && "message" in payload && typeof payload.message === "string") {
      return payload.message
    }

    if (payload && typeof payload.error === "string") {
      return payload.error
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === "string") {
      return message
    }
  }

  return "Something went wrong. Please try again."
}
