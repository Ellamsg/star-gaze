"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Icon } from "@/components/admin/icons";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  TextInput,
} from "@/components/admin/ui";
import {
  useAllSlots,
  useCancelDay,
  useCreateSlots,
  useDeleteSlot,
  useSetSlotStatus,
} from "@/hooks/use-availability";
import { useCancelAppointment } from "@/hooks/use-appointments";
import { dayKey, formatDate, formatTime, todayKey } from "@/lib/date";
import type {
  AddSlotsFormValues,
  AvailabilityFilterValues,
  AvailabilitySlotDTO,
} from "@/types/availability";

export default function AvailabilityPage() {
  const filters = useForm<AvailabilityFilterValues>({
    defaultValues: { from: "", to: "" },
  });

  const addForm = useForm<AddSlotsFormValues>({
    defaultValues: {
      date: "",
      times: "09:00, 10:30, 13:00, 15:00",
      duration: "60",
    },
  });

  const { reset: resetFilters } = filters;
  const { reset: resetAddForm } = addForm;

  /*
   * `new Date()` is not allowed during the server render, so the "today"
   * defaults are filled in once the page is running in the browser.
   */
  useEffect(() => {
    const today = todayKey();
    resetFilters({ from: today, to: dayKey(30) });
    resetAddForm({
      date: today,
      times: "09:00, 10:30, 13:00, 15:00",
      duration: "60",
    });
  }, [resetFilters, resetAddForm]);

  const fromValue = useWatch({ control: filters.control, name: "from" });
  const toValue = useWatch({ control: filters.control, name: "to" });
  const dateValue = useWatch({ control: addForm.control, name: "date" });

  const selectedDate = dateValue;
  const hasRange = Boolean(fromValue && toValue);

  const {
    data: slots = [],
    isPending,
    error,
  } = useAllSlots(fromValue || undefined, toValue || undefined, hasRange);
  const isLoading = !hasRange || isPending;

  const createSlots = useCreateSlots();
  const setStatus = useSetSlotStatus();
  const removeSlot = useDeleteSlot();
  const closeDay = useCancelDay();
  const cancelBooking = useCancelAppointment();

  const [notice, setNotice] = useState<string | null>(null);

  const busy =
    createSlots.isPending ||
    setStatus.isPending ||
    removeSlot.isPending ||
    closeDay.isPending ||
    cancelBooking.isPending;

  const grouped = useMemo(() => {
    const map = new Map<string, AvailabilitySlotDTO[]>();
    for (const slot of slots) {
      map.set(slot.date, [...(map.get(slot.date) ?? []), slot]);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [slots]);

  const message =
    notice ??
    (error instanceof Error ? error.message : error ? "Could not load slots." : null);

  const onAddSlots = addForm.handleSubmit(async (values) => {
    const times = values.times
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (times.length === 0) {
      setNotice("Add at least one time, e.g. 09:00, 13:00.");
      return;
    }

    setNotice(null);

    try {
      const result = await createSlots.mutateAsync({
        slots: times.map((time) => ({ date: values.date, time })),
        durationMin: Number(values.duration) || 60,
      });

      addForm.setValue("times", "");

      if (result.skipped > 0) {
        setNotice(
          `${result.skipped} slot${result.skipped === 1 ? "" : "s"} already existed and were skipped.`
        );
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not add slots.");
    }
  });

  async function onToggle(slot: AvailabilitySlotDTO) {
    setNotice(null);
    try {
      await setStatus.mutateAsync({
        id: slot.id,
        status: slot.status === "OPEN" ? "BLOCKED" : "OPEN",
      });
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not update slot.");
    }
  }

  async function onRemove(slot: AvailabilitySlotDTO) {
    if (
      !window.confirm(
        `Delete ${formatTime(slot.time)} on ${formatDate(slot.date)}?`
      )
    ) {
      return;
    }

    setNotice(null);
    try {
      await removeSlot.mutateAsync(slot.id);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not delete slot.");
    }
  }

  async function onCloseDay() {
    if (!selectedDate) {
      setNotice("Choose a date in the Add times form first.");
      return;
    }

    if (!window.confirm(`Close every open slot on ${formatDate(selectedDate)}?`)) {
      return;
    }

    setNotice(null);
    try {
      const result = await closeDay.mutateAsync(selectedDate);
      if (result.bookedLeftAlone > 0) {
        setNotice(
          `${result.bookedLeftAlone} booked slot${result.bookedLeftAlone === 1 ? "" : "s"} were left alone — cancel those bookings below.`
        );
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not close that day.");
    }
  }

  async function onCancelBooking(slot: AvailabilitySlotDTO) {
    if (!slot.appointmentId) return;

    if (
      !window.confirm(
        `Cancel the booking at ${formatTime(slot.time)} on ${formatDate(slot.date)}? The time will reopen.`
      )
    ) {
      return;
    }

    setNotice(null);
    try {
      await cancelBooking.mutateAsync(slot.appointmentId);
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Could not cancel that booking."
      );
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="The chair"
        title="Availability"
        accent="& times"
        description="Add the dates and times clients can book. Booked slots close themselves; cancel a booking to reopen its time."
      />

      <Card className="p-4 sm:p-5">
        <form onSubmit={onAddSlots}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Add times
          </p>

          <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] text-muted">Date</span>
              <TextInput
                type="date"
                {...addForm.register("date", { required: "Pick a date" })}
              />
              {addForm.formState.errors.date ? (
                <span className="text-[11px] text-pink">
                  {addForm.formState.errors.date.message}
                </span>
              ) : null}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] text-muted">
                Times (comma separated)
              </span>
              <TextInput
                placeholder="09:00, 13:00"
                {...addForm.register("times", {
                  required: "Add at least one time",
                })}
              />
              {addForm.formState.errors.times ? (
                <span className="text-[11px] text-pink">
                  {addForm.formState.errors.times.message}
                </span>
              ) : null}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] text-muted">Minutes per slot</span>
              <TextInput
                type="number"
                min={5}
                max={600}
                {...addForm.register("duration", {
                  required: "Set a slot length",
                  min: { value: 5, message: "At least 5 minutes" },
                  max: { value: 600, message: "At most 600 minutes" },
                })}
              />
              {addForm.formState.errors.duration ? (
                <span className="text-[11px] text-pink">
                  {addForm.formState.errors.duration.message}
                </span>
              ) : null}
            </label>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="submit" icon="plus" disabled={busy}>
              {createSlots.isPending ? "Adding…" : "Add these times"}
            </Button>
            <Button
              variant="secondary"
              onClick={onCloseDay}
              disabled={busy}
            >
              Close entire day
            </Button>
          </div>
        </form>
      </Card>

      <div className="mt-4 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] text-muted">Show from</span>
          <TextInput
            type="date"
            className="h-10"
            {...filters.register("from")}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] text-muted">to</span>
          <TextInput
            type="date"
            className="h-10"
            {...filters.register("to")}
          />
        </label>
      </div>

      {message ? (
        <p className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] px-4 py-3 text-[12px] leading-relaxed text-amber-200/90">
          {message}
        </p>
      ) : null}

      {isLoading ? (
        <p className="mt-6 text-sm text-muted">Loading…</p>
      ) : grouped.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon="calendar"
            title="No times yet"
            body="Add a date and a few times above — they'll appear on the booking page immediately."
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {grouped.map(([dayValue, daySlots]) => (
            <li
              key={dayValue}
              className="rounded-[24px] border border-hairline/60 bg-surface/70 p-3 sm:p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[13px] font-semibold text-cream">
                  {formatDate(dayValue)}
                </p>
                <span className="text-[11px] text-muted">
                  {daySlots.filter((slot) => slot.status === "OPEN").length} open ·{" "}
                  {daySlots.filter((slot) => slot.status === "BOOKED").length}{" "}
                  booked
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap gap-2">
                {daySlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center gap-1.5 rounded-full border border-hairline/70 bg-white/[0.03] py-1 pl-3 pr-1"
                  >
                    <span className="text-[12px] tabular-nums text-cream">
                      {formatTime(slot.time)}
                    </span>

                    {slot.status === "BOOKED" ? (
                      <Badge tone="green">Booked</Badge>
                    ) : slot.status === "BLOCKED" ? (
                      <Badge tone="neutral">Closed</Badge>
                    ) : (
                      <Badge tone="pink">Open</Badge>
                    )}

                    {slot.status !== "BOOKED" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onToggle(slot)}
                          disabled={busy}
                          className="rounded-full px-2 py-1 text-[11px] text-cream/80 hover:text-cream"
                        >
                          {slot.status === "OPEN" ? "Close" : "Reopen"}
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemove(slot)}
                          disabled={busy}
                          aria-label="Delete slot"
                          className="rounded-full p-1 text-muted hover:text-pink"
                        >
                          <Icon name="trash" size={13} />
                        </button>
                      </>
                    ) : slot.appointmentId ? (
                      <button
                        type="button"
                        onClick={() => onCancelBooking(slot)}
                        disabled={busy}
                        className="rounded-full px-2 py-1 text-[11px] text-pink hover:text-cream"
                      >
                        Cancel booking
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
