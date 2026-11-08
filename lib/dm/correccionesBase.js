// Las correcciones que Cande manda por Telegram (lib/dm/correcciones.js), en su propia tabla (como dm_comentarios):
// no depende de tablas() ni toca la memoria del agente.
//
// Lo que ella manda seguido es una sola corrección: una captura y enseguida "wtf", o un álbum de tres capturas, llegan
// como novedades sueltas. El cerebro las retira juntas recién cuando pasaron ESPERA_SEGUNDOS desde lo último que mandó
// (tomarCorreccion), así no corrige con la mitad de lo que quería decir. Juntas solo las que llegaron seguidas (menos de
// ESPERA_SEGUNDOS entre una y otra), de una misma charla, y un "deshacé" va siempre solo (revisión del 09/11: con el
// cerebro caído un rato, todo lo que mandó salía pegado como una sola corrección).
import { sql } from "@vercel/postgres";

export const ESPERA_SEGUNDOS = 45;
/** Si el cerebro la tomó y no contestó en este tiempo (se reinició, se cortó), vuelve a quedar para tomar. */
export const TOMADA_VENCE_MINUTOS = 20;
/** A la tercera vez que se toma sin terminar, se da por perdida y se le avisa a Cande (no da vueltas para siempre). */
export const MAX_INTENTOS = 3;

let lista = false;

export async function tablaCorrecciones() {
  if (lista) return;
  await sql`
    CREATE TABLE IF NOT EXISTS dm_correcciones (
      id          SERIAL PRIMARY KEY,
      update_id   BIGINT UNIQUE NOT NULL,           -- la novedad de Telegram: un reintento no la guarda dos veces
      mensaje_id  BIGINT,                           -- el mensaje de Cande, para contestarle como respuesta
      grupo       TEXT,                             -- el álbum de Telegram (media_group_id), si mandó varias juntas
      texto       TEXT,
      fotos       JSONB NOT NULL DEFAULT '[]',      -- file_id de Telegram (se bajan de a una: correccion_foto)
      contacto    TEXT,                             -- si respondió el aviso de una charla
      respondiendo TEXT,                            -- lo que le había contestado el bot, si siguió esa corrección
      responde_a  BIGINT,                           -- el mensaje del bot que respondió (para sumar esa corrección)
      respuesta_id BIGINT,                          -- el mensaje con el que el bot le contestó esta corrección
      deshacer    BOOLEAN NOT NULL DEFAULT FALSE,
      -- nueva | tomada | hecha | error | deshecha (una hecha cuyo cambio se volvió atrás)
      estado      TEXT NOT NULL DEFAULT 'nueva',
      tomada_en   TIMESTAMPTZ,
      intentos    INTEGER NOT NULL DEFAULT 0,
      lote        INTEGER,                          -- el id de la primera de las que se retiraron juntas
      resultado   JSONB,                            -- lo que hizo el cerebro (cambios, para deshacer)
      creado      TIMESTAMPTZ DEFAULT NOW())`;
  lista = true;
}

/**
 * Guarda la corrección. { nueva, primera }: nueva si esa novedad no estaba (Telegram reintenta), primera si no había otra
 * parte de esta tanda esperando antes que ella (para contestar "lo miro" una sola vez). En una sola sentencia: si dos
 * partes llegan a la vez, la primera seguro contesta; en el peor caso contestan las dos.
 */
export async function guardarCorreccion(c) {
  await tablaCorrecciones();
  const { rows } = await sql`
    WITH nueva AS (
      INSERT INTO dm_correcciones (update_id, mensaje_id, grupo, texto, fotos, contacto, respondiendo, responde_a, deshacer)
      VALUES (${c.updateId}, ${c.mensajeId}, ${c.grupo}, ${c.texto || null}, ${JSON.stringify(c.fotos || [])}, ${c.contacto},
              ${c.respondiendo}, ${c.respondeA ?? null}, ${Boolean(c.deshacer)})
      ON CONFLICT (update_id) DO NOTHING
      RETURNING id)
    SELECT id, (SELECT COUNT(*)::int FROM dm_correcciones d
                WHERE d.estado = 'nueva' AND d.creado > NOW() - make_interval(secs => ${ESPERA_SEGUNDOS * 2}::int)) AS antes
    FROM nueva`;
  return { nueva: rows.length > 0, primera: rows.length > 0 && (rows[0].antes || 0) === 0 };
}

/**
 * Las primeras filas de la fila que van juntas: seguidas (menos de ESPERA_SEGUNDOS entre una y otra), sin dos charlas
 * distintas, y un deshacer solo. `filas` ordenadas por id. Pura, para probarla sin base.
 */
export function tanda(filas, espera = ESPERA_SEGUNDOS) {
  if (!filas.length) return [];
  if (filas[0].deshacer) return [filas[0]];
  const out = [filas[0]];
  let contacto = filas[0].contacto || null;
  for (const f of filas.slice(1)) {
    const hueco = new Date(f.creado).getTime() - new Date(out.at(-1).creado).getTime();
    if (f.deshacer || hueco > espera * 1000) break;
    if (f.contacto && contacto && f.contacto !== contacto) break;
    contacto = contacto || f.contacto || null;
    out.push(f);
  }
  return out;
}

/**
 * Retira la próxima corrección, si ya pasaron ESPERA_SEGUNDOS desde la última parte de su tanda (si no, null: todavía
 * puede estar escribiendo). Lo que quedó tomado y sin contestar más de TOMADA_VENCE_MINUTOS vuelve a la fila, y lo que ya
 * se tomó MAX_INTENTOS veces queda como error (perdidas: para avisarle). Devuelve { correccion, perdidas }.
 * La corrección: { lote, ids, mensajeId, texto, fotos (file_id), contacto, respondiendo, deshacer, anterior } donde
 * anterior es la corrección que ella siguió respondiendo al bot ({ contacto, fotos, resultado }), si hay.
 */
export async function tomarCorreccion() {
  await tablaCorrecciones();
  await sql`
    UPDATE dm_correcciones SET estado = 'nueva', tomada_en = NULL, lote = NULL
    WHERE estado = 'tomada' AND tomada_en < NOW() - make_interval(mins => ${TOMADA_VENCE_MINUTOS}::int)`;
  const { rows: perdidas } = await sql`
    UPDATE dm_correcciones SET estado = 'error', resultado = '{"error": "se tomó varias veces sin terminar"}'::jsonb
    WHERE estado = 'nueva' AND intentos >= ${MAX_INTENTOS}
    RETURNING id, mensaje_id`;
  const { rows: filas } = await sql`
    SELECT id, mensaje_id, texto, fotos, contacto, respondiendo, responde_a, deshacer, creado
    FROM dm_correcciones WHERE estado = 'nueva' ORDER BY id LIMIT 50`;
  const t = tanda(filas);
  if (!t.length || new Date(t.at(-1).creado).getTime() > Date.now() - ESPERA_SEGUNDOS * 1000) {
    return { correccion: null, perdidas };
  }
  const desde = t[0].id;
  const hasta = t.at(-1).id;
  const { rows } = await sql`
    UPDATE dm_correcciones SET estado = 'tomada', tomada_en = NOW(), lote = ${desde}, intentos = intentos + 1
    WHERE estado = 'nueva' AND id BETWEEN ${desde} AND ${hasta}
    RETURNING id`;
  if (!rows.length) return { correccion: null, perdidas }; // la tomó otra vuelta
  const tomadas = t.filter((f) => rows.some((r) => r.id === f.id));
  const respondeA = tomadas.map((f) => f.responde_a).find((x) => x != null);
  let anterior = null;
  if (respondeA != null) {
    const { rows: a } = await sql`
      SELECT contacto, fotos, resultado FROM dm_correcciones WHERE respuesta_id = ${respondeA} AND id = lote LIMIT 1`;
    if (a[0]) anterior = { contacto: a[0].contacto || a[0].resultado?.contacto || null, fotos: a[0].fotos || [], resultado: a[0].resultado };
  }
  return {
    perdidas,
    correccion: {
      lote: desde,
      ids: tomadas.map((f) => f.id),
      mensajeId: tomadas[0].mensaje_id ? Number(tomadas[0].mensaje_id) : null,
      texto: tomadas.map((f) => f.texto).filter(Boolean).join("\n"),
      fotos: tomadas.flatMap((f) => (Array.isArray(f.fotos) ? f.fotos : [])),
      contacto: tomadas.map((f) => f.contacto).find(Boolean) || anterior?.contacto || null,
      respondiendo: tomadas.map((f) => f.respondiendo).find(Boolean) || null,
      deshacer: tomadas.length === 1 && tomadas[0].deshacer,
      anterior,
    },
  };
}

/**
 * Los file_id de las capturas de una corrección tomada (para bajarlas de a una). Si no trae y sigue otra corrección
 * (respondió lo que le había contestado el bot), las de esa.
 */
export async function fotosDelLote(lote) {
  await tablaCorrecciones();
  const { rows } = await sql`
    SELECT fotos, responde_a FROM dm_correcciones WHERE lote = ${lote} AND estado = 'tomada' ORDER BY id`;
  const propias = rows.flatMap((r) => (Array.isArray(r.fotos) ? r.fotos : []));
  const respondeA = rows.map((r) => r.responde_a).find((x) => x != null);
  if (propias.length || respondeA == null) return propias;
  const { rows: todas } = await sql`
    SELECT d.fotos FROM dm_correcciones d
    WHERE d.lote = (SELECT lote FROM dm_correcciones WHERE respuesta_id = ${respondeA} AND id = lote LIMIT 1) ORDER BY d.id`;
  return todas.flatMap((r) => (Array.isArray(r.fotos) ? r.fotos : []));
}

/** Cierra la corrección (todas las del lote) con lo que hizo el cerebro y el mensaje con el que el bot le contestó. */
export async function terminarCorreccion(lote, { estado, resultado, respuestaId = null }) {
  await tablaCorrecciones();
  await sql`
    UPDATE dm_correcciones SET estado = ${estado}, resultado = ${JSON.stringify(resultado || null)}, respuesta_id = ${respuestaId}
    WHERE lote = ${lote} AND estado = 'tomada'`;
}

/** La última corrección que cambió algo y no se deshizo: lo que "deshacé" vuelve atrás. */
export async function ultimaConCambios() {
  await tablaCorrecciones();
  const { rows } = await sql`
    SELECT lote, resultado FROM dm_correcciones
    WHERE estado = 'hecha' AND resultado ? 'cambios_aplicados' AND id = lote
    ORDER BY id DESC LIMIT 1`;
  return rows[0] || null;
}

export async function marcarDeshecha(lote) {
  await tablaCorrecciones();
  await sql`UPDATE dm_correcciones SET estado = 'deshecha' WHERE lote = ${lote} AND estado = 'hecha'`;
}

/**
 * La charla de la que habla la corrección, para que el cerebro la lea: por el contacto o por el usuario de Instagram
 * (sin @, sin mayúsculas). Los últimos mensajes, las últimas salidas del agente con su motivo, y el estado. null si no
 * está en la base.
 */
export async function charlaParaCorregir({ contacto = null, usuario = null }) {
  const u = String(usuario || "").trim().replace(/^@/, "").toLowerCase();
  const { rows } = contacto
    ? await sql`SELECT id, nombre, ig_usuario, dueno, estado FROM dm_contactos WHERE id = ${String(contacto)} LIMIT 1`
    : u
      ? await sql`
          SELECT id, nombre, ig_usuario, dueno, estado FROM dm_contactos
          WHERE LOWER(ig_usuario) = ${u} OR LOWER(ig_usuario_borrado) = ${u}
          ORDER BY actualizado DESC NULLS LAST LIMIT 1`
      : { rows: [] };
  const c = rows[0];
  if (!c) return null;
  const { rows: mensajes } = await sql`
    SELECT id, quien, texto, creado FROM dm_mensajes WHERE contacto = ${c.id} ORDER BY id DESC LIMIT 60`;
  const { rows: salidas } = await sql`
    SELECT id, accion, estado, motivo, mensajes, creado FROM dm_salidas WHERE contacto = ${c.id} ORDER BY id DESC LIMIT 15`;
  return { contacto: c, mensajes: mensajes.reverse(), salidas: salidas.reverse() };
}
