"use client";

import { useState } from "react";
import {
  artOptions,
  describeDesign,
  finishOptions,
  lengthOptions,
  palettes,
  parseNailPrompt,
  shapeOptions,
  type NailDesign,
} from "@/lib/nail-design";
import { nailPresets } from "@/data/nail-presets";

const chipBase =
  "rounded-full border px-3.5 py-2 text-[13px] tracking-tight transition-colors";
const chipIdle = "border-ink/20 hover:border-ink/50";
const chipActive = "border-ink bg-ink text-paper";

const eyebrow = "text-[11px] uppercase tracking-[0.22em] text-ink/50";

/** A flat CSS stand-in for a look, used as the preset thumbnail. */
function Swatch({ design }: { design: NailDesign }) {
  const glossy =
    design.finish === "gloss" ||
    design.finish === "chrome" ||
    design.finish === "jelly";

  return (
    <span
      className="relative block h-20 w-full overflow-hidden rounded-[14px] ring-1 ring-inset ring-ink/10"
      style={{
        backgroundImage: `linear-gradient(155deg, ${design.accent} 0%, ${design.base} 55%, ${design.base} 100%)`,
      }}
    >
      <span
        className="absolute inset-0"
        style={{
          backgroundImage: glossy
            ? "linear-gradient(200deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 48%)"
            : "none",
        }}
      />
      {design.finish === "glitter" ? (
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_35%,rgba(255,255,255,0.75)_0,rgba(255,255,255,0)_9%),radial-gradient(circle_at_65%_60%,rgba(255,255,255,0.6)_0,rgba(255,255,255,0)_7%),radial-gradient(circle_at_45%_80%,rgba(255,255,255,0.55)_0,rgba(255,255,255,0)_6%)]" />
      ) : null}
      {design.art === "charms" ? (
        <span className="absolute left-1/2 top-1/3 h-3 w-3 -translate-x-1/2 rounded-full bg-paper shadow-sm ring-1 ring-ink/10" />
      ) : null}
    </span>
  );
}

type Props = {
  design: NailDesign;
  onChange: (design: NailDesign) => void;
  showPresets?: boolean;
  presetsLimit?: number;
};

export function DesignControls({
  design,
  onChange,
  showPresets = true,
  presetsLimit,
}: Props) {
  const [prompt, setPrompt] = useState("");
  const [feedback, setFeedback] = useState<{
    matched: string[];
    unmatched: string[];
  } | null>(null);

  const presets = presetsLimit
    ? nailPresets.slice(0, presetsLimit)
    : nailPresets;

  function applyPrompt(text: string) {
    const result = parseNailPrompt(text);
    setFeedback({ matched: result.matched, unmatched: result.unmatched });
    if (result.matched.length > 0) {
      onChange({ ...design, ...result.patch });
    }
  }

  return (
    <div className="flex flex-col gap-9">
      {/* ------------------------------- describe ------------------------------- */}
      <div>
        <p className={eyebrow}>Describe your nails</p>
        <p className="mt-3 max-w-md text-[14px] leading-relaxed text-ink/65">
          Type the look in your own words — colour, finish, shape — and it gets
          built below. No perfect wording needed.
        </p>

        <form
          className="mt-4 flex flex-col gap-2.5 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            applyPrompt(prompt);
          }}
        >
          <label className="sr-only" htmlFor="nail-prompt">
            Describe the nails you want
          </label>
          <input
            id="nail-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="short milky almond, matte oxblood coffin, 3D pearl charms…"
            className="w-full rounded-full border border-ink/20 bg-paper px-5 py-3 text-[14px] outline-none transition-colors placeholder:text-ink/35 focus:border-ink/60"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-ink px-6 py-3 text-sm font-medium tracking-tight text-paper transition-opacity hover:opacity-85"
          >
            Build it
          </button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          {[
            "short milky almond",
            "matte oxblood coffin",
            "3D pearl charms",
            "chrome french tips",
            "long stiletto red",
            "sage aura square",
          ].map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                setPrompt(suggestion);
                applyPrompt(suggestion);
              }}
              className="rounded-full border border-ink/15 px-3 py-1.5 text-[12px] text-ink/65 transition-colors hover:border-ink/45 hover:text-ink"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div aria-live="polite" className="mt-3 min-h-[20px] text-[13px]">
          {feedback ? (
            feedback.matched.length > 0 ? (
              <p className="text-ink/70">
                <span className="font-medium">Read as:</span>{" "}
                {feedback.matched.join(", ")}
                {feedback.unmatched.length > 0 ? (
                  <span className="text-ink/45">
                    {" "}
                    · ignored: {feedback.unmatched.join(", ")}
                  </span>
                ) : null}
              </p>
            ) : (
              <p className="text-ink/60">
                Nothing recognised in that one — try a colour, shape or finish
                (e.g. “matte black coffin”).
              </p>
            )
          ) : null}
        </div>
      </div>

      {/* -------------------------------- presets ------------------------------- */}
      {showPresets ? (
        <div>
          <div className="flex items-baseline justify-between gap-4">
            <p className={eyebrow}>Available sets</p>
            <p className="text-[12px] text-ink/45">
              {presets.length} looks in rotation
            </p>
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {presets.map((preset) => {
              const active =
                describeDesign(preset.design) === describeDesign(design);
              return (
                <li key={preset.id}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => onChange(preset.design)}
                    className={`w-full rounded-[18px] border p-2.5 text-left transition-colors ${
                      active
                        ? "border-ink bg-paper-dim/70"
                        : "border-line hover:border-ink/40"
                    }`}
                  >
                    <Swatch design={preset.design} />
                    <span className="mt-2.5 block font-display text-[14px] font-medium leading-tight tracking-[-0.01em]">
                      {preset.name}
                    </span>
                    <span className="mt-1 block text-[12px] leading-snug text-ink/55">
                      {preset.detail}
                    </span>
                    <span className="mt-1.5 block text-[12px] tabular-nums text-ink/70">
                      ${preset.price}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {/* -------------------------------- controls ------------------------------ */}
      <div className="grid gap-7 sm:grid-cols-2">
        <fieldset>
          <legend className={eyebrow}>Shape</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {shapeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                title={option.hint}
                aria-pressed={design.shape === option.value}
                onClick={() => onChange({ ...design, shape: option.value })}
                className={`${chipBase} ${
                  design.shape === option.value ? chipActive : chipIdle
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className={eyebrow}>Length</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {lengthOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={design.length === option.value}
                onClick={() => onChange({ ...design, length: option.value })}
                className={`${chipBase} ${
                  design.length === option.value ? chipActive : chipIdle
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className={eyebrow}>Finish</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {finishOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={design.finish === option.value}
                onClick={() => onChange({ ...design, finish: option.value })}
                className={`${chipBase} ${
                  design.finish === option.value ? chipActive : chipIdle
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className={eyebrow}>Art</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {artOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={design.art === option.value}
                onClick={() => onChange({ ...design, art: option.value })}
                className={`${chipBase} ${
                  design.art === option.value ? chipActive : chipIdle
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <fieldset>
        <legend className={eyebrow}>Colour</legend>
        <div className="mt-3 flex flex-wrap gap-2.5">
          {palettes.map((palette) => {
            const active = palette.base === design.base;
            return (
              <button
                key={palette.id}
                type="button"
                aria-label={palette.name}
                aria-pressed={active}
                title={palette.name}
                onClick={() =>
                  onChange({
                    ...design,
                    base: palette.base,
                    accent: palette.accent,
                  })
                }
                className={`h-9 w-9 rounded-full ring-1 ring-inset ring-ink/15 transition-transform hover:scale-105 ${
                  active ? "outline outline-2 outline-offset-2 outline-ink" : ""
                }`}
                style={{
                  backgroundImage: `linear-gradient(150deg, ${palette.accent}, ${palette.base})`,
                }}
              />
            );
          })}
        </div>
      </fieldset>

      <p className="text-[13px] text-ink/60">
        <span className="font-medium text-ink">Current look:</span>{" "}
        {describeDesign(design)}
      </p>
    </div>
  );
}
