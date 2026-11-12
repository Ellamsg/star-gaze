"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  defaultDesign,
  designToQuery,
  describeDesign,
  type NailDesign,
} from "@/lib/nail-design";
import { DesignControls } from "@/components/nail-3d/design-controls";
import { NailStudioCanvas } from "@/components/nail-3d/nail-studio-canvas";

export function NailStudioSection({
  initialDesign,
}: {
  initialDesign: NailDesign;
}) {
  const [design, setDesign] = useState<NailDesign>(initialDesign);
  const [autoRotate, setAutoRotate] = useState(true);
  const [copied, setCopied] = useState(false);

  const tryOnHref = `/try-on?${designToQuery(design)}`;
  const bookingHref = `/booking`;

  return (
    <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
      {/* --------------------------------- viewer -------------------------------- */}
      <div className="flex flex-col gap-4">
        <div className="relative overflow-hidden rounded-[26px] border border-line bg-[linear-gradient(180deg,#efe9e0_0%,#e4dbd0_100%)]">
          <NailStudioCanvas
            design={design}
            autoRotate={autoRotate}
            className="h-[420px] w-full sm:h-[520px] lg:h-[600px]"
          />

          <div className="pointer-events-none absolute left-5 top-5">
            <p className="text-[10px] uppercase tracking-[0.22em] text-ink/45">
              Live 3D
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[12px] text-ink/50">
            Drag to rotate · scroll to zoom
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              aria-pressed={autoRotate}
              onClick={() => setAutoRotate((value) => !value)}
              className="rounded-full border border-ink/20 px-4 py-2 text-[12px] tracking-tight transition-colors hover:border-ink/50"
            >
              {autoRotate ? "Pause spin" : "Resume spin"}
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    `${window.location.origin}/nails?${designToQuery(design)}`
                  );
                  setCopied(true);
                } catch {
                  setCopied(false);
                }
              }}
              className="rounded-full border border-ink/20 px-4 py-2 text-[12px] tracking-tight transition-colors hover:border-ink/50"
            >
              {copied ? "Link copied" : "Share this look"}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={tryOnHref}
            className="rounded-full bg-ink px-6 py-3 text-sm font-medium tracking-tight text-paper transition-opacity hover:opacity-85"
          >
            Try it on with your camera →
          </Link>
          <Link
            href={bookingHref}
            className="rounded-full border border-ink/25 px-6 py-3 text-sm font-medium tracking-tight transition-colors hover:bg-ink hover:text-paper"
          >
            Book this set
          </Link>
        </div>
      </div>

      {/* -------------------------------- controls ------------------------------- */}
      <div>
        <DesignControls design={design} onChange={setDesign} />
        <p className="mt-8 border-t border-line pt-5 text-[13px] leading-relaxed text-ink/55">
          Everything you build here is priced at booking stage — sculpting,
          length and 3D charms are charged per nail, and your artist will
          confirm the shape against your natural nail on the day.
        </p>
        <p className="sr-only" aria-live="polite">
          {describeDesign(design)}
        </p>
      </div>
    </div>
  );
}
