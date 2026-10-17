// Memoria del agente de DM.
//
// ManyChat no da el historial de una charla (su API no tiene ningún método para leer
// mensajes), así que cada mensaje se guarda acá. También vive acá de quién es cada charla:
// TODO es de Cande salvo los contactos que se le dan al agente a propósito.
//
// El prompt y los ajustes también viven en la base (dm_config) y no en el código: este
// repo es público y el prompt trae la guía de voz de Cande y ejemplos de charlas reales.
import { sql } from "@vercel/postgres";

export const hayBase = () => Boolean(process.env.POSTGRES_URL);

let lista = false;
export async function tablas() {
  if (lista) return;
  await sql`
    CREATE TABLE IF NOT EXISTS dm_config (
      clave TEXT PRIMARY KEY, valor JSONB NOT NULL, actualizado TIMESTAMPTZ DEFAULT NOW())`;
  await sql`
    CREATE TABLE IF NOT EXISTS dm_contactos (
      id               TEXT PRIMARY KEY,                    -- id del contacto en ManyChat
      nombre           TEXT,
      dueno            TEXT NOT NULL DEFAULT 'cande',       -- agente | cande
      estado           JSONB NOT NULL DEFAULT '{}'::jsonb,  -- lo último que informó el modelo
      contexto         TEXT,                                -- lo que el agente tiene que saber de una charla cargada a mano
      toques           INT NOT NULL DEFAULT 0,              -- seguimientos ya mandados después de lo último que escribió
      proximo_toque    TIMESTAMPTZ,
      ultimo_lead      TIMESTAMPTZ,                         -- de acá se cuenta la ventana de 24 horas
      respondido_hasta INT NOT NULL DEFAULT 0,              -- id del último mensaje del lead ya atendido
      tomado_en        TIMESTAMPTZ,                         -- traba: una sola corrida por contacto
      tomado_por       TEXT,                                -- la marca de la corrida que tiene la traba
      alta_en          TIMESTAMPTZ,                         -- cuándo entró solo por la entrada (vacío: lo cargó Cande a mano)
      creado           TIMESTAMPTZ DEFAULT NOW(),
      actualizado      TIMESTAMPTZ DEFAULT NOW())`;
  // Columnas que se sumaron después: si la tabla ya existía, el CREATE de arriba no las agrega.
  await sql`ALTER TABLE dm_contactos ADD COLUMN IF NOT EXISTS contexto TEXT`;
  await sql`ALTER TABLE dm_contactos ADD COLUMN IF NOT EXISTS respondido_hasta INT NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE dm_contactos ADD COLUMN IF NOT EXISTS tomado_por TEXT`;
  await sql`ALTER TABLE dm_contactos ADD COLUMN IF NOT EXISTS alta_en TIMESTAMPTZ`;
  // false: entró solo y todavía no se sabe si es un lead (se le avisa a Cande recién cuando el agente lo confirma).
  // Los contactos que ya existían quedan en true: a ellos ya se les avisó al entrar.
  await sql`ALTER TABLE dm_contactos ADD COLUMN IF NOT EXISTS alta_avisada BOOLEAN NOT NULL DEFAULT true`;
  await sql`
    CREATE TABLE IF NOT EXISTS dm_mensajes (
      id SERIAL PRIMARY KEY, contacto TEXT NOT NULL,
      quien TEXT NOT NULL,                               -- lead | agente | cande | automatico | sistema
      texto TEXT NOT NULL, creado TIMESTAMPTZ DEFAULT NOW())`;
  await sql`CREATE INDEX IF NOT EXISTS dm_mensajes_contacto_idx ON dm_mensajes (contacto, id)`;
  await sql`
    CREATE TABLE IF NOT EXISTS dm_salidas (
      id SERIAL PRIMARY KEY, contacto TEXT NOT NULL, accion TEXT NOT NULL,
      mensajes JSONB NOT NULL DEFAULT '[]'::jsonb, aviso TEXT, motivo TEXT,
      -- enviando (constancia de que iba a salir) | enviada | incierta (no se sabe si salió)
      -- pendiente (ManyChat la retira) | vencida (nadie la retiró) | borrador | frenada | callo
      -- descartada (se apagó, la tomó Cande o el lead escribió antes de que saliera) | error | aviso_fallido
      estado TEXT NOT NULL DEFAULT 'pendiente',
      detalle TEXT, creado TIMESTAMPTZ DEFAULT NOW(), enviado TIMESTAMPTZ)`;
  await sql`CREATE INDEX IF NOT EXISTS dm_salidas_contacto_idx ON dm_salidas (contacto, id)`;
  lista = true;
}

/* ---------- config ---------- */

export const AJUSTES_POR_DEFECTO = {
  modo: "apagado",       // apagado | sombra (redacta y le avisa a Cande, no manda) | auto (manda)
  cerebro: "local",      // local (redacta el Claude de la Mac de Cande, ver lib/dm/cola.js) | api (la API de Anthropic, con clave)
  envio: "api",          // api (el servidor manda por la API de ManyChat) | campo (ManyChat lo retira con /api/dm/recoger)
  espera_ms: 18000,      // junta la ráfaga antes de contestar
  tope_por_dia: 12,      // turnos del agente por contacto en 24 horas (cuentan también los borradores y los que calla)
  toques: false,         // seguimientos automáticos
  aviso_ia: true,        // el primer mensaje tiene que decir que es automático, o no sale
  link_de_pago: "",      // vacío: el agente no pasa link de pago, le pasa la charla a Cande
  link_mercadopago: "",  // el de pago en pesos, para quien no maneja dólares (17/10): Cande le manda el código de acceso
  altas: false,          // quien nunca pasó por esta base y llega por la entrada pasa a ser del agente (ver recibir en agente.js)
  altas_por_dia: 25,     // tope de altas en 24 horas corridas: si en ManyChat se rompe el filtro, no entra la bandeja entera
  contexto_alta: "",     // lo que el agente tiene que saber de quien entra solo: qué le mandó el automático antes
};

// Qué valor acepta cada ajuste. Un ajuste con un valor que no es de su tipo no se guarda y,
// si ya estaba guardado, no se usa: "toques" en "off" es un texto, y un texto vale verdadero.
const VALIDO = {
  modo: (v) => ["apagado", "sombra", "auto"].includes(v),
  cerebro: (v) => ["local", "api"].includes(v),
  envio: (v) => ["api", "campo"].includes(v),
  espera_ms: (v) => Number.isInteger(v) && v >= 5000 && v <= 60000,
  tope_por_dia: (v) => Number.isInteger(v) && v >= 1 && v <= 60,
  toques: (v) => typeof v === "boolean",
  aviso_ia: (v) => typeof v === "boolean",
  link_de_pago: (v) => typeof v === "string" && (v === "" || v.startsWith("https://")),
  link_mercadopago: (v) => typeof v === "string" && (v === "" || v.startsWith("https://")),
  altas: (v) => typeof v === "boolean",
  altas_por_dia: (v) => Number.isInteger(v) && v >= 1 && v <= 200,
  contexto_alta: (v) => typeof v === "string" && v.length <= 1000,
};

/** Revisa los ajustes que alguien quiere guardar. Devuelve { ok: true, ajustes } o { ok: false, error }. */
export function validarAjustes(pedidos) {
  if (!pedidos || typeof pedidos !== "object" || Array.isArray(pedidos)) return { ok: false, error: "faltan los ajustes" };
  const nuevos = {};
  for (const [k, v] of Object.entries(pedidos)) {
    if (!Object.hasOwn(VALIDO, k)) return { ok: false, error: `ajuste desconocido: ${k}` };
    if (!VALIDO[k](v)) return { ok: false, error: `valor inválido en ${k}` };
    nuevos[k] = v;
  }
  return { ok: true, ajustes: nuevos };
}

/** Los ajustes guardados, sobre los de fábrica. Lo guardado que no es válido se ignora: un modo roto es apagado. */
export function ajustesDesde(guardados) {
  const aj = { ...AJUSTES_POR_DEFECTO };
  for (const k of Object.keys(VALIDO)) {
    if (guardados && Object.hasOwn(guardados, k) && VALIDO[k](guardados[k])) aj[k] = guardados[k];
  }
  return aj;
}

export async function leerConfig(clave) {
  const { rows } = await sql`SELECT valor FROM dm_config WHERE clave = ${clave}`;
  return rows[0]?.valor ?? null;
}

export async function guardarConfig(clave, valor) {
  await sql`
    INSERT INTO dm_config (clave, valor) VALUES (${clave}, ${JSON.stringify(valor)}::jsonb)
    ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, actualizado = NOW()`;
}

export async function ajustes() {
  return ajustesDesde(await leerConfig("ajustes"));
}

export async function prompt() {
  return (await leerConfig("prompt"))?.texto || "";
}

/** Guarda el prompt. El que estaba queda en prompt_anterior, para poder volver si el nuevo sale mal. */
export async function guardarPrompt(texto) {
  await sql`
    INSERT INTO dm_config (clave, valor)
    SELECT 'prompt_anterior', valor FROM dm_config WHERE clave = 'prompt' AND valor->>'texto' <> ${texto}
    ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, actualizado = NOW()`;
  await guardarConfig("prompt", { texto });
}

/* ---------- contactos y mensajes ---------- */

export async function contacto(id) {
  const { rows } = await sql`SELECT * FROM dm_contactos WHERE id = ${id}`;
  return rows[0] || null;
}

export async function ponerDueno(id, dueno, nombre = null) {
  await sql`
    INSERT INTO dm_contactos (id, nombre, dueno) VALUES (${id}, ${nombre}, ${dueno})
    ON CONFLICT (id) DO UPDATE
      SET dueno = EXCLUDED.dueno, nombre = COALESCE(EXCLUDED.nombre, dm_contactos.nombre),
          proximo_toque = NULL, actualizado = NOW()`;
}

/**
 * Hay lugar para dar de alta a este contacto? Devuelve cuántas altas van en las últimas 24 horas,
 * o null si no puede entrar: ya figura en la base (es de Cande, o ya es del agente) o el tope está lleno.
 */
export async function lugarParaAlta(id, tope) {
  const { rows } = await sql`
    SELECT (SELECT COUNT(*)::int FROM dm_contactos WHERE alta_en > NOW() - INTERVAL '24 hours') AS van,
           EXISTS (SELECT 1 FROM dm_contactos WHERE id = ${id}) AS figura`;
  return rows[0].figura || rows[0].van >= tope ? null : rows[0].van;
}

/**
 * Le da al agente un contacto que nunca pasó por esta base y guarda su primer mensaje. Devuelve
 * el id de ese mensaje, o null si no lo dio de alta.
 *
 * No toca a quien ya figura: una charla de Cande (la que el agente le pasó, la que ella tomó, la
 * que se borró, las que se reservaron antes de prender las altas) no vuelve sola al agente.
 * Tampoco pasa del tope: a la entrada tienen que llegar solo los contactos que ManyChat filtró
 * por etiqueta, y si ese filtro se rompe entra un puñado y no la bandeja entera. El tope puede
 * pasarse por uno o dos si entran varios a la vez.
 *
 * Es una sola sentencia: o quedan el contacto, su ventana de 24 horas abierta y el mensaje, o
 * no queda nada. Un contacto del agente sin mensaje no lo ve ni el cron.
 */
export async function darDeAlta(id, { nombre = null, texto, contexto = "", tope }) {
  const { rows } = await sql`
    WITH hoy AS (SELECT COUNT(*)::int AS n FROM dm_contactos WHERE alta_en > NOW() - INTERVAL '24 hours'),
    alta AS (
      INSERT INTO dm_contactos (id, nombre, dueno, contexto, alta_en, ultimo_lead, alta_avisada)
      SELECT ${id}::text, ${nombre}::text, 'agente', ${contexto || null}::text, NOW(), NOW(), false
      FROM hoy WHERE hoy.n < ${tope}::int
      ON CONFLICT (id) DO NOTHING
      RETURNING id)
    INSERT INTO dm_mensajes (contacto, quien, texto) SELECT id, 'lead', ${texto}::text FROM alta RETURNING id`;
  return rows[0]?.id ?? null;
}

/** Ya se le avisó a Cande que este contacto nuevo es un lead. */
export async function marcarAltaAvisada(id) {
  await sql`UPDATE dm_contactos SET alta_avisada = true WHERE id = ${id}`;
}

/**
 * Deja como de Cande, en tanda, contactos que todavía no pasaron por esta base. A quien ya figura
 * no lo toca. Se corre antes de prender las altas con todos los contactos que ya existen en
 * ManyChat: así el alta queda para quien llega después, y una charla que Cande ya lleva a mano
 * no entra sola aunque esa persona vuelva a pasar por el automático. Devuelve cuántos reservó.
 */
export async function reservar(ids) {
  const { rows } = await sql`
    WITH r AS (
      INSERT INTO dm_contactos (id, dueno)
      SELECT x, 'cande' FROM jsonb_array_elements_text(${JSON.stringify(ids)}::jsonb) AS x
      ON CONFLICT (id) DO NOTHING
      RETURNING 1)
    SELECT COUNT(*)::int AS n FROM r`;
  return rows[0].n;
}

/**
 * Anota un mensaje del lead y devuelve su id. Devuelve null, sin guardar nada, si el contacto
 * no es del agente (las charlas de Cande no pasan por esta base) o si es el mismo texto
 * repetido en segundos (reintento de ManyChat).
 *
 * Es una sola sentencia a propósito: o queda todo (el mensaje, la ventana de 24 horas que se
 * abre de nuevo y los seguimientos en cero) o no queda nada. Lo que estaba esperando retiro
 * se vence: era la respuesta a un turno que este mensaje acaba de cambiar.
 */
export async function anotarLead(id, texto, nombre = null) {
  const { rows } = await sql`
    WITH c AS (
      UPDATE dm_contactos
      SET ultimo_lead = NOW(), toques = 0, proximo_toque = NULL, nombre = COALESCE(${nombre}, nombre), actualizado = NOW()
      WHERE id = ${id} AND dueno = 'agente'
        AND NOT EXISTS (
          SELECT 1 FROM dm_mensajes
          WHERE contacto = ${id} AND quien = 'lead' AND texto = ${texto} AND creado > NOW() - INTERVAL '5 seconds')
      RETURNING id),
    v AS (
      UPDATE dm_salidas SET estado = 'vencida', detalle = 'escribió de nuevo antes del retiro'
      WHERE estado = 'pendiente' AND contacto IN (SELECT id FROM c))
    INSERT INTO dm_mensajes (contacto, quien, texto) SELECT id, 'lead', ${texto} FROM c RETURNING id`;
  return rows[0]?.id ?? null;
}

export async function anotar(id, quien, texto) {
  await sql`INSERT INTO dm_mensajes (contacto, quien, texto) VALUES (${id}, ${quien}, ${texto})`;
}

/**
 * Lo que Cande contestó desde Telegram respondiendo un aviso. Cierra el turno solo hasta lo que el
 * lead había escrito cuando salió ese aviso (`hasta`): lo que escribió después ella no lo vio, y
 * sigue abierto para el agente. (anotarAMano, en cambio, da por atendido todo.)
 * Lo último que salió es de ella: el toque que el agente tenía agendado ya no corresponde.
 */
export async function anotarDeCande(id, texto, hasta) {
  await anotar(id, "cande", texto);
  await sql`
    UPDATE dm_contactos
    SET respondido_hasta = GREATEST(respondido_hasta, COALESCE(
          (SELECT MAX(id) FROM dm_mensajes WHERE contacto = ${id} AND quien = 'lead' AND creado <= ${hasta.toISOString()}), 0)),
        proximo_toque = NULL, actualizado = NOW()
    WHERE id = ${id}`;
}

let vistosLista = false;
/** Reclama una novedad de Telegram, de una sola vez. false si ya se había visto: Telegram reintenta. */
export async function reclamarNovedad(updateId) {
  if (!vistosLista) {
    await sql`CREATE TABLE IF NOT EXISTS dm_telegram_vistos (update_id BIGINT PRIMARY KEY, creado TIMESTAMPTZ DEFAULT NOW())`;
    vistosLista = true;
  }
  const { rows } = await sql`
    INSERT INTO dm_telegram_vistos (update_id) VALUES (${updateId}) ON CONFLICT DO NOTHING RETURNING update_id`;
  return rows.length > 0;
}

/**
 * Deja constancia de algo que salió de la cuenta sin pasar por el agente: lo que Cande mandó a
 * mano ("cande") o un mensaje fijo de ManyChat ("automatico"). Lo de Cande cuenta como respuesta:
 * lo que el lead había escrito hasta ahí ya está atendido, y el toque agendado se cancela (el
 * agente no sabe qué le dijo ella: un seguimiento podría pisarla).
 */
export async function anotarAMano(id, quien, texto) {
  await anotar(id, quien, texto);
  if (quien !== "cande") return;
  await sql`
    UPDATE dm_contactos
    SET respondido_hasta = GREATEST(respondido_hasta, COALESCE(
          (SELECT MAX(id) FROM dm_mensajes WHERE contacto = ${id} AND quien = 'lead'), 0)),
        proximo_toque = NULL, actualizado = NOW()
    WHERE id = ${id}`;
}

/**
 * Carga una charla que ya existía (la que Cande llevó a mano) y se la da al agente.
 * No abre la ventana de 24 horas: ultimo_lead queda como estaba, así que el agente no puede
 * escribir hasta que el lead conteste de verdad. Los mensajes cargados quedan como ya atendidos.
 *
 * Es una sola sentencia: o quedan todos los mensajes y el contacto, o no queda nada. De a un
 * INSERT por mensaje, un corte a mitad dejaba mensajes guardados de un contacto que no es del agente.
 */
export async function sembrar(id, { nombre = null, contexto = "", mensajes }) {
  await sql`
    WITH m AS (
      INSERT INTO dm_mensajes (contacto, quien, texto)
      SELECT ${id}::text, x.m->>'quien', x.m->>'texto'
      FROM jsonb_array_elements(${JSON.stringify(mensajes)}::jsonb) WITH ORDINALITY AS x(m, n)
      ORDER BY x.n
      RETURNING id, quien)
    INSERT INTO dm_contactos (id, nombre, dueno, contexto, respondido_hasta)
    VALUES (${id}, ${nombre}, 'agente', ${contexto || null}, COALESCE((SELECT MAX(id) FROM m WHERE quien = 'lead'), 0))
    ON CONFLICT (id) DO UPDATE
      SET dueno = 'agente', nombre = COALESCE(EXCLUDED.nombre, dm_contactos.nombre), contexto = EXCLUDED.contexto,
          respondido_hasta = GREATEST(dm_contactos.respondido_hasta, EXCLUDED.respondido_hasta),
          proximo_toque = NULL, actualizado = NOW()`;
}

export async function historial(id, tope = 80) {
  const { rows } = await sql`
    SELECT id, quien, texto, creado FROM dm_mensajes WHERE contacto = ${id} ORDER BY id DESC LIMIT ${tope}`;
  return rows.reverse();
}

export async function ultimoIdLead(id) {
  const { rows } = await sql`
    SELECT id FROM dm_mensajes WHERE contacto = ${id} AND quien = 'lead' ORDER BY id DESC LIMIT 1`;
  return rows[0]?.id ?? null;
}

/** El turno queda atendido hasta ese mensaje del lead: lo que escriba después es un turno nuevo. */
export async function cerrarTurno(id, hasta) {
  await sql`UPDATE dm_contactos SET respondido_hasta = GREATEST(respondido_hasta, ${hasta}) WHERE id = ${id}`;
}

/**
 * Cuántas veces trabajó el agente para este contacto en 24 horas. Cuenta corridas y no globos:
 * una respuesta de tres mensajes es un turno, y un borrador o un turno en que calla también le
 * costaron un pedido al modelo.
 */
export async function corridasEnUnDia(id) {
  const { rows } = await sql`
    SELECT COUNT(*)::int AS n FROM dm_salidas
    WHERE contacto = ${id} AND estado NOT IN ('aviso_fallido', 'error') AND creado > NOW() - INTERVAL '24 hours'`;
  return rows[0].n;
}

/**
 * Traba por contacto: devuelve el contacto si esta corrida se la queda, o null si otra la tiene
 * o el contacto ya no es del agente. La marca dice de quién es: solo esa corrida la puede soltar.
 * Se libera sola a los 6 minutos, que es más de lo que puede vivir una función (5).
 */
export async function tomar(id, marca, { cualquierDueno = false } = {}) {
  // cualquierDueno: una indicación de Cande sobre una charla suya (lib/dm/respuestas.js).
  const { rows } = await sql`
    UPDATE dm_contactos SET tomado_en = NOW(), tomado_por = ${marca}
    WHERE id = ${id} AND (dueno = 'agente' OR ${cualquierDueno}) AND (tomado_en IS NULL OR tomado_en < NOW() - INTERVAL '6 minutes')
    RETURNING *`;
  return rows[0] || null;
}

export async function soltar(id, marca) {
  await sql`UPDATE dm_contactos SET tomado_en = NULL, tomado_por = NULL WHERE id = ${id} AND tomado_por = ${marca}`;
}

export async function guardarEstado(id, estado, proximoToque) {
  await sql`
    UPDATE dm_contactos
    SET estado = ${JSON.stringify(estado || {})}::jsonb, proximo_toque = ${proximoToque ? proximoToque.toISOString() : null},
        actualizado = NOW()
    WHERE id = ${id}`;
}

export async function sumarToque(id) {
  await sql`UPDATE dm_contactos SET toques = toques + 1, proximo_toque = NULL, actualizado = NOW() WHERE id = ${id}`;
}

/* ---------- salidas ---------- */

export async function guardarSalida({ contacto: id, accion, mensajes, aviso, motivo, estado, detalle }) {
  const { rows } = await sql`
    INSERT INTO dm_salidas (contacto, accion, mensajes, aviso, motivo, estado, detalle, enviado)
    VALUES (${id}, ${accion}, ${JSON.stringify(mensajes || [])}::jsonb, ${aviso || null}, ${motivo || null},
            ${estado}, ${detalle || null}, ${estado === "enviada" ? new Date().toISOString() : null})
    RETURNING id`;
  return rows[0].id;
}

/** Cómo terminó una salida que se había anotado antes de mandar. */
export async function marcarSalida(idSalida, estado, detalle = null) {
  await sql`
    UPDATE dm_salidas
    SET estado = ${estado}, detalle = COALESCE(${detalle}, detalle),
        enviado = COALESCE(${estado === "enviada" ? new Date().toISOString() : null}, enviado)
    WHERE id = ${idSalida}`;
}

/**
 * La salida que ManyChat todavía no retiró (modo de envío "campo"). La marca como enviada.
 * Solo sirve la última y solo si es de hace menos de 3 minutos: una respuesta más vieja ya no
 * contesta lo último que dijo el lead. El estado se pide también afuera para que dos retiros
 * al mismo tiempo no se lleven la misma respuesta.
 *
 * En la misma sentencia cierra el turno, hasta lo que el lead había escrito cuando se armó la
 * respuesta: recién al retirarla esos mensajes quedan atendidos.
 */
export async function retirarSalida(id) {
  const { rows } = await sql`
    WITH s AS (
      UPDATE dm_salidas SET estado = 'enviada', enviado = NOW()
      WHERE estado = 'pendiente'
        AND id = (SELECT id FROM dm_salidas
                  WHERE contacto = ${id} AND estado = 'pendiente' AND creado > NOW() - INTERVAL '3 minutes'
                  ORDER BY id DESC LIMIT 1)
      RETURNING contacto, accion, mensajes, creado),
    t AS (
      UPDATE dm_contactos c
      SET respondido_hasta = GREATEST(c.respondido_hasta, COALESCE(
            (SELECT MAX(m.id) FROM dm_mensajes m
             WHERE m.contacto = c.id AND m.quien = 'lead' AND m.creado <= s.creado), 0))
      FROM s WHERE c.id = s.contacto)
    SELECT accion, mensajes FROM s`;
  return rows[0] || null;
}

/** Cande tomó la charla: lo que estaba esperando retiro ya no sale. */
export async function descartarPendientes(id) {
  await sql`
    UPDATE dm_salidas SET estado = 'descartada', detalle = 'Cande tomó la charla antes del retiro'
    WHERE contacto = ${id} AND estado = 'pendiente'`;
}

/** Lo que quedó esperando retiro más de 3 minutos: se vence. Devuelve de qué contactos era, para avisarle a Cande. */
export async function vencerPendientes() {
  const { rows } = await sql`
    WITH v AS (
      UPDATE dm_salidas SET estado = 'vencida', detalle = 'ManyChat no la retiró'
      WHERE estado = 'pendiente' AND creado < NOW() - INTERVAL '3 minutes'
      RETURNING contacto)
    SELECT c.id, c.nombre FROM dm_contactos c WHERE c.id IN (SELECT contacto FROM v)`;
  return rows;
}

/* ---------- lo que corre el cron ---------- */

/**
 * Reclama un toque vencido, de a uno: lo saca de la fila antes de procesarlo, así dos corridas
 * del cron no mandan el mismo. Antes limpia los que vencieron con la ventana de 24 horas ya
 * cerrada: esos no pueden salir y, si se quedan, tapan a los que sí.
 */
export async function reclamarToque() {
  await sql`
    UPDATE dm_contactos SET proximo_toque = NULL
    WHERE proximo_toque IS NOT NULL
      AND (dueno <> 'agente' OR ultimo_lead IS NULL OR ultimo_lead <= NOW() - INTERVAL '23 hours 30 minutes')`;
  const { rows } = await sql`
    UPDATE dm_contactos SET proximo_toque = NULL, actualizado = NOW()
    WHERE id = (SELECT id FROM dm_contactos
                WHERE dueno = 'agente' AND proximo_toque IS NOT NULL AND proximo_toque <= NOW()
                ORDER BY proximo_toque ASC LIMIT 1 FOR UPDATE SKIP LOCKED)
    RETURNING id`;
  return rows[0]?.id ?? null;
}

/**
 * Charlas del agente con un mensaje del lead de hace más de 5 minutos que nadie atendió: el
 * turno sigue abierto (no hubo respuesta, borrador, freno ni nada anotado por Cande). Pasa si
 * la función murió a mitad de camino, o si el mensaje entró con el agente apagado (por eso el
 * cron la corre siempre, esté prendido o no).
 * No mira las que tienen una corrida en marcha (traba tomada hace menos de 6 minutos) ni las
 * que tienen una respuesta esperando retiro: esa cierra el turno al salir, o se vence y avisa.
 *
 * quizas_salio: hay una salida de después de su último mensaje que llegó a anotarse para mandar.
 * La función pudo morir después de mandarla y antes de cerrar el turno.
 * ultimo_id_lead, minutos (desde el primer mensaje sin atender) y fallos (intentos con error desde
 * entonces): con eso el cron decide si reintenta o se la pasa a Cande (decidirSinContestar).
 */
export async function sinContestar() {
  const { rows } = await sql`
    SELECT c.id, c.nombre,
           (SELECT MAX(u.id) FROM dm_mensajes u WHERE u.contacto = c.id AND u.quien = 'lead') AS ultimo_id_lead,
           -- desde el primer mensaje sin atender: un lead que sigue escribiendo no corre el reloj
           EXTRACT(EPOCH FROM (NOW() - p.desde)) / 60 AS minutos,
           (SELECT COUNT(*)::int FROM dm_salidas e
            WHERE e.contacto = c.id AND e.accion = 'reintento' AND e.estado = 'error' AND e.creado >= p.desde) AS fallos,
           EXISTS (
             SELECT 1 FROM dm_salidas s
             WHERE s.contacto = c.id AND s.estado IN ('enviando', 'enviada', 'incierta') AND s.creado >= c.ultimo_lead
           ) AS quizas_salio
    FROM dm_contactos c
    CROSS JOIN LATERAL (
      SELECT MIN(m0.creado) AS desde FROM dm_mensajes m0
      WHERE m0.contacto = c.id AND m0.quien = 'lead' AND m0.id > c.respondido_hasta) p
    WHERE c.dueno = 'agente'
      AND c.ultimo_lead BETWEEN NOW() - INTERVAL '23 hours' AND NOW() - INTERVAL '5 minutes'
      AND (c.tomado_en IS NULL OR c.tomado_en < NOW() - INTERVAL '6 minutes')
      AND EXISTS (
        SELECT 1 FROM dm_mensajes m WHERE m.contacto = c.id AND m.quien = 'lead' AND m.id > c.respondido_hasta)
      AND NOT EXISTS (SELECT 1 FROM dm_salidas p WHERE p.contacto = c.id AND p.estado = 'pendiente')
    ORDER BY c.ultimo_lead ASC LIMIT 20`;
  return rows;
}

/**
 * Lo que escribió un lead no se guarda para siempre: de las charlas que llevan 90 días quietas
 * se borran los mensajes y las salidas, y se vacía lo que el modelo había resumido de él.
 * Queda la fila del contacto, que es la que dice de quién es la charla.
 * Quieta es que en 90 días ni escribió el lead ni se tocó la charla: una que Cande acaba de
 * cargar a mano (sembrar no mueve ultimo_lead) no se borra.
 */
export async function borrarViejas() {
  await sql`
    WITH quietos AS (
      SELECT id FROM dm_contactos
      WHERE GREATEST(COALESCE(ultimo_lead, actualizado), actualizado) < NOW() - INTERVAL '90 days'),
    m AS (DELETE FROM dm_mensajes WHERE contacto IN (SELECT id FROM quietos)),
    s AS (DELETE FROM dm_salidas WHERE contacto IN (SELECT id FROM quietos))
    UPDATE dm_contactos SET estado = '{}'::jsonb, contexto = NULL, proximo_toque = NULL
    WHERE id IN (SELECT id FROM quietos) AND (estado <> '{}'::jsonb OR contexto IS NOT NULL)`;
}

/**
 * Borra todo lo guardado de una charla (lo pide el lead o lo decide Cande). La charla queda de Cande y vacía.
 * La fila queda siempre, también si el contacto no figuraba: es lo que impide que después entre solo por un alta.
 */
export async function borrarCharla(id) {
  const { rows } = await sql`
    WITH m AS (DELETE FROM dm_mensajes WHERE contacto = ${id} RETURNING 1),
         s AS (DELETE FROM dm_salidas WHERE contacto = ${id} RETURNING 1),
         c AS (INSERT INTO dm_contactos (id, dueno) VALUES (${id}, 'cande')
               ON CONFLICT (id) DO UPDATE
               SET dueno = 'cande', nombre = NULL, estado = '{}'::jsonb, contexto = NULL, toques = 0,
                   proximo_toque = NULL, ultimo_lead = NULL, tomado_en = NULL, tomado_por = NULL, actualizado = NOW()
               RETURNING 1)
    SELECT (SELECT COUNT(*)::int FROM m) AS mensajes, (SELECT COUNT(*)::int FROM s) AS salidas,
           (SELECT COUNT(*)::int FROM c) AS contactos`;
  return rows[0];
}

/** La fecha desde la que pide el repaso de cada hora: válida, no futura y de la última semana. Si no, null. */
export function desdeValido(texto, ahora = new Date()) {
  const d = new Date(String(texto ?? ""));
  if (!String(texto ?? "").trim() || Number.isNaN(d.getTime()) || d > ahora || ahora - d > 7 * 24 * 3600 * 1000) return null;
  return d;
}

/** Las respuestas del agente desde una fecha, las más viejas primero (como mucho 200). Las lee el repaso de la Mac. */
export async function salidasDesde(desde) {
  const { rows } = await sql`
    SELECT id, contacto, accion, estado, motivo, detalle, creado FROM dm_salidas
    WHERE creado > ${desde.toISOString()} ORDER BY id ASC LIMIT 200`;
  return rows;
}

export async function resumen() {
  const { rows: c } = await sql`SELECT dueno, COUNT(*)::int AS n FROM dm_contactos GROUP BY dueno`;
  const { rows: s } = await sql`
    SELECT estado, COUNT(*)::int AS n FROM dm_salidas WHERE creado > NOW() - INTERVAL '24 hours' GROUP BY estado`;
  const { rows: u } = await sql`
    SELECT id, contacto, accion, estado, motivo, detalle, creado FROM dm_salidas ORDER BY id DESC LIMIT 12`;
  const { rows: a } = await sql`SELECT COUNT(*)::int AS n FROM dm_contactos WHERE alta_en > NOW() - INTERVAL '24 hours'`;
  return { contactos: c, altas_24h: a[0].n, salidas_24h: s, ultimas: u };
}
