/**
 * Espelha as CSS custom properties de src/app/globals.css como hex numérico,
 * pra cena 3D e o livro 2D nunca divergirem de tom. Se a paleta em
 * globals.css mudar, atualizar aqui também.
 */
export const PALETTE = {
  roseBlush: 0xf9e4e8,
  sage: 0xb7c7a3,
  sageDeep: 0x4e5d45,
  sepia: 0x43392e,
  parchment: 0xf6f0e4,
  seal: 0xa9852f,
  stageDark: 0x241f1b,
} as const;

/**
 * Cores do QUARTO 3D, tiradas da foto de referência que o usuário pediu para
 * reproduzir. Vivem separadas da PALETTE do casamento de propósito: a paleta
 * acima é a identidade gráfica do convite (e é espelhada em globals.css para o
 * livro 2D usar), enquanto estas descrevem materiais de um ambiente real e não
 * devem ser confundidas com ela nem "harmonizadas" com ela.
 *
 * ATENÇÃO ao calibrar: a cena é de fim de tarde, com TODA a luz quente (sol
 * âmbar + HDRI dourado + pisca-pisca). Uma superfície fosca acumula essas
 * contribuições, então as cores base aqui precisam ser mais FRIAS e mais
 * DESSATURADAS do que o material "parece" na foto. Foi por não fazer isso que
 * uma parede cinza saiu francamente marrom numa versão anterior.
 */
export const QUARTO = {
  /** Paredes: creme quente muito claro. */
  parede: 0xe6dfd2,
  /** Caixilho e requadro da janela, brancos. */
  caixilho: 0xf6f3ec,
  /** Madeira clara natural — tampo do banco e prateleiras. */
  madeiraClara: 0xd9c4a4,
  /** Piso de tábuas, mel quente. */
  piso: 0xc9a679,
  /** Frentes de gaveta do banco e do criado-mudo: branco-creme fosco. */
  marcenaria: 0xf0e9dd,
  /** Puxadores redondos e ferragens, latão escurecido. */
  latao: 0x9a7c4e,
  /** Colchonete do banco. */
  assento: 0xe8dfcc,
  /** Roupa de cama e manta de tricô. */
  cama: 0xf2ece0,
  /** Vaso de cerâmica e cachepôs. */
  ceramica: 0xd3bda0,
  /** Metal preto fosco (trilho, arames). */
  metalPreto: 0x24262a,
  /** Chama/lanterna âmbar. */
  chama: 0xffb463,
} as const;

/**
 * Cores do EXTERIOR visto pela janela.
 *
 * Separadas do quarto porque obedecem a outra lógica: aqui manda a
 * PERSPECTIVA AÉREA — quanto mais longe, mais a cor da coisa se dissolve na
 * cor do céu. As duas colinas usam a mesma silhueta e só diferem por isso, e é
 * essa diferença que cria a sensação de distância.
 */
export const EXTERIOR = {
  /** Topo do céu, ainda azulado. */
  ceuAlto: 0x8fb0cc,
  /** Meio do céu, dourado quente. */
  ceuMeio: 0xf0c98a,
  /** Junto ao horizonte, quase branco de tão estourado. */
  ceuHorizonte: 0xfde9c8,
  /** Nuvens iluminadas por baixo. */
  nuvem: 0xfff2dd,
  /** Disco do sol. Vai multiplicado (ver WindowView) pra ultrapassar o limiar do Bloom. */
  sol: 0xfff0d0,
  /** Colina distante — já bem lavada em direção ao céu. */
  colinaLonge: 0xc9c3b4,
  /** Colina próxima. */
  colinaPerto: 0x9aa585,
  /** Folhagem: dois verdes do lado do sol, dois da sombra. */
  folhaSol: 0xc9d17a,
  folhaSolQuente: 0xa8b95e,
  folhaSombra: 0x5c7343,
  folhaSombraFria: 0x44583a,
  /** Tronco das árvores próximas. */
  tronco: 0x4a3d31,
  /** Flores dos arbustos. */
  flor: 0xf2a6bd,
  /** Chão externo, capim dourado de fim de tarde. */
  campo: 0xa9a161,
} as const;
