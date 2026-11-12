"use client";

import Link from "next/link";
import { useState } from "react";

import { navLinks, studio } from "@/data/site";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-canvas/90 backdrop-blur-md">
      <div className="mx-auto flex h-[68px] w-full max-w-[1500px] items-center justify-between gap-4 px-5 sm:px-8 lg:h-[88px]">
        <Link
          href="/"
          className="font-display text-[16px] uppercase leading-none tracking-[0.08em] text-cream transition-colors hover:text-pink sm:text-[19px] lg:text-[21px]"
        >
          {studio.name}
        </Link>

        <div className="flex items-center gap-4 sm:gap-7">
          <nav
            aria-label="Primary"
            className="hidden items-center gap-9 text-[15px] font-medium text-cream/90 md:flex"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-pink"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/booking"
              className="rounded-full bg-pink px-5 py-2.5 text-[13px] font-semibold text-canvas transition-colors hover:bg-rose sm:px-7 sm:py-3 sm:text-[14px]"
            >
              Book
            </Link>

            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((value) => !value)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-cream md:hidden"
            >
              <span aria-hidden="true" className="relative block h-3 w-4">
                <span
                  className={`absolute left-0 top-0 h-[1.5px] w-full bg-current transition-transform ${
                    open ? "translate-y-[5px] rotate-45" : ""
                  }`}
                />
                <span
                  className={`absolute left-0 top-[5px] h-[1.5px] w-full bg-current transition-opacity ${
                    open ? "opacity-0" : ""
                  }`}
                />
                <span
                  className={`absolute left-0 top-[10px] h-[1.5px] w-full bg-current transition-transform ${
                    open ? "-translate-y-[5px] -rotate-45" : ""
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-white/10 bg-canvas px-5 pb-5 pt-2 md:hidden"
        >
          <nav aria-label="Mobile" className="flex flex-col">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                className="border-b border-white/5 py-3.5 text-[15px] font-medium text-cream/90 transition-colors hover:text-pink"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/booking"
              onClick={close}
              className="py-3.5 text-[15px] font-medium text-pink"
            >
              Book a visit
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
