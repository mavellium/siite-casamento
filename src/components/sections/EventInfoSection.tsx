import { EVENT_INFO } from "@/data/event-info";
import { SectionHeading } from "./SectionHeading";

export function EventInfoSection() {
  return (
    <section id="evento" className="site-section event-info-section">
      <SectionHeading eyebrow="Capítulo III" title="Informações do evento" />
      <p className="section-lede">
        Dois momentos, um só motivo para celebrar: a cerimônia que nos une e a festa que vem logo
        depois.
      </p>
      <div className="event-info-grid">
        {EVENT_INFO.map((item) => (
          <div key={item.id} className="event-info-card">
            <span className="chapter-label">{item.label}</span>
            <h3 className="event-info-title">{item.title}</h3>
            <p className="event-info-time">{item.time}</p>
            <p className="event-info-address">{item.address}</p>
            {item.note && <p className="event-info-note">{item.note}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
