import { z } from "zod";

export const overviewQuery = z.object({
  /** How far back the summary looks, ending today. */
  range: z.enum(["today", "7d", "30d", "month", "12m"]).default("today"),
  /**
   * "booked" filters by when the booking was made (createdAt), "scheduled"
   * filters by when the appointment happens (startAt). Defaulted to booked so
   * a booking made today shows up even if the chair date is next month.
   */
  basis: z.enum(["booked", "scheduled"]).default("booked"),
});

export type OverviewQuery = z.infer<typeof overviewQuery>;
