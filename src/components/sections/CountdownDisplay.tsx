"use client";

import { useCountdown } from "@/hooks/useCountdown";

const TILES: Array<{ key: "days" | "hours" | "minutes" | "seconds"; label: string }> = [
  { key: "days", label: "dias" },
  { key: "hours", label: "horas" },
  { key: "minutes", label: "minutos" },
  { key: "seconds", label: "segundos" },
];

export function CountdownDisplay({ targetIso }: { targetIso: string }) {
  const parts = useCountdown(targetIso);

  return (
    <div className="countdown-grid">
      {TILES.map((tile) => (
        <div key={tile.key} className="countdown-tile">
          <span className="countdown-value">{parts ? String(parts[tile.key]).padStart(2, "0") : "--"}</span>
          <span className="countdown-label">{tile.label}</span>
        </div>
      ))}
    </div>
  );
}
