"use client";

import { useState, type FormEvent } from "react";
import { CalendarHeart, MessageSquareText, User, Users } from "lucide-react";
import type { RsvpFormValues } from "@/types/content";
import { SectionHeading } from "./SectionHeading";

const INITIAL_VALUES: RsvpFormValues = {
  name: "",
  attending: "sim",
  guestCount: 1,
  message: "",
};

// TODO(rsvp): sem backend ainda — integrar com endpoint/planilha quando decidido.
export function RsvpSection() {
  const [values, setValues] = useState<RsvpFormValues>(INITIAL_VALUES);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <section id="confirmacao" className="site-section rsvp-section">
      <SectionHeading eyebrow="Capítulo VIII" title="Confirmação de presença" />
      <div className="rsvp-card">
        {submitted ? (
          <div className="rsvp-confirmation">
            <CalendarHeart className="rsvp-confirmation-icon" aria-hidden="true" />
            <p className="page-signature">Até a próxima página da nossa história</p>
            <p className="section-lede">
              Obrigado por confirmar, {values.name.split(" ")[0] || "querido convidado"}. Guardamos
              um lugar especial para você.
            </p>
          </div>
        ) : (
          <form className="rsvp-form" onSubmit={handleSubmit}>
            <p className="section-lede rsvp-lede">
              Sua presença é a próxima linha desta história. Conte para nós se poderá celebrar esse
              capítulo conosco.
            </p>

            <label className="rsvp-field">
              <span className="rsvp-label">
                <User size={16} aria-hidden="true" /> Nome completo
              </span>
              <input
                type="text"
                required
                className="rsvp-input"
                value={values.name}
                onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
              />
            </label>

            <div className="rsvp-field">
              <span className="rsvp-label">Você poderá comparecer?</span>
              <div className="rsvp-toggle" role="radiogroup" aria-label="Você poderá comparecer?">
                <label className="rsvp-radio">
                  <input
                    type="radio"
                    name="attending"
                    value="sim"
                    checked={values.attending === "sim"}
                    onChange={() => setValues((v) => ({ ...v, attending: "sim" }))}
                  />
                  <span>Sim, estarei lá</span>
                </label>
                <label className="rsvp-radio">
                  <input
                    type="radio"
                    name="attending"
                    value="nao"
                    checked={values.attending === "nao"}
                    onChange={() => setValues((v) => ({ ...v, attending: "nao" }))}
                  />
                  <span>Não poderei ir</span>
                </label>
              </div>
            </div>

            <label className="rsvp-field">
              <span className="rsvp-label">
                <Users size={16} aria-hidden="true" /> Número de acompanhantes (incluindo você)
              </span>
              <input
                type="number"
                min={1}
                required
                className="rsvp-input"
                value={values.guestCount}
                onChange={(e) =>
                  setValues((v) => ({ ...v, guestCount: Number(e.target.value) }))
                }
              />
            </label>

            <label className="rsvp-field">
              <span className="rsvp-label">
                <MessageSquareText size={16} aria-hidden="true" /> Recado para o casal (opcional)
              </span>
              <textarea
                className="rsvp-input rsvp-textarea"
                rows={3}
                value={values.message}
                onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))}
              />
            </label>

            <button type="submit" className="rsvp-button">
              Confirmar presença
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
