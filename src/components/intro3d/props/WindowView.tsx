"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { EXTERIOR } from "../palette";
import { createSkyTexture } from "../textures/skyGradient";
import { mulberry32 } from "../geometry/random";

/**
 * Tudo que existe do lado de FORA da janela: céu, sol, duas linhas de colina,
 * árvores próximas, arbustos floridos e o campo.
 *
 * POR QUE GEOMETRIA E NÃO UMA FOTO. A alternativa era pôr um panorama HDRI no
 * `scene.background` — ele apareceria só pelo vão, já que o quarto é fechado.
 * Duas coisas mataram a ideia:
 *
 *   1. Resolução. No enquadramento herói o vão subtende ~50° e é ampliado até
 *      ocupar a tela toda; num equirect 2k isso são ~290 px de fonte esticados
 *      para ~1400 px. Vira mingau bilinear. E `backgroundBlurriness` (que
 *      disfarçaria) só funciona em textura PMREM, não no equirect cru que o
 *      drei põe no background.
 *   2. Paralaxe ZERO. A câmera anda 4,5 m em Z ao longo do percurso e um
 *      background equirect não desloca um pixel em relação à moldura. É o
 *      sinal mais óbvio de "papel de parede colado atrás do buraco".
 *
 * Em camadas, cada plano de profundidade desloca uma quantidade diferente
 * conforme a câmera avança — que é exatamente o que o olho usa pra ler
 * distância. Custo: ~9 draw calls e ~15k triângulos, irrelevante perto do
 * composer.
 *
 * NADA AQUI PROJETA SOMBRA. O frustum da luz-chave é apertado em ±4,2 m pra
 * dar ~4 mm por texel (o que resolve montante de 35 mm e folha de hera de
 * 6 cm). Se a geometria externa entrasse no cast, o frustum teria que crescer
 * pra ~20 m, o texel iria pra 10 mm e as manchas de sol no piso perderiam a
 * borda — que é o efeito central da cena.
 */

/**
 * O sol fica à DIREITA e baixo, do mesmo lado de onde vem a luz-chave (ver
 * Intro3DScene: azimute ~19° à direita, pra cama à esquerda não sombrear as
 * manchas no piso). Ele já esteve à esquerda enquanto a luz vinha da direita:
 * o brilho aparecia de um lado e as sombras apontavam pro outro — erro que
 * ninguém sabe nomear mas todo mundo percebe.
 *
 * A ELEVAÇÃO, essa sim, diverge de propósito: o disco fica a poucos graus do
 * horizonte pra aparecer pelo vão (acima de ~15° ele sumiria atrás da parede),
 * enquanto a luz-chave precisa de 26° pra mancha no piso ter o comprimento
 * certo. Essa diferença o olho não lê; a ausência do sol na janela, sim.
 */
const SOL = { x: 4.5, y: 3.6, z: -42 };

export function WindowView() {
  return (
    <group>
      <Sky />
      <Sun />
      <Hill z={-40} altura={2.6} cor={EXTERIOR.colinaLonge} semente={11} />
      <Hill z={-22} altura={3.4} cor={EXTERIOR.colinaPerto} semente={29} />
      <Ground />
      <Lawn />
      <Bushes />
      <Trees />
    </group>
  );
}

/** Cúpula do céu. Raio 45 cabe no camera.far=60 atual — não mexer no far. */
function Sky() {
  const texture = useMemo(() => createSkyTexture(7), []);
  return (
    <mesh renderOrder={-1}>
      <sphereGeometry args={[45, 32, 16]} />
      {/*
        BackSide porque estamos dentro da esfera. meshBasicMaterial porque o
        céu não deve receber a iluminação do quarto — ele É a fonte.
        depthWrite={false} + renderOrder -1 pra ele nunca disputar depth com
        nada; é o fundo de tudo.
      */}
      <meshBasicMaterial map={texture} side={THREE.BackSide} depthWrite={false} toneMapped />
    </mesh>
  );
}

/**
 * Disco solar. A cor vai MULTIPLICADA por 6 de propósito.
 *
 * Nesta pilha o renderer está em NoToneMapping e quem aplica ACES é o passe do
 * composer, que trata o buffer inteiro — `toneMapped={false}` num material não
 * isenta nada. Então, pra algo ler como "fonte de luz estourada" e ultrapassar
 * o limiar do Bloom depois do ACES, o valor linear precisa ficar em 3–8, não
 * em 1,05.
 */
function Sun() {
  const cor = useMemo(() => new THREE.Color(EXTERIOR.sol).multiplyScalar(6), []);
  return (
    <mesh position={[SOL.x, SOL.y, SOL.z]}>
      <circleGeometry args={[0.9, 32]} />
      <meshBasicMaterial color={cor} depthWrite={false} />
    </mesh>
  );
}

/**
 * Silhueta de colina. As duas colinas usam a mesma função e só diferem em
 * distância e cor: a de trás é bem mais lavada em direção ao céu.
 *
 * Isso não é preguiça, é perspectiva aérea — a atmosfera entre o observador e
 * o objeto dessatura e clareia com a distância. É de longe o sinal de
 * profundidade mais forte numa paisagem, e é de graça.
 */
function Hill({ z, altura, cor, semente }: { z: number; altura: number; cor: number; semente: number }) {
  const geometry = useMemo(() => {
    const rnd = mulberry32(semente);
    const largura = Math.abs(z) * 1.9;
    const passos = 26;
    const shape = new THREE.Shape();
    shape.moveTo(-largura / 2, -12);

    // Duas senoides de períodos diferentes: uma dá o vulto da montanha, a
    // outra a irregularidade do topo. Só uma daria uma onda regular demais.
    for (let i = 0; i <= passos; i++) {
      const t = i / passos;
      const x = -largura / 2 + largura * t;
      const y =
        altura * (0.55 + 0.45 * Math.sin(t * Math.PI * 1.6 + semente)) +
        altura * 0.18 * Math.sin(t * Math.PI * 7.3 + rnd() * 3) -
        0.4;
      shape.lineTo(x, y);
    }
    shape.lineTo(largura / 2, -12);
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, [z, altura, semente]);

  return (
    <mesh geometry={geometry} position={[0, 0, z]}>
      <meshBasicMaterial color={cor} />
    </mesh>
  );
}

/** Campo dourado ao pé da janela, abaixo da linha do peitoril. */
function Ground() {
  return (
    <mesh position={[0, -0.22, -20]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[80, 44]} />
      <meshBasicMaterial color={EXTERIOR.campo} />
    </mesh>
  );
}

/**
 * Relva e moitas baixas entre a janela e os arbustos floridos.
 *
 * Existe por causa do MERGULHO FINAL: com a câmera a 2,33 m olhando 42° pra
 * baixo, o que se vê pelo vidro é o chão logo do lado de fora — e sem nada em
 * cima dele o campo era um plano liso cor de oliva ocupando o terço de cima do
 * quadro, lendo como parede pintada. Os tufos dão textura e paralaxe a essa
 * faixa. Dos outros keyframes quase não aparecem: a linha de visada que passa
 * rente ao peitoril só toca o chão a partir de z ≈ -7.
 */
function Lawn() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const QTD = 520;

  useLayoutEffect(() => {
    const malha = ref.current;
    if (!malha) return;
    const rnd = mulberry32(271);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    const cor = new THREE.Color();
    const tons = [EXTERIOR.campo, EXTERIOR.folhaSolQuente, EXTERIOR.folhaSombra, EXTERIOR.folhaSol];

    for (let i = 0; i < QTD; i++) {
      // Metade de cada tufo fica abaixo do chão: o que sobra são montinhos.
      p.set((rnd() - 0.5) * 12, -0.22, -4.1 - rnd() * 4.4);
      q.setFromEuler(new THREE.Euler(0, rnd() * Math.PI, 0));
      const r = 0.08 + rnd() * 0.2;
      s.set(r, r * (0.25 + rnd() * 0.3), r);
      malha.setMatrixAt(i, m.compose(p, q, s));
      cor.setHex(tons[Math.floor(rnd() * tons.length)]);
      malha.setColorAt(i, cor);
    }
    malha.instanceMatrix.needsUpdate = true;
    if (malha.instanceColor) malha.instanceColor.needsUpdate = true;
    malha.computeBoundingSphere();
  }, []);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, QTD]} castShadow={false}>
      <icosahedronGeometry args={[1, 0]} />
      <meshBasicMaterial />
    </instancedMesh>
  );
}

/**
 * Arbustos floridos logo abaixo do peitoril — as manchas rosa da foto.
 * Dois InstancedMesh: a massa verde e as flores.
 */
function Bushes() {
  const folhagemRef = useRef<THREE.InstancedMesh>(null);
  const floresRef = useRef<THREE.InstancedMesh>(null);
  const QTD_FOLHAGEM = 300;
  const QTD_FLORES = 450;

  useLayoutEffect(() => {
    const rnd = mulberry32(53);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    const cor = new THREE.Color();

    const folhagem = folhagemRef.current;
    if (folhagem) {
      for (let i = 0; i < QTD_FOLHAGEM; i++) {
        p.set((rnd() - 0.5) * 26, -0.25 + rnd() * 0.75, -8.5 - rnd() * 2.2);
        q.setFromEuler(new THREE.Euler(rnd() * 3, rnd() * 3, rnd() * 3));
        const r = 0.22 + rnd() * 0.3;
        s.set(r, r * 0.7, r);
        folhagem.setMatrixAt(i, m.compose(p, q, s));
        cor.setHex(rnd() > 0.5 ? EXTERIOR.folhaSombra : EXTERIOR.folhaSolQuente);
        folhagem.setColorAt(i, cor);
      }
      folhagem.instanceMatrix.needsUpdate = true;
      if (folhagem.instanceColor) folhagem.instanceColor.needsUpdate = true;
      // Sem isso o boundingSphere fica com o raio de UMA instância na origem e
      // o arbusto inteiro some por frustum culling assim que a origem sai do
      // quadro. Vale para todos os InstancedMesh desta cena.
      folhagem.computeBoundingSphere();
    }

    const flores = floresRef.current;
    if (flores) {
      for (let i = 0; i < QTD_FLORES; i++) {
        p.set((rnd() - 0.5) * 26, -0.1 + rnd() * 0.8, -8.4 - rnd() * 2.2);
        q.identity();
        const r = 0.045 + rnd() * 0.05;
        s.set(r, r, r);
        flores.setMatrixAt(i, m.compose(p, q, s));
      }
      flores.instanceMatrix.needsUpdate = true;
      flores.computeBoundingSphere();
    }
  }, []);

  return (
    <group>
      <instancedMesh ref={folhagemRef} args={[undefined, undefined, QTD_FOLHAGEM]} castShadow={false}>
        <icosahedronGeometry args={[1, 0]} />
        <meshBasicMaterial />
      </instancedMesh>
      <instancedMesh ref={floresRef} args={[undefined, undefined, QTD_FLORES]} castShadow={false}>
        <icosahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color={EXTERIOR.flor} />
      </instancedMesh>
    </group>
  );
}

/**
 * Árvores próximas — a camada que ganha mais paralaxe e por isso a que mais
 * vende a profundidade.
 *
 * A folhagem é icosaedro achatado, não card com alpha. Cards precisariam de
 * ordenação de transparência (ou alpha test com serrilhado) e ficariam de
 * perfil metade do tempo; a 6 m de distância a silhueta do volume resolve
 * melhor e custa zero em ordenação.
 */
function Trees() {
  const copaRef = useRef<THREE.InstancedMesh>(null);
  const troncoRef = useRef<THREE.InstancedMesh>(null);
  const QTD_COPA = 600;
  const QTD_TRONCO = 7;

  const arvores = useMemo(() => {
    const rnd = mulberry32(97);
    // Distribuídas de propósito nas BEIRADAS do vão: na foto as árvores
    // emolduram a vista pelos lados e o meio fica aberto pro céu e as colinas.
    return Array.from({ length: QTD_TRONCO }, (_, i) => {
      const lado = i % 2 === 0 ? -1 : 1;
      const espalha = 1.6 + rnd() * 3.4;
      return {
        x: lado * espalha,
        z: -6.0 - rnd() * 1.8,
        alturaTronco: 1.6 + rnd() * 1.1,
        raioCopa: 1.1 + rnd() * 0.7,
      };
    });
  }, []);

  useLayoutEffect(() => {
    const rnd = mulberry32(131);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    const cor = new THREE.Color();

    const tronco = troncoRef.current;
    if (tronco) {
      arvores.forEach((a, i) => {
        p.set(a.x, -0.22 + a.alturaTronco / 2, a.z);
        q.setFromEuler(new THREE.Euler(0, rnd() * 3, (rnd() - 0.5) * 0.12));
        s.set(0.09 + rnd() * 0.05, a.alturaTronco, 0.09 + rnd() * 0.05);
        tronco.setMatrixAt(i, m.compose(p, q, s));
      });
      tronco.instanceMatrix.needsUpdate = true;
      tronco.computeBoundingSphere();
    }

    const copa = copaRef.current;
    if (copa) {
      const porArvore = Math.floor(QTD_COPA / arvores.length);
      let idx = 0;
      for (const a of arvores) {
        const baseY = -0.22 + a.alturaTronco;
        for (let j = 0; j < porArvore && idx < QTD_COPA; j++, idx++) {
          // Distribuição em elipsoide em volta do topo do tronco.
          const ang = rnd() * Math.PI * 2;
          const raio = Math.pow(rnd(), 0.6) * a.raioCopa;
          p.set(
            a.x + Math.cos(ang) * raio,
            baseY + (rnd() - 0.25) * a.raioCopa * 1.2,
            a.z + Math.sin(ang) * raio * 0.8
          );
          q.setFromEuler(new THREE.Euler(rnd() * 3, rnd() * 3, rnd() * 3));
          const r = 0.13 + rnd() * 0.13;
          s.set(r, r * 0.72, r);
          copa.setMatrixAt(idx, m.compose(p, q, s));

          // Verde quente do lado do sol (x negativo), frio do lado oposto —
          // o mesmo tufo muda de cor conforme onde está na copa.
          const doLadoDoSol = p.x < a.x;
          const sorteio = rnd();
          if (doLadoDoSol) cor.setHex(sorteio > 0.5 ? EXTERIOR.folhaSol : EXTERIOR.folhaSolQuente);
          else cor.setHex(sorteio > 0.5 ? EXTERIOR.folhaSombra : EXTERIOR.folhaSombraFria);
          copa.setColorAt(idx, cor);
        }
      }
      // As instâncias não preenchidas ficariam empilhadas na origem em escala
      // 1 (um icosaedro gigante no meio da cena). Zerar a escala some com elas.
      for (; idx < QTD_COPA; idx++) {
        copa.setMatrixAt(idx, m.compose(p.set(0, -50, 0), q.identity(), s.set(0, 0, 0)));
      }
      copa.instanceMatrix.needsUpdate = true;
      if (copa.instanceColor) copa.instanceColor.needsUpdate = true;
      copa.computeBoundingSphere();
    }
  }, [arvores]);

  return (
    <group>
      <instancedMesh ref={troncoRef} args={[undefined, undefined, QTD_TRONCO]} castShadow={false}>
        <cylinderGeometry args={[0.7, 1, 1, 6]} />
        <meshBasicMaterial color={EXTERIOR.tronco} />
      </instancedMesh>
      <instancedMesh ref={copaRef} args={[undefined, undefined, QTD_COPA]} castShadow={false}>
        <icosahedronGeometry args={[1, 0]} />
        <meshBasicMaterial />
      </instancedMesh>
    </group>
  );
}
