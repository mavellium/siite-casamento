import * as THREE from "three";

/**
 * Geometria de uma folha de hera: contorno de três lóbulos, com uma dobra
 * central.
 *
 * SEM TEXTURA COM ALPHA, de propósito. Um card com recorte por alpha exigiria
 * ou ordenação de transparência (com ~900 folhas, custo e artefato garantidos)
 * ou alpha test (serrilhado nas bordas). A silhueta desenhada em geometria
 * resolve as duas coisas: `transparent: false`, zero ordenação, e a borda sai
 * anti-serrilhada pelo próprio MSAA/renderização normal.
 *
 * A DOBRA é o detalhe que não parece importar e é. Novecentos planos
 * perfeitamente lisos pegam a luz todos com a mesma intensidade, e a massa de
 * folhas vira um decalque chapado. Com o vinco central, cada folha tem duas
 * faces em ângulos ligeiramente diferentes e a hera ganha variação de luz
 * dentro de si mesma.
 *
 * Memoizada em escopo de módulo: é a MESMA geometria para todas as instâncias
 * (o que varia é a matriz e a cor de cada uma), então criá-la mais de uma vez
 * seria desperdício puro.
 */

let cache: THREE.BufferGeometry | null = null;

export function getLeafGeometry(): THREE.BufferGeometry {
  if (cache) return cache;

  const shape = new THREE.Shape();
  /*
    Contorno em meia-folha espelhada. Os números são proporções de uma folha de
    hera: mais larga do que alta, com o lóbulo central mais comprido que os
    laterais e um recorte fundo entre eles.
  */
  shape.moveTo(0, -0.5); // pecíolo
  shape.bezierCurveTo(0.12, -0.42, 0.2, -0.3, 0.26, -0.16);
  shape.lineTo(0.5, -0.05); // ponta do lóbulo direito
  shape.bezierCurveTo(0.42, 0.06, 0.3, 0.1, 0.22, 0.12);
  shape.lineTo(0.1, 0.5); // ponta do lóbulo central
  shape.lineTo(-0.1, 0.5);
  shape.lineTo(-0.22, 0.12);
  shape.bezierCurveTo(-0.3, 0.1, -0.42, 0.06, -0.5, -0.05);
  shape.lineTo(-0.26, -0.16);
  shape.bezierCurveTo(-0.2, -0.3, -0.12, -0.42, 0, -0.5);

  const geometry = new THREE.ShapeGeometry(shape, 4);

  // Vinco central: levanta os vértices em Z proporcionalmente à proximidade do
  // eixo da folha. Amplitude de ~8% da largura — o suficiente pra quebrar a
  // uniformidade sem a folha virar um canudo.
  const pos = geometry.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const proximidadeDoEixo = Math.max(0, 1 - Math.abs(x) / 0.5);
    const aoLongo = 0.5 + 0.5 * Math.cos((y + 0.5) * Math.PI);
    pos.setZ(i, proximidadeDoEixo * aoLongo * 0.08);
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();

  cache = geometry;
  return geometry;
}
