import type { Metadata } from "next";

import ServicesClient from "./services-client";

export const metadata: Metadata = {
  title: "Services — Petal & Lash Admin",
  description: "Manage the service catalogue, prices and availability.",
};

export default function ServicesPage() {
  return <ServicesClient />;
}
