/**
 * O que baixar do Poly Haven (tudo CC0 — domínio público, sem exigência de
 * atribuição; ainda assim registramos a origem em public/3d/CREDITS.md).
 *
 * Resolução fixa em 1k: a cena é vista de uma câmera única e relativamente
 * distante, então 2k/4k só aumentariam o download sem diferença visível.
 *
 * Mapas por textura:
 *  - Diffuse → map (cor). Precisa de colorSpace sRGB no three.
 *  - nor_gl  → normalMap (convenção OpenGL, que é a que o three espera;
 *              nor_dx é a convenção DirectX, com o eixo verde invertido).
 *  - arm     → um arquivo só com AO no canal R, Rugosidade no G e Metalness
 *              no B. O three lê o canal certo automaticamente quando o mesmo
 *              mapa é atribuído a aoMap/roughnessMap/metalnessMap.
 */

export const TEXTURE_MAPS = ["Diffuse", "nor_gl", "arm"];

export const TEXTURES = [
  { id: "fine_grained_wood", uso: "tampo da mesa" },
  { id: "dark_wooden_planks", uso: "piso" },
  { id: "clay_plaster", uso: "paredes" },
  { id: "denim_fabric", uso: "tecidos — almofadas, manta, cortina e tapete" },
  // dirty_carpet (3 MB) foi cortado por orçamento: é a textura mais pesada da
  // lista e serviria só ao tapete, que fica no fundo e resolve bem com o
  // denim_fabric tingido.
];

/**
 * Escolhas guiadas por peso real em 1k (medido pela API, não estimado):
 *  - potted_plant_02 (2,5 MB) entra no lugar de potted_plant_01 (6,0 MB) e é
 *    reaproveitada duas vezes, em escalas e rotações diferentes — o próprio
 *    useGLTF do drei faz cache, então a segunda cópia é de graça.
 *  - book_encyclopedia_set_01 no lugar de decorative_book_set_01, que
 *    simplesmente não publica gltf em nenhuma resolução.
 */
/**
 * Mapas de ambiente (HDRI).
 *
 * Por que baixar em vez de usar `<Environment preset="sunset">`: o preset do
 * drei busca o .hdr em raw.githack.com EM TEMPO DE EXECUÇÃO. Esse host se
 * mostrou inacessível daqui (ERR_CONNECTION_RESET no navegador, "fetch
 * failed" no Node) e, quando falha, a cena perde toda a luz indireta em
 * silêncio — sem erro visível pro usuário, só um quarto chapado. Servir o
 * arquivo do próprio domínio tira essa dependência externa do caminho.
 *
 * spaichingen_hill é um HDRI de EXTERIOR de fim de tarde (colina com árvores
 * e campo). Substituiu o lythwood_room (interior claro e neutro) quando a
 * referência do quarto mudou para uma cena de hora dourada com o sol entrando
 * direto pela janela: o reflexo nos metais e no vidro precisa contar a mesma
 * história que a luz-chave.
 *
 * Entra só como LUZ INDIRETA (`background={false}`), nunca como fundo. O que
 * se vê pela janela é geometria — ver props/WindowView.tsx, que explica por
 * que um panorama de fundo não serve aqui.
 */
export const HDRIS = [{ id: "spaichingen_hill", uso: "mapa de ambiente da cena (luz de fim de tarde)" }];

export const MODELS = [
  { id: "potted_plant_02", uso: "planta (reaproveitada: chão e estante)" },
  { id: "book_encyclopedia_set_01", uso: "pilha de livros" },
  { id: "ceramic_vase_01", uso: "cerâmica" },
  { id: "desk_lamp_arm_01", uso: "luminária (luz indireta)" },
  { id: "wicker_basket_01", uso: "cesta de vime" },
  { id: "throw_pillows_01", uso: "almofadas da cama/nicho" },
  // hanging_picture_frame_01 foi baixado e depois removido: a arte que o
  // modelo traz é escura e, contra a parede clara em contraluz da cena, os
  // quadros liam como retângulos pretos sem moldura visível. Os quadros de
  // parede passaram a ser primitivas (WallArt, em Scene.tsx).
];
