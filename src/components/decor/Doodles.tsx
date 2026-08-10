interface DoodleProps {
  className?: string;
  color?: string;
}

/** Rabisco fino e sinuoso — acento minimalista de canto. */
export function SquiggleDoodle({ className, color = "var(--sage-deep)" }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 140 200"
      className={className}
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M10 2 C 62 40 -8 72 42 102 C 92 132 20 152 68 198" />
    </svg>
  );
}

/** Rabisco circular fino — acento minimalista de canto. */
export function CircleDoodle({ className, color = "var(--seal)" }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M48 18 C 74 16 88 42 74 60 C 60 78 32 70 30 52 C 28 36 46 28 54 38" />
    </svg>
  );
}

/** Traço de assinatura — floreio fino sob um nome, como um sublinhado à mão. */
export function SwashUnderline({ className, color = "var(--seal)" }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 220 30"
      className={className}
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 18 C 50 4 90 26 130 10 C 155 1 180 12 216 6" />
    </svg>
  );
}
