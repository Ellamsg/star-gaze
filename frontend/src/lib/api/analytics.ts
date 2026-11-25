import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type {
  AnalyticsRange,
  OverviewAnalyticsDTO,
} from "@/types/analytics";

/** GET /api/analytics/overview — the backend does every calculation. */
export async function fetchOverviewAnalytics(
  range: AnalyticsRange
): Promise<OverviewAnalyticsDTO> {
  const response = await apiClient.get<ApiResponse<OverviewAnalyticsDTO>>(
    "/api/analytics/overview",
    { params: { range } }
  );
  return response.data.data;
}
