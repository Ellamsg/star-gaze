import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { AdminProvider } from "@/components/admin/store";

export const metadata: Metadata = {
  title: "Admin — Petal & Lash",
  description: "Bookings, payments and clients for Petal & Lash studio.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <AdminShell>{children}</AdminShell>
    </AdminProvider>
  );
}
