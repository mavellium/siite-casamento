interface Sprinkle {
  x: number;
  y: number;
  r: number;
  color: string;
}

const SPRINKLES: Sprinkle[] = [
  { x: 46, y: 120, r: 3, color: "var(--rose-blush)" },
  { x: 330, y: 90, r: 2.2, color: "var(--sage)" },
  { x: 70, y: 260, r: 2, color: "var(--seal)" },
  { x: 300, y: 230, r: 2.6, color: "var(--rose-blush)" },
  { x: 40, y: 380, r: 2.4, color: "var(--sage)" },
  { x: 320, y: 410, r: 2, color: "var(--rose-blush)" },
  { x: 180, y: 60, r: 2, color: "var(--sage)" },
  { x: 210, y: 470, r: 2.4, color: "var(--seal)" },
  { x: 120, y: 470, r: 2, color: "var(--rose-blush)" },
  { x: 260, y: 140, r: 1.8, color: "var(--seal)" },
];

/** Pontinhos/pétalas espalhados em baixa opacidade — textura fina de fundo. */
export function PetalSprinkles({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 360 520" preserveAspectRatio="none" className={className} aria-hidden="true">
      {SPRINKLES.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={s.color} opacity="0.55" />
      ))}
    </svg>
  );
}
