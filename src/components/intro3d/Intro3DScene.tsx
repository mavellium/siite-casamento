"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CameraRig } from "./CameraRig";
import { BookMesh } from "./BookMesh";
import { Scene } from "./Scene";
import { PALETTE } from "./palette";
import type { ProgressRef } from "./progress";

/**
 * Progresso a partir do qual a capa é considerada "aberta o suficiente"
 * pra entregar pro livro 2D (ver IntroGate). Não é exatamente 1 pra dar
 * uma margem contra jitter de scroll bem no limite.
 */
const HANDOFF_THRESHOLD = 0.995;

function InvalidateBridge({ invalidateRef }: { invalidateRef: MutableRefObject<(() => void) | null> }) {
  const { invalidate } = useThree();
  useEffect(() => {
    invalidateRef.current = invalidate;
    return () => {
      invalidateRef.current = null;
    };
  }, [invalidate, invalidateRef]);
  return null;
}

export function Intro3DScene({
  onHandoff,
  closeSignal = 0,
}: {
  onHandoff: (open: boolean) => void;
  /**
   * Contador incrementado pelo IntroGate (via Flipbook.onOvershoot) pra pedir
   * o fechamento do livro em 3D — ver o useEffect que observa esse valor
   * logo abaixo.
   */
  closeSignal?: number;
}) {
  const spacerRef = useRef<HTMLDivElement>(null);
  // RefObject<number> em vez de desembrulhar .current aqui (que contava
  // como "ler ref durante o render" pro linter) — CameraRig/BookMesh só
  // leem progressRef.current dentro de useFrame, nunca durante render.
  const progressRef = useRef<ProgressRef["current"]>(0);
  const invalidateRef = useRef<(() => void) | null>(null);
  const handedOffRef = useRef(false);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  // Liga enquanto o tween de fechamento (abaixo) está rodando, pra evitar
  // que um scroll real (o onUpdate do ScrollTrigger) brigue com ele —
  // scrubaria progressRef de volta pro valor da rolagem real no meio da
  // animação de fechar.
  const isClosingRef = useRef(false);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    function updateNarrow() {
      setIsNarrow(window.innerWidth < 768);
    }
    updateNarrow();
    window.addEventListener("resize", updateNarrow);
    return () => window.removeEventListener("resize", updateNarrow);
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (!spacerRef.current) return;

    /*
      scrub:1 (sem pin) — o "prender" visual vem do CSS (.intro3d-stage é
      position:sticky dentro do spacer), não do mecanismo de pin do
      ScrollTrigger. Mais simples e evita o pin em JS brigar com layout do
      Next em dev (efeitos duplicados do StrictMode). O ScrollTrigger aqui
      só mede o progresso 0–1 da rolagem através do spacer.
    */
    const trigger = ScrollTrigger.create({
      trigger: spacerRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: 1,
      onUpdate: (self) => {
        if (isClosingRef.current) return;
        progressRef.current = self.progress;
        invalidateRef.current?.();

        const isOpen = self.progress >= HANDOFF_THRESHOLD;
        if (isOpen !== handedOffRef.current) {
          handedOffRef.current = isOpen;
          onHandoff(isOpen);
        }
      },
    });
    triggerRef.current = trigger;

    return () => {
      trigger.kill();
      triggerRef.current = null;
    };
  }, [onHandoff, progressRef]);

  /*
    Pedido de fechamento vindo de fora (Flipbook batendo no limite de
    capa/contracapa, ver IntroGate.handleOvershoot) — anima progressRef de
    volta a 0 na mão, já que CameraRig/BookMesh são funções puras dele
    (useFrame recalcula tudo a cada frame a partir do valor atual, sem
    estado de "fechando" separado), então reduzir esse número reproduz o
    fechamento inteiro de graça. closeSignal===0 é o valor inicial (nenhum
    pedido ainda) — só reage a incrementos de verdade.
  */
  useEffect(() => {
    if (closeSignal === 0 || isClosingRef.current) return;
    isClosingRef.current = true;
    handedOffRef.current = false;

    const tween = gsap.to(progressRef, {
      current: 0,
      duration: 1.3,
      ease: "power2.inOut",
      onUpdate: () => invalidateRef.current?.(),
      onComplete: () => {
        window.scrollTo({ top: 0, behavior: "instant" });
        triggerRef.current?.refresh();
        isClosingRef.current = false;
      },
    });

    return () => {
      tween.kill();
    };
  }, [closeSignal, progressRef]);

  return (
    <div className="intro3d-spacer" ref={spacerRef}>
      <div className="intro3d-stage">
        <Canvas
          shadows
          dpr={[1, 2]}
          frameloop="demand"
          camera={{ fov: 45, near: 0.1, far: 60 }}
          gl={{ antialias: true }}
          onCreated={({ scene }) => {
            scene.background = new THREE.Color(PALETTE.stageDark);
            scene.fog = new THREE.Fog(PALETTE.stageDark, 6, 16);
          }}
        >
          <InvalidateBridge invalidateRef={invalidateRef} />
          <hemisphereLight args={[PALETTE.parchment, PALETTE.sepia, 0.55]} />
          <ambientLight intensity={0.15} />
          <directionalLight
            position={[3, 6, 4]}
            intensity={1.1}
            color={0xffdca8}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-near={1}
            shadow-camera-far={15}
            shadow-camera-left={-5}
            shadow-camera-right={5}
            shadow-camera-top={5}
            shadow-camera-bottom={-5}
          />
          <CameraRig progressRef={progressRef} isNarrow={isNarrow} />
          <Scene />
          <BookMesh progressRef={progressRef} />
        </Canvas>
      </div>
    </div>
  );
}
