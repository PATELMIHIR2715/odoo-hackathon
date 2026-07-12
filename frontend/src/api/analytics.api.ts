import api from "@/api/axios"
import type { AnalyticsOverviewResponse } from "@/types/analytics"

export async function getAnalyticsOverviewRequest(): Promise<AnalyticsOverviewResponse> {
  const response = await api.get<AnalyticsOverviewResponse>("/analytics/overview")
  return response.data
}
