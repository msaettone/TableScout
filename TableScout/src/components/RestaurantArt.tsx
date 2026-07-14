const PALETTES = [
  { a: "#FFE4DC", b: "#F9C7B8", line: "#F05A47" },
  { a: "#E9F3EC", b: "#CFE7D8", line: "#48A985" },
  { a: "#E7EEFC", b: "#CFE0FB", line: "#5B8DEF" },
  { a: "#FCF1DD", b: "#F6DDAA", line: "#E9A23B" },
];

function hashSeed(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function RestaurantArt({
  seed,
  className,
}: {
  seed: string;
  className?: string;
}) {
  const h = hashSeed(seed);
  const palette = PALETTES[h % PALETTES.length];
  const variant = h % 3;

  return (
    <svg
      viewBox="0 0 400 240"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Restaurant illustration"
    >
      <defs>
        <linearGradient id={`grad-${seed}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.a} />
          <stop offset="100%" stopColor={palette.b} />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill={`url(#grad-${seed})`} />

      {variant === 0 && (
        <g opacity="0.9">
          <circle cx="200" cy="120" r="58" fill="none" stroke={palette.line} strokeWidth="2" opacity="0.55" />
          <circle cx="200" cy="120" r="40" fill="none" stroke={palette.line} strokeWidth="1.5" opacity="0.4" />
          <line x1="150" y1="70" x2="150" y2="170" stroke={palette.line} strokeWidth="2" opacity="0.5" strokeLinecap="round" />
          <line x1="252" y1="70" x2="252" y2="170" stroke={palette.line} strokeWidth="2" opacity="0.5" strokeLinecap="round" />
          <line x1="262" y1="70" x2="262" y2="170" stroke={palette.line} strokeWidth="2" opacity="0.5" strokeLinecap="round" />
        </g>
      )}

      {variant === 1 && (
        <g opacity="0.9">
          <path
            d="M 120 200 L 120 120 A 80 80 0 0 1 280 120 L 280 200"
            fill="none"
            stroke={palette.line}
            strokeWidth="3"
            opacity="0.5"
          />
          <path
            d="M 150 200 L 150 130 A 50 50 0 0 1 250 130 L 250 200"
            fill="none"
            stroke={palette.line}
            strokeWidth="2"
            opacity="0.35"
          />
        </g>
      )}

      {variant === 2 && (
        <g opacity="0.9">
          <circle cx="140" cy="130" r="46" fill="none" stroke={palette.line} strokeWidth="2" opacity="0.5" />
          <circle cx="260" cy="100" r="30" fill="none" stroke={palette.line} strokeWidth="2" opacity="0.4" />
          <circle cx="270" cy="170" r="18" fill="none" stroke={palette.line} strokeWidth="2" opacity="0.45" />
        </g>
      )}
    </svg>
  );
}
