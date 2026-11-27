"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { useAdmin } from "@/components/admin/store";
import { Icon } from "@/components/admin/icons";
import {
  AppointmentBadge,
  Badge,
  Button,
  EmptyState,
  Money,
  PageHeader,
  Segmented,
  Sheet,
  TextInput,
  cn,
} from "@/components/admin/ui";
import {
  appointmentStatusFromApi,
  appointmentStatusLabels,
  type AdminAppointmentDTO,
  type AppointmentAdminRow,
  type AppointmentApiStatus,
  type AppointmentStatus,
  type AppointmentStatusFilter,
} from "@/types/appointment";
import {
  useAppointments,
  useCancelAppointment,
  useUpdateAppointmentStatus,
} from "@/hooks/use-appointments";
import {
  formatDate,
  formatDateLong,
  formatDayShort,
  formatDuration,
  formatTime,
  toDateKey,
  todayKey,
} from "@/lib/date";

type DateFilter = "all" | "today" | "upcoming" | "past";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function pad(value: number): string {
  return `${value}`.padStart(2, "0");
}

/** Turn the API row into the values the dashboard renders. */
function toRow(appointment: AdminAppointmentDTO): AppointmentAdminRow {
  const start = new Date(appointment.startAt);
  const booked = new Date(appointment.createdAt);
  const clientName =
    [appointment.client.firstName, appointment.client.lastName]
      .filter((part): part is string => Boolean(part))
      .join(" ") || "Guest";

  return {
    ...appointment,
    date: toDateKey(start),
    time: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
    bookedDate: toDateKey(booked),
    bookedTime: `${pad(booked.getHours())}:${pad(booked.getMinutes())}`,
    statusUi: appointmentStatusFromApi[appointment.status],
    clientName,
    serviceNames:
      appointment.items.map((item) => item.service.name).join(", ") ||
      "Service",
    totalDurationMin: appointment.items.reduce(
      (total, item) => total + item.durationMin,
      0
    ),
    photo: appointment.photos[0]?.url,
  };
}

function statusCounts(
  rows: AppointmentAdminRow[]
): Record<AppointmentStatusFilter, number> {
  const counts: Record<AppointmentStatusFilter, number> = {
    all: rows.length,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    no_show: 0,
  };

  for (const row of rows) {
    counts[row.statusUi] += 1;
  }

  return counts;
}

export default function AppointmentsPage() {
  const { notify } = useAdmin();
  const searchParams = useSearchParams();
  const requestedStatus = searchParams.get("status");

  // Deep links from the overview (?status=pending) open pre-filtered.
  const [status, setStatus] = useState<AppointmentStatusFilter>(() =>
    requestedStatus && requestedStatus in appointmentStatusLabels
      ? (requestedStatus as AppointmentStatus)
      : "all"
  );
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const {
    data: appointments = [],
    error,
    isPending,
    isFetching,
    refetch,
  } = useAppointments();
  const updateStatus = useUpdateAppointmentStatus();
  const cancelAppointment = useCancelAppointment();

  const busy = updateStatus.isPending || cancelAppointment.isPending;
  const rows = useMemo(() => appointments.map(toRow), [appointments]);
  const counts = useMemo(() => statusCounts(rows), [rows]);
  const today = todayKey();

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();

    return rows
      .filter((appointment) => {
        if (status !== "all" && appointment.statusUi !== status) return false;

        if (dateFilter === "today" && appointment.date !== today) return false;
        if (dateFilter === "upcoming" && appointment.date < today) return false;
        if (dateFilter === "past" && appointment.date >= today) return false;

        if (!term) return true;

        return [
          appointment.clientName,
          appointment.client.phone,
          appointment.serviceNames,
          appointment.reference,
        ]
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLowerCase().includes(term));
      })
      .sort((a, b) => {
        const left = `${a.date}${a.time}`;
        const right = `${b.date}${b.time}`;

        if (dateFilter === "past") return right.localeCompare(left);

        // Today + upcoming first (soonest first), then past bookings newest first.
        const rankA = a.date >= today ? 0 : 1;
        const rankB = b.date >= today ? 0 : 1;
        if (rankA !== rankB) return rankA - rankB;

        return rankA === 0 ? left.localeCompare(right) : right.localeCompare(left);
      });
  }, [rows, status, dateFilter, search, today]);

  const openAppointment =
    rows.find((appointment) => appointment.id === selectedId) ?? null;

  const changeStatus = async (
    appointment: AppointmentAdminRow,
    next: AppointmentApiStatus
  ) => {
    try {
      await updateStatus.mutateAsync({ id: appointment.id, status: next });
      notify(
        `${appointment.clientName} → ${
          appointmentStatusLabels[appointmentStatusFromApi[next]]
        }.`,
        "success"
      );
    } catch (mutationError) {
      notify(errorMessage(mutationError), "danger");
    }
  };

  const cancelBooking = async (appointment: AppointmentAdminRow) => {
    if (
      !window.confirm(
        `Cancel ${appointment.clientName}'s booking? The time slot will reopen for other clients.`
      )
    ) {
      return;
    }

    try {
      await cancelAppointment.mutateAsync(appointment.id);
      notify(`${appointment.clientName}'s booking cancelled.`, "success");
    } catch (mutationError) {
      notify(errorMessage(mutationError), "danger");
    }
  };

  const fetchError = error ? errorMessage(error) : null;

  return (
    <div>
      <PageHeader
        eyebrow="The chair"
        title="Appointments"
        accent="& requests"
        description="Every booking, loaded live from the database. Confirm, complete or cancel without leaving the list."
        action={
          <Button
            variant="secondary"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            {isFetching ? "Refreshing…" : "Refresh"}
          </Button>
        }
      />

      <div className="space-y-3">
        <Segmented<AppointmentStatusFilter>
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "All", count: counts.all },
            { value: "pending", label: "Pending", count: counts.pending },
            { value: "confirmed", label: "Confirmed", count: counts.confirmed },
            { value: "completed", label: "Completed", count: counts.completed },
            { value: "cancelled", label: "Cancelled", count: counts.cancelled },
          ]}
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Segmented<DateFilter>
            value={dateFilter}
            onChange={setDateFilter}
            options={[
              { value: "all", label: "Any date" },
              { value: "today", label: "Today" },
              { value: "upcoming", label: "Upcoming" },
              { value: "past", label: "Past" },
            ]}
            className="sm:flex-1"
          />
          <div className="relative sm:w-64">
            <Icon
              name="search"
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            />
            <TextInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, phone or reference"
              className="h-10 pl-10 text-[13px]"
              aria-label="Search appointments"
            />
          </div>
        </div>
      </div>

      {fetchError ? (
        <div className="mt-4 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-200">
          <p>{fetchError}</p>
          <Button
            size="sm"
            variant="secondary"
            className="mt-3"
            onClick={() => void refetch()}
          >
            Try again
          </Button>
        </div>
      ) : isPending ? (
        <p className="mt-4 text-[13px] text-muted">
          Loading appointments from the database…
        </p>
      ) : (
        <>
          <p className="mt-4 text-xs text-muted">
            {visible.length} booking{visible.length === 1 ? "" : "s"}
            {dateFilter === "past" ? " · newest first" : " · soonest first"}
          </p>

          {visible.length === 0 ? (
            <div className="mt-3">
              <EmptyState
                icon="calendar"
                title="No bookings match"
                body="Try a different status or date, or clear the search."
                action={
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setStatus("all");
                      setDateFilter("all");
                      setSearch("");
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            </div>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {visible.map((appointment) => {
                return (
                  <li key={appointment.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(appointment.id)}
                      className="w-full rounded-[24px] border border-hairline/60 bg-surface/70 p-3 text-left transition hover:border-pink/25 active:scale-[0.995] sm:p-4"
                    >
                      <div className="flex gap-3">
                        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-white/[0.04] text-center">
                          <span className="text-[10px] uppercase tracking-wide text-muted">
                            {appointment.date === today
                              ? "Today"
                              : formatDayShort(appointment.date)}
                          </span>
                          <span className="mt-0.5 whitespace-nowrap text-[12px] font-semibold leading-none text-cream">
                            {formatTime(appointment.time)}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                            <div className="min-w-0">
                              <p className="break-words text-[15px] font-semibold leading-snug text-cream">
                                {appointment.clientName}
                              </p>
                              <ul className="mt-1 space-y-0.5">
                                {appointment.items.map((item) => (
                                  <li
                                    key={item.id}
                                    className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-[12px] leading-relaxed"
                                  >
                                    <span className="min-w-0 break-words text-muted">
                                      {item.service.name}
                                    </span>
                                    {/* One service? The total on the right is
                                        the same number, so don't repeat it. */}
                                    {appointment.items.length > 1 ? (
                                      <span className="shrink-0 text-muted/90">
                                        <Money value={item.price} />
                                      </span>
                                    ) : null}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <span className="shrink-0 text-[13px] font-medium text-cream">
                              <Money value={appointment.price} />
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <AppointmentBadge status={appointment.statusUi} />
                            {appointment.photo ? (
                              <Badge tone="pink">
                                <Icon name="image" size={11} /> Inspiration
                              </Badge>
                            ) : null}
                            <span className="text-[11px] text-muted/80">
                              {formatDuration(appointment.totalDurationMin)} ·{" "}
                              {appointment.staff?.name ?? "Unassigned"}
                            </span>
                            <span className="text-[11px] text-muted/70">
                              Booked {formatDayShort(appointment.bookedDate)}
                            </span>
                          </div>
                        </div>

                        {appointment.photo ? (
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-hairline/60 sm:h-16 sm:w-16">
                            {/* eslint-disable-next-line @next/next/no-img-element -- uploaded photo URL */}
                            <img
                              src={appointment.photo}
                              alt={`${appointment.clientName} inspiration`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : null}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <Sheet
        open={openAppointment !== null}
        onClose={() => setSelectedId(null)}
        title={openAppointment?.clientName ?? "Booking"}
        description={
          openAppointment
            ? `${formatDateLong(openAppointment.date)} at ${formatTime(
                openAppointment.time
              )} · ${openAppointment.reference}`
            : undefined
        }
        wide
        footer={
          openAppointment ? (
            <div className="flex flex-wrap gap-2">
              {openAppointment.statusUi === "pending" ? (
                <Button
                  className="flex-1"
                  icon="check"
                  disabled={busy}
                  onClick={() =>
                    void changeStatus(openAppointment, "CONFIRMED")
                  }
                >
                  Confirm
                </Button>
              ) : null}
              {openAppointment.statusUi === "confirmed" ? (
                <Button
                  className="flex-1"
                  icon="check"
                  disabled={busy}
                  onClick={() =>
                    void changeStatus(openAppointment, "COMPLETED")
                  }
                >
                  Mark completed
                </Button>
              ) : null}
              {openAppointment.statusUi === "cancelled" ||
              openAppointment.statusUi === "no_show" ? (
                <Button
                  className="flex-1"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void changeStatus(openAppointment, "PENDING")}
                >
                  Reopen as pending
                </Button>
              ) : null}
              {openAppointment.statusUi === "pending" ||
              openAppointment.statusUi === "confirmed" ? (
                <Button
                  variant="danger"
                  disabled={busy}
                  onClick={() => void cancelBooking(openAppointment)}
                >
                  Cancel
                </Button>
              ) : null}
              {openAppointment.statusUi === "completed" ? (
                <Button
                  className="flex-1"
                  variant="secondary"
                  onClick={() => setSelectedId(null)}
                >
                  Done
                </Button>
              ) : null}
            </div>
          ) : null
        }
      >
        {openAppointment ? (
          <AppointmentDetail appointment={openAppointment} />
        ) : null}
      </Sheet>
    </div>
  );
}

function AppointmentDetail({
  appointment,
}: {
  appointment: AppointmentAdminRow;
}) {
  const client = appointment.client;
  const digits = client.phone?.replace(/[^\d]/g, "") ?? "";

  return (
    <div className="space-y-4">
      {appointment.photo ? (
        <figure>
          <div className="flex max-h-[46dvh] items-center justify-center overflow-hidden rounded-[22px] border border-hairline/70 bg-canvas/60">
            {/* eslint-disable-next-line @next/next/no-img-element -- uploaded photo URL */}
            <img
              src={appointment.photo}
              alt="Client inspiration"
              className="max-h-[46dvh] w-full object-contain"
            />
          </div>
          <figcaption className="mt-2 flex items-center gap-1.5 text-[11px] text-muted">
            <Icon name="image" size={12} /> What {client.firstName} wants
          </figcaption>
        </figure>
      ) : (
        <div className="flex items-center gap-3 rounded-[22px] border border-dashed border-hairline/70 px-4 py-4 text-[12px] text-muted">
          <Icon name="image" size={18} />
          No inspiration photo sent with this booking.
        </div>
      )}

      <div className="rounded-[22px] border border-hairline/60 bg-canvas/30 px-4 py-3.5">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
          Services &amp; prices
        </p>
        <ul className="mt-3 space-y-2">
          {appointment.items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5"
            >
              <span className="min-w-0 text-[13px] leading-snug text-cream">
                {item.service.name}
                <span className="ml-2 whitespace-nowrap text-[11px] text-muted">
                  {formatDuration(item.durationMin)}
                </span>
              </span>
              <span className="shrink-0 text-[13px] text-cream">
                <Money value={item.price} />
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-baseline justify-between border-t border-hairline/50 pt-3">
          <span className="text-[11px] uppercase tracking-[0.14em] text-muted">
            Total
          </span>
          <span className="font-display text-[18px] text-cream">
            <Money value={appointment.price} />
          </span>
        </div>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <DetailRow label="Status">
          <AppointmentBadge status={appointment.statusUi} />
        </DetailRow>
        <DetailRow label="Duration">
          <span className="text-[13px] text-cream">
            {formatDuration(appointment.totalDurationMin)}
          </span>
        </DetailRow>
        <DetailRow label="Artist">
          <span className="break-words text-[13px] text-cream">
            {appointment.staff?.name ?? "Unassigned"}
          </span>
        </DetailRow>
        <DetailRow label="Appointment">
          <span className="text-[13px] text-cream">
            {formatDate(appointment.date)} · {formatTime(appointment.time)}
          </span>
        </DetailRow>
        <DetailRow label="Booked on">
          <span className="text-[13px] text-cream">
            {formatDate(appointment.bookedDate)} ·{" "}
            {formatTime(appointment.bookedTime)}
          </span>
        </DetailRow>
      </div>

      <div className="rounded-[22px] border border-hairline/60 bg-canvas/30 p-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Client</p>
        <p className="mt-1 break-words text-sm font-medium text-cream">
          {appointment.clientName}
        </p>
        <p className="text-[13px] text-muted">
          {client.phone ?? "No phone on file"}
        </p>
        {client.email ? (
          <p className="break-words text-[13px] text-muted">{client.email}</p>
        ) : null}

        {digits ? (
          <div className="mt-3 flex gap-2">
            <a
              href={`tel:${digits}`}
              className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-full border border-hairline/80 bg-white/[0.04] text-[12px] text-cream"
            >
              <Icon name="phone" size={14} /> Call
            </a>
            <a
              href={`https://wa.me/${digits.replace(/^0/, "234")}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-full border border-hairline/80 bg-white/[0.04] text-[12px] text-cream"
            >
              <Icon name="arrowUpRight" size={14} /> WhatsApp
            </a>
          </div>
        ) : null}
      </div>

      {appointment.notes ? (
        <div className="rounded-[22px] border border-hairline/60 bg-canvas/30 p-4">
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-muted">
            <Icon name="note" size={12} /> Note
          </p>
          <p className="mt-1.5 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-cream/90">
            {appointment.notes}
          </p>
        </div>
      ) : null}

      <p className={cn("text-[11px]", "text-muted/70")}>
        Reference {appointment.reference}
      </p>
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-hairline/60 bg-canvas/30 px-3.5 py-2.5">
      <p className="text-[10px] uppercase tracking-[0.16em] text-muted">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}
