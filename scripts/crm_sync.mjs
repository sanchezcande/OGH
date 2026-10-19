/**
 * Trae los leads de devs y founders desde Postgres para el CRM del dashboard
 * (Personal Brand/tracker). Solo lectura: nunca escribe en la base, solo
 * genera crm_devs.json y crm_founders.json que el dashboard sirve como
 * archivos estáticos, igual que yt_metrics.json o top5.json.
 *
 *   cd OGH && npx vercel env pull .env.local     # trae POSTGRES_URL
 *   node scripts/crm_sync.mjs
 *
 * Lo dispara /api/crm-sync del server.py del tracker (botón "🔄 actualizar"
 * en la pestaña CRM), y de paso el cron diario.
 */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { FASES_A_TRAER, contarEmbudo, marcarLeads } from "./crm_embudo.mjs";
import { leerDevs } from "./crm_ig.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url));
const OGH = join(AQUI, "..");
const TRACKER = join(OGH, "..", "Personal Brand", "tracker");

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

  // Con la charla de Instagram de la que vino cada uno (ig_contacto, ig_usuario, ig_dueno, ig_compartido):
  // así Cande ve quién ya habla con el agente antes de llamarlo por WhatsApp. Ver crm_ig.mjs: si el cruce
  // falla, los devs salen igual y lo de la charla queda como estaba en el archivo anterior.
  const anterior = await readFile(join(TRACKER, "crm_devs.json"), "utf8")
    .then((t) => JSON.parse(t).leads || [])
    .catch(() => []);
  const { devs } = await leerDevs(sql, { anterior });

  // Los eventos del embudo, crudos. Quién tocó comprar, qué versión del video le tocó y los
  // números por día se cuentan en crm_embudo.mjs (ahí está por qué no alcanza con el SQL).
  // Sin catch: si la consulta falla, mejor no escribir nada que dejar a todos sin "tocó comprar".
  const { rows: eventos } = await sql`
    SELECT fase, sid, creado FROM funnel_eventos
    WHERE fase = ANY(${FASES_A_TRAER}) AND sid IS NOT NULL`;
  // Los que tocaron comprar son los de más alta intención: van primero en la lista para llamar.
  marcarLeads(devs, eventos);
  const embudo = contarEmbudo(eventos);

  // El WhatsApp se lee por to_jsonb: la columna la crea /api/preguntas-lead recién con el primer
  // founder que lo deja, y pedirla de nombre antes de eso hacía fallar la consulta entera. Si la
  // consulta falla igual, no se pisa crm_founders.json con una lista vacía: queda el último bueno.
  const founders = await sql`
    SELECT id, nombre, email, to_jsonb(l) ->> 'whatsapp' AS whatsapp, origen, creado
    FROM leads_preguntas l ORDER BY creado DESC`
    .then((r) => r.rows)
    .catch((e) => { console.error("crm_sync: no pude leer los founders:", e.message); return null; });

  await writeFile(join(TRACKER, "crm_devs.json"),
    JSON.stringify({ actualizado: new Date().toISOString(), leads: devs,
                     embudo }, null, 1));
  if (founders) {
    await writeFile(join(TRACKER, "crm_founders.json"),
      JSON.stringify({ actualizado: new Date().toISOString(), leads: founders }, null, 1));
  }

  console.log(`OK · ${devs.length} devs · ${founders ? founders.length : "sin cambios en los"} founders`);
}

main().catch((e) => { console.error("crm_sync:", e.message); process.exit(1); });
