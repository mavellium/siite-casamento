import { FAQ_ITEMS } from "@/data/faq";
import { SectionHeading } from "./SectionHeading";

export function FaqSection() {
  return (
    <section id="faq" className="site-section faq-section">
      <SectionHeading eyebrow="Capítulo VII" title="Perguntas frequentes" />
      <div className="faq-list">
        {FAQ_ITEMS.map((item) => (
          <details key={item.id} className="faq-item">
            <summary className="faq-question">{item.question}</summary>
            <p className="faq-answer">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
