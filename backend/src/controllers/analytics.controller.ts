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
  zonedParts,
  zonedStartOfDay,
} from "../lib/timezone";
import type { OverviewQuery } from "../validators/analytics.schema";

/**
 * The studio has no payments table yet, so "money taken" is derived from the
 * appointment status: a booking is revenue once the owner confirms it.
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

type Granularity = "hour" | "day" | "month";

type SeriesRow = {
  createdAt: Date;
  startAt: Date;
  price: unknown;
};

const RANGE_LABELS: Record<OverviewQuery["range"], string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  month: "This month",
  "12m": "Last 12 months",
};

const CHART_CAPTIONS: Record<OverviewQuery["range"], string> = {
  today: "Today by hour",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  month: "This month by day",
  "12m": "Last 12 months",
};

const pad2 = (value: number): string => String(value).padStart(2, "0");

/** The UTC instant range the summary covers, ending at midnight tonight. */
function resolveWindow(
  range: OverviewQuery["range"],
  todayKey: string
): { startKey: string; start: Date; end: Date } {
  const monthStartKey = `${todayKey.slice(0, 7)}-01`;

  const startKey =
    range === "today"
      ? todayKey
      : range === "7d"
        ? addDaysToKey(todayKey, -6)
        : range === "30d"
          ? addDaysToKey(todayKey, -29)
          : range === "month"
            ? monthStartKey
            : addMonthsToKey(monthStartKey, -11);

  return {
    startKey,
    start: zonedStartOfDay(startKey),
    end: zonedStartOfDay(addDaysToKey(todayKey, 1)),
  };
}

function buildSeries(
  range: OverviewQuery["range"],
  basis: OverviewQuery["basis"],
  todayKey: string,
  rows: SeriesRow[]
): { series: Bucket[]; granularity: Granularity } {
  const dateOf = (row: SeriesRow) =>
    basis === "booked" ? row.createdAt : row.startAt;

  if (range === "today") {
    const hours: Bucket[] = Array.from({ length: 24 }, (_, hour) => ({
      key: `${todayKey}T${pad2(hour)}`,
      label: `${pad2(hour)}:00`,
      shortLabel: pad2(hour),
      value: 0,
    }));

    for (const row of rows) {
      const { hour } = zonedParts(dateOf(row));
      hours[hour].value += Number(row.price);
    }

    return { series: hours, granularity: "hour" };
  }

  if (range === "12m") {
    const firstMonth = addMonthsToKey(
      `${todayKey.slice(0, 7)}-01`,
      -11
    );
    const months: Bucket[] = [];
    const byMonth = new Map<string, Bucket>();

    for (let index = 0; index < 12; index += 1) {
      const monthKey = addMonthsToKey(firstMonth, index).slice(0, 7);
      const label = monthLabel(monthKey);
      const bucket: Bucket = { key: monthKey, label, shortLabel: label, value: 0 };
      months.push(bucket);
      byMonth.set(monthKey, bucket);
    }

    for (const row of rows) {
      const bucket = byMonth.get(zonedDateKey(dateOf(row)).slice(0, 7));
      if (bucket) bucket.value += Number(row.price);
    }

    return { series: months, granularity: "month" };
  }

  // Day buckets: 7d/30d are rolling, "month" runs from the 1st to today.
  const dayCount =
    range === "7d"
      ? 7
      : range === "30d"
        ? 30
        : Number(todayKey.slice(8, 10));

  const keys: string[] = [];
  for (let offset = dayCount - 1; offset >= 0; offset -= 1) {
    keys.push(addDaysToKey(todayKey, -offset));
  }

  const byDay = new Map<string, number>();
  for (const row of rows) {
    const key = zonedDateKey(dateOf(row));
    byDay.set(key, (byDay.get(key) ?? 0) + Number(row.price));
  }

  return {
    series: keys.map((key) => ({
      key,
      label: dayLabel(key),
      shortLabel: key.slice(8),
      value: byDay.get(key) ?? 0,
    })),
    granularity: "day",
  };
}

/* ------------------- GET /api/analytics/overview (admin) ------------------- */

export async function overview(req: Request, res: Response): Promise<void> {
  const { range, basis } = req.query as unknown as OverviewQuery;

  const now = new Date();
  const todayKey = zonedDateKey(now);
  const { start, end } = resolveWindow(range, todayKey);

  // One branch per basis so Prisma keeps its typed `where`.
  const where =
    basis === "booked"
      ? { createdAt: { gte: start, lt: end } }
      : { startAt: { gte: start, lt: end } };

  const [grouped, newClients, seriesRows, upcoming] = await Promise.all([
    prisma.appointment.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
      _sum: { price: true },
    }),
    prisma.client.count({ where: { createdAt: { gte: start, lt: end } } }),
    prisma.appointment.findMany({
      where: { AND: [where, { status: { in: PAID_STATUSES } }] },
      select: { createdAt: true, startAt: true, price: true },
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

  const byStatus = new Map(grouped.map((group) => [group.status, group]));
  const countOf = (status: AppointmentStatus): number =>
    byStatus.get(status)?._count._all ?? 0;
  const sumOf = (status: AppointmentStatus): number =>
    Number(byStatus.get(status)?._sum.price ?? 0);

  const { series, granularity } = buildSeries(range, basis, todayKey, seriesRows);
  const bestBucket = series.reduce(
    (best, bucket) => (bucket.value > best.value ? bucket : best),
    series[0] ?? { key: "", label: "—", shortLabel: "—", value: 0 }
  );

  res.setHeader("Cache-Control", "private, no-store");
  res.json({
    data: {
      range,
      basis,
      timezone: STUDIO_TIMEZONE,
      generatedAt: now.toISOString(),
      window: {
        start: start.toISOString(),
        end: end.toISOString(),
        label: RANGE_LABELS[range],
      },
      totals: {
        // Every booking made/scheduled in the window, whatever its status.
        bookings: grouped
          .filter((group) => group.status !== AppointmentStatus.CANCELLED)
          .reduce((total, group) => total + group._count._all, 0),
        paid: PAID_STATUSES.reduce((total, status) => total + sumOf(status), 0),
        paidBookings: PAID_STATUSES.reduce(
          (total, status) => total + countOf(status),
          0
        ),
        pending: {
          count: countOf(AppointmentStatus.PENDING),
          amount: sumOf(AppointmentStatus.PENDING),
        },
        completed: countOf(AppointmentStatus.COMPLETED),
        cancelled: countOf(AppointmentStatus.CANCELLED),
        noShow: countOf(AppointmentStatus.NO_SHOW),
      },
      newClients,
      series,
      bestBucket,
      chart: {
        granularity,
        caption: CHART_CAPTIONS[range],
      },
      upcoming: upcoming.map((appointment) => ({
        id: appointment.id,
        startAt: appointment.startAt.toISOString(),
        createdAt: appointment.createdAt.toISOString(),
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
