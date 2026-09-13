import { createContext } from "react";

/**
 * Objeto mutável compartilhado entre o GSAP ScrollTrigger (que escreve
 * progressRef.current fora da árvore do R3F, a cada scrub) e os
 * componentes R3F (que só leem, dentro de useFrame). Evitar re-render do
 * React a 60fps é o motivo de não usar useState aqui.
 */
export interface ProgressRef {
  current: number;
}

/**
 * Entrega o progressRef a qualquer componente da cena sem prop drilling.
 *
 * Não causa re-render: o valor do Provider é o próprio ref, que é estável
 * pela vida inteira do componente — o que muda é `.current`, e isso o React
 * não vê. Os consumidores leem `.current` dentro de useFrame, nunca no render.
 *
 * O Provider fica DENTRO do <Canvas> (ver Intro3DScene), e não em volta dele,
 * de propósito: assim o funcionamento não depende da ponte automática de
 * contexto que o R3F faz entre a árvore do React DOM e a do reconciler 3D.
 *
 * `null` fora da intro: quem consumir sem Provider deve tratar como
 * "percurso concluído" (progresso 1).
 */
export const ProgressContext = createContext<ProgressRef | null>(null);
