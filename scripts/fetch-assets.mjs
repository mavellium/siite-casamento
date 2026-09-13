/**
 * Baixa os assets CC0 do Poly Haven para public/3d/.
 *
 *   node scripts/fetch-assets.mjs --dry   → só relata o que baixaria e o peso
 *   node scripts/fetch-assets.mjs         → baixa de fato
 *
 * Idempotente: pula arquivo que já existe com o md5 certo. Node puro, sem
 * dependência nova (fetch e crypto são nativos).
 *
 * Os arquivos baixados SÃO versionados no git de propósito — o deploy monta
 * a partir do repositório, então ignorá-los quebraria a cena em produção.
 */

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { HDRIS, MODELS, TEXTURES, TEXTURE_MAPS } from "./assets-manifest.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "3d");
const API = "https://api.polyhaven.com/files/";
const DRY = process.argv.includes("--dry");

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

async function api(id) {
  const res = await fetch(API + id);
  if (!res.ok) throw new Error(`API ${res.status} para "${id}"`);
  return res.json();
}

/** Já temos este arquivo, íntegro? (md5 confere) */
async function jaTemos(destino, md5) {
  if (!existsSync(destino)) return false;
  if (!md5) return true;
  const hash = createHash("md5").update(await readFile(destino)).digest("hex");
  return hash === md5;
}

async function baixar(url, destino, md5) {
  if (await jaTemos(destino, md5)) return { pulado: true, bytes: 0 };
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status}: ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (md5) {
    const hash = createHash("md5").update(buf).digest("hex");
    if (hash !== md5) throw new Error(`md5 divergente em ${destino}`);
  }
  await mkdir(dirname(destino), { recursive: true });
  await writeFile(destino, buf);
  return { pulado: false, bytes: buf.length };
}

/** Cada textura vira public/3d/textures/<id>/<mapa>.jpg */
async function planoTextura(entrada) {
  const dados = await api(entrada.id);
  const itens = [];
  for (const mapa of TEXTURE_MAPS) {
    const arquivo = dados[mapa]?.["1k"]?.jpg;
    if (!arquivo) {
      console.warn(`  ! "${entrada.id}" não tem mapa "${mapa}" em 1k/jpg — seguindo sem ele`);
      continue;
    }
    itens.push({
      url: arquivo.url,
      md5: arquivo.md5,
      bytes: arquivo.size,
      destino: join(OUT, "textures", entrada.id, `${mapa}.jpg`),
    });
  }
  return itens;
}

/** Cada HDRI vira public/3d/hdri/<id>_1k.hdr (formato .hdr, que o RGBELoader do three lê). */
async function planoHdri(entrada) {
  const dados = await api(entrada.id);
  const arquivo = dados.hdri?.["1k"]?.hdr;
  if (!arquivo) {
    const disponiveis = Object.keys(dados.hdri ?? {}).join(", ") || "nenhuma";
    throw new Error(`"${entrada.id}" não publica hdr em 1k (resoluções: ${disponiveis})`);
  }
  return [
    {
      url: arquivo.url,
      md5: arquivo.md5,
      bytes: arquivo.size,
      destino: join(OUT, "hdri", `${entrada.id}_1k.hdr`),
    },
  ];
}

/**
 * Cada modelo vira public/3d/models/<id>/... — o .gltf referencia o .bin e as
 * texturas por caminho relativo, então a estrutura de pastas do "include" tem
 * que ser preservada exatamente.
 */
async function planoModelo(entrada) {
  const dados = await api(entrada.id);

  // Nem todo modelo publica todas as resoluções; alguns não publicam gltf
  // nenhum. Preferimos 1k e só descemos se não houver.
  const resolucao = ["1k", "2k", "4k"].find((r) => dados.gltf?.[r]?.gltf);
  if (!resolucao) {
    const disponiveis = Object.keys(dados.gltf ?? {}).join(", ") || "nenhuma";
    throw new Error(`"${entrada.id}" não publica gltf (resoluções: ${disponiveis})`);
  }
  if (resolucao !== "1k") {
    console.warn(`  ! "${entrada.id}" não tem 1k — usando ${resolucao}`);
  }
  const gltf = dados.gltf[resolucao].gltf;

  const base = join(OUT, "models", entrada.id);
  const itens = [
    {
      url: gltf.url,
      md5: gltf.md5,
      bytes: gltf.size,
      destino: join(base, `${entrada.id}.gltf`),
    },
  ];
  for (const [caminhoRelativo, info] of Object.entries(gltf.include ?? {})) {
    itens.push({
      url: info.url,
      md5: info.md5,
      bytes: info.size,
      destino: join(base, ...caminhoRelativo.split("/")),
    });
  }
  return itens;
}

async function main() {
  console.log(DRY ? "== SIMULAÇÃO (nada será gravado) ==\n" : "== BAIXANDO ==\n");

  const grupos = [];
  for (const t of TEXTURES) {
    process.stdout.write(`textura  ${t.id} … `);
    const itens = await planoTextura(t);
    const bytes = itens.reduce((s, i) => s + i.bytes, 0);
    console.log(`${itens.length} arquivos, ${mb(bytes)}  (${t.uso})`);
    grupos.push({ nome: t.id, itens, bytes });
  }
  for (const m of MODELS) {
    process.stdout.write(`modelo   ${m.id} … `);
    const itens = await planoModelo(m);
    const bytes = itens.reduce((s, i) => s + i.bytes, 0);
    console.log(`${itens.length} arquivos, ${mb(bytes)}  (${m.uso})`);
    grupos.push({ nome: m.id, itens, bytes });
  }
  for (const h of HDRIS) {
    process.stdout.write(`hdri     ${h.id} … `);
    const itens = await planoHdri(h);
    const bytes = itens.reduce((s, i) => s + i.bytes, 0);
    console.log(`${itens.length} arquivos, ${mb(bytes)}  (${h.uso})`);
    grupos.push({ nome: h.id, itens, bytes });
  }

  const total = grupos.reduce((s, g) => s + g.bytes, 0);
  console.log(`\nTOTAL: ${grupos.reduce((s, g) => s + g.itens.length, 0)} arquivos, ${mb(total)}`);

  if (DRY) {
    console.log("\nMaiores:");
    [...grupos]
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 6)
      .forEach((g) => console.log(`  ${mb(g.bytes).padStart(9)}  ${g.nome}`));
    return;
  }

  let baixados = 0;
  let pulados = 0;
  let bytesEscritos = 0;
  for (const grupo of grupos) {
    for (const item of grupo.itens) {
      const r = await baixar(item.url, item.destino, item.md5);
      if (r.pulado) pulados += 1;
      else {
        baixados += 1;
        bytesEscritos += r.bytes;
      }
    }
    console.log(`ok  ${grupo.nome}`);
  }

  await writeFile(
    join(OUT, "CREDITS.md"),
    [
      "# Assets 3D",
      "",
      "Todos os modelos e texturas em `public/3d/` vêm do [Poly Haven](https://polyhaven.com)",
      "e são **CC0 / domínio público** — uso livre, inclusive comercial, sem exigência de",
      "atribuição. O registro abaixo existe por transparência, não por obrigação legal.",
      "",
      "Baixados em resolução 1k por `scripts/fetch-assets.mjs`.",
      "",
      "## Texturas",
      ...TEXTURES.map((t) => `- \`${t.id}\` — ${t.uso}`),
      "",
      "## Modelos",
      ...MODELS.map((m) => `- \`${m.id}\` — ${m.uso}`),
      "",
      "## HDRIs",
      ...HDRIS.map((h) => `- \`${h.id}\` — ${h.uso}`),
      "",
    ].join("\n"),
    "utf8"
  );

  console.log(`\n${baixados} baixados (${mb(bytesEscritos)}), ${pulados} já existiam.`);
  console.log("CREDITS.md gravado.");
}

main().catch((e) => {
  console.error("\nFALHOU:", e.message);
  process.exit(1);
});
