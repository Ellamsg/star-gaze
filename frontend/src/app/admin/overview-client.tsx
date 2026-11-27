"use client";

import Link from "next/link";
import { useState } from "react";

import { Icon } from "@/components/admin/icons";
import {
  AppointmentBadge,
  Badge,
  Button,
  Card,
  EmptyState,
  Money,
  PageHeader,
  SectionHead,
  Skeleton,
  StatCard,
  cn,
} from "@/components/admin/ui";
import { useAuth } from "@/hooks/use-auth";
import { useOverviewAnalytics } from "@/hooks/use-analytics";
import {
  formatDateLong,
  formatInstantDay,
  formatInstantTime,
  greeting,
  instantDateKey,
  todayKey,
} from "@/lib/date";
import { appointmentStatusFromApi } from "@/types/appointment";
import type { AnalyticsBasis, AnalyticsRange } from "@/types/analytics";

const rangeLabels: Record<AnalyticsRange, string> = {
  today: "Today",
  "7d": "7 days",
  "30d": "30 days",
  month: "This month",
  "12m": "12 months",
};

const rangeNoun: Record<AnalyticsRange, string> = {
  today: "hour",
  "7d": "day",
  "30d": "day",
  month: "day",
  "12m": "month",
};

const basisLabels: Record<AnalyticsBasis, string> = {
  booked: "Booked date",
  scheduled: "Appointment date",
};

/** Reads naturally after "Joined …". */
const windowPhrases: Record<AnalyticsRange, string> = {
  today: "today",
  "7d": "in the last 7 days",
  "30d": "in the last 30 days",
  month: "this month",
  "12m": "in the last 12 months",
};

function naira(value: number): string {
  return `₦${value.toLocaleString("en-NG")}`;
}

function plural(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? "" : "s"}`;
}

export default function AdminOverviewPage() {
  const { data: admin } = useAuth();
  const [range, setRange] = useState<AnalyticsRange>("today");
  const [basis, setBasis] = useState<AnalyticsBasis>("booked");
  const { data, isPending, isError, error, refetch, isFetching } =
    useOverviewAnalytics(range, basis);

  const firstName = admin?.name?.split(" ")[0] ?? "there";
  const headerDate = data ? data.generatedAt.slice(0, 10) : todayKey();
  const greetingLine = `${greeting()}, ${firstName}`;

  if (isPending) {
    return (
      <div className="space-y-7" aria-busy="true">
        <PageHeader
          eyebrow={formatDateLong(headerDate)}
          title="Good"
          accent={greetingLine}
          description="Here's the studio at a glance — today's chair, the money that came in, and anything waiting on you."
        />
        <Skeleton className="h-16 rounded-[22px]" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-[22px]" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <Skeleton className="h-80 rounded-[26px]" />
          <div className="space-y-4">
            <Skeleton className="h-44 rounded-[26px]" />
            <Skeleton className="h-32 rounded-[26px]" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-7">
        <PageHeader
          eyebrow={formatDateLong(headerDate)}
          title="Good"
          accent={greetingLine}
          description="Here's the studio at a glance — today's chair, the money that came in, and anything waiting on you."
        />
        <Card className="p-6 text-center">
          <p className="font-display text-lg text-cream">
            Couldn’t load the studio numbers
          </p>
          <p className="mx-auto mt-1 max-w-md text-[13px] leading-relaxed text-muted">
            {error instanceof Error
              ? error.message
              : "The dashboard couldn’t reach the API. Check that the backend is running."}
          </p>
          <Button
            variant="secondary"
            className="mx-auto mt-4"
            onClick={() => refetch()}
            loading={isFetching}
          >
            Try again
          </Button>
        </Card>
      </div>
    );
  }

  const { totals } = data;
  const maxValue = Math.max(...data.series.map((bucket) => bucket.value), 1);
  const crowdedAxis = data.series.length > 14;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={formatDateLong(headerDate)}
        title="Good"
        accent={greetingLine}
        description="Here's the studio at a glance — today's chair, the money that came in, and anything waiting on you."
        action={
          <Link
            href="/admin/services"
            className="hidden h-11 items-center gap-2 rounded-full bg-pink px-5 text-sm font-medium text-canvas shadow-[0_10px_30px_-12px_rgba(233,139,166,0.8)] transition hover:bg-rose sm:inline-flex"
          >
            <Icon name="sparkle" size={17} />
            Add a service
          </Link>
        }
      />

      <Card className="p-3">
        <div className="flex flex-col gap-3">
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
            {(Object.keys(rangeLabels) as AnalyticsRange[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRange(option)}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-2 text-[12px] font-medium transition",
                  range === option
                    ? "bg-pink text-canvas"
                    : "bg-white/[0.04] text-muted hover:text-cream"
                )}
              >
                {rangeLabels[option]}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-hairline/50 pt-3">
            <span className="text-[11px] uppercase tracking-[0.14em] text-muted">
              Show by
            </span>
            <div className="flex rounded-full border border-hairline/80 bg-white/[0.03] p-1">
              {(Object.keys(basisLabels) as AnalyticsBasis[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setBasis(option)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[11px] font-medium transition",
                    basis === option
                      ? "bg-pink text-canvas"
                      : "text-muted hover:text-cream"
                  )}
                >
                  {basisLabels[option]}
                </button>
              ))}
            </div>
            <p className="basis-full text-[11px] leading-relaxed text-muted/80 sm:basis-auto">
              {basis === "booked"
                ? "Every booking made in this range, even if the chair date is later."
                : "Every appointment happening in this range, whenever it was booked."}
            </p>
          </div>
        </div>
      </Card>

      <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        <StatCard
          accent
          label={range === "today" ? "Taken today" : "Paid in range"}
          value={naira(totals.paid)}
          hint={`${plural(totals.paidBookings, "booking")} confirmed`}
          icon="wallet"
        />
        <StatCard
          label={range === "today" ? "Booked today" : "Booked in range"}
          value={`${totals.bookings}`}
          hint={
            totals.pending.count > 0
              ? `${plural(totals.pending.count, "booking")} still pending`
              : "All confirmed or completed"
          }
          icon="calendar"
        />
        <StatCard
          label="Awaiting payment"
          value={naira(totals.pending.amount)}
          hint={`${plural(totals.pending.count, "payment")} to confirm`}
          icon="clock"
        />
        <StatCard
          label="New clients"
          value={`${data.newClients}`}
          hint={`Joined ${windowPhrases[range]}`}
          icon="users"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card
          className={cn("p-5 transition-opacity", isFetching && "opacity-70")}
          aria-busy={isFetching}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                Revenue
              </p>
              <p className="mt-1 font-display text-[28px] leading-none text-cream">
                <Money value={totals.paid} />
              </p>
              <p className="mt-1 text-xs text-muted">{data.chart.caption}</p>
            </div>
            <div className="flex rounded-full border border-hairline/80 bg-white/[0.03] p-1">
              {(Object.keys(rangeLabels) as AnalyticsRange[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRange(option)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[11px] font-medium transition",
                    range === option
                      ? "bg-pink text-canvas"
                      : "text-muted hover:text-cream"
                  )}
                >
                  {rangeLabels[option]}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 overflow-x-auto pb-1">
            <div
              className={cn(
                "flex h-44 gap-2",
                crowdedAxis ? "min-w-[560px]" : "min-w-full"
              )}
            >
              {data.series.map((bucket) => (
                <div
                  key={bucket.key}
                  className="group flex h-full flex-1 flex-col items-center gap-2"
                >
                  <div className="relative flex w-full flex-1 items-end">
                    <div
                      title={`${bucket.label}: ${naira(bucket.value)}`}
                      className="w-full rounded-t-xl bg-[linear-gradient(180deg,rgba(233,139,166,0.95),rgba(233,139,166,0.25))] transition-all duration-300 group-hover:opacity-90"
                      style={{
                        height: `${Math.max(4, (bucket.value / maxValue) * 100)}%`,
                      }}
                    />
                    <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-canvas px-1.5 py-0.5 text-[10px] text-cream opacity-0 shadow transition group-hover:opacity-100">
                      {naira(bucket.value)}
                    </span>
                  </div>
                  <span className="whitespace-nowrap text-[10px] text-muted">
                    {data.chart.granularity === "day" && data.series.length > 7
                      ? bucket.shortLabel
                      : bucket.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-hairline/50 pt-3 text-[11px] text-muted">
            <span className="flex items-center gap-1.5">
              <Icon name="chart" size={13} />
              Best {rangeNoun[range]}:{" "}
              <span className="text-cream">
                {data.bestBucket.label} · {naira(data.bestBucket.value)}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="wallet" size={13} />
              {plural(totals.pending.count, "payment")} to confirm
            </span>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <SectionHead
              title="Needs attention"
              action={
                <Badge tone={totals.pending.count > 0 ? "amber" : "green"} dot>
                  {totals.pending.count > 0 ? "Open" : "Clear"}
                </Badge>
              }
            />
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/admin/appointments?status=pending"
                  className="flex items-center justify-between gap-3 rounded-2xl border border-hairline/60 bg-canvas/30 px-3.5 py-3 transition hover:border-pink/30"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-300/10 text-amber-200">
                      <Icon name="clock" size={16} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium text-cream">
                        {plural(totals.pending.count, "payment")} to confirm
                      </span>
                      <span className="block text-[11px] text-muted">
                        <Money value={totals.pending.amount} /> waiting
                      </span>
                    </span>
                  </span>
                  <Icon
                    name="chevronRight"
                    size={15}
                    className="shrink-0 text-muted"
                  />
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/clients"
                  className="flex items-center justify-between gap-3 rounded-2xl border border-hairline/60 bg-canvas/30 px-3.5 py-3 transition hover:border-pink/30"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pink/10 text-pink">
                      <Icon name="users" size={16} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium text-cream">
                        {plural(data.newClients, "new client")}
                      </span>
                      <span className="block text-[11px] text-muted">
                        Joined {windowPhrases[range]}
                      </span>
                    </span>
                  </span>
                  <Icon
                    name="chevronRight"
                    size={15}
                    className="shrink-0 text-muted"
                  />
                </Link>
              </li>
            </ul>
          </Card>

          <Card className="p-5">
            <SectionHead title="In this range" hint={data.window.label} />
            <dl className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-2xl border border-hairline/60 bg-canvas/30 p-3">
                <dt className="text-[11px] uppercase tracking-wide text-muted">
                  Completed
                </dt>
                <dd className="mt-1 font-display text-xl text-cream">
                  {totals.completed}
                </dd>
              </div>
              <div className="rounded-2xl border border-hairline/60 bg-canvas/30 p-3">
                <dt className="text-[11px] uppercase tracking-wide text-muted">
                  Cancelled
                </dt>
                <dd className="mt-1 font-display text-xl text-cream">
                  {totals.cancelled}
                </dd>
              </div>
              <div className="rounded-2xl border border-hairline/60 bg-canvas/30 p-3">
                <dt className="text-[11px] uppercase tracking-wide text-muted">
                  No show
                </dt>
                <dd className="mt-1 font-display text-xl text-cream">
                  {totals.noShow}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-5">
          <SectionHead
            title="Next up"
            hint="Confirmed and pending appointments, soonest first"
            action={
              <Link
                href="/admin/appointments"
                className="flex items-center gap-1 text-[12px] text-muted transition hover:text-cream"
              >
                All bookings <Icon name="chevronRight" size={13} />
              </Link>
            }
          />

          {data.upcoming.length === 0 ? (
            <EmptyState
              icon="calendar"
              title="Nothing booked yet"
              body="New bookings will appear here as soon as a client picks a slot."
            />
          ) : (
            <ul className="space-y-2.5">
              {data.upcoming.map((appointment) => {
                const isToday =
                  instantDateKey(appointment.startAt, data.timezone) ===
                  instantDateKey(data.generatedAt, data.timezone);

                return (
                  <li
                    key={appointment.id}
                    className="flex flex-wrap items-center gap-3 rounded-2xl border border-hairline/60 bg-canvas/30 px-3.5 py-3 sm:flex-nowrap"
                  >
                    <div className="flex h-11 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-white/[0.04]">
                      <span className="text-[10px] uppercase text-muted">
                        {isToday
                          ? "Today"
                          : formatInstantDay(
                              appointment.startAt,
                              data.timezone
                            )}
                      </span>
                      <span className="text-[13px] font-semibold text-cream">
                        {formatInstantTime(
                          appointment.startAt,
                          data.timezone
                        )}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium text-cream">
                        {appointment.clientName}
                      </p>
                      <p className="break-words text-xs text-muted">
                        {appointment.serviceName} ·{" "}
                        {appointment.staffName ?? "Unassigned"}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted/70">
                        Booked{" "}
                        {formatInstantDay(
                          appointment.createdAt,
                          data.timezone
                        )}
                      </p>
                    </div>
                    <div className="ml-auto flex shrink-0 items-center gap-2">
                      <span className="hidden text-sm text-cream sm:block">
                        <Money value={appointment.price} />
                      </span>
                      <AppointmentBadge
                        status={appointmentStatusFromApi[appointment.status]}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <SectionHead title="Quick actions" />
          <div className="grid gap-2">
            <Link
              href="/admin/services"
              className="flex items-center justify-between rounded-2xl border border-hairline/60 bg-canvas/30 px-4 py-3 text-sm text-cream transition hover:border-pink/30"
            >
              <span className="flex items-center gap-3">
                <Icon name="sparkle" size={17} className="text-pink" />
                Manage services
              </span>
              <Icon name="chevronRight" size={15} className="text-muted" />
            </Link>
            <Link
              href="/admin/appointments?status=pending"
              className="flex items-center justify-between rounded-2xl border border-hairline/60 bg-canvas/30 px-4 py-3 text-sm text-cream transition hover:border-pink/30"
            >
              <span className="flex items-center gap-3">
                <Icon name="calendar" size={17} className="text-pink" />
                Confirm bookings
              </span>
              <Icon name="chevronRight" size={15} className="text-muted" />
            </Link>
            <Link
              href="/admin/team"
              className="flex items-center justify-between rounded-2xl border border-hairline/60 bg-canvas/30 px-4 py-3 text-sm text-cream transition hover:border-pink/30"
            >
              <span className="flex items-center gap-3">
                <Icon name="shield" size={17} className="text-pink" />
                Invite an admin
              </span>
              <Icon name="chevronRight" size={15} className="text-muted" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
