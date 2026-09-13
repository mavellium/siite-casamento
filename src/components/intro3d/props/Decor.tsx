"use client";

import { useModel } from "./useModel";

/**
 * Objetos de cenário vindos dos modelos CC0 do Poly Haven (ver
 * scripts/assets-manifest.mjs).
 *
 * ESCALA: os modelos vêm em metros reais e a cena também é métrica (ver
 * roomLayout.ts), então em princípio entram 1:1. Onde há `scale` diferente
 * de 1, é ajuste de composição feito olhando — não conversão de unidade.
 *
 * ROTAÇÃO: cada peça entra com um ângulo Y que não é múltiplo de 90°. É
 * deliberado — nada entrega "arrumado por computador" mais rápido do que um
 * cômodo inteiro alinhado aos eixos.
 *
 * Este arquivo já teve wrappers para pilha de livros, vaso de cerâmica, cesta
 * de vime, almofadas e luminária. Saíram todos quando o quarto foi refeito a
 * partir da foto de hora dourada: os livros das prateleiras e a bandeja do
 * banco passaram a ser geometria própria (ver WallShelves e SeatDecor), as
 * almofadas foram removidas a pedido, e a luminária não existe na foto.
 */

type Pos = [number, number, number];

export function PottedPlant({
  position,
  scale = 1,
  rotationY = 0,
}: {
  position: Pos;
  scale?: number;
  rotationY?: number;
}) {
  const modelo = useModel("potted_plant_02");
  return <primitive object={modelo} position={position} rotation={[0, rotationY, 0]} scale={scale} />;
}
