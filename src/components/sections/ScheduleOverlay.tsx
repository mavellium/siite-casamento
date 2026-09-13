import { WEDDING_DATE_ISO } from "@/data/site-config";
import { EVENT_INFO } from "@/data/event-info";
import { CountdownDisplay } from "./CountdownDisplay";
import { EventInfoDisplay } from "./EventInfoDisplay";

/** Conteúdo do objeto "Calendário/Timer" — contagem regressiva + horários da cerimônia/recepção. */
export function ScheduleOverlay() {
  return (
    <div className="section-schedule">
      <CountdownDisplay targetIso={WEDDING_DATE_ISO} />
      {EVENT_INFO.map((item) => (
        <section key={item.id} className="section-schedule-item">
          <h3 className="page-heading section-schedule-title">{item.title}</h3>
          <EventInfoDisplay time={item.time} address={item.address} note={item.note} />
        </section>
      ))}
    </div>
  );
}
