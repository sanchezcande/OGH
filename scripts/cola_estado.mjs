/**
 * Imprime en JSON las filas de cola_publicaciones que ya salieron (estado='ok'),
 * para que el tracker las pueda reflejar en su propio estado (pubSched + lo que
 * decide "cuál sigue": platLog, carPosted, carCross, liDone).
 *
 * Hasta el 24/09/2026 esto no existía: la cola en la nube publicaba de verdad,
 * pero nada le avisaba al dashboard local, así que seguía ofreciendo como
 * "pendiente de hoy" algo que ya había salido ayer. Se detectó y se parchó a
 * mano 4 veces seguidas (YouTube, dos LinkedIn, un carrusel de Instagram) antes
 * de armar este puente. Lo corre server.py cada tanto (ver _sync_cola_nube).
 *
 *   node scripts/cola_estado.mjs
 */
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const OGH = join(AQUI, "..");

async function cargarEnv() {
  const strip = (s) => s.replace(/^["']|["']$/g, "");
  const txt = await readFile(join(OGH, ".env.local"), "utf8");
  for (const linea of txt.split("\n")) {
    if (!linea.includes("=") || linea.trim().startsWith("#")) continue;
    const k = linea.slice(0, linea.indexOf("=")).trim();
    const v = strip(linea.slice(linea.indexOf("=") + 1).trim());
    if (!(k in process.env)) process.env[k] = v;
  }
}

async function main() {
  await cargarEnv();
  const { sql } = await import("@vercel/postgres");
  const { rows } = await sql`
    SELECT red, item, cuando, resultado FROM cola_publicaciones WHERE estado = 'ok'`;
  console.log(JSON.stringify(rows));
}

main().catch((e) => { console.error("cola_estado:", e.message); process.exit(1); });
