import type { Metadata } from "next";

import { BookingFlow } from "@/components/booking/booking-flow";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Book your visit — Petal & Lash",
  description:
    "Book nails, lashes, or both in under a minute. No account or password needed — just your name and number.",
};

export default function BookingPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <BookingFlow />
      </main>
    </>
  );
}
