// El cerebro local: la respuesta no la redacta la API de Anthropic sino el Claude de Cande,
// en su Mac (su suscripción, sin clave de API).
//
// Cómo viaja un turno:
//   1. El agente (lib/dm/agente.js) pide una respuesta. En vez de llamar a Anthropic, deja el
//      turno en dm_trabajos y se queda esperando.
//   2. En la Mac de Cande corre tracker/dm_cerebro.py: retira el trabajo por /api/dm/trabajos,
//      se lo pasa a Claude y entrega la salida.
//   3. El agente la recibe y sigue igual que siempre: frenos, envío, aviso.
//
// Si la Mac está apagada o dormida nadie retira el trabajo: a los 75 segundos se da por
// vencido y la charla pasa a ser de Cande, con el motivo. Nunca se manda algo a destiempo.
import { sql } from "@vercel/postgres";
import { guardarConfig, leerConfig } from "./base";
import { ModeloNoContesto, Salida } from "./modelo";

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

let lista = false;
export async function tablaTrabajos() {
  if (lista) return;
  await sql`
    CREATE TABLE IF NOT EXISTS dm_trabajos (
      id SERIAL PRIMARY KEY,
      turno JSONB NOT NULL,
      link_de_pago TEXT NOT NULL DEFAULT '',
      estado TEXT NOT NULL DEFAULT 'pendiente',   -- pendiente | tomado | hecho | vencido
      resultado JSONB,
      creado TIMESTAMPTZ DEFAULT NOW(), tomado_en TIMESTAMPTZ, hecho_en TIMESTAMPTZ)`;
  lista = true;
}

/* ---------- las cuatro consultas que usa la espera ---------- */

async function crearTrabajo(turno, linkDePago) {
  await tablaTrabajos();
  const { rows } = await sql`
    INSERT INTO dm_trabajos (turno, link_de_pago) VALUES (${JSON.stringify(turno)}::jsonb, ${linkDePago || ""})
    RETURNING id`;
  return rows[0].id;
}

async function leerTrabajo(id) {
  const { rows } = await sql`SELECT estado, resultado FROM dm_trabajos WHERE id = ${id}`;
  return rows[0] || null;
}

async function vencerTrabajo(id) {
  await sql`UPDATE dm_trabajos SET estado = 'vencido', turno = '{}'::jsonb WHERE id = ${id} AND estado <> 'hecho'`;
}

/** Usado el trabajo, no queda guardado lo que escribió el lead ni lo que contestó el modelo. */
async function vaciarTrabajo(id) {
  await sql`UPDATE dm_trabajos SET turno = '{}'::jsonb, resultado = NULL WHERE id = ${id}`;
}

/**
 * Arma el pedir() del cerebro local. Las consultas entran por parámetro para poder probar la
 * espera con dobles. El tope (75 segundos) tiene que ser menor que lo que el agente espera la
 * traba de un contacto (2 minutos): si no, una Mac lenta haría pasar charlas a Cande de más.
 */
export function crearCerebroLocal({
  crear = crearTrabajo, leer = leerTrabajo, vencer = vencerTrabajo, vaciar = vaciarTrabajo,
  esperar = dormir, tope_ms = 75000, cada_ms = 2000,
} = {}) {
  return async function pedirLocal({ turno, linkDePago = "" }) {
    const id = await crear(turno, linkDePago);
    for (let pasado = 0; pasado < tope_ms; pasado += cada_ms) {
      await esperar(cada_ms);
      const t = await leer(id);
      if (t?.estado !== "hecho") continue;
      await vaciar(id);
      if (t.resultado?.error) {
        throw new ModeloNoContesto(`el Claude de la Mac falló: ${String(t.resultado.error).slice(0, 200)}`);
      }
      const leida = Salida.safeParse(t.resultado);
      if (!leida.success) {
        throw new ModeloNoContesto("la respuesta de la Mac no cumple el formato: " +
          leida.error.issues.map((i) => i.path.join(".")).join(", "));
      }
      return leida.data;
    }
    await vencer(id);
    throw new ModeloNoContesto("la Mac de Cande no contestó a tiempo (apagada, dormida o sin el cerebro corriendo)");
  };
}

/** La Mac retira el trabajo más viejo que siga esperando. Uno por vez; un trabajo de más de 3 minutos ya no sirve. */
export async function tomarTrabajo() {
  await tablaTrabajos();
  const { rows } = await sql`
    UPDATE dm_trabajos SET estado = 'tomado', tomado_en = NOW()
    WHERE estado = 'pendiente' AND id = (
      SELECT id FROM dm_trabajos
      WHERE estado = 'pendiente' AND creado > NOW() - INTERVAL '3 minutes'
      ORDER BY id ASC LIMIT 1 FOR UPDATE SKIP LOCKED)
    RETURNING id, turno, link_de_pago, EXTRACT(EPOCH FROM NOW() - creado)::float AS edad`;
  return rows[0] || null;
}

/** La Mac entrega la salida (o el error). Solo vale para un trabajo que ella misma retiró. */
export async function entregarTrabajo(id, resultado) {
  await tablaTrabajos();
  const { rows } = await sql`
    UPDATE dm_trabajos SET estado = 'hecho', resultado = ${JSON.stringify(resultado)}::jsonb, hecho_en = NOW()
    WHERE id = ${id} AND estado = 'tomado' RETURNING id`;
  return rows.length > 0;
}

/** Latido del cerebro: para que Cande vea si su Mac está contestando. Se guarda como mucho una vez por minuto. */
export async function latido() {
  const ahora = Date.now();
  const previo = (await leerConfig("cerebro_latido"))?.ms || 0;
  if (ahora - previo > 60000) await guardarConfig("cerebro_latido", { ms: ahora });
}

export async function segundosDesdeElLatido() {
  const ms = (await leerConfig("cerebro_latido"))?.ms;
  return ms ? Math.round((Date.now() - ms) / 1000) : null;
}

/** Los turnos traen lo que escribió el lead: no se guardan más de una semana. */
export async function borrarTrabajosViejos() {
  await tablaTrabajos();
  await sql`DELETE FROM dm_trabajos WHERE creado < NOW() - INTERVAL '7 days'`;
}
