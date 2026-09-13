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
 * Conserta um bug real: os botões têm tamanho FIXO em pixels e ficavam
 * ativos desde o progresso 0. No enquadramento amplo o banco inteiro ocupa
 * ~340 px de tela, e os cinco alvos de 78–86 px se sobrepunham em cima dele —
 * um clique em qualquer lugar do móvel abria a seção que estivesse por cima,
 * não a do objeto que o usuário via.
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

export function InteractiveObject({
  position,
  label,
  onSelect,
  sizePx = 90,
  children,
}: {
  position: [number, number, number];
  label: string;
  onSelect: () => void;
  sizePx?: number;
  children: ReactNode;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const luzRef = useRef<THREE.PointLight>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);
  /** Último estado aplicado ao DOM — null força a primeira escrita. */
  const ativoRef = useRef<boolean | null>(null);
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
    <group position={position}>
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
              Teto de 16vw: em retrato a fileira inteira cabe na tela (ver
              larguraMinima em cameraKeyframes), mas fica compacta — a 390 px o
              passo entre objetos é ~82 px. Com 78–86 px fixos os alvos se
              encostariam ou sobreporiam; 16vw dá ~62 px, ainda acima do
              mínimo de toque de 44 px. Em tela larga o min() fica no sizePx.
            */
            width: `min(${sizePx}px, 16vw)`,
            height: `min(${sizePx}px, 16vw)`,
            borderRadius: "50%",
            border: "none",
            background: "transparent",
          }}
        />
      </Html>
    </group>
  );
}
