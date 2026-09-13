"use client";

import { QUARTO } from "../palette";
import { usePbrMaterial } from "../textures/usePbrMaterial";
import { ROOM, ASSENTO_TOPO_Y } from "../roomLayout";

/**
 * O banco-janela: corpo de marcenaria branca com gavetas e puxadores
 * redondos, tampo de madeira clara e o colchonete por cima.
 *
 * AS ALMOFADAS FORAM REMOVIDAS a pedido — o lugar delas no assento é onde
 * ficam os cinco objetos interativos (ver BenchMenu em Scene.tsx). Por isso o
 * colchonete corre a largura inteira, sem nada encostado no requadro.
 *
 * As frentes de gaveta são placas próprias com folga de 6 mm sobre um corpo
 * mais escuro, não linhas desenhadas numa caixa. É a sombra fininha caindo
 * dentro dessa folga que faz ler como marcenaria de verdade.
 */

const FOLGA = 0.006;

export function Bench() {
  // semCor: o Diffuse do fine_grained_wood é uma madeira escura, e tingi-la de
  // claro (multiplicação, ver usePbrMaterial) dá marrom sujo. Fica o grão pelo
  // relevo, e a cor vem do `color`.
  const tampo = usePbrMaterial("fine_grained_wood", { repeat: [4, 0.8], normalScale: 0.55, semCor: true });
  const { assento, zFundo } = ROOM;

  const profundidadeCorpo = assento.zFrente - zFundo;
  const zCentroCorpo = (zFundo + assento.zFrente) / 2;

  // 4 gavetas largas, como na foto (não 7 portinhas estreitas).
  const gavetas = 4;
  const larguraGaveta = assento.largura / gavetas - FOLGA;

  return (
    <group>
      {/* Corpo — escuro, só pra aparecer nas folgas entre as frentes. */}
      <mesh position={[0, assento.altura / 2, zCentroCorpo]} castShadow receiveShadow>
        <boxGeometry args={[assento.largura, assento.altura, profundidadeCorpo]} />
        <meshStandardMaterial color={0x8d8378} roughness={0.9} />
      </mesh>

      {Array.from({ length: gavetas }, (_, i) => {
        const x = -assento.largura / 2 + (assento.largura / gavetas) * (i + 0.5);
        return (
          <group key={i}>
            {/* Frente da gaveta */}
            <mesh position={[x, assento.altura / 2 - 0.02, assento.zFrente + 0.008]} castShadow receiveShadow>
              <boxGeometry args={[larguraGaveta, assento.altura - 0.09, 0.016]} />
              {/*
                Fosco acetinado, não fosco puro: a marcenaria da foto devolve um
                brilho largo e macio da janela. Em roughness 1 o móvel vira um
                bloco de cor chapada.
              */}
              <meshStandardMaterial color={QUARTO.marcenaria} roughness={0.55} metalness={0.03} />
            </mesh>
            {/* Puxador redondo */}
            <mesh
              position={[x, assento.altura / 2 - 0.02, assento.zFrente + 0.03]}
              rotation={[Math.PI / 2, 0, 0]}
              castShadow
            >
              <cylinderGeometry args={[0.016, 0.016, 0.03, 12]} />
              <meshStandardMaterial color={QUARTO.latao} roughness={0.35} metalness={0.75} />
            </mesh>
          </group>
        );
      })}

      {/* Tampo de madeira clara, com uma pequena sobra na frente */}
      <mesh position={[0, assento.altura + 0.011, zCentroCorpo - 0.01]} castShadow receiveShadow>
        <boxGeometry args={[assento.largura + 0.03, 0.022, profundidadeCorpo + 0.04]} />
        <meshStandardMaterial {...tampo} color={QUARTO.madeiraClara} roughness={0.6} metalness={0} />
      </mesh>

      {/* Colchonete — a superfície onde os objetos do menu repousam. */}
      <mesh position={[0, ASSENTO_TOPO_Y - 0.0165, zCentroCorpo - 0.01]} castShadow receiveShadow>
        <boxGeometry args={[assento.largura - 0.04, 0.033, profundidadeCorpo - 0.05]} />
        <meshStandardMaterial color={QUARTO.assento} roughness={0.95} metalness={0} />
      </mesh>
    </group>
  );
}
