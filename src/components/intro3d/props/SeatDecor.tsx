"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { QUARTO } from "../palette";
import { ROOM, ASSENTO_TOPO_Y } from "../roomLayout";
import { mulberry32 } from "../geometry/random";

/**
 * O que divide o banco com os cinco objetos do menu: bandeja de palha com
 * xícara, vaso de vidro com mosquitinho e a lanterna âmbar acesa. Tudo isso
 * está na foto de referência — as almofadas saíram, e foi no lugar delas que
 * os objetos interativos entraram.
 *
 * A MANTA DE TRICÔ TAMBÉM SAIU, a pedido. Eram dois blocos arredondados
 * na ponta direita (um deitado no assento, outro escorrendo pela frente) e não
 * lia como tecido: com o relevo de trama fino e a cor de lençol, sob o sol
 * direto, as duas peças apareciam como DUAS TÁBUAS claras encostadas no canto,
 * bem ao lado do globo. Se um dia voltar, precisa de silhueta de pano (dobra
 * irregular, quina caída) — bloco arredondado não resolve.
 *
 * POSIÇÕES: os alvos clicáveis ocupam x de -0,54 a 1,14 (ver BenchMenu em
 * Scene.tsx). Tudo aqui mora fora desse intervalo, nas duas pontas, pra não
 * disputar clique nem cobrir peça do menu no mergulho final.
 */
export function SeatDecor() {
  const z = ROOM.zFundo + ROOM.assento.profundidade / 2;
  const y = ASSENTO_TOPO_Y;

  return (
    <group>
      <Tray position={[-1.18, y, z + 0.02]} />
      <FlowerVase position={[-1.44, y, z - 0.14]} />
      <Lantern position={[1.4, y, z - 0.18]} />
    </group>
  );
}

/** Bandeja de palha com uma xícara — o canto de café da foto. */
function Tray({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Fundo da bandeja */}
      <mesh position={[0, 0.008, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.115, 0.105, 0.016, 24]} />
        <meshStandardMaterial color={0xc2a274} roughness={0.92} metalness={0} />
      </mesh>
      {/* Borda — anel fino, é ele que diz "bandeja" e não "disco" */}
      <mesh position={[0, 0.025, 0]} castShadow>
        <torusGeometry args={[0.112, 0.011, 8, 24]} />
        <meshStandardMaterial color={0xb08f60} roughness={0.9} metalness={0} />
      </mesh>
      {/* Xícara */}
      <mesh position={[0.02, 0.05, 0.01]} castShadow receiveShadow>
        <cylinderGeometry args={[0.037, 0.03, 0.055, 18]} />
        <meshStandardMaterial color={0xf4f0e8} roughness={0.35} metalness={0.02} />
      </mesh>
      {/* Café dentro — some quase todo, mas sem ele a xícara lê como copo vazio de plástico */}
      <mesh position={[0.02, 0.077, 0.01]}>
        <circleGeometry args={[0.033, 18]} />
        <meshStandardMaterial color={0x3a2317} roughness={0.25} />
      </mesh>
      <mesh position={[0.062, 0.05, 0.01]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <torusGeometry args={[0.019, 0.005, 6, 14, Math.PI]} />
        <meshStandardMaterial color={0xf4f0e8} roughness={0.35} />
      </mesh>
    </group>
  );
}

/**
 * Vaso de vidro com mosquitinho (gipsofila).
 *
 * As florzinhas são um InstancedMesh de esferas minúsculas distribuídas numa
 * nuvem — é exatamente assim que gipsofila se comporta visualmente: não há
 * flor individual legível, há uma névoa branca. Modelar pétala aqui seria
 * trabalho jogado fora.
 */
function FlowerVase({ position }: { position: [number, number, number] }) {
  const { hastes, flores } = useMemo(() => {
    // Determinístico: mesma semente, mesmo buquê. (Ver geometry/random.ts.)
    const rnd = mulberry32(3121);
    const hastes = Array.from({ length: 9 }, () => ({
      angulo: rnd() * Math.PI * 2,
      inclinacao: 0.12 + rnd() * 0.3,
      altura: 0.14 + rnd() * 0.1,
    }));
    const flores = Array.from({ length: 70 }, () => ({
      x: (rnd() - 0.5) * 0.17,
      y: 0.13 + rnd() * 0.14,
      z: (rnd() - 0.5) * 0.17,
      r: 0.006 + rnd() * 0.006,
    }));
    return { hastes, flores };
  }, []);

  return (
    <group position={position}>
      {/* Vidro: transparente de verdade, mas com depthWrite ligado — é um
          objeto pequeno e isolado, então não há disputa de ordenação como
          haveria numa cortina inteira. */}
      <mesh position={[0, 0.06, 0]} castShadow>
        <cylinderGeometry args={[0.042, 0.035, 0.12, 20, 1, true]} />
        <meshStandardMaterial
          color={0xdfe9e6}
          roughness={0.05}
          metalness={0.08}
          transparent
          opacity={0.32}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.036, 0.035, 0.04, 20]} />
        <meshStandardMaterial color={0xa9c0b4} roughness={0.2} transparent opacity={0.5} />
      </mesh>

      {hastes.map((h, i) => (
        <mesh
          key={i}
          position={[
            Math.cos(h.angulo) * 0.02,
            0.12 + h.altura / 2,
            Math.sin(h.angulo) * 0.02,
          ]}
          rotation={[Math.cos(h.angulo) * h.inclinacao, 0, -Math.sin(h.angulo) * h.inclinacao]}
        >
          <cylinderGeometry args={[0.0016, 0.0016, h.altura, 4]} />
          <meshStandardMaterial color={0x6f8055} roughness={0.9} />
        </mesh>
      ))}

      {flores.map((f, i) => (
        <mesh key={i} position={[f.x, f.y, f.z]} castShadow>
          <sphereGeometry args={[f.r, 5, 4]} />
          <meshStandardMaterial color={0xfdfaf2} roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Lanterna âmbar acesa na ponta direita.
 *
 * É a ÚNICA fonte de decoração que ganha um pointLight de verdade, porque é a
 * que aparece em close no mergulho final e precisa lançar luz na madeira do
 * tampo. As velas das prateleiras e do criado-mudo são só disco emissivo que
 * floresce no Bloom — o orçamento da cena é de 9 luzes no total, e três já vão
 * pro pisca-pisca.
 *
 * O núcleo vai com a cor multiplicada por 3,4 pelo mesmo motivo dos bulbos:
 * o ACES do composer comprime tudo, então "aceso" precisa morar acima de 1.
 */
function Lantern({ position }: { position: [number, number, number] }) {
  const nucleo = useMemo(() => new THREE.Color(QUARTO.chama).multiplyScalar(3.4), []);

  return (
    <group position={position}>
      {/* Corpo de vidro */}
      <mesh position={[0, 0.075, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.15, 18, 1, true]} />
        <meshStandardMaterial
          color={0xffe0b0}
          roughness={0.1}
          transparent
          opacity={0.28}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Base e aro de metal */}
      <mesh position={[0, 0.008, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.054, 0.054, 0.016, 18]} />
        <meshStandardMaterial color={QUARTO.latao} roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.152, 0]} castShadow>
        <cylinderGeometry args={[0.054, 0.054, 0.012, 18]} />
        <meshStandardMaterial color={QUARTO.latao} roughness={0.4} metalness={0.7} />
      </mesh>
      {/* Núcleo aceso */}
      <mesh position={[0, 0.06, 0]}>
        <sphereGeometry args={[0.03, 12, 10]} />
        <meshBasicMaterial color={nucleo} />
      </mesh>
      <pointLight position={[0, 0.075, 0]} color={0xffb463} intensity={0.65} distance={1.1} decay={2} />
    </group>
  );
}
