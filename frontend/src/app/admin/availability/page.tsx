"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { MonthCalendar, monthFromKey } from "@/components/availability/month-calendar";
import { Icon } from "@/components/admin/icons";
import {
  Badge,
  Button,
  Card,
  PageHeader,
  Select,
  Skeleton,
  TextInput,
} from "@/components/admin/ui";
import { Spinner } from "@/components/spinner";
import {
  useAdminDay,
  useAdminMonth,
  useClearDayOverride,
  useCreateBlock,
  useDeleteBlock,
  useSaveDayOverride,
  useSaveSchedule,
  useScheduleSettings,
} from "@/hooks/use-availability";
import { useCancelAppointment } from "@/hooks/use-appointments";
import { formatDateLong, formatTime, todayKey } from "@/lib/date";
import type {
  BlockFormValues,
  DaySettingsFormValues,
  ScheduleFormValues,
} from "@/types/availability";

const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(":").map(Number);
  const total = Math.min(23 * 60 + 59, hours * 60 + mins + minutes);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(
    total % 60
  ).padStart(2, "0")}`;
}

export default function AvailabilityPage() {
  const [month, setMonth] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  /* `new Date()` cannot run during the server render, so start in the browser. */
  useEffect(() => {
    const today = todayKey();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMonth((current) => current || today.slice(0, 7));
    setSelectedDate((current) => current || today);
  }, []);

  /* Keep the selected day inside the visible month. */
  useEffect(() => {
    if (!month || !selectedDate) return;
    if (monthFromKey(selectedDate) !== month) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedDate(`${month}-01`);
    }
  }, [month, selectedDate]);

  const settingsQuery = useScheduleSettings();
  const monthQuery = useAdminMonth(month);
  const dayQuery = useAdminDay(selectedDate);

  const scheduleForm = useForm<ScheduleFormValues>({
    defaultValues: {
      openTime: "09:00",
      closeTime: "19:00",
      stepMinutes: "30",
      openWeekdays: [0, 1, 2, 3, 4, 5, 6],
      horizonDays: "180",
    },
  });

  const dayForm = useForm<DaySettingsFormValues>({
    defaultValues: {
      openTime: "09:00",
      closeTime: "19:00",
      stepMinutes: "30",
      note: "",
    },
  });

  const blockForm = useForm<BlockFormValues>({
    defaultValues: { startTime: "13:00", endTime: "14:00", note: "" },
  });

  const { reset: resetSchedule } = scheduleForm;
  const { reset: resetDay } = dayForm;
  const { reset: resetBlock } = blockForm;

  useEffect(() => {
    if (!settingsQuery.data) return;
    resetSchedule({
      openTime: settingsQuery.data.openTime,
      closeTime: settingsQuery.data.closeTime,
      stepMinutes: String(settingsQuery.data.stepMinutes),
      openWeekdays: settingsQuery.data.openWeekdays,
      horizonDays: String(settingsQuery.data.horizonDays),
    });
  }, [settingsQuery.data, resetSchedule]);

  useEffect(() => {
    const day = dayQuery.data;
    if (!day) return;

    resetDay({
      openTime: day.override?.openTime ?? day.openTime,
      closeTime: day.override?.closeTime ?? day.closeTime,
      stepMinutes: String(day.override?.stepMinutes ?? day.stepMinutes),
      note: day.override?.note ?? "",
    });
    resetBlock({
      startTime: day.openTime,
      endTime: addMinutes(day.openTime, 30),
      note: "",
    });
  }, [dayQuery.data, resetDay, resetBlock]);

  const openWeekdays = useWatch({
    control: scheduleForm.control,
    name: "openWeekdays",
  });

  const saveSchedule = useSaveSchedule();
  const saveDay = useSaveDayOverride();
  const clearDay = useClearDayOverride();
  const createBlock = useCreateBlock();
  const removeBlock = useDeleteBlock();
  const cancelBooking = useCancelAppointment();

  const busy =
    saveSchedule.isPending ||
    saveDay.isPending ||
    clearDay.isPending ||
    createBlock.isPending ||
    removeBlock.isPending ||
    cancelBooking.isPending;

  const day = dayQuery.data;
  const closed = day ? day.override?.isClosed === true : false;
  const usingOverride = Boolean(day?.override);

  const dayHeading = selectedDate
    ? formatDateLong(selectedDate)
    : "Pick a day";

  const monthError =
    monthQuery.error instanceof Error
      ? monthQuery.error.message
      : monthQuery.error
        ? "Could not load this month."
        : null;

  const dayError =
    dayQuery.error instanceof Error
      ? dayQuery.error.message
      : dayQuery.error
        ? "Could not load this day."
        : null;

  const blocks = useMemo(() => day?.blocks ?? [], [day]);

  function selectDate(date: string) {
    setSelectedDate(date);
    setNotice(null);
    setSaved(null);
  }

  function toggleWeekday(value: number, checked: boolean) {
    const current = scheduleForm.getValues("openWeekdays");
    const next = checked
      ? [...new Set([...current, value])].sort((a, b) => a - b)
      : current.filter((dayValue) => dayValue !== value);
    scheduleForm.setValue("openWeekdays", next, { shouldDirty: true });
  }

  const onSaveSchedule = scheduleForm.handleSubmit(async (values) => {
    setNotice(null);
    setSaved(null);

    if (values.openWeekdays.length === 0) {
      setNotice("Keep at least one day open in the default week.");
      return;
    }

    try {
      await saveSchedule.mutateAsync({
        openTime: values.openTime,
        closeTime: values.closeTime,
        stepMinutes: Number(values.stepMinutes),
        openWeekdays: values.openWeekdays,
        horizonDays: Number(values.horizonDays),
      });
      setSaved("Default hours saved. Every open day now uses them.");
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Could not save the default hours."
      );
    }
  });

  const onSaveDay = dayForm.handleSubmit(async (values) => {
    if (!selectedDate) return;
    setNotice(null);
    setSaved(null);

    try {
      await saveDay.mutateAsync({
        date: selectedDate,
        payload: {
          isClosed: false,
          openTime: values.openTime,
          closeTime: values.closeTime,
          stepMinutes: Number(values.stepMinutes),
          note: values.note.trim() || undefined,
        },
      });
      setSaved("This day now has its own hours.");
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Could not save this day."
      );
    }
  });

  async function closeThisDay() {
    if (!selectedDate) return;
    if (!window.confirm(`Close ${formatDateLong(selectedDate)} completely?`)) {
      return;
    }

    setNotice(null);
    setSaved(null);
    try {
      await saveDay.mutateAsync({
        date: selectedDate,
        payload: { isClosed: true, note: "Closed by the studio" },
      });
      setSaved("That day is closed. Existing bookings are untouched.");
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Could not close this day."
      );
    }
  }

  async function useDefaultHours() {
    if (!selectedDate) return;
    setNotice(null);
    setSaved(null);
    try {
      await clearDay.mutateAsync(selectedDate);
      setSaved("Back to the default week.");
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Could not reset this day."
      );
    }
  }

  const onAddBlock = blockForm.handleSubmit(async (values) => {
    if (!selectedDate) return;
    setNotice(null);
    setSaved(null);

    try {
      await createBlock.mutateAsync({
        date: selectedDate,
        startTime: values.startTime,
        endTime: values.endTime,
        note: values.note.trim() || undefined,
      });
      blockForm.setValue("note", "");
      setSaved("Time closed for that day.");
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Could not close that time."
      );
    }
  });

  async function quickClose(startTime: string) {
    if (!selectedDate) return;
    setNotice(null);
    setSaved(null);
    try {
      await createBlock.mutateAsync({
        date: selectedDate,
        startTime,
        endTime: addMinutes(startTime, day?.stepMinutes ?? 30),
        note: "Closed",
      });
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Could not close that time."
      );
    }
  }

  async function onRemoveBlock(id: string) {
    setNotice(null);
    setSaved(null);
    try {
      await removeBlock.mutateAsync(id);
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Could not reopen that time."
      );
    }
  }

  async function onCancelBooking(id: string, label: string) {
    if (
      !window.confirm(
        `Cancel ${label}? The time reopens for other clients immediately.`
      )
    ) {
      return;
    }

    setNotice(null);
    setSaved(null);
    try {
      await cancelBooking.mutateAsync(id);
      setSaved("Booking cancelled and the time reopened.");
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Could not cancel that booking."
      );
    }
  }

  const message = notice ?? monthError ?? dayError;

  return (
    <div>
      <PageHeader
        eyebrow="The chair"
        title="Availability"
        accent="calendar"
        description="Every day is open by default. Change the default week once, then only touch the exceptions: a closed day, different hours, or a closed time."
      />

      {message ? (
        <p className="mb-4 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] px-4 py-3 text-[12px] leading-relaxed text-amber-200/90">
          {message}
        </p>
      ) : null}

      {saved ? (
        <p className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3 text-[12px] leading-relaxed text-emerald-300">
          {saved}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        {/* ---------------------------- calendar ---------------------------- */}
        <div>
          {month ? (
            <MonthCalendar
              month={month}
              days={monthQuery.data?.days ?? []}
              selected={selectedDate}
              onSelect={selectDate}
              onMonthChange={(next) => {
                setMonth(next);
                setNotice(null);
                setSaved(null);
              }}
              loading={monthQuery.isPending}
              mode="admin"
            />
          ) : (
            <Skeleton className="h-[360px]" />
          )}

          <Card className="mt-4 p-4 sm:p-5">
            <form onSubmit={onSaveSchedule}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Default week
                </p>
                <Badge tone="pink">Applies to every open day</Badge>
              </div>

              <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] text-muted">Opens</span>
                  <TextInput
                    type="time"
                    {...scheduleForm.register("openTime", {
                      required: "Pick an opening time",
                    })}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] text-muted">Closes</span>
                  <TextInput
                    type="time"
                    {...scheduleForm.register("closeTime", {
                      required: "Pick a closing time",
                    })}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] text-muted">Start times every</span>
                  <Select {...scheduleForm.register("stepMinutes")}>
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                  </Select>
                </label>
              </div>

              <p className="mt-3 text-[11px] text-muted">Open on these days</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {WEEKDAYS.map((weekday) => {
                  const active = openWeekdays.includes(weekday.value);
                  return (
                    <button
                      key={weekday.value}
                      type="button"
                      onClick={() => toggleWeekday(weekday.value, !active)}
                      aria-pressed={active}
                      className={`rounded-full border px-3 py-1.5 text-[11.5px] font-medium transition ${
                        active
                          ? "border-pink/60 bg-pink/15 text-pink"
                          : "border-white/10 bg-white/[0.03] text-muted hover:text-cream"
                      }`}
                    >
                      {weekday.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] text-muted">
                    Clients can book this many days ahead
                  </span>
                  <TextInput
                    type="number"
                    min={1}
                    max={730}
                    {...scheduleForm.register("horizonDays", {
                      required: "Set the booking window",
                    })}
                  />
                </label>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="submit"
                  icon="check"
                  loading={saveSchedule.isPending}
                  disabled={busy}
                >
                  {saveSchedule.isPending ? "Saving…" : "Save default week"}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* ---------------------------- day panel ---------------------------- */}
        <Card className="p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                Selected day
              </p>
              <h2 className="mt-1 font-display text-[clamp(1.4rem,4vw,1.9rem)] uppercase leading-none text-cream">
                {dayHeading}
              </h2>
              {day ? (
                <p className="mt-1 text-[12px] text-muted">
                  {closed ? (
                    <>Closed all day</>
                  ) : usingOverride ? (
                    <>
                      Custom hours · {formatTime(day.openTime)} –{" "}
                      {formatTime(day.closeTime)}
                    </>
                  ) : (
                    <>
                      Default hours · {formatTime(day.openTime)} –{" "}
                      {formatTime(day.closeTime)}
                    </>
                  )}
                </p>
              ) : null}
            </div>

            {day ? (
              <Badge tone={closed ? "red" : usingOverride ? "amber" : "green"}>
                {closed ? "Closed" : usingOverride ? "Custom" : "Default"}
              </Badge>
            ) : null}
          </div>

          {!selectedDate || dayQuery.isPending ? (
            <div className="mt-5 space-y-2">
              <Skeleton className="h-10" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : day ? (
            <>
              {day.booked.length > 0 ? (
                <div className="mt-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                    Booked
                  </p>
                  <ul className="mt-2 space-y-2">
                    {day.booked.map((booking) => (
                      <li
                        key={booking.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05] px-3 py-2.5"
                      >
                        <span className="min-w-0">
                          <span className="text-[12.5px] font-semibold tabular-nums text-cream">
                            {formatTime(booking.time)} – {formatTime(booking.endTime)}
                          </span>
                          <span className="ml-2 text-[11.5px] text-muted">
                            {booking.clientName} · {booking.reference}
                          </span>
                          <span className="block text-[11px] text-muted/80">
                            {booking.serviceNames}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onCancelBooking(
                              booking.id,
                              `${booking.reference} at ${formatTime(booking.time)}`
                            )
                          }
                          disabled={busy}
                          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-pink hover:text-cream disabled:cursor-not-allowed"
                        >
                          {cancelBooking.isPending &&
                          cancelBooking.variables === booking.id ? (
                            <Spinner size={11} />
                          ) : null}
                          Cancel booking
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <form onSubmit={onSaveDay} className="mt-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Hours for this day only
                </p>

                <div className="mt-2 grid gap-2.5 sm:grid-cols-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] text-muted">Opens</span>
                    <TextInput
                      type="time"
                      {...dayForm.register("openTime", {
                        required: "Pick an opening time",
                      })}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] text-muted">Closes</span>
                    <TextInput
                      type="time"
                      {...dayForm.register("closeTime", {
                        required: "Pick a closing time",
                      })}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] text-muted">Every</span>
                    <Select {...dayForm.register("stepMinutes")}>
                      <option value="15">15 min</option>
                      <option value="30">30 min</option>
                      <option value="45">45 min</option>
                      <option value="60">60 min</option>
                    </Select>
                  </label>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="submit"
                    icon="check"
                    size="sm"
                    loading={saveDay.isPending}
                    disabled={busy}
                  >
                    {saveDay.isPending ? "Saving…" : "Save this day"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={closeThisDay}
                    disabled={busy || closed}
                  >
                    Close all day
                  </Button>
                  {usingOverride ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={useDefaultHours}
                      disabled={busy}
                    >
                      Use default hours
                    </Button>
                  ) : null}
                </div>
              </form>

              <div className="mt-6 border-t border-hairline/60 pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Times on {formatDateLong(day.date)}
                </p>

                {closed ? (
                  <p className="mt-2 rounded-2xl border border-rose-400/20 bg-rose-400/[0.05] px-3 py-2.5 text-[12px] text-rose-200">
                    This day is closed. Clients cannot pick it. Use “Use default
                    hours” to reopen it.
                  </p>
                ) : day.times.length === 0 ? (
                  <p className="mt-2 text-[12px] text-muted">
                    No start times fit on this day. Check the hours or reopen a
                    closed time.
                  </p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {day.times.map((slot) => (
                      <span
                        key={slot.time}
                        className={`inline-flex items-center gap-1 rounded-full border py-1 pl-2.5 pr-1 text-[11.5px] tabular-nums ${
                          slot.past
                            ? "border-white/5 text-muted/40"
                            : "border-white/10 bg-white/[0.03] text-cream"
                        }`}
                      >
                        {formatTime(slot.time)}
                        {slot.past ? (
                          <span className="pr-1 text-[9.5px] uppercase tracking-wide text-muted/50">
                            past
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => quickClose(slot.time)}
                            disabled={busy}
                            className="rounded-full px-1.5 py-0.5 text-[10px] text-muted hover:bg-pink/10 hover:text-pink disabled:cursor-not-allowed"
                            title={`Close ${formatTime(slot.time)} on this day`}
                          >
                            close
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}

                <form onSubmit={onAddBlock} className="mt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                    Close a time
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[11px] text-muted">From</span>
                      <TextInput
                        type="time"
                        {...blockForm.register("startTime", {
                          required: "Pick a start time",
                        })}
                      />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[11px] text-muted">To</span>
                      <TextInput
                        type="time"
                        {...blockForm.register("endTime", {
                          required: "Pick an end time",
                        })}
                      />
                    </label>
                  </div>
                  <label className="mt-2 flex flex-col gap-1.5">
                    <span className="text-[11px] text-muted">Reason (optional)</span>
                    <TextInput
                      placeholder="Lunch, school run, training…"
                      {...blockForm.register("note")}
                    />
                  </label>

                  <div className="mt-3">
                    <Button
                      type="submit"
                      icon="plus"
                      size="sm"
                      loading={createBlock.isPending}
                      disabled={busy}
                    >
                      {createBlock.isPending ? "Closing…" : "Close this time"}
                    </Button>
                  </div>
                </form>

                {blocks.length > 0 ? (
                  <ul className="mt-4 space-y-2">
                    {blocks.map((block) => (
                      <li
                        key={block.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/8 bg-white/[0.02] px-3 py-2"
                      >
                        <span className="text-[12px] text-cream">
                          {formatTime(block.startTime)} – {formatTime(block.endTime)}
                          {block.note ? (
                            <span className="ml-2 text-[11px] text-muted">
                              {block.note}
                            </span>
                          ) : null}
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemoveBlock(block.id)}
                          disabled={busy}
                          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-muted hover:text-cream disabled:cursor-not-allowed"
                        >
                          {removeBlock.isPending &&
                          removeBlock.variables === block.id ? (
                            <Spinner size={11} />
                          ) : (
                            <Icon name="trash" size={12} />
                          )}
                          Reopen
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </>
          ) : (
            <p className="mt-5 text-[13px] text-muted">
              Pick a day in the calendar to edit its hours.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
