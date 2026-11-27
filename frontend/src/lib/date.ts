/** Date helpers shared by the admin dashboard. */

/**
 * The studio's timezone. Appointment times come from the API already formatted
 * in this zone, so timestamps like `createdAt` are formatted here too — not in
 * the visitor's browser zone.
 */
export const STUDIO_TIMEZONE =
  process.env.NEXT_PUBLIC_STUDIO_TIMEZONE?.trim() || "Africa/Lagos";

/** "2026-10-28" built from local time (never UTC, so the day never shifts). */
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

/** Offset in days from today, still as a local date key. */
export function dayKey(offset: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return toDateKey(date);
}

/** Local Date from "YYYY-MM-DD" (no UTC parsing). */
export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

const weekdayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthShort = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const monthLong = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "Tue, 28 Oct" */
export function formatDate(key: string): string {
  const date = parseDateKey(key);
  return `${weekdayShort[date.getDay()]}, ${date.getDate()} ${monthShort[date.getMonth()]}`;
}

/** "Tuesday 28 October 2026" */
export function formatDateLong(key: string): string {
  const date = parseDateKey(key);
  return `${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.getDay()]} ${date.getDate()} ${monthLong[date.getMonth()]} ${date.getFullYear()}`;
}

/** "2026-10" */
export function monthKey(key: string): string {
  return key.slice(0, 7);
}

/** "October 2026" from "2026-10" */
export function formatMonth(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return `${monthLong[month - 1]} ${year}`;
}

/** "28 Oct" from "2026-10-28" */
export function formatDayShort(key: string): string {
  const date = parseDateKey(key);
  return `${date.getDate()} ${monthShort[date.getMonth()]}`;
}

export function isToday(key: string): boolean {
  return key === todayKey();
}

export function isUpcoming(key: string): boolean {
  return key >= todayKey();
}

export function daysAgo(key: string): number {
  const then = parseDateKey(key).getTime();
  const today = parseDateKey(todayKey()).getTime();
  return Math.round((today - then) / 86_400_000);
}

/** "5 days ago" / "Today" / "in 3 days" */
export function relativeDay(key: string): string {
  const diff = daysAgo(key);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff > 1) return `${diff} days ago`;
  if (diff === -1) return "Tomorrow";
  return `In ${Math.abs(diff)} days`;
}

/** "14:00" -> "2:00 PM" */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour}:${`${minutes}`.padStart(2, "0")} ${suffix}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function plural(count: number, singular: string, pluralForm?: string): string {
  return count === 1 ? singular : (pluralForm ?? `${singular}s`);
}

/** "2026-11-25" for an ISO instant, as seen in a specific timezone. */
export function instantDateKey(iso: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));

  const read = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${read("year")}-${read("month")}-${read("day")}`;
}

/** "25 Nov" for an ISO instant in a specific timezone. */
export function formatInstantDay(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

/** "2:00 PM" for an ISO instant in a specific timezone. */
export function formatInstantTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(new Date(iso))
    .toUpperCase();
}

/** "morning" / "afternoon" / "evening" for the dashboard greeting. */
export function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
