"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { createGlobeTexture } from "../textures/globeMap";

/**
 * "Globo" — localização do evento (mapa/endereço).
 *
 * Refeito a partir da foto de referência de um globo escolar: base preta em
 * disco, pedestal que alarga no pé, MEIO-ARCO segurando a esfera pelos polos
 * (não dois anéis inteiros, como era antes) e o eixo inclinado.
 *
 * PIVÔ NA BASE: y = 0 é a superfície de apoio. Scene.tsx conta com isso
 * (APOIO.base = 0) pra pousar a peça no colchonete sem cálculo extra.
 *
 * A inclinação de 23,5° é a real da Terra, e é ela que faz a peça ler como
 * globo já na silhueta — um globo perfeitamente vertical parece uma bola num
 * suporte.
 */

const INCLINACAO_EIXO = THREE.MathUtils.degToRad(23.5);
const RAIO_ESFERA = 0.155;
/** O arco passa um pouco por fora da esfera, como o aro de metal do original. */
const RAIO_ARCO = 0.182;
/**
 * Giro do aro em torno do eixo, pra barriga dele ficar de LADO em relação à
 * câmera — assim se vê o semicírculo inteiro, do polo sul ao norte.
 *
 * -0,5 cancela exatamente o giro de +0,5 que Scene.tsx aplica ao globo inteiro
 * (variedade na fileira). Sem esse cancelamento a barriga apontava 28° pra
 * trás, metade do arco sumia atrás da esfera e o que sobrava lia como um
 * gancho saindo do polo. Se o giro em Scene mudar, este número acompanha.
 */
const ARO_GIRO = -0.5;
/** Altura do prato da base. */
const ALTURA_PRATO = 0.022;
/** Altura do topo do pedestal, onde a ponta de baixo do arco encaixa. */
const TOPO_PEDESTAL = 0.2;
const CENTRO_ESFERA = 0.365;

/**
 * Preto plástico da base e do aro.
 *
 * Bem escuro e com POUCO metalness de propósito: toda a luz da cena é quente
 * (sol de fim de tarde + HDRI dourado), e um preto brilhante com metalness
 * alto acumula esse âmbar no reflexo — nas primeiras versões a base
 * renderizava francamente marrom, não preta. O prato e a haste ainda subiram
 * pra roughness 0.45: sendo superfícies largas e viradas pra cima, em 0.3 elas
 * espelhavam a janela inteira e o preto virava bronze. O aro fica mais
 * brilhante que eles porque é fino e curvo — ali o reflexo comprido ajuda.
 */
const PRETO = 0x15171a;

export function Globe() {
  const textura = useMemo(() => createGlobeTexture(), []);

  /*
    Prato e haste SEPARADOS, e não um torneado só.

    A primeira versão era uma LatheGeometry única com o perfil inteiro. O
    perfil estava certo (prato de 2 cm de altura por 26 cm de diâmetro), mas a
    Lathe calcula NORMAIS SUAVES ao longo de todo o perfil: as quinas do prato
    somem no sombreado e a peça lê como uma cúpula gorda, por mais achatada que
    seja de fato. Um cilindro tem quinas duras de fábrica e resolve; a haste
    continua torneada, que é onde a curva é real.
  */
  const haste = useMemo(() => {
    const perfil = [
      [0.062, ALTURA_PRATO],
      [0.036, ALTURA_PRATO + 0.012],
      [0.024, ALTURA_PRATO + 0.035],
      [0.019, ALTURA_PRATO + 0.08],
      [0.018, ALTURA_PRATO + 0.135],
      [0.021, ALTURA_PRATO + 0.166],
      [0.031, TOPO_PEDESTAL],
      [0, TOPO_PEDESTAL + 0.006],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    return new THREE.LatheGeometry(perfil, 40);
  }, []);

  return (
    <group>
      {/* Prato da base: levemente cônico (mais largo embaixo), quinas vivas. */}
      <mesh position={[0, ALTURA_PRATO / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.118, 0.132, ALTURA_PRATO, 48]} />
        <meshStandardMaterial color={PRETO} roughness={0.45} metalness={0.05} />
      </mesh>

      <mesh geometry={haste} castShadow receiveShadow>
        <meshStandardMaterial color={PRETO} roughness={0.45} metalness={0.05} />
      </mesh>

      {/*
        Conjunto que inclina: esfera, aro e pinos giram juntos em torno do
        centro da esfera, senão o aro deixaria de encaixar nos polos.
      */}
      <group position={[0, CENTRO_ESFERA, 0]} rotation={[0, 0, INCLINACAO_EIXO]}>
        {/*
          A esfera gira em torno do PRÓPRIO eixo (já inclinado, por ser filha
          deste grupo) — como um globo de verdade. O ângulo põe as Américas de
          frente pra câmera: é o lado do mapa que interessa num convite de
          casamento no Brasil.
        */}
        <mesh rotation={[0, -1.2, 0]} castShadow receiveShadow>
          <sphereGeometry args={[RAIO_ESFERA, 48, 32]} />
          {/* Brilho alto: o globo da referência é plástico envernizado, e é o
              reflexo comprido nele que denuncia a curvatura. */}
          <meshStandardMaterial map={textura} roughness={0.26} metalness={0.04} />
        </mesh>

        {/*
          Meio-arco. O torus com arc=π nasce no plano XY indo de (R,0) a
          (-R,0) por cima; girar -90° em Z põe as duas pontas nos polos
          (±Y) e faz a barriga do arco sair pro lado, que é como o aro de um
          globo de mesa passa.

          scale em Z alarga a seção: o aro é uma FITA chata, não um arame.
        */}
        <mesh rotation={[0, ARO_GIRO, -Math.PI / 2]} scale={[1, 1, 2.2]} castShadow>
          <torusGeometry args={[RAIO_ARCO, 0.005, 10, 48, Math.PI]} />
          <meshStandardMaterial color={PRETO} roughness={0.28} metalness={0.1} />
        </mesh>

        {/* Pinos do eixo, ligando a esfera ao aro nos dois polos. */}
        {[1, -1].map((lado) => (
          <mesh key={lado} position={[0, lado * (RAIO_ESFERA + 0.01), 0]} castShadow>
            <cylinderGeometry args={[0.006, 0.006, 0.024, 10]} />
            <meshStandardMaterial color={PRETO} roughness={0.28} metalness={0.15} />
          </mesh>
        ))}

        {/* Ponteira no alto do aro, como na foto. */}
        <mesh position={[0, RAIO_ARCO + 0.014, 0]} castShadow>
          <coneGeometry args={[0.011, 0.03, 12]} />
          <meshStandardMaterial color={PRETO} roughness={0.28} metalness={0.1} />
        </mesh>
      </group>
    </group>
  );
}
