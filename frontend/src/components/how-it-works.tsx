import { steps } from "@/data/site";

export function HowItWorks() {
  return (
    <section
      id="how"
      className="mx-auto w-full max-w-[1500px] px-5 py-12 sm:px-8 sm:py-16 lg:py-20"
    >
      <h2 className="font-display text-[clamp(2.75rem,7.5vw,6rem)] uppercase leading-[0.9] text-cream">
        Easy as{" "}
        <span className="font-serif text-[1.06em] italic normal-case text-pink">
          1, 2, 3
        </span>
      </h2>

      <ol className="mt-7 grid gap-3 sm:mt-9 sm:grid-cols-3 sm:gap-4">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="rounded-[26px] bg-surface p-6 sm:p-7 lg:p-9"
          >
            <p className="font-display text-[2.25rem] leading-none text-pink lg:text-[2.75rem]">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-8 text-[16px] font-semibold leading-snug text-cream sm:text-[17px] lg:text-[18px]">
              {step.title}
            </h3>
            <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
