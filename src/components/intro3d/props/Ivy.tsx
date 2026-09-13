"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { getLeafGeometry } from "../geometry/leafGeometry";
import { criarRamos, distribuirFolhas } from "../geometry/ivyPath";

/**
 * A hera que contorna a moldura da janela — o elemento mais reconhecível da
 * foto de referência, junto com o pisca-pisca que corre por dentro dela.
 *
 * ORÇAMENTO: 2 ramos × 450 folhas = 900, num ÚNICO InstancedMesh (1 draw call
 * + 1 no passe de sombra) e ~8 mil triângulos. A densidade de ~45 folhas por
 * metro linear por ramo é o que lê como hera cheia; abaixo disso vira galho
 * com folhas.
 *
 * Legibilidade: no enquadramento herói (2,85 m, FOV 38, 900 px de altura) a
 * escala é ~460 px/m, então uma folha de 6 cm dá ~28 px. Lê como folha.
 */

/**
 * Cinco verdes: dois amarelados pras folhas que pegam sol pelo vidro, três
 * profundos pras que ficam na sombra da parede.
 *
 * A variação por instância (`instanceColor`, que o meshStandardMaterial
 * multiplica pela cor do material) é o ganho visual mais barato desta cena:
 * novecentas folhas do MESMO verde leem como uma mancha só, por melhor que
 * seja a geometria.
 */
const TONS = [0x9ab35c, 0x84a04e, 0x5f7a3c, 0x4b6634, 0x3d5730];

export function Ivy() {
  const folhasRef = useRef<THREE.InstancedMesh>(null);
  const ramos = useMemo(() => criarRamos(), []);
  const geometriaFolha = useMemo(() => getLeafGeometry(), []);

  const folhas = useMemo(
    () => ramos.flatMap((ramo, i) => distribuirFolhas(ramo, 450, 7000 + i * 131)),
    [ramos]
  );

  const caules = useMemo(
    () => ramos.map((ramo) => new THREE.TubeGeometry(ramo, 220, 0.008, 4, true)),
    [ramos]
  );

  useLayoutEffect(() => {
    const malha = folhasRef.current;
    if (!malha) return;

    const m = new THREE.Matrix4();
    const escala = new THREE.Vector3();
    const cor = new THREE.Color();

    folhas.forEach((f, i) => {
      escala.setScalar(f.escala);
      malha.setMatrixAt(i, m.compose(f.posicao, f.quaternion, escala));
      cor.setHex(TONS[f.tom % TONS.length]);
      malha.setColorAt(i, cor);
    });

    malha.instanceMatrix.needsUpdate = true;
    if (malha.instanceColor) malha.instanceColor.needsUpdate = true;
    /*
      Obrigatório. Preencher as matrizes com setMatrixAt não recalcula o
      boundingSphere, que fica com o raio de UMA folha centrado na origem do
      objeto — e a hera inteira desaparece por frustum culling assim que essa
      origem sai do quadro.
    */
    malha.computeBoundingSphere();
  }, [folhas]);

  return (
    <group>
      <instancedMesh
        ref={folhasRef}
        args={[geometriaFolha, undefined, folhas.length]}
        castShadow
        receiveShadow
      >
        {/*
          side DoubleSide porque a folha é uma casca aberta e metade delas fica
          com a face de trás voltada pra câmera. transparent fica FALSE — é o
          ponto todo de desenhar a silhueta em geometria.
        */}
        <meshStandardMaterial side={THREE.DoubleSide} roughness={0.72} metalness={0} />
      </instancedMesh>

      {caules.map((geo, i) => (
        <mesh key={i} geometry={geo} castShadow receiveShadow>
          <meshStandardMaterial color={0x4a5638} roughness={0.85} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}
