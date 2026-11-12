"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { useAdmin } from "@/components/admin/store";
import { Icon } from "@/components/admin/icons";
import {
  AppointmentBadge,
  Avatar,
  Button,
  EmptyState,
  Money,
  PageHeader,
  Sheet,
  Textarea,
  TextInput,
} from "@/components/admin/ui";
import { appointmentStatusFromApi } from "@/types/appointment";
import type {
  AdminClientDTO,
  ClientAdminRow,
  ClientAppointmentDTO,
  ClientAppointmentRow,
  ClientNotesFormValues,
} from "@/types/client";
import { useClients, useUpdateClientNotes } from "@/hooks/use-clients";
import {
  formatDate,
  formatTime,
  plural,
  relativeDay,
  toDateKey,
} from "@/lib/date";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function pad(value: number): string {
  return `${value}`.padStart(2, "0");
}

function toHistory(appointment: ClientAppointmentDTO): ClientAppointmentRow {
  const start = new Date(appointment.startAt);

  return {
    ...appointment,
    date: toDateKey(start),
    time: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
    statusUi: appointmentStatusFromApi[appointment.status],
    serviceNames:
      appointment.items.map((item) => item.service.name).join(", ") ||
      "Service",
    totalDurationMin: appointment.items.reduce(
      (total, item) => total + item.durationMin,
      0
    ),
  };
}

function toRow(client: AdminClientDTO): ClientAdminRow {
  const history = client.appointments.map(toHistory);
  const completed = history.filter(
    (appointment) => appointment.statusUi === "completed"
  );
  const lastVisit =
    completed
      .map((appointment) => appointment.date)
      .sort()
      .at(-1) ?? null;

  return {
    ...client,
    name:
      [client.firstName, client.lastName]
        .filter((part): part is string => Boolean(part))
        .join(" ") || "Guest",
    visits: completed.length,
    spend: completed.reduce(
      (total, appointment) => total + appointment.price,
      0
    ),
    lastVisit,
    upcoming: history.filter(
      (appointment) =>
        appointment.statusUi === "pending" ||
        appointment.statusUi === "confirmed"
    ).length,
    history,
  };
}

export default function ClientsPage() {
  const { notify } = useAdmin();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const {
    data: clients = [],
    error,
    isPending,
    isFetching,
    refetch,
  } = useClients();
  const updateNotes = useUpdateClientNotes();

  const rows = useMemo(() => clients.map(toRow), [clients]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();

    return rows
      .filter((client) =>
        term
          ? [client.name, client.phone, client.email]
              .filter((value): value is string => Boolean(value))
              .some((value) => value.toLowerCase().includes(term))
          : true
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rows, search]);

  const selected = rows.find((client) => client.id === selectedId) ?? null;
  const fetchError = error ? errorMessage(error) : null;

  const handleSaveNotes = async (client: ClientAdminRow, notes: string | null) => {
    try {
      await updateNotes.mutateAsync({
        id: client.id,
        payload: { notes },
      });
      notify("Note saved.", "success");
    } catch (mutationError) {
      notify(errorMessage(mutationError), "danger");
      throw mutationError;
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="The book"
        title="Clients"
        accent="& regulars"
        description="No accounts, no passwords — just people, loaded live from the database with their booking history."
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

      <div className="relative mb-4">
        <Icon
          name="search"
          size={17}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
        />
        <TextInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, phone or email"
          className="pl-11"
          aria-label="Search clients"
        />
      </div>

      {fetchError ? (
        <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-200">
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
        <p className="text-[13px] text-muted">Loading clients from the database…</p>
      ) : (
        <>
          <p className="mb-3 text-xs text-muted">
            Showing {visible.length} of {rows.length} {plural(rows.length, "client")}
          </p>

          {visible.length === 0 ? (
            <EmptyState
              icon="users"
              title="No client found"
              body="Try another name or number. New clients appear automatically after their first booking."
            />
          ) : (
            <ul className="space-y-2">
              {visible.map((client) => {
                return (
                  <li key={client.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(client.id)}
                      className="flex w-full items-center gap-3 rounded-[22px] border border-hairline/60 bg-surface/70 px-3.5 py-3 text-left transition hover:border-pink/25 active:scale-[0.995]"
                    >
                      <Avatar
                        name={client.name}
                        tone={client.upcoming > 0 ? "pink" : "neutral"}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-[14px] font-medium leading-snug text-cream">
                          {client.name}
                        </p>
                        <p className="text-[12px] text-muted">{client.phone}</p>
                        <p className="mt-0.5 text-[11px] text-muted/80">
                          {client.visits} {plural(client.visits, "visit")} ·{" "}
                          {client.lastVisit
                            ? relativeDay(client.lastVisit)
                            : "first booking"}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[13px] font-medium text-cream">
                          <Money value={client.spend} />
                        </p>
                        {client.upcoming > 0 ? (
                          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-pink">
                            {client.upcoming} upcoming
                          </p>
                        ) : (
                          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted/70">
                            lifetime
                          </p>
                        )}
                      </div>
                      <Icon
                        name="chevronRight"
                        size={15}
                        className="shrink-0 text-muted"
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <Sheet
        open={selected !== null}
        onClose={() => setSelectedId(null)}
        title={selected?.name ?? "Client"}
        description={
          selected
            ? `Client since ${formatDate(toDateKey(new Date(selected.createdAt)))}`
            : undefined
        }
        footer={
          selected ? (
            <div className="flex gap-2">
              <a
                href={`tel:${(selected.phone ?? "").replace(/[^\d]/g, "")}`}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-hairline/80 bg-white/[0.04] text-[13px] text-cream"
              >
                <Icon name="phone" size={15} /> Call
              </a>
              <a
                href={`https://wa.me/${(selected.phone ?? "")
                  .replace(/[^\d]/g, "")
                  .replace(/^0/, "234")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-pink text-[13px] font-medium text-canvas"
              >
                <Icon name="arrowUpRight" size={15} /> WhatsApp
              </a>
            </div>
          ) : null
        }
      >
        {selected ? (
          <ClientDetail
            key={selected.id}
            client={selected}
            saving={updateNotes.isPending}
            onSaveNotes={(notes) => handleSaveNotes(selected, notes)}
          />
        ) : null}
      </Sheet>
    </div>
  );
}

function ClientDetail({
  client,
  saving,
  onSaveNotes,
}: {
  client: ClientAdminRow;
  saving: boolean;
  onSaveNotes: (notes: string | null) => Promise<void> | void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ClientNotesFormValues>({
    defaultValues: { notes: client.notes ?? "" },
  });

  const submit = handleSubmit(async (values) => {
    const notes = values.notes.trim() || null;

    try {
      await onSaveNotes(notes);
      reset({ notes: notes ?? "" });
    } catch {
      // The parent already showed the toast; keep the user's draft.
    }
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <MiniStat label="Visits" value={`${client.visits}`} />
        <MiniStat label="Lifetime" value={<Money value={client.spend} />} />
        <MiniStat label="Upcoming" value={`${client.upcoming}`} />
      </div>

      <div className="rounded-[22px] border border-hairline/60 bg-canvas/30 p-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
          Contact
        </p>
        <p className="mt-1 break-words text-[13px] text-cream">
          {client.phone ?? "No phone on file"}
        </p>
        {client.email ? (
          <p className="break-words text-[13px] text-muted">{client.email}</p>
        ) : (
          <p className="text-[13px] text-muted/70">No email on file</p>
        )}
      </div>

      <form onSubmit={submit}>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
            Private note
          </p>
          <Button
            size="sm"
            variant="ghost"
            type="submit"
            disabled={!isDirty || isSubmitting || saving}
          >
            {isSubmitting || saving ? "Saving…" : "Save"}
          </Button>
        </div>
        <Textarea
          placeholder="Shape, allergies, colour preferences…"
          {...register("notes", {
            maxLength: {
              value: 2000,
              message: "Notes must be at most 2000 characters.",
            },
          })}
        />
        {errors.notes?.message ? (
          <p className="mt-1.5 text-xs text-rose-300">{errors.notes.message}</p>
        ) : null}
      </form>

      <div>
        <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted">
          Booking history · {client.history.length}
        </p>

        {client.history.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-hairline/70 px-4 py-6 text-center text-xs text-muted">
            No bookings yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {client.history.map((appointment) => {
              return (
                <li
                  key={appointment.id}
                  className="flex flex-wrap items-center gap-2 rounded-2xl border border-hairline/60 bg-canvas/30 px-3.5 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-[13px] text-cream">
                      {appointment.serviceNames}
                    </p>
                    <p className="text-[11px] text-muted">
                      {formatDate(appointment.date)} ·{" "}
                      {formatTime(appointment.time)} · {appointment.reference}
                    </p>
                  </div>
                  <Money
                    value={appointment.price}
                    className="text-[12px] text-cream"
                  />
                  <AppointmentBadge status={appointment.statusUi} />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-hairline/60 bg-canvas/30 px-3 py-2.5 text-center">
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 break-words font-display text-lg leading-none text-cream">
        {value}
      </p>
    </div>
  );
}
