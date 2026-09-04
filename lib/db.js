// Conexión a Postgres. La usa el formulario de /devs.
//
// @vercel/postgres lee POSTGRES_URL del entorno solo. Si la base todavía no está
// creada, esto NO tiene que romper el formulario: preferimos guardar el lead por
// mail antes que perderlo por un problema de infraestructura.
import { sql } from "@vercel/postgres";

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
