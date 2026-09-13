"use client";

import { useMemo } from "react";
import { PALETTE } from "../palette";
import { createWoodGrainTexture } from "../textures/proceduralTextures";

/** "Prancheta" — abre o formulário de RSVP. Primitivas simples, deitada na mesa. */
export function Clipboard() {
  const woodTexture = useMemo(() => {
    const texture = createWoodGrainTexture(PALETTE.sepia, 5);
    texture.repeat.set(1, 1.5);
    return texture;
  }, []);

  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.46, 0.02, 0.62]} />
        <meshStandardMaterial map={woodTexture} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.011, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.38, 0.52]} />
        <meshStandardMaterial color={PALETTE.parchment} roughness={0.9} />
      </mesh>
      {[0.15, 0.05, -0.05].map((z) => (
        <mesh key={z} position={[0, 0.013, z]} castShadow>
          <boxGeometry args={[0.24, 0.005, 0.01]} />
          <meshStandardMaterial color={PALETTE.sageDeep} roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 0.03, -0.29]} castShadow>
        <boxGeometry args={[0.14, 0.03, 0.05]} />
        <meshStandardMaterial color={PALETTE.seal} roughness={0.3} metalness={0.5} />
      </mesh>
    </group>
  );
}
