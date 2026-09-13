"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { QUARTO } from "../palette";
import { ROOM } from "../roomLayout";
import { PottedPlant } from "./Decor";
import { mulberry32 } from "../geometry/random";

/**
 * O resto do mobiliário da foto: criado-mudo com vela, as fotinhas coladas na
 * parede direita, a planta grande de chão e o tapete estampado com franjas.
 *
 * Todos determinísticos (posições derivadas de índice ou de PRNG semeado):
 * nada aqui pode mudar entre render de servidor e de cliente.
 */
export function RoomDecor() {
  return (
    <group>
      <Nightstand />
      <WallPhotos />
      <PottedPlant position={[1.86, 0, -2.55]} scale={1.15} rotationY={-0.5} />
      <Rug />
    </group>
  );
}

/** Criado-mudo branco sob as prateleiras, com uma vela em cima. */
function Nightstand() {
  const { criadoMudo } = ROOM;
  const [cx, , cz] = criadoMudo.centro;
  const { largura, altura, profundidade } = criadoMudo;

  return (
    <group>
      {/* Corpo */}
      <mesh position={[cx, altura / 2, cz]} castShadow receiveShadow>
        <boxGeometry args={[profundidade, altura, largura]} />
        <meshStandardMaterial color={QUARTO.marcenaria} roughness={0.58} metalness={0.03} />
      </mesh>
      {/* Frente de gaveta, recuada, com puxador de latão */}
      <mesh position={[cx + profundidade / 2 + 0.006, altura * 0.66, cz]} castShadow>
        <boxGeometry args={[0.014, altura * 0.42, largura - 0.05]} />
        <meshStandardMaterial color={0xe7ded0} roughness={0.55} />
      </mesh>
      <mesh
        position={[cx + profundidade / 2 + 0.028, altura * 0.66, cz]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.014, 0.014, 0.028, 12]} />
        <meshStandardMaterial color={QUARTO.latao} roughness={0.35} metalness={0.75} />
      </mesh>

      {/* Vela acesa — emissiva, sem pointLight (orçamento de luzes, ver SeatDecor). */}
      <mesh position={[cx, altura + 0.05, cz - 0.06]} castShadow receiveShadow>
        <cylinderGeometry args={[0.038, 0.038, 0.1, 16]} />
        <meshStandardMaterial color={0xf1e6d2} roughness={0.8} />
      </mesh>
      <mesh position={[cx, altura + 0.102, cz - 0.06]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.035, 16]} />
        {/* ×3 pelo mesmo motivo dos bulbos: o ACES do composer comprime tudo,
            então "aceso" precisa morar acima de 1 pra florescer no Bloom. */}
        <meshBasicMaterial color={new THREE.Color(0xffc27a).multiplyScalar(3)} />
      </mesh>
    </group>
  );
}

/**
 * Fotinhas coladas na parede direita, em grade frouxa.
 *
 * A grade é propositalmente IMPERFEITA: cada foto tem um deslocamento e uma
 * inclinação próprios derivados do índice. Fotos coladas em alinhamento
 * perfeito leem como render; é o desalinho que diz "alguém colou isso".
 */
function WallPhotos() {
  const { xDireita } = ROOM;
  const x = xDireita - 0.012;

  const fotos = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const coluna = i % 2;
        const linha = Math.floor(i / 2);
        return {
          y: 1.42 + linha * 0.26 + (((i * 5) % 3) - 1) * 0.014,
          z: -1.5 + coluna * 0.24 + (((i * 7) % 3) - 1) * 0.012,
          giro: (((i * 11) % 5) - 2) * 0.05,
          largura: 0.12 + ((i * 3) % 3) * 0.014,
          altura: 0.16 + ((i * 5) % 3) * 0.012,
          tom: [0xe3d7c4, 0xd6cdb8, 0xdfd5c0][i % 3],
        };
      }),
    []
  );

  return (
    <group>
      {fotos.map((f, i) => (
        <group key={i} position={[x, f.y, f.z]} rotation={[f.giro, -Math.PI / 2, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[f.largura, f.altura, 0.004]} />
            <meshStandardMaterial color={0xfaf5ea} roughness={0.85} />
          </mesh>
          {/* A imagem em si — uma mancha de tom sépia, que é tudo que se lê a
              esta distância. */}
          <mesh position={[0, 0.008, 0.003]}>
            <planeGeometry args={[f.largura - 0.016, f.altura - 0.028]} />
            <meshStandardMaterial color={f.tom} roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * Tapete estampado com franjas.
 *
 * A estampa é uma CanvasTexture desenhada aqui em vez de uma textura baixada:
 * o tapete da foto é um vintage claro de medalhão, e nenhuma das texturas CC0
 * já no projeto se parece com isso. Desenhar dá controle exato sobre a paleta
 * (que precisa conversar com o creme do quarto) e custa 0 MB.
 *
 * As franjas são um InstancedMesh de cilindros finos nas duas pontas — é a
 * silhueta irregular delas que diz "tapete" em vez de "adesivo no chão".
 */
function Rug() {
  const { tapete } = ROOM;
  const franjasRef = useRef<THREE.InstancedMesh>(null);
  const QTD_FRANJAS = 96;

  const textura = useMemo(() => criarEstampaTapete(), []);

  useLayoutEffect(() => {
    const malha = franjasRef.current;
    if (!malha) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();

    const rnd = mulberry32(6161);

    const porLado = QTD_FRANJAS / 2;
    for (let i = 0; i < QTD_FRANJAS; i++) {
      const lado = i < porLado ? -1 : 1;
      const j = i % porLado;
      const comprimento = 0.05 + rnd() * 0.035;
      p.set(
        -tapete.largura / 2 + (tapete.largura * j) / (porLado - 1),
        0.004,
        (lado * tapete.comprimento) / 2 + lado * comprimento * 0.5
      );
      q.setFromEuler(new THREE.Euler(Math.PI / 2, 0, (rnd() - 0.5) * 0.4));
      s.set(1, comprimento, 1);
      malha.setMatrixAt(i, m.compose(p, q, s));
    }
    malha.instanceMatrix.needsUpdate = true;
    malha.computeBoundingSphere();
  }, [tapete.largura, tapete.comprimento]);

  return (
    <group position={tapete.centro} rotation={[0, tapete.giro, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[tapete.largura, tapete.comprimento]} />
        <meshStandardMaterial map={textura} roughness={0.97} metalness={0} />
      </mesh>
      <instancedMesh ref={franjasRef} args={[undefined, undefined, QTD_FRANJAS]} castShadow receiveShadow>
        <cylinderGeometry args={[0.0035, 0.0035, 1, 4]} />
        <meshStandardMaterial color={0xe6dcc6} roughness={0.98} />
      </instancedMesh>
    </group>
  );
}

/** Estampa do tapete: borda dupla + medalhão central + florzinhas espalhadas. */
function criarEstampaTapete(): THREE.CanvasTexture {
  const w = 512;
  const h = 384;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Sem contexto 2D para gerar a estampa do tapete");

  const creme = "#e8ddc6";
  const terra = "#c49a7d";
  const musgo = "#9aa578";
  const rosa = "#d9a9a0";

  ctx.fillStyle = creme;
  ctx.fillRect(0, 0, w, h);

  // Bordas concêntricas
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = terra;
  ctx.lineWidth = 5;
  ctx.strokeRect(18, 18, w - 36, h - 36);
  ctx.strokeStyle = musgo;
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 30, w - 60, h - 60);
  ctx.globalAlpha = 1;

  /*
    Medalhão central. Bem MENOR e mais lavado do que a primeira tentativa: com
    raio grande e traço grosso ele lia como uma margarida gigante desenhada no
    chão, e virava o elemento mais chamativo do quarto inteiro. Tapete estampado
    de verdade tem estampa densa e de baixo contraste — o que se vê a 3 m é
    textura, não desenho.
  */
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = terra;
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 10; i++) {
    ctx.rotate((Math.PI * 2) / 10);
    ctx.beginPath();
    ctx.ellipse(28, 0, 16, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = rosa;
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();

  // Estampa de fundo: muitas florzinhas pequenas cobrindo o campo todo. É ela
  // que dá a leitura de "tapete estampado" — o medalhão sozinho deixaria o
  // resto do tapete liso.
  const rndFundo = mulberry32(909091);
  ctx.globalAlpha = 0.3;
  for (let i = 0; i < 260; i++) {
    const x = 46 + rndFundo() * (w - 92);
    const y = 46 + rndFundo() * (h - 92);
    ctx.fillStyle = rndFundo() > 0.5 ? musgo : rosa;
    ctx.beginPath();
    ctx.arc(x, y, 1.8 + rndFundo() * 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}
