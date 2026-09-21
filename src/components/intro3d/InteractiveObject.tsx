"use client";

import { useContext, useRef, useState, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { ProgressContext } from "./progress";

/**
 * Wrapper reutilizável pros 5 objetos clicáveis do banco (menu principal).
 * A superfície de interação de verdade é um <button> HTML invisível (via
 * drei's <Html>), não eventos de ponteiro na malha 3D — dá um alvo de
 * clique consistente independente da distância da câmera, funciona em
 * touch, é navegável por Tab, e dá um data-testid estável pra testar sem
 * precisar calcular projeção 3D→tela.
 *
 * O TAMANHO DESSE ALVO É MEDIDO DA PEÇA, não escolhido à mão. Antes era um
 * círculo de 78–86 px fixos centrado na âncora, e isso errava de dois jeitos
 * ao mesmo tempo: sobrava alvo em volta da prancheta (baixa e deitada) e
 * FALTAVA alvo no globo e na ampulheta, que sobem bem acima da âncora — a
 * metade de cima das duas peças simplesmente não respondia ao mouse. Um
 * círculo também descarta os cantos do que é, na tela, um retângulo.
 *
 * Agora a caixa envolvente 3D da peça é projetada na tela a cada quadro e o
 * botão assume exatamente esse retângulo (ver dimensionarAlvo). O alvo cobre
 * a peça inteira, acompanha sozinho a câmera se aproximando e continua certo
 * em qualquer viewport — sem número mágico em pixel pra manter.
 *
 * O RETORNO VISUAL é deliberadamente de objeto, não de botão. Um objeto que
 * pulsa, cresce muito ou acende uma borda anuncia "eu sou um controle" e
 * quebra a ilusão de quarto. O que acontece aqui é o que aconteceria se
 * alguém se aproximasse do banco pra pegar a peça:
 *
 *   - Ela sobe pouco e inclina de leve, em eixos diferentes por objeto — o
 *     giro é derivado da posição, então cada peça reage com um ângulo
 *     próprio em vez de as cinco fazerem o mesmo movimento.
 *   - A resposta é ASSIMÉTRICA: entra rápido (o objeto "atende"), sai devagar
 *     (assenta). Amortecimento simétrico é o que dá a sensação mecânica de
 *     interface; nada físico entra e sai no mesmo tempo.
 *   - Uma luz quente de baixa intensidade acende junto, o que muda a sombra
 *     de contato e o reflexo do objeto no assento. É o retorno que integra a
 *     peça ao ambiente em vez de sobrepor um efeito a ela.
 *
 * O foco por teclado dispara exatamente o mesmo estado (onFocus/onBlur), pra
 * quem navega por Tab receber a mesma informação de quem usa o mouse.
 */

/** Entra rápido, sai devagar — ver comentário acima. */
const LAMBDA_ENTRADA = 14;
const LAMBDA_SAIDA = 4.5;

/**
 * Progresso de scroll (bruto, 0–1) a partir do qual os alvos de clique ligam.
 *
 * Conserta um bug real: os alvos ficavam ativos desde o progresso 0. No
 * enquadramento amplo o banco inteiro ocupa ~340 px de tela, e os cinco alvos
 * se sobrepunham em cima dele — um clique em qualquer lugar do móvel abria a
 * seção que estivesse por cima, não a do objeto que o usuário via.
 *
 * 0,85 porque o CameraRig aplica easeInOutCubic sobre o progresso bruto: em
 * 0,85 o valor suavizado já é ≈0,987, ou seja a câmera está a ~96% do
 * mergulho final. Os alvos só existem quando o que se vê é o arranjo em que
 * eles foram posicionados.
 *
 * O gate é SÓ de ponteiro. Foco por Tab continua funcionando em qualquer
 * ponto do percurso: quem navega por teclado escolhe o objeto pelo nome
 * (aria-label), não pela posição na tela, então não há alvo errado a evitar.
 */
const LIMIAR_ATIVACAO = 0.85;

/**
 * Teto da largura do alvo, em METROS de cena — não em pixels.
 *
 * O passo entre os centros dos objetos é 0,42 m (ver BenchMenu). Limitar a
 * caixa a 0,40 m garante 2 cm de folga entre alvos vizinhos SEJA QUAL FOR o
 * zoom ou a viewport: como o limite vive no mesmo espaço que o passo, os dois
 * encolhem juntos na projeção. Era isso que o antigo teto de "16vw" tentava
 * fazer em pixels, e só acertava por tabela.
 *
 * Só o eixo horizontal precisa disso: a fileira é única, não há vizinho acima
 * nem abaixo pra disputar o ponteiro.
 */
const LARGURA_MAX_MUNDO = 0.4;

/** Mínimo de toque (WCAG 2.5.8) — peça baixa e fina ainda precisa ser pegável. */
const ALVO_MIN_PX = 44;

/**
 * Intervalo entre remedições da caixa envolvente, em segundos.
 *
 * A caixa quase não muda (a peça é estática), mas remedir de tempos em tempos
 * cobre o caso em que a malha chega DEPOIS do primeiro quadro — as peças
 * dependem de texturas e modelos carregados de forma assíncrona, e uma
 * medição única pegaria um grupo ainda vazio.
 */
const INTERVALO_MEDICAO = 0.4;

/** Só reescreve o DOM quando o alvo muda mais que isto (px). */
const EPSILON_PX = 0.5;

export function InteractiveObject({
  position,
  label,
  onSelect,
  children,
}: {
  position: [number, number, number];
  label: string;
  onSelect: () => void;
  children: ReactNode;
}) {
  const externoRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);
  const luzRef = useRef<THREE.PointLight>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);
  /** Último estado aplicado ao DOM — null força a primeira escrita. */
  const ativoRef = useRef<boolean | null>(null);
  /** Caixa envolvente da peça EM REPOUSO, em coordenadas de mundo. */
  const caixaRef = useRef(new THREE.Box3());
  const desdeMedicaoRef = useRef(INTERVALO_MEDICAO);
  /** Último retângulo escrito no botão: [largura, altura, dx, dy]. */
  const alvoRef = useRef<[number, number, number, number] | null>(null);
  const vetorRef = useRef(new THREE.Vector3());
  const ancoraRef = useRef(new THREE.Vector3());
  const progressRef = useContext(ProgressContext);
  const [hovered, setHovered] = useState(false);

  // Ângulo de inclinação próprio de cada peça, derivado da posição no banco
  // (determinista, não aleatório — o mesmo objeto sempre reage igual).
  const inclinacaoX = Math.sin(position[0] * 1.7 + position[2]) * 0.05;
  const inclinacaoZ = Math.cos(position[2] * 2.1 - position[0]) * 0.045;

  useFrame((state, delta) => {
    /*
      Gate de ponteiro, escrito direto no nó DOM — sem setState a cada
      quadro. Só toca no DOM na TRANSIÇÃO (ativoRef guarda o último valor),
      então no regime estável isto é uma comparação de booleano por frame.

      pointer-events NÃO vai no `style` do JSX abaixo, de propósito: se fosse,
      cada re-render (o hover muda estado) poderia reescrever o valor e brigar
      com este efeito. Sem ele no JSX, o botão herda `none` do contêiner do
      <Html> até o primeiro quadro decidir — ou seja, nasce inerte, que é o
      lado seguro.
    */
    const botao = botaoRef.current;
    if (botao) {
      const ativo = (progressRef?.current ?? 1) >= LIMIAR_ATIVACAO;
      if (ativo !== ativoRef.current) {
        ativoRef.current = ativo;
        botao.style.pointerEvents = ativo ? "auto" : "none";
        botao.style.cursor = ativo ? "pointer" : "default";
        // Se o ponteiro estava sobre a peça quando o gate desligou (rolando
        // de volta pra cima), o pointerleave pode nunca disparar — sem isto
        // a peça ficaria levantada e com a luz acesa.
        if (!ativo) setHovered(false);
      }
    }

    const group = groupRef.current;
    if (!group) return;

    /*
      Medição SÓ EM REPOUSO. O grupo interno é justamente o que a animação de
      hover escala (1,06) e levanta (5 cm); medir no meio disso gravaria um
      alvo inflado, que no quadro seguinte ficaria maior que a peça — e, pior,
      cresceria a cada passada do mouse. A comparação com scale.x cobre também
      a SAÍDA do hover, que é amortecida e leva ~1 s pra assentar.
    */
    desdeMedicaoRef.current += delta;
    if (!hovered && Math.abs(group.scale.x - 1) < 0.002 && desdeMedicaoRef.current >= INTERVALO_MEDICAO) {
      desdeMedicaoRef.current = 0;
      medirCaixa(group, caixaRef.current);
    }

    if (botao && externoRef.current && !caixaRef.current.isEmpty()) {
      dimensionarAlvo(
        botao,
        caixaRef.current,
        externoRef.current.getWorldPosition(ancoraRef.current),
        state.camera,
        state.size.width,
        state.size.height,
        vetorRef.current,
        alvoRef,
      );
    }

    const lambda = hovered ? LAMBDA_ENTRADA : LAMBDA_SAIDA;
    group.scale.setScalar(THREE.MathUtils.damp(group.scale.x, hovered ? 1.06 : 1, lambda, delta));
    group.position.y = THREE.MathUtils.damp(group.position.y, hovered ? 0.05 : 0, lambda, delta);
    group.rotation.x = THREE.MathUtils.damp(group.rotation.x, hovered ? inclinacaoX : 0, lambda, delta);
    group.rotation.z = THREE.MathUtils.damp(group.rotation.z, hovered ? inclinacaoZ : 0, lambda, delta);

    const luz = luzRef.current;
    if (luz) {
      // A oscilação minúscula (±4%) impede que a luz fique perfeitamente
      // parada enquanto acesa. Luz absolutamente constante é a assinatura
      // mais óbvia de render; qualquer fonte real respira um pouco.
      const alvo = hovered ? 0.85 * (1 + Math.sin(state.clock.elapsedTime * 2.4) * 0.04) : 0;
      luz.intensity = THREE.MathUtils.damp(luz.intensity, alvo, lambda, delta);
    }
  });

  return (
    <group position={position} ref={externoRef}>
      <group ref={groupRef}>{children}</group>

      {/*
        distance curto (1.6) é essencial: a luz tem que morrer antes de
        alcançar os objetos vizinhos, senão passar o mouse num item clareia
        o banco inteiro e o retorno deixa de dizer QUAL peça respondeu.
      */}
      <pointLight ref={luzRef} position={[0, 0.35, 0.15]} color={0xffcf96} intensity={0} distance={1.6} decay={2} />

      <Html center occlude={false} style={{ pointerEvents: "none" }}>
        <button
          ref={botaoRef}
          type="button"
          aria-label={label}
          data-testid={`table-object-${label}`}
          onClick={onSelect}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          onFocus={() => setHovered(true)}
          onBlur={() => setHovered(false)}
          style={{
            /*
              Só o estado inicial: largura, altura e deslocamento passam a ser
              escritos por dimensionarAlvo a partir do primeiro quadro em que a
              peça já tem malha. Começar no mínimo de toque (e não em zero)
              mantém o botão focável por Tab mesmo se a medição nunca vier.

              Retângulo, não círculo: a projeção de uma caixa na tela É um
              retângulo, e arredondar cortaria fora os cantos da peça — o
              oposto do que este alvo existe pra fazer.
            */
            width: `${ALVO_MIN_PX}px`,
            height: `${ALVO_MIN_PX}px`,
            borderRadius: 0,
            border: "none",
            background: "transparent",
            padding: 0,
          }}
        />
      </Html>
    </group>
  );
}

/** Reaproveitada a cada malha visitada por medirCaixa — não alocar por quadro. */
const caixaAuxiliar = new THREE.Box3();

/**
 * Caixa envolvente da peça, em mundo, PULANDO o que não é a peça.
 *
 * É Box3.setFromObject com uma exceção: nós marcados com
 * `userData.foraDoAlvo` (e a subárvore deles) ficam de fora. Existe por causa
 * das sombras de contato PINTADAS — planos de gradiente deitados no assento,
 * como o do BookMesh, que se estende ~10 cm à esquerda do livro. Sombra é o
 * que a peça PROJETA, não onde a peça está, e um alvo que a inclui fica
 * descentralizado: sobra área em cima do colchonete vazio de um lado e falta
 * do outro.
 *
 * No enquadramento atual isso não se vê, porque o corte de LARGURA_MAX_MUNDO
 * já morde os dois lados da caixa do livro antes da sombra importar (medido:
 * o alvo sai igual com e sem a exceção). A marca está aqui pra medição
 * continuar sendo da PEÇA se o mergulho mudar de distância ou outra peça
 * ganhar uma sombra pintada — não pra consertar um desalinhamento visível hoje.
 */
function medirCaixa(raiz: THREE.Object3D, destino: THREE.Box3) {
  raiz.updateWorldMatrix(true, true);
  destino.makeEmpty();
  acumularCaixa(raiz, destino);
}

function acumularCaixa(no: THREE.Object3D, destino: THREE.Box3) {
  if (!no.visible || no.userData.foraDoAlvo) return;
  const malha = no as THREE.Mesh;
  if (malha.isMesh && malha.geometry) {
    if (!malha.geometry.boundingBox) malha.geometry.computeBoundingBox();
    if (malha.geometry.boundingBox) {
      destino.union(caixaAuxiliar.copy(malha.geometry.boundingBox).applyMatrix4(malha.matrixWorld));
    }
  }
  for (const filho of no.children) acumularCaixa(filho, destino);
}

/**
 * Projeta a caixa envolvente da peça na tela e ajusta o botão pra cobri-la.
 *
 * Projeta os OITO cantos, não o centro com uma escala: sob perspectiva a
 * caixa vira um hexágono na tela, e qualquer atalho que use só dois cantos
 * subestima a silhueta de uma peça alta vista de cima, como a ampulheta.
 *
 * O deslocamento existe porque o <Html center> ancora o botão no pivô do
 * objeto (a base, no assento) enquanto a peça se estende pra cima: sem o
 * translate, um alvo do tamanho certo ficaria com metade enterrada no
 * colchonete.
 */
function dimensionarAlvo(
  botao: HTMLButtonElement,
  caixa: THREE.Box3,
  ancora: THREE.Vector3,
  camera: THREE.Camera,
  largura: number,
  altura: number,
  v: THREE.Vector3,
  alvoRef: { current: [number, number, number, number] | null },
) {
  // Corta no espaço de MUNDO (ver LARGURA_MAX_MUNDO) antes de projetar, pra
  // folga entre vizinhos não depender do zoom.
  const minX = Math.max(caixa.min.x, ancora.x - LARGURA_MAX_MUNDO / 2);
  const maxX = Math.min(caixa.max.x, ancora.x + LARGURA_MAX_MUNDO / 2);

  let telaMinX = Infinity;
  let telaMinY = Infinity;
  let telaMaxX = -Infinity;
  let telaMaxY = -Infinity;

  for (let i = 0; i < 8; i++) {
    v.set(i & 1 ? maxX : minX, i & 2 ? caixa.max.y : caixa.min.y, i & 4 ? caixa.max.z : caixa.min.z);
    v.project(camera);
    // Canto atrás da câmera: a projeção espelha e o retângulo explodiria. Não
    // deve acontecer no percurso desta cena, mas um alvo gigante cobrindo a
    // tela inteira é estrago grande demais pra ficar sem guarda.
    if (v.z > 1) return;
    const x = (v.x * 0.5 + 0.5) * largura;
    const y = (-v.y * 0.5 + 0.5) * altura;
    if (x < telaMinX) telaMinX = x;
    if (x > telaMaxX) telaMaxX = x;
    if (y < telaMinY) telaMinY = y;
    if (y > telaMaxY) telaMaxY = y;
  }

  v.copy(ancora).project(camera);
  const ancoraX = (v.x * 0.5 + 0.5) * largura;
  const ancoraY = (-v.y * 0.5 + 0.5) * altura;

  const l = Math.max(telaMaxX - telaMinX, ALVO_MIN_PX);
  const a = Math.max(telaMaxY - telaMinY, ALVO_MIN_PX);
  const dx = (telaMinX + telaMaxX) / 2 - ancoraX;
  const dy = (telaMinY + telaMaxY) / 2 - ancoraY;

  // Escreve só quando muda de verdade. Com a câmera assentada no fim do
  // mergulho isto vira quatro comparações por quadro, sem tocar no layout.
  const anterior = alvoRef.current;
  if (
    anterior &&
    Math.abs(anterior[0] - l) < EPSILON_PX &&
    Math.abs(anterior[1] - a) < EPSILON_PX &&
    Math.abs(anterior[2] - dx) < EPSILON_PX &&
    Math.abs(anterior[3] - dy) < EPSILON_PX
  ) {
    return;
  }
  alvoRef.current = [l, a, dx, dy];
  botao.style.width = `${l}px`;
  botao.style.height = `${a}px`;
  botao.style.transform = `translate(${dx}px, ${dy}px)`;
}
