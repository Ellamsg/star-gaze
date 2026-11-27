import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type {
  AnalyticsBasis,
  AnalyticsRange,
  OverviewAnalyticsDTO,
} from "@/types/analytics";

/** GET /api/analytics/overview — the backend does every calculation. */
export async function fetchOverviewAnalytics(
  range: AnalyticsRange,
  basis: AnalyticsBasis
): Promise<OverviewAnalyticsDTO> {
  const response = await apiClient.get<ApiResponse<OverviewAnalyticsDTO>>(
    "/api/analytics/overview",
    { params: { range, basis } }
  );
  return response.data.data;
}
