import { Suspense } from "react";

import OverviewClient from "./overview-client";

export default function AdminOverviewPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4" aria-hidden="true">
          <div className="h-8 w-40 animate-pulse rounded-full bg-white/10" />
          <div className="h-10 w-64 animate-pulse rounded-full bg-white/5" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-[26px] bg-white/5" />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-[26px] bg-white/5" />
        </div>
      }
    >
      <OverviewClient />
    </Suspense>
  );
}
