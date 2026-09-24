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

  const { rows: devs } = await sql`
    SELECT id, nombre, email, pais, rol_principal, seniority, stack, tarifa,
           cuando_arrancas, dedicacion, ingles, whatsapp, telegram, origen,
           cv_url, estado, creado
    FROM red_devs ORDER BY creado DESC`;

  // Quién de estos llegó a clickear "comprar" en la página de gracias: se cruza por
  // el evento "enviado" del funnel (mismo sid), que cae a los pocos ms de creado en
  // red_devs. Son los de más alta intención: van primero en la lista para llamar.
  const { rows: clicks } = await sql`
    SELECT DISTINCT ft.sid, ft.creado
    FROM funnel_eventos ft
    WHERE ft.fase = 'enviado'
      AND ft.sid IN (SELECT sid FROM funnel_eventos WHERE fase = 'click_gumroad')`.catch(() => ({ rows: [] }));
  for (const d of devs) {
    const creadoMs = new Date(d.creado).getTime();
    d.clickeo_comprar = clicks.some((c) => Math.abs(new Date(c.creado).getTime() - creadoMs) <= 5000);
  }

  // Números del embudo, por día (hora Argentina): cuánta gente llegó a cada paso.
  // Es lo mismo que muestra /api/funnel pero desglosado por fecha, para ver la tendencia.
  const { rows: embudoDias } = await sql`
    SELECT to_char(creado AT TIME ZONE 'America/Argentina/Buenos_Aires', 'YYYY-MM-DD') AS dia,
           count(DISTINCT sid) FILTER (WHERE fase = 'form_visto')    AS vieron,
           count(DISTINCT sid) FILTER (WHERE fase = 'enviado')       AS enviaron,
           count(DISTINCT sid) FILTER (WHERE fase = 'gracias_vista') AS video_pagina,
           count(DISTINCT sid) FILTER (WHERE fase = 'video_play')    AS play,
           count(DISTINCT sid) FILTER (WHERE fase = 'video_fin')     AS terminaron,
           count(DISTINCT sid) FILTER (WHERE fase = 'click_gumroad') AS clicks
    FROM funnel_eventos
    WHERE creado > NOW() - INTERVAL '21 days'
    GROUP BY 1 ORDER BY 1 DESC`.catch(() => ({ rows: [] }));

  const { rows: embudoTotal } = await sql`
    SELECT count(DISTINCT sid) FILTER (WHERE fase = 'form_visto')    AS vieron,
           count(DISTINCT sid) FILTER (WHERE fase = 'enviado')       AS enviaron,
           count(DISTINCT sid) FILTER (WHERE fase = 'gracias_vista') AS video_pagina,
           count(DISTINCT sid) FILTER (WHERE fase = 'video_play')    AS play,
           count(DISTINCT sid) FILTER (WHERE fase = 'video_fin')     AS terminaron,
           count(DISTINCT sid) FILTER (WHERE fase = 'click_gumroad') AS clicks
    FROM funnel_eventos`.catch(() => ({ rows: [{}] }));

  const { rows: founders } = await sql`
    SELECT id, nombre, email, origen, creado
    FROM leads_preguntas ORDER BY creado DESC`.catch(() => ({ rows: [] }));

  await writeFile(join(TRACKER, "crm_devs.json"),
    JSON.stringify({ actualizado: new Date().toISOString(), leads: devs,
                     embudo: { dias: embudoDias, total: embudoTotal[0] || {} } }, null, 1));
  await writeFile(join(TRACKER, "crm_founders.json"),
    JSON.stringify({ actualizado: new Date().toISOString(), leads: founders }, null, 1));

  console.log(`OK · ${devs.length} devs · ${founders.length} founders`);
}

main().catch((e) => { console.error("crm_sync:", e.message); process.exit(1); });
