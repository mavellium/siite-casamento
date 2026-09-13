/**
 * Os estados de câmera do percurso de scroll. Mantido como dados puros (sem
 * importar three/R3F) pra poder ser usado tanto pela câmera quanto pela
 * geometria da cena como fonte única de posição.
 *
 * As medidas do quarto vêm de roomLayout.ts — os dois arquivos precisam
 * concordar sobre onde as coisas estão.
 */

import { ROOM, ASSENTO_TOPO_Y } from "./roomLayout";

/**
 * BOOK_WIDTH (eixo X — quanto a capa se estende da lombada até a borda que
 * abre) e BOOK_DEPTH (eixo Z — comprimento da lombada, "altura" da página ao
 * ler) do livro fechado — proporção 3:4 igual à do livro 2D (width=420/
 * height=560 em Flipbook.tsx). A lombada corre em Z (mais comprida) e fica na
 * borda esquerda (X negativo) do livro, pra abrir horizontalmente da direita
 * pra esquerda, como um livro de verdade — ver rotation.z em BookMesh.tsx.
 */
export const BOOK_WIDTH = 1;
export const BOOK_DEPTH = (BOOK_WIDTH * 560) / 420;

/** Alvo do mergulho final: o meio da fileira de objetos no banco. */
export const MENU_LOOKAT: [number, number, number] = [0.3, ASSENTO_TOPO_Y, ROOM.zFundo + ROOM.assento.profundidade / 2];

export interface CameraKeyframe {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
  /**
   * Em que ponto do progresso (0–1, já suavizado) este keyframe é atingido.
   * O primeiro é sempre 0 e o último sempre 1. Explícito, e não distribuição
   * uniforme, porque os trechos têm importâncias diferentes: a parada na
   * janela precisa respirar, a aproximação inicial não.
   */
  stop: number;
  /**
   * Fator de afastamento em telas estreitas, por keyframe. O padrão de 1.32
   * serve pros enquadramentos amplos, mas o mergulho final não pode usá-lo:
   * afastar 32% ali poria a câmera acima do pé-direito.
   */
  mobileScale?: number;
  /**
   * Largura mínima (m), medida na distância do alvo, que o quadro PRECISA
   * mostrar na horizontal. Se o FOV do keyframe não bastar pro aspecto atual
   * da tela, o CameraRig abre o FOV até caber.
   *
   * Existe por um bug medido: em retrato (390×844) o mergulho final mostrava
   * só ~1,0 m de largura, e a fileira de objetos tem ~1,9 m — Prancheta (RSVP)
   * e Globo ficavam FORA DA TELA, inalcançáveis no celular. Afastar a câmera
   * não resolve (o teto limita), e escalar o FOV por "é mobile" erraria em
   * janelas de desktop estreitas. Calcular pela largura real resolve os dois.
   */
  larguraMinima?: number;
}

/**
 * Percurso: amplo (o ponto de vista da foto de referência) → sobre o tapete →
 * parada-herói na janela dourada → mergulho de cima na fileira de objetos.
 *
 * O 4º keyframe existe porque o mergulho, sozinho, MATA a janela: com a câmera
 * a 2,33 m olhando 42° pra baixo, o vão sai inteiro do quadro. Sem a parada
 * anterior, o quarto de fim de tarde que a cena inteira constrói nunca chegaria
 * a ser visto. O herói é o retrato do ambiente; o mergulho é a recompensa.
 *
 * O ÂNGULO DE 42° NÃO É ESTÉTICO, é o que o pé-direito permite. Para a fileira
 * de 1,7 m ocupar ~70% da largura com FOV 34 são necessários 2,55 m de
 * distância; a 55° de elevação isso poria a câmera em y = 2,73 m, e
 * ROOM.altura é 2,72 — ela nasceria dentro do teto. Em 42° sobram 37 cm.
 *
 * E 42° já lê inequivocamente como "de cima" (é o ângulo de foto de produto
 * inclinada) enquanto preserva perfil suficiente pro globo continuar sendo uma
 * esfera com eixo e a ampulheta ter cintura. A 70–90° globo, ampulheta e livro
 * viram três formas indistinguíveis.
 */
const BASE_KEYFRAMES: readonly CameraKeyframe[] = [
  {
    // Amplo: cama cortando embaixo à esquerda, banco, janela — o enquadramento
    // da foto. A câmera fica no pé da cama, quase nivelada.
    position: [0.15, 1.42, 3.05],
    lookAt: [0.0, 1.2, ROOM.zFundo - 0.2],
    fov: 46,
    stop: 0,
  },
  {
    // Passando sobre o tapete, já baixando.
    position: [0.2, 1.36, 1.1],
    lookAt: [0.25, 1.15, ROOM.zFundo - 0.2],
    fov: 42,
    stop: 0.3,
  },
  {
    // HERÓI: o vão inteiro, com a hera e o pisca-pisca contornando.
    //
    // Recuado de z=-0.75/FOV 38 para z=-0.2/FOV 40, com o alvo subido pro
    // centro do vão. Na primeira calibragem o quadro cobria só ~3,0 m de
    // largura a 2,85 m do vidro, e a janela com a hera tem ~3,2 m: o topo do
    // vão e o pisca-pisca de cima ficavam FORA — justamente o que esta parada
    // existe pra mostrar. Agora cobre ~3,85 × 2,5 m, com o banco embaixo.
    position: [0.3, 1.36, -0.2],
    lookAt: [0.3, (ROOM.janela.base + ROOM.janela.topo) / 2, ROOM.zFundo - 0.15],
    fov: 40,
    stop: 0.68,
  },
  {
    // Mergulho de 42° sobre a fileira de objetos.
    position: [0.3, 2.33, -1.42],
    lookAt: MENU_LOOKAT,
    fov: 34,
    stop: 1,
    // 1.12 e não 1.32: com o padrão a câmera iria a y = 2,87 m, ACIMA do
    // pé-direito de 2,72 — ficaria do lado de fora com o plano do teto entre
    // ela e a cena, ou seja, tela preta no celular.
    mobileScale: 1.12,
    // Fileira de centros de -0,54 a 1,14 (1,68 m) + meia peça de cada lado +
    // folga pro alvo de clique não encostar na borda da tela.
    larguraMinima: 2.0,
  },
];

const MOBILE_DISTANCE_SCALE = 1.32;
const MOBILE_FOV_BOOST = 9;

/**
 * Retorna os keyframes ajustados pro viewport atual. Em telas estreitas a
 * câmera fica mais afastada do alvo (escala o vetor lookAt→position) e com
 * FOV mais aberto, pra fileira de objetos não cortar nas laterais de um
 * enquadramento mais alto/estreito que o retrato desktop.
 *
 * Os CLAMPS no fim não são detalhe: sem eles a escala de 1.32 já jogava a
 * câmera do keyframe amplo pra z ≈ 5,37 com ROOM.zFrente = 3,4 — ou seja,
 * ATRÁS da parede da frente, olhando o quarto de fora. Isso passava
 * despercebido enquanto o fundo era uma cor sólida; com uma vista exterior
 * real e um céu, viraria vazamento visível.
 */
export function getCameraKeyframes(isNarrow: boolean): readonly CameraKeyframe[] {
  if (!isNarrow) return BASE_KEYFRAMES;

  const tetoY = ROOM.altura - 0.2;
  const limiteZ = ROOM.zFrente - 0.25;

  return BASE_KEYFRAMES.map((kf) => {
    const escala = kf.mobileScale ?? MOBILE_DISTANCE_SCALE;
    const [px, py, pz] = kf.position;
    const [lx, ly, lz] = kf.lookAt;
    return {
      ...kf,
      position: [
        lx + (px - lx) * escala,
        Math.min(ly + (py - ly) * escala, tetoY),
        Math.min(lz + (pz - lz) * escala, limiteZ),
      ] as [number, number, number],
      fov: kf.fov + MOBILE_FOV_BOOST,
    };
  });
}
