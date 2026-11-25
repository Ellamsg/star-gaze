/**
 * How long cached data stays "fresh".
 *
 * While fresh, navigating between admin pages reuses the cache and does not
 * hit the API again. Once stale, TanStack Query keeps showing the cached data
 * and refetches in the background.
 */
export const STALE_TIME = {
  /** Dashboard totals change when a booking is confirmed, completed or created. */
  analytics: 30_000,
  /** Services rarely change and are edited from one place. */
  services: 5 * 60_000,
  /** Appointments change when a booking is confirmed, cancelled or completed. */
  appointments: 30_000,
  /** Clients change when their appointments change or a note is saved. */
  clients: 60_000,
  /** Admin slot changes are usually made in this same session. */
  availability: 30_000,
  /** Public booking must see newly booked slots reasonably quickly. */
  openSlots: 15_000,
} as const;
