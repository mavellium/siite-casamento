interface FloralSprigProps {
  className?: string;
  color?: string;
  accentColor?: string;
}

/**
 * Ramo botânico em traço fino, desenhado à mão em SVG (sem asset externo).
 * `color` tinge o traço (folhas/caule), `accentColor` tinge o miolo da florzinha.
 */
export function FloralSprig({
  className,
  color = "var(--sage)",
  accentColor = "var(--rose-blush)",
}: FloralSprigProps) {
  return (
    <svg
      viewBox="0 0 240 360"
      className={className}
      fill="none"
      stroke={color}
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M122 352 C 100 300 138 262 112 214 C 92 174 130 142 108 96 C 94 66 118 42 106 12" />

      <path d="M117 282 Q 74 300 54 256 Q 90 240 117 282 Z" />
      <path d="M117 282 Q 160 302 180 258 Q 143 240 117 282 Z" />

      <path d="M112 196 Q 66 212 46 170 Q 86 154 112 196 Z" />
      <path d="M112 196 Q 158 214 178 172 Q 136 154 112 196 Z" />

      <path d="M106 108 Q 60 122 44 82 Q 82 68 106 108 Z" />
      <path d="M106 108 Q 152 124 166 84 Q 130 68 106 108 Z" />

      <g strokeWidth="1.1">
        <path d="M106 14 c -10 -6 -8 -18 2 -20 c 8 -2 14 6 10 14" />
        <path d="M106 14 c 10 -6 8 -18 -2 -20 c -8 -2 -14 6 -10 14" />
        <path d="M106 14 c -3 9 3 15 9 12" />
        <path d="M106 14 c 3 9 -3 15 -9 12" />
      </g>
      <circle cx="106" cy="14" r="3" fill={accentColor} stroke="none" />
    </svg>
  );
}
