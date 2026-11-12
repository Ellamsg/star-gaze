import Link from "next/link";

import { footerLinks, studio } from "@/data/site";

export function SiteFooter() {
  return (
    <footer id="contact" className="mt-auto border-t border-hairline bg-canvas">
      <div className="mx-auto w-full max-w-[1500px] px-5 py-12 sm:px-8 sm:py-14 lg:py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr] md:gap-8">
          <div>
            <p className="font-display text-[clamp(1.9rem,5vw,3rem)] uppercase leading-none text-cream">
              {studio.name}
            </p>
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-muted">
              {studio.suffix}. Walk in with a photo, walk out with the set.
            </p>
            <div className="mt-6 flex flex-col gap-2 text-[14px]">
              <a
                href={`tel:${studio.phone.replace(/[^0-9+]/g, "")}`}
                className="w-fit text-cream/85 underline-offset-4 transition-colors hover:text-pink hover:underline"
              >
                {studio.phone}
              </a>
              <a
                href={`mailto:${studio.email}`}
                className="w-fit text-cream/85 underline-offset-4 transition-colors hover:text-pink hover:underline"
              >
                {studio.email}
              </a>
            </div>
          </div>

          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
              Visit
            </h2>
            <p className="mt-4 text-[14px] leading-relaxed text-cream/85">
              {studio.address}
              <br />
              {studio.city}
            </p>
            <ul className="mt-5 flex flex-col gap-2.5 text-[13px]">
              {studio.hours.map((entry) => (
                <li key={entry.day} className="flex justify-between gap-4">
                  <span className="text-muted">{entry.day}</span>
                  <span className="tabular-nums text-cream/85">
                    {entry.time}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
              Explore
            </h2>
            <ul className="mt-4 flex flex-col gap-2.5 text-[14px]">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-cream/85 underline-offset-4 transition-colors hover:text-pink hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <Link
              href="/booking"
              className="mt-6 inline-flex rounded-full bg-pink px-6 py-3 text-[13px] font-semibold text-canvas transition-colors hover:bg-rose"
            >
              Book a visit
            </Link>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-6 text-[12px] text-muted">
          <p>
            © 2026 {studio.name} · {studio.address}, {studio.city}
          </p>
          <div className="flex items-center gap-5">
            <a
              href={studio.instagram}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-pink"
            >
              Instagram
            </a>
            <a href="#top" className="transition-colors hover:text-pink">
              Back to top ↑
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
