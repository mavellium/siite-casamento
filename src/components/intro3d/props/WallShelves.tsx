"use client";

import { useMemo } from "react";
import { QUARTO } from "../palette";
import { ROOM } from "../roomLayout";
import { mulberry32 } from "../geometry/random";

/**
 * As duas prateleiras flutuantes da parede esquerda, com LIVROS DECORATIVOS
 * (pedido explícito), uma plantinha pendente, um quadrinho encostado e uma
 * vela.
 *
 * Livros feitos como caixas finas, não como modelo carregado: são vistos de
 * lado, a 2 m de distância, e o que existe deles na imagem é uma fileira de
 * lombadas coloridas com alturas ligeiramente diferentes. Um GLTF aqui seria
 * ~3 MB para desenhar exatamente a mesma silhueta.
 *
 * Alturas, cores e inclinações vêm do ÍNDICE, nunca de Math.random(): render
 * de servidor e de cliente precisam bater, e uma estante que se reembaralha a
 * cada re-render seria impossível de calibrar.
 */

const CAPAS = [0xb9c4a0, 0xd9c2a6, 0x8fa3a8, 0xc9a18a, 0xa8b48c, 0xe0d3bb];

export function WallShelves() {
  const { prateleiras, xEsquerda } = ROOM;
  // Encostadas na face interna da parede esquerda.
  const x = xEsquerda + prateleiras.profundidade / 2;

  return (
    <group>
      {prateleiras.alturas.map((y, i) => (
        <group key={y}>
          {/* A prateleira */}
          <mesh position={[x, y, prateleiras.z]} castShadow receiveShadow>
            <boxGeometry args={[prateleiras.profundidade, 0.032, prateleiras.largura]} />
            <meshStandardMaterial color={QUARTO.madeiraClara} roughness={0.62} metalness={0} />
          </mesh>

          {i === 0 ? (
            <ShelfBooks x={x} y={y + 0.016} z={prateleiras.z} largura={prateleiras.largura} />
          ) : (
            <ShelfTop x={x} y={y + 0.016} z={prateleiras.z} />
          )}
        </group>
      ))}
    </group>
  );
}

/** Prateleira de baixo: a fileira de livros em pé, com um tombado por cima. */
function ShelfBooks({ x, y, z, largura }: { x: number; y: number; z: number; largura: number }) {
  const livros = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        // Espalhados só na metade de trás da prateleira: fileira ocupando tudo
        // lê como estante de loja, não como prateleira de quarto.
        z: z - largura / 2 + 0.08 + i * 0.052,
        altura: 0.2 + ((i * 7) % 5) * 0.015,
        espessura: 0.026 + ((i * 3) % 4) * 0.006,
        inclinacao: (((i * 13) % 7) - 3) * 0.018,
        cor: CAPAS[(i * 2) % CAPAS.length],
      })),
    [z, largura]
  );

  return (
    <group>
      {livros.map((l, i) => (
        <mesh
          key={i}
          position={[x, y + l.altura / 2, l.z]}
          rotation={[l.inclinacao, 0, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.15, l.altura, l.espessura]} />
          <meshStandardMaterial color={l.cor} roughness={0.82} metalness={0} />
        </mesh>
      ))}

      {/* Dois livros deitados na ponta, servindo de apoio — o detalhe que faz
          a fileira parecer usada em vez de arrumada por script. */}
      <mesh position={[x, y + 0.019, z + largura / 2 - 0.14]} castShadow receiveShadow>
        <boxGeometry args={[0.155, 0.038, 0.2]} />
        <meshStandardMaterial color={0xcdb89a} roughness={0.85} />
      </mesh>
      <mesh position={[x - 0.006, y + 0.054, z + largura / 2 - 0.15]} rotation={[0, 0.06, 0]} castShadow>
        <boxGeometry args={[0.14, 0.032, 0.18]} />
        <meshStandardMaterial color={0xa9b58f} roughness={0.85} />
      </mesh>
    </group>
  );
}

/** Prateleira de cima: quadrinho encostado, vela e uma plantinha pendente. */
function ShelfTop({ x, y, z }: { x: number; y: number; z: number }) {
  const folhas = useMemo(() => {
    const rnd = mulberry32(8891);
    // Ramos pendendo pela borda da prateleira — a planta da foto derrama.
    return Array.from({ length: 26 }, (_, i) => ({
      x: x + 0.02 + rnd() * 0.06,
      y: y - rnd() * 0.42,
      z: z - 0.3 + rnd() * 0.16,
      escala: 0.018 + rnd() * 0.014,
      giro: rnd() * Math.PI,
      claro: i % 3 === 0,
    }));
  }, [x, y, z]);

  return (
    <group>
      {/* Quadrinho encostado na parede */}
      <mesh position={[x + 0.02, y + 0.11, z + 0.24]} rotation={[0, 0.06, 0.03]} castShadow receiveShadow>
        <boxGeometry args={[0.016, 0.22, 0.17]} />
        <meshStandardMaterial color={0xdfd3bd} roughness={0.7} />
      </mesh>

      {/* Vela: disco emissivo, sem pointLight (ver nota em SeatDecor/Lantern). */}
      <mesh position={[x, y + 0.045, z + 0.06]} castShadow receiveShadow>
        <cylinderGeometry args={[0.032, 0.032, 0.09, 16]} />
        <meshStandardMaterial color={0xf1e6d2} roughness={0.8} />
      </mesh>
      <mesh position={[x, y + 0.092, z + 0.06]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.03, 16]} />
        <meshBasicMaterial color={0xffc27a} />
      </mesh>

      {/* Cachepô da plantinha */}
      <mesh position={[x + 0.02, y + 0.05, z - 0.26]} castShadow receiveShadow>
        <cylinderGeometry args={[0.05, 0.042, 0.1, 16]} />
        <meshStandardMaterial color={QUARTO.ceramica} roughness={0.9} />
      </mesh>

      {folhas.map((f, i) => (
        <mesh key={i} position={[f.x, f.y, f.z]} rotation={[f.giro, f.giro * 0.7, 0]} scale={f.escala} castShadow>
          <sphereGeometry args={[1, 6, 5]} />
          <meshStandardMaterial color={f.claro ? 0x8fae5d : 0x5f7a3c} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}
