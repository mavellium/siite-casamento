import type { GalleryImage } from "@/types/content";

export function GalleryGrid({ images }: { images: GalleryImage[] }) {
  return (
    <div className="gallery-grid">
      {images.map((image) => (
        <figure key={image.src} className="gallery-item">
          {/* eslint-disable-next-line @next/next/no-img-element -- fotos remotas de placeholder, ver TODO em gallery.ts */}
          <img src={image.src} alt={image.alt} className="gallery-image" />
          {image.caption && <figcaption className="leaf-caption">{image.caption}</figcaption>}
        </figure>
      ))}
    </div>
  );
}
