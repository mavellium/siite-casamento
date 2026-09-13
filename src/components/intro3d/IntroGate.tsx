"use client";

import { useEffect, useState } from "react";
import { Flipbook } from "@/components/flipbook/Flipbook";
import { SectionOverlay } from "@/components/sections/SectionOverlay";
import { Intro3DClientBoundary } from "./Intro3DClientBoundary";
import type { SectionId } from "@/types/section";

type MotionPreference = "unknown" | "reduced" | "full";

/**
 * Decide entre a introdução 3D (scroll-driven, termina com a câmera
 * parada sobre a mesa/menu) e o livro 2D direto (fallback reduced-motion,
 * sem 3D nenhum). No modo 3D, a mesa nunca é escondida — um SectionOverlay
 * genérico abre por cima dela (esmaecida via CSS) quando o usuário clica
 * num dos 5 objetos (ver Scene/InteractiveObject), e fecha de volta pro
 * menu com Escape/clique-fora/botão fechar.
 */
export function IntroGate() {
  const [motionPref, setMotionPref] = useState<MotionPreference>("unknown");
  const [activeSection, setActiveSection] = useState<SectionId | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // matchMedia não existe no SSR; isto só roda no cliente, é a única forma de ler
    // a preferência antes do primeiro paint pós-hidratação.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMotionPref(mq.matches ? "reduced" : "full");

    function handleChange(event: MediaQueryListEvent) {
      setMotionPref(event.matches ? "reduced" : "full");
    }
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  // Trava o scroll do documento enquanto uma seção está aberta — sem isso,
  // rolar dentro do overlay (ou só o gesto de scroll do mouse) continuaria
  // sendo captado pelo ScrollTrigger do spacer de 400vh por baixo,
  // movendo a câmera 3D com o overlay já aberto por cima.
  useEffect(() => {
    if (!activeSection) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeSection]);

  // Estado inicial (antes do useEffect rodar no cliente) — mesmo markup no server e no primeiro paint do cliente,
  // pra não dar mismatch de hidratação (matchMedia não existe durante SSR).
  if (motionPref === "unknown") {
    return <div className="intro3d-placeholder" aria-hidden="true" />;
  }

  // prefers-reduced-motion: nunca carrega o bundle de three/R3F — abre o livro do jeito de sempre (toque no lacre).
  if (motionPref === "reduced") {
    return <Flipbook />;
  }

  return (
    <div className="intro-gate">
      <div className={`intro-gate-3d${activeSection ? " is-faded" : ""}`}>
        <Intro3DClientBoundary onSelectSection={setActiveSection} />
      </div>
      <SectionOverlay section={activeSection} onClose={() => setActiveSection(null)} />
    </div>
  );
}
