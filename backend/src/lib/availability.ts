/**
 * Availability engine.
 *
 * The studio timetable is the source of truth: a default week plus a handful
 * of per-day exceptions. We never pre-create rows for every date — instead we
 * calculate the open start times for a date on demand:
 *
 *   1. take the default (or the day's override) opening hours
 *   2. step through it every N minutes
 *   3. drop anything that overlaps a block or a live appointment
 *
 * Appointments are the only source of "booked". Cancelling one frees its time
 * automatically because CANCELLED is excluded from every overlap check.
 */

import { prisma } from "./prisma";
import {
  addDaysToKey,
  daysInMonthKey,
  minutesFromTime,
  studioTodayKey,
  timeFromMinutes,
  weekdayOfKey,
  zonedDateKey,
  zonedDateTime,
  zonedTimeKey,
} from "./timezone";

/* ------------------------------- settings ------------------------------- */

export type ScheduleSettings = {
  openTime: string;
  closeTime: string;
  stepMinutes: number;
  openWeekdays: number[];
  horizonDays: number;
};

export const DEFAULT_SCHEDULE: ScheduleSettings = {
  openTime: "09:00",
  closeTime: "19:00",
  stepMinutes: 30,
  openWeekdays: [0, 1, 2, 3, 4, 5, 6],
  horizonDays: 180,
};

export async function getSchedule(): Promise<ScheduleSettings> {
  const row = await prisma.studioSchedule.findUnique({
    where: { id: "default" },
  });

  if (!row) return { ...DEFAULT_SCHEDULE };

  return {
    openTime: row.openTime,
    closeTime: row.closeTime,
    stepMinutes: row.stepMinutes,
    openWeekdays: [...row.openWeekdays].sort((a, b) => a - b),
    horizonDays: row.horizonDays,
  };
}

export async function saveSchedule(
  settings: ScheduleSettings
): Promise<ScheduleSettings> {
  const row = await prisma.studioSchedule.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      ...settings,
    },
    update: settings,
  });

  return {
    openTime: row.openTime,
    closeTime: row.closeTime,
    stepMinutes: row.stepMinutes,
    openWeekdays: [...row.openWeekdays].sort((a, b) => a - b),
    horizonDays: row.horizonDays,
  };
}

/* ------------------------------- day shape ------------------------------- */

export type BlockDTO = {
  id: string;
  startTime: string;
  endTime: string;
  note: string | null;
};

export type OverrideDTO = {
  isClosed: boolean;
  openTime: string | null;
  closeTime: string | null;
  stepMinutes: number | null;
  note: string | null;
};

export type OpenTimeDTO = {
  time: string;
  endTime: string;
  startAt: string;
  endAt: string;
  past: boolean;
};

export type BookedDTO = {
  id: string;
  reference: string;
  status: string;
  startAt: string;
  endAt: string;
  time: string;
  endTime: string;
  price: number;
  clientName: string;
  serviceNames: string;
};

export type DayReason = "open" | "closed" | "weekday" | "past" | "beyond";

export type DayState = {
  date: string;
  isOpen: boolean;
  reason: DayReason;
  source: "default" | "override";
  openTime: string;
  closeTime: string;
  stepMinutes: number;
  override: OverrideDTO | null;
  blocks: BlockDTO[];
  note: string | null;
};

type AppointmentWindow = {
  startAt: Date;
  endAt: Date;
};

const ACTIVE_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "NO_SHOW",
] as const;

/** Start times earlier than now + 30 minutes are not bookable. */
export const BOOKING_LEAD_MINUTES = 30;

function overlaps(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return aStart.getTime() < bEnd.getTime() && aEnd.getTime() > bStart.getTime();
}

function shiftKey(dateKey: string, days: number): string {
  return addDaysToKey(dateKey, days);
}

/**
 * Effective opening hours for a date. Overrides win; otherwise the weekday
 * must be in the default open list.
 */
export async function getDayState(
  dateKey: string,
  settings?: ScheduleSettings,
  options: { allowPast?: boolean; allowBeyond?: boolean } = {}
): Promise<DayState> {
  const schedule = settings ?? (await getSchedule());
  const today = studioTodayKey();
  const horizonEnd = shiftKey(today, schedule.horizonDays);

  const [overrideRow, blockRows] = await Promise.all([
    prisma.dayOverride.findUnique({ where: { date: dateKey } }),
    prisma.scheduleBlock.findMany({
      where: { date: dateKey },
      orderBy: { startTime: "asc" },
    }),
  ]);

  const blocks: BlockDTO[] = blockRows.map((block) => ({
    id: block.id,
    startTime: block.startTime,
    endTime: block.endTime,
    note: block.note,
  }));

  const override: OverrideDTO | null = overrideRow
    ? {
        isClosed: overrideRow.isClosed,
        openTime: overrideRow.openTime,
        closeTime: overrideRow.closeTime,
        stepMinutes: overrideRow.stepMinutes,
        note: overrideRow.note,
      }
    : null;

  const base: DayState = {
    date: dateKey,
    isOpen: false,
    reason: "closed",
    source: override ? "override" : "default",
    openTime: override?.openTime ?? schedule.openTime,
    closeTime: override?.closeTime ?? schedule.closeTime,
    stepMinutes: override?.stepMinutes ?? schedule.stepMinutes,
    override,
    blocks,
    note: override?.note ?? null,
  };

  if (!options.allowPast && dateKey < today) {
    return { ...base, reason: "past" };
  }

  if (!options.allowBeyond && dateKey > horizonEnd) {
    return { ...base, reason: "beyond" };
  }

  if (override?.isClosed) {
    return { ...base, reason: "closed" };
  }

  // A custom-hours override opens the day even if the weekday is normally off.
  const customHours = Boolean(override?.openTime || override?.closeTime);
  if (!customHours && !schedule.openWeekdays.includes(weekdayOfKey(dateKey))) {
    return { ...base, reason: "weekday" };
  }

  if (
    minutesFromTime(base.openTime) >= minutesFromTime(base.closeTime) ||
    base.stepMinutes < 5
  ) {
    return { ...base, reason: "closed" };
  }

  return { ...base, isOpen: true, reason: "open" };
}

/* ---------------------------- time generation ---------------------------- */

export type GenerateOptions = {
  durationMin: number;
  now?: Date;
  /** Admin can see past start times; the public page cannot. */
  includePast?: boolean;
  appointments?: AppointmentWindow[];
};

export function buildOpenTimes(
  state: DayState,
  options: GenerateOptions
): OpenTimeDTO[] {
  if (!state.isOpen) return [];

  const duration = Math.max(5, Math.min(600, options.durationMin || 30));
  const open = minutesFromTime(state.openTime);
  const close = minutesFromTime(state.closeTime);
  const step = Math.max(5, state.stepMinutes);
  const now = options.now ?? new Date();
  const earliest = now.getTime() + BOOKING_LEAD_MINUTES * 60_000;
  const appointments = options.appointments ?? [];

  const times: OpenTimeDTO[] = [];

  for (let minute = open; minute + duration <= close; minute += step) {
    const time = timeFromMinutes(minute);
    const endTime = timeFromMinutes(minute + duration);
    const startAt = zonedDateTime(state.date, time);
    const endAt = new Date(startAt.getTime() + duration * 60_000);

    const past = startAt.getTime() < earliest;
    if (past && !options.includePast) continue;

    const blocked = state.blocks.some(
      (block) =>
        minute < minutesFromTime(block.endTime) &&
        minute + duration > minutesFromTime(block.startTime)
    );
    if (blocked) continue;

    const taken = appointments.some((appointment) =>
      overlaps(startAt, endAt, appointment.startAt, appointment.endAt)
    );
    if (taken) continue;

    times.push({
      time,
      endTime,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      past,
    });
  }

  return times;
}

/** Live (non-cancelled) appointments that touch a studio-local calendar day. */
export async function appointmentsForDay(dateKey: string) {
  const start = zonedDateTime(dateKey, "00:00");
  const end = zonedDateTime(shiftKey(dateKey, 1), "00:00");

  return prisma.appointment.findMany({
    where: {
      status: { in: [...ACTIVE_STATUSES] },
      startAt: { lt: end },
      endAt: { gt: start },
    },
    orderBy: { startAt: "asc" },
    include: {
      client: { select: { firstName: true, lastName: true } },
      items: { include: { service: { select: { name: true } } } },
    },
  });
}

export function toBookedDTO(
  appointment: Awaited<ReturnType<typeof appointmentsForDay>>[number]
): BookedDTO {
  const startAt = appointment.startAt;
  const endAt = appointment.endAt;

  return {
    id: appointment.id,
    reference: appointment.reference,
    status: appointment.status,
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
    time: zonedTimeKey(startAt),
    endTime: zonedTimeKey(endAt),
    price: Number(appointment.price),
    clientName: [appointment.client.firstName, appointment.client.lastName]
      .filter(Boolean)
      .join(" "),
    serviceNames: appointment.items
      .map((item) => item.service.name)
      .join(", "),
  };
}

/* ------------------------------ public month ----------------------------- */

export type MonthDayDTO = {
  date: string;
  status: "open" | "full" | "closed" | "past";
  availableCount: number;
  bookedCount: number;
  isClosed: boolean;
};

export type MonthDTO = {
  month: string;
  days: MonthDayDTO[];
  settings: ScheduleSettings;
};

/**
 * Month grid for the public calendar. One query for overrides, blocks and
 * appointments covers the whole month, then each day is calculated in memory.
 */
export async function getMonthState(
  monthKey: string,
  options: { durationMin?: number; admin?: boolean } = {}
): Promise<MonthDTO> {
  const settings = await getSchedule();
  const duration = Math.max(5, Math.min(600, options.durationMin ?? 30));
  const today = studioTodayKey();
  const horizonEnd = shiftKey(today, settings.horizonDays);
  const totalDays = daysInMonthKey(monthKey);
  const first = `${monthKey}-01`;
  const last = `${monthKey}-${String(totalDays).padStart(2, "0")}`;

  const rangeStart = zonedDateTime(first, "00:00");
  const rangeEnd = zonedDateTime(shiftKey(last, 1), "00:00");

  const [overrideRows, blockRows, appointmentRows] = await Promise.all([
    prisma.dayOverride.findMany({
      where: { date: { gte: first, lte: last } },
    }),
    prisma.scheduleBlock.findMany({
      where: { date: { gte: first, lte: last } },
      orderBy: { startTime: "asc" },
    }),
    prisma.appointment.findMany({
      where: {
        status: { in: [...ACTIVE_STATUSES] },
        startAt: { lt: rangeEnd },
        endAt: { gt: rangeStart },
      },
      select: { startAt: true, endAt: true },
    }),
  ]);

  const overrides = new Map(overrideRows.map((row) => [row.date, row]));
  const blocks = new Map<string, BlockDTO[]>();
  for (const row of blockRows) {
    const list = blocks.get(row.date) ?? [];
    list.push({
      id: row.id,
      startTime: row.startTime,
      endTime: row.endTime,
      note: row.note,
    });
    blocks.set(row.date, list);
  }

  const days: MonthDayDTO[] = [];

  for (let day = 1; day <= totalDays; day += 1) {
    const dateKey = `${monthKey}-${String(day).padStart(2, "0")}`;
    const overrideRow = overrides.get(dateKey) ?? null;
    const override: OverrideDTO | null = overrideRow
      ? {
          isClosed: overrideRow.isClosed,
          openTime: overrideRow.openTime,
          closeTime: overrideRow.closeTime,
          stepMinutes: overrideRow.stepMinutes,
          note: overrideRow.note,
        }
      : null;

    const dayAppointments = appointmentRows.filter(
      (appointment) =>
        zonedDateKey(appointment.startAt) === dateKey ||
        zonedDateKey(new Date(appointment.endAt.getTime() - 1)) === dateKey
    );

    const dayState = deriveDayState({
      dateKey,
      settings,
      today,
      horizonEnd,
      override,
      blocks: blocks.get(dateKey) ?? [],
      allowPast: options.admin,
      allowBeyond: options.admin,
    });

    const times = buildOpenTimes(dayState, {
      durationMin: duration,
      appointments: dayAppointments,
      includePast: options.admin,
    });

    const status: MonthDayDTO["status"] =
      !options.admin && dateKey < today
        ? "past"
        : !options.admin && dateKey > horizonEnd
          ? "closed"
          : !dayState.isOpen
            ? "closed"
            : times.length > 0
              ? "open"
              : "full";

    days.push({
      date: dateKey,
      status,
      availableCount: times.length,
      bookedCount: dayAppointments.length,
      isClosed: !dayState.isOpen,
    });
  }

  return { month: monthKey, days, settings };
}

/* ------------------------------- pure helper ----------------------------- */

export function deriveDayState(input: {
  dateKey: string;
  settings: ScheduleSettings;
  today: string;
  horizonEnd: string;
  override: OverrideDTO | null;
  blocks: BlockDTO[];
  allowPast?: boolean;
  allowBeyond?: boolean;
}): DayState {
  const {
    dateKey,
    settings,
    today,
    horizonEnd,
    override,
    blocks,
    allowPast,
    allowBeyond,
  } = input;

  const base: DayState = {
    date: dateKey,
    isOpen: false,
    reason: "closed",
    source: override ? "override" : "default",
    openTime: override?.openTime ?? settings.openTime,
    closeTime: override?.closeTime ?? settings.closeTime,
    stepMinutes: override?.stepMinutes ?? settings.stepMinutes,
    override,
    blocks,
    note: override?.note ?? null,
  };

  if (!allowPast && dateKey < today) return { ...base, reason: "past" };
  if (!allowBeyond && dateKey > horizonEnd) return { ...base, reason: "beyond" };
  if (override?.isClosed) return { ...base, reason: "closed" };

  const customHours = Boolean(override?.openTime || override?.closeTime);
  if (!customHours && !settings.openWeekdays.includes(weekdayOfKey(dateKey))) {
    return { ...base, reason: "weekday" };
  }

  if (
    minutesFromTime(base.openTime) >= minutesFromTime(base.closeTime) ||
    base.stepMinutes < 5
  ) {
    return { ...base, reason: "closed" };
  }

  return { ...base, isOpen: true, reason: "open" };
}

/* ---------------------------- admin month/day ---------------------------- */

export async function getAdminDay(dateKey: string) {
  const settings = await getSchedule();
  const state = await getDayState(dateKey, settings, {
    allowPast: true,
    allowBeyond: true,
  });
  const appointments = await appointmentsForDay(dateKey);

  const times = buildOpenTimes(state, {
    durationMin: state.stepMinutes || 30,
    appointments,
    includePast: true,
  });

  return {
    ...state,
    times,
    booked: appointments.map(toBookedDTO),
  };
}
