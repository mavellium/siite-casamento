import type { EventInfoLeaf } from "@/types/book";
import { PageChrome, OrnamentDivider } from "../PageChrome";

export function EventInfoPage({ leaf }: { leaf: EventInfoLeaf }) {
  return (
    <PageChrome>
      <span className="chapter-label">{leaf.chapterLabel}</span>
      <OrnamentDivider />
      <h2 className="page-heading">{leaf.title}</h2>
      <p className="event-info-time">{leaf.time}</p>
      <p className="event-info-address">{leaf.address}</p>
      {leaf.note && <p className="event-info-note">{leaf.note}</p>}
    </PageChrome>
  );
}
