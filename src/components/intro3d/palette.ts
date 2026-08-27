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
