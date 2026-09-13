"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { getCameraKeyframes, type CameraKeyframe } from "./cameraKeyframes";
import type { ProgressRef } from "./progress";

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function applyKeyframe(
  a: CameraKeyframe,
  b: CameraKeyframe,
  t: number,
  outPos: THREE.Vector3,
  outLookAt: THREE.Vector3
): number {
  outPos.set(
    THREE.MathUtils.lerp(a.position[0], b.position[0], t),
    THREE.MathUtils.lerp(a.position[1], b.position[1], t),
    THREE.MathUtils.lerp(a.position[2], b.position[2], t)
  );
  outLookAt.set(
    THREE.MathUtils.lerp(a.lookAt[0], b.lookAt[0], t),
    THREE.MathUtils.lerp(a.lookAt[1], b.lookAt[1], t),
    THREE.MathUtils.lerp(a.lookAt[2], b.lookAt[2], t)
  );
  return THREE.MathUtils.lerp(a.fov, b.fov, t);
}

/**
 * FOV VERTICAL (graus) necessário pra mostrar `largura` metros na horizontal,
 * a `distancia` da câmera, numa tela de proporção `aspect`.
 *
 * O FOV do three é vertical; a largura visível depende dele E do aspect. Por
 * isso uma tela em retrato (aspect ~0,46) precisa de um FOV vertical muito
 * maior pra mostrar a mesma largura que uma tela larga (aspect ~1,56).
 */
function fovParaLargura(largura: number, distancia: number, aspect: number): number {
  const meiaHorizontal = Math.atan(largura / 2 / distancia);
  return THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(meiaHorizontal) / aspect));
}

/**
 * Acha o par de keyframes que cerca o progresso atual e o t normalizado
 * dentro desse trecho.
 *
 * Substituiu um split fixo em 0.5 entre exatamente 3 keyframes. Além de não
 * escalar pra 4, o split fixo dava a cada trecho o mesmo pedaço do scroll —
 * e os trechos não têm a mesma importância. Com `stop` explícito, a parada na
 * janela ganha 38% do percurso e a aproximação inicial só 30%.
 */
function segmentAt(kfs: readonly CameraKeyframe[], eased: number) {
  for (let i = 0; i < kfs.length - 1; i++) {
    const inicio = kfs[i].stop;
    const fim = kfs[i + 1].stop;
    if (eased < fim || i === kfs.length - 2) {
      const span = fim - inicio;
      // span 0 significaria dois keyframes no mesmo ponto: devolve 0 em vez
      // de dividir por zero e mandar NaN pra matriz da câmera.
      const t = span > 0 ? THREE.MathUtils.clamp((eased - inicio) / span, 0, 1) : 0;
      return { a: kfs[i], b: kfs[i + 1], t };
    }
  }
  return { a: kfs[0], b: kfs[kfs.length - 1], t: eased };
}

/**
 * Move a câmera pelos estados conforme progressRef.current (0–1 do percurso
 * de scroll inteiro). Lê o progresso a cada frame em vez de via props/estado
 * React — evita re-render a 60fps, e mantém GSAP (que escreve em progressRef
 * fora da árvore do R3F) e o R3F (que só lê) sem disputar quem "possui" a
 * câmera.
 */
export function CameraRig({ progressRef, isNarrow }: { progressRef: ProgressRef; isNarrow: boolean }) {
  const { camera } = useThree();
  const posVec = useRef(new THREE.Vector3()).current;
  const lookVec = useRef(new THREE.Vector3()).current;
  const keyframesRef = useRef(getCameraKeyframes(isNarrow));

  useEffect(() => {
    keyframesRef.current = getCameraKeyframes(isNarrow);
  }, [isNarrow]);

  /*
    eslint-disable react-hooks/immutability -- padrão canônico do R3F:
    useFrame roda fora do ciclo de render do React (é o próprio motor de
    animação da lib), e mutar objetos three.js (camera, Vector3) direto
    dentro dele é a forma documentada/recomendada de animar em R3F — a
    alternativa (useState a cada frame) recriaria a cena a 60fps.
  */
  useFrame(() => {
    const camProgress = THREE.MathUtils.clamp(progressRef.current, 0, 1);
    const eased = easeInOutCubic(camProgress);
    const kfs = keyframesRef.current;

    const { a, b, t } = segmentAt(kfs, eased);
    let fov = applyKeyframe(a, b, t, posVec, lookVec);

    /*
      Garante a largura mínima do keyframe de destino (ver larguraMinima em
      cameraKeyframes). Em tela larga o FOV do keyframe já basta e isto não
      muda nada; em retrato ele abre o suficiente pra fileira inteira de
      objetos caber. Interpolado por t pra abrir durante o mergulho, e não
      saltar de uma vez no último quadro.
    */
    if (b.larguraMinima && camera instanceof THREE.PerspectiveCamera) {
      const minimo = fovParaLargura(b.larguraMinima, posVec.distanceTo(lookVec), camera.aspect);
      if (minimo > fov) fov = THREE.MathUtils.lerp(fov, minimo, t);
    }

    camera.position.copy(posVec);
    camera.lookAt(lookVec);
    /*
      Espelha a câmera em window.__cam para os testes de screenshot poderem
      registrar QUAL keyframe a foto corresponde. Sem isso já aconteceu de
      capturar dois frames idênticos e perseguir um bug que não existia.
    */
    (window as unknown as { __cam?: number[] }).__cam = [
      +camProgress.toFixed(3),
      +camera.position.x.toFixed(2),
      +camera.position.y.toFixed(2),
      +camera.position.z.toFixed(2),
    ];
    if (camera instanceof THREE.PerspectiveCamera && camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    /* eslint-enable react-hooks/immutability */
  });

  return null;
}
