// La fila de los recordatorios de llamada (23/11/2026). Tabla aparte de las de lib/dm/base.js y
// creada acá mismo, como dm_comentarios: esto no depende de tablas() ni toca la memoria del agente.
//
// Lo que no puede pasar es mandarle dos veces el mismo recordatorio a la misma persona, así que la
// anotación va ANTES del envío (igual que en lib/dm/comentariosBase.js): tomar() pasa la fila a
// "mandando" y si otra corrida ya la tomó no devuelve nada. Si la función se corta justo después de
// mandar, la fila queda en "mandando" y nadie la vuelve a tomar.
import { sql } from "@vercel/postgres";

let lista = false;

export async function tablaRecordatorios() {
  if (lista) return;
  await sql`
    CREATE TABLE IF NOT EXISTS recordatorios_llamada (
      uid      TEXT PRIMARY KEY,        -- el id del evento en la agenda de Google
      nombre   TEXT,
      usuario  TEXT,                    -- su usuario de Instagram, en minúscula y sin arroba
      contacto TEXT,                    -- el id del contacto en dm_contactos, cuando se lo encontró
      cuando   TIMESTAMPTZ NOT NULL,    -- cuándo arranca la llamada
      mandar_a TIMESTAMPTZ NOT NULL,    -- cuándo sale el recordatorio (una hora antes)
      link     TEXT,                    -- el Meet de la reserva
      -- pendiente | mandando (constancia de que iba a salir) | mandado | sin_usuario | sin_contacto
      -- | tarde (la llamada ya era) | error
      estado   TEXT NOT NULL DEFAULT 'pendiente',
      detalle  TEXT,
      mandado  TIMESTAMPTZ,
      creado   TIMESTAMPTZ DEFAULT NOW())`;
  lista = true;
}

/**
 * Carga o actualiza una reserva. Si la llamada se movió de hora, se mueve el recordatorio; si ya
 * salió, no se vuelve a tocar (la fila con estado "mandado" se deja como está).
 */
export async function guardarReserva({ uid, nombre, usuario, cuando, mandarA, link }) {
  await tablaRecordatorios();
  const r = await sql`
    INSERT INTO recordatorios_llamada (uid, nombre, usuario, cuando, mandar_a, link)
    VALUES (${uid}, ${nombre || null}, ${usuario || null}, ${cuando}, ${mandarA}, ${link || null})
    ON CONFLICT (uid) DO UPDATE SET
      nombre = EXCLUDED.nombre,
      usuario = COALESCE(EXCLUDED.usuario, recordatorios_llamada.usuario),
      cuando = EXCLUDED.cuando,
      mandar_a = EXCLUDED.mandar_a,
      link = EXCLUDED.link
    WHERE recordatorios_llamada.estado IN ('pendiente', 'sin_usuario', 'sin_contacto', 'error')
    RETURNING uid`;
  return r.rowCount > 0;
}

/** Los que ya les toca y todavía no salieron. */
export async function paraMandar(limite = 10) {
  await tablaRecordatorios();
  const r = await sql`
    SELECT uid, nombre, usuario, cuando, mandar_a, link
    FROM recordatorios_llamada
    WHERE estado IN ('pendiente', 'sin_contacto') AND mandar_a <= NOW() AND cuando > NOW()
    ORDER BY cuando ASC LIMIT ${limite}`;
  return r.rows;
}

/** Toma la fila para esta corrida. false si otra ya la tomó o si ya no está pendiente. */
export async function tomar(uid) {
  const r = await sql`
    UPDATE recordatorios_llamada SET estado = 'mandando'
    WHERE uid = ${uid} AND estado IN ('pendiente', 'sin_contacto') RETURNING uid`;
  return r.rowCount > 0;
}

export async function marcar(uid, estado, detalle = null, contacto = null) {
  await sql`
    UPDATE recordatorios_llamada
    SET estado = ${estado}, detalle = ${detalle ? String(detalle).slice(0, 300) : null},
        contacto = COALESCE(${contacto}, contacto),
        mandado = ${estado === "mandado" ? new Date().toISOString() : null}
    WHERE uid = ${uid}`;
}

/** Las que se pasaron de hora sin salir, para que no queden colgadas. */
export async function vencer() {
  await tablaRecordatorios();
  const r = await sql`
    UPDATE recordatorios_llamada SET estado = 'tarde'
    WHERE estado IN ('pendiente', 'sin_contacto') AND cuando <= NOW() RETURNING uid`;
  return r.rowCount;
}

/** El contacto del agente que es esa persona en Instagram, por su usuario. null si no está. */
export async function contactoPorUsuario(usuario) {
  const r = await sql`
    SELECT id FROM dm_contactos WHERE LOWER(ig_usuario) = ${String(usuario).toLowerCase()} LIMIT 2`;
  return r.rowCount === 1 ? r.rows[0].id : null;
}

/** Borra lo que ya pasó hace más de 30 días. */
export async function borrarViejos() {
  await sql`DELETE FROM recordatorios_llamada WHERE cuando < NOW() - INTERVAL '30 days'`;
}
