type NailVariant = "blush" | "lilac" | "cherry";

type Palette = {
  archFrom: string;
  archTo: string;
  skinTop: string;
  skinBottom: string;
  nailTop: string;
  nailBottom: string;
};

const palettes: Record<NailVariant, Palette> = {
  blush: {
    archFrom: "#fdeef2",
    archTo: "#f5c6d7",
    skinTop: "#f2cfac",
    skinBottom: "#e7b98f",
    nailTop: "#d690a8",
    nailBottom: "#b96a87",
  },
  lilac: {
    archFrom: "#f0ecfa",
    archTo: "#dcd1f0",
    skinTop: "#f2cfac",
    skinBottom: "#e7b98f",
    nailTop: "#ab8ed6",
    nailBottom: "#8f6dbe",
  },
  cherry: {
    archFrom: "#fce6e8",
    archTo: "#f5c2c8",
    skinTop: "#f2cfac",
    skinBottom: "#e7b98f",
    nailTop: "#c34150",
    nailBottom: "#9d2432",
  },
};

const fingers = [
  { cx: 102, top: 472, width: 38, angle: -13 },
  { cx: 151, top: 420, width: 44, angle: -5 },
  { cx: 200, top: 402, width: 46, angle: 0 },
  { cx: 249, top: 420, width: 44, angle: 5 },
  { cx: 298, top: 472, width: 38, angle: 13 },
];

/** Sparks painted onto the middle three nails for the lilac set. */
const sparkles = [
  { finger: 1, dx: -4, dy: 22, r: 2.6 },
  { finger: 1, dx: 7, dy: 40, r: 1.8 },
  { finger: 2, dx: 5, dy: 18, r: 2.2 },
  { finger: 2, dx: -6, dy: 36, r: 2.8 },
  { finger: 2, dx: 8, dy: 48, r: 1.6 },
  { finger: 3, dx: 0, dy: 26, r: 2.4 },
  { finger: 3, dx: 9, dy: 46, r: 1.7 },
];

/**
 * Hand-drawn nail set inside an arch — the stand-in for studio photography.
 * Swap for <Image> once the real shots land; keep the arch frame.
 */
export function NailArt({
  variant = "blush",
  sparkle = false,
  uid = "a",
  label,
  className = "",
}: {
  variant?: NailVariant;
  sparkle?: boolean;
  /** Unique id suffix so multiple arches on one page don't share gradients. */
  uid?: string;
  label?: string;
  className?: string;
}) {
  const p = palettes[variant];

  return (
    <svg
      viewBox="0 0 400 660"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <defs>
        <linearGradient id={`arch-${uid}`} x1="0" y1="0" x2="0.15" y2="1">
          <stop offset="0" stopColor={p.archFrom} />
          <stop offset="1" stopColor={p.archTo} />
        </linearGradient>
        <radialGradient id={`glow-${uid}`} cx="0.32" cy="0.1" r="0.75">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`skin-${uid}`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor={p.skinTop} />
          <stop offset="1" stopColor={p.skinBottom} />
        </linearGradient>
        <linearGradient id={`nail-${uid}`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor={p.nailTop} />
          <stop offset="1" stopColor={p.nailBottom} />
        </linearGradient>
      </defs>

      {/* Arch */}
      <path
        d="M0 660V200a200 200 0 0 1 400 0v460z"
        fill={`url(#arch-${uid})`}
      />
      <path
        d="M0 660V200a200 200 0 0 1 400 0v460z"
        fill={`url(#glow-${uid})`}
      />

      {/* Hand */}
      <g>
        <rect
          x="94"
          y="572"
          width="212"
          height="140"
          rx="50"
          fill={`url(#skin-${uid})`}
        />
        {fingers.map((finger) => {
          const nailWidth = finger.width - 12;
          const nailX = finger.cx - nailWidth / 2;
          const nailY = finger.top + 6;
          const nailHeight = 58;

          return (
            <g
              key={finger.cx}
              transform={`rotate(${finger.angle} ${finger.cx} 630)`}
            >
              <rect
                x={finger.cx - finger.width / 2}
                y={finger.top}
                width={finger.width}
                height={612 - finger.top}
                rx={finger.width / 2}
                fill={`url(#skin-${uid})`}
              />
              <rect
                x={nailX}
                y={nailY}
                width={nailWidth}
                height={nailHeight}
                rx={nailWidth / 2}
                fill={`url(#nail-${uid})`}
              />
              <ellipse
                cx={finger.cx - 5}
                cy={nailY + nailHeight - 13}
                rx="7"
                ry="3"
                fill="#ffffff"
                opacity="0.28"
              />
              <rect
                x={nailX}
                y={nailY}
                width={nailWidth}
                height={nailHeight}
                rx={nailWidth / 2}
                fill="none"
                stroke="#000000"
                strokeOpacity="0.08"
                strokeWidth="1.5"
              />
            </g>
          );
        })}

        {sparkle
          ? sparkles.map((dot, index) => {
              const finger = fingers[dot.finger];
              const nailY = finger.top + 6;

              return (
                <circle
                  key={index}
                  cx={finger.cx + dot.dx}
                  cy={nailY + dot.dy}
                  r={dot.r}
                  fill="#ffffff"
                  opacity="0.9"
                />
              );
            })
          : null}
      </g>
    </svg>
  );
}
