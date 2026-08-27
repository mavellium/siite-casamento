"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { PALETTE } from "./palette";
import { BOOK_CENTER, BOOK_DEPTH, BOOK_SPINE, BOOK_WIDTH, TABLE_TOP_Y } from "./cameraKeyframes";
import { CAMERA_PROGRESS_END } from "./CameraRig";
import type { ProgressRef } from "./progress";

const MAX_OPEN_ANGLE = Math.PI * 0.86; // ~155°, não bate 180° pra continuar legível de cima

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Livro fechado (bloco de páginas + capa numa dobradiça pivotada na
 * lombada) cuja abertura é dirigida pela MESMA progressRef que move a
 * câmera (CameraRig) — de CAMERA_PROGRESS_END até 1 do progresso geral.
 * Usar a mesma variável (em vez de um timeline à parte) é o que garante a
 * reversibilidade: scrubar pra trás fecha a capa automaticamente, sem
 * lógica extra de "desfazer".
 *
 * A sombra de contato da lombada (plano com gradiente radial) é
 * escalada/esmaecida pelo mesmo hingeProgress que gira a capa — nunca
 * pode desalinhar porque é a mesma variável, e permite o efeito pedido
 * (mais escura/apertada perto da lombada, suave conforme a capa levanta)
 * que um mapa de sombra genérico não garante sozinho.
 */
export function BookMesh({ progressRef }: { progressRef: ProgressRef }) {
  const hingeRef = useRef<THREE.Group>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const shadowMaterialRef = useRef<THREE.MeshBasicMaterial>(null);

  // Mesma profundidade (BOOK_DEPTH) da capa fechada — senão o bloco de
  // páginas "vaza" por baixo da capa mesmo com o livro fechado, quebrando a
  // leitura de "fechado = um retângulo sólido só" visto de cima. Capa um
  // pouco mais "alta" (BOOK_DEPTH+0.04) que o bloco de páginas só pra dar
  // uma pequena borda visível nas bordas de cima/baixo.
  const pageBlockGeometry = useMemo(() => new RoundedBoxGeometry(BOOK_WIDTH, 0.12, BOOK_DEPTH, 2, 0.02), []);
  const coverGeometry = useMemo(
    () => new RoundedBoxGeometry(BOOK_WIDTH, 0.06, BOOK_DEPTH + 0.04, 2, 0.03),
    []
  );
  const shadowTexture = useMemo(() => createRadialShadowTexture(), []);

  useFrame(() => {
    const overall = progressRef.current;
    const hinge = THREE.MathUtils.clamp((overall - CAMERA_PROGRESS_END) / (1 - CAMERA_PROGRESS_END), 0, 1);
    const eased = easeOutCubic(hinge);

    if (hingeRef.current) {
      // Positivo: a borda que abre (lado direito, oposto à lombada em X
      // negativo) levanta e gira em direção à lombada — abre da direita
      // pra esquerda, como um livro de verdade.
      hingeRef.current.rotation.z = eased * MAX_OPEN_ANGLE;
    }
    if (shadowRef.current && shadowMaterialRef.current) {
      const scale = THREE.MathUtils.lerp(0.5, 1.4, eased);
      shadowRef.current.scale.set(scale, scale * 1.15, 1);
      shadowMaterialRef.current.opacity = THREE.MathUtils.lerp(0.55, 0.1, eased);
    }
  });

  return (
    <group>
      {/* Bloco de páginas — fixo, não gira */}
      <mesh
        position={[BOOK_CENTER[0], BOOK_CENTER[1] - 0.02, BOOK_CENTER[2]]}
        geometry={pageBlockGeometry}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={PALETTE.parchment} roughness={0.85} />
      </mesh>

      {/* Capa — dobradiça pivotada exatamente na lombada (borda esquerda), não no centro da capa */}
      <group ref={hingeRef} position={BOOK_SPINE}>
        <mesh position={[BOOK_WIDTH / 2, 0.03, 0]} geometry={coverGeometry} castShadow receiveShadow>
          <meshStandardMaterial color={PALETTE.roseBlush} roughness={0.55} metalness={0.05} />
        </mesh>
        {/* friso dourado na borda externa da capa (lado direito, oposto à lombada) */}
        <mesh position={[BOOK_WIDTH - 0.02, 0.062, 0]}>
          <boxGeometry args={[0.03, 0.006, BOOK_DEPTH - 0.02]} />
          <meshStandardMaterial color={PALETTE.seal} roughness={0.3} metalness={0.5} />
        </mesh>
      </group>

      {/* Sombra de contato na lombada, sincronizada ao mesmo progresso do hinge */}
      <mesh
        ref={shadowRef}
        position={[BOOK_SPINE[0] + 0.05, TABLE_TOP_Y + 0.001, BOOK_SPINE[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[BOOK_WIDTH + 0.15, BOOK_DEPTH + 0.2]} />
        <meshBasicMaterial
          ref={shadowMaterialRef}
          map={shadowTexture}
          color={PALETTE.stageDark}
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/** Textura de gradiente radial (escuro no centro, transparente na borda) pra sombra de contato. */
function createRadialShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(0,0,0,1)");
    gradient.addColorStop(0.6, "rgba(0,0,0,0.5)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
