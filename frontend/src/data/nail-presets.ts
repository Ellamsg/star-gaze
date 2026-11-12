import type { NailDesign } from "@/lib/nail-design";

export type NailPreset = {
  id: string;
  name: string;
  detail: string;
  price: number;
  design: NailDesign;
};

/**
 * The "available nails" a client can pick from. Names deliberately match the
 * looks shown on the landing page so the studio reads as one place.
 */
export const nailPresets: NailPreset[] = [
  {
    id: "milk-glaze",
    name: "Milk Glaze",
    detail: "Milky jelly, short almond",
    price: 78,
    design: {
      shape: "almond",
      length: "short",
      finish: "jelly",
      art: "none",
      base: "#efe7de",
      accent: "#f8f3ec",
    },
  },
  {
    id: "chrome-pearl",
    name: "Chrome Pearl",
    detail: "Mirror chrome, medium almond",
    price: 96,
    design: {
      shape: "almond",
      length: "medium",
      finish: "chrome",
      art: "none",
      base: "#cfd4d8",
      accent: "#f2f4f6",
    },
  },
  {
    id: "oxblood-gloss",
    name: "Oxblood Gloss",
    detail: "Deep red, medium coffin",
    price: 72,
    design: {
      shape: "coffin",
      length: "medium",
      finish: "gloss",
      art: "none",
      base: "#4a1418",
      accent: "#8c2a2f",
    },
  },
  {
    id: "cat-eye-noir",
    name: "Cat-Eye Noir",
    detail: "Magnetic cat-eye, long almond",
    price: 104,
    design: {
      shape: "almond",
      length: "long",
      finish: "gloss",
      art: "cat-eye",
      base: "#17150f",
      accent: "#8ea6c4",
    },
  },
  {
    id: "clay-french",
    name: "Clay French",
    detail: "Micro-French, short oval",
    price: 88,
    design: {
      shape: "oval",
      length: "short",
      finish: "gloss",
      art: "french",
      base: "#c9b6a4",
      accent: "#f7f3ed",
    },
  },
  {
    id: "sage-aura",
    name: "Sage Aura",
    detail: "Airbrushed halo, medium square",
    price: 112,
    design: {
      shape: "square",
      length: "medium",
      finish: "gloss",
      art: "aura",
      base: "#b9bfa8",
      accent: "#7f8a72",
    },
  },
  {
    id: "glitter-noir",
    name: "Glitter Noir",
    detail: "Black with fine sparkle",
    price: 92,
    design: {
      shape: "coffin",
      length: "medium",
      finish: "glitter",
      art: "none",
      base: "#17150f",
      accent: "#e8cf9a",
    },
  },
  {
    id: "pearl-charms",
    name: "Pearl Charms",
    detail: "Sculpted 3D pearls, long coffin",
    price: 128,
    design: {
      shape: "coffin",
      length: "long",
      finish: "gloss",
      art: "charms",
      base: "#e3bcb4",
      accent: "#c98f88",
    },
  },
  {
    id: "ombre-blush",
    name: "Ombré Blush",
    detail: "Faded blush tips, long almond",
    price: 108,
    design: {
      shape: "almond",
      length: "long",
      finish: "jelly",
      art: "ombre",
      base: "#f0dcd6",
      accent: "#c98f88",
    },
  },
  {
    id: "lilac-halo",
    name: "Lilac Halo",
    detail: "Soft aura, medium oval",
    price: 98,
    design: {
      shape: "oval",
      length: "medium",
      finish: "matte",
      art: "aura",
      base: "#b3a0cc",
      accent: "#eae3f4",
    },
  },
  {
    id: "stiletto-rouge",
    name: "Stiletto Rouge",
    detail: "High-shine red, stiletto",
    price: 116,
    design: {
      shape: "stiletto",
      length: "long",
      finish: "gloss",
      art: "none",
      base: "#8c2a2f",
      accent: "#c04a4f",
    },
  },
  {
    id: "daisy-milk",
    name: "Daisy Milk",
    detail: "Hand-painted florals, short oval",
    price: 124,
    design: {
      shape: "oval",
      length: "short",
      finish: "gloss",
      art: "floral",
      base: "#efe7de",
      accent: "#c98f88",
    },
  },
];
