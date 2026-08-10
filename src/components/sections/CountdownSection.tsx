"use client";

import { useCountdown } from "@/hooks/useCountdown";
import { WEDDING_DATE_ISO } from "@/data/site-config";
import { SectionHeading } from "./SectionHeading";

const TILES: Array<{ key: "days" | "hours" | "minutes" | "seconds"; label: string }> = [
  { key: "days", label: "dias" },
  { key: "hours", label: "horas" },
  { key: "minutes", label: "minutos" },
  { key: "seconds", label: "segundos" },
];

export function CountdownSection() {
  const parts = useCountdown(WEDDING_DATE_ISO);

  return (
    <section id="contagem" className="site-section countdown-section">
      <SectionHeading eyebrow="Capítulo II" title="Contagem regressiva" />
      <p className="section-lede">
        Enquanto a última página não chega, contamos cada instante que nos aproxima do dia em que
        nossas histórias se tornam uma só.
      </p>
      <div className="countdown-grid countdown-grid-page">
        {TILES.map((tile) => (
          <div key={tile.key} className="countdown-tile">
            <span className="countdown-value">
              {parts ? String(parts[tile.key]).padStart(2, "0") : "--"}
            </span>
            <span className="countdown-label">{tile.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
