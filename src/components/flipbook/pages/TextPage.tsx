import type { TextLeaf } from "@/types/book";
import { PageChrome, OrnamentDivider } from "../PageChrome";

export function TextPage({ leaf }: { leaf: TextLeaf }) {
  return (
    <PageChrome contentClassName="leaf-content-text">
      <span className="chapter-label">{leaf.chapterLabel}</span>
      <OrnamentDivider />
      <h2 className="page-heading">{leaf.title}</h2>
      <p className="page-text">{leaf.content}</p>
      {leaf.signature && <p className="page-signature">{leaf.signature}</p>}
    </PageChrome>
  );
}
