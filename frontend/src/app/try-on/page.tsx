import type { Metadata } from "next";
import { Suspense } from "react";
import { designFromSearchParams } from "@/lib/nail-design";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TryOnSection } from "@/components/try-on/try-on-section";

export const metadata: Metadata = {
  title: "Try on — Petal & Lash",
  description:
    "Try the nails on your own hand with your camera, or build the look in 3D first. Nothing is uploaded.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function TryOnPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <>
      <SiteHeader />

      <main className="flex-1 bg-paper text-ink">
        <section className="mx-auto w-full max-w-[1600px] px-6 pb-12 pt-12 md:px-10 md:pb-16 md:pt-16">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-ink/50">
                Try on
              </p>
              <h1 className="mt-3 max-w-2xl font-display text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-[0.95] tracking-[-0.04em]">
                See it on your own hand
              </h1>
            </div>
            <p className="max-w-sm text-[14px] leading-relaxed text-ink/65">
              Your camera runs entirely in this browser tab — the video is never
              uploaded, stored or sent anywhere. Change colour and shape below
              and the nails update live.
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1600px] px-6 pb-20 md:px-10 md:pb-28">
          <Suspense fallback={<TryOnSkeleton />}>
            <TryOnForQuery searchParams={searchParams} />
          </Suspense>
        </section>

        <section className="border-t border-line/70 bg-paper-dim/45">
          <div className="mx-auto grid w-full max-w-[1600px] gap-8 px-6 py-16 md:grid-cols-3 md:px-10 md:py-20">
            {[
              {
                title: "Hand tracking, on-device",
                body: "MediaPipe's hand model and its WebAssembly runtime are served from this site — no third-party calls, no analytics on your video.",
              },
              {
                title: "Might need a second try",
                body: "If the model fails to load or the camera is blocked, the 3D preview takes over so you can still decide on the look.",
              },
              {
                title: "Not a colour match",
                body: "Screen light changes how lacquer reads. Your artist will show you the real swatch before anything is applied.",
              },
            ].map((item) => (
              <div key={item.title}>
                <h2 className="font-display text-[19px] font-medium tracking-[-0.02em]">
                  {item.title}
                </h2>
                <p className="mt-2 text-[14px] leading-relaxed text-ink/65">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

/** Reads the shared design out of the URL, streamed behind <Suspense>. */
async function TryOnForQuery({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const design = designFromSearchParams(await searchParams);
  return <TryOnSection initialDesign={design} />;
}

/** Placeholder shaped like the camera stage, so the page doesn't jump. */
function TryOnSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
      <div className="aspect-[4/3] rounded-[26px] border border-line bg-ink/90" />
      <div className="flex flex-col gap-5">
        <div className="h-4 w-28 rounded-full bg-paper-dim" />
        <div className="h-8 w-2/3 rounded-full bg-paper-dim" />
        <div className="h-32 rounded-[18px] border border-line bg-paper-dim/50" />
        <div className="h-24 rounded-[18px] border border-line bg-paper-dim/50" />
      </div>
    </div>
  );
}
