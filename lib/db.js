// Conexión a Postgres. La usa el formulario de /devs.
//
// @vercel/postgres lee POSTGRES_URL del entorno solo. Si la base todavía no está
// creada, esto NO tiene que romper el formulario: preferimos guardar el lead por
// mail antes que perderlo por un problema de infraestructura.
import { sql } from "@vercel/postgres";
import { idDeCharla } from "./dm/linkFormulario";

export const hayBase = () => Boolean(process.env.POSTGRES_URL);

/** Crea la tabla si no existe. Es idempotente, se puede llamar en cada request. */
export async function asegurarTabla() {
  await sql`
    CREATE TABLE IF NOT EXISTS leads_devs (
      id          SERIAL PRIMARY KEY,
      nombre      TEXT NOT NULL,
      email       TEXT NOT NULL,
      seniority   TEXT,
      buscando    TEXT,
      trabado_en  TEXT,
      origen      TEXT,
      compro      BOOLEAN NOT NULL DEFAULT FALSE,
      creado      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
  // Un mail no puede entrar dos veces. Sin esto, el que recarga la página de
  // gracias te ensucia la base con duplicados.
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS leads_devs_email_idx ON leads_devs (lower(email))`;
}

export async function guardarLead({ nombre, email, seniority, buscando, trabadoEn, origen }) {
  await asegurarTabla();
  const { rows } = await sql`
    INSERT INTO leads_devs (nombre, email, seniority, buscando, trabado_en, origen)
    VALUES (${nombre}, ${email}, ${seniority || null}, ${buscando || null},
            ${trabadoEn || null}, ${origen || null})
    ON CONFLICT (lower(email)) DO UPDATE
      SET nombre = EXCLUDED.nombre,
          seniority = COALESCE(EXCLUDED.seniority, leads_devs.seniority),
          buscando = COALESCE(EXCLUDED.buscando, leads_devs.buscando),
          trabado_en = COALESCE(EXCLUDED.trabado_en, leads_devs.trabado_en)
    RETURNING id, creado`;
  return rows[0];
}

export async function asegurarTablaCalc() {
  await sql`
    CREATE TABLE IF NOT EXISTS leads_calculadora (
      id            SERIAL PRIMARY KEY,
      nombre        TEXT NOT NULL,
      email         TEXT NOT NULL,
      team_size     TEXT,
      salary        TEXT,
      industry      TEXT,
      tasks         TEXT,
      hours_lost    NUMERIC,
      monthly_cost  NUMERIC,
      savings       NUMERIC,
      creado        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
}

/** Acá NO deduplicamos por mail: si alguien corre la calculadora dos veces con
 *  respuestas distintas, las dos corridas son información que vale. */
export async function guardarLeadCalc(d) {
  await asegurarTablaCalc();
  const tareas = Array.isArray(d.tasks) ? d.tasks.join(", ") : (d.tasks || null);
  const num = (v) => (v === undefined || v === null || v === "" ? null : Number(v));
  const { rows } = await sql`
    INSERT INTO leads_calculadora
      (nombre, email, team_size, salary, industry, tasks, hours_lost, monthly_cost, savings)
    VALUES (${d.name}, ${d.email}, ${d.teamSize || null}, ${d.salary || null},
            ${d.industry || null}, ${tareas}, ${num(d.hoursLost)},
            ${num(d.monthlyCost)}, ${num(d.potentialSavings)})
    RETURNING id, creado`;
  return rows[0];
}

export async function asegurarTablaRed() {
  await sql`
    CREATE TABLE IF NOT EXISTS red_devs (
      id              SERIAL PRIMARY KEY,
      nombre          TEXT NOT NULL,
      email           TEXT,
      pais            TEXT,
      roles           TEXT,
      rol_principal   TEXT,
      seniority       TEXT,
      experiencia     TEXT,
      stack           TEXT,
      cuando_arrancas TEXT,
      dedicacion      TEXT,
      tarifa          TEXT,
      situacion       TEXT,
      ingles          TEXT,
      clientes_ext    TEXT,
      como_llegaste   TEXT,
      linkedin        TEXT,
      github          TEXT,
      cv_url          TEXT,
      proyecto        TEXT,
      idiomas         TEXT,
      whatsapp        TEXT,
      telegram        TEXT,
      video           TEXT,
      trabado_en      TEXT,
      creado          TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
  // Índice parcial: el que se anota por el formulario no puede entrar dos veces con
  // el mismo mail, pero los candidatos que busca Cande a mano muchas veces todavía no
  // tienen mail, y con un UNIQUE común solo podría cargar uno.
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS red_devs_email_idx
            ON red_devs (lower(email)) WHERE email IS NOT NULL`;
  await sql`ALTER TABLE red_devs ALTER COLUMN email DROP NOT NULL`;
  await sql`ALTER TABLE red_devs ADD COLUMN IF NOT EXISTS origen TEXT`;
  await sql`ALTER TABLE red_devs ADD COLUMN IF NOT EXISTS nota TEXT`;
  // Datos del pipeline de búsqueda: en qué está cada uno, el puntaje de la
  // entrevista y el CV. No vienen del formulario, los carga ella.
  await sql`ALTER TABLE red_devs ADD COLUMN IF NOT EXISTS estado TEXT`;
  await sql`ALTER TABLE red_devs ADD COLUMN IF NOT EXISTS score NUMERIC`;
  await sql`ALTER TABLE red_devs ADD COLUMN IF NOT EXISTS cv_archivo TEXT`;
  // De qué charla de Instagram vino (20/10): el id del contacto del agente de DM que trae el link del
  // formulario (?ig=, lib/dm/linkFormulario.js). Vacío: llegó por otro lado. En el primer minuto después del
  // deploy la pueden querer crear dos funciones a la vez (dos personas llenando el formulario). Postgres las
  // pone en fila (el ALTER traba la tabla) y la segunda ve la columna hecha y sigue; si igual tira que ya
  // existe, se sigue también, como con el índice de dm_salidas en lib/dm/base.js: esa persona no puede
  // quedar sin guardar por una columna que ya está.
  await sql`ALTER TABLE red_devs ADD COLUMN IF NOT EXISTS ig_contacto TEXT`.catch(yaEstaba);
}

/** Lo que tira Postgres cuando otra función creó lo mismo un instante antes. Cualquier otro error sigue de largo. */
function yaEstaba(e) {
  if (!["42701", "23505", "42P07"].includes(e?.code)) throw e;
}

/**
 * Un dev que se anota dos veces actualiza su ficha en vez de duplicarse. Devuelve { id, creado, ig_compartido }:
 * ig_compartido, si el id de charla con el que vino (ig_contacto) ya está en la ficha de otro mail.
 */
export async function guardarDev(d) {
  await asegurarTablaRed();
  const lista = (v) => (Array.isArray(v) && v.length ? v.join(", ") : null);
  // "Otro" se guarda pegado a la lista, si no se pierde lo que escribió a mano.
  const conOtro = (arr, otro) => {
    const l = Array.isArray(arr) ? arr.filter((x) => x !== "Otro") : [];
    if (otro) l.push(otro);
    return l.length ? l.join(", ") : null;
  };
  const idiomas = (d.idiomas || [])
    .map((i) => `${i}${d.idiomasNivel?.[i] ? ` (${d.idiomasNivel[i]})` : ""}`)
    .join(", ") || null;

  const { rows } = await sql`
    INSERT INTO red_devs (nombre, email, pais, roles, rol_principal, seniority, experiencia,
      stack, cuando_arrancas, dedicacion, tarifa, situacion, ingles, clientes_ext,
      como_llegaste, linkedin, github, cv_url, proyecto, idiomas, whatsapp, telegram,
      video, trabado_en, origen, nota, ig_contacto)
    VALUES (${d.nombre}, ${d.email}, ${d.pais || null},
      ${conOtro(d.roles, d.rolOtro)}, ${d.rolPrincipal || null}, ${d.seniority || null},
      ${d.experiencia || null}, ${conOtro(d.stack, d.stackOtro)},
      ${d.cuandoArrancas || null}, ${d.dedicacion || null}, ${d.tarifa || null},
      ${d.situacion || null}, ${d.ingles || null}, ${d.clientesExt || null},
      ${d.comoLlegaste || null}, ${d.linkedin || null}, ${d.github || null},
      ${d.cv || null}, ${d.proyecto || null}, ${idiomas},
      ${d.whatsapp || null}, ${d.telegram || null}, ${d.video || null}, ${d.trabadoEn || null},
      ${d.origen || 'formulario'}, ${d.nota || null}, ${idDeCharla(d.ig)})
    ON CONFLICT (lower(email)) WHERE email IS NOT NULL DO UPDATE SET
      nombre = EXCLUDED.nombre, pais = EXCLUDED.pais, roles = EXCLUDED.roles,
      rol_principal = EXCLUDED.rol_principal, seniority = EXCLUDED.seniority,
      experiencia = EXCLUDED.experiencia, stack = EXCLUDED.stack,
      cuando_arrancas = EXCLUDED.cuando_arrancas, dedicacion = EXCLUDED.dedicacion,
      tarifa = EXCLUDED.tarifa, situacion = EXCLUDED.situacion, ingles = EXCLUDED.ingles,
      clientes_ext = EXCLUDED.clientes_ext, como_llegaste = EXCLUDED.como_llegaste,
      linkedin = EXCLUDED.linkedin, github = EXCLUDED.github,
      cv_url = COALESCE(EXCLUDED.cv_url, red_devs.cv_url),
      proyecto = EXCLUDED.proyecto, idiomas = EXCLUDED.idiomas,
      whatsapp = EXCLUDED.whatsapp, telegram = EXCLUDED.telegram,
      video = EXCLUDED.video, trabado_en = EXCLUDED.trabado_en,
      nota = COALESCE(EXCLUDED.nota, red_devs.nota),
      -- Si vuelve a llenarlo sin el link de la charla, no se pierde de dónde vino la primera vez.
      ig_contacto = COALESCE(EXCLUDED.ig_contacto, red_devs.ig_contacto),
      creado = NOW()
    RETURNING id, creado,
      -- El link de esa charla ya lo usó otro mail (otra fila: la misma persona actualiza la suya). Lo más probable es
      -- que el lead lo haya reenviado: /api/devs-red no le deja a la charla la nota del formulario y el aviso lo dice.
      EXISTS (SELECT 1 FROM red_devs o WHERE o.ig_contacto = red_devs.ig_contacto AND o.id <> red_devs.id) AS ig_compartido`;
  return rows[0];
}

// ——— Embudo de devs: eventos anónimos para ver dónde se pierde la gente ———
// sid = id aleatorio por navegador (localStorage), sin ningún dato personal.
// Desde el 21/10 lo normal es que no se guarden acá en el momento: se juntan fuera de la base y pasan en la vuelta de
// los crons (lib/eventosPendientes.js), así una visita no despierta la base de Neon. guardarEvento queda para cuando
// no se pueden juntar.
async function tablaFunnel() {
  await sql`CREATE TABLE IF NOT EXISTS funnel_eventos (
    id SERIAL PRIMARY KEY, fase TEXT NOT NULL, sid TEXT,
    creado TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
}

export async function guardarEvento(fase, sid) {
  await tablaFunnel();
  await sql`INSERT INTO funnel_eventos (fase, sid) VALUES (${fase}, ${sid || null})`;
}

let conClave = false;
/**
 * Los eventos que se juntaron fuera de la base, de una vez: [{ fase, sid, creado, clave }]. `clave` es el nombre con el
 * que se juntó cada uno: si la misma tanda se pasa dos veces (no se pudo borrar lo juntado), no queda repetida.
 */
export async function guardarEventosJuntados(eventos) {
  if (!eventos?.length) return 0;
  await tablaFunnel();
  if (!conClave) {
    await sql`ALTER TABLE funnel_eventos ADD COLUMN IF NOT EXISTS clave TEXT`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS funnel_eventos_clave ON funnel_eventos (clave)`;
    conClave = true;
  }
  const { rows } = await sql`
    INSERT INTO funnel_eventos (fase, sid, creado, clave)
    SELECT x->>'fase', NULLIF(x->>'sid', ''), (x->>'creado')::timestamptz, x->>'clave'
    FROM jsonb_array_elements(${JSON.stringify(eventos.map(({ fase, sid, creado, clave }) => ({
      fase, sid: sid || "", creado: new Date(creado).toISOString(), clave,
    })))}::jsonb) x
    ON CONFLICT (clave) DO NOTHING
    RETURNING id`;
  return rows.length;
}

export async function contarFunnel(dias = 30) {
  // Personas únicas (sid) por fase; el orden lo da el front.
  const { rows } = await sql`
    SELECT fase, COUNT(DISTINCT COALESCE(sid, id::text)) AS n
    FROM funnel_eventos
    WHERE creado > NOW() - make_interval(days => ${dias})
    GROUP BY fase`;
  return rows;
}
