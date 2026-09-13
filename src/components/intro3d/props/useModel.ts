"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const BASE = "/3d/models";

/**
 * Carrega um modelo GLTF baixado do Poly Haven e devolve uma cópia própria,
 * pronta pra ser posta na cena.
 *
 * Duas coisas que o useGLTF cru NÃO faz e que precisam ser feitas aqui:
 *
 * 1. CLONAR. useGLTF cacheia por URL e devolve sempre o MESMO objeto. Pôr o
 *    resultado em dois <primitive> diferentes não desenha duas cópias: o
 *    segundo <primitive> rouba o nó do primeiro (um objeto Three só pode ter
 *    um pai), e o primeiro simplesmente some. A planta é usada duas vezes na
 *    cena, então isso é obrigatório.
 *
 * 2. LIGAR SOMBRA. Os meshes vêm com castShadow/receiveShadow em false. Sem
 *    percorrer a árvore ligando os dois, o objeto flutua sem sombra de
 *    contato — exatamente o que denuncia colagem digital numa cena que, no
 *    resto, tem sombras longas de fim de tarde.
 */
export function useModel(id: string) {
  const { scene } = useGLTF(`${BASE}/${id}/${id}.gltf`);

  return useMemo(() => {
    const copia = scene.clone(true);
    copia.traverse((no) => {
      if ((no as THREE.Mesh).isMesh) {
        no.castShadow = true;
        no.receiveShadow = true;
      }
    });
    return copia;
  }, [scene]);
}
