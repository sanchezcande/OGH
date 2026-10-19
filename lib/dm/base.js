// Memoria del agente de DM.
//
// ManyChat no da el historial de una charla (su API no tiene ningún método para leer
// mensajes), así que cada mensaje se guarda acá. También vive acá de quién es cada charla:
// TODO es de Cande salvo los contactos que se le dan al agente a propósito.
//
// El prompt y los ajustes también viven en la base (dm_config) y no en el código: este
// repo es público y el prompt trae la guía de voz de Cande y ejemplos de charlas reales.
import { sql } from "@vercel/postgres";
import { NOTA_FORMULARIO, idDeCharla } from "./linkFormulario";
import { FALLA_DUDOSA, FALLA_PROPIA } from "./seguimientos";

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
  // La lectura directa de Instagram (lib/dm/instagram.js): el usuario que da ManyChat (vacío si no
  // tiene), el id de la persona en la app de Cande, y desde cuándo la charla es de quien es ahora
  // (un "--" de Cande anterior a que la charla volviera al agente no cuenta).
  await sql`ALTER TABLE dm_contactos ADD COLUMN IF NOT EXISTS ig_usuario TEXT`;
  await sql`ALTER TABLE dm_contactos ADD COLUMN IF NOT EXISTS ig_id TEXT`;
  await sql`ALTER TABLE dm_contactos ADD COLUMN IF NOT EXISTS dueno_desde TIMESTAMPTZ DEFAULT NOW()`;
  // El id que da ManyChat para la persona: puede ser el mismo que ve la app de Cande, o no (vacío: no era).
  await sql`ALTER TABLE dm_contactos ADD COLUMN IF NOT EXISTS ig_id_mc TEXT`;
  // Cande se la dio al agente a propósito (/agente, el dashboard o una charla cargada): que ella siga a
  // la persona no la saca. Su "--" sí.
  await sql`ALTER TABLE dm_contactos ADD COLUMN IF NOT EXISTS entregada BOOLEAN NOT NULL DEFAULT false`;
  // La espera (lib/dm/seguimientos.js): una corrida de los crons apartó la charla para contestarla tarde o
  // pasarla. Una sola corrida por charla; se libera sola a los 6 minutos.
  await sql`ALTER TABLE dm_contactos ADD COLUMN IF NOT EXISTS reintento_en TIMESTAMPTZ`;
  // Las cuentas que sigue Cande en Instagram (la lista que baja ella de Instagram, más lo que va viendo la API).
  await sql`CREATE TABLE IF NOT EXISTS dm_seguidos (usuario TEXT PRIMARY KEY, creado TIMESTAMPTZ DEFAULT NOW())`;
  await sql`
    CREATE TABLE IF NOT EXISTS dm_mensajes (
      id SERIAL PRIMARY KEY, contacto TEXT NOT NULL,
      quien TEXT NOT NULL,                               -- lead | agente | cande | automatico | sistema
      texto TEXT NOT NULL, creado TIMESTAMPTZ DEFAULT NOW())`;
  await sql`CREATE INDEX IF NOT EXISTS dm_mensajes_contacto_idx ON dm_mensajes (contacto, id)`;
  // El aviso de las fotos (avisarFotos y avisarPago en lib/dm/agente.js): hasta qué mensaje del lead ya tiene su
  // aviso (foto_avisada_hasta), y cuándo salió el último URGENTE de siempre (foto_avisada_en), que junta las
  // fotos que llegan 2 minutos antes o después. El aviso del pago (el agente miró las fotos) cubre solo las que
  // vio y deja foto_avisada_en vacío: las que llegan después se miran o se avisan aparte. Las charlas que ya
  // existían arrancan con todo lo anterior dado por avisado (al subir esto no le llueven a Cande avisos de
  // fotos viejas); las nuevas, desde 0.
  await sql`ALTER TABLE dm_contactos ADD COLUMN IF NOT EXISTS foto_avisada_hasta INT`;
  await sql`ALTER TABLE dm_contactos ALTER COLUMN foto_avisada_hasta SET DEFAULT 0`;
  await sql`
    UPDATE dm_contactos c SET foto_avisada_hasta = COALESCE((SELECT MAX(m.id) FROM dm_mensajes m WHERE m.contacto = c.id), 0)
    WHERE c.foto_avisada_hasta IS NULL`;
  await sql`ALTER TABLE dm_contactos ADD COLUMN IF NOT EXISTS foto_avisada_en TIMESTAMPTZ`;
  await sql`
    CREATE TABLE IF NOT EXISTS dm_salidas (
      id SERIAL PRIMARY KEY, contacto TEXT NOT NULL, accion TEXT NOT NULL,
      mensajes JSONB NOT NULL DEFAULT '[]'::jsonb, aviso TEXT, motivo TEXT,
      -- enviando (constancia de que iba a salir) | enviada | incierta (no se sabe si salió)
      -- pendiente (ManyChat la retira) | vencida (nadie la retiró) | borrador | frenada | callo
      -- descartada (se apagó, la tomó Cande o el lead escribió antes de que saliera) | error | aviso_fallido
      -- El código de acceso de quien pagó en pesos (accion codigo_mp): borrador (espera el ok de Cande) y,
      -- con su ok, enviando | enviada | incierta (ver lib/dm/respuestas.js). Mientras es borrador, aviso es
      -- el aviso YA que lo lleva (JSON: titulo, campos, foto) y detalle dice si ese aviso salió (ver
      -- guardarBorradorCodigo).
      estado TEXT NOT NULL DEFAULT 'pendiente',
      detalle TEXT, creado TIMESTAMPTZ DEFAULT NOW(), enviado TIMESTAMPTZ)`;
  await sql`CREATE INDEX IF NOT EXISTS dm_salidas_contacto_idx ON dm_salidas (contacto, id)`;
  // Para ver si en un rato dado el modelo andaba con otras charlas (las fallas dudosas, en sinContestar).
  // Índice nuevo sobre una tabla con datos: en el primer minuto después del deploy lo pueden crear dos
  // funciones a la vez (los crons y la entrada) y el IF NOT EXISTS no alcanza; la que pierde se encuentra
  // el índice ya hecho y sigue, así no se cae la entrada de un mensaje por eso.
  await sql`CREATE INDEX IF NOT EXISTS dm_salidas_creado_idx ON dm_salidas (creado)`.catch((e) => {
    if (e?.code !== "23505" && e?.code !== "42P07") throw e;
  });
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
  codigo_mercadopago: "", // el código de acceso de quien pagó en pesos (vive en la base: el repo es público). Sale solo con el ok de Cande
  mensaje_codigo_mp: "", // el mensaje con el código que Cande aprueba con un ok: {codigo} y {link} se completan (vacío: no hay borrador)
  altas: false,          // quien nunca pasó por esta base y llega por la entrada pasa a ser del agente (ver recibir en agente.js)
  altas_por_dia: 25,     // tope de altas en 24 horas corridas: si en ManyChat se rompe el filtro, no entra la bandeja entera
  contexto_alta: "",     // lo que el agente tiene que saber de quien entra solo: qué le mandó el automático antes
  instagram: false,      // con INSTAGRAM_TOKEN: si Cande sigue a la persona o escribió "--" en el chat, el agente sale (lib/dm/instagram.js)
  seguidos: false,       // si la persona está en la lista de cuentas que sigue Cande (dm_seguidos), el agente sale
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
  codigo_mercadopago: (v) => typeof v === "string" && /^[A-Za-z0-9]{0,30}$/.test(v),
  // Con lugar para el código y el link: Instagram corta a los 1.000 caracteres.
  mensaje_codigo_mp: (v) => typeof v === "string" && v.length <= 900,
  altas: (v) => typeof v === "boolean",
  altas_por_dia: (v) => Number.isInteger(v) && v >= 1 && v <= 200,
  contexto_alta: (v) => typeof v === "string" && v.length <= 1000,
  instagram: (v) => typeof v === "boolean",
  seguidos: (v) => typeof v === "boolean",
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

/**
 * De quién es la charla. Dársela al agente es siempre una decisión de Cande (/agente o el dashboard:
 * el agente nunca se la da a sí mismo), y cuenta como un comienzo: un "--" de antes ya no la saca,
 * que ella siga a la persona tampoco, y deja de ser un alta sin confirmar.
 */
export async function ponerDueno(id, dueno, nombre = null) {
  await sql`
    INSERT INTO dm_contactos (id, nombre, dueno, entregada) VALUES (${id}, ${nombre}, ${dueno}, ${dueno === "agente"})
    ON CONFLICT (id) DO UPDATE
      SET dueno = EXCLUDED.dueno, nombre = COALESCE(EXCLUDED.nombre, dm_contactos.nombre),
          dueno_desde = CASE WHEN EXCLUDED.dueno = 'agente' OR dm_contactos.dueno IS DISTINCT FROM EXCLUDED.dueno
                             THEN NOW() ELSE dm_contactos.dueno_desde END,
          entregada = CASE WHEN EXCLUDED.dueno = 'agente' THEN true ELSE dm_contactos.entregada END,
          alta_avisada = CASE WHEN EXCLUDED.dueno = 'agente' THEN true ELSE dm_contactos.alta_avisada END,
          proximo_toque = NULL, actualizado = NOW()`;
}

/**
 * Lo que se supo de Instagram de un contacto: su usuario (vacío: no tiene), su id en la app de Cande
 * y el id que da ManyChat (vacío: no era el mismo).
 */
export async function guardarIg(id, { usuario = null, igId = null, igIdMc = null } = {}) {
  await sql`
    UPDATE dm_contactos
    SET ig_usuario = COALESCE(${usuario}, ig_usuario), ig_id = COALESCE(${igId}, ig_id), ig_id_mc = COALESCE(${igIdMc}, ig_id_mc)
    WHERE id = ${id}`;
}

/**
 * El contacto de una charla de Instagram: por el id de la persona o, si todavía no se sabe su id,
 * por su usuario. Un contacto que ya tiene otro id no se toma por el usuario (pudo cambiarlo).
 */
export async function contactoDeIg({ igId = null, usuario = null }) {
  const { rows } = await sql`
    SELECT * FROM dm_contactos
    WHERE (${igId}::text IS NOT NULL AND ig_id = ${igId}::text)
       OR (${usuario || null}::text IS NOT NULL AND ig_usuario = ${usuario || null}::text AND ig_id IS NULL)
    ORDER BY (ig_id = ${igId}::text) DESC NULLS LAST, actualizado DESC LIMIT 1`;
  return rows[0] || null;
}

/** El permiso de una red que sube el dashboard para publicar (tokens_redes, ver pages/api/cola-publicar.js), o null. */
export async function tokenRed(red) {
  try {
    const { rows } = await sql`SELECT data FROM tokens_redes WHERE red = ${red}`;
    return rows[0]?.data || null;
  } catch {
    return null; // la tabla la crea la cola de publicación
  }
}

/**
 * Lo que salió de la cuenta en esta charla y ya se sabe de dónde vino: lo del agente y lo anotado (dm_mensajes),
 * lo que el agente dejó para salir (dm_salidas, últimos 7 días) y los textos de los automáticos de ManyChat
 * (dm_config "automaticos"). Lo que salga de la cuenta y no esté acá lo escribió Cande a mano.
 */
export async function textosDeLaCuenta(id) {
  const { rows } = await sql`
    SELECT texto FROM dm_mensajes WHERE contacto = ${id} AND quien IN ('agente', 'cande', 'automatico')
    UNION ALL
    SELECT jsonb_array_elements_text(mensajes) FROM dm_salidas
    WHERE contacto = ${id} AND creado > NOW() - INTERVAL '7 days' AND estado IN ('pendiente', 'enviando', 'enviada', 'incierta')`;
  const automaticos = (await leerConfig("automaticos"))?.textos || [];
  return [...rows.map((r) => r.texto), ...automaticos];
}

/** Si Cande sigue a ese usuario de Instagram, según la lista. */
export async function loSigue(usuario) {
  const { rows } = await sql`SELECT EXISTS (SELECT 1 FROM dm_seguidos WHERE usuario = ${usuario}) AS si`;
  return rows[0].si === true;
}

/** Suma usuarios a la lista de cuentas que sigue Cande. Con reemplazar, la lista queda solo con esos. Devuelve cuántos hay. */
export async function anotarSeguidos(usuarios, { reemplazar = false } = {}) {
  if (reemplazar) {
    await sql`DELETE FROM dm_seguidos WHERE usuario NOT IN (SELECT jsonb_array_elements_text(${JSON.stringify(usuarios)}::jsonb))`;
  }
  await sql`
    INSERT INTO dm_seguidos (usuario) SELECT jsonb_array_elements_text(${JSON.stringify(usuarios)}::jsonb)
    ON CONFLICT (usuario) DO NOTHING`;
  const { rows } = await sql`SELECT COUNT(*)::int AS n FROM dm_seguidos`;
  return rows[0].n;
}

/**
 * Contactos del agente de los que todavía no se sabe el usuario de Instagram. Al azar: si ManyChat
 * no da los datos de uno, ese no tapa a los demás en cada vuelta.
 */
export async function sinUsuarioIg(tope) {
  const { rows } = await sql`
    SELECT id FROM dm_contactos WHERE dueno = 'agente' AND ig_usuario IS NULL ORDER BY random() LIMIT ${tope}`;
  return rows.map((r) => r.id);
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
 * Quien llenó el formulario de /devs con el link de su charla (?ig=, lib/dm/linkFormulario.js): la charla queda
 * con la nota "sistema" NOTA_FORMULARIO, una sola vez, para que el agente no le pregunte si lo llenó y siga. Al
 * lead no le sale nada. La llama /api/devs-red con un id ya validado.
 *
 * La nota queda solo si a esa charla le salió el link con ese id (un mensaje del agente o de Cande con "ig=<id>"):
 * el id viaja en claro y /api/devs-red es pública, así que un id inventado, o el de una charla que nunca recibió
 * el link, no le dice al agente que esa persona llenó algo. `anotar: false` mira la charla sin dejar la nota (el
 * link ya lo usó otro mail: lo decide la API con red_devs, ver guardarDev en lib/db.js).
 *
 * Una sola sentencia y sin tocar la charla: no cambia el dueño, el turno ni los toques. Si no hay charla con ese
 * id, no guarda nada. Devuelve { ig_usuario, dueno, link_enviado, anotada } (anotada: 1 si la nota quedó recién,
 * 0 si no), o null si no hay charla o el id no vale.
 */
export async function anotarFormularioLleno(id, { anotar = true } = {}) {
  const ig = idDeCharla(id);
  if (!ig) return null;
  // El link con este id y no con uno que empieza igual: "ig=123" no es "ig=1234". Son solo dígitos: nada que escapar.
  const conEsteId = `[?&]ig=${ig}([^0-9]|$)`;
  const { rows } = await sql`
    WITH c AS (SELECT id, ig_usuario, dueno FROM dm_contactos WHERE id = ${ig}),
    l AS (SELECT EXISTS (
      SELECT 1 FROM dm_mensajes WHERE contacto = ${ig} AND quien IN ('agente', 'cande') AND texto ~ ${conEsteId}
    ) AS enviado),
    n AS (
      INSERT INTO dm_mensajes (contacto, quien, texto)
      SELECT c.id, 'sistema', ${NOTA_FORMULARIO}::text FROM c, l
      WHERE ${anotar === true}::boolean AND l.enviado AND NOT EXISTS (
        SELECT 1 FROM dm_mensajes WHERE contacto = ${ig} AND quien = 'sistema' AND texto = ${NOTA_FORMULARIO}::text)
      RETURNING id)
    SELECT c.ig_usuario, c.dueno, l.enviado AS link_enviado, (SELECT COUNT(*)::int FROM n) AS anotada FROM c, l`;
  return rows[0] || null;
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
 * escribir hasta que el lead conteste de verdad. Los mensajes cargados quedan como ya atendidos, y sus
 * fotos como avisadas (Cande ya las vio).
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
    INSERT INTO dm_contactos (id, nombre, dueno, contexto, respondido_hasta, foto_avisada_hasta, entregada)
    VALUES (${id}, ${nombre}, 'agente', ${contexto || null}, COALESCE((SELECT MAX(id) FROM m WHERE quien = 'lead'), 0),
            COALESCE((SELECT MAX(id) FROM m), 0), true)
    ON CONFLICT (id) DO UPDATE
      SET dueno = 'agente', nombre = COALESCE(EXCLUDED.nombre, dm_contactos.nombre), contexto = EXCLUDED.contexto,
          dueno_desde = NOW(), entregada = true, alta_avisada = true,
          respondido_hasta = GREATEST(dm_contactos.respondido_hasta, EXCLUDED.respondido_hasta),
          foto_avisada_hasta = GREATEST(dm_contactos.foto_avisada_hasta, EXCLUDED.foto_avisada_hasta),
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
 * Lo contrario de cerrarTurno, para retomar una charla que se le pasó a Cande y nadie contestó:
 * deja abiertos los mensajes del lead posteriores al último mensaje enviado por la cuenta, y la
 * espera (/api/dm/espera) los contesta tarde. Lo anterior a eso sigue atendido. Devuelve cuántos
 * mensajes del lead quedaron abiertos.
 */
export async function reabrirTurno(id) {
  const { rows } = await sql`
    WITH ultimo AS (
      SELECT COALESCE(MAX(id), 0) AS cuenta FROM dm_mensajes
      WHERE contacto = ${id} AND quien IN ('agente', 'cande', 'automatico')),
    hasta AS (
      SELECT COALESCE(MAX(m.id), 0) AS id FROM dm_mensajes m, ultimo
      WHERE m.contacto = ${id} AND m.quien = 'lead' AND m.id < ultimo.cuenta)
    UPDATE dm_contactos c SET respondido_hasta = (SELECT id FROM hasta), actualizado = NOW()
    WHERE c.id = ${id}
    RETURNING (SELECT COUNT(*)::int FROM dm_mensajes m
               WHERE m.contacto = ${id} AND m.quien = 'lead' AND m.id > (SELECT id FROM hasta)) AS abiertos`;
  return rows[0]?.abiertos ?? 0;
}

/**
 * Cuántas veces trabajó el agente para este contacto en 24 horas. Cuenta corridas y no globos:
 * una respuesta de tres mensajes es un turno, y un borrador o un turno en que calla también le
 * costaron un pedido al modelo.
 */
export async function corridasEnUnDia(id) {
  const { rows } = await sql`
    SELECT COUNT(*)::int AS n FROM dm_salidas
    WHERE contacto = ${id} AND estado NOT IN ('aviso_fallido', 'error') AND accion <> 'codigo_mp'
      AND creado > NOW() - INTERVAL '24 hours'`;
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

/* ---------- el código de quien pagó en pesos (19/10) ---------- */

// Un borrador del código vale una semana: después, si vuelve a avisar que pagó, se arma otro.
export const VIGENCIA_BORRADOR_DIAS = 7;

/**
 * El último código de acceso de este contacto que quedó para salir o salió (dm_salidas, accion codigo_mp):
 * { id, estado, mensajes, creado } o null. estado: borrador (espera el ok de Cande), enviando, enviada o incierta.
 */
export async function codigoDe(id) {
  const { rows } = await sql`
    SELECT id, estado, mensajes, creado FROM dm_salidas
    WHERE contacto = ${id} AND accion = 'codigo_mp' AND estado IN ('borrador', 'enviando', 'enviada', 'incierta')
    ORDER BY id DESC LIMIT 1`;
  return rows[0] || null;
}

/**
 * Cande respondió ok: aparta el borrador vigente del código (pasa a "enviando") para mandarlo una sola vez.
 * Devuelve { id, mensajes } o null si no hay ninguno (ya salió, no se armó o venció). Dos ok a la vez no se
 * llevan el mismo: el estado se pide también afuera.
 */
export async function tomarBorradorCodigo(id) {
  const { rows } = await sql`
    UPDATE dm_salidas SET estado = 'enviando'
    WHERE estado = 'borrador'
      AND id = (SELECT id FROM dm_salidas
                WHERE contacto = ${id} AND accion = 'codigo_mp' AND estado = 'borrador'
                  AND creado > NOW() - (${VIGENCIA_BORRADOR_DIAS}::int * INTERVAL '1 day')
                ORDER BY id DESC LIMIT 1)
    RETURNING id, mensajes`;
  return rows[0] || null;
}

// detalle de la fila del borrador según su aviso YA: si no salió, lo reintenta el cron de los toques.
const AVISO_CODIGO_FALTA = "aviso sin salir";
const AVISO_CODIGO_SALIO = "aviso salió";

/**
 * El borrador del código, guardado con su aviso YA antes de mandarlo (constancia antes de mandar): queda como
 * aviso sin salir hasta que marcarAvisoCodigo diga que salió. `aviso`: { titulo, campos, foto }. Devuelve el id.
 */
export async function guardarBorradorCodigo({ contacto: id, mensajes, motivo, aviso }) {
  const { rows } = await sql`
    INSERT INTO dm_salidas (contacto, accion, mensajes, aviso, motivo, estado, detalle)
    VALUES (${id}, 'codigo_mp', ${JSON.stringify(mensajes || [])}::jsonb, ${JSON.stringify(aviso)}, ${motivo || null},
            'borrador', ${AVISO_CODIGO_FALTA})
    RETURNING id`;
  return rows[0].id;
}

/**
 * El aviso YA de un borrador del código: { salio: true } cuando salió; si no, queda como aviso sin salir (con
 * `aviso`, el que lleva ahora: el de un turno nuevo que reusa el borrador). Solo mientras sigue siendo borrador.
 */
export async function marcarAvisoCodigo(idSalida, { salio = false, aviso = null } = {}) {
  await sql`
    UPDATE dm_salidas
    SET detalle = ${salio ? AVISO_CODIGO_SALIO : AVISO_CODIGO_FALTA}, aviso = COALESCE(${aviso ? JSON.stringify(aviso) : null}, aviso)
    WHERE id = ${idSalida} AND accion = 'codigo_mp' AND estado = 'borrador'`;
}

/**
 * Los borradores del código vigentes cuyo aviso YA no salió (Telegram caído o lento en los tres caminos, o la
 * corrida se cortó antes de mandarlo): { id, contacto, mensajes, motivo, aviso }. Sin los de una charla tomada
 * ahora (la corrida que lo está avisando). El cron de los toques los vuelve a avisar. Hasta 20 por vuelta.
 */
export async function codigosSinAviso() {
  const { rows } = await sql`
    SELECT s.id, s.contacto, s.mensajes, s.motivo, s.aviso FROM dm_salidas s
    JOIN dm_contactos c ON c.id = s.contacto
    WHERE s.accion = 'codigo_mp' AND s.estado = 'borrador' AND s.detalle = ${AVISO_CODIGO_FALTA}
      AND s.creado > NOW() - (${VIGENCIA_BORRADOR_DIAS}::int * INTERVAL '1 day')
      AND (c.tomado_en IS NULL OR c.tomado_en < NOW() - INTERVAL '6 minutes')
    ORDER BY s.id ASC LIMIT 20`;
  return rows;
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
 * turno sigue abierto (no hubo respuesta, borrador, freno ni nada anotado por Cande). Casi siempre es
 * la espera: el modelo no pudo contestar (la Mac apagada, dormida o sin su Claude). También pasa si la
 * función murió a mitad de camino, o si el mensaje entró con el agente apagado (por eso el cron de
 * los toques la corre siempre, esté prendido o no).
 * No mira las que tienen una corrida en marcha (traba tomada, o apartada por un cron, hace menos de
 * 6 minutos) ni las que tienen una respuesta esperando retiro: esa cierra el turno al salir, o se
 * vence y avisa. Tampoco las de hace más de 23 horas: esas ya casi no se pueden contestar (ver sinVentana).
 * Van de la más vieja a la más nueva (por su primer mensaje sin atender).
 *
 * quizas_salio: hay una salida de después de su último mensaje que llegó a anotarse para mandar.
 * La función pudo morir después de mandarla y antes de cerrar el turno.
 * ultimo_id_lead, minutos (desde el primer mensaje sin atender), fallos (las fallas del modelo propias
 * de esta charla desde entonces: las generales, la Mac apagada o sin uso, no cuentan; una dudosa cuenta
 * si 10 minutos antes o después el modelo contestó otra charla, porque la Mac andaba), intentos y
 * minutos_desde_la_falla (las propias y las dudosas, para la pausa antes del próximo intento): con eso
 * los crons deciden si la reintentan, la dejan esperando o se la pasan a Cande (decidirSinContestar).
 * ig_usuario es para el link del aviso, si se pasa.
 */
export async function sinContestar() {
  const { rows } = await sql`
    SELECT c.id, c.nombre, c.ig_usuario,
           (SELECT MAX(u.id) FROM dm_mensajes u WHERE u.contacto = c.id AND u.quien = 'lead') AS ultimo_id_lead,
           -- desde el primer mensaje sin atender: un lead que sigue escribiendo no corre el reloj
           EXTRACT(EPOCH FROM (NOW() - p.desde)) / 60 AS minutos,
           (SELECT COUNT(*)::int FROM dm_salidas e
            WHERE e.contacto = c.id AND e.accion IN ('error', 'reintento') AND e.estado = 'error' AND e.creado >= p.desde
              AND (e.motivo = ${FALLA_PROPIA} OR (e.motivo = ${FALLA_DUDOSA} AND EXISTS (
                -- el modelo contestó otra charla en ese rato: la Mac andaba, el problema era esta charla
                SELECT 1 FROM dm_salidas o
                WHERE o.contacto <> c.id AND o.accion IN ('responder', 'callar', 'pasar_a_cande')
                  AND o.creado BETWEEN e.creado - INTERVAL '10 minutes' AND e.creado + INTERVAL '10 minutes')))) AS fallos,
           f.intentos, f.minutos_desde_la_falla,
           EXISTS (
             SELECT 1 FROM dm_salidas s
             WHERE s.contacto = c.id AND s.estado IN ('enviando', 'enviada', 'incierta') AND s.creado >= c.ultimo_lead
           ) AS quizas_salio
    FROM dm_contactos c
    CROSS JOIN LATERAL (
      SELECT MIN(m0.creado) AS desde FROM dm_mensajes m0
      WHERE m0.contacto = c.id AND m0.quien = 'lead' AND m0.id > c.respondido_hasta) p
    CROSS JOIN LATERAL (
      SELECT COUNT(*)::int AS intentos, EXTRACT(EPOCH FROM (NOW() - MAX(e.creado))) / 60 AS minutos_desde_la_falla
      FROM dm_salidas e
      WHERE e.contacto = c.id AND e.accion IN ('error', 'reintento') AND e.estado = 'error' AND e.creado >= p.desde
        AND e.motivo IN (${FALLA_PROPIA}, ${FALLA_DUDOSA})) f
    WHERE c.dueno = 'agente'
      AND c.ultimo_lead BETWEEN NOW() - INTERVAL '23 hours' AND NOW() - INTERVAL '5 minutes'
      AND (c.tomado_en IS NULL OR c.tomado_en < NOW() - INTERVAL '6 minutes')
      AND (c.reintento_en IS NULL OR c.reintento_en < NOW() - INTERVAL '6 minutes')
      AND EXISTS (
        SELECT 1 FROM dm_mensajes m WHERE m.contacto = c.id AND m.quien = 'lead' AND m.id > c.respondido_hasta)
      AND NOT EXISTS (SELECT 1 FROM dm_salidas p WHERE p.contacto = c.id AND p.estado = 'pendiente')
    ORDER BY p.desde ASC, c.id ASC LIMIT 100`;
  return rows;
}

/**
 * Aparta una charla de la espera para esta corrida (reintento_en): los dos crons (/api/dm/espera y
 * /api/dm/toques) y sus corridas, que se pisan, no toman la misma. Se libera con soltarEspera, o sola a
 * los 6 minutos (más de lo que vive una función).
 *
 * Para contestarla (paraPasar en false) además tiene que seguir con un mensaje del lead sin atender y
 * sin ninguna respuesta que pudo haber salido (nunca dos veces), y entre todas las corridas tiene que
 * haber menos de `tope` charlas apartadas: son los lugares de la Mac. Devuelve { tomada, lleno }: lleno
 * es que no se tomó porque los lugares están ocupados (se vuelve a probar en unos segundos).
 */
export async function reclamarEspera(id, { tope = null, paraPasar = false } = {}) {
  const { rows } = await sql`
    WITH ocupadas AS (
      SELECT COUNT(*)::int AS n FROM dm_contactos WHERE reintento_en > NOW() - INTERVAL '6 minutes'),
    t AS (
      UPDATE dm_contactos c SET reintento_en = NOW()
      WHERE c.id = ${id} AND c.dueno = 'agente'
        AND (c.reintento_en IS NULL OR c.reintento_en < NOW() - INTERVAL '6 minutes')
        AND (${tope}::int IS NULL OR (SELECT n FROM ocupadas) < ${tope}::int)
        AND (${paraPasar}::boolean OR (
          EXISTS (SELECT 1 FROM dm_mensajes m WHERE m.contacto = c.id AND m.quien = 'lead' AND m.id > c.respondido_hasta)
          AND NOT EXISTS (
            SELECT 1 FROM dm_salidas s
            WHERE s.contacto = c.id AND s.estado IN ('pendiente', 'enviando', 'enviada', 'incierta') AND s.creado >= c.ultimo_lead)))
      RETURNING c.id)
    SELECT (SELECT COUNT(*)::int FROM t) AS tomada, (SELECT n FROM ocupadas) AS ocupadas`;
  const tomada = rows[0].tomada > 0;
  return { tomada, lleno: !tomada && tope != null && rows[0].ocupadas >= tope };
}

export async function soltarEspera(id) {
  await sql`UPDATE dm_contactos SET reintento_en = NULL WHERE id = ${id}`;
}

/**
 * La constancia del aviso de las fotos del lead hasta el mensaje `hasta` (avisarFotos en lib/dm/agente.js),
 * antes de mandarlo: dos corridas a la vez no avisan las mismas fotos. No se aparta si ya estaban avisadas
 * o si hace menos de 2 minutos salió (o está saliendo) otro aviso de fotos de esta charla: esas van juntas.
 * `soloVistas`: el aviso del pago (avisarPago), que cubre solo las fotos que miró el agente. Sale aunque haga
 * poco de otro aviso y deja foto_avisada_en vacío: no junta ninguna de las que lleguen después.
 * Devuelve lo que había antes ({ hasta, en }: para devolverlo si el aviso no sale), o null si no se apartó.
 */
export async function reclamarAvisoFoto(id, hasta, { soloVistas = false } = {}) {
  const { rows } = await sql`
    WITH antes AS (SELECT id, foto_avisada_hasta, foto_avisada_en FROM dm_contactos WHERE id = ${id} FOR UPDATE)
    UPDATE dm_contactos c
    SET foto_avisada_hasta = ${hasta}, foto_avisada_en = CASE WHEN ${soloVistas}::boolean THEN NULL ELSE NOW() END
    FROM antes a
    WHERE c.id = a.id AND COALESCE(c.foto_avisada_hasta, 0) < ${hasta}
      AND (${soloVistas}::boolean OR c.foto_avisada_en IS NULL OR c.foto_avisada_en < NOW() - INTERVAL '2 minutes')
    RETURNING a.foto_avisada_hasta AS hasta, a.foto_avisada_en AS en`;
  return rows[0] || null;
}

/** El aviso de las fotos no salió: vuelven a quedar sin aviso, para la vuelta siguiente. */
export async function soltarAvisoFoto(id, hasta, antes) {
  await sql`
    UPDATE dm_contactos
    SET foto_avisada_hasta = ${Number(antes?.hasta) || 0}, foto_avisada_en = ${antes?.en ? new Date(antes.en).toISOString() : null}
    WHERE id = ${id} AND foto_avisada_hasta = ${hasta}`;
}

/**
 * Charlas con una foto del lead (o un archivo) de entre 5 minutos y 24 horas que todavía no tiene su aviso
 * (foto_avisada_hasta): el aviso no salió (Telegram caído, la base que falló justo) o la corrida se cortó
 * antes. Sea de quien sea la charla: en el turno de la foto pudo pasar a Cande (el tope del día, un freno, el
 * modelo) con Telegram caído, y la foto igual le tiene que llegar. Las fotos de antes de esto no salen: la
 * migración de foto_avisada_hasta (tablas) las dio por avisadas, y en una charla de Cande no se guarda lo que
 * escribe el lead (anotarLead), así que solo hay fotos de cuando era del agente. El cron de los toques se las
 * pasa al agente (avisarFotosPendientes). Acá se filtra a grandes rasgos (sin texto, entre corchetes o un link
 * sin espacios): qué es una foto lo decide esFoto, y las que van juntas con un URGENTE que ya salió también
 * (después del aviso del pago no va ninguna junta: foto_avisada_en queda vacío). Hasta 20 por vuelta.
 */
export async function fotosSinAviso() {
  const { rows } = await sql`
    SELECT c.id FROM dm_contactos c
    WHERE c.ultimo_lead > NOW() - INTERVAL '24 hours'
      AND EXISTS (
        SELECT 1 FROM dm_mensajes m
        WHERE m.contacto = c.id AND m.quien = 'lead' AND m.id > COALESCE(c.foto_avisada_hasta, 0)
          AND m.creado BETWEEN NOW() - INTERVAL '24 hours' AND NOW() - INTERVAL '5 minutes'
          AND (m.texto ~ '^[[:space:]]*$' OR ltrim(m.texto) LIKE '[%' OR m.texto ~* '^[[:space:]]*https://[^[:space:]]+[[:space:]]*$')
          AND NOT (c.foto_avisada_en IS NOT NULL
                   AND m.creado BETWEEN c.foto_avisada_en - INTERVAL '2 minutes' AND c.foto_avisada_en + INTERVAL '2 minutes'))
    ORDER BY c.ultimo_lead ASC LIMIT 20`;
  return rows.map((r) => r.id);
}

/**
 * Charlas del agente que esperaron tanto que Instagram ya no deja escribirles: su último mensaje es de
 * hace más de 23 horas y media (la ventana del agente, frenos.ventanaAbierta) y el turno sigue abierto.
 * Pasa si la Mac estuvo apagada casi un día. El cron de los toques se las lista a Cande en un solo aviso
 * y les cierra el turno: no vuelven a salir. Hasta 30 por vuelta (el aviso tiene que entrar en un
 * mensaje de Telegram), y de la última semana: lo de antes ya no tiene sentido avisarlo.
 */
export async function sinVentana() {
  const { rows } = await sql`
    SELECT c.id, c.nombre, c.ig_usuario,
           (SELECT MAX(u.id) FROM dm_mensajes u WHERE u.contacto = c.id AND u.quien = 'lead') AS ultimo_id_lead
    FROM dm_contactos c
    WHERE c.dueno = 'agente'
      AND c.ultimo_lead BETWEEN NOW() - INTERVAL '7 days' AND NOW() - INTERVAL '23 hours 30 minutes'
      AND (c.tomado_en IS NULL OR c.tomado_en < NOW() - INTERVAL '6 minutes')
      AND (c.reintento_en IS NULL OR c.reintento_en < NOW() - INTERVAL '6 minutes')
      AND EXISTS (
        SELECT 1 FROM dm_mensajes m WHERE m.contacto = c.id AND m.quien = 'lead' AND m.id > c.respondido_hasta)
    ORDER BY c.ultimo_lead ASC, c.id ASC LIMIT 30`;
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
               SET dueno = 'cande', dueno_desde = NOW(), nombre = NULL, ig_usuario = NULL, ig_id = NULL, ig_id_mc = NULL,
                   entregada = false, estado = '{}'::jsonb, contexto = NULL, toques = 0,
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
