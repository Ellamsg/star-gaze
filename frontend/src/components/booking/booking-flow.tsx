// "use client";

// import { useEffect, useMemo, useState, type ChangeEvent } from "react";
// import Link from "next/link";
// import { useForm } from "react-hook-form";
// import { MAX_PHOTOS, thumbUrl, uploadPhoto, type UploadedPhoto } from "@/lib/upload-photo";
// import { Spinner } from "@/components/spinner";
// import { MonthCalendar, monthFromKey } from "@/components/availability/month-calendar";
// import { formatNaira, studio } from "@/data/site";
// import { useCreateAppointment } from "@/hooks/use-appointments";
// import { usePublicDay, usePublicMonth } from "@/hooks/use-availability";
// import { useCategories } from "@/hooks/use-categories";
// import { useServices } from "@/hooks/use-services";
// import { dayKey, formatDuration, todayKey } from "@/lib/date";
// import type { BookedService, GuestFormValues } from "@/types/appointment";
// import type { BookingStep, DayOption } from "@/types/booking";
// import type { ServiceDTO } from "@/types/service";

// import { BookingConfirmation } from "./booking-confirmation";
// import { PriceBreakdown } from "./price-breakdown";
// import { StepProgress } from "./step-progress";
// import { backButton, inputBase, nextButton } from "./ui";

// const TOTAL_STEPS = 3;
// const GUEST_KEY = "petal.guest";

// function persistGuest(name: string, phone: string) {
//   try {
//     window.localStorage.setItem(
//       GUEST_KEY,
//       JSON.stringify({ name: name.trim(), phone: phone.trim() }),
//     );
//   } catch {
//     /* storage blocked — the booking still works for this session */
//   }
// }

// export function BookingFlow() {
//   const [step, setStep] = useState<BookingStep>(0);

//   const [selectedIds, setSelectedIds] = useState<string[]>([]);
//   const [categoryFilter, setCategoryFilter] = useState<string>("all");
//   // const [photoName, setPhotoName] = useState<string | null>(null);
// const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
// const [uploadingPhoto, setUploadingPhoto] = useState(false);
// const [photoError, setPhotoError] = useState<string | null>(null);
//   const [month, setMonth] = useState<string>("");
//   const [selectedDate, setSelectedDate] = useState<string | null>(null);
//   const [time, setTime] = useState<string | null>(null);

//   const [remembered, setRemembered] = useState(false);
//   const [reference, setReference] = useState<string | null>(null);

//   const [booked, setBooked] = useState<{
//     services: BookedService[];
//     total: number;
//     day: DayOption;
//     time: string;
//     createdAt: string;
//   } | null>(null);
//   const [submitError, setSubmitError] = useState<string | null>(null);

//   /* ---- data from TanStack Query ---- */
//   const {
//     data: services = [],
//     isPending: servicesLoading,
//     error: servicesQueryError,
//   } = useServices({ active: true });
//   const { data: categories = [] } = useCategories({ active: true });
//   const createBooking = useCreateAppointment();

//   const servicesError =
//     servicesQueryError instanceof Error
//       ? servicesQueryError.message
//       : servicesQueryError
//         ? "Could not load services."
//         : null;

//   /* ---- guest details form ---- */
//   const {
//     register,
//     handleSubmit,
//     reset,
//     getValues,
//     formState: { errors },
//   } = useForm<GuestFormValues>({
//     defaultValues: { name: "", phone: "", note: "" },
//   });

//   /* The calendar starts on the current month once the page is in the browser. */
//   useEffect(() => {
//     // eslint-disable-next-line react-hooks/set-state-in-effect
//     setMonth((current) => current || todayKey().slice(0, 7));
//   }, []);

//   /* Prefill the guest details from this device — the stand-in for "logging in". */
//   useEffect(() => {
//     try {
//       const raw = window.localStorage.getItem(GUEST_KEY);
//       if (!raw) return;
//       const parsed = JSON.parse(raw) as { name?: unknown; phone?: unknown };
//       const nextName = typeof parsed.name === "string" ? parsed.name : "";
//       const nextPhone = typeof parsed.phone === "string" ? parsed.phone : "";
//       if (!nextName && !nextPhone) return;

//       // Device-local data can only be read after hydration.
//       reset({ name: nextName, phone: nextPhone, note: "" });
//       // eslint-disable-next-line react-hooks/set-state-in-effect
//       setRemembered(true);
//     } catch {
//       /* malformed or unavailable storage — start blank */
//     }
//   }, [reset]);

//   const chosen: ServiceDTO[] = useMemo(
//     () => services.filter((service) => selectedIds.includes(service.id)),
//     [services, selectedIds],
//   );

//   /* Category tabs only earn their space once there's more than one category. */
//   const showTabs = categories.length > 1;
//   const activeFilter =
//     categoryFilter === "all" ||
//     categories.some((category) => category.id === categoryFilter)
//       ? categoryFilter
//       : "all";

//   const visibleServices = useMemo(
//     () =>
//       showTabs && activeFilter !== "all"
//         ? services.filter((service) => service.categoryId === activeFilter)
//         : services,
//     [services, showTabs, activeFilter],
//   );

//   const total = useMemo(
//     () => chosen.reduce((sum, item) => sum + item.price, 0),
//     [chosen],
//   );

//   const totalMinutes = useMemo(
//     () => chosen.reduce((sum, item) => sum + item.durationMin, 0),
//     [chosen],
//   );

//   /* The API needs a duration to know which start times still fit. */
//   const chairMinutes = Math.max(totalMinutes, 30);

//   const {
//     data: monthData,
//     isPending: monthLoading,
//     error: monthQueryError,
//   } = usePublicMonth(month, chairMinutes);

//   const {
//     data: dayData,
//     isPending: dayLoading,
//     error: dayQueryError,
//   } = usePublicDay(selectedDate, chairMinutes);

//   const availabilityError =
//     monthQueryError instanceof Error
//       ? monthQueryError.message
//       : monthQueryError
//         ? "Could not load the calendar."
//         : dayQueryError instanceof Error
//           ? dayQueryError.message
//           : dayQueryError
//             ? "Could not load those times."
//             : null;

//   /* Once a month loads, open the first bookable day so times appear at once. */
//   useEffect(() => {
//     if (!monthData || selectedDate) return;
//     const firstOpen = monthData.days.find((item) => item.status === "open");
//     if (firstOpen) {
//       // eslint-disable-next-line react-hooks/set-state-in-effect
//       setSelectedDate(firstOpen.date);
//     }
//   }, [monthData, selectedDate]);

//   const day = useMemo<DayOption | null>(
//     () => (selectedDate ? dayOptionFromKey(selectedDate) : null),
//     [selectedDate],
//   );

//   const slotsForDay = useMemo(() => dayData?.times ?? [], [dayData]);

//   const chosenSlot = useMemo(
//     () => slotsForDay.find((slot) => slot.time === time) ?? null,
//     [slotsForDay, time],
//   );

//   const canProceed =
//     step === 0
//   ? !servicesLoading && selectedIds.length > 0 && !uploadingPhoto
//       : step === 1
//         ? Boolean(chosenSlot)
//         : !createBooking.isPending;

//   const status =
//     step === 0
//       ? selectedIds.length > 0
//         ? `${selectedIds.length} ${
//             selectedIds.length === 1 ? "service" : "services"
//           } · ${formatNaira(total)}`
//         : "Choose a service to start"
//       : step === 1
//         ? day
//           ? `${day.weekday} ${day.day} ${day.month}${time ? ` · ${time}` : ""}`
//           : "Pick a day and a time"
//         : `Total ${formatNaira(total)} · paid in studio`;

//   function toggleService(id: string) {
//     setSelectedIds((current) =>
//       current.includes(id)
//         ? current.filter((item) => item !== id)
//         : [...current, id],
//     );
//     // Slot length depends on the services, so make the client re-pick a time.
//     setSelectedDate(null);
//     setTime(null);
//     setReference(null);
//   }

//   function pickDay(id: string) {
//     setSelectedDate(id);
//     setTime(null); // the open times depend on the day
//     setReference(null);
//   }

//   function changeMonth(next: string) {
//     setMonth(next);
//     setSelectedDate(null);
//     setTime(null);
//     setReference(null);
//   }

//   function pickTime(value: string) {
//     setTime(value);
//     setReference(null);
//   }

//   function goToStep(next: BookingStep) {
//     setStep(next);
//     window.scrollTo({ top: 0, behavior: "smooth" });
//   }

//   function handleBack() {
//     if (step === 0) return;
//     goToStep(step === 2 ? 1 : 0);
//   }

//   const submitBooking = handleSubmit(async (values) => {
//     if (!chosenSlot) {
//       setSubmitError("Pick a time again — that slot is no longer available.");
//       return;
//     }

//     if (chosen.length !== selectedIds.length) {
//       setSubmitError(
//         "One of the selected services is no longer available. Please pick again.",
//       );
//       return;
//     }

//     // Capture the chosen day now: once the booking lands, the time is no longer
//     // open, so it drops out of the calendar and would fall back to today.
//     if (!selectedDate) {
//       setSubmitError("Pick a day and time again — that time is no longer available.");
//       return;
//     }
//     const bookedDay = dayOptionFromKey(selectedDate);

//     setSubmitError(null);

//     try {
//       const appointment = await createBooking.mutateAsync({
//         date: selectedDate,
//         time: chosenSlot.time,
//         serviceIds: chosen.map((service) => service.id),
//         name: values.name.trim(),
//         phone: values.phone.trim(),
//         note: values.note.trim() || undefined,
//           photoIds: photos.map((photo) => photo.publicId),
//       });

//       persistGuest(values.name, values.phone);
//       setRemembered(true);
//       setBooked({
//         services: appointment.services,
//         total: appointment.price,
//         day: bookedDay,
//         time: chosenSlot.time,
//         createdAt: appointment.createdAt,
//       });
//       setReference(appointment.reference);
//     } catch (error) {
//       setSubmitError(
//         error instanceof Error
//           ? error.message
//           : "Could not confirm your booking. Please try again.",
//       );
//       // Someone may have taken the slot while the form was being filled in.
//       setTime(null);
//     }
//   });

//   function handleNext() {
//     if (!canProceed) return;

//     if (step === 0) {
//       goToStep(1);
//       return;
//     }

//     if (step === 1) {
//       goToStep(2);
//       return;
//     }

//     void submitBooking();
//   }

//  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
//   const files = Array.from(event.target.files ?? []);
//   event.target.value = ""; // lets the same file be picked again
//   if (files.length === 0) return;

//   const room = MAX_PHOTOS - photos.length;
//   if (room <= 0) {
//     setPhotoError(`You can add up to ${MAX_PHOTOS} photos.`);
//     return;
//   }

//   setPhotoError(null);
//   setUploadingPhoto(true);
//   try {
//     for (const file of files.slice(0, room)) {
//       const uploaded = await uploadPhoto(file);
//       setPhotos((current) => [...current, uploaded]);
//     }
//   } catch (error) {
//     setPhotoError(error instanceof Error ? error.message : "Upload failed.");
//   } finally {
//     setUploadingPhoto(false);
//   }
// }

// function removePhoto(publicId: string) {
//   setPhotos((current) => current.filter((p) => p.publicId !== publicId));
// }

//   function forgetGuest() {
//     try {
//       window.localStorage.removeItem(GUEST_KEY);
//     } catch {
//       /* storage unavailable — nothing to clear */
//     }
//     setRemembered(false);
//     reset({ name: "", phone: "", note: "" });
//   }

//   function resetFlow() {
//     setStep(0);
//     setSelectedIds([]);
// setPhotos([]);
// setPhotoError(null);
//     setSelectedDate(null);
//     setTime(null);
//     setReference(null);
//     setBooked(null);
//     setSubmitError(null);
//     reset({ name: "", phone: "", note: "" });
//   }

//   if (reference && booked) {
//     return (
//       <BookingConfirmation
//         reference={reference}
//         services={booked.services}
//         day={booked.day}
//         time={booked.time}
//         createdAt={booked.createdAt}
//         name={getValues("name")}
//         phone={getValues("phone")}
//         note={getValues("note")}
//       photoName={
//   photos.length > 0
//     ? `${photos.length} ${photos.length === 1 ? "photo" : "photos"} attached`
//     : null
// }
//         total={booked.total}
//         onBookAnother={resetFlow}
//       />
//     );
//   }

//   return (
//     <section className="mx-auto w-full max-w-[760px] px-5 pb-36 pt-7 sm:px-8 sm:pt-9">
//       <Link
//         href="/"
//         className="inline-block font-serif text-[15px] italic leading-none text-pink underline-offset-4 transition-opacity hover:opacity-80 hover:underline"
//       >
//         ‹ {studio.name}
//       </Link>

//       <h1 className="mt-4 font-display text-[clamp(2.75rem,7vw,4.75rem)] uppercase leading-[0.9] text-cream">
//         Book your visit
//       </h1>
//       <p className="mt-3 max-w-[30rem] text-[14px] leading-relaxed text-muted sm:text-[15px]">
//         No account needed. Just pick, choose a time, and you&rsquo;re done.
//       </p>

//       <div className="mt-6">
//         <StepProgress total={TOTAL_STEPS} current={step} />
//       </div>

//       {/* ------------------------------- 1 — Services ------------------------------ */}
//       {step === 0 ? (
//         <div className="mt-7">
//           <h2 className="font-display text-[clamp(1.7rem,4.6vw,2.4rem)] uppercase leading-[1.02] text-cream">
//             What are we treating you to?
//           </h2>
//           <p className="mt-2 text-[14px] leading-relaxed text-muted">
//             Pick as many as you like — one visit, one total.
//           </p>

//           {servicesLoading ? (
//             <ServicesSkeleton />
//           ) : servicesError ? (
//             <p
//               role="alert"
//               className="mt-5 rounded-2xl border border-pink/40 bg-pink/10 px-4 py-3 text-[13px] leading-relaxed text-pink"
//             >
//               {servicesError}
//             </p>
//           ) : services.length === 0 ? (
//             <p className="mt-5 text-[14px] leading-relaxed text-muted">
//               Nothing is bookable right now. Please check back soon or call the
//               studio.
//             </p>
//           ) : (
//             <>
//               {showTabs ? (
//                 <div
//                   role="tablist"
//                   aria-label="Service categories"
//                   className="-mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:-mx-8 sm:px-8"
//                 >
//                   {[{ id: "all", name: "All" }, ...categories].map((category) => {
//                     const active = activeFilter === category.id;
//                     return (
//                       <button
//                         key={category.id}
//                         type="button"
//                         role="tab"
//                         aria-selected={active}
//                         onClick={() => setCategoryFilter(category.id)}
//                         className={`shrink-0 rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${
//                           active
//                             ? "border-pink/70 bg-pink/15 text-pink"
//                             : "border-white/10 bg-surface text-muted hover:border-white/25 hover:text-cream"
//                         }`}
//                       >
//                         {category.name}
//                       </button>
//                     );
//                   })}
//                 </div>
//               ) : null}

//               {visibleServices.length === 0 ? (
//                 <p className="mt-4 text-[14px] leading-relaxed text-muted">
//                   Nothing in this category yet — try another tab.
//                 </p>
//               ) : (
//                 <ul className="mt-4 flex flex-col gap-2.5">
//                   {visibleServices.map((item) => {
//                     const active = selectedIds.includes(item.id);
//                     return (
//                       <li key={item.id}>
//                         <button
//                           type="button"
//                           aria-pressed={active}
//                           onClick={() => toggleService(item.id)}
//                           className={`flex w-full items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-left transition-colors ${
//                             active
//                               ? "border-pink/70 bg-pink/10"
//                               : "border-white/5 bg-surface hover:border-white/20"
//                           }`}
//                         >
//                           <span>
//                             <span className="block text-[14.5px] font-semibold leading-snug text-cream">
//                               {item.name}
//                             </span>
//                             <span className="mt-1 block text-[12.5px] text-muted">
//                               {formatDuration(item.durationMin)}
//                             </span>
//                           </span>
//                           <span className="whitespace-nowrap text-[14px] font-semibold tabular-nums text-pink">
//                             {formatNaira(item.price)}
//                           </span>
//                         </button>
//                       </li>
//                     );
//                   })}
//                 </ul>
//               )}
//             </>
//           )}

          
//           <div className="mt-8">
//   <h3 className="font-display text-[clamp(1.4rem,4vw,1.8rem)] uppercase leading-none text-cream">
//     Got a design in mind?
//   </h3>
//   <p className="mt-2 text-[14px] text-muted">
//     Add up to {MAX_PHOTOS} photos and we&rsquo;ll match them. Optional.
//   </p>

//   {photos.length > 0 ? (
//     <ul className="mt-4 flex flex-wrap gap-3">
//       {photos.map((photo) => (
//         <li key={photo.publicId} className="relative">
//           {/* eslint-disable-next-line @next/next/no-img-element */}
//           <img
//             src={thumbUrl(photo.url)}
//             alt={photo.name}
//             className="h-24 w-24 rounded-2xl border border-white/10 object-cover"
//           />
//           <button
//             type="button"
//             onClick={() => removePhoto(photo.publicId)}
//             aria-label={`Remove ${photo.name}`}
//             className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-canvas text-[13px] text-cream ring-1 ring-white/20 hover:text-pink"
//           >
//             ×
//           </button>
//         </li>
//       ))}
//     </ul>
//   ) : null}

//   {photos.length < MAX_PHOTOS ? (

//     <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-pink/45 bg-surface/60 px-6 py-8 text-center transition-colors hover:border-pink/80">
//       <input
//         type="file"
//         accept="image/*"
//         multiple
//         className="sr-only"
//         onChange={handlePhoto}
//         disabled={uploadingPhoto}
//       />
//       {uploadingPhoto ? (
//         <span className="flex items-center gap-2 text-[14px] font-semibold text-cream">
//           <Spinner size={15} /> Uploading…
//         </span>
//       ) : (
//         <>
//           <span aria-hidden="true" className="text-[26px] leading-none text-pink">+</span>
//           <span className="mt-3 text-[14px] font-semibold text-cream">Upload a photo</span>
//           <span className="mt-1 text-[12.5px] leading-relaxed text-muted">
//             Screenshots from Pinterest or Instagram work great
//           </span>
//         </>
//       )}
//     </label>
//   ) : null}

//   {photoError ? (
//     <p role="alert" className="mt-3 text-[13px] text-pink">{photoError}</p>
//   ) : null}
// </div>
//         </div>
//       ) : null}

//       {/* ------------------------------- 2 — Time --------------------------------- */}
//       {step === 1 ? (
//         <div className="mt-7">
//           <h2 className="font-display text-[clamp(1.7rem,4.6vw,2.4rem)] uppercase leading-[1.02] text-cream">
//             When should we see you?
//           </h2>
//           <p className="mt-2 text-[14px] leading-relaxed text-muted">
//             {chosen.length} {chosen.length === 1 ? "service" : "services"} ·{" "}
//             {formatDuration(totalMinutes)} in the chair
//           </p>

//           <PriceBreakdown
//             className="mt-4"
//             services={chosen}
//             total={total}
//             label="Total"
//           />

//           <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
//             Day
//           </p>

//           <div className="mt-2.5">
//             {month ? (
//               <MonthCalendar
//                 month={month}
//                 days={monthData?.days ?? []}
//                 selected={selectedDate}
//                 onSelect={pickDay}
//                 onMonthChange={changeMonth}
//                 minMonth={todayKey().slice(0, 7)}
//                 maxMonth={monthFromKey(
//                   dayKey(monthData?.settings.horizonDays ?? 180),
//                 )}
//                 loading={monthLoading}
//                 mode="public"
//               />
//             ) : (
//               <div className="h-[360px] animate-pulse rounded-[24px] bg-white/[0.06]" />
//             )}
//           </div>

//           {!monthLoading &&
//           monthData &&
//           monthData.days.every((item) => item.status !== "open") ? (
//             <p className="mt-3 text-[13px] leading-relaxed text-muted">
//               Nothing is open this month — try the next one.
//             </p>
//           ) : null}

//           {!monthLoading && availabilityError ? (
//             <p className="mt-3 text-[14px] text-pink">{availabilityError}</p>
//           ) : null}

//           <div className="mt-7 flex flex-wrap items-baseline justify-between gap-2">
//             <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
//               Time
//             </p>
//             {day ? (
//               <p className="text-[12px] text-muted">
//                 {day.weekday} {day.day} {day.month}
//               </p>
//             ) : null}
//           </div>

//           {!selectedDate || dayLoading ? (
//             <div
//               role="status"
//               aria-label="Loading open times"
//               className="mt-2.5 grid grid-cols-3 gap-2.5 sm:grid-cols-4"
//             >
//               {Array.from({ length: 8 }).map((_, index) => (
//                 <div
//                   key={index}
//                   className="h-[42px] animate-pulse rounded-full bg-white/[0.06]"
//                 />
//               ))}
//             </div>
//           ) : slotsForDay.length > 0 ? (
//             <div className="mt-2.5 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
//               {slotsForDay.map((slot) => {
//                 const active = slot.time === time;
//                 return (
//                   <button
//                     key={slot.time}
//                     type="button"
//                     aria-pressed={active}
//                     onClick={() => pickTime(slot.time)}
//                     className={`rounded-full border py-2.5 text-[13px] font-medium tabular-nums transition-colors ${
//                       active
//                         ? "border-pink bg-pink text-canvas"
//                         : "border-white/12 bg-surface text-cream hover:border-pink/60"
//                     }`}
//                   >
//                     {slot.time}
//                   </button>
//                 );
//               })}
//             </div>
//           ) : (
//             <p className="mt-3 text-[14px] leading-relaxed text-muted">
//               This day has no open times long enough for your selection (
//               {formatDuration(totalMinutes)}). Pick another day or go back and
//               choose fewer services.
//             </p>
//           )}
//           <p className="mt-3 text-[12px] text-muted/80">
//             Only open times are shown. Booked times disappear automatically.
//           </p>
//         </div>
//       ) : null}

//       {/* ------------------------------ 3 — Details ------------------------------- */}
//       {step === 2 ? (
//         <div className="mt-7">
//           <h2 className="font-display text-[clamp(1.7rem,4.6vw,2.4rem)] uppercase leading-[1.02] text-cream">
//             Last bit — who are we booking?
//           </h2>
//           <p className="mt-2 text-[14px] leading-relaxed text-muted">
//             No account, no password. Just a name and number so we can hold your
//             slot.
//           </p>

//           {remembered ? (
//             <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-surface px-4 py-3">
//               <p className="text-[13px] text-muted">
//                 We remembered you on this device.
//               </p>
//               <button
//                 type="button"
//                 onClick={forgetGuest}
//                 className="text-[12px] text-cream underline underline-offset-4 transition-colors hover:text-pink"
//               >
//                 Not you? Start fresh
//               </button>
//             </div>
//           ) : null}

//           <PriceBreakdown
//             className="mt-5"
//             services={chosen}
//             total={total}
//             label="Total due in studio"
//           />

//           <div className="mt-6 flex flex-col gap-5">
//             <label className="flex flex-col gap-2">
//               <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
//                 Full name
//               </span>
//               <input
//                 id="guest-name"
//                 type="text"
//                 autoComplete="name"
//                 aria-invalid={Boolean(errors.name)}
//                 aria-describedby={errors.name ? "guest-name-error" : undefined}
//                 className={`${inputBase} ${
//                   errors.name ? "border-pink" : ""
//                 }`}
//                 {...register("name", {
//                   required: "Please enter your name.",
//                   minLength: {
//                     value: 2,
//                     message: "Please enter your name (at least 2 characters).",
//                   },
//                 })}
//               />
//               {errors.name ? (
//                 <span
//                   id="guest-name-error"
//                   role="alert"
//                   className="text-[12.5px] text-pink"
//                 >
//                   {errors.name.message}
//                 </span>
//               ) : null}
//             </label>

//             <label className="flex flex-col gap-2">
//               <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
//                 Phone number
//               </span>
//               <input
//                 id="guest-phone"
//                 type="tel"
//                 inputMode="tel"
//                 autoComplete="tel"
//                 aria-invalid={Boolean(errors.phone)}
//                 aria-describedby={errors.phone ? "guest-phone-error" : undefined}
//                 className={`${inputBase} ${errors.phone ? "border-pink" : ""}`}
//                 {...register("phone", {
//                   required: "Enter a phone number.",
//                   validate: (value) =>
//                     value.replace(/\D/g, "").length >= 7 ||
//                     "Enter a phone number with at least 7 digits.",
//                 })}
//               />
//               {errors.phone ? (
//                 <span
//                   id="guest-phone-error"
//                   role="alert"
//                   className="text-[12.5px] text-pink"
//                 >
//                   {errors.phone.message}
//                 </span>
//               ) : null}
//             </label>

//             <label className="flex flex-col gap-2">
//               <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
//                 Anything we should know? (optional)
//               </span>
//               <textarea
//                 id="guest-note"
//                 rows={4}
//                 placeholder="Inspiration, allergies, a reference photo — anything that helps."
//                 className={`${inputBase} resize-y leading-relaxed`}
//                 {...register("note")}
//               />
//             </label>
//           </div>
//         </div>
//       ) : null}

//       {submitError ? (
//         <p
//           role="alert"
//           className="mt-6 rounded-2xl border border-pink/40 bg-pink/10 px-4 py-3 text-[13px] leading-relaxed text-pink"
//         >
//           {submitError}
//         </p>
//       ) : null}

//       {/* Sticky action bar */}
//       <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-surface/95 backdrop-blur-md">
//         <div className="mx-auto flex w-full max-w-[760px] items-center gap-3 px-5 py-3.5 sm:px-8">
//           {step > 0 ? (
//             <button
//               type="button"
//               onClick={handleBack}
//               disabled={createBooking.isPending}
//               className={backButton}
//             >
//               <span aria-hidden="true">←</span> Back
//             </button>
//           ) : null}

//           <p className="min-w-0 flex-1 truncate text-[13px] text-muted">{status}</p>

//           <button
//             type="button"
//             onClick={handleNext}
//             disabled={!canProceed}
//             aria-busy={createBooking.isPending || undefined}
//             className={nextButton}
//           >
//             {createBooking.isPending ? (
//               <span className="flex items-center gap-2">
//                 <Spinner size={15} />
//                 Booking…
//               </span>
//             ) : step === 0 || step === 1 ? (
//               <span className="flex items-center gap-2">
//                 Next
//                 <span aria-hidden="true">→</span>
//               </span>
//             ) : (
//               "Confirm booking"
//             )}
//           </button>
//         </div>
//       </div>
//     </section>
//   );
// }

// /* -------------------------------------------------------------------------- */
// /*  Helpers                                                                    */
// /* -------------------------------------------------------------------------- */

// function dayOptionFromKey(key: string): DayOption {
//   const date = new Date(`${key}T12:00:00`);
//   return {
//     id: key,
//     weekday: date.toLocaleDateString("en-GB", { weekday: "short" }),
//     day: String(date.getDate()),
//     month: date.toLocaleDateString("en-GB", { month: "short" }),
//   };
// }

// /* -------------------------------------------------------------------------- */
// /*  Skeleton                                                                   */
// /* -------------------------------------------------------------------------- */

// function ServicesSkeleton() {
//   return (
//     <ul
//       role="status"
//       aria-label="Loading services"
//       className="mt-4 flex flex-col gap-2.5"
//     >
//       {Array.from({ length: 4 }).map((_, index) => (
//         <li
//           key={index}
//           className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-surface px-5 py-4"
//         >
//           <div className="w-full space-y-2">
//             <div className="h-3.5 w-2/5 animate-pulse rounded-full bg-white/10" />
//             <div className="h-3 w-1/5 animate-pulse rounded-full bg-white/[0.06]" />
//           </div>
//           <div className="h-3.5 w-16 shrink-0 animate-pulse rounded-full bg-white/10" />
//         </li>
//       ))}
//     </ul>
//   );
// }


"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { MAX_PHOTOS, thumbUrl, uploadPhoto, type UploadedPhoto } from "@/lib/upload-photo";
import { Spinner } from "@/components/spinner";
import { MonthCalendar, monthFromKey } from "@/components/availability/month-calendar";
import { formatNaira, studio } from "@/data/site";
import { useCreateAppointment } from "@/hooks/use-appointments";
import { usePublicDay, usePublicMonth } from "@/hooks/use-availability";
import { useCategories } from "@/hooks/use-categories";
import { useServices } from "@/hooks/use-services";
import { dayKey, formatDuration, todayKey } from "@/lib/date";
import type { BookedService, GuestFormValues } from "@/types/appointment";
import type { BookingStep, DayOption } from "@/types/booking";
import type { ServiceDTO } from "@/types/service";

import { BookingConfirmation } from "./booking-confirmation";
import { PriceBreakdown } from "./price-breakdown";
import { StepProgress } from "./step-progress";
import { backButton, inputBase, nextButton } from "./ui";

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

export function BookingFlow() {
  const [step, setStep] = useState<BookingStep>(0);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [month, setMonth] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);

  const [remembered, setRemembered] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  const [booked, setBooked] = useState<{
    services: BookedService[];
    total: number;
    day: DayOption;
    time: string;
    createdAt: string;
  } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /* Used to bring the time slots into view right after a day is picked. */
  const timesRef = useRef<HTMLDivElement | null>(null);

  /* ---- data from TanStack Query ---- */
  const {
    data: services = [],
    isPending: servicesLoading,
    error: servicesQueryError,
  } = useServices({ active: true });
  const { data: categories = [] } = useCategories({ active: true });
  const createBooking = useCreateAppointment();

  const servicesError =
    servicesQueryError instanceof Error
      ? servicesQueryError.message
      : servicesQueryError
        ? "Could not load services."
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

  /* The calendar starts on the current month once the page is in the browser. */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMonth((current) => current || todayKey().slice(0, 7));
  }, []);

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

  const chosen: ServiceDTO[] = useMemo(
    () => services.filter((service) => selectedIds.includes(service.id)),
    [services, selectedIds],
  );

  /* Category tabs only earn their space once there's more than one category. */
  const showTabs = categories.length > 1;
  const activeFilter =
    categoryFilter === "all" ||
    categories.some((category) => category.id === categoryFilter)
      ? categoryFilter
      : "all";

  const visibleServices = useMemo(
    () =>
      showTabs && activeFilter !== "all"
        ? services.filter((service) => service.categoryId === activeFilter)
        : services,
    [services, showTabs, activeFilter],
  );

  const total = useMemo(
    () => chosen.reduce((sum, item) => sum + item.price, 0),
    [chosen],
  );

  const totalMinutes = useMemo(
    () => chosen.reduce((sum, item) => sum + item.durationMin, 0),
    [chosen],
  );

  /* The API needs a duration to know which start times still fit. */
  const chairMinutes = Math.max(totalMinutes, 30);

  const {
    data: monthData,
    isPending: monthLoading,
    error: monthQueryError,
  } = usePublicMonth(month, chairMinutes);

  const {
    data: dayData,
    isPending: dayLoading,
    error: dayQueryError,
  } = usePublicDay(selectedDate, chairMinutes);

  const availabilityError =
    monthQueryError instanceof Error
      ? monthQueryError.message
      : monthQueryError
        ? "Could not load the calendar."
        : dayQueryError instanceof Error
          ? dayQueryError.message
          : dayQueryError
            ? "Could not load those times."
            : null;

  /* When a day is picked, nudge the page so the times are visible without hunting. */
  useEffect(() => {
    if (step !== 1 || !selectedDate) return;
    const id = window.setTimeout(() => {
      timesRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 80);
    return () => window.clearTimeout(id);
  }, [selectedDate, step]);

  const slotsForDay = useMemo(() => dayData?.times ?? [], [dayData]);

  const chosenSlot = useMemo(
    () => slotsForDay.find((slot) => slot.time === time) ?? null,
    [slotsForDay, time],
  );

  const canProceed =
    step === 0
      ? !servicesLoading && selectedIds.length > 0 && !uploadingPhoto
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
        ? selectedDate
          ? `${formatFullDate(selectedDate)}${time ? ` · ${formatTime(time)}` : ""}`
          : "Pick a day and a time"
        : `Total ${formatNaira(total)} · paid in studio`;

  function toggleService(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
    // Slot length depends on the services, so make the client re-pick a time.
    setSelectedDate(null);
    setTime(null);
    setReference(null);
  }

  function pickDay(id: string) {
    setSelectedDate(id);
    setTime(null); // the open times depend on the day
    setReference(null);
  }

  function changeMonth(next: string) {
    setMonth(next);
    setSelectedDate(null);
    setTime(null);
    setReference(null);
  }

  function pickTime(value: string) {
    setTime(value);
    setReference(null);
  }

  function goToStep(next: BookingStep) {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBack() {
    if (step === 0) return;
    goToStep(step === 2 ? 1 : 0);
  }

  const submitBooking = handleSubmit(async (values) => {
    if (!chosenSlot) {
      setSubmitError("Pick a time again — that slot is no longer available.");
      return;
    }

    if (chosen.length !== selectedIds.length) {
      setSubmitError(
        "One of the selected services is no longer available. Please pick again.",
      );
      return;
    }

    // Capture the chosen day now: once the booking lands, the time is no longer
    // open, so it drops out of the calendar and would fall back to today.
    if (!selectedDate) {
      setSubmitError("Pick a day and time again — that time is no longer available.");
      return;
    }
    const bookedDay = dayOptionFromKey(selectedDate);

    setSubmitError(null);

    try {
      const appointment = await createBooking.mutateAsync({
        date: selectedDate,
        time: chosenSlot.time, // raw value from the API, unchanged
        serviceIds: chosen.map((service) => service.id),
        name: values.name.trim(),
        phone: values.phone.trim(),
        note: values.note.trim() || undefined,
        photoIds: photos.map((photo) => photo.publicId),
      });

      persistGuest(values.name, values.phone);
      setRemembered(true);
      setBooked({
        services: appointment.services,
        total: appointment.price,
        day: bookedDay,
        time: chosenSlot.time,
        createdAt: appointment.createdAt,
      });
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

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = ""; // lets the same file be picked again
    if (files.length === 0) return;

    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      setPhotoError(`You can add up to ${MAX_PHOTOS} photos.`);
      return;
    }

    setPhotoError(null);
    setUploadingPhoto(true);
    try {
      for (const file of files.slice(0, room)) {
        const uploaded = await uploadPhoto(file);
        setPhotos((current) => [...current, uploaded]);
      }
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  function removePhoto(publicId: string) {
    setPhotos((current) => current.filter((p) => p.publicId !== publicId));
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
    setSelectedIds([]);
    setPhotos([]);
    setPhotoError(null);
    setSelectedDate(null);
    setTime(null);
    setReference(null);
    setBooked(null);
    setSubmitError(null);
    reset({ name: "", phone: "", note: "" });
  }

  if (reference && booked) {
    return (
      <BookingConfirmation
        reference={reference}
        services={booked.services}
        day={booked.day}
        time={formatTime(booked.time)}
        createdAt={booked.createdAt}
        name={getValues("name")}
        phone={getValues("phone")}
        note={getValues("note")}
        photoName={
          photos.length > 0
            ? `${photos.length} ${photos.length === 1 ? "photo" : "photos"} attached`
            : null
        }
        total={booked.total}
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
            Pick as many as you like — one visit, one total.
          </p>

          {servicesLoading ? (
            <ServicesSkeleton />
          ) : servicesError ? (
            <p
              role="alert"
              className="mt-5 rounded-2xl border border-pink/40 bg-pink/10 px-4 py-3 text-[13px] leading-relaxed text-pink"
            >
              {servicesError}
            </p>
          ) : services.length === 0 ? (
            <p className="mt-5 text-[14px] leading-relaxed text-muted">
              Nothing is bookable right now. Please check back soon or call the
              studio.
            </p>
          ) : (
            <>
              {showTabs ? (
                <div
                  role="tablist"
                  aria-label="Service categories"
                  className="-mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:-mx-8 sm:px-8"
                >
                  {[{ id: "all", name: "All" }, ...categories].map((category) => {
                    const active = activeFilter === category.id;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setCategoryFilter(category.id)}
                        className={`shrink-0 rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${
                          active
                            ? "border-pink/70 bg-pink/15 text-pink"
                            : "border-white/10 bg-surface text-muted hover:border-white/25 hover:text-cream"
                        }`}
                      >
                        {category.name}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {visibleServices.length === 0 ? (
                <p className="mt-4 text-[14px] leading-relaxed text-muted">
                  Nothing in this category yet — try another tab.
                </p>
              ) : (
                <ul className="mt-4 flex flex-col gap-2.5">
                  {visibleServices.map((item) => {
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
                              {formatDuration(item.durationMin)}
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
              )}
            </>
          )}

          <div className="mt-8">
            <h3 className="font-display text-[clamp(1.4rem,4vw,1.8rem)] uppercase leading-none text-cream">
              Got a design in mind?
            </h3>
            <p className="mt-2 text-[14px] text-muted">
              Add up to {MAX_PHOTOS} photos and we&rsquo;ll match them. Optional.
            </p>

            {photos.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-3">
                {photos.map((photo) => (
                  <li key={photo.publicId} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbUrl(photo.url)}
                      alt={photo.name}
                      className="h-24 w-24 rounded-2xl border border-white/10 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.publicId)}
                      aria-label={`Remove ${photo.name}`}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-canvas text-[13px] text-cream ring-1 ring-white/20 hover:text-pink"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            {photos.length < MAX_PHOTOS ? (
              <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-pink/45 bg-surface/60 px-6 py-8 text-center transition-colors hover:border-pink/80">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={handlePhoto}
                  disabled={uploadingPhoto}
                />
                {uploadingPhoto ? (
                  <span className="flex items-center gap-2 text-[14px] font-semibold text-cream">
                    <Spinner size={15} /> Uploading…
                  </span>
                ) : (
                  <>
                    <span aria-hidden="true" className="text-[26px] leading-none text-pink">
                      +
                    </span>
                    <span className="mt-3 text-[14px] font-semibold text-cream">
                      Upload a photo
                    </span>
                    <span className="mt-1 text-[12.5px] leading-relaxed text-muted">
                      Screenshots from Pinterest or Instagram work great
                    </span>
                  </>
                )}
              </label>
            ) : null}

            {photoError ? (
              <p role="alert" className="mt-3 text-[13px] text-pink">
                {photoError}
              </p>
            ) : null}
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
            {formatDuration(totalMinutes)} in the chair
          </p>

          <PriceBreakdown
            className="mt-4"
            services={chosen}
            total={total}
            label="Total"
          />

          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Day
          </p>

          <div className="mt-2.5">
            {month ? (
              <MonthCalendar
                month={month}
                days={monthData?.days ?? []}
                selected={selectedDate}
                onSelect={pickDay}
                onMonthChange={changeMonth}
                minMonth={todayKey().slice(0, 7)}
                maxMonth={monthFromKey(
                  dayKey(monthData?.settings.horizonDays ?? 180),
                )}
                loading={monthLoading}
                mode="public"
              />
            ) : (
              <div className="h-[360px] animate-pulse rounded-[24px] bg-white/[0.06]" />
            )}
          </div>

          {!monthLoading &&
          monthData &&
          monthData.days.every((item) => item.status !== "open") ? (
            <p className="mt-3 text-[13px] leading-relaxed text-muted">
              Nothing is open this month — try the next one.
            </p>
          ) : null}

          {!monthLoading && availabilityError ? (
            <p className="mt-3 text-[14px] text-pink">{availabilityError}</p>
          ) : null}

          {/* Times only appear once a day has been picked. */}
          {selectedDate ? (
            <div ref={timesRef} className="scroll-mb-28">
              <div className="mt-7 flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Time
                </p>
                <p className="text-[12px] text-muted">
                  {formatFullDate(selectedDate)}
                </p>
              </div>

              {dayLoading ? (
                <div
                  role="status"
                  aria-label="Loading open times"
                  className="mt-2.5 grid grid-cols-3 gap-2.5 sm:grid-cols-4"
                >
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-[42px] animate-pulse rounded-full bg-white/[0.06]"
                    />
                  ))}
                </div>
              ) : slotsForDay.length > 0 ? (
                <div className="mt-2.5 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                  {slotsForDay.map((slot) => {
                    const active = slot.time === time;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        aria-pressed={active}
                        onClick={() => pickTime(slot.time)}
                        className={`rounded-full border py-2.5 text-[13px] font-medium tabular-nums transition-colors ${
                          active
                            ? "border-pink bg-pink text-canvas"
                            : "border-white/12 bg-surface text-cream hover:border-pink/60"
                        }`}
                      >
                        {formatTime(slot.time)}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-3 text-[14px] leading-relaxed text-muted">
                  This day has no open times long enough for your selection (
                  {formatDuration(totalMinutes)}). Pick another day or go back
                  and choose fewer services.
                </p>
              )}
              <p className="mt-3 text-[12px] text-muted/80">
                Only open times are shown. Booked times disappear automatically.
              </p>
            </div>
          ) : null}
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

          {/* Selected date & time, shown above the price summary */}
          {selectedDate && time ? (
            <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-pink/40 bg-pink/10 px-4 py-3.5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Your appointment
                </p>
                <p className="mt-1 text-[15px] font-semibold text-cream">
                  {formatFullDate(selectedDate)}
                </p>
              </div>
              <p className="text-[18px] font-semibold tabular-nums text-pink">
                {formatTime(time)}
              </p>
            </div>
          ) : null}

          <PriceBreakdown
            className="mt-3"
            services={chosen}
            total={total}
            label="Total due in studio"
          />

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
                className={`${inputBase} ${errors.name ? "border-pink" : ""}`}
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
        <div className="mx-auto flex w-full max-w-[760px] items-center gap-3 px-5 py-3.5 sm:px-8">
          {step > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={createBooking.isPending}
              className={backButton}
            >
              <span aria-hidden="true">←</span> Back
            </button>
          ) : null}

          <p className="min-w-0 flex-1 truncate text-[13px] text-muted">{status}</p>

          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed}
            aria-busy={createBooking.isPending || undefined}
            className={nextButton}
          >
            {createBooking.isPending ? (
              <span className="flex items-center gap-2">
                <Spinner size={15} />
                Booking…
              </span>
            ) : step === 0 || step === 1 ? (
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

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/*
 * Used for the confirmation screen. The year is folded into `month`
 * ("Nov 2026") so it shows up without changing the DayOption type.
 */
function dayOptionFromKey(key: string): DayOption {
  const date = new Date(`${key}T12:00:00`);
  return {
    id: key,
    weekday: date.toLocaleDateString("en-GB", { weekday: "short" }),
    day: String(date.getDate()),
    month: date.toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
  };
}

/* "09:30" or "14:00" → "9:30 AM" / "2:00 PM". Values that already have AM/PM are kept. */
function formatTime(value: string): string {
  const raw = value.trim();
  if (/am|pm/i.test(raw)) return raw.toUpperCase().replace(/\s*(AM|PM)/, " $1");
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return raw;
  const hours = Number(match[1]);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hours12}:${match[2]} ${suffix}`;
}

/* "2026-11-28" → "Sat 28 Nov 2026" */
function formatFullDate(key: string): string {
  return new Date(`${key}T12:00:00`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* -------------------------------------------------------------------------- */
/*  Skeleton                                                                   */
/* -------------------------------------------------------------------------- */

function ServicesSkeleton() {
  return (
    <ul
      role="status"
      aria-label="Loading services"
      className="mt-4 flex flex-col gap-2.5"
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <li
          key={index}
          className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-surface px-5 py-4"
        >
          <div className="w-full space-y-2">
            <div className="h-3.5 w-2/5 animate-pulse rounded-full bg-white/10" />
            <div className="h-3 w-1/5 animate-pulse rounded-full bg-white/[0.06]" />
          </div>
          <div className="h-3.5 w-16 shrink-0 animate-pulse rounded-full bg-white/10" />
        </li>
      ))}
    </ul>
  );
}