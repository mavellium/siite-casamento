/**
 * Layout da cena (mesa + livro) e os 3 estados de câmera do percurso de
 * scroll. Mantido como dados puros (sem importar three/R3F) pra poder ser
 * usado tanto pela câmera quanto pela geometria da cena como fonte única
 * de posição.
 */

export const TABLE_TOP_Y = 1;
/**
 * BOOK_WIDTH (eixo X — quanto a capa se estende da lombada até a borda que
 * abre) e BOOK_DEPTH (eixo Z — comprimento da lombada, "altura" da página
 * ao ler) do livro fechado — proporção 3:4 igual à do livro 2D
 * (width=420/height=560 em Flipbook.tsx). A lombada corre em Z (mais
 * comprida) e fica na borda esquerda (X negativo) do livro, pra abrir
 * horizontalmente da direita pra esquerda, como um livro de verdade —
 * ver rotation.z em BookMesh.tsx.
 */
export const BOOK_WIDTH = 1;
export const BOOK_DEPTH = (BOOK_WIDTH * 560) / 420;
/** Centro do livro fechado, ligeiramente acima da mesa (metade da espessura). */
export const BOOK_CENTER: [number, number, number] = [0, TABLE_TOP_Y + 0.08, 0];
/** Posição da lombada do livro (borda esquerda, onde a capa gira). */
export const BOOK_SPINE: [number, number, number] = [-BOOK_WIDTH / 2, TABLE_TOP_Y + 0.08, 0];

export interface CameraKeyframe {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
}

/**
 * Estados-base (desktop) do percurso: ampla/estabelecendo → aproximação e
 * inclinação → quase de cima do livro. As posições formam um arco suave —
 * a interpolação entre elas (feita no CameraRig) já produz o movimento de
 * "abaixar e inclinar" sem precisar de keyframes intermediários extras.
 */
const BASE_KEYFRAMES: readonly CameraKeyframe[] = [
  {
    position: [0, 3.2, 7.5],
    lookAt: [0, 0.9, 0.3],
    fov: 45,
  },
  {
    position: [0, 4.2, 3.2],
    lookAt: [0, 1, 0],
    fov: 42,
  },
  {
    // um pouco mais alta/aberta que um simples "de cima do centro" pra
    // sobrar margem: com o livro em retrato, a capa aberta se estende bem
    // mais em Z (profundidade) do que em X, então o enquadramento top-down
    // precisa de bastante folga nesse eixo pra não cortar a capa já aberta.
    position: [0, 7.2, 0.75],
    lookAt: BOOK_CENTER,
    fov: 42,
  },
];

const MOBILE_DISTANCE_SCALE = 1.4;
const MOBILE_FOV_BOOST = 12;

/**
 * Retorna os keyframes ajustados pro viewport atual. Em telas estreitas a
 * câmera fica mais afastada do alvo (escala o vetor lookAt→position) e com
 * FOV mais aberto, pra mesa+livro não cortarem num enquadramento mais
 * alto/estreito que o retrato desktop.
 */
export function getCameraKeyframes(isNarrow: boolean): readonly CameraKeyframe[] {
  if (!isNarrow) return BASE_KEYFRAMES;

  return BASE_KEYFRAMES.map((kf) => {
    const [px, py, pz] = kf.position;
    const [lx, ly, lz] = kf.lookAt;
    const dx = px - lx;
    const dy = py - ly;
    const dz = pz - lz;
    return {
      position: [
        lx + dx * MOBILE_DISTANCE_SCALE,
        ly + dy * MOBILE_DISTANCE_SCALE,
        lz + dz * MOBILE_DISTANCE_SCALE,
      ] as [number, number, number],
      lookAt: kf.lookAt,
      fov: kf.fov + MOBILE_FOV_BOOST,
    };
  });
}
