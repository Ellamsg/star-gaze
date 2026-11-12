/**
 * The nail "design" is the single source of truth shared by the 3D studio
 * (/nails) and the camera try-on (/try-on). It is small enough to travel in
 * the URL, so a look can be linked, shared and re-opened.
 */

export type NailShape = "almond" | "coffin" | "square" | "oval" | "stiletto";
export type NailLength = "short" | "medium" | "long";
export type NailFinish = "gloss" | "matte" | "chrome" | "glitter" | "jelly";
export type NailArt =
  | "none"
  | "french"
  | "ombre"
  | "aura"
  | "cat-eye"
  | "floral"
  | "charms";

export type NailDesign = {
  shape: NailShape;
  length: NailLength;
  finish: NailFinish;
  art: NailArt;
  /** Base lacquer colour, hex. */
  base: string;
  /** Accent colour, hex. */
  accent: string;
};

export const defaultDesign: NailDesign = {
  shape: "almond",
  length: "medium",
  finish: "gloss",
  art: "none",
  base: "#e3bcb4",
  accent: "#c98f88",
};

export const shapeOptions: { value: NailShape; label: string; hint: string }[] =
  [
    { value: "almond", label: "Almond", hint: "Tapered, soft point" },
    { value: "coffin", label: "Coffin", hint: "Tapered, flat top" },
    { value: "square", label: "Square", hint: "Straight sides" },
    { value: "oval", label: "Oval", hint: "Rounded, natural" },
    { value: "stiletto", label: "Stiletto", hint: "Sharp point" },
  ];

export const lengthOptions: { value: NailLength; label: string }[] = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "long", label: "Long" },
];

export const finishOptions: { value: NailFinish; label: string }[] = [
  { value: "gloss", label: "Gloss" },
  { value: "matte", label: "Matte" },
  { value: "chrome", label: "Chrome" },
  { value: "glitter", label: "Glitter" },
  { value: "jelly", label: "Jelly" },
];

export const artOptions: { value: NailArt; label: string }[] = [
  { value: "none", label: "Plain" },
  { value: "french", label: "French" },
  { value: "ombre", label: "Ombré" },
  { value: "aura", label: "Aura" },
  { value: "cat-eye", label: "Cat-eye" },
  { value: "floral", label: "Floral" },
  { value: "charms", label: "3D charms" },
];

export const palettes: {
  id: string;
  name: string;
  base: string;
  accent: string;
}[] = [
  { id: "milk", name: "Milk", base: "#efe7de", accent: "#f8f3ec" },
  { id: "blush", name: "Blush", base: "#e3bcb4", accent: "#c98f88" },
  { id: "oxblood", name: "Oxblood", base: "#4a1418", accent: "#8c2a2f" },
  { id: "noir", name: "Noir", base: "#17150f", accent: "#3a3630" },
  { id: "chrome", name: "Chrome", base: "#cfd4d8", accent: "#f2f4f6" },
  { id: "gold", name: "Gold", base: "#c9a45c", accent: "#e8cf9a" },
  { id: "sage", name: "Sage", base: "#b9bfa8", accent: "#8f9683" },
  { id: "mauve", name: "Mauve", base: "#c099a2", accent: "#9a707c" },
  { id: "clay", name: "Clay", base: "#c9b6a4", accent: "#a6856a" },
  { id: "lilac", name: "Lilac", base: "#b3a0cc", accent: "#8e7bb0" },
];

const HEX = /^#[0-9a-f]{6}$/i;

function oneOf<T extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback: T
): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

const SHAPES = shapeOptions.map((o) => o.value);
const LENGTHS = lengthOptions.map((o) => o.value);
const FINISHES = finishOptions.map((o) => o.value);
const ARTS = artOptions.map((o) => o.value);

/** Serialise a design for the query string. */
export function designToQuery(design: NailDesign): string {
  const params = new URLSearchParams({
    shape: design.shape,
    length: design.length,
    finish: design.finish,
    art: design.art,
    base: design.base,
    accent: design.accent,
  });
  return params.toString();
}

/** Read a design back out of a query string, ignoring anything invalid. */
export function designFromQuery(input: string | URLSearchParams): NailDesign {
  const params =
    typeof input === "string" ? new URLSearchParams(input) : input;
  const base = params.get("base");
  const accent = params.get("accent");

  return {
    shape: oneOf(params.get("shape"), SHAPES, defaultDesign.shape),
    length: oneOf(params.get("length"), LENGTHS, defaultDesign.length),
    finish: oneOf(params.get("finish"), FINISHES, defaultDesign.finish),
    art: oneOf(params.get("art"), ARTS, defaultDesign.art),
    base: base && HEX.test(base) ? base : defaultDesign.base,
    accent: accent && HEX.test(accent) ? accent : defaultDesign.accent,
  };
}

/** Build a design from a Next.js page's `searchParams` object. */
export function designFromSearchParams(
  input: Record<string, string | string[] | undefined> | undefined
): NailDesign {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input ?? {})) {
    if (typeof value === "string") params.set(key, value);
  }
  return designFromQuery(params);
}

export function describeDesign(design: NailDesign): string {
  const shape = shapeOptions.find((o) => o.value === design.shape)?.label;
  const length = lengthOptions.find((o) => o.value === design.length)?.label;
  const finish = finishOptions.find((o) => o.value === design.finish)?.label;
  const art = artOptions.find((o) => o.value === design.art)?.label;
  return [length, shape, finish, art === "Plain" ? null : art]
    .filter(Boolean)
    .join(" · ");
}

/* ------------------------------------------------------------------ *
 * Plain-language descriptions.
 * Deliberately a keyword reader, not a language model: it runs
 * instantly, offline, and always resolves to a real, renderable design.
 * ------------------------------------------------------------------ */

type Rule = {
  /** Words that trigger the rule. */
  words: string[];
  /** Label shown back to the user. */
  label: string;
  patch: Partial<NailDesign>;
};

const rules: Rule[] = [
  // Shape
  { words: ["almond"], label: "almond shape", patch: { shape: "almond" } },
  {
    words: ["coffin", "ballerina"],
    label: "coffin shape",
    patch: { shape: "coffin" },
  },
  {
    words: ["square", "squoval"],
    label: "square shape",
    patch: { shape: "square" },
  },
  { words: ["oval"], label: "oval shape", patch: { shape: "oval" } },
  {
    words: ["stiletto", "pointy", "pointed"],
    label: "stiletto shape",
    patch: { shape: "stiletto" },
  },
  // Length
  { words: ["short"], label: "short", patch: { length: "short" } },
  { words: ["medium", "mid"], label: "medium", patch: { length: "medium" } },
  { words: ["long"], label: "long", patch: { length: "long" } },
  // Finish
  { words: ["matte"], label: "matte", patch: { finish: "matte" } },
  {
    words: ["chrome", "mirror", "metallic", "silver"],
    label: "chrome",
    patch: { finish: "chrome", base: "#cfd4d8", accent: "#f2f4f6" },
  },
  {
    words: ["glitter", "sparkle", "sparkly", "shimmer"],
    label: "glitter",
    patch: { finish: "glitter" },
  },
  {
    words: ["jelly", "translucent", "see through", "sheer"],
    label: "jelly",
    patch: { finish: "jelly" },
  },
  {
    words: ["gloss", "glossy", "shiny"],
    label: "high gloss",
    patch: { finish: "gloss" },
  },
  // Art
  { words: ["french"], label: "French tip", patch: { art: "french" } },
  { words: ["ombre", "ombré", "gradient"], label: "ombré", patch: { art: "ombre" } },
  { words: ["aura", "halo"], label: "aura", patch: { art: "aura" } },
  {
    words: ["cat eye", "cat-eye", "magnetic"],
    label: "cat-eye",
    patch: { art: "cat-eye" },
  },
  {
    words: ["floral", "flower", "flowers", "daisy"],
    label: "floral",
    patch: { art: "floral" },
  },
  {
    words: ["3d", "3-d", "charm", "charms", "gem", "gems", "diamond", "pearl"],
    label: "3D charms",
    patch: { art: "charms" },
  },
  // Colour
  {
    words: ["red", "oxblood", "burgundy", "wine", "maroon"],
    label: "oxblood red",
    patch: { base: "#4a1418", accent: "#8c2a2f" },
  },
  {
    words: ["black", "noir"],
    label: "black",
    patch: { base: "#17150f", accent: "#3a3630" },
  },
  {
    words: ["white", "milk", "milky", "milky white"],
    label: "milk white",
    patch: { base: "#efe7de", accent: "#f8f3ec" },
  },
  {
    words: ["nude", "neutral", "beige", "clay", "tan"],
    label: "nude",
    patch: { base: "#c9b6a4", accent: "#a6856a" },
  },
  {
    words: ["pink", "blush", "rose"],
    label: "blush pink",
    patch: { base: "#e3bcb4", accent: "#c98f88" },
  },
  {
    words: ["sage", "green", "olive", "khaki"],
    label: "sage",
    patch: { base: "#b9bfa8", accent: "#8f9683" },
  },
  {
    words: ["mauve", "dusty pink", "muted"],
    label: "mauve",
    patch: { base: "#c099a2", accent: "#9a707c" },
  },
  {
    words: ["gold", "golden", "brass"],
    label: "gold",
    patch: { base: "#c9a45c", accent: "#e8cf9a" },
  },
  {
    words: ["lilac", "purple", "lavender", "violet"],
    label: "lilac",
    patch: { base: "#b3a0cc", accent: "#8e7bb0" },
  },
  {
    words: ["blue", "navy", "denim"],
    label: "blue",
    patch: { base: "#4b6386", accent: "#8ba3c4" },
  },
];

export type PromptResult = {
  patch: Partial<NailDesign>;
  /** Human-readable tokens we understood, for UI confirmation. */
  matched: string[];
  /** Words we could not map to anything. */
  unmatched: string[];
};

export function parseNailPrompt(text: string): PromptResult {
  const lower = ` ${text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ")} `;
  const patch: Partial<NailDesign> = {};
  const matched: string[] = [];
  const usedWords = new Set<string>();

  for (const rule of rules) {
    const hit = rule.words.find((word) => lower.includes(` ${word} `));
    if (!hit) continue;
    // Don't let a later rule of the same family overwrite an earlier match
    // unless it brings something new (e.g. "matte oxblood french tip").
    Object.assign(patch, rule.patch);
    matched.push(rule.label);
    usedWords.add(hit);
  }

  const stop = new Set([
    "i", "want", "wanna", "a", "an", "the", "with", "and", "on", "my",
    "nails", "nail", "please", "some", "like", "look", "bit", "very",
    "little", "of", "for", "to", "me",
  ]);
  const unmatched = Array.from(
    new Set(
      lower
        .trim()
        .split(" ")
        .filter((word) => word.length > 2 && !stop.has(word) && !usedWords.has(word))
    )
  ).filter((word) => !matched.some((label) => label.includes(word)));

  return { patch, matched, unmatched };
}
