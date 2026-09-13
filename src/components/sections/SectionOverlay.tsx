"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { OrnamentDivider } from "@/components/flipbook/PageChrome";
import { Flipbook } from "@/components/flipbook/Flipbook";
import type { SectionId } from "@/types/section";
import { GALLERY_IMAGES } from "@/data/gallery";
import { LOCATION } from "@/data/location";
import { GalleryGrid } from "./GalleryGrid";
import { RsvpForm } from "./RsvpForm";
import { ScheduleOverlay } from "./ScheduleOverlay";
import { LocationInfo } from "./LocationInfo";

const SECTION_TITLES: Record<SectionId, string> = {
  gallery: "Retrato",
  story: "Livro",
  rsvp: "Confirmação de presença",
  schedule: "Cronograma",
  location: "Localização",
};

function SectionContent({ section }: { section: Exclude<SectionId, "story"> }) {
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
 * Modal genérico pras 5 seções abertas a partir dos objetos da mesa 3D —
 * mesmo padrão (backdrop + painel + focus-trap + Escape + trava de scroll)
 * já usado/testado em TableOfContents.tsx.
 *
 * "Livro" é um caso à parte: o pedido é o livro de página-virando de
 * sempre (setas, folhear, sumário pra pular direto pra uma parte) — não
 * um resumo em abas. Por isso renderiza o Flipbook de verdade em tela
 * cheia (ele já é pensado pra ocupar 100dvh sozinho, com suas próprias
 * setas/rodapé/sumário) em vez de encaixá-lo dentro do .section-panel
 * menor usado pelas outras 4 seções.
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
          aria-label="Fechar e voltar pra mesa"
        >
          <X size={20} aria-hidden="true" />
        </button>
        <Flipbook />
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="section-backdrop" onClick={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={SECTION_TITLES[section]}
        className="section-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="leaf-corner leaf-corner-tl" />
        <span className="leaf-corner leaf-corner-tr" />
        <span className="leaf-corner leaf-corner-bl" />
        <span className="leaf-corner leaf-corner-br" />

        <button type="button" className="toc-close" onClick={onClose} aria-label="Fechar e voltar pra mesa">
          <X size={18} aria-hidden="true" />
        </button>

        <h2 className="toc-heading">{SECTION_TITLES[section]}</h2>
        <OrnamentDivider />

        <div className="section-panel-content">
          <SectionContent section={section} />
        </div>
      </div>
    </div>,
    document.body
  );
}
