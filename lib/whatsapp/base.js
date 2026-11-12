// La bandeja de WhatsApp: las charlas del número de la empresa, en Neon.
//
// POR QUÉ UNA TABLA PROPIA Y NO dm_contactos/dm_mensajes CON UN CAMPO DE CANAL
// ---------------------------------------------------------------------------
// Se miró primero reusar las tablas del agente de DM (lib/dm/base.js) con una columna `canal`. No
// se hizo, por tres motivos, y el primero es el que decide:
//
//  1. Ninguna de las consultas de lib/dm/base.js filtra por canal, y son unas cien, más los crons
//     que viven de ellas: los toques (reclamarToque), el resumen de las notas, sinContestar, la
//     red de la bandeja, el controlador, borrarViejas. Con una columna nueva, CADA una tendría que
//     aprender a saltear las filas de WhatsApp, y la que quedara sin aprender haría algo peor que
//     un error: el agente le escribiría por Instagram a un número de teléfono, o le mandaría un
//     seguimiento de venta a alguien que dejó el teléfono para que le recordaran una llamada. El
//     costo de olvidarse un WHERE es un mensaje a una persona real, y eso no se puede desarmar.
//
//  2. La identidad es otra. En dm_contactos el id es el contacto de ManyChat o el de Instagram, y
//     alrededor hay ig_usuario, ig_id, ig_id_mc, ig_buscado, previo_ig, alta_por. Acá la identidad
//     es un número de teléfono y nada de eso aplica: serían diez columnas siempre vacías.
//
//  3. La regla de las 24 horas es distinta. En Instagram es blanda (si se pasa, Cande contesta
//     desde la app). En WhatsApp Meta la hace cumplir: fuera de la ventana rechaza el mensaje
//     (131047) y la única salida es una plantilla aprobada, que del lado de los DM no existe.
//
// Lo que se pierde: la charla de alguien que habla por los dos canales queda en dos lados. Se
// acepta, porque hoy son dos charlas distintas (el DM es la puerta de entrada; WhatsApp, solo los
// recordatorios de la llamada y el seguimiento de después), y el día que haga falta juntarlas se
// pueden cruzar por el teléfono sin tocar nada de lo de arriba.
//
// Acá tampoco hay agente: por WhatsApp no redacta nadie. Lo que sale lo escribe Cande en Telegram
// y sale tal cual (lib/whatsapp/respuestas.js). Por eso no hay estado del modelo, ni toques, ni
// prompt: nada de eso tiene sentido en este canal.
import { sql } from "@vercel/postgres";

export const hayBase = () => Boolean(process.env.POSTGRES_URL);

let lista = false;
export async function tablas() {
  if (lista) return;
  await sql`
    CREATE TABLE IF NOT EXISTS wa_contactos (
      telefono    TEXT PRIMARY KEY,                      -- solo dígitos, con código de país, como lo manda Meta
      nombre      TEXT,                                  -- el del perfil de WhatsApp, si lo trae el aviso
      ultimo_lead TIMESTAMPTZ,                           -- lo último que escribió: de acá se cuentan las 24 horas
      creado      TIMESTAMPTZ DEFAULT NOW(),
      actualizado TIMESTAMPTZ DEFAULT NOW())`;
  await sql`
    CREATE TABLE IF NOT EXISTS wa_mensajes (
      id       SERIAL PRIMARY KEY,
      telefono TEXT NOT NULL,
      quien    TEXT NOT NULL,                            -- lead | cande | sistema
      texto    TEXT NOT NULL,
      -- El id que le da WhatsApp al mensaje (wamid...), único: así un reintento de Meta no guarda
      -- dos veces lo mismo ni avisa dos veces. Vacío solo si no se supo (un envío incierto).
      wa_mid   TEXT UNIQUE,
      creado   TIMESTAMPTZ DEFAULT NOW())`;
  await sql`CREATE INDEX IF NOT EXISTS wa_mensajes_telefono_idx ON wa_mensajes (telefono, id)`;
  lista = true;
}

/** La charla de ese número, o null. */
export async function contacto(telefono) {
  const { rows } = await sql`SELECT * FROM wa_contactos WHERE telefono = ${String(telefono)}`;
  return rows[0] || null;
}

/**
 * Deja al día la charla con lo que acaba de escribir la persona: el nombre del perfil si vino, y
 * la hora de su último mensaje, que es de donde se cuenta la ventana de 24 horas.
 *
 * Va ANTES de reclamar el mensaje, a propósito: es idempotente (correrla dos veces deja lo mismo),
 * así que si la función se corta en el medio la ventana queda bien y Cande puede contestar. Al
 * revés, un mensaje reclamado con la ventana sin mover le diría que no puede contestar cuando sí.
 *
 * La hora nunca va para atrás (GREATEST): un reintento de Meta con un mensaje viejo no puede
 * cerrarle la ventana a una charla que siguió.
 */
export async function alDia({ telefono, nombre = null, creado = null }) {
  const { rows } = await sql`
    INSERT INTO wa_contactos (telefono, nombre, ultimo_lead)
    VALUES (${String(telefono)}, ${nombre}, COALESCE(${creado}, NOW()))
    ON CONFLICT (telefono) DO UPDATE SET
      nombre = COALESCE(EXCLUDED.nombre, wa_contactos.nombre),
      ultimo_lead = GREATEST(wa_contactos.ultimo_lead, EXCLUDED.ultimo_lead),
      actualizado = NOW()
    RETURNING *`;
  return rows[0] || null;
}

/**
 * Guarda lo que escribió la persona y lo reclama de una sola vez: devuelve true si este mensaje es
 * nuevo y false si ya estaba (un reintento de Meta). El aviso a Telegram sale solo con true, así
 * que un reintento no le avisa dos veces de lo mismo.
 */
export async function reclamarEntrante({ telefono, texto, waMid, creado = null }) {
  const { rowCount } = await sql`
    INSERT INTO wa_mensajes (telefono, quien, texto, wa_mid, creado)
    VALUES (${String(telefono)}, 'lead', ${String(texto)}, ${String(waMid)}, COALESCE(${creado}, NOW()))
    ON CONFLICT (wa_mid) DO NOTHING`;
  return rowCount > 0;
}

/** Lo que mandó Cande, para que quede en la charla. `waMid` vacío si el envío no lo devolvió. */
export async function anotarDeCande({ telefono, texto, waMid = null }) {
  await sql`
    INSERT INTO wa_mensajes (telefono, quien, texto, wa_mid)
    VALUES (${String(telefono)}, 'cande', ${String(texto)}, ${waMid})
    ON CONFLICT (wa_mid) DO NOTHING`;
}

/** Una nota del sistema en la charla (lo que no escribió nadie: un envío que no salió, un aviso). */
export async function anotarSistema({ telefono, texto }) {
  await sql`INSERT INTO wa_mensajes (telefono, quien, texto) VALUES (${String(telefono)}, 'sistema', ${String(texto)})`;
}

/** Los últimos mensajes de una charla, del más viejo al más nuevo. */
export async function historial(telefono, tope = 40) {
  const { rows } = await sql`
    SELECT quien, texto, creado FROM wa_mensajes WHERE telefono = ${String(telefono)}
    ORDER BY id DESC LIMIT ${Math.max(1, Math.min(200, Number(tope) || 40))}`;
  return rows.reverse();
}
