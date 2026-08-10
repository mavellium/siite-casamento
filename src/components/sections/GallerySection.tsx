import { GALLERY_IMAGES } from "@/data/gallery";
import { SectionHeading } from "./SectionHeading";

export function GallerySection() {
  return (
    <section id="galeria" className="site-section gallery-section">
      <SectionHeading eyebrow="Capítulo IX" title="Galeria" />
      <div className="gallery-grid">
        {GALLERY_IMAGES.map((image) => (
          <figure key={image.src} className="gallery-item">
            {/* eslint-disable-next-line @next/next/no-img-element -- fotos remotas de placeholder, ver TODO em gallery.ts */}
            <img src={image.src} alt={image.alt} className="gallery-image" />
            {image.caption && <figcaption className="leaf-caption">{image.caption}</figcaption>}
          </figure>
        ))}
      </div>
    </section>
  );
}
