import type { Metadata } from "next";

import { AdminFrame } from "@/components/admin/admin-frame";
import { AdminProvider } from "@/components/admin/store";

export const metadata: Metadata = {
  title: "Admin — Petal & Lash",
  description: "Bookings, payments and clients for Petal & Lash studio.",
  robots: { index: false, follow: false },
};

// The admin area is private and session-dependent, so it can never be part of
// the prerendered shell. Opting out keeps the instant-navigation validation
// from flagging every admin page in development.
export const instant = false;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <AdminFrame>{children}</AdminFrame>
    </AdminProvider>
  );
}
