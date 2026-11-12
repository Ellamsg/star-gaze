import type { Metadata } from "next";
import { Suspense } from "react";

import AppointmentsClient from "./appointments-client";

export const metadata: Metadata = {
  title: "Appointments — Petal & Lash Admin",
  description: "Every booking, loaded live from the database.",
};

export default function AppointmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="h-8 w-40 animate-pulse rounded-full bg-white/10" />
          <div className="h-64 animate-pulse rounded-[26px] bg-white/5" />
        </div>
      }
    >
      <AppointmentsClient />
    </Suspense>
  );
}
