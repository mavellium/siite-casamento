import type { EventInfoLeaf } from "@/types/book";
import { EventInfoDisplay } from "@/components/sections/EventInfoDisplay";
import { PageChrome, OrnamentDivider } from "../PageChrome";

export function EventInfoPage({ leaf }: { leaf: EventInfoLeaf }) {
  return (
    <PageChrome>
      <span className="chapter-label">{leaf.chapterLabel}</span>
      <OrnamentDivider />
      <h2 className="page-heading">{leaf.title}</h2>
      <EventInfoDisplay time={leaf.time} address={leaf.address} note={leaf.note} />
    </PageChrome>
  );
}
