"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { QUARTO } from "../palette";
import { ROOM, ASSENTO_TOPO_Y } from "../roomLayout";
import { mulberry32 } from "../geometry/random";

/**
 * O que divide o banco com os cinco objetos do menu: o conjunto de café
 * (xícara no pratinho, com vapor, e a garrafa térmica ao lado), o vaso de
 * vidro com mosquitinho e a lanterna âmbar acesa. As almofadas da foto de
 * referência saíram, e foi no lugar delas que os objetos interativos entraram.
 *
 * A BANDEJA DE PALHA COM XÍCARA virou o conjunto de café a pedido: do
 * enquadramento da cena ela lia como VELA — a xícara era um cilindro branco
 * liso e o aro da bandeja, visto por trás dela, fazia as vezes de castiçal.
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
      <CoffeeSet position={[-1.12, y, z + 0.05]} />
      <CoffeePot position={[-0.86, y, z - 0.08]} />
      <FlowerVase position={[-1.44, y, z - 0.14]} />
      <Lantern position={[1.4, y, z - 0.18]} />
    </group>
  );
}

/**
 * Conjunto de café: xícara com alça sobre pratinho, com vapor subindo.
 *
 * SUBSTITUIU uma bandeja de palha com uma xícara. O que havia ali lia como
 * VELA, não como café: a xícara era um cilindro branco liso sem alça, e o aro
 * da bandeja passando atrás dela virava um castiçal. Alça, pratinho, café
 * visível e vapor são justamente os sinais que dizem "xícara" à primeira
 * vista.
 */
function CoffeeSet({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Pratinho: tronco de cone bem raso, mais largo em cima. */}
      <mesh position={[0, 0.005, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.068, 0.052, 0.01, 28]} />
        <meshStandardMaterial color={0xf6f2ea} roughness={0.28} metalness={0.02} />
      </mesh>
      {/* Anel da borda — é ele que diferencia pratinho de disco. */}
      <mesh position={[0, 0.011, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.06, 0.004, 8, 28]} />
        <meshStandardMaterial color={0xeee9df} roughness={0.3} metalness={0.02} />
      </mesh>

      {/* Corpo da xícara, aberto em cima pra se ver o café dentro. */}
      <mesh position={[0, 0.043, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.038, 0.029, 0.058, 24, 1, true]} />
        <meshStandardMaterial color={0xfbf8f2} roughness={0.22} metalness={0.02} side={THREE.DoubleSide} />
      </mesh>
      {/* Fundo da xícara (o corpo é openEnded e vazaria por baixo). */}
      <mesh position={[0, 0.015, 0]}>
        <cylinderGeometry args={[0.029, 0.029, 0.004, 24]} />
        <meshStandardMaterial color={0xfbf8f2} roughness={0.25} />
      </mesh>
      {/* Café quase na borda, bem brilhante: é o reflexo na superfície do
          líquido que faz ler como cheia, não como xícara vazia e escura. */}
      <mesh position={[0, 0.062, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.0355, 24]} />
        <meshStandardMaterial color={0x24150c} roughness={0.12} metalness={0.05} />
      </mesh>
      {/* Alça */}
      <mesh position={[0.045, 0.045, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.019, 0.005, 8, 18, Math.PI * 1.15]} />
        <meshStandardMaterial color={0xfbf8f2} roughness={0.25} metalness={0.02} />
      </mesh>

      <Steam origem={[0, 0.07, 0]} />
    </group>
  );
}

/** Quantos sopros de vapor. 16 dá continuidade sem virar nuvem. */
const QTD_VAPOR = 16;

/**
 * Vapor subindo do café.
 *
 * Um InstancedMesh de bolhas translúcidas em ciclo: cada uma nasce rente ao
 * líquido, sobe, cresce e some. As fases são espalhadas por índice, então o
 * fluxo é contínuo e nunca "pulsa" todo junto.
 *
 * BLENDING ADITIVO não é escolha estética, é o que permite o FADE: a
 * opacidade do three é por material, não por instância, e com mistura aditiva
 * a cor de cada instância (instanceColor) vira o próprio controle de
 * intensidade — escuro some, claro aparece. Com mistura normal, escurecer a
 * cor daria fumaça CINZA em vez de fumaça sumindo.
 *
 * Os valores ficam baixos de propósito (pico ~0,35 × 0,5 de opacidade): vapor
 * de café é um véu que mal se vê, e aditivo forte sobre o banco claro viraria
 * um borrão leitoso. Também fica abaixo do limiar do Bloom (1.0), senão o
 * vapor floresceria como se fosse fonte de luz.
 */
function Steam({ origem }: { origem: [number, number, number] }) {
  const malhaRef = useRef<THREE.InstancedMesh>(null);

  const fases = useMemo(() => {
    const rnd = mulberry32(5150);
    return Array.from({ length: QTD_VAPOR }, (_, i) => ({
      // Ciclo espalhado por índice (fluxo contínuo); giro desencontra o balanço.
      inicio: i / QTD_VAPOR,
      giro: rnd() * Math.PI * 2,
      velocidade: 0.8 + rnd() * 0.5,
    }));
  }, []);

  useLayoutEffect(() => {
    const malha = malhaRef.current;
    if (!malha) return;
    // As instâncias se movem todo quadro; um volume calculado uma vez só
    // ficaria errado e o vapor sumiria por frustum culling em certos ângulos.
    malha.frustumCulled = false;

    /*
      Semear instanceColor aqui é OBRIGATÓRIO, não higiene: o atributo não
      existe até a primeira chamada de setColorAt. Como o useFrame abaixo
      depende dele e desiste quando é nulo, sem esta semeadura ele desistiria
      PARA SEMPRE e não haveria vapor nenhum.
    */
    const preto = new THREE.Color(0, 0, 0);
    for (let i = 0; i < QTD_VAPOR; i++) malha.setColorAt(i, preto);
    if (malha.instanceColor) malha.instanceColor.needsUpdate = true;
  }, []);

  /*
    eslint-disable react-hooks/immutability -- padrão canônico do R3F, o mesmo
    de CameraRig e FairyLights: useFrame roda fora do ciclo de render do React
    e mutar objetos three.js dentro dele é a forma documentada de animar.
  */
  useFrame((state) => {
    const malha = malhaRef.current;
    const atributoCor = malha?.instanceColor;
    if (!malha || !atributoCor) return;

    const t = state.clock.elapsedTime;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const e = new THREE.Vector3();
    const cor = new THREE.Color();

    for (let i = 0; i < QTD_VAPOR; i++) {
      const f = fases[i];
      const u = (t * 0.17 * f.velocidade + f.inicio) % 1;

      // Sobe ~16 cm, serpenteando cada vez mais à medida que esfria.
      const altura = u * 0.16;
      const desvio = Math.sin(u * 5.5 + f.giro) * 0.014 * u;
      const desvioZ = Math.cos(u * 4.2 + f.giro * 1.7) * 0.012 * u;
      p.set(origem[0] + desvio, origem[1] + altura, origem[2] + desvioZ);

      // Nasce apertado na superfície e se abre ao subir.
      e.setScalar(0.005 + u * 0.026);
      malha.setMatrixAt(i, m.compose(p, q, e));

      // Aparece e some suave: meia onda de seno ao longo do ciclo.
      const brilho = Math.sin(Math.PI * u) * 0.35;
      cor.setRGB(brilho, brilho * 0.97, brilho * 0.93);
      malha.setColorAt(i, cor);
    }

    malha.instanceMatrix.needsUpdate = true;
    atributoCor.needsUpdate = true;
  });
  /* eslint-enable react-hooks/immutability */

  return (
    <instancedMesh ref={malhaRef} args={[undefined, undefined, QTD_VAPOR]}>
      <sphereGeometry args={[1, 7, 5]} />
      <meshBasicMaterial transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} />
    </instancedMesh>
  );
}

/**
 * Garrafa térmica de café ao lado da xícara.
 *
 * Esmalte creme com ferragens de latão, pra conversar com os puxadores das
 * gavetas e a lanterna do outro extremo do banco, em vez de introduzir um
 * material novo (inox) que não existe em lugar nenhum do quarto.
 */
function CoffeePot({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[0, -0.4, 0]}>
      {/* Corpo, levemente mais largo embaixo */}
      <mesh position={[0, 0.082, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.042, 0.048, 0.164, 28]} />
        <meshStandardMaterial color={0xf0e7d7} roughness={0.35} metalness={0.05} />
      </mesh>
      {/* Friso de latão na barriga — quebra o cilindro liso */}
      <mesh position={[0, 0.055, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.0465, 0.0028, 8, 28]} />
        <meshStandardMaterial color={QUARTO.latao} roughness={0.35} metalness={0.7} />
      </mesh>
      {/* Tampa e pegador */}
      <mesh position={[0, 0.172, 0]} castShadow>
        <cylinderGeometry args={[0.044, 0.043, 0.018, 28]} />
        <meshStandardMaterial color={QUARTO.latao} roughness={0.4} metalness={0.65} />
      </mesh>
      <mesh position={[0, 0.188, 0]} castShadow>
        <sphereGeometry args={[0.012, 14, 10]} />
        <meshStandardMaterial color={QUARTO.latao} roughness={0.35} metalness={0.7} />
      </mesh>
      {/* Bico, inclinado pra frente */}
      <mesh position={[0.05, 0.15, 0]} rotation={[0, 0, -0.9]} castShadow>
        <cylinderGeometry args={[0.009, 0.014, 0.05, 14]} />
        <meshStandardMaterial color={0xf0e7d7} roughness={0.35} metalness={0.05} />
      </mesh>
      {/* Asa */}
      <mesh position={[-0.055, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.028, 0.006, 8, 18, Math.PI * 1.1]} />
        <meshStandardMaterial color={QUARTO.latao} roughness={0.4} metalness={0.6} />
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
