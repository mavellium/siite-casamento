"use client";

import { useEffect, useRef, type ComponentType } from "react";
import { createPortal } from "react-dom";
import { CalendarClock, Images, MapPin, PenLine, X } from "lucide-react";
import { OrnamentDivider } from "@/components/flipbook/PageChrome";
import { Flipbook } from "@/components/flipbook/Flipbook";
import type { SectionId } from "@/types/section";
import { GALLERY_IMAGES } from "@/data/gallery";
import { LOCATION } from "@/data/location";
import { GalleryGrid } from "./GalleryGrid";
import { RsvpForm } from "./RsvpForm";
import { ScheduleOverlay } from "./ScheduleOverlay";
import { LocationInfo } from "./LocationInfo";

type SecaoSimples = Exclude<SectionId, "story">;

/**
 * Cabeçalho de cada seção.
 *
 * O `kicker` e o `subtitulo` existem porque o título sozinho vinha do NOME DO
 * OBJETO na cena ("Retrato", "Prancheta") — o que ajuda a ligar o painel à
 * peça que foi clicada, mas não diz o que a seção faz. O subtítulo responde
 * isso em uma linha, sem precisar renomear os objetos e perder a ligação.
 */
const SECOES: Record<SecaoSimples, {
  titulo: string;
  kicker: string;
  subtitulo: string;
  Icone: ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
}> = {
  gallery: {
    titulo: "Retrato",
    kicker: "banco de imagens",
    subtitulo: "Alguns instantes nossos, até aqui.",
    Icone: Images,
  },
  rsvp: {
    titulo: "Confirmação de presença",
    kicker: "prancheta",
    subtitulo: "Sua resposta nos ajuda a preparar tudo com carinho.",
    Icone: PenLine,
  },
  schedule: {
    titulo: "Cronograma",
    kicker: "calendário",
    subtitulo: "Quanto falta, e a ordem do nosso dia.",
    Icone: CalendarClock,
  },
  location: {
    titulo: "Localização",
    kicker: "globo",
    subtitulo: "Onde vamos celebrar com você.",
    Icone: MapPin,
  },
};

function SectionContent({ section }: { section: SecaoSimples }) {
  switch (section) {
    case "gallery":
      return <GalleryGrid images={GALLERY_IMAGES} />;
    case "rsvp":
      return <RsvpForm />;
    case "schedule":
      return <ScheduleOverlay />;
    case "location":
      return <LocationInfo {...LOCATION} />;
  }
}

/**
 * Modal genérico pras seções abertas a partir dos objetos do banco 3D —
 * mesmo padrão (backdrop + painel + focus-trap + Escape + trava de scroll)
 * já usado/testado em TableOfContents.tsx.
 *
 * O painel é um grid de duas faixas: cabeçalho FIXO e conteúdo rolável. Antes
 * o painel inteiro rolava, e em conteúdo alto (galeria, formulário) o título e
 * o botão de fechar saíam da tela — o usuário perdia a referência e a saída ao
 * mesmo tempo.
 *
 * "Livro" é um caso à parte: o pedido é o livro de página-virando de sempre
 * (setas, folhear, sumário pra pular direto pra uma parte) — não um resumo em
 * abas. Por isso renderiza o Flipbook de verdade em tela cheia (ele já é
 * pensado pra ocupar 100dvh sozinho, com suas próprias setas/rodapé/sumário)
 * em vez de encaixá-lo dentro do painel menor usado pelas outras seções.
 */
export function SectionOverlay({ section, onClose }: { section: SectionId | null; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!section) return;

    const focusable = panelRef.current?.querySelectorAll<HTMLElement>("a,button,input,textarea");
    focusable?.[0]?.focus();

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key === "Tab" && focusable && focusable.length > 0) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeydown, true);
    return () => document.removeEventListener("keydown", handleKeydown, true);
  }, [section, onClose]);

  if (!section) return null;

  if (section === "story") {
    return createPortal(
      <div ref={panelRef} className="section-story-fullscreen">
        <button
          type="button"
          className="section-story-close"
          onClick={onClose}
          aria-label="Fechar e voltar pro quarto"
        >
          <X size={18} aria-hidden="true" />
          <span className="section-story-close-label">Fechar</span>
        </button>
        <Flipbook />
      </div>,
      document.body
    );
  }

  const { titulo, kicker, subtitulo, Icone } = SECOES[section];

  /*
    createPortal pro body, igual ao ramo do livro: a cena 3D tem ancestrais
    com `transform` (o palco é sticky), e dentro de um ancestral transformado
    o `position: fixed` passa a se ancorar NELE, não na janela — o backdrop
    deixaria de cobrir a tela.
  */
  return createPortal(
    <div className="section-backdrop" onClick={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="section-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="leaf-corner leaf-corner-tl" />
        <span className="leaf-corner leaf-corner-tr" />
        <span className="leaf-corner leaf-corner-bl" />
        <span className="leaf-corner leaf-corner-br" />

        <header className="section-header">
          <button type="button" className="toc-close" onClick={onClose} aria-label="Fechar e voltar pro quarto">
            <X size={18} aria-hidden="true" />
          </button>

          <p className="section-kicker">
            <Icone size={13} aria-hidden={true} />
            {kicker}
          </p>
          <h2 className="toc-heading">{titulo}</h2>
          <p className="section-subtitle">{subtitulo}</p>
          <OrnamentDivider />
        </header>

        <div className="section-panel-content">
          <SectionContent section={section} />
        </div>
      </div>
    </div>,
    document.body
  );
}
