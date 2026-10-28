// La tabla de compras, aparte de lib/db.js a propósito: db.js importa lib/dm/linkFormulario sin
// extensión (eso lo resuelve el bundler de Next, no `node` a secas), y los scripts de
// scripts/*.mjs corren con node suelto. Si la DDL viviera ahí, el backfill no podría crear la
// tabla y la definición terminaría copiada en dos lugares.
import { sql } from "@vercel/postgres";

/** El código de 100% que se crea por cada pago en pesos (pages/api/mp-webhook.js), de un solo uso. Vive acá
 *  y no en el webhook para que el ping de Gumroad lo reconozca como un pago y no como un acceso regalado
 *  (29/10: con su código propio, a quien pagó en pesos no se le ofrecía el 1 a 1). */
export const codigoDePesos = (id) => `PESOS${String(id).replace(/\D/g, "").slice(-9)}`;
export const esCodigoDePesos = (codigo) => /^pesos\d+$/i.test(String(codigo || ""));

/** Las compras de Gumroad. Hasta el 20/10/2026 una venta solo existía en Gumroad y en el aviso
 *  de Telegram, así que para saber quién compró y de dónde salió había que abrir Gumroad a mano.
 *  Guarda el origen tal como estaba el día de la venta: el lead se puede editar después y para
 *  medir sirve la foto del momento. */
export async function asegurarTablaCompras() {
  await sql`
    CREATE TABLE IF NOT EXISTS compras (
      id          SERIAL PRIMARY KEY,
      email       TEXT NOT NULL,
      nombre      TEXT,
      producto    TEXT,
      precio      NUMERIC,
      moneda      TEXT,
      recurrencia TEXT,
      baja        BOOLEAN NOT NULL DEFAULT FALSE,
      origen      TEXT,
      como_llego  TEXT,
      pais        TEXT,
      codigo      TEXT,
      venta_id    TEXT,
      creado      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
  // Gumroad puede mandar el mismo ping dos veces (reintento tras un timeout nuestro). Con el id
  // de la venta no se duplica; una devolución llega con otro id y entra como fila aparte.
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS compras_venta_idx ON compras (venta_id) WHERE venta_id IS NOT NULL`;
  // La tabla ya existía sin esta columna (22/10): Cande preguntó "qué código además" y no se podía
  // contestar porque el código no se guardaba en ningún lado.
  await sql`ALTER TABLE compras ADD COLUMN IF NOT EXISTS codigo TEXT`;
}
