import type { FaqLeaf } from "@/types/book";
import { FaqList } from "@/components/sections/FaqList";
import { PageChrome, OrnamentDivider } from "../PageChrome";

export function FaqPage({ leaf }: { leaf: FaqLeaf }) {
  return (
    <PageChrome contentClassName="leaf-content-text">
      <span className="chapter-label">{leaf.chapterLabel}</span>
      <OrnamentDivider />
      <h2 className="page-heading">{leaf.title}</h2>
      <FaqList items={leaf.items} />
    </PageChrome>
  );
}
