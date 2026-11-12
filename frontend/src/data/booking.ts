/**
 * Booking content. Services come from the same menu the landing page shows so
 * prices never drift — swap these for fetch calls from `backend/` when the
 * flow goes live.
 */

import { menu, type MenuCategory, type MenuItem } from "./site";

export type { MenuCategory, MenuItem };

export type BookingDay = {
  id: string;
  weekday: string;
  day: string;
  month: string;
};

export type TimeSlot = {
  time: string;
  available: boolean;
};

export const bookingCategories: MenuCategory[] = menu.map(
  (group) => group.category,
);

export const bookingServices: MenuItem[] = menu.flatMap(
  (group) => group.items,
);

export const bookingDays: BookingDay[] = [
  { id: "d1", weekday: "Mon", day: "26", month: "Oct" },
  { id: "d2", weekday: "Tue", day: "27", month: "Oct" },
  { id: "d3", weekday: "Wed", day: "28", month: "Oct" },
  { id: "d4", weekday: "Thu", day: "29", month: "Oct" },
  { id: "d5", weekday: "Fri", day: "30", month: "Oct" },
  { id: "d6", weekday: "Sat", day: "31", month: "Oct" },
  { id: "d7", weekday: "Sun", day: "1", month: "Nov" },
  { id: "d8", weekday: "Mon", day: "2", month: "Nov" },
  { id: "d9", weekday: "Tue", day: "3", month: "Nov" },
  { id: "d10", weekday: "Wed", day: "4", month: "Nov" },
  { id: "d11", weekday: "Thu", day: "5", month: "Nov" },
  { id: "d12", weekday: "Fri", day: "6", month: "Nov" },
  { id: "d13", weekday: "Sat", day: "7", month: "Nov" },
  { id: "d14", weekday: "Sun", day: "8", month: "Nov" },
];

const slotTimes = [
  "09:00",
  "09:45",
  "10:30",
  "11:15",
  "12:00",
  "13:30",
  "14:15",
  "15:00",
  "15:45",
  "16:30",
  "17:15",
  "18:00",
];

/**
 * Time slots keyed by day id. Availability is generated from a fixed pattern
 * so the "already taken" times are stable between renders and reloads.
 */
export const bookingSlots: Record<string, TimeSlot[]> = Object.fromEntries(
  bookingDays.map((day, dayIndex): [string, TimeSlot[]] => [
    day.id,
    slotTimes.map((time, slotIndex) => ({
      time,
      available: (dayIndex * 5 + slotIndex * 3) % 7 > 1,
    })),
  ]),
);
