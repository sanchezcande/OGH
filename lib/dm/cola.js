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
// Si el lead mandó fotos y la Mac está, el trabajo trae además sus links (imagenes): la Mac las baja, se
// las muestra a Claude con el turno y entrega en la salida cuántas pudo ver (imagenes_vistas). Una Mac con
// el cerebro de antes no las mira ni dice nada: el agente lo toma como fotos que no se vieron y le pasa el
// aviso URGENTE de siempre a Cande (lib/dm/agente.js).
//
// La Mac no pregunta todo el tiempo (21/10: así la base de Neon duerme entre una vuelta de los crons y la otra).
// Pregunta en una ventana corta en cada cuarto de hora (de 10 segundos antes a 90 después de los minutos 0, 15, 30
// y 45, los de los crons) y se queda rápida mientras tiene trabajo (5 minutos después del último). En cada pregunta
// dice hasta cuándo va a seguir preguntando ("hasta"), y el sitio nunca le crea un trabajo fuera de ese rato
// (macEscuchando, y el portón de armado.pedir). Fuera de ese rato el turno no se intenta: queda en espera, del
// agente y sin aviso, y lo contesta el cron de la espera en la vuelta siguiente (lib/dm/seguimientos.js).
//
// Si la Mac se apaga, se duerme o se queda sin red en el medio, nadie retira el trabajo: a los 75 segundos se
// da por vencido y el turno queda abierto. La charla queda en espera igual, por más horas que pase la Mac
// apagada: cuando vuelve, la primera ventana vacía la espera. Lo mismo si la Mac contesta que no pudo (sin
// uso, no devolvió JSON).
import { sql } from "@vercel/postgres";
import { CADA_CRON_MS } from "../crons";
import { guardarConfig, leerConfig } from "./base";
import { ModeloNoContesto, Salida } from "./modelo";

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

// Lo que el Claude de la Mac no puede hacer con ninguna charla: se quedó sin uso (el límite de la
// suscripción), sin sesión, o Anthropic no contesta (caído, saturado, sin red). Son los textos en inglés
// que da `claude -p` y que la Mac manda tal cual (tracker/dm_claude.py). Un "API Error: 400" no está: puede
// ser de esta charla.
const SIN_CLAUDE = /usage limit|limit reached|hit your limit|rate.?limit|\/login|oauth|authenticat|invalid api key|credit balance|api error:? *(5\d\d|429)|overloaded|connection error|request timed out|econnrefused|econnreset|enotfound|etimedout/i;

/**
 * Qué clase de falla es el error que manda la Mac (ver ModeloNoContesto en lib/dm/modelo.js). Sin uso,
 * sin sesión o sin Anthropic le pasa a cualquier charla: general. Lo demás (Claude no pudo, no devolvió
 * JSON, tardó de más) puede ser de la Mac o de esta charla (una que el modelo se niega a contestar, o tan
 * larga que no llega a tiempo): dudosa. Tardar, además, suele arreglarse solo (transitorio).
 */
export function fallaDeLaMac(motivo) {
  const t = String(motivo || "");
  // La revisión de la Mac no pudo corregir algo grave de lo que redactó (tracker/dm_revisor.py, 20/10): es de esta
  // charla. El turno queda en espera y se reintenta; recién la tercera vez pasa a Cande (REINTENTO_MAX_FALLOS).
  if (/^revisi[oó]n:/i.test(t)) return { transitorio: false, general: false, dudosa: false };
  return { transitorio: /tard[oó] m[aá]s de/i.test(t), general: true, dudosa: !SIN_CLAUDE.test(t) };
}

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
  // Los links de las fotos del lead de ese turno (19/10). Se vacían con el turno.
  await sql`ALTER TABLE dm_trabajos ADD COLUMN IF NOT EXISTS imagenes JSONB NOT NULL DEFAULT '[]'::jsonb`;
  lista = true;
}

/* ---------- las cuatro consultas que usa la espera ---------- */

async function crearTrabajo(turno, linkDePago, imagenes = []) {
  await tablaTrabajos();
  const { rows } = await sql`
    INSERT INTO dm_trabajos (turno, link_de_pago, imagenes)
    VALUES (${JSON.stringify(turno)}::jsonb, ${linkDePago || ""}, ${JSON.stringify(imagenes || [])}::jsonb)
    RETURNING id`;
  return rows[0].id;
}

async function leerTrabajo(id) {
  const { rows } = await sql`SELECT estado, resultado FROM dm_trabajos WHERE id = ${id}`;
  return rows[0] || null;
}

async function vencerTrabajo(id) {
  await sql`UPDATE dm_trabajos SET estado = 'vencido', turno = '{}'::jsonb, imagenes = '[]'::jsonb WHERE id = ${id} AND estado <> 'hecho'`;
}

/** Usado el trabajo, no queda guardado lo que escribió el lead (ni los links de sus fotos) ni lo que contestó el modelo. */
async function vaciarTrabajo(id) {
  await sql`UPDATE dm_trabajos SET turno = '{}'::jsonb, imagenes = '[]'::jsonb, resultado = NULL WHERE id = ${id}`;
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
  return async function pedirLocal({ turno, linkDePago = "", imagenes = [] }) {
    // Sin fotos el trabajo es el de siempre (un cerebro de antes no nota la diferencia).
    const id = imagenes?.length ? await crear(turno, linkDePago, imagenes) : await crear(turno, linkDePago);
    for (let pasado = 0; pasado < tope_ms; pasado += cada_ms) {
      await esperar(cada_ms);
      const t = await leer(id);
      if (t?.estado !== "hecho") continue;
      await vaciar(id);
      if (t.resultado?.error) {
        // Lo que avisa la Mac (tardó de más, se quedó sin uso, no devolvió JSON) no pasa la charla a Cande
        // (19/10): el turno queda en espera y se reintenta cuando la Mac anda. Si es de esta charla o de la
        // Mac lo dice fallaDeLaMac.
        const motivo = String(t.resultado.error);
        throw new ModeloNoContesto(`el Claude de la Mac falló: ${motivo.slice(0, 200)}`, fallaDeLaMac(motivo));
      }
      const leida = Salida.safeParse(t.resultado);
      if (!leida.success) {
        // Una salida que no cumple el formato es de este turno: cuenta para el tope de esa charla.
        throw new ModeloNoContesto("la respuesta de la Mac no cumple el formato: " +
          leida.error.issues.map((i) => i.path.join(".")).join(", "), { general: false });
      }
      // Cuántas fotos pudo ver la Mac: lo dice el cerebro nuevo. Sin el dato, ninguna.
      const vistas = t.resultado.imagenes_vistas;
      return Number.isInteger(vistas) && vistas >= 0 ? { ...leida.data, _imagenes_vistas: vistas } : leida.data;
    }
    await vencer(id);
    throw new ModeloNoContesto("la Mac de Cande no contestó a tiempo (apagada, dormida o sin el cerebro corriendo)", { transitorio: true });
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
    RETURNING id, turno, link_de_pago, imagenes, EXTRACT(EPOCH FROM NOW() - creado)::float AS edad`;
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

/* ---------- hasta cuándo escucha la Mac (dm_config "cerebro_latido": { ms, hasta }) ---------- */

/** "hasta" nunca más adelante que esto: una Mac con el reloj corrido no deja al sitio creyendo que escucha horas. */
export const HASTA_TOPE_MS = 15 * 60000;
/**
 * Un cerebro de antes del 21/10 no manda "hasta": pregunta cada 10 segundos, siempre. Para él vale lo de antes: está
 * mientras su última pregunta tenga menos de 3 minutos (el latido se guarda una vez por minuto).
 */
export const LATIDO_SIN_HASTA_MS = 180000;
/** Con "hasta", el latido se reescribe si cambió o si tiene más de esto (para saber cuándo fue la última pregunta). */
export const LATIDO_REESCRIBIR_MS = 15000;
/** La Mac está encendida si preguntó hace menos de una vuelta de los crons y 5 minutos: solo para los textos y el estado. */
export const MAC_ENCENDIDA_MS = CADA_CRON_MS + 5 * 60000;

/**
 * Cuánto tiempo más tiene que seguir escuchando la Mac para cada cosa (ms). Un trabajo creado con ese margen lo toma
 * seguro: la Mac pregunta cada 3 segundos hasta "hasta".
 *   pedir        en el momento de crear el trabajo (armado.pedir): el portón que importa
 *   espera       al arrancar el cron de la espera; cada respuesta pasa además por el portón de pedir
 *   controlador  lo mismo para el controlador
 *   toque        justo antes de reclamar cada toque: lo que tarda un toque hasta pedir (reclamarlo lo saca de la fila)
 *   fotos        si el agente puede mirar las fotos: antes de la ráfaga de 8 segundos
 *   indicacion   una indicación de Cande por Telegram: si no, se guarda para la vuelta siguiente
 */
export const MARGEN_MS = { pedir: 5000, espera: 5000, controlador: 5000, toque: 60000, fotos: 15000, indicacion: 15000 };

/** Hasta cuándo (ms) va a seguir preguntando la Mac, según su latido guardado. null si nunca preguntó. */
export function hastaDelLatido(l) {
  const ms = Number(l?.ms);
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const hasta = l.hasta == null ? ms + LATIDO_SIN_HASTA_MS : Number(l.hasta);
  if (!Number.isFinite(hasta)) return null;
  return Math.min(hasta, ms + HASTA_TOPE_MS);
}

/** Si con ese latido la Mac va a seguir preguntando por lo menos `margenMs` más. */
export const escuchaSegun = (l, margenMs, ahora = Date.now()) => {
  const hasta = hastaDelLatido(l);
  return hasta !== null && ahora + margenMs < hasta;
};

/** Si con ese latido la Mac está prendida (preguntó hace poco), escuche ahora o no. */
export const encendidaSegun = (l, ahora = Date.now()) => {
  const ms = Number(l?.ms);
  return Number.isFinite(ms) && ms > 0 && ahora - ms < MAC_ENCENDIDA_MS;
};

/**
 * Lo que hay que guardar como latido después de una pregunta de la Mac, o null si no hace falta escribir. `dado` es
 * el "hasta" que mandó (ms). Sin él, un cerebro de antes: como antes, una vez por minuto y sin "hasta".
 */
export function latidoNuevo(previo, dado, ahora = Date.now()) {
  const antes = Number(previo?.ms) || 0;
  const n = Number(dado);
  if (dado == null || !Number.isFinite(n) || n <= 0) return ahora - antes > 60000 ? { ms: ahora } : null;
  const hasta = Math.round(Math.min(n, ahora + HASTA_TOPE_MS));
  if (previo?.hasta === hasta && ahora - antes <= LATIDO_REESCRIBIR_MS) return null;
  return { ms: ahora, hasta };
}

/** Latido del cerebro: la Mac preguntó y dice hasta cuándo va a seguir preguntando (`hasta`, ms). */
export async function latido(hasta) {
  const nuevo = latidoNuevo(await leerConfig("cerebro_latido"), hasta);
  if (nuevo) await guardarConfig("cerebro_latido", nuevo);
}

/** Si la Mac va a seguir preguntando por lo menos `margenMs` más (ver MARGEN_MS). */
export async function macEscuchando(margenMs) {
  return escuchaSegun(await leerConfig("cerebro_latido"), margenMs);
}

/** Si la Mac está prendida, aunque ahora no esté escuchando (entre una ventana y la otra). */
export async function macEncendida() {
  return encendidaSegun(await leerConfig("cerebro_latido"));
}

/** Para el estado (/api/dm/config) y las sesiones de Claude: cuándo preguntó por última vez y hasta cuándo escucha. */
export async function estadoDelCerebro(ahora = Date.now()) {
  const l = await leerConfig("cerebro_latido");
  const ms = Number(l?.ms);
  const hasta = hastaDelLatido(l);
  return {
    cerebro_local_hace_segundos: Number.isFinite(ms) && ms > 0 ? Math.round((ahora - ms) / 1000) : null,
    cerebro_ultima_vez: Number.isFinite(ms) && ms > 0 ? new Date(ms).toISOString() : null,
    cerebro_escucha_hasta: hasta !== null ? new Date(hasta).toISOString() : null,
    cerebro_escuchando: escuchaSegun(l, 0, ahora),
    cerebro_encendido: encendidaSegun(l, ahora),
  };
}

/** Los turnos traen lo que escribió el lead: no se guardan más de una semana. */
export async function borrarTrabajosViejos() {
  await tablaTrabajos();
  await sql`DELETE FROM dm_trabajos WHERE creado < NOW() - INTERVAL '7 days'`;
}
