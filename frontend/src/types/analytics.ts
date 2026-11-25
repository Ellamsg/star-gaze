import type { AppointmentApiStatus } from "./appointment";

/** The ranges the overview chart can show. */
export const analyticsRanges = ["7d", "6w", "12m"] as const;
export type AnalyticsRange = (typeof analyticsRanges)[number];

export type AnalyticsBucket = {
  /** "2026-11-25" for days, "2026-11" for months, a week's first day for weeks. */
  key: string;
  /** "25 Nov" or "Nov". */
  label: string;
  /** "25" for the compact 7-day axis. */
  shortLabel: string;
  value: number;
};

export type UpcomingAppointmentDTO = {
  id: string;
  startAt: string;
  status: AppointmentApiStatus;
  price: number;
  clientName: string;
  serviceName: string;
  staffName: string | null;
};

/** Response of GET /api/analytics/overview — all totals are computed server-side. */
export type OverviewAnalyticsDTO = {
  range: AnalyticsRange;
  timezone: string;
  generatedAt: string;
  today: {
    date: string;
    bookings: number;
    revenue: number;
    paidBookings: number;
  };
  awaiting: { count: number; amount: number };
  newClientsThisMonth: number;
  rangeTotals: {
    revenue: number;
    paidBookings: number;
    completed: number;
    confirmed: number;
  };
  revenueSeries: AnalyticsBucket[];
  bestBucket: AnalyticsBucket;
  thisMonth: { completed: number; cancelled: number };
  upcoming: UpcomingAppointmentDTO[];
};
