import { Church, Clock, MapPin, PartyPopper } from "lucide-react";
import { WEDDING_DATE_ISO } from "@/data/site-config";
import { EVENT_INFO } from "@/data/event-info";
import { CountdownDisplay } from "./CountdownDisplay";
import { TextoPendente } from "./TextoPendente";

/** A data por extenso, em português, a partir do ISO — fonte única é site-config. */
const DATA_POR_EXTENSO = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
}).format(new Date(WEDDING_DATE_ISO));

/** Ícone por bloco. Cai no relógio se o casal acrescentar um evento novo. */
const ICONES: Record<string, typeof Church> = {
  cerimonia: Church,
  recepcao: PartyPopper,
};

/**
 * Conteúdo do objeto "Calendário" — contagem regressiva + horários.
 *
 * Cada bloco virou CARTÃO com ícone, em vez de três parágrafos empilhados:
 * cerimônia e recepção são duas coisas diferentes, e sem moldura a lista
 * inteira lia como um texto corrido só. A data por extenso entra no topo
 * porque a contagem regressiva sozinha responde "quanto falta" mas não
 * "quando é".
 */
export function ScheduleOverlay() {
  return (
    <div className="section-schedule">
      <p className="section-schedule-date">{DATA_POR_EXTENSO}</p>

      <CountdownDisplay targetIso={WEDDING_DATE_ISO} />

      {EVENT_INFO.map((item) => {
        const Icone = ICONES[item.id] ?? Clock;
        return (
          <section key={item.id} className="section-event">
            <div className="section-event-head">
              <Icone size={18} aria-hidden="true" />
              <h3 className="section-event-title">{item.title}</h3>
            </div>

            <p className="event-info-time">
              <TextoPendente>{item.time}</TextoPendente>
            </p>

            <p className="event-info-address">
              <MapPin size={14} aria-hidden="true" />
              <span>
                <TextoPendente>{item.address}</TextoPendente>
              </span>
            </p>

            {item.note && (
              <p className="event-info-note">
                <TextoPendente>{item.note}</TextoPendente>
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
