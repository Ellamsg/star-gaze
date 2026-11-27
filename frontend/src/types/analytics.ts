import type { AppointmentApiStatus } from "./appointment";

/** How far back the summary looks, always ending today. */
export const analyticsRanges = ["today", "7d", "30d", "month", "12m"] as const;
export type AnalyticsRange = (typeof analyticsRanges)[number];

export const analyticsBases = ["booked", "scheduled"] as const;
/**
 * "booked" = when the booking was made (createdAt).
 * "scheduled" = when the appointment happens (startAt).
 */
export type AnalyticsBasis = (typeof analyticsBases)[number];

export type AnalyticsBucket = {
  key: string;
  /** "08:00", "25 Nov" or "Nov". */
  label: string;
  /** "08" or "25" for a compact axis. */
  shortLabel: string;
  value: number;
};

export type UpcomingAppointmentDTO = {
  id: string;
  startAt: string;
  createdAt: string;
  status: AppointmentApiStatus;
  price: number;
  clientName: string;
  serviceName: string;
  staffName: string | null;
};

/** Response of GET /api/analytics/overview — all totals are computed server-side. */
export type OverviewAnalyticsDTO = {
  range: AnalyticsRange;
  basis: AnalyticsBasis;
  timezone: string;
  generatedAt: string;
  window: { start: string; end: string; label: string };
  totals: {
    /** Non-cancelled bookings in the window. */
    bookings: number;
    /** Money from confirmed + completed bookings. */
    paid: number;
    paidBookings: number;
    pending: { count: number; amount: number };
    completed: number;
    cancelled: number;
    noShow: number;
  };
  newClients: number;
  series: AnalyticsBucket[];
  bestBucket: AnalyticsBucket;
  chart: { granularity: "hour" | "day" | "month"; caption: string };
  upcoming: UpcomingAppointmentDTO[];
};
