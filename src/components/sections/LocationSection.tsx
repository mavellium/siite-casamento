import { LOCATION } from "@/data/location";
import { SectionHeading } from "./SectionHeading";

export function LocationSection() {
  return (
    <section id="local" className="site-section location-section">
      <SectionHeading eyebrow="Capítulo VI" title="Como chegar" />
      <div className="location-card">
        <h3 className="event-info-title">{LOCATION.venueName}</h3>
        <p className="event-info-address">{LOCATION.address}</p>
        <p className="section-lede location-lede">{LOCATION.howToArrive}</p>
        {LOCATION.mapEmbedUrl ? (
          <iframe
            src={LOCATION.mapEmbedUrl}
            className="location-map"
            title="Mapa do local"
            loading="lazy"
          />
        ) : (
          <div className="location-map location-map-placeholder">mapa em breve [a confirmar]</div>
        )}
      </div>
    </section>
  );
}
