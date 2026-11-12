import type { Metadata } from "next";
import { Suspense } from "react";

import ClientsClient from "./clients-client";

export const metadata: Metadata = {
  title: "Clients — Petal & Lash Admin",
  description: "Client list and booking history.",
};

export default function ClientsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="h-8 w-40 animate-pulse rounded-full bg-white/10" />
          <div className="h-10 w-64 animate-pulse rounded-full bg-white/5" />
          <div className="h-64 animate-pulse rounded-[26px] bg-white/5" />
        </div>
      }
    >
      <ClientsClient />
    </Suspense>
  );
}
