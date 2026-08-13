import type { GalleryLeaf } from "@/types/book";
import { PageChrome, OrnamentDivider } from "../PageChrome";

export function GalleryPage({ leaf }: { leaf: GalleryLeaf }) {
  return (
    <PageChrome>
      <span className="chapter-label">{leaf.chapterLabel}</span>
      <OrnamentDivider />
      <div className="gallery-grid">
        {leaf.images.map((image) => (
          <figure key={image.src} className="gallery-item">
            {/* eslint-disable-next-line @next/next/no-img-element -- fotos remotas de placeholder, ver TODO em gallery.ts */}
            <img src={image.src} alt={image.alt} className="gallery-image" />
            {image.caption && <figcaption className="leaf-caption">{image.caption}</figcaption>}
          </figure>
        ))}
      </div>
    </PageChrome>
  );
}
