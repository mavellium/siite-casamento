import type { GalleryLeaf } from "@/types/book";
import { GalleryGrid } from "@/components/sections/GalleryGrid";
import { PageChrome, OrnamentDivider } from "../PageChrome";

export function GalleryPage({ leaf }: { leaf: GalleryLeaf }) {
  return (
    <PageChrome>
      <span className="chapter-label">{leaf.chapterLabel}</span>
      <OrnamentDivider />
      <h2 className="page-heading">{leaf.title}</h2>
      <GalleryGrid images={leaf.images} />
    </PageChrome>
  );
}
