import { NailArt } from "@/components/ui/nail-art";
import { freshSets } from "@/data/site";

function PlayIcon() {
  return (
    <svg
      width="10"
      height="11"
      viewBox="0 0 11 12"
      fill="currentColor"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M0 0.8c0-.6.66-.97 1.17-.66l9.2 5.2a.78.78 0 0 1 0 1.32l-9.2 5.2A.78.78 0 0 1 0 11.2V0.8Z" />
    </svg>
  );
}

export function FreshSets() {
  return (
    <section id="sets" className="mx-auto w-full max-w-[1500px] px-5 py-6 sm:px-8 sm:py-8">
      <div className="rounded-[30px] bg-surface px-4 pb-7 pt-6 sm:px-8 sm:pb-9 sm:pt-8 lg:px-10 lg:pb-10 lg:pt-9">
        <h2 className="text-center font-display text-[clamp(2.5rem,6.5vw,5.25rem)] uppercase leading-none text-cream">
          Fresh{" "}
          <span className="font-serif text-[1.05em] italic normal-case text-pink">
            sets
          </span>
        </h2>

        <div className="mt-6 grid grid-cols-3 gap-2 sm:mt-8 sm:gap-4">
          {freshSets.map((set, index) => (
            <NailArch key={set.name} index={index} set={set} />
          ))}
        </div>

        <div className="mt-6 flex justify-center sm:mt-8">
          <a
            href="/nails"
            className="inline-flex items-center gap-2.5 rounded-full bg-pink px-6 py-3 text-[13px] font-semibold text-canvas transition-colors hover:bg-rose"
          >
            <PlayIcon />
            Watch the reel
          </a>
        </div>
      </div>
    </section>
  );
}

function NailArch({
  set,
  index,
}: {
  set: (typeof freshSets)[number];
  index: number;
}) {
  return (
    <NailArt
      variant={set.variant}
      sparkle={set.sparkle}
      uid={`set-${index}`}
      label={`${set.name} nail set`}
      className="h-auto w-full"
    />
  );
}
