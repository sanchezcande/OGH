// La constancia de los comentarios ya contestados (30/10).
//
// Lo que no puede pasar es contestar dos veces. El 30/10 un envío a mano sin anotar casi hizo que
// el cron repitiera el mensaje, así que acá la anotación va ANTES del envío: tomarComentario mete
// la fila y si ya estaba no devuelve nada. Si la función se corta justo después de mandar, el
// comentario queda en "enviando" y nadie lo vuelve a tomar: peor que un lead sin respuesta es un
// lead con la misma respuesta dos veces.
//
// Tabla aparte de las de lib/dm/base.js y creada acá mismo (como dm_telegram_vistos): así esto no
// depende de tablas() ni toca la memoria del agente.
import { sql } from "@vercel/postgres";

let lista = false;

/** Crea la tabla la primera vez. Dos funciones a la vez no se pisan (IF NOT EXISTS). */
export async function tablaComentarios() {
  if (lista) return;
  await sql`
    CREATE TABLE IF NOT EXISTS dm_comentarios (
      id       TEXT PRIMARY KEY,                 -- el id del comentario en Instagram
      medio    TEXT,                             -- el post o reel donde está
      usuario  TEXT,                             -- quién comentó (su usuario de Instagram)
      -- enviando (constancia de que iba a salir) | enviada | vencido (pasaron los 7 días)
      -- ya_contestado (Instagram no deja dos private replies al mismo comentario)
      -- sin_aceptar (el DM quedaría en una solicitud que Cande no aceptó) | error
      -- ya_tenia (no se mandó: buscando su charla se vio que ya le habían contestado)
      -- en_duda (buscando su charla no se pudo saber: se vuelve a buscar pasadas DUDA_HORAS)
      estado   TEXT NOT NULL DEFAULT 'enviando',
      detalle  TEXT,
      ig_id    TEXT,                             -- el id de la persona, que devuelve el envío
      creado   TIMESTAMPTZ DEFAULT NOW(),
      enviado  TIMESTAMPTZ)`;
  lista = true;
}

/**
 * Toma el comentario para contestarlo: devuelve true si es nuestro y false si ya lo tenía alguien
 * (otra vuelta, otra función, o ya se contestó). Queda en "enviando" hasta que se sepa cómo salió.
 */
export async function tomarComentario(id, { medio = null, usuario = null } = {}) {
  const { rows } = await sql`
    INSERT INTO dm_comentarios (id, medio, usuario) VALUES (${String(id)}, ${medio}, ${usuario})
    ON CONFLICT (id) DO NOTHING RETURNING id`;
  return rows.length > 0;
}

/** Cómo salió: "enviada", "vencido", "ya_contestado", "sin_aceptar" o "error". */
export async function anotarComentario(id, estado, { detalle = null, igId = null } = {}) {
  await sql`
    UPDATE dm_comentarios
    SET estado = ${estado}, detalle = ${detalle ? String(detalle).slice(0, 300) : null},
        ig_id = COALESCE(${igId}, ig_id), enviado = NOW()
    WHERE id = ${String(id)}`;
}

/**
 * Suelta un comentario tomado que no se llegó a intentar (se cortó la vuelta antes de mandar): así
 * lo agarra la vuelta siguiente. Solo si sigue en "enviando": uno que ya salió no se suelta nunca.
 */
export async function soltarComentario(id) {
  await sql`DELETE FROM dm_comentarios WHERE id = ${String(id)} AND estado = 'enviando'`;
}

/** Cada cuánto se vuelve a buscar la charla de un comentario que quedó en duda. */
export const DUDA_HORAS = 6;

/**
 * De estos comentarios, los que ya están en la base: esos no se vuelven a mirar. Menos los que quedaron
 * en duda hace más de DUDA_HORAS: a esos les toca otra búsqueda (la ventana de 7 días da para varias).
 */
export async function comentariosEnLaBase(ids) {
  if (!ids?.length) return [];
  const { rows } = await sql`
    SELECT id FROM dm_comentarios
    WHERE id = ANY(${ids.map(String)}::text[])
      AND NOT (estado = 'en_duda' AND enviado < NOW() - make_interval(hours => ${DUDA_HORAS}::int))`;
  return rows.map((r) => r.id);
}

/**
 * Anota un comentario que ya tenía su respuesta de otro lado (ManyChat, el agente o Cande), cuando eso
 * se averiguó buscando su charla de a una: así la vuelta siguiente no lo vuelve a buscar. Si ya
 * estaba en la base no se toca.
 */
export async function anotarYaContestado(id, { medio = null, usuario = null } = {}) {
  await sql`
    INSERT INTO dm_comentarios (id, medio, usuario, estado, enviado) VALUES (${String(id)}, ${medio}, ${usuario}, 'ya_tenia', NOW())
    ON CONFLICT (id) DO NOTHING`;
}

/**
 * Anota que buscando la charla de este comentario no se pudo saber si ya le contestaron (Instagram
 * falló, o la charla tiene más mensajes del lead de los que se leen). Así las vueltas siguientes no
 * gastan en él la búsqueda de a una, y pasadas DUDA_HORAS se vuelve a buscar. Uno que ya tiene otro
 * estado no se toca.
 */
export async function anotarEnDuda(id, { medio = null, usuario = null } = {}) {
  await sql`
    INSERT INTO dm_comentarios (id, medio, usuario, estado, enviado) VALUES (${String(id)}, ${medio}, ${usuario}, 'en_duda', NOW())
    ON CONFLICT (id) DO UPDATE SET enviado = NOW() WHERE dm_comentarios.estado = 'en_duda'`;
}

/**
 * Borra la duda de un comentario que, buscando de nuevo, resultó sin contestar: así tomarComentario lo
 * puede tomar. Solo si sigue "en_duda": nada que haya salido se borra.
 */
export async function soltarDuda(id) {
  await sql`DELETE FROM dm_comentarios WHERE id = ${String(id)} AND estado = 'en_duda'`;
}

/**
 * Los usuarios (en minúscula) que ya tienen su DM de CV por algún comentario: salió, estaba saliendo,
 * o Instagram dijo que ese comentario ya tenía su private reply. Al que comenta CV otra vez, en otro
 * reel, no se le manda de nuevo.
 */
export async function usuariosConDm() {
  const { rows } = await sql`
    SELECT DISTINCT LOWER(usuario) AS usuario FROM dm_comentarios
    WHERE usuario IS NOT NULL AND estado IN ('enviada', 'enviando', 'ya_contestado')`;
  return rows.map((r) => r.usuario);
}

/** Cuántos comentarios hay por estado (para la respuesta del cron y el dashboard). */
export async function contarComentarios() {
  const { rows } = await sql`SELECT estado, COUNT(*)::int AS n FROM dm_comentarios GROUP BY estado`;
  return Object.fromEntries(rows.map((r) => [r.estado, r.n]));
}
