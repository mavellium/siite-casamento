import { OrnamentDivider } from "@/components/flipbook/PageChrome";
import { FloralSprig } from "@/components/decor/FloralSprig";
import {
  COUPLE_NAMES,
  HERO_EYEBROW,
  HERO_TAGLINE,
  WEDDING_DATE_ISO,
} from "@/data/site-config";
import { formatEventDateLabel } from "@/lib/date";

export function HeroSection() {
  const [firstName, secondName] = COUPLE_NAMES.split(" & ");

  return (
    <section id="hero" className="site-section hero-section">
      <FloralSprig className="floral-corner floral-corner-tl" />
      <FloralSprig className="floral-corner floral-corner-br" />
      <div className="hero-scrim">
        <p className="hero-eyebrow">{HERO_EYEBROW}</p>
        <h1 className="hero-title">
          {firstName} <span className="hero-amp">&amp;</span> {secondName}
        </h1>
        <p className="hero-date">{formatEventDateLabel(WEDDING_DATE_ISO)}</p>
        <OrnamentDivider />
        <p className="hero-tagline">{HERO_TAGLINE}</p>
        <div className="hero-actions">
          <a href="#confirmacao" className="hero-cta hero-cta-primary">
            Confirmar presença
          </a>
          <a href="#historia" className="hero-cta hero-cta-secondary">
            Conhecer nossa história
          </a>
        </div>
      </div>
      <a href="#contagem" className="hero-scroll-cue" aria-hidden="true">
        <span />
      </a>
    </section>
  );
}
