import * as THREE from "three";
import { ROOM } from "../roomLayout";
import { mulberry32 } from "./random";

/**
 * Gera as curvas da hera em volta da janela e as transformações prontas de
 * cada folha e de cada lâmpada do pisca-pisca.
 *
 * Módulo PURO: importa three, não importa R3F, não tem JSX. Dá pra memoizar
 * fora do React e o resultado é determinístico — usa o `mulberry32` compartilhado
 * de geometry/random.ts. Determinismo aqui não é preciosismo:
 * render de servidor e de cliente precisam bater, e uma hera que se
 * reembaralha a cada re-render seria impossível de calibrar.
 */

/** Retângulo que a hera contorna: um pouco por fora do caixilho da janela. */
function molduraExterna() {
  const { janela, zFundo } = ROOM;
  const folga = janela.espessuraCaixilho + 0.07;
  return {
    x0: -janela.largura / 2 - folga,
    x1: janela.largura / 2 + folga,
    y0: janela.base - folga,
    y1: janela.topo + folga,
    // Face interna da parede do fundo. A hera vive na frente dela, dentro do
    // quarto — é o que permite projetar sombra na própria parede.
    z: zFundo + 0.02,
  };
}

/**
 * Mapeia t ∈ [0,1) para um ponto no perímetro do retângulo, começando no canto
 * inferior esquerdo e correndo no sentido horário (subindo pela esquerda).
 *
 * O perímetro é percorrido por COMPRIMENTO, não por lado: assim o passo entre
 * pontos de controle é uniforme e a hera não fica densa nos lados curtos e
 * rala nos compridos.
 */
function pontoNoPerimetro(t: number, m: ReturnType<typeof molduraExterna>) {
  const larg = m.x1 - m.x0;
  const alt = m.y1 - m.y0;
  const perim = 2 * (larg + alt);
  let d = (t % 1) * perim;

  if (d < alt) return new THREE.Vector3(m.x0, m.y0 + d, m.z);
  d -= alt;
  if (d < larg) return new THREE.Vector3(m.x0 + d, m.y1, m.z);
  d -= larg;
  if (d < alt) return new THREE.Vector3(m.x1, m.y1 - d, m.z);
  d -= alt;
  return new THREE.Vector3(m.x1 - d, m.y0, m.z);
}

/**
 * Uma curva de ramo. `fase` desloca o ponto de partida e `amplitude` controla
 * o quanto o ramo serpenteia em torno do retângulo.
 */
function criarRamo(pontos: number, semente: number, fase: number, amplitude: number) {
  const m = molduraExterna();
  const rnd = mulberry32(semente);
  const pts: THREE.Vector3[] = [];

  for (let i = 0; i < pontos; i++) {
    const t = i / pontos + fase;
    const p = pontoNoPerimetro(t, m);
    // Deslocamento no plano da parede + para FORA dela. O componente em Z é o
    // que dá volume à trepadeira e o que faz ela projetar sombra em vez de
    // parecer pintada.
    p.x += (rnd() - 0.5) * 2 * amplitude;
    p.y += (rnd() - 0.5) * 2 * amplitude;
    p.z += 0.02 + rnd() * 0.08;
    pts.push(p);
  }

  return new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.5);
}

export interface TransformacaoFolha {
  posicao: THREE.Vector3;
  quaternion: THREE.Quaternion;
  escala: number;
  /** Índice na paleta de verdes (ver Ivy.tsx). */
  tom: number;
}

/**
 * Duas curvas de ramo, deliberadamente com fases diferentes.
 *
 * Um ramo só, por mais irregular, ainda lê como "um fio contornando um
 * retângulo". São os CRUZAMENTOS entre dois ramos que matam essa leitura e
 * fazem parecer trepadeira.
 */
export function criarRamos() {
  return [criarRamo(64, 20260214, 0, 0.045), criarRamo(64, 991, 0.13, 0.075)];
}

/** A curva do cordão de luz — amplitude maior, entra e sai da hera. */
export function criarCordao() {
  return criarRamo(48, 4242, 0.06, 0.105);
}

/**
 * Distribui folhas ao longo de um ramo.
 *
 * ORIENTAÇÃO — a armadilha nº 1 desta função. Se cada folha for girada
 * aleatoriamente em torno da tangente do ramo, metade delas fica de perfil
 * para a câmera, a área projetada despenca e a hera parece rala mesmo com
 * novecentas folhas. O slerp de 0,55 em direção a "normal apontando para
 * dentro do quarto" enviesa a distribuição sem alinhar todas iguais: ainda há
 * variedade, mas a maioria mostra a face. Sem isso seria preciso o DOBRO de
 * folhas para o mesmo resultado visual.
 */
export function distribuirFolhas(
  ramo: THREE.CatmullRomCurve3,
  quantidade: number,
  semente: number
): TransformacaoFolha[] {
  const rnd = mulberry32(semente);
  const folhas: TransformacaoFolha[] = [];

  const eixoX = new THREE.Vector3();
  const eixoY = new THREE.Vector3();
  const eixoZ = new THREE.Vector3();
  const matriz = new THREE.Matrix4();
  const paraFrente = new THREE.Quaternion();

  for (let i = 0; i < quantidade; i++) {
    const t = (i + rnd() * 0.8) / quantidade;
    const posicao = ramo.getPointAt(t % 1);
    const tangente = ramo.getTangentAt(t % 1).normalize();

    // Base ortonormal com a tangente como eixo X, girada aleatoriamente em
    // torno dela (o "roll" do pecíolo).
    eixoX.copy(tangente);
    eixoY.set(0, 1, 0);
    if (Math.abs(eixoX.dot(eixoY)) > 0.95) eixoY.set(1, 0, 0);
    eixoZ.crossVectors(eixoX, eixoY).normalize();
    eixoY.crossVectors(eixoZ, eixoX).normalize();
    matriz.makeBasis(eixoX, eixoY, eixoZ);

    const qRamo = new THREE.Quaternion().setFromRotationMatrix(matriz);
    qRamo.multiply(new THREE.Quaternion().setFromAxisAngle(eixoX, rnd() * Math.PI * 2));

    // Folha "de frente": normal (+Z da ShapeGeometry) apontando pro quarto,
    // com um giro próprio em torno do próprio eixo pra não ficarem todas
    // alinhadas.
    paraFrente.setFromAxisAngle(new THREE.Vector3(0, 0, 1), (rnd() - 0.5) * 2.2);

    const quaternion = qRamo.clone().slerp(paraFrente, 0.55);

    folhas.push({
      posicao: posicao.add(
        new THREE.Vector3((rnd() - 0.5) * 0.05, (rnd() - 0.5) * 0.05, rnd() * 0.05)
      ),
      quaternion,
      escala: 0.045 + rnd() * 0.025,
      tom: Math.floor(rnd() * 5),
    });
  }

  return folhas;
}

/** Posições das lâmpadas ao longo do cordão, espaçadas por igual. */
export function distribuirBulbos(cordao: THREE.CatmullRomCurve3, quantidade: number) {
  return Array.from({ length: quantidade }, (_, i) => cordao.getPointAt(i / quantidade));
}
