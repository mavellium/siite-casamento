"use client";

import * as THREE from "three";
import { mulberry32 } from "../geometry/random";

/**
 * Mapa-múndi político desenhado em canvas, para a esfera do globo de mesa
 * (ver props/Globe.tsx).
 *
 * POR QUE DESENHAR e não baixar: o projeto só usa assets CC0 do Poly Haven,
 * que tem texturas de material (madeira, reboco, tecido) e nenhum mapa da
 * Terra. E o globo aparece pequeno na cena — o que precisa ler é oceano azul,
 * continentes coloridos e a grade de meridianos. Um traçado aproximado
 * resolve isso; precisão cartográfica aqui não seria vista.
 *
 * Projeção equirretangular: x = (lon+180)/360, y = (90-lat)/180. É o que a
 * SphereGeometry do three espera no UV.
 */

/** Oceano: azul-claro do globo escolar da referência. */
const OCEANO = "#8ec8e6";
/** Gelo polar. */
const GELO = "#eef4f6";

/**
 * Contornos aproximados, em [longitude, latitude]. Poucos vértices de
 * propósito: mais detalhe não sobrevive ao tamanho em que o globo aparece.
 */
const CONTINENTES: { nome: string; cor: string; pontos: [number, number][] }[] = [
  {
    nome: "América do Norte",
    cor: "#f2d98a",
    pontos: [
      [-168, 65], [-160, 71], [-130, 70], [-95, 73], [-80, 68], [-60, 60], [-52, 47],
      [-65, 45], [-70, 42], [-75, 35], [-81, 25], [-97, 26], [-105, 20], [-115, 30],
      [-125, 40], [-130, 55], [-145, 60],
    ],
  },
  {
    nome: "Groenlândia",
    cor: "#d9d8c4",
    pontos: [[-45, 60], [-20, 70], [-20, 82], [-45, 83], [-60, 78], [-55, 65]],
  },
  {
    nome: "América do Sul",
    cor: "#f0a9b8",
    pontos: [
      [-81, 8], [-75, 11], [-60, 11], [-50, 0], [-35, -5], [-38, -15], [-48, -25],
      [-58, -35], [-62, -40], [-66, -46], [-75, -53], [-75, -45], [-72, -35],
      [-71, -20], [-78, -5],
    ],
  },
  {
    nome: "África",
    cor: "#a8cf86",
    pontos: [
      [-17, 15], [-5, 5], [10, 4], [9, -1], [13, -5], [12, -17], [15, -28], [20, -35],
      [28, -33], [33, -25], [40, -15], [41, -2], [48, 5], [51, 12], [43, 12], [35, 22],
      [32, 31], [25, 32], [10, 37], [-6, 36], [-16, 22],
    ],
  },
  {
    nome: "Europa",
    cor: "#f0b98a",
    pontos: [
      [-10, 36], [0, 43], [3, 50], [-5, 58], [5, 62], [20, 70], [30, 70], [40, 66],
      [50, 60], [48, 50], [40, 45], [28, 41], [20, 40], [15, 38], [5, 37],
    ],
  },
  {
    nome: "Ásia",
    cor: "#f2d98a",
    pontos: [
      [50, 60], [60, 70], [80, 75], [100, 77], [120, 73], [140, 72], [160, 68],
      [170, 62], [160, 55], [140, 50], [135, 42], [128, 35], [122, 30], [110, 20],
      [100, 8], [95, 5], [90, 20], [80, 10], [70, 20], [62, 25], [58, 25], [50, 30],
      [45, 40], [48, 50],
    ],
  },
  {
    nome: "Oceania",
    cor: "#f0a9b8",
    pontos: [
      [113, -22], [122, -18], [130, -12], [142, -11], [150, -22], [153, -28],
      [147, -38], [138, -35], [129, -32], [115, -34],
    ],
  },
];

export function createGlobeTexture(): THREE.CanvasTexture {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Sem contexto 2D para gerar o mapa do globo");

  const px = (lon: number) => ((lon + 180) / 360) * w;
  const py = (lat: number) => ((90 - lat) / 180) * h;

  ctx.fillStyle = OCEANO;
  ctx.fillRect(0, 0, w, h);

  /*
    Calotas polares. Estreitas: numa equirretangular a faixa perto do polo se
    concentra num ponto ao ser enrolada na esfera, então uma faixa generosa
    aqui vira um disco branco enorme no topo do globo — foi o que aconteceu
    com a primeira versão (80° no norte, 62° no sul).
  */
  ctx.fillStyle = GELO;
  ctx.fillRect(0, 0, w, py(86));
  ctx.fillRect(0, py(-72), w, h - py(-72));

  const traçar = (pontos: [number, number][]) => {
    ctx.beginPath();
    pontos.forEach(([lon, lat], i) => {
      const x = px(lon);
      const y = py(lat);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
  };

  const rnd = mulberry32(1789);
  for (const c of CONTINENTES) {
    traçar(c.pontos);
    ctx.fillStyle = c.cor;
    ctx.fill();

    /*
      Divisas internas: algumas linhas cortando o continente, recortadas pelo
      próprio contorno (clip). É o que dá a leitura de mapa POLÍTICO em vez de
      mancha de cor — na referência cada país tem sua cor e seu contorno.
      Determinístico (mulberry32), senão o mapa muda a cada render.
    */
    ctx.save();
    traçar(c.pontos);
    ctx.clip();
    ctx.strokeStyle = "rgba(120,110,90,0.45)";
    ctx.lineWidth = 1.4;
    const lons = c.pontos.map((p) => p[0]);
    const lats = c.pontos.map((p) => p[1]);
    const [lon0, lon1] = [Math.min(...lons), Math.max(...lons)];
    const [lat0, lat1] = [Math.min(...lats), Math.max(...lats)];
    for (let i = 0; i < 7; i++) {
      const a: [number, number] = [lon0 + rnd() * (lon1 - lon0), lat0 + rnd() * (lat1 - lat0)];
      const b: [number, number] = [lon0 + rnd() * (lon1 - lon0), lat0 + rnd() * (lat1 - lat0)];
      ctx.beginPath();
      ctx.moveTo(px(a[0]), py(a[1]));
      ctx.lineTo(px(b[0]), py(b[1]));
      ctx.stroke();
    }
    ctx.restore();

    // Contorno da costa, por último, pra ficar por cima das divisas.
    traçar(c.pontos);
    ctx.strokeStyle = "rgba(90,110,120,0.55)";
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }

  /*
    Grade de meridianos e paralelos, por cima de tudo — num globo escolar ela
    atravessa continente e oceano igual.
  */
  ctx.strokeStyle = "rgba(255,255,255,0.42)";
  ctx.lineWidth = 1;
  for (let lon = -180; lon <= 180; lon += 15) {
    ctx.beginPath();
    ctx.moveTo(px(lon), 0);
    ctx.lineTo(px(lon), h);
    ctx.stroke();
  }
  for (let lat = -75; lat <= 75; lat += 15) {
    ctx.beginPath();
    ctx.moveTo(0, py(lat));
    ctx.lineTo(w, py(lat));
    ctx.stroke();
  }
  // Equador e Greenwich mais marcados, como na referência.
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, py(0));
  ctx.lineTo(w, py(0));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(px(0), 0);
  ctx.lineTo(px(0), h);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}
