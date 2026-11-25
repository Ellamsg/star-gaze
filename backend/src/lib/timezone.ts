/**
 * Studio-local time helpers.
 *
 * Every timestamp in the database is UTC. Analytics like "today", "this week"
 * and "this month" only make sense in the studio's own timezone, so we convert
 * UTC instants -> studio calendar dates here on the server. The browser never
 * does this math.
 */

export const STUDIO_TIMEZONE =
  process.env.STUDIO_TIMEZONE?.trim() || "Africa/Lagos";

const pad2 = (value: number): string => String(value).padStart(2, "0");

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const partsFormatters = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = partsFormatters.get(timeZone);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  partsFormatters.set(timeZone, formatter);
  return formatter;
}

export function zonedParts(
  date: Date,
  timeZone = STUDIO_TIMEZONE
): ZonedParts {
  const parts = partsFormatter(timeZone).formatToParts(date);
  const read = (type: string): number =>
    Number(parts.find((part) => part.type === type)?.value ?? NaN);

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
    minute: read("minute"),
    second: read("second"),
  };
}

export function dateKeyFromParts(
  year: number,
  month: number,
  day: number
): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** "2026-11-25" — the calendar date an instant falls on in the studio zone. */
export function zonedDateKey(date: Date, timeZone = STUDIO_TIMEZONE): string {
  const { year, month, day } = zonedParts(date, timeZone);
  return dateKeyFromParts(year, month, day);
}

/** The UTC instant when the clock in `timeZone` reads 00:00 on `dateKey`. */
export function zonedStartOfDay(
  dateKey: string,
  timeZone = STUDIO_TIMEZONE
): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  let guess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

  // Two passes are enough for normal zones (including DST changes); the third
  // is a cheap safety net.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = zonedParts(guess, timeZone);
    const asUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    );
    const drift = asUtc - guess.getTime();
    if (drift === 0) break;
    guess = new Date(guess.getTime() - drift);
  }

  return guess;
}

/** Add whole calendar days to a "YYYY-MM-DD" key (timezone-free arithmetic). */
export function addDaysToKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return dateKeyFromParts(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth() + 1,
    shifted.getUTCDate()
  );
}

/** Add whole months to a key; returns the first day of the resulting month. */
export function addMonthsToKey(dateKey: string, months: number): string {
  const [year, month] = dateKey.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1 + months, 1));
  return dateKeyFromParts(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth() + 1,
    1
  );
}

const dayFormatters = new Map<string, Intl.DateTimeFormat>();
const monthFormatters = new Map<string, Intl.DateTimeFormat>();

/** "19 Nov" from "2026-11-19". */
export function dayLabel(dateKey: string): string {
  let formatter = dayFormatters.get("UTC");
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
    dayFormatters.set("UTC", formatter);
  }

  const [year, month, day] = dateKey.split("-").map(Number);
  return formatter.format(new Date(Date.UTC(year, month - 1, day)));
}

/** "Nov" from "2026-11". */
export function monthLabel(monthKey: string): string {
  let formatter = monthFormatters.get("UTC");
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-GB", {
      month: "short",
      timeZone: "UTC",
    });
    monthFormatters.set("UTC", formatter);
  }

  const [year, month] = monthKey.split("-").map(Number);
  return formatter.format(new Date(Date.UTC(year, month - 1, 1)));
}
