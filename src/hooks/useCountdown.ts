"use client";

import { useEffect, useState } from "react";
import { diffToParts, type DateDiffParts } from "@/lib/date";

export function useCountdown(targetIso: string, tickMs = 1000): DateDiffParts | null {
  const [parts, setParts] = useState<DateDiffParts | null>(null);

  useEffect(() => {
    function tick() {
      setParts(diffToParts(targetIso));
    }
    const immediate = setTimeout(tick, 0);
    const interval = setInterval(tick, tickMs);
    return () => {
      clearTimeout(immediate);
      clearInterval(interval);
    };
  }, [targetIso, tickMs]);

  return parts;
}
