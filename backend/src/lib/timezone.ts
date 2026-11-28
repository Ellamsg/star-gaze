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

/**
 * The UTC instant when the clock in `timeZone` reads 00:00 on `dateKey`.
 * The same correction loop powers `zonedDateTime` below.
 */
export function zonedStartOfDay(
  dateKey: string,
  timeZone = STUDIO_TIMEZONE
): Date {
  return zonedDateTime(dateKey, "00:00", timeZone);
}

/**
 * The UTC instant when the clock in `timeZone` reads `time` on `dateKey`.
 * "2026-12-01" + "09:30" in Africa/Lagos -> 2026-12-01T08:30:00Z.
 */
export function zonedDateTime(
  dateKey: string,
  time: string,
  timeZone = STUDIO_TIMEZONE
): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  const target = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);
  let guess = new Date(target);

  // Shift the guess by how far its wall clock is from the requested wall clock.
  // Comparing against the target (not against the guess itself) is what stops
  // the loop from subtracting the zone offset again on every pass.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = zonedParts(guess, timeZone);
    const wallClock = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    );
    const drift = wallClock - target;
    if (drift === 0) break;
    guess = new Date(guess.getTime() - drift);
  }

  return guess;
}

/** "09:30" — the studio-local clock time of a UTC instant. */
export function zonedTimeKey(
  date: Date,
  timeZone = STUDIO_TIMEZONE
): string {
  const parts = zonedParts(date, timeZone);
  return `${pad2(parts.hour)}:${pad2(parts.minute)}`;
}

/** Today's calendar date in the studio timezone. */
export function studioTodayKey(timeZone = STUDIO_TIMEZONE): string {
  return zonedDateKey(new Date(), timeZone);
}

/** Minutes since midnight for "09:30" -> 570. */
export function minutesFromTime(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/** 570 -> "09:30". */
export function timeFromMinutes(total: number): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${pad2(hours)}:${pad2(minutes)}`;
}

/** Weekday of a calendar key: 0 = Sunday … 6 = Saturday. */
export function weekdayOfKey(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** First day ("YYYY-MM-01") of the month containing `dateKey`. */
export function monthStartKey(dateKey: string): string {
  return `${dateKey.slice(0, 7)}-01`;
}

/** Number of days in the given "YYYY-MM" month. */
export function daysInMonthKey(monthKey: string): number {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
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
