"use client";

import { useMemo } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

/**
 * Carrega um conjunto PBR baixado do Poly Haven (ver scripts/assets-manifest.mjs)
 * e devolve props prontas pra <meshStandardMaterial {...props} />.
 *
 * Três armadilhas que este módulo existe pra resolver:
 *
 * 1. ESPAÇO DE COR. O mapa de cor (Diffuse) é gravado em sRGB; os mapas de
 *    dado (normal, AO, rugosidade, metalness) são lineares. O three NÃO
 *    adivinha: se o Diffuse não for marcado como SRGBColorSpace ele entra
 *    como linear e a textura sai lavada e clara demais. Nenhuma textura do
 *    projeto marcava isso — era um bug de gama latente em todas.
 *
 * 2. CACHE COMPARTILHADO. useTexture cacheia por URL, então duas chamadas
 *    para o mesmo arquivo devolvem O MESMO objeto THREE.Texture. Mexer em
 *    .repeat de um uso mudaria o outro junto, à distância. Por isso cada
 *    chamada clona antes de configurar.
 *
 * 3. ARM. O Poly Haven empacota três mapas num arquivo só: AO no canal R,
 *    Roughness no G, Metalness no B. O three lê o canal certo sozinho quando
 *    o mesmo mapa é atribuído a aoMap/roughnessMap/metalnessMap.
 */

export type PbrOptions = {
  /** Quantas vezes o padrão se repete em U e V. Alto demais vira estampa; baixo demais borra. */
  repeat?: [number, number];
  /** Rotação do padrão em radianos — quebra a repetição óbvia entre superfícies vizinhas. */
  rotation?: number;
  /** Intensidade do relevo. 1 = como veio; abaixo disso alisa. */
  normalScale?: number;
  /**
   * Descarta o mapa de cor e devolve só relevo + rugosidade/AO, deixando a
   * cor por conta do `color` do material.
   *
   * Existe porque tingir um Diffuse colorido com `color` MULTIPLICA as duas
   * cores em vez de substituir. A parede lilás com o clay_plaster (cuja
   * argila é terracota) saiu marrom: lilás × terracota = marrom. Quando o que
   * se quer da textura é a superfície, não o pigmento, esta é a opção certa.
   */
  semCor?: boolean;
};

const BASE = "/3d/textures";

/**
 * @param id Pasta em public/3d/textures (ex.: "fine_grained_wood").
 */
export function usePbrMaterial(id: string, options: PbrOptions = {}) {
  const { repeat = [1, 1], rotation = 0, normalScale = 1, semCor = false } = options;

  const carregadas = useTexture({
    map: `${BASE}/${id}/Diffuse.jpg`,
    normalMap: `${BASE}/${id}/nor_gl.jpg`,
    armMap: `${BASE}/${id}/arm.jpg`,
  });

  const [repeatU, repeatV] = repeat;

  return useMemo(() => {
    // Clonar antes de configurar: ver armadilha 2 no topo do arquivo.
    const map = carregadas.map.clone();
    const normalMap = carregadas.normalMap.clone();
    const armMap = carregadas.armMap.clone();

    // Só o mapa de cor é sRGB. Os outros carregam números, não cor.
    map.colorSpace = THREE.SRGBColorSpace;
    normalMap.colorSpace = THREE.NoColorSpace;
    armMap.colorSpace = THREE.NoColorSpace;

    for (const t of [map, normalMap, armMap]) {
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(repeatU, repeatV);
      if (rotation) {
        // A rotação gira em torno de (0,0) por padrão, o que desloca o
        // padrão pra fora; centralizar mantém ele no lugar.
        t.center.set(0.5, 0.5);
        t.rotation = rotation;
      }
      t.anisotropy = 8;
      // clone() copia os parâmetros mas não marca a textura pra reenvio à
      // GPU; sem isso as mudanças acima só valeriam no primeiro uso.
      t.needsUpdate = true;
    }

    return {
      // null, não undefined: se o material já tiver um map de um render
      // anterior, undefined é ignorado pelo reconciliador do R3F e a textura
      // antiga fica; null realmente apaga.
      map: semCor ? null : map,
      normalMap,
      normalScale: new THREE.Vector2(normalScale, normalScale),
      aoMap: armMap,
      roughnessMap: armMap,
      metalnessMap: armMap,
    };
  }, [carregadas, repeatU, repeatV, rotation, normalScale, semCor]);
}
