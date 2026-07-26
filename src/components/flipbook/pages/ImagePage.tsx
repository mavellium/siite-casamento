import type { ImageLeaf } from "@/types/book";
import { PageChrome, OrnamentDivider } from "../PageChrome";

export function ImagePage({ leaf }: { leaf: ImageLeaf }) {
  return (
    <PageChrome>
      <span className="chapter-label">{leaf.chapterLabel}</span>
      <OrnamentDivider />
      <div className="leaf-image-frame">
        <img src={leaf.image.src} alt={leaf.image.alt} className="leaf-image" />
      </div>
      <p className="leaf-caption">{leaf.caption}</p>
    </PageChrome>
  );
}
