"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { PALETTE } from "./palette";
import { BOOK_DEPTH, BOOK_WIDTH } from "./cameraKeyframes";

/**
 * Livro fechado (bloco de páginas + capa), pousado na mesa como um dos
 * objetos clicáveis do menu — não abre mais sozinho via scroll (ver
 * SectionOverlay: clicar no objeto "Livro" abre o Flipbook de página-
 * virando de sempre em tela cheia, sem flourish de abertura por
 * enquanto). Todas as coordenadas aqui são
 * LOCAIS ao grupo pai (fornecido por InteractiveObject, posicionado em
 * BOOK_CENTER) — não mais absolutas de mundo como antes, quando este
 * componente não tinha pai posicionado.
 */
export function BookMesh() {
  // Mesma profundidade (BOOK_DEPTH) da capa fechada — senão o bloco de
  // páginas "vaza" por baixo da capa, quebrando a leitura de "fechado = um
  // retângulo sólido só" visto de cima. Capa um pouco mais "alta"
  // (BOOK_DEPTH+0.04) que o bloco de páginas só pra dar uma pequena borda
  // visível nas bordas de cima/baixo.
  const pageBlockGeometry = useMemo(() => new RoundedBoxGeometry(BOOK_WIDTH, 0.12, BOOK_DEPTH, 2, 0.02), []);
  const coverGeometry = useMemo(
    () => new RoundedBoxGeometry(BOOK_WIDTH, 0.06, BOOK_DEPTH + 0.04, 2, 0.03),
    []
  );
  const shadowTexture = useMemo(() => createRadialShadowTexture(), []);

  return (
    <group>
      {/* Bloco de páginas */}
      <mesh position={[0, -0.02, 0]} geometry={pageBlockGeometry} castShadow receiveShadow>
        <meshStandardMaterial color={PALETTE.parchment} roughness={0.85} />
      </mesh>

      {/* Capa — lombada na borda esquerda (X negativo), fechada (sem rotação) */}
      <group position={[-BOOK_WIDTH / 2, 0, 0]}>
        <mesh position={[BOOK_WIDTH / 2, 0.03, 0]} geometry={coverGeometry} castShadow receiveShadow>
          <meshStandardMaterial color={PALETTE.roseBlush} roughness={0.55} metalness={0.05} />
        </mesh>
        {/* friso dourado na borda externa da capa (lado direito, oposto à lombada) */}
        <mesh position={[BOOK_WIDTH - 0.02, 0.062, 0]}>
          <boxGeometry args={[0.03, 0.006, BOOK_DEPTH - 0.02]} />
          <meshStandardMaterial color={PALETTE.seal} roughness={0.3} metalness={0.5} />
        </mesh>
      </group>

      {/* Sombra de contato — fixa nos valores de "fechado" (livro nunca abre mais) */}
      <mesh position={[-BOOK_WIDTH / 2 + 0.05, -0.079, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.5, 0.575, 1]}>
        <planeGeometry args={[BOOK_WIDTH + 0.15, BOOK_DEPTH + 0.2]} />
        <meshBasicMaterial
          map={shadowTexture}
          color={PALETTE.stageDark}
          transparent
          opacity={0.55}
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
