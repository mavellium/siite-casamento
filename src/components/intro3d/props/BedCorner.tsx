"use client";

import { useMemo } from "react";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { QUARTO } from "../palette";
import { ROOM } from "../roomLayout";

/**
 * Cama em primeiro plano no canto inferior ESQUERDO, cortada pela borda de
 * baixo do enquadramento — o mesmo papel que ela tem na foto de referência.
 *
 * Existe por composição, não por decoração: sem ela a cena tem só dois planos
 * (banco e janela) e o olho lê "objeto sobre palco". Um terceiro plano na
 * frente, parcialmente fora do quadro, é o que dá a sensação de estar DENTRO
 * do quarto olhando a janela, em vez de olhando uma maquete.
 *
 * Fica à ESQUERDA por dois motivos: é onde está na foto, e é o lado oposto ao
 * azimute do sol (ver Intro3DScene) — se estivesse à direita ficaria no
 * caminho da luz-chave e jogaria a própria sombra por cima das manchas de sol
 * no piso, que são o efeito central da cena.
 *
 * Tudo aqui é branco sobre branco, então a única coisa que separa colchão,
 * edredom e manta é a SOMBRA entre eles. Por isso as peças têm alturas
 * escalonadas e cantos bem arredondados: é o gradiente na quina que desenha a
 * forma quando não há contraste de cor pra ajudar.
 */
export function BedCorner() {
  const { cama } = ROOM;
  const [cx, , cz] = cama.centro;

  const colchao = useMemo(
    () => new RoundedBoxGeometry(cama.largura, 0.34, cama.comprimento, 4, 0.05),
    [cama.largura, cama.comprimento]
  );
  const edredom = useMemo(
    () => new RoundedBoxGeometry(cama.largura + 0.1, 0.22, cama.comprimento * 0.86, 4, 0.11),
    [cama.largura, cama.comprimento]
  );
  const rolo = useMemo(() => new RoundedBoxGeometry(1, 1, 1, 4, 0.2), []);

  return (
    <group>
      {/* Estrutura baixa de madeira, quase toda escondida pelo edredom */}
      <mesh position={[cx, 0.17, cz]} castShadow receiveShadow>
        <boxGeometry args={[cama.largura + 0.08, 0.34, cama.comprimento + 0.06]} />
        <meshStandardMaterial color={0xbba57f} roughness={0.8} metalness={0} />
      </mesh>

      {/* Colchão / lençol esticado */}
      <mesh position={[cx, cama.topo - 0.17, cz]} geometry={colchao} castShadow receiveShadow>
        <meshStandardMaterial color={QUARTO.cama} roughness={0.96} metalness={0} />
      </mesh>

      {/*
        Edredom. Tom LEVEMENTE mais escuro que o lençol (0xe8e0d0 contra
        0xf2ece0): branco sobre branco exatamente igual desaparece — a cama
        vira uma chapa clara única, sem forma nenhuma. A diferença é pequena o
        bastante pra continuar lendo como "roupa de cama branca", e grande o
        bastante pra a dobra existir.
      */}
      <mesh
        position={[cx, cama.topo + 0.06, cz + cama.comprimento * 0.06]}
        geometry={edredom}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={0xe8e0d0} roughness={0.97} metalness={0} />
      </mesh>

      {/*
        Virada do lençol sobre a borda do edredom — o rolinho que aparece em
        toda cama arrumada. Além de existir de verdade, é a linha de sombra que
        separa as duas peças aos olhos da câmera.
      */}
      <mesh
        geometry={rolo}
        position={[cx, cama.topo + 0.14, cz - cama.comprimento * 0.33]}
        scale={[cama.largura + 0.06, 0.13, 0.24]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={QUARTO.cama} roughness={0.94} metalness={0} />
      </mesh>

      {/*
        Manta de tricô caída de través no pé da cama — a peça que quebra a
        simetria e o único lugar onde a cama tem trama visível.
      */}
      <mesh
        geometry={rolo}
        position={[cx - 0.12, cama.topo + 0.13, cz + cama.comprimento * 0.3]}
        scale={[cama.largura * 0.86, 0.16, 0.62]}
        rotation={[0, 0.09, 0.02]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={0xe3d6c0} roughness={0.99} metalness={0} />
      </mesh>
    </group>
  );
}
