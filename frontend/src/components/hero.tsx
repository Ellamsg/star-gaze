import Link from "next/link";

import { NailArt } from "@/components/ui/nail-art";
import { studio } from "@/data/site";

function PlayIcon() {
  return (
    <svg
      width="11"
      height="12"
      viewBox="0 0 11 12"
      fill="currentColor"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M0 0.8c0-.6.66-.97 1.17-.66l9.2 5.2a.78.78 0 0 1 0 1.32l-9.2 5.2A.78.78 0 0 1 0 11.2V0.8Z" />
    </svg>
  );
}

export function Hero() {
  return (
    <section
      id="top"
      className="mx-auto w-full max-w-[1500px] px-5 pb-10 pt-9 sm:px-8 sm:pb-14 sm:pt-12 lg:pb-16 lg:pt-14"
    >
      <div className="grid items-center gap-10 md:grid-cols-[1.02fr_0.98fr] md:gap-8 lg:gap-14">
        {/* Copy */}
        <div>
          <h1 className="font-display text-[clamp(4.5rem,15vw,12.5rem)] uppercase leading-[0.82] tracking-[0.005em] text-cream">
            <span className="block">Glow</span>
            <span className="block">up,</span>
            <span className="mt-1 block font-serif text-[1.22em] italic normal-case leading-[0.82] tracking-normal text-pink sm:mt-2">
              babe.
            </span>
          </h1>

          <p className="mt-8 max-w-[27rem] text-[15px] leading-[1.7] text-muted sm:text-base">
            Nails and lashes, booked in one minute.
            <span className="mt-1 block">No account, no stress.</span>
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link
              href="/booking"
              className="rounded-full bg-pink px-8 py-4 text-[15px] font-semibold text-canvas transition-colors hover:bg-rose"
            >
              Book now
            </Link>
            <a
              href="#sets"
              className="inline-flex items-center gap-2.5 text-[14px] font-medium text-cream underline decoration-cream/45 underline-offset-[6px] transition-colors hover:text-pink hover:decoration-pink sm:text-[15px]"
            >
              <PlayIcon />
              Watch our work
            </a>
          </div>
        </div>

        {/* Arch */}
        <div className="mx-auto w-full max-w-[600px] md:max-w-none lg:max-w-[600px]">
          <div className="relative">
            <NailArt
              variant="blush"
              uid="hero"
              className="h-auto w-full"
              label="Soft pink gel manicure with almond-shaped nails"
            />
            <span className="absolute left-2 top-[38%] rounded-md border border-white/25 bg-[#3a2c30]/85 px-2.5 py-1.5 text-[9px] font-medium leading-none tracking-[0.02em] text-cream/85 backdrop-blur-sm sm:-left-6 sm:text-[10px]">
              {studio.name} — {studio.suffix}
            </span>
          </div>

          <div className="mt-6 flex justify-center lg:justify-end">
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 rounded-full border border-pink/70 px-7 py-3.5 text-[13px] font-medium text-cream transition-colors hover:border-pink hover:bg-pink/10"
            >
              <span aria-hidden="true" className="text-pink">
                +
              </span>
              Add your photo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
