"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchOverviewAnalytics } from "@/lib/api/analytics";
import { STALE_TIME } from "@/lib/query-config";
import type { AnalyticsBasis, AnalyticsRange } from "@/types/analytics";

export const analyticsKeys = {
  all: ["analytics"] as const,
  overview: (range: AnalyticsRange, basis: AnalyticsBasis) =>
    [...analyticsKeys.all, "overview", range, basis] as const,
};

export function useOverviewAnalytics(
  range: AnalyticsRange,
  basis: AnalyticsBasis
) {
  return useQuery({
    queryKey: analyticsKeys.overview(range, basis),
    queryFn: () => fetchOverviewAnalytics(range, basis),
    staleTime: STALE_TIME.analytics,
    // Keep the current chart on screen while a different filter loads.
    placeholderData: (previous) => previous,
  });
}
