"use client";

import * as THREE from "three";
import { EXTERIOR } from "../palette";
import { mulberry32 } from "../geometry/random";

/**
 * Céu de fim de tarde desenhado em canvas: gradiente vertical (azul em cima →
 * dourado no meio → quase branco no horizonte) com bancos de nuvens iluminadas
 * por baixo.
 *
 * É textura procedural, e não uma foto, por uma razão concreta: um panorama
 * fotográfico visto por um vão estreito é esticado ~5× na aproximação (o vão
 * subtende ~50° de um equirect, ou seja ~290 px de fonte para ~1400 px de
 * tela) e vira mingau. Aqui o gradiente é liso por natureza — ampliar não
 * revela pixel — e as nuvens são desenhadas grandes o bastante para aguentar
 * o zoom.
 *
 * O PRNG é determinístico (mesma semente = mesmo céu) porque render de
 * servidor e de cliente precisam bater, e porque um céu que muda a cada
 * re-render seria impossível de calibrar.
 */

const hex = (n: number) => `#${n.toString(16).padStart(6, "0")}`;

/**
 * @param semente Muda o arranjo das nuvens sem mexer nas cores.
 *
 * A textura é mapeada numa esfera invertida (ver WindowView), então a largura
 * cobre 360° e a altura 180°. 1024×512 é suficiente: o conteúdo é todo de
 * baixa frequência.
 */
export function createSkyTexture(semente = 7): THREE.CanvasTexture {
  const largura = 1024;
  const altura = 512;
  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Sem contexto 2D para gerar o céu");

  /*
    O gradiente ocupa só a metade de cima (o zênite fica em v=0 e o horizonte
    em v=0.5, porque a esfera cobre 180° na vertical). A metade de baixo é o
    "chão" do céu, que nunca aparece pela janela mas precisa existir pra não
    ficar preta se vazar.
  */
  const grad = ctx.createLinearGradient(0, 0, 0, altura);
  grad.addColorStop(0.0, hex(EXTERIOR.ceuAlto));
  grad.addColorStop(0.28, hex(EXTERIOR.ceuAlto));
  grad.addColorStop(0.42, hex(EXTERIOR.ceuMeio));
  grad.addColorStop(0.5, hex(EXTERIOR.ceuHorizonte));
  grad.addColorStop(0.56, hex(EXTERIOR.campo));
  grad.addColorStop(1.0, hex(EXTERIOR.campo));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, largura, altura);

  /*
    Nuvens: elipses borradas empilhadas em bancos horizontais. Ficam entre
    v=0.18 e v=0.46 — céu médio-baixo, que é onde a janela enquadra.

    globalAlpha baixo com muitas passadas em vez de poucas opacas: é o que dá
    a borda macia e irregular de nuvem de fim de tarde. Nuvem com contorno
    definido lê como mancha.
  */
  const rnd = mulberry32(semente);
  ctx.filter = "blur(12px)";
  for (let banco = 0; banco < 7; banco++) {
    const baseY = altura * (0.18 + rnd() * 0.28);
    const baseX = rnd() * largura;
    const escala = 0.6 + rnd() * 1.1;
    // Quanto mais baixa a nuvem, mais dourada por baixo.
    const quente = baseY / altura > 0.34;
    ctx.fillStyle = quente ? hex(EXTERIOR.nuvem) : "#ffffff";

    for (let i = 0; i < 14; i++) {
      const rx = (30 + rnd() * 90) * escala;
      const ry = (8 + rnd() * 18) * escala;
      const x = baseX + (rnd() - 0.5) * 260 * escala;
      const y = baseY + (rnd() - 0.5) * 34 * escala;
      ctx.globalAlpha = 0.1 + rnd() * 0.16;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      // Repete deslocado de uma volta inteira, senão a emenda em x=0 aparece
      // como uma costura vertical no céu.
      ctx.beginPath();
      ctx.ellipse(x - largura, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + largura, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  ctx.filter = "none";

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}
