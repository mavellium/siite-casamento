import type { RsvpLeaf } from "@/types/book";
import { RsvpForm } from "@/components/sections/RsvpForm";
import { PageChrome, OrnamentDivider } from "../PageChrome";

export function RsvpPage({ leaf }: { leaf: RsvpLeaf }) {
  return (
    <PageChrome contentClassName="leaf-content-text">
      <span className="chapter-label">{leaf.chapterLabel}</span>
      <OrnamentDivider />
      <h2 className="page-heading">{leaf.title}</h2>
      <RsvpForm />
    </PageChrome>
  );
}
