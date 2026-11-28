"use client";

import { useMemo } from "react";

import { formatNaira } from "@/data/site";
import { useServices } from "@/hooks/use-services";
import { formatDuration } from "@/lib/date";
import type { ServiceDTO } from "@/types/service";

/** The home page shows a taste of the menu, not the whole catalogue. */
const MAX_SERVICES = 6;

type MenuGroup = {
  name: string;
  items: ServiceDTO[];
};

export function Menu() {
  const { data: services = [], isPending, error } = useServices({ active: true });

  const groups = useMemo<MenuGroup[]>(() => {
    const map = new Map<string, ServiceDTO[]>();
    let shown = 0;

    for (const service of services) {
      if (shown >= MAX_SERVICES) break;
      const key = service.category?.name ?? "Services";
      const list = map.get(key) ?? [];
      list.push(service);
      map.set(key, list);
      shown += 1;
    }

    return [...map.entries()].map(([name, items]) => ({ name, items }));
  }, [services]);

  const errorMessage =
    error instanceof Error ? error.message : error ? "Could not load services." : null;

  return (
    <section
      id="menu"
      className="mx-auto w-full max-w-[1500px] px-5 pb-4 pt-2 sm:px-8"
    >
      <div className="rounded-[30px] bg-rose p-5 sm:p-8 lg:p-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-[clamp(2.75rem,6.5vw,6rem)] uppercase leading-none text-cream">
            The Menu
          </h2>
          <p className="mb-1 max-w-[22rem] text-[12.5px] leading-relaxed text-cream/70">
            Live prices and times from the studio.{" "}
            <a
              href="/booking"
              className="text-pink underline-offset-4 hover:underline"
            >
              Book any of them →
            </a>
          </p>
        </div>

        {isPending ? (
          <MenuSkeleton />
        ) : errorMessage ? (
          <p className="mt-6 rounded-2xl border border-pink/30 bg-canvas/40 px-4 py-3 text-[13px] text-pink">
            {errorMessage}
          </p>
        ) : groups.length === 0 ? (
          <p className="mt-6 text-[14px] text-cream/70">
            The menu is being updated — please check back soon.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:mt-8">
            {groups.map((group) => (
              <div key={group.name} className="rounded-[24px] bg-canvas p-5 sm:p-7">
                <h3 className="font-serif text-[27px] italic leading-none text-pink lg:text-[31px]">
                  {group.name}
                </h3>

                <ul className="mt-6 flex flex-col gap-5">
                  {group.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-baseline justify-between gap-3 text-[14px] leading-snug sm:text-[15px]"
                    >
                      <p className="text-cream">
                        {item.name}
                        <span className="text-muted">
                          {" "}
                          · {formatDuration(item.durationMin)}
                        </span>
                      </p>
                      <p className="whitespace-nowrap font-semibold tabular-nums text-cream">
                        {formatNaira(item.price)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function MenuSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading the menu"
      className="mt-6 grid gap-4 md:grid-cols-2 lg:mt-8"
    >
      {Array.from({ length: 2 }).map((_, group) => (
        <div key={group} className="rounded-[24px] bg-canvas p-5 sm:p-7">
          <div className="h-7 w-24 animate-pulse rounded-full bg-white/10" />
          <div className="mt-6 space-y-5">
            {Array.from({ length: 3 }).map((__, row) => (
              <div key={row} className="flex items-center justify-between gap-4">
                <div className="h-3.5 w-2/3 animate-pulse rounded-full bg-white/10" />
                <div className="h-3.5 w-16 animate-pulse rounded-full bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
