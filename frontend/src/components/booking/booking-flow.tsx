"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";

import {
  bookingCategories,
  bookingServices,
  type MenuCategory,
  type MenuItem,
} from "@/data/booking";
import { formatNaira, studio } from "@/data/site";
import { useCreateAppointment } from "@/hooks/use-appointments";
import { useOpenSlots } from "@/hooks/use-availability";
import { useServices } from "@/hooks/use-services";
import type { DayOption } from "@/types/booking";
import type { GuestFormValues } from "@/types/appointment";

import { BookingConfirmation } from "./booking-confirmation";
import { StepProgress } from "./step-progress";
import { inputBase, nextButton } from "./ui";

const TOTAL_STEPS = 3;
const GUEST_KEY = "petal.guest";

function persistGuest(name: string, phone: string) {
  try {
    window.localStorage.setItem(
      GUEST_KEY,
      JSON.stringify({ name: name.trim(), phone: phone.trim() }),
    );
  } catch {
    /* storage blocked — the booking still works for this session */
  }
}

function formatMinutes(total: number): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (!hours) return `${minutes} min`;
  if (!minutes) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}

export function BookingFlow() {
  const [step, setStep] = useState(0);

  const [category, setCategory] = useState<MenuCategory>("Nails");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [photoName, setPhotoName] = useState<string | null>(null);

  const [dayId, setDayId] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);

  const [remembered, setRemembered] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /* ---- data from TanStack Query ---- */
  const {
    data: slots = [],
    isPending: slotsLoading,
    error: slotsQueryError,
  } = useOpenSlots();
  const { data: dbServices = [] } = useServices({ active: true });
  const createBooking = useCreateAppointment();

  const slotsError =
    slotsQueryError instanceof Error
      ? slotsQueryError.message
      : slotsQueryError
        ? "Could not load open times."
        : null;

  /* ---- guest details form ---- */
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<GuestFormValues>({
    defaultValues: { name: "", phone: "", note: "" },
  });

  /* Prefill the guest details from this device — the stand-in for "logging in". */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(GUEST_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { name?: unknown; phone?: unknown };
      const nextName = typeof parsed.name === "string" ? parsed.name : "";
      const nextPhone = typeof parsed.phone === "string" ? parsed.phone : "";
      if (!nextName && !nextPhone) return;

      // Device-local data can only be read after hydration.
      reset({ name: nextName, phone: nextPhone, note: "" });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRemembered(true);
    } catch {
      /* malformed or unavailable storage — start blank */
    }
  }, [reset]);

  const chosen: MenuItem[] = useMemo(
    () => bookingServices.filter((item) => selectedIds.includes(item.id)),
    [selectedIds],
  );

  const total = useMemo(
    () => chosen.reduce((sum, item) => sum + item.price, 0),
    [chosen],
  );

  const totalMinutes = useMemo(
    () => chosen.reduce((sum, item) => sum + Number.parseInt(item.duration, 10), 0),
    [chosen],
  );

  const days = useMemo<DayOption[]>(() => {
    const seen = new Map<string, DayOption>();
    for (const slot of slots) {
      // Only show days that have a slot long enough for the chosen services.
      if (slot.durationMin < totalMinutes) continue;
      if (seen.has(slot.date)) continue;
      const date = new Date(`${slot.date}T12:00:00`);
      seen.set(slot.date, {
        id: slot.date,
        weekday: date.toLocaleDateString("en-GB", { weekday: "short" }),
        day: String(date.getDate()),
        month: date.toLocaleDateString("en-GB", { month: "short" }),
      });
    }
    return [...seen.values()];
  }, [slots, totalMinutes]);

  const day = useMemo(
    () => days.find((item) => item.id === dayId) ?? null,
    [days, dayId],
  );

  const slotsForDay = useMemo(
    () =>
      slots
        .filter(
          (slot) => slot.date === dayId && slot.durationMin >= totalMinutes,
        )
        .sort((a, b) => a.time.localeCompare(b.time)),
    [slots, dayId, totalMinutes],
  );

  const chosenSlot = useMemo(
    () => slotsForDay.find((slot) => slot.time === time) ?? null,
    [slotsForDay, time],
  );

  /** Map the static menu item to its database row by name. */
  function dbIdFor(item: MenuItem): string | null {
    return (
      dbServices.find(
        (service) => service.name.toLowerCase() === item.name.toLowerCase(),
      )?.id ?? null
    );
  }

  const canProceed =
    step === 0
      ? selectedIds.length > 0
      : step === 1
        ? Boolean(chosenSlot)
        : !createBooking.isPending;

  const status =
    step === 0
      ? selectedIds.length > 0
        ? `${selectedIds.length} ${
            selectedIds.length === 1 ? "service" : "services"
          } · ${formatNaira(total)}`
        : "Choose a service to start"
      : step === 1
        ? day
          ? `${day.weekday} ${day.day} ${day.month}${time ? ` · ${time}` : ""}`
          : "Pick a day and a time"
        : `Total ${formatNaira(total)} · paid in studio`;

  function toggleService(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
    // Slot length depends on the services, so make the client re-pick a time.
    setDayId(null);
    setTime(null);
    setReference(null);
  }

  function pickDay(id: string) {
    setDayId(id);
    setTime(null); // the time slot list depends on the day
    setReference(null);
  }

  function pickTime(value: string) {
    setTime(value);
    setReference(null);
  }

  function goToStep(next: number) {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const submitBooking = handleSubmit(async (values) => {
    if (!chosenSlot) {
      setSubmitError("Pick a time again — that slot is no longer available.");
      return;
    }

    const serviceIds = chosen
      .map(dbIdFor)
      .filter((id): id is string => Boolean(id));

    if (serviceIds.length !== chosen.length) {
      setSubmitError(
        "One of the selected services isn't set up in the system yet. Please call the studio.",
      );
      return;
    }

    setSubmitError(null);

    try {
      const appointment = await createBooking.mutateAsync({
        slotId: chosenSlot.id,
        serviceIds,
        name: values.name.trim(),
        phone: values.phone.trim(),
        note: values.note.trim() || undefined,
      });

      persistGuest(values.name, values.phone);
      setRemembered(true);
      setReference(appointment.reference);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Could not confirm your booking. Please try again.",
      );
      // Someone may have taken the slot while the form was being filled in.
      setTime(null);
    }
  });

  function handleNext() {
    if (!canProceed) return;

    if (step === 0) {
      goToStep(1);
      return;
    }

    if (step === 1) {
      goToStep(2);
      return;
    }

    void submitBooking();
  }

  function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) setPhotoName(file.name);
  }

  function forgetGuest() {
    try {
      window.localStorage.removeItem(GUEST_KEY);
    } catch {
      /* storage unavailable — nothing to clear */
    }
    setRemembered(false);
    reset({ name: "", phone: "", note: "" });
  }

  function resetFlow() {
    setStep(0);
    setCategory("Nails");
    setSelectedIds([]);
    setPhotoName(null);
    setDayId(null);
    setTime(null);
    setReference(null);
    setSubmitError(null);
    reset({ name: "", phone: "", note: "" });
  }

  if (reference && chosen.length > 0 && day && time) {
    return (
      <BookingConfirmation
        reference={reference}
        services={chosen}
        day={day}
        time={time}
        name={getValues("name")}
        phone={getValues("phone")}
        note={getValues("note")}
        photoName={photoName}
        total={total}
        onBookAnother={resetFlow}
      />
    );
  }

  return (
    <section className="mx-auto w-full max-w-[760px] px-5 pb-36 pt-7 sm:px-8 sm:pt-9">
      <Link
        href="/"
        className="inline-block font-serif text-[15px] italic leading-none text-pink underline-offset-4 transition-opacity hover:opacity-80 hover:underline"
      >
        ‹ {studio.name}
      </Link>

      <h1 className="mt-4 font-display text-[clamp(2.75rem,7vw,4.75rem)] uppercase leading-[0.9] text-cream">
        Book your visit
      </h1>
      <p className="mt-3 max-w-[30rem] text-[14px] leading-relaxed text-muted sm:text-[15px]">
        No account needed. Just pick, choose a time, and you&rsquo;re done.
      </p>

      <div className="mt-6">
        <StepProgress total={TOTAL_STEPS} current={step} />
      </div>

      {/* ------------------------------- 1 — Services ------------------------------ */}
      {step === 0 ? (
        <div className="mt-7">
          <h2 className="font-display text-[clamp(1.7rem,4.6vw,2.4rem)] uppercase leading-[1.02] text-cream">
            What are we treating you to?
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            Pick as many as you like. Mix nails and lashes in one visit.
          </p>

          <div
            role="tablist"
            aria-label="Treatment type"
            className="mt-5 grid grid-cols-2 gap-3"
          >
            {bookingCategories.map((option) => {
              const active = option === category;
              return (
                <button
                  key={option}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setCategory(option)}
                  className={`h-12 rounded-full text-[14px] font-medium sm:h-14 sm:text-[15px] transition-colors ${
                    active
                      ? "bg-pink text-canvas"
                      : "border border-white/15 text-cream hover:border-white/35"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          <ul className="mt-4 flex flex-col gap-2.5">
            {bookingServices
              .filter((item) => item.category === category)
              .map((item) => {
                const active = selectedIds.includes(item.id);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleService(item.id)}
                      className={`flex w-full items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-left transition-colors ${
                        active
                          ? "border-pink/70 bg-pink/10"
                          : "border-white/5 bg-surface hover:border-white/20"
                      }`}
                    >
                      <span>
                        <span className="block text-[14.5px] font-semibold leading-snug text-cream">
                          {item.name}
                        </span>
                        <span className="mt-1 block text-[12.5px] text-muted">
                          {item.duration}
                        </span>
                      </span>
                      <span className="whitespace-nowrap text-[14px] font-semibold tabular-nums text-pink">
                        {formatNaira(item.price)}
                      </span>
                    </button>
                  </li>
                );
              })}
          </ul>

          <div className="mt-8">
            <h3 className="font-display text-[clamp(1.4rem,4vw,1.8rem)] uppercase leading-none text-cream">
              Got a design in mind?
            </h3>
            <p className="mt-2 text-[14px] text-muted">
              Add a photo and we&rsquo;ll match it. Optional.
            </p>

            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-pink/45 bg-surface/60 px-6 py-8 text-center transition-colors hover:border-pink/80">
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handlePhoto}
              />
              <span aria-hidden="true" className="text-[26px] leading-none text-pink">
                +
              </span>
              <span className="mt-3 max-w-full truncate text-[14px] font-semibold text-cream">
                {photoName ?? "Upload a photo"}
              </span>
              <span className="mt-1 text-[12.5px] leading-relaxed text-muted">
                {photoName
                  ? "Tap to choose a different photo"
                  : "Screenshots from Pinterest or Instagram work great"}
              </span>
            </label>
          </div>
        </div>
      ) : null}

      {/* ------------------------------- 2 — Time --------------------------------- */}
      {step === 1 ? (
        <div className="mt-7">
          <h2 className="font-display text-[clamp(1.7rem,4.6vw,2.4rem)] uppercase leading-[1.02] text-cream">
            When should we see you?
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            {chosen.length} {chosen.length === 1 ? "service" : "services"} ·{" "}
            {formatMinutes(totalMinutes)} · {formatNaira(total)}
          </p>

          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Day
          </p>
          <div className="no-scrollbar -mx-5 mt-2.5 flex gap-2.5 overflow-x-auto px-5 pb-1 sm:-mx-0 sm:px-0">
            {days.map((item) => {
              const active = item.id === dayId;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => pickDay(item.id)}
                  className={`flex min-w-[62px] shrink-0 flex-col items-center gap-0.5 rounded-2xl border px-4 py-2.5 transition-colors ${
                    active
                      ? "border-pink bg-pink text-canvas"
                      : "border-white/8 bg-surface text-cream hover:border-white/25"
                  }`}
                >
                  <span
                    className={`text-[10px] uppercase tracking-[0.14em] ${
                      active ? "text-canvas/70" : "text-muted"
                    }`}
                  >
                    {item.weekday}
                  </span>
                  <span className="text-[16px] font-semibold leading-tight">
                    {item.day}
                  </span>
                  <span
                    className={`text-[10px] uppercase tracking-[0.14em] ${
                      active ? "text-canvas/70" : "text-muted"
                    }`}
                  >
                    {item.month}
                  </span>
                </button>
              );
            })}
          </div>

          {slotsLoading ? (
            <p className="mt-3 text-[14px] text-muted">Loading open times…</p>
          ) : slotsError ? (
            <p className="mt-3 text-[14px] text-pink">{slotsError}</p>
          ) : days.length === 0 ? (
            <p className="mt-3 text-[14px] text-muted">
              {slots.length > 0
                ? "No open times are long enough for your selection. Please call the studio."
                : "No open times yet — please check back soon or call the studio."}
            </p>
          ) : null}

          <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Time
          </p>
          {day ? (
            <div className="mt-2.5 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {slotsForDay.map((slot) => {
                const active = slot.time === time;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => pickTime(slot.time)}
                    className={`rounded-full border py-2.5 text-[13px] font-medium tabular-nums transition-colors ${
                      active
                        ? "border-pink bg-pink text-canvas"
                        : "border-white/12 bg-surface text-cream hover:border-pink/60"
                    }`}
                  >
                    {slot.time}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="mt-3 text-[14px] text-muted">
              Choose a day to see open times.
            </p>
          )}
          <p className="mt-3 text-[12px] text-muted/80">
            Only open times are shown. Booked times disappear automatically.
          </p>
        </div>
      ) : null}

      {/* ------------------------------ 3 — Details ------------------------------- */}
      {step === 2 ? (
        <div className="mt-7">
          <h2 className="font-display text-[clamp(1.7rem,4.6vw,2.4rem)] uppercase leading-[1.02] text-cream">
            Last bit — who are we booking?
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            No account, no password. Just a name and number so we can hold your
            slot.
          </p>

          {remembered ? (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-surface px-4 py-3">
              <p className="text-[13px] text-muted">
                We remembered you on this device.
              </p>
              <button
                type="button"
                onClick={forgetGuest}
                className="text-[12px] text-cream underline underline-offset-4 transition-colors hover:text-pink"
              >
                Not you? Start fresh
              </button>
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-5">
            <label className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                Full name
              </span>
              <input
                id="guest-name"
                type="text"
                autoComplete="name"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "guest-name-error" : undefined}
                className={`${inputBase} ${
                  errors.name ? "border-pink" : ""
                }`}
                {...register("name", {
                  required: "Please enter your name.",
                  minLength: {
                    value: 2,
                    message: "Please enter your name (at least 2 characters).",
                  },
                })}
              />
              {errors.name ? (
                <span
                  id="guest-name-error"
                  role="alert"
                  className="text-[12.5px] text-pink"
                >
                  {errors.name.message}
                </span>
              ) : null}
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                Phone number
              </span>
              <input
                id="guest-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "guest-phone-error" : undefined}
                className={`${inputBase} ${errors.phone ? "border-pink" : ""}`}
                {...register("phone", {
                  required: "Enter a phone number.",
                  validate: (value) =>
                    value.replace(/\D/g, "").length >= 7 ||
                    "Enter a phone number with at least 7 digits.",
                })}
              />
              {errors.phone ? (
                <span
                  id="guest-phone-error"
                  role="alert"
                  className="text-[12.5px] text-pink"
                >
                  {errors.phone.message}
                </span>
              ) : null}
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                Anything we should know? (optional)
              </span>
              <textarea
                id="guest-note"
                rows={4}
                placeholder="Inspiration, allergies, a reference photo — anything that helps."
                className={`${inputBase} resize-y leading-relaxed`}
                {...register("note")}
              />
            </label>
          </div>
        </div>
      ) : null}

      {submitError ? (
        <p
          role="alert"
          className="mt-6 rounded-2xl border border-pink/40 bg-pink/10 px-4 py-3 text-[13px] leading-relaxed text-pink"
        >
          {submitError}
        </p>
      ) : null}

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-surface/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[760px] items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <p className="min-w-0 truncate text-[13px] text-muted">{status}</p>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed}
            className={nextButton}
          >
            {createBooking.isPending ? (
              "Booking…"
            ) : step === 0 ? (
              <span className="flex items-center gap-2">
                Next
                <span aria-hidden="true">→</span>
              </span>
            ) : step === 1 ? (
              <span className="flex items-center gap-2">
                Next
                <span aria-hidden="true">→</span>
              </span>
            ) : (
              "Confirm booking"
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
