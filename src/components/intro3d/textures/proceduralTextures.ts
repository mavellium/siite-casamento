import * as THREE from "three";

/*
  Texturas 100% geradas por código (canvas → THREE.CanvasTexture), sem
  nenhum arquivo de imagem — mesmo padrão já usado em
  BookMesh.tsx/createRadialShadowTexture. Determinístico (mesmo seed
  sempre dá o mesmo resultado) pra não variar entre servidor/cliente nem
  entre re-renders.
*/

/** PRNG determinístico simples (mulberry32) — Math.random() daria um resultado diferente a cada render. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Grão de madeira: linhas horizontais onduladas em tons ligeiramente mais
 * claros/escuros que a cor base, imitando veios de madeira. Usada como
 * `map` (textura de cor) em superfícies de madeira — mesa, chão, estantes,
 * prancheta — repetida via `texture.repeat`.
 */
export function createWoodGrainTexture(baseColorHex: number, seed = 1): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const base = new THREE.Color(baseColorHex);
    ctx.fillStyle = `#${base.getHexString()}`;
    ctx.fillRect(0, 0, size, size);

    const rand = mulberry32(seed);
    const lineCount = 22;
    for (let i = 0; i < lineCount; i++) {
      const y = (i / lineCount) * size + (rand() - 0.5) * 6;
      const shade = base.clone().offsetHSL(0, 0, (rand() - 0.5) * 0.12);
      ctx.strokeStyle = `rgba(${Math.round(shade.r * 255)}, ${Math.round(shade.g * 255)}, ${Math.round(shade.b * 255)}, ${0.35 + rand() * 0.3})`;
      ctx.lineWidth = 1 + rand() * 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= size; x += 16) {
        ctx.lineTo(x, y + Math.sin(x * 0.05 + i) * 4 + (rand() - 0.5) * 3);
      }
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

/*
  createNoiseRoughnessTexture (ruído cinza pra roughnessMap) morava aqui e
  saiu: paredes e tecidos passaram a usar o relevo real dos conjuntos PBR do
  Poly Haven (ver usePbrMaterial), e ela ficou sem nenhum consumidor.
*/
