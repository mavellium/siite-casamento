interface WatercolorFlowerProps {
  className?: string;
  petalColor?: string;
  petalColorAlt?: string;
  centerColor?: string;
}

/** Florzinha estilizada (pétalas em leque), usada como mancha decorativa. */
export function WatercolorFlower({
  className,
  petalColor = "var(--sage)",
  petalColorAlt = "var(--rose-blush)",
  centerColor = "var(--seal)",
}: WatercolorFlowerProps) {
  const angles = [0, 60, 120, 180, 240, 300];
  return (
    <svg viewBox="0 0 220 220" className={className} aria-hidden="true">
      <g transform="translate(110 110)">
        {angles.map((angle, i) => (
          <ellipse
            key={angle}
            cx="0"
            cy="-56"
            rx="32"
            ry="50"
            fill={i % 2 === 0 ? petalColor : petalColorAlt}
            opacity="0.8"
            transform={`rotate(${angle})`}
          />
        ))}
        <circle r="19" fill={centerColor} opacity="0.92" />
      </g>
    </svg>
  );
}
