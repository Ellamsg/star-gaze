import { formatNaira } from "@/data/site";
import { formatDuration } from "@/lib/date";
import type { BookedService } from "@/types/appointment";

type PriceBreakdownProps = {
  services: BookedService[];
  total: number;
  label?: string;
  className?: string;
};

/**
 * Itemised price list: one row per service, then the total.
 *
 * Used before booking (live service prices) and after booking (the frozen
 * prices stored on the appointment), so the client always sees the maths.
 */
export function PriceBreakdown({
  services,
  total,
  label = "Total",
  className,
}: PriceBreakdownProps) {
  return (
    <div
      className={`rounded-2xl border border-white/8 bg-surface px-4 py-3.5 ${
        className ?? ""
      }`}
    >
      <ul className="space-y-2">
        {services.map((service) => (
          <li
            key={service.id}
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5"
          >
            <span className="min-w-0 text-[13.5px] leading-snug text-cream">
              {service.name}
              <span className="ml-2 whitespace-nowrap text-[11.5px] text-muted">
                {formatDuration(service.durationMin)}
              </span>
            </span>
            <span className="shrink-0 text-[13.5px] tabular-nums text-cream">
              {formatNaira(service.price)}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-2.5 flex items-baseline justify-between gap-4 border-t border-white/8 pt-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          {label}
        </span>
        <span className="text-[15px] font-semibold tabular-nums text-cream">
          {formatNaira(total)}
        </span>
      </div>
    </div>
  );
}
