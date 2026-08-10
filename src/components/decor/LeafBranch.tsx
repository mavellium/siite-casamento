interface LeafBranchProps {
  className?: string;
  color?: string;
}

/**
 * Ramo com folhas preenchidas (não só contorno) em opacidades variadas,
 * simulando camadas de aquarela — para ilustrações maiores "sangrando" nas bordas.
 */
export function LeafBranch({ className, color = "var(--sage-deep)" }: LeafBranchProps) {
  return (
    <svg viewBox="0 0 260 380" className={className} aria-hidden="true">
      <path
        d="M40 372 C 62 300 28 258 55 208 C 76 168 38 138 60 92 C 76 62 48 38 66 8"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
      <path d="M55 208 C 18 194 -8 214 -18 250 C 24 246 56 224 55 208 Z" fill={color} opacity="0.55" />
      <path d="M58 208 C 97 197 121 217 132 252 C 92 248 60 226 58 208 Z" fill={color} opacity="0.4" />
      <path d="M60 128 C 24 116 0 134 -10 167 C 30 163 59 145 60 128 Z" fill={color} opacity="0.6" />
      <path d="M62 128 C 99 118 122 136 132 169 C 95 165 64 145 62 128 Z" fill={color} opacity="0.45" />
      <path d="M63 58 C 31 48 10 65 2 93 C 37 91 62 75 63 58 Z" fill={color} opacity="0.65" />
      <path d="M65 58 C 97 50 118 66 126 95 C 93 92 66 76 65 58 Z" fill={color} opacity="0.5" />
    </svg>
  );
}
