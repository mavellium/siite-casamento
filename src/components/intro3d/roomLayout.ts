/**
 * Medidas do quarto, em metros. Fonte única de verdade para a geometria da
 * cena E para os keyframes de câmera — as duas coisas precisam concordar, e
 * antes disso concordavam por coincidência de números escritos à mão em
 * arquivos diferentes.
 *
 * O quarto é a reconstrução da foto de referência enviada pelo usuário: um
 * dormitório compacto de fim de tarde, com janela panorâmica de três folhas
 * dando para árvores e colinas, hera com pisca-pisca contornando a moldura,
 * banco-janela com gavetas sob o vão, prateleiras flutuantes e criado-mudo à
 * esquerda, tapete estampado e cama em primeiro plano no canto inferior
 * esquerdo.
 *
 * A escala é métrica de verdade. Isso importa porque os modelos CC0 do Poly
 * Haven vêm em metros: com esta escala eles entram 1:1, sem fator de correção
 * arbitrário. (Uma versão anterior desta cena usava 6,4 m de largura por
 * 10,4 m de profundidade e não lia como quarto, lia como salão.)
 */

const Z_FUNDO = -3.6;

export const ROOM = {
  /** Largura total (X) e pé-direito (Y). */
  largura: 4.6,
  altura: 2.72,
  /** Parede do fundo — a que contém a janela. */
  zFundo: Z_FUNDO,
  /** Espessura das paredes. Precisa ser real: é ela que aparece no requadro da janela. */
  espessuraParede: 0.16,
  xEsquerda: -2.3,
  xDireita: 2.3,
  /**
   * Até onde o piso se estende na direção da câmera. Precisa ir ALÉM do pé da
   * cama (z ≈ 3.2): é de lá que o enquadramento amplo é feito, e uma câmera
   * fora do piso mostraria o cômodo terminando no nada.
   */
  zFrente: 3.4,

  /**
   * Janela panorâmica de três folhas.
   *
   * A base coincide com o tampo do banco: na foto a janela nasce do móvel, sem
   * faixa de parede entre os dois. `zVidro` fica atrás da face interna da
   * parede, então a espessura do requadro aparece — e é essa profundidade que
   * faz os montantes riscarem as manchas de sol no piso.
   */
  janela: {
    largura: 2.9,
    base: 0.58,
    topo: 2.3,
    zVidro: Z_FUNDO - 0.1,
    /** Dois montantes verticais dividem o vão em três folhas. */
    montantes: 2,
    espessuraMontante: 0.035,
    /** Perfil do caixilho em volta do vão. */
    espessuraCaixilho: 0.055,
  },

  /** Banco-janela: gavetas embaixo, colchonete em cima, encostado na parede do fundo. */
  assento: {
    largura: 3.0,
    altura: 0.55,
    profundidade: 0.62,
    /** Face frontal do banco (o corpo vai daqui até a parede do fundo). */
    zFrente: Z_FUNDO + 0.62,
  },

  /**
   * Cama em primeiro plano, canto inferior ESQUERDO, cortada pela borda de
   * baixo do enquadramento. Fica à esquerda porque é onde está na foto — e
   * porque deixa livre a diagonal por onde entram as manchas de sol.
   */
  cama: {
    centro: [-1.15, 0, 1.75] as [number, number, number],
    largura: 1.9,
    comprimento: 2.9,
    /** Altura do topo do colchão. */
    topo: 0.55,
  },

  /** Prateleiras flutuantes na parede esquerda, com os livros decorativos. */
  prateleiras: {
    z: -2.15,
    largura: 0.95,
    profundidade: 0.22,
    alturas: [1.58, 1.98] as const,
  },

  /** Criado-mudo branco sob as prateleiras. */
  criadoMudo: {
    centro: [-1.98, 0, -2.05] as [number, number, number],
    largura: 0.46,
    altura: 0.6,
    profundidade: 0.42,
  },

  /** Tapete estampado com franjas. */
  tapete: {
    centro: [0.55, 0.008, -0.5] as [number, number, number],
    largura: 2.5,
    comprimento: 1.85,
    giro: 0.06,
  },
} as const;

/** Altura em que os objetos interativos repousam — o tampo do colchonete do banco. */
export const ASSENTO_TOPO_Y = ROOM.assento.altura + 0.055;
