import Link from "next/link";

import type { BookingDay, MenuItem } from "@/data/booking";
import { formatNaira, studio } from "@/data/site";

import { pillGhost, pillPink } from "./ui";

type BookingConfirmationProps = {
  reference: string;
  services: MenuItem[];
  day: BookingDay;
  time: string;
  name: string;
  phone: string;
  note: string;
  photoName: string | null;
  total: number;
  onBookAnother: () => void;
};

function DetailRow({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-white/8 py-4">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
        {label}
      </dt>
      <dd className="text-right text-[14px] leading-snug text-cream">
        {value}
        {sub ? (
          <span className="block text-[13px] text-muted">{sub}</span>
        ) : null}
      </dd>
    </div>
  );
}

export function BookingConfirmation({
  reference,
  services,
  day,
  time,
  name,
  phone,
  note,
  photoName,
  total,
  onBookAnother,
}: BookingConfirmationProps) {
  const firstName = name.trim().split(/\s+/)[0] || "there";

  return (
    <section className="mx-auto w-full max-w-[760px] px-5 pb-20 pt-8 sm:px-8 sm:pt-10">
      <p className="font-serif text-[16px] italic text-pink">Confirmed</p>
      <h1 className="mt-2 font-display text-[clamp(2.5rem,7vw,4rem)] uppercase leading-[0.9] text-cream">
        You&rsquo;re booked, {firstName}.
      </h1>
      <p className="mt-3 max-w-[32rem] text-[14px] leading-relaxed text-muted sm:text-[15px]">
        Your slot is held. Nothing was charged — quote the reference when you
        arrive and settle the total in the studio.
      </p>

      <div className="mt-7 rounded-2xl border border-pink/30 bg-surface px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
          Booking reference
        </p>
        <p className="mt-2 font-display text-[clamp(1.75rem,5vw,2.5rem)] leading-none tracking-[0.04em] text-pink">
          {reference}
        </p>
      </div>

      <dl className="mt-7">
        <DetailRow
          label="Services"
          value={services.map((item) => item.name).join(" + ")}
          sub={formatNaira(total)}
        />
        <DetailRow
          label="When"
          value={`${day.weekday} ${day.day} ${day.month} · ${time}`}
        />
        <DetailRow label="Guest" value={name.trim()} sub={phone.trim()} />
        {photoName ? <DetailRow label="Inspo photo" value={photoName} /> : null}
        {note.trim() ? <DetailRow label="Note" value={note.trim()} /> : null}
        <div className="flex items-baseline justify-between pt-4">
          <dt className="text-[13px] text-muted">Total due in studio</dt>
          <dd className="text-[16px] font-semibold tabular-nums text-cream">
            {formatNaira(total)}
          </dd>
        </div>
      </dl>

      <div className="mt-7 rounded-2xl border border-white/8 bg-surface px-5 py-4 text-[13.5px] leading-relaxed text-muted">
        <p className="font-semibold text-cream">
          {studio.name} · {studio.address}
        </p>
        <p className="mt-1">{studio.city}</p>
        <a
          href={`tel:${studio.phone.replace(/[^0-9+]/g, "")}`}
          className="mt-2 inline-block text-cream underline-offset-4 hover:text-pink hover:underline"
        >
          {studio.phone}
        </a>
      </div>

      <div className="mt-7 flex flex-wrap gap-3">
        <button type="button" onClick={onBookAnother} className={pillPink}>
          Book another
        </button>
        <Link href="/" className={pillGhost}>
          Back to home
        </Link>
      </div>
    </section>
  );
}
