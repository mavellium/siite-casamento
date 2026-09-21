"use client";

import { PALETTE, QUARTO } from "./palette";
import { ROOM, ASSENTO_TOPO_Y } from "./roomLayout";
import { InteractiveObject } from "./InteractiveObject";
import { BookMesh } from "./BookMesh";
import { Clipboard } from "./props/Clipboard";
import { Hourglass } from "./props/Hourglass";
import { Globe } from "./props/Globe";
import { PictureWindow } from "./props/PictureWindow";
import { WindowView } from "./props/WindowView";
import { Bench } from "./props/Bench";
import { BedCorner } from "./props/BedCorner";
import { Ivy } from "./props/Ivy";
import { FairyLights } from "./props/FairyLights";
import { SeatDecor } from "./props/SeatDecor";
import { WallShelves } from "./props/WallShelves";
import { RoomDecor } from "./props/RoomDecor";
import { usePbrMaterial } from "./textures/usePbrMaterial";
import type { SectionId } from "@/types/section";

/**
 * O quarto, reconstruído a partir da foto de referência do usuário: janela
 * panorâmica de fim de tarde dando para árvores e colinas, banco-janela com
 * gavetas sob o vão, paredes creme e piso de madeira quente.
 *
 * O BANCO É O MENU. Os cinco objetos interativos repousam no colchonete, no
 * lugar onde estavam as almofadas da foto (removidas a pedido). Todas as
 * medidas vêm de roomLayout.ts, que é a mesma fonte que os keyframes de
 * câmera leem.
 */
export function Scene({ onSelectSection }: { onSelectSection: (id: SectionId) => void }) {
  return (
    <group>
      <Shell />
      <WindowView />
      <PictureWindow />
      <Ivy />
      <FairyLights />
      <Bench />
      <SeatDecor />
      <BedCorner />
      <WallShelves />
      <RoomDecor />
      <BenchMenu onSelectSection={onSelectSection} />
    </group>
  );
}

/**
 * REGRA DE APOIO — cada peça é levantada pela distância entre o PIVÔ do seu
 * componente e o ponto mais baixo dela, já multiplicada pela escala. Sem isso
 * as peças afundam ou flutuam, porque cada componente tem o pivô num lugar
 * diferente: o Clipboard no centro da tábua, o Globe na base, a Hourglass no
 * meio da ampulheta, o BookMesh no meio do bloco de páginas.
 *
 * Foi exatamente esse descuido que deixou o assento "bugado": a prancheta
 * entrava ~4 cm no colchonete, o globo flutuava 2 cm, o pé do porta-retrato
 * ficava 2,6 cm enterrado e a sombra de contato do livro sumia por baixo da
 * superfície.
 */
const APOIO = {
  /** Clipboard: tábua de 0,02 centrada no pivô → meia espessura × 0,52. */
  prancheta: 0.0052,
  /** BookMesh: bloco de páginas desce até -0,08 → × 0,42. */
  livro: 0.0336,
  /** Hourglass: disco de baixo em -0,17 → × 0,56. */
  ampulheta: 0.0952,
  /** FramedPhoto e Globe já têm o pivô na base. */
  base: 0,
} as const;

/**
 * Inclinação para trás, ~15°. Vale SÓ para peças em pé cujo pivô está na base
 * — aí ela gira em torno do ponto de contato, como um porta-retrato que
 * recosta. Aplicada a uma peça deitada, ou a uma cujo pivô está no centro, ela
 * enfia uma das pontas no móvel.
 */
const INCLINACAO = -0.26;
const ANCORA = 0.09;

/**
 * Os cinco objetos do menu, no colchonete do banco.
 *
 * Passo de 0,42 m entre centros. No mergulho final (câmera a 2,55 m, FOV 34)
 * a largura visível é ≈2,43 m, então isso dá ~242 px entre centros — folga
 * confortável para os alvos de clique, que hoje têm o tamanho da própria peça
 * projetada na tela (ver InteractiveObject/LARGURA_MAX_MUNDO, que corta a
 * largura do alvo em 0,40 m justamente pra caber neste passo).
 *
 * Todos ancorados na MESMA altura (ASSENTO_TOPO_Y + ANCORA): vistos de 42°
 * acima, âncoras em alturas diferentes deslocariam os botões verticalmente na
 * tela em quantidades diferentes, e o alinhamento da fileira se perderia. O
 * que varia é a altura da PEÇA dentro da âncora (ver APOIO), não a do alvo.
 *
 * Cada peça recebe um giro próprio em Y — fileira alinhada ao eixo leria como
 * prateleira de loja. Já a inclinação para trás vale só para as peças em pé
 * com pivô na base.
 */
function BenchMenu({ onSelectSection }: { onSelectSection: (id: SectionId) => void }) {
  const z = ROOM.zFundo + ROOM.assento.profundidade / 2;
  const y = ASSENTO_TOPO_Y;

  return (
    <group>
      <InteractiveObject
        position={[-0.54, y + ANCORA, z + 0.02]}
        label="Prancheta"
        onSelect={() => onSelectSection("rsvp")}
      >
        {/*
          Deitada e SEM inclinação. A prancheta é uma tábua apoiada de barriga
          pra baixo: inclinar 15° em torno do pivô central afundava a ponta de
          trás ~4 cm dentro do colchonete. O giro em Y basta pra ela não ficar
          alinhada ao móvel.
        */}
        <group position={[0, -ANCORA + APOIO.prancheta, 0]} rotation={[0, 0.34, 0]} scale={0.52}>
          <Clipboard />
        </group>
      </InteractiveObject>

      <InteractiveObject
        position={[-0.12, y + ANCORA, z - 0.03]}
        label="Retrato"
        onSelect={() => onSelectSection("gallery")}
      >
        {/*
          A única peça que recosta: o pivô do FramedPhoto está na base, então
          a inclinação gira em torno da linha de apoio, como um porta-retrato
          apoiado no pé.
        */}
        <group position={[0, -ANCORA + APOIO.base, 0]} rotation={[INCLINACAO, -0.28, 0]}>
          <FramedPhoto />
        </group>
      </InteractiveObject>

      <InteractiveObject
        position={[0.3, y + ANCORA, z]}
        label="Livro"
        onSelect={() => onSelectSection("story")}
      >
        {/*
          Deitado. A altura vem de APOIO.livro: além de encostar o bloco de
          páginas no colchonete, é ela que traz a sombra de contato do próprio
          BookMesh (um plano em y = -0,079 local) pra cima da superfície — com
          o valor antigo a sombra ficava enterrada e não aparecia.
        */}
        <group position={[0, -ANCORA + APOIO.livro, 0]} rotation={[0, 0.12, 0]} scale={0.42}>
          <BookMesh />
        </group>
      </InteractiveObject>

      <InteractiveObject
        position={[0.72, y + ANCORA, z - 0.02]}
        label="Calendário"
        onSelect={() => onSelectSection("schedule")}
      >
        {/*
          EM PÉ, a pedido. Ela chegou a ficar deitada de lado porque, vista de
          42° acima, o disco escuro do topo domina a silhueta. Em pé é como o
          objeto de fato existe, e no mergulho ainda sobra perfil suficiente
          pros dois cones e a cintura aparecerem.

          Só giro em Y: qualquer rotação em X/Z aqui tomba a peça, porque o
          pivô da Hourglass está no meio dela. A altura vem de APOIO.ampulheta,
          que encosta o disco de baixo no colchonete.
        */}
        <group position={[0, -ANCORA + APOIO.ampulheta, 0]} rotation={[0, 0.4, 0]} scale={0.56}>
          <Hourglass />
        </group>
      </InteractiveObject>

      <InteractiveObject
        position={[1.14, y + ANCORA, z + 0.01]}
        label="Globo"
        onSelect={() => onSelectSection("location")}
      >
        {/*
          Em pé e apoiado. Estava com rotação em X e Z — o que TOMBA a peça,
          já que o pivô do Globe é a base — e 2 cm acima do assento, flutuando.
          O giro em Y só vira o meridiano pra câmera, que é o que faz ler como
          globo e não como bola.
        */}
        <group position={[0, -ANCORA + APOIO.base, 0]} rotation={[0, 0.5, 0]} scale={0.52}>
          <Globe />
        </group>
      </InteractiveObject>
    </group>
  );
}

/** Piso, teto e as quatro paredes — a casca do cômodo. */
function Shell() {
  // semCor em tudo: os Diffuse do Poly Haven aqui são escuros demais pro
  // quarto claro da foto, e tingir por multiplicação daria marrom sujo.
  // Aproveitamos o relevo, e a cor vem do `color`.
  const piso = usePbrMaterial("dark_wooden_planks", { repeat: [3.5, 5], normalScale: 0.8, semCor: true });
  const reboco = usePbrMaterial("clay_plaster", { repeat: [3.5, 2], normalScale: 0.3, semCor: true });
  const rebocoTeto = usePbrMaterial("clay_plaster", { repeat: [2.6, 2.6], normalScale: 0.22, semCor: true });

  const { largura, altura, zFundo, zFrente, xDireita, xEsquerda, janela, espessuraParede } = ROOM;
  const profundidade = zFrente - zFundo;
  const zCentro = (zFrente + zFundo) / 2;
  const meiaJanela = janela.largura / 2;

  return (
    <group>
      {/* Piso de tábuas */}
      <mesh position={[0, 0, zCentro]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[largura, profundidade]} />
        <meshStandardMaterial {...piso} color={QUARTO.piso} roughness={0.6} metalness={0} />
      </mesh>

      {/*
        Teto. Ganhou textura porque no mergulho final a câmera sobe a 2,33 m e
        ele entra no quadro pela primeira vez — antes nunca aparecia e era um
        plano chapado que teria lido como caixa de luz.
      */}
      <mesh position={[0, altura, zCentro]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[largura, profundidade]} />
        <meshStandardMaterial {...rebocoTeto} color={0xf2ece1} roughness={0.98} metalness={0} />
      </mesh>

      {/*
        Parede do fundo em QUATRO CAIXAS, não quatro planos.

        Dois motivos, os dois load-bearing. (1) Um plano de face única virado
        pra dentro do quarto tem a face de trás culled, e como o sol vem de
        FORA, o shadow map renderizaria justamente essa face ausente: a luz
        atravessaria a parede e não haveria mancha de sol nenhuma no piso.
        (2) A caixa tem espessura real, então o vão ganha profundidade e a
        quina do requadro projeta a sombra em L que diz "buraco em parede
        grossa".
      */}
      <WallBox
        material={reboco}
        pos={[0, (altura + janela.topo) / 2, zFundo - espessuraParede / 2]}
        size={[largura, altura - janela.topo, espessuraParede]}
      />
      <WallBox
        material={reboco}
        pos={[0, janela.base / 2, zFundo - espessuraParede / 2]}
        size={[largura, janela.base, espessuraParede]}
      />
      <WallBox
        material={reboco}
        pos={[-(largura / 2 + meiaJanela) / 2, (janela.topo + janela.base) / 2, zFundo - espessuraParede / 2]}
        size={[largura / 2 - meiaJanela, janela.topo - janela.base, espessuraParede]}
      />
      <WallBox
        material={reboco}
        pos={[(largura / 2 + meiaJanela) / 2, (janela.topo + janela.base) / 2, zFundo - espessuraParede / 2]}
        size={[largura / 2 - meiaJanela, janela.topo - janela.base, espessuraParede]}
      />

      {/* Paredes laterais e da frente, também em caixa (fecham o cômodo). */}
      <WallBox
        material={reboco}
        pos={[xEsquerda - espessuraParede / 2, altura / 2, zCentro]}
        size={[espessuraParede, altura, profundidade]}
      />
      <WallBox
        material={reboco}
        pos={[xDireita + espessuraParede / 2, altura / 2, zCentro]}
        size={[espessuraParede, altura, profundidade]}
      />
      <WallBox
        material={reboco}
        pos={[0, altura / 2, zFrente + espessuraParede / 2]}
        size={[largura, altura, espessuraParede]}
      />
    </group>
  );
}

type MaterialPbr = ReturnType<typeof usePbrMaterial>;

function WallBox({
  material,
  pos,
  size,
}: {
  material: MaterialPbr;
  pos: [number, number, number];
  size: [number, number, number];
}) {
  if (size[0] <= 0 || size[1] <= 0 || size[2] <= 0) return null;
  return (
    <mesh position={pos} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial {...material} color={QUARTO.parede} roughness={0.96} metalness={0} />
    </mesh>
  );
}

/**
 * Porta-retrato — o alvo interativo da galeria.
 *
 * PIVÔ NA BASE: o grupo interno sobe tudo em 0,11 (a meia-altura da moldura),
 * então y=0 no componente é a linha em que ele apoia. É isso que permite
 * inclinar a peça girando em torno do ponto de contato. Com o pivô no centro,
 * como era antes, inclinar 15° enfiava o pé 2,6 cm dentro do colchonete.
 */
function FramedPhoto() {
  return (
    <group position={[0, 0.11, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.17, 0.22, 0.014]} />
        <meshStandardMaterial color={PALETTE.seal} roughness={0.4} metalness={0.35} />
      </mesh>
      <mesh position={[0, 0, 0.009]}>
        <planeGeometry args={[0.135, 0.185]} />
        <meshStandardMaterial color={PALETTE.roseBlush} roughness={0.85} />
      </mesh>
      {/* Pezinho de apoio atrás. Centro em -0,054 põe a ponta dele exatamente
          na base da moldura, sem sobrar nem faltar. */}
      <mesh position={[0, -0.054, -0.035]} rotation={[0.42, 0, 0]} castShadow>
        <boxGeometry args={[0.04, 0.12, 0.008]} />
        <meshStandardMaterial color={PALETTE.seal} roughness={0.6} metalness={0.2} />
      </mesh>
    </group>
  );
}
