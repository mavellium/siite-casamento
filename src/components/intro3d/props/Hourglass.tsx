"use client";

import { PALETTE } from "../palette";

const CORNER_POSTS: Array<[number, number]> = [
  [0.11, 0.11],
  [0.11, -0.11],
  [-0.11, 0.11],
  [-0.11, -0.11],
];

/** "Calendário/Timer" — cronograma do evento (contagem regressiva + horários). */
export function Hourglass() {
  return (
    <group>
      {/*
        bulbo de cima — ápice pra baixo. MeshTransmissionMaterial (drei) foi
        tentada aqui pra vidro de verdade (refração), mas renderizou como um
        borrão escuro nesta cena — provavelmente conflita com o
        EffectComposer da pilha de pós-processamento (ambos capturam/
        recapturam o buffer da cena). Revertido pro material transparente
        simples, que já ficava bem numa peça tão pequena.
      */}
      <mesh position={[0, 0.08, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[0.12, 0.16, 12]} />
        <meshStandardMaterial color={PALETTE.roseBlush} roughness={0.2} transparent opacity={0.55} />
      </mesh>
      {/* bulbo de baixo — ápice pra cima */}
      <mesh position={[0, -0.08, 0]} castShadow>
        <coneGeometry args={[0.12, 0.16, 12]} />
        <meshStandardMaterial color={PALETTE.roseBlush} roughness={0.2} transparent opacity={0.55} />
      </mesh>
      {/* "areia" acumulada embaixo */}
      <mesh position={[0, -0.13, 0]} scale={[0.7, 0.4, 0.7]}>
        <sphereGeometry args={[0.08, 8, 6]} />
        <meshStandardMaterial color={PALETTE.seal} roughness={0.7} />
      </mesh>
      {/* discos de topo/base */}
      <mesh position={[0, 0.16, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.14, 0.02, 16]} />
        <meshStandardMaterial color={PALETTE.sepia} roughness={0.6} />
      </mesh>
      <mesh position={[0, -0.16, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.14, 0.02, 16]} />
        <meshStandardMaterial color={PALETTE.sepia} roughness={0.6} />
      </mesh>
      {/* postes de canto ligando os discos */}
      {CORNER_POSTS.map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, 0, z]} castShadow>
          <cylinderGeometry args={[0.008, 0.008, 0.32, 6]} />
          <meshStandardMaterial color={PALETTE.sepia} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}
