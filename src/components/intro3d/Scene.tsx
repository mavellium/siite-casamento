"use client";

import { useMemo } from "react";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { PALETTE } from "./palette";
import { TABLE_TOP_Y } from "./cameraKeyframes";

/**
 * Mesa + props decorativos fora de foco, tudo primitivas Three.js (sem
 * assets externos). "Fora de foco" é simulado com THREE.Fog (ver
 * Intro3DScene) em vez de um passe real de depth-of-field, que é caro
 * demais pro orçamento de 60fps em mobile.
 */
export function Scene() {
  const tableTopGeometry = useMemo(() => new RoundedBoxGeometry(6, 0.3, 4.4, 3, 0.06), []);

  return (
    <group>
      {/* Mesa */}
      <mesh position={[0, TABLE_TOP_Y - 0.15, 0]} geometry={tableTopGeometry} castShadow receiveShadow>
        <meshStandardMaterial color={PALETTE.sepia} roughness={0.65} metalness={0} />
      </mesh>
      <mesh position={[0, (TABLE_TOP_Y - 0.3) / 2, 0]} receiveShadow>
        <boxGeometry args={[0.25, TABLE_TOP_Y - 0.3, 0.25]} />
        <meshStandardMaterial color={PALETTE.sepia} roughness={0.7} />
      </mesh>

      {/* Chão simples, só pra receber sombra e dar profundidade */}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[9, 32]} />
        <meshStandardMaterial color={PALETTE.stageDark} roughness={0.95} />
      </mesh>

      <FramedPhoto position={[-2.1, TABLE_TOP_Y + 0.55, -1.1]} rotationY={0.35} />
      <Candle position={[2, TABLE_TOP_Y + 0.02, -0.9]} />
      <FlowerCluster position={[-1.5, TABLE_TOP_Y + 0.02, 1.1]} />
      <FlowerCluster position={[2.1, TABLE_TOP_Y + 0.02, 1.3]} scale={0.75} />
    </group>
  );
}

function FramedPhoto({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.7, 0.9, 0.05]} />
        <meshStandardMaterial color={PALETTE.seal} roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[0.56, 0.76]} />
        <meshStandardMaterial color={PALETTE.roseBlush} roughness={0.8} />
      </mesh>
    </group>
  );
}

function Candle({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.1, 0.7, 16]} />
        <meshStandardMaterial color={PALETTE.parchment} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.72, 0]}>
        <coneGeometry args={[0.04, 0.1, 8]} />
        <meshStandardMaterial color={PALETTE.seal} emissive={PALETTE.seal} emissiveIntensity={0.9} />
      </mesh>
      <pointLight position={[0, 0.78, 0]} color={PALETTE.seal} intensity={0.6} distance={2.5} decay={2} />
    </group>
  );
}

function FlowerCluster({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  const petalColors = [PALETTE.roseBlush, PALETTE.sage, PALETTE.roseBlush, PALETTE.sage, PALETTE.roseBlush, PALETTE.sage];

  return (
    <group position={position} scale={scale}>
      {petalColors.map((color, i) => {
        const angle = (i / petalColors.length) * Math.PI * 2;
        const radius = 0.13;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * radius, 0.1, Math.sin(angle) * radius]}
            rotation={[0, -angle, 0]}
            castShadow
          >
            <sphereGeometry args={[0.09, 8, 6]} />
            <meshStandardMaterial color={color} roughness={0.75} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.1, 0]} castShadow>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshStandardMaterial color={PALETTE.seal} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.02, 0.2, 6]} />
        <meshStandardMaterial color={PALETTE.sageDeep} roughness={0.8} />
      </mesh>
    </group>
  );
}
