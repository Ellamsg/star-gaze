"use client";

import Link from "next/link";
import { useState } from "react";

import { useAdmin } from "@/components/admin/store";
import { Icon } from "@/components/admin/icons";
import {
  AppointmentBadge,
  Badge,
  Card,
  EmptyState,
  Money,
  PageHeader,
  SectionHead,
  StatCard,
  cn,
} from "@/components/admin/ui";
import {
  clientById,
  collectedTotal,
  serviceById,
  staffById,
  type AdminState,
} from "@/data/admin";
import {
  dayKey,
  formatDate,
  formatDateLong,
  formatDayShort,
  formatTime,
  greeting,
  monthKey,
  todayKey,
} from "@/lib/date";

type Range = "7d" | "6w" | "12m";

const rangeLabels: Record<Range, string> = {
  "7d": "7 days",
  "6w": "6 weeks",
  "12m": "12 months",
};

function revenueBuckets(state: AdminState, range: Range): Array<{ label: string; value: number }> {
  const paid = state.payments.filter(
    (payment) => payment.status === "confirmed" || payment.status === "completed"
  );

  if (range === "12m") {
    const buckets: Array<{ key: string; label: string; value: number }> = [];
    const now = new Date();

    for (let index = 11; index >= 0; index -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
      const key = `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
      buckets.push({
        key,
        label: date.toLocaleString("en-GB", { month: "short" }),
        value: 0,
      });
    }

    for (const payment of paid) {
      const bucket = buckets.find((item) => item.key === monthKey(payment.date));
      if (bucket) bucket.value += payment.amount;
    }

    return buckets.map(({ label, value }) => ({ label, value }));
  }

  const days = range === "7d" ? 7 : 42;
  const buckets: Array<{ key: string; label: string; value: number }> = [];

  for (let index = days - 1; index >= 0; index -= 1) {
    const key = dayKey(-index);
    buckets.push({ key, label: formatDayShort(key), value: 0 });
  }

  for (const payment of paid) {
    const bucket = buckets.find((item) => item.key === payment.date);
    if (bucket) bucket.value += payment.amount;
  }

  if (range === "7d") {
    return buckets.map((bucket) => ({ label: bucket.label.split(" ")[0], value: bucket.value }));
  }

  // Fold 42 days into 6 weekly buckets, oldest first.
  const weeks: Array<{ label: string; value: number }> = [];
  for (let index = 0; index < buckets.length; index += 7) {
    const slice = buckets.slice(index, index + 7);
    weeks.push({
      label: slice[0]?.label ?? "",
      value: slice.reduce((total, bucket) => total + bucket.value, 0),
    });
  }
  return weeks;
}

export default function AdminOverviewPage() {
  const { state } = useAdmin();
  const [range, setRange] = useState<Range>("7d");

  const today = todayKey();
  const month = monthKey(today);
  const owner = state.staff.find((member) => member.role === "owner");
  const ownerFirstName = owner?.name.split(" ")[0] ?? "there";

  const todaysAppointments = state.appointments
    .filter((appointment) => appointment.date === today && appointment.status !== "cancelled")
    .sort((a, b) => a.time.localeCompare(b.time));

  const paidToday = state.payments.filter(
    (payment) =>
      payment.date === today &&
      (payment.status === "confirmed" || payment.status === "completed")
  );

  const pendingPayments = state.payments.filter((payment) => payment.status === "pending");
  const pendingTotal = pendingPayments.reduce((total, payment) => total + payment.amount, 0);
  const openRefunds = state.refunds.filter((refund) => refund.status === "requested");
  const newClients = state.clients.filter((client) => client.joinedAt.startsWith(month));

  const chart = revenueBuckets(state, range);
  const maxValue = Math.max(...chart.map((bucket) => bucket.value), 1);
  const rangeTotal = chart.reduce((total, bucket) => total + bucket.value, 0);
  const bestBucket = chart.reduce(
    (best, bucket) => (bucket.value > best.value ? bucket : best),
    chart[0] ?? { label: "—", value: 0 }
  );

  const upcoming = state.appointments
    .filter(
      (appointment) =>
        appointment.date >= today &&
        (appointment.status === "pending" || appointment.status === "confirmed")
    )
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
    .slice(0, 4);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={formatDateLong(today)}
        title="Good"
        accent={`${greeting()}, ${ownerFirstName}`}
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

      <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        <StatCard
          accent
          label="Taken today"
          value={`₦${collectedTotal(paidToday).toLocaleString("en-NG")}`}
          hint={`${paidToday.length} payment${paidToday.length === 1 ? "" : "s"} confirmed`}
          icon="wallet"
        />
        <StatCard
          label="Bookings today"
          value={`${todaysAppointments.length}`}
          hint={todaysAppointments.length === 0 ? "The chair is free" : "Across the day"}
          icon="calendar"
        />
        <StatCard
          label="Awaiting payment"
          value={`₦${pendingTotal.toLocaleString("en-NG")}`}
          hint={`${pendingPayments.length} payment${pendingPayments.length === 1 ? "" : "s"} to confirm`}
          icon="clock"
        />
        <StatCard
          label="New clients"
          value={`${newClients.length}`}
          hint="Joined this month"
          icon="users"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Revenue</p>
              <p className="mt-1 font-display text-[28px] leading-none text-cream">
                <Money value={rangeTotal} />
              </p>
              <p className="mt-1 text-xs text-muted">Last {rangeLabels[range]}</p>
            </div>
            <div className="flex rounded-full border border-hairline/80 bg-white/[0.03] p-1">
              {(Object.keys(rangeLabels) as Range[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRange(option)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[11px] font-medium transition",
                    range === option ? "bg-pink text-canvas" : "text-muted hover:text-cream"
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
                range === "12m" ? "min-w-[520px]" : "min-w-full"
              )}
            >
              {chart.map((bucket, index) => (
                <div
                  key={`${bucket.label}-${index}`}
                  className="group flex h-full flex-1 flex-col items-center gap-2"
                >
                  <div className="relative flex w-full flex-1 items-end">
                    <div
                      title={`${bucket.label}: ₦${bucket.value.toLocaleString("en-NG")}`}
                      className="w-full rounded-t-xl bg-[linear-gradient(180deg,rgba(233,139,166,0.95),rgba(233,139,166,0.25))] transition-all duration-300 group-hover:opacity-90"
                      style={{
                        height: `${Math.max(4, (bucket.value / maxValue) * 100)}%`,
                      }}
                    />
                    <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-canvas px-1.5 py-0.5 text-[10px] text-cream opacity-0 shadow transition group-hover:opacity-100">
                      ₦{bucket.value.toLocaleString("en-NG")}
                    </span>
                  </div>
                  <span className="whitespace-nowrap text-[10px] text-muted">{bucket.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-hairline/50 pt-3 text-[11px] text-muted">
            <span className="flex items-center gap-1.5">
              <Icon name="chart" size={13} />
              Best {range === "12m" ? "month" : range === "6w" ? "week" : "day"}:{" "}
              <span className="text-cream">
                {bestBucket.label} · ₦{bestBucket.value.toLocaleString("en-NG")}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="wallet" size={13} />
              {state.payments.filter((payment) => payment.status === "pending").length} payments to
              confirm
            </span>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <SectionHead
              title="Needs attention"
              action={
                <Badge tone={pendingPayments.length + openRefunds.length > 0 ? "amber" : "green"} dot>
                  {pendingPayments.length + openRefunds.length > 0 ? "Open" : "Clear"}
                </Badge>
              }
            />
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/admin/payments?status=pending"
                  className="flex items-center justify-between gap-3 rounded-2xl border border-hairline/60 bg-canvas/30 px-3.5 py-3 transition hover:border-pink/30"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-300/10 text-amber-200">
                      <Icon name="clock" size={16} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium text-cream">
                        {pendingPayments.length} payment
                        {pendingPayments.length === 1 ? "" : "s"} to confirm
                      </span>
                      <span className="block text-[11px] text-muted">
                        <Money value={pendingTotal} /> waiting
                      </span>
                    </span>
                  </span>
                  <Icon name="chevronRight" size={15} className="shrink-0 text-muted" />
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/refunds"
                  className="flex items-center justify-between gap-3 rounded-2xl border border-hairline/60 bg-canvas/30 px-3.5 py-3 transition hover:border-pink/30"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pink/10 text-pink">
                      <Icon name="refund" size={16} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium text-cream">
                        {openRefunds.length} refund request{openRefunds.length === 1 ? "" : "s"}
                      </span>
                      <span className="block text-[11px] text-muted">
                        {openRefunds.length === 0
                          ? "Nothing pending"
                          : `₦${openRefunds.reduce((total, refund) => total + refund.amount, 0).toLocaleString("en-NG")} requested`}
                      </span>
                    </span>
                  </span>
                  <Icon name="chevronRight" size={15} className="shrink-0 text-muted" />
                </Link>
              </li>
            </ul>
          </Card>

          <Card className="p-5">
            <SectionHead title="This month" hint={formatDate(today)} />
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl border border-hairline/60 bg-canvas/30 p-3">
                <dt className="text-[11px] uppercase tracking-wide text-muted">Completed</dt>
                <dd className="mt-1 font-display text-xl text-cream">
                  {
                    state.appointments.filter(
                      (appointment) =>
                        appointment.status === "completed" && appointment.date.startsWith(month)
                    ).length
                  }
                </dd>
              </div>
              <div className="rounded-2xl border border-hairline/60 bg-canvas/30 p-3">
                <dt className="text-[11px] uppercase tracking-wide text-muted">Cancelled</dt>
                <dd className="mt-1 font-display text-xl text-cream">
                  {
                    state.appointments.filter(
                      (appointment) =>
                        appointment.status === "cancelled" && appointment.date.startsWith(month)
                    ).length
                  }
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
            hint="Confirmed and pending bookings, soonest first"
            action={
              <Link
                href="/admin/appointments"
                className="flex items-center gap-1 text-[12px] text-muted transition hover:text-cream"
              >
                All bookings <Icon name="chevronRight" size={13} />
              </Link>
            }
          />

          {upcoming.length === 0 ? (
            <EmptyState
              icon="calendar"
              title="Nothing booked yet"
              body="New bookings will appear here as soon as a client picks a slot."
            />
          ) : (
            <ul className="space-y-2.5">
              {upcoming.map((appointment) => {
                const client = clientById(state, appointment.clientId);
                const service = serviceById(state, appointment.serviceId);
                const artist = staffById(state, appointment.staffId);

                return (
                  <li
                    key={appointment.id}
                    className="flex flex-wrap items-center gap-3 rounded-2xl border border-hairline/60 bg-canvas/30 px-3.5 py-3 sm:flex-nowrap"
                  >
                    <div className="flex h-11 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-white/[0.04]">
                      <span className="text-[10px] uppercase text-muted">
                        {appointment.date === today ? "Today" : formatDayShort(appointment.date)}
                      </span>
                      <span className="text-[13px] font-semibold text-cream">
                        {formatTime(appointment.time)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium text-cream">
                        {client?.name ?? "Guest"}
                      </p>
                      <p className="break-words text-xs text-muted">
                        {service?.name} · {artist?.name ?? "Unassigned"}
                      </p>
                    </div>
                    <div className="ml-auto flex shrink-0 items-center gap-2">
                      <span className="hidden text-sm text-cream sm:block">
                        <Money value={appointment.price} />
                      </span>
                      <AppointmentBadge status={appointment.status} />
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
