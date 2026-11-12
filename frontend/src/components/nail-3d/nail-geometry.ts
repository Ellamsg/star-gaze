/**
 * Procedural nail geometry, texture painting and materials.
 *
 * Everything here is generated at runtime so a "look" is just six values —
 * there are no model files to load, and any colour or shape combination is
 * valid. Browser-only (canvas textures), imported dynamically from client
 * components so it never runs during SSR.
 */
import * as THREE from "three";
import type { NailDesign, NailLength, NailShape } from "@/lib/nail-design";

const LENGTH_SCALE: Record<NailLength, number> = {
  short: 0.72,
  medium: 1,
  long: 1.3,
};

/** Nail length in world units (cuticle to tip). */
export function nailHeight(length: NailLength): number {
  return 2 * LENGTH_SCALE[length];
}

type Profile = {
  halfTip: number;
  tip: "flat" | "round" | "point";
  corner: number;
};

const PROFILES: Record<NailShape, Profile> = {
  square: { halfTip: 0.5, tip: "flat", corner: 0.14 },
  coffin: { halfTip: 0.28, tip: "flat", corner: 0.1 },
  almond: { halfTip: 0.21, tip: "round", corner: 0 },
  oval: { halfTip: 0.32, tip: "round", corner: 0 },
  stiletto: { halfTip: 0.08, tip: "point", corner: 0 },
};

const HALF_BASE = 0.5;

/** 2D silhouette of the nail: cuticle at y=0, tip at y=h, centred on x=0. */
function nailOutline(shape: NailShape, h: number): THREE.Shape {
  const p = PROFILES[shape];
  const t = p.halfTip;
  const s = new THREE.Shape();

  // Cuticle edge, with rounded bottom corners.
  s.moveTo(-HALF_BASE + 0.1, 0);
  s.lineTo(HALF_BASE - 0.1, 0);
  s.quadraticCurveTo(HALF_BASE, 0, HALF_BASE, 0.16);
  // Right side, tapering toward the tip.
  s.quadraticCurveTo(HALF_BASE, h * 0.62, t, h * 0.86);

  if (p.tip === "point") {
    s.lineTo(0, h);
    s.lineTo(-t, h * 0.86);
  } else if (p.tip === "flat") {
    s.lineTo(t, h - p.corner);
    s.quadraticCurveTo(t, h, t - p.corner, h);
    s.lineTo(-t + p.corner, h);
    s.quadraticCurveTo(-t, h, -t, h - p.corner);
  } else {
    s.bezierCurveTo(t * 1.12, h, -t * 1.12, h, -t, h * 0.86);
  }

  // Left side back down to the cuticle.
  s.quadraticCurveTo(-HALF_BASE, h * 0.62, -HALF_BASE, 0.16);
  s.quadraticCurveTo(-HALF_BASE, 0, -HALF_BASE + 0.1, 0);
  return s;
}

/**
 * ExtrudeGeometry's default UVs are raw shape coordinates, which would make
 * our painted texture repeat. Normalise them to 0–1 across the nail instead.
 */
function normalisedUvGenerator(h: number) {
  const uv = (x: number, y: number) =>
    new THREE.Vector2((x + HALF_BASE) / (HALF_BASE * 2), y / h);

  return {
    generateTopUV(
      _geometry: THREE.BufferGeometry,
      vertices: number[],
      indexA: number,
      indexB: number,
      indexC: number
    ) {
      return [
        uv(vertices[indexA * 3], vertices[indexA * 3 + 1]),
        uv(vertices[indexB * 3], vertices[indexB * 3 + 1]),
        uv(vertices[indexC * 3], vertices[indexC * 3 + 1]),
      ];
    },
    generateSideWallUV(
      _geometry: THREE.BufferGeometry,
      vertices: number[],
      indexA: number,
      indexB: number,
      indexC: number,
      indexD: number
    ) {
      return [
        uv(vertices[indexA * 3], vertices[indexA * 3 + 1]),
        uv(vertices[indexB * 3], vertices[indexB * 3 + 1]),
        uv(vertices[indexC * 3], vertices[indexC * 3 + 1]),
        uv(vertices[indexD * 3], vertices[indexD * 3 + 1]),
      ];
    },
  };
}

export function createNailGeometry(
  shape: NailShape,
  length: NailLength
): THREE.ExtrudeGeometry {
  const h = nailHeight(length);
  const depth = 0.14;

  const geometry = new THREE.ExtrudeGeometry(nailOutline(shape, h), {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.055,
    bevelSize: 0.045,
    bevelOffset: 0,
    bevelSegments: 3,
    curveSegments: 28,
    UVGenerator: normalisedUvGenerator(h),
  });

  geometry.translate(0, 0, -depth / 2);
  geometry.computeVertexNormals();
  return geometry;
}

/* ----------------------------- texture painting ---------------------------- */

function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Deterministic PRNG, so the same design always sparkles identically. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h = Math.imul(h ^ input.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

const TEX_W = 256;
const TEX_H = 512;

/**
 * Paints the look into a texture. Canvas y=0 is the tip of the nail, because
 * EXTRUDE UVs put v=1 at y=h and textures are flipped on upload.
 */
export function createNailTexture(design: NailDesign): THREE.CanvasTexture {
  const { base, accent, art } = design;
  const canvas = document.createElement("canvas");
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = base;
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  if (art === "ombre") {
    const gradient = ctx.createLinearGradient(0, TEX_H, 0, 0);
    gradient.addColorStop(0, base);
    gradient.addColorStop(0.45, hexToRgba(accent, 0.55));
    gradient.addColorStop(1, accent);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, TEX_W, TEX_H);
  }

  if (art === "aura") {
    const halo = ctx.createRadialGradient(
      TEX_W / 2,
      TEX_H * 0.42,
      8,
      TEX_W / 2,
      TEX_H * 0.42,
      TEX_W * 0.78
    );
    halo.addColorStop(0, hexToRgba(accent, 0.95));
    halo.addColorStop(0.5, hexToRgba(accent, 0.4));
    halo.addColorStop(1, hexToRgba(base, 0));
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, TEX_W, TEX_H);
  }

  if (art === "cat-eye") {
    const band = ctx.createLinearGradient(0, TEX_H, TEX_W, 0);
    band.addColorStop(0, hexToRgba(base, 0));
    band.addColorStop(0.38, hexToRgba(accent, 0.75));
    band.addColorStop(0.49, "rgba(255, 255, 255, 0.95)");
    band.addColorStop(0.6, hexToRgba(accent, 0.75));
    band.addColorStop(1, hexToRgba(base, 0));
    ctx.fillStyle = band;
    ctx.fillRect(0, 0, TEX_W, TEX_H);
  }

  if (art === "french") {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(TEX_W, 0);
    ctx.lineTo(TEX_W, TEX_H * 0.17);
    ctx.quadraticCurveTo(TEX_W / 2, TEX_H * 0.27, 0, TEX_H * 0.17);
    ctx.closePath();
    ctx.fill();
  }

  if (art === "floral") {
    const random = seededRandom(hashString(`${base}${accent}floral`));
    for (let i = 0; i < 7; i += 1) {
      const cx = 40 + random() * (TEX_W - 80);
      const cy = TEX_H * 0.3 + random() * TEX_H * 0.55;
      const petals = 5;
      const radius = 10 + random() * 8;
      ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
      for (let p = 0; p < petals; p += 1) {
        const angle = (p / petals) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(
          cx + Math.cos(angle) * radius,
          cy + Math.sin(angle) * radius,
          radius * 0.62,
          radius * 0.42,
          angle,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.34, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (design.finish === "glitter") {
    const random = seededRandom(hashString(`${base}${accent}glitter`));
    for (let i = 0; i < 420; i += 1) {
      const x = random() * TEX_W;
      const y = random() * TEX_H;
      const size = 1 + random() * 2.4;
      ctx.fillStyle =
        random() > 0.45
          ? hexToRgba(accent, 0.55 + random() * 0.45)
          : `rgba(255, 255, 255, ${0.35 + random() * 0.5})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/* -------------------------------- materials -------------------------------- */

export function createNailMaterial(
  design: NailDesign,
  map: THREE.Texture
): THREE.Material {
  switch (design.finish) {
    case "matte":
      return new THREE.MeshStandardMaterial({
        map,
        roughness: 0.94,
        metalness: 0.02,
      });
    case "chrome":
      return new THREE.MeshPhysicalMaterial({
        map,
        roughness: 0.16,
        metalness: 1,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
      });
    case "glitter":
      return new THREE.MeshPhysicalMaterial({
        map,
        roughness: 0.32,
        metalness: 0.35,
        clearcoat: 0.9,
        clearcoatRoughness: 0.25,
      });
    case "jelly":
      return new THREE.MeshPhysicalMaterial({
        map,
        roughness: 0.06,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.03,
        transmission: 0.4,
        thickness: 0.3,
        ior: 1.42,
        transparent: true,
        opacity: 0.95,
      });
    default:
      return new THREE.MeshPhysicalMaterial({
        map,
        roughness: 0.09,
        metalness: 0.03,
        clearcoat: 1,
        clearcoatRoughness: 0.04,
      });
  }
}

/* ------------------------------- assembled nail ---------------------------- */

/**
 * A finished nail: origin sits at the cuticle centre, +Y points at the tip and
 * the painted face looks down +Z. Both the 3D studio and the camera try-on
 * place these groups.
 */
export function createNailGroup(design: NailDesign): THREE.Group {
  const group = new THREE.Group();

  const geometry = createNailGeometry(design.shape, design.length);
  const texture = createNailTexture(design);
  const material = createNailMaterial(design, texture);

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = false;
  group.add(mesh);

  if (design.art === "charms") {
    const h = nailHeight(design.length);
    const charmMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf9f5ef,
      roughness: 0.12,
      metalness: 0.1,
      clearcoat: 1,
    });
    const charmGeometry = new THREE.SphereGeometry(1, 20, 16);
    const specs = [
      { x: -0.17, y: h * 0.7, r: 0.085 },
      { x: 0.14, y: h * 0.58, r: 0.06 },
      { x: 0.0, y: h * 0.85, r: 0.05 },
    ];

    for (const spec of specs) {
      const charm = new THREE.Mesh(charmGeometry, charmMaterial);
      charm.position.set(spec.x, spec.y, 0.13);
      charm.scale.setScalar(spec.r);
      group.add(charm);
    }
  }

  return group;
}

/** Free every GPU resource held by a nail group. */
export function disposeNailGroup(group: THREE.Object3D): void {
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];
      for (const material of materials) {
        const mapped = material as THREE.MeshStandardMaterial;
        mapped.map?.dispose();
        material.dispose();
      }
    }
  });
}
