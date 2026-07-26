const EVENT_DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

export function formatEventDateLabel(iso: string): string {
  const parts = EVENT_DATE_FORMATTER.formatToParts(new Date(iso));
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  return `${day} · ${month} · ${year}`;
}

export interface DateDiffParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

export function diffToParts(targetIso: string, fromMs: number = Date.now()): DateDiffParts {
  const target = new Date(targetIso).getTime();
  const totalMs = target - fromMs;
  const isPast = totalMs <= 0;
  const clamped = Math.max(totalMs, 0);

  const totalSeconds = Math.floor(clamped / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, isPast };
}
