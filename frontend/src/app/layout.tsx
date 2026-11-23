import type { Metadata } from "next";
import { Anton, DM_Sans, Geist_Mono, Instrument_Serif } from "next/font/google";

import { Providers } from "@/components/providers";

import "./globals.css";

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Stargaze — Nails and lashes studio",
  description:
    "Nails and lashes, booked in one minute. No account, no stress. Pick your treatments, choose a time, and you're done.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${dmSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-canvas font-sans text-cream">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
