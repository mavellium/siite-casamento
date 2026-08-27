"use client";

import { useCallback, useEffect, useState } from "react";
import { Flipbook } from "@/components/flipbook/Flipbook";
import { Intro3DClientBoundary } from "./Intro3DClientBoundary";

type MotionPreference = "unknown" | "reduced" | "full";

/** Tempo do cross-fade CSS entre o canvas 3D e o livro 2D — usado só pra saber quando desmontar o que sumiu. */
const CROSSFADE_MS = 400;

/**
 * Decide entre a introdução 3D (scroll-driven) e o livro 2D direto, e
 * orquestra a entrega reversível entre os dois: ao cruzar o limiar de
 * abertura da capa (ver Intro3DScene's onHandoff), monta/desmonta
 * <Flipbook startOpen /> com um cross-fade — o canvas 3D nunca desmonta
 * (fica só esmaecido), pra poder reaparecer instantaneamente se o
 * usuário rolar de volta.
 *
 * A mesma reversibilidade também é disparada de DENTRO do livro 2D: se o
 * usuário tenta folhear além da capa/contracapa (ver Flipbook.onOvershoot),
 * handleOvershoot fecha o livro 2D (setBookOpen(false), reaproveitando o
 * cross-fade acima) e pede pro Intro3DScene animar o fechamento em 3D
 * (closeSignal) — sem esse pedido, o valor de progresso do 3D ficaria
 * parado em "aberto" mesmo com o 2D já escondido.
 */
export function IntroGate() {
  const [motionPref, setMotionPref] = useState<MotionPreference>("unknown");
  const [bookOpen, setBookOpen] = useState(false);
  const [showFlipbook, setShowFlipbook] = useState(false);
  const [closeSignal, setCloseSignal] = useState(0);

  const handleOvershoot = useCallback(() => {
    setBookOpen(false);
    setCloseSignal((n) => n + 1);
  }, []);

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

  useEffect(() => {
    if (bookOpen) {
      // Sincroniza a montagem do Flipbook com bookOpen — precisa ser efeito (não estado
      // derivável em render) pra poder atrasar o caminho inverso (setTimeout abaixo) e
      // cancelá-lo se bookOpen virar true de novo antes de disparar.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowFlipbook(true);
      return;
    }
    const timeout = setTimeout(() => setShowFlipbook(false), CROSSFADE_MS);
    return () => clearTimeout(timeout);
  }, [bookOpen]);

  /*
    O livro 2D é um overlay position:fixed por cima do spacer de 400vh da
    intro 3D — sem travar o scroll do documento, QUALQUER rolagem real
    enquanto o usuário está lendo o livro (roda do mouse, trackpad, até uma
    página interna como FAQ/RSVP que "estoura" o próprio scroll e borbulha
    pro documento) continua sendo captada pelo ScrollTrigger ainda ativo em
    Intro3DScene — podendo derrubar o progresso abaixo de HANDOFF_THRESHOLD
    e fechar o livro sozinho, sem o usuário ter tocado em nenhuma seta de
    limite. Travar o scroll do documento inteiro enquanto o livro está
    visível elimina essa classe de fechamento espúrio na raiz.
  */
  useEffect(() => {
    if (!bookOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [bookOpen]);

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
      <div className={`intro-gate-3d${bookOpen ? " is-faded" : ""}`}>
        <Intro3DClientBoundary onHandoff={setBookOpen} closeSignal={closeSignal} />
      </div>
      {showFlipbook && (
        <div className={`intro-gate-2d${bookOpen ? " is-visible" : ""}`}>
          <Flipbook startOpen onOvershoot={handleOvershoot} />
        </div>
      )}
    </div>
  );
}
