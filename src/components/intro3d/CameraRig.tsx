"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { getCameraKeyframes, type CameraKeyframe } from "./cameraKeyframes";
import type { ProgressRef } from "./progress";

/** Fração do progresso geral (0–1) dedicada ao movimento de câmera; o resto (até 1) é a abertura da capa. */
export const CAMERA_PROGRESS_END = 0.6;

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
 * Move a câmera pelos 3 estados conforme progressRef.current (0–CAMERA_PROGRESS_END
 * do progresso geral do scroll). Lê o progresso a cada frame em vez de via
 * props/estado React — evita re-render a 60fps, e mantém GSAP (que escreve
 * em progressRef fora da árvore do R3F) e o R3F (que só lê) sem disputar
 * quem "possui" a câmera.
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
    const overall = progressRef.current;
    const camProgress = THREE.MathUtils.clamp(overall / CAMERA_PROGRESS_END, 0, 1);
    const eased = easeInOutCubic(camProgress);
    const kfs = keyframesRef.current;

    let fov: number;
    if (eased <= 0.5) {
      fov = applyKeyframe(kfs[0], kfs[1], eased / 0.5, posVec, lookVec);
    } else {
      fov = applyKeyframe(kfs[1], kfs[2], (eased - 0.5) / 0.5, posVec, lookVec);
    }

    camera.position.copy(posVec);
    camera.lookAt(lookVec);
    if (camera instanceof THREE.PerspectiveCamera && camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    /* eslint-enable react-hooks/immutability */
  });

  return null;
}
