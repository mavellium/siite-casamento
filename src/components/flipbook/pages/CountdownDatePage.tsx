import type { CountdownDateLeaf } from "@/types/book";
import { formatEventDateLabel } from "@/lib/date";
import { PageChrome, OrnamentDivider } from "../PageChrome";

export function CountdownDatePage({ leaf }: { leaf: CountdownDateLeaf }) {
  return (
    <PageChrome>
      <OrnamentDivider />
      <p className="countdown-target">{formatEventDateLabel(leaf.targetIso)}</p>
      <p className="leaf-caption">contagem regressiva</p>
    </PageChrome>
  );
}
