"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchOverviewAnalytics } from "@/lib/api/analytics";
import { STALE_TIME } from "@/lib/query-config";
import type { AnalyticsRange } from "@/types/analytics";

export const analyticsKeys = {
  all: ["analytics"] as const,
  overview: (range: AnalyticsRange) =>
    [...analyticsKeys.all, "overview", range] as const,
};

export function useOverviewAnalytics(range: AnalyticsRange) {
  return useQuery({
    queryKey: analyticsKeys.overview(range),
    queryFn: () => fetchOverviewAnalytics(range),
    staleTime: STALE_TIME.analytics,
    // Keep the current chart on screen while a different range loads.
    placeholderData: (previous) => previous,
  });
}
