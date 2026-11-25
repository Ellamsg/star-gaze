import type { Request, Response } from "express";

import { AppointmentStatus } from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";
import {
  STUDIO_TIMEZONE,
  addDaysToKey,
  addMonthsToKey,
  dayLabel,
  monthLabel,
  zonedDateKey,
  zonedStartOfDay,
} from "../lib/timezone";
import type { OverviewQuery } from "../validators/analytics.schema";

/**
 * The studio has no payments table yet, so "money taken" is derived from the
 * appointment status: a booked slot is revenue once the owner confirms it.
 */
const PAID_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.COMPLETED,
];

type Bucket = {
  key: string;
  label: string;
  shortLabel: string;
  value: number;
};

type SeriesRow = { startAt: Date; price: unknown };

function buildSeries(
  range: OverviewQuery["range"],
  todayKey: string,
  rows: SeriesRow[]
): Bucket[] {
  if (range === "12m") {
    const firstMonth = addMonthsToKey(`${todayKey.slice(0, 7)}-01`, -11);
    const buckets: Bucket[] = [];
    const byMonth = new Map<string, Bucket>();

    for (let index = 0; index < 12; index += 1) {
      const monthKey = addMonthsToKey(firstMonth, index).slice(0, 7);
      const label = monthLabel(monthKey);
      const bucket: Bucket = {
        key: monthKey,
        label,
        shortLabel: label,
        value: 0,
      };
      buckets.push(bucket);
      byMonth.set(monthKey, bucket);
    }

    for (const row of rows) {
      const bucket = byMonth.get(zonedDateKey(row.startAt).slice(0, 7));
      if (bucket) bucket.value += Number(row.price);
    }

    return buckets;
  }

  const days = range === "7d" ? 7 : 42;
  const keys: string[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    keys.push(addDaysToKey(todayKey, -offset));
  }

  const byDay = new Map<string, number>();
  for (const row of rows) {
    const key = zonedDateKey(row.startAt);
    byDay.set(key, (byDay.get(key) ?? 0) + Number(row.price));
  }

  if (range === "7d") {
    return keys.map((key) => ({
      key,
      label: dayLabel(key),
      shortLabel: key.slice(8),
      value: byDay.get(key) ?? 0,
    }));
  }

  // Fold 42 daily totals into 6 weekly buckets, oldest first.
  const weeks: Bucket[] = [];
  for (let index = 0; index < keys.length; index += 7) {
    const weekKeys = keys.slice(index, index + 7);
    const value = weekKeys.reduce(
      (total, key) => total + (byDay.get(key) ?? 0),
      0
    );
    const first = weekKeys[0];
    const label = dayLabel(first);
    weeks.push({ key: first, label, shortLabel: label, value });
  }

  return weeks;
}

/* ------------------- GET /api/analytics/overview (admin) ------------------- */

export async function overview(req: Request, res: Response): Promise<void> {
  const { range } = req.query as unknown as OverviewQuery;

  const now = new Date();
  const todayKey = zonedDateKey(now);
  const todayStart = zonedStartOfDay(todayKey);
  const tomorrowStart = zonedStartOfDay(addDaysToKey(todayKey, 1));

  const currentMonthKey = `${todayKey.slice(0, 7)}-01`;
  const monthStart = zonedStartOfDay(currentMonthKey);
  const monthEnd = zonedStartOfDay(addMonthsToKey(currentMonthKey, 1));

  const rangeStartKey =
    range === "12m"
      ? addMonthsToKey(currentMonthKey, -11)
      : addDaysToKey(todayKey, range === "7d" ? -6 : -41);
  const rangeStart = zonedStartOfDay(rangeStartKey);
  // Every range means "up to and including today", so a booking dated later in
  // the month must not inflate the 12-month total while the week view omits it.
  const rangeEnd = tomorrowStart;

  const [
    todayRows,
    awaiting,
    newClientsThisMonth,
    completedThisMonth,
    cancelledThisMonth,
    seriesRows,
    upcoming,
  ] = await Promise.all([
    prisma.appointment.findMany({
      where: { startAt: { gte: todayStart, lt: tomorrowStart } },
      select: { status: true, price: true },
    }),
    prisma.appointment.aggregate({
      where: { status: AppointmentStatus.PENDING },
      _sum: { price: true },
      _count: { _all: true },
    }),
    prisma.client.count({
      where: { createdAt: { gte: monthStart, lt: monthEnd } },
    }),
    prisma.appointment.count({
      where: {
        status: AppointmentStatus.COMPLETED,
        startAt: { gte: monthStart, lt: monthEnd },
      },
    }),
    prisma.appointment.count({
      where: {
        status: AppointmentStatus.CANCELLED,
        startAt: { gte: monthStart, lt: monthEnd },
      },
    }),
    prisma.appointment.findMany({
      where: {
        status: { in: PAID_STATUSES },
        startAt: { gte: rangeStart, lt: rangeEnd },
      },
      select: { startAt: true, price: true, status: true },
    }),
    prisma.appointment.findMany({
      where: {
        status: {
          in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
        },
        startAt: { gte: now },
      },
      orderBy: { startAt: "asc" },
      take: 4,
      include: {
        client: { select: { firstName: true, lastName: true } },
        service: { select: { name: true } },
        staff: { select: { name: true } },
      },
    }),
  ]);

  const paidToday = todayRows.filter((row) =>
    PAID_STATUSES.includes(row.status)
  );
  const revenueToday = paidToday.reduce(
    (total, row) => total + Number(row.price),
    0
  );
  const bookingsToday = todayRows.filter(
    (row) => row.status !== AppointmentStatus.CANCELLED
  ).length;

  const revenueSeries = buildSeries(range, todayKey, seriesRows);
  const revenue = revenueSeries.reduce(
    (total, bucket) => total + bucket.value,
    0
  );
  const bestBucket = revenueSeries.reduce(
    (best, bucket) => (bucket.value > best.value ? bucket : best),
    revenueSeries[0] ?? { key: "", label: "—", shortLabel: "—", value: 0 }
  );

  res.setHeader("Cache-Control", "private, no-store");
  res.json({
    data: {
      range,
      timezone: STUDIO_TIMEZONE,
      generatedAt: now.toISOString(),
      today: {
        date: todayKey,
        bookings: bookingsToday,
        revenue: revenueToday,
        paidBookings: paidToday.length,
      },
      awaiting: {
        count: awaiting._count._all,
        amount: Number(awaiting._sum.price ?? 0),
      },
      newClientsThisMonth,
      rangeTotals: {
        revenue,
        paidBookings: seriesRows.length,
        completed: seriesRows.filter(
          (row) => row.status === AppointmentStatus.COMPLETED
        ).length,
        confirmed: seriesRows.filter(
          (row) => row.status === AppointmentStatus.CONFIRMED
        ).length,
      },
      revenueSeries,
      bestBucket,
      thisMonth: {
        completed: completedThisMonth,
        cancelled: cancelledThisMonth,
      },
      upcoming: upcoming.map((appointment) => ({
        id: appointment.id,
        startAt: appointment.startAt.toISOString(),
        status: appointment.status,
        price: Number(appointment.price),
        clientName: [appointment.client.firstName, appointment.client.lastName]
          .filter(Boolean)
          .join(" "),
        serviceName: appointment.service.name,
        staffName: appointment.staff?.name ?? null,
      })),
    },
  });
}
