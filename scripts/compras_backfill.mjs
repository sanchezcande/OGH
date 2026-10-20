/**
 * Carga en la tabla `compras` las ventas que pasaron ANTES de que el ping las anotara
 * (20/10/2026). Hasta entonces la única lista de compradores vivía en Gumroad y en
 * `Personal Brand/tracker/gumroad_compras.json`, bajada a mano.
 *
 * Es idempotente: cada fila vieja entra con un `venta_id` armado
 * ("historico-<mail>-<fecha>-ok|dev"), así el índice único la frena si se corre dos veces. El
 * "ok|dev" del final no es decoración: Jorge compró y le devolvieron la plata el mismo día con el
 * mismo mail, y sin eso las dos filas chocaban y su compra se perdía.
 *
 *   cd OGH && npx vercel env pull .env.local
 *   node scripts/compras_backfill.mjs
 */
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const OGH = join(AQUI, "..");
const COMPRAS = join(OGH, "..", "Personal Brand", "tracker", "gumroad_compras.json");

async function cargarEnv() {
  const txt = await readFile(join(OGH, ".env.local"), "utf8");
  for (const linea of txt.split("\n")) {
    if (!linea.includes("=") || linea.trim().startsWith("#")) continue;
    const k = linea.slice(0, linea.indexOf("=")).trim();
    const v = linea.slice(linea.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
    if (!(k in process.env)) process.env[k] = v;
  }
}

/** "13.50 a month" → { precio: 13.5, recurrencia: "a month" } */
function partirPrecio(txt) {
  const m = String(txt || "").match(/^([\d.]+)\s*(.*)$/);
  if (!m) return { precio: null, recurrencia: null };
  return { precio: Number(m[1]), recurrencia: m[2].trim() || null };
}

async function main() {
  await cargarEnv();
  const { sql } = await import("@vercel/postgres");
  const { asegurarTablaCompras } = await import("../lib/compras.js");
  await asegurarTablaCompras();
  const ventas = JSON.parse(await readFile(COMPRAS, "utf8"));
  let puestas = 0;
  for (const v of ventas) {
    const email = String(v.email || "").toLowerCase().trim();
    if (!email) continue;
    const { rows } = await sql`
      SELECT nombre, pais, origen, como_llegaste FROM red_devs WHERE lower(email) = ${email} LIMIT 1`;
    const f = rows[0] || {};
    const { precio, recurrencia } = partirPrecio(v.precio);
    const r = await sql`
      INSERT INTO compras (email, nombre, producto, precio, moneda, recurrencia, baja,
                           origen, como_llego, pais, venta_id, creado)
      VALUES (${email}, ${v.nombre || f.nombre || null}, 'Acelerador de Carrera Tech',
              ${precio}, 'usd', ${recurrencia}, ${Boolean(v.devuelto)},
              ${f.origen || null}, ${f.como_llegaste || null}, ${f.pais || null},
              ${`historico-${email}-${v.fecha}-${v.devuelto ? "dev" : "ok"}`}, ${v.fecha})
      ON CONFLICT (venta_id) WHERE venta_id IS NOT NULL DO NOTHING
      RETURNING id`;
    if (r.rows.length) puestas++;
  }
  console.log(`${puestas} compras nuevas cargadas (de ${ventas.length} en el archivo)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
