import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { designFromSearchParams } from "@/lib/nail-design";
import { NailStudioSection } from "@/components/nail-3d/nail-studio-section";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Nail studio — Petal & Lash",
  description:
    "Design your set in 3D: choose a shape, length, finish and art, or describe the nails you want in your own words.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function NailsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <>
      <SiteHeader />

      <main className="flex-1 bg-paper text-ink">
        <section className="mx-auto w-full max-w-[1600px] px-6 pb-16 pt-12 md:px-10 md:pb-20 md:pt-16">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-ink/50">
                Nail studio
              </p>
              <h1 className="mt-3 max-w-2xl font-display text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-[0.95] tracking-[-0.04em]">
                Build the set before you sit down
              </h1>
            </div>
            <p className="max-w-sm text-[14px] leading-relaxed text-ink/65">
              Pick one of the looks in rotation, or build your own from scratch.
              Then try it on your own hand with the camera — or hand it straight
              to your artist at booking.
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1600px] px-6 pb-20 md:px-10 md:pb-28">
          <Suspense fallback={<StudioSkeleton />}>
            <StudioForQuery searchParams={searchParams} />
          </Suspense>
        </section>

        <section className="border-t border-line/70 bg-paper-dim/45">
          <div className="mx-auto grid w-full max-w-[1600px] gap-8 px-6 py-16 md:grid-cols-3 md:px-10 md:py-20">
            {[
              {
                step: "01",
                title: "Describe it or pick it",
                body: "Twelve ready looks, or type something like “matte black coffin” and the studio builds it.",
              },
              {
                step: "02",
                title: "Check it in 3D",
                body: "Rotate the set, change the length or finish, and share the link with your artist.",
              },
              {
                step: "03",
                title: "Try it on your hand",
                body: "Open the camera and the design sits on your fingertips so you can see it on your skin tone.",
              },
            ].map((item) => (
              <div key={item.step}>
                <p className="text-[11px] uppercase tracking-[0.22em] text-ink/45">
                  {item.step}
                </p>
                <h2 className="mt-3 font-display text-[19px] font-medium tracking-[-0.02em]">
                  {item.title}
                </h2>
                <p className="mt-2 text-[14px] leading-relaxed text-ink/65">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1600px] px-6 py-16 md:px-10 md:py-20">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <p className="max-w-lg font-serif text-[22px] leading-snug italic text-ink/80">
              Happy with the look? Bring it with you — the design travels into
              the booking.
            </p>
            <Link
              href="/booking"
              className="rounded-full bg-ink px-6 py-3 text-sm font-medium tracking-tight text-paper transition-opacity hover:opacity-85"
            >
              Start booking →
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

/** Reads the shared design out of the URL, streamed behind <Suspense>. */
async function StudioForQuery({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const design = designFromSearchParams(await searchParams);
  return <NailStudioSection initialDesign={design} />;
}

/** Placeholder at the studio's real dimensions, so nothing jumps on load. */
function StudioSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
      <div className="h-[420px] rounded-[26px] border border-line bg-[linear-gradient(180deg,#efe9e0_0%,#e4dbd0_100%)] sm:h-[520px] lg:h-[600px]" />
      <div className="flex flex-col gap-5">
        <div className="h-4 w-32 rounded-full bg-paper-dim" />
        <div className="h-12 w-3/4 rounded-full bg-paper-dim" />
        <div className="h-32 rounded-[18px] border border-line bg-paper-dim/50" />
        <div className="h-24 rounded-[18px] border border-line bg-paper-dim/50" />
      </div>
    </div>
  );
}
