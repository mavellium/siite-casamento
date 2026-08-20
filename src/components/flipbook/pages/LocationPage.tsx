import type { LocationLeaf } from "@/types/book";
import { PageChrome, OrnamentDivider } from "../PageChrome";

export function LocationPage({ leaf }: { leaf: LocationLeaf }) {
  return (
    <PageChrome contentClassName="leaf-content-text">
      <span className="chapter-label">{leaf.chapterLabel}</span>
      <OrnamentDivider />
      <h2 className="page-heading">{leaf.title}</h2>
      <p className="event-info-time">{leaf.venueName}</p>
      <p className="event-info-address">{leaf.address}</p>
      <p className="page-text">{leaf.howToArrive}</p>
      {leaf.mapEmbedUrl ? (
        <iframe src={leaf.mapEmbedUrl} className="location-map" title="Mapa do local" loading="lazy" />
      ) : (
        <div className="location-map location-map-placeholder">mapa em breve [a confirmar]</div>
      )}
    </PageChrome>
  );
}
