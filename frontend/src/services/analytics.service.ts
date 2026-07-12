import { getAnalyticsOverviewRequest } from "@/api/analytics.api"
import type { AnalyticsOverviewResponse } from "@/types/analytics"

export async function getAnalyticsOverviewService(): Promise<AnalyticsOverviewResponse> {
  return getAnalyticsOverviewRequest()
}
