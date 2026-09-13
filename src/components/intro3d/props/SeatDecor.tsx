"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { QUARTO } from "../palette";
import { ROOM, ASSENTO_TOPO_Y } from "../roomLayout";
import { mulberry32 } from "../geometry/random";
import { usePbrMaterial } from "../textures/usePbrMaterial";

/**
 * O que divide o banco com os cinco objetos do menu: bandeja de palha com
 * xícara, vaso de vidro com mosquitinho, manta de tricô caída na ponta direita
 * e a lanterna âmbar acesa. Tudo isso está na foto de referência — só as
 * almofadas saíram, e foi no lugar delas que os objetos interativos entraram.
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
      <KnitThrow />
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
 * Manta de tricô caída na ponta direita do banco, escorrendo pela frente.
 *
 * Duas peças: a parte deitada no assento e a que pende. Sem a segunda a manta
 * lê como almofada dobrada — é o pedaço pendurado, quebrando a linha reta do
 * móvel, que diz "manta".
 */
function KnitThrow() {
  const geo = useMemo(() => new RoundedBoxGeometry(1, 1, 1, 4, 0.22), []);
  /*
    Relevo de trama vindo do denim_fabric. semCor porque o Diffuse dele é
    azul-marinho e tingir por multiplicação daria cinza sujo — o que interessa
    é só a trama. Sem relevo nenhum a manta era um bloco liso e, sendo a
    superfície mais clara sob o sol direto, lia como plástico branco.
  */
  const trama = usePbrMaterial("denim_fabric", { repeat: [2.5, 2.5], normalScale: 1.6, semCor: true });
  const { assento, zFundo } = ROOM;
  const y = ASSENTO_TOPO_Y;
  const zCentro = zFundo + assento.profundidade / 2;

  /*
    x = 1.36, encostada na ponta direita. A primeira versão ficava em x = 1.12,
    largura 0.56 — exatamente EMBAIXO do Globo (x = 1.14): no mergulho de cima o
    globo aparecia pousado sobre a manta e os dois viravam uma mancha só.
    Agora ela ocupa de ~1.23 a ~1.49 e fica na metade da FRENTE do assento; a
    lanterna mora na metade de trás, encostada no vidro.

    Cor um degrau mais escura que o lençol (0xe0d3bd): era a superfície mais
    clara do quadro sob o sol direto e estourava.
  */
  return (
    <group>
      {/* Parte dobrada sobre o assento — baixa e estreita. */}
      <mesh
        geometry={geo}
        position={[1.36, y + 0.022, zCentro + 0.08]}
        scale={[0.26, 0.044, 0.3]}
        rotation={[0, 0.1, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial {...trama} color={0xe0d3bd} roughness={0.99} metalness={0} />
      </mesh>
      {/*
        A ponta que escorre pela frente do banco, encostada na borda do tampo:
        é a dobra sobre a quina que faz o tecido parecer tecido. Sem ela a
        manta lê como almofada dobrada.
      */}
      <mesh
        geometry={geo}
        position={[1.37, y - 0.13, assento.zFrente - 0.005]}
        scale={[0.24, 0.36, 0.045]}
        rotation={[0.04, 0.08, 0.05]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial {...trama} color={0xd9ccb4} roughness={0.99} metalness={0} />
      </mesh>
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
