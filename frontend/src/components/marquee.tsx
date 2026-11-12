import { marqueeItems } from "@/data/site";

function Run() {
  const items = Array.from({ length: 3 }, () => marqueeItems).flat();

  return (
    <div className="flex shrink-0 items-center">
      {items.map((item, index) => (
        <span
          key={`${item}-${index}`}
          className="flex items-center gap-6 whitespace-nowrap pr-6 text-[13px] font-medium uppercase tracking-[0.08em] sm:text-[17px] lg:text-[18px]"
        >
          {item}
          <span aria-hidden="true" className="text-[11px] text-canvas/70">
            ✦
          </span>
        </span>
      ))}
    </div>
  );
}

export function Marquee() {
  return (
    <section
      aria-label="Nails and lashes, booked in one minute, no login needed"
      className="overflow-hidden border-y border-canvas/10 bg-cream py-6 text-canvas"
    >
      <div className="flex w-max animate-marquee">
        <Run />
        <div aria-hidden="true" className="flex">
          <Run />
        </div>
      </div>
    </section>
  );
}
