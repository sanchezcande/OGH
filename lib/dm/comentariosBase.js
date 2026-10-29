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

/** Cuántos comentarios hay por estado (para la respuesta del cron y el dashboard). */
export async function contarComentarios() {
  const { rows } = await sql`SELECT estado, COUNT(*)::int AS n FROM dm_comentarios GROUP BY estado`;
  return Object.fromEntries(rows.map((r) => [r.estado, r.n]));
}
