import type { CountdownLeaf } from "@/types/book";
import { CountdownDisplay } from "@/components/sections/CountdownDisplay";
import { PageChrome, OrnamentDivider } from "../PageChrome";

export function CountdownPage({ leaf }: { leaf: CountdownLeaf }) {
  return (
    <PageChrome>
      <span className="chapter-label">{leaf.chapterLabel}</span>
      <OrnamentDivider />
      <h2 className="page-heading">{leaf.title}</h2>
      {leaf.description && <p className="page-text">{leaf.description}</p>}
      <CountdownDisplay targetIso={leaf.targetIso} />
    </PageChrome>
  );
}
