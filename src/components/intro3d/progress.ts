/**
 * Objeto mutável compartilhado entre o GSAP ScrollTrigger (que escreve
 * progressRef.current fora da árvore do R3F, a cada scrub) e os
 * componentes R3F (que só leem, dentro de useFrame). Evitar re-render do
 * React a 60fps é o motivo de não usar useState aqui.
 */
export interface ProgressRef {
  current: number;
}
