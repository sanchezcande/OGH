// La etiqueta "sin_intencion" de ManyChat (30/10, Cande: "puede el agente leer cuando hay intención CERO de compra y
// matarlo de ManyChat?"). ManyChat cobra por contacto activo y la cuenta ya pasó los 2.500. Su API no deja borrar ni
// desuscribir a nadie (solo crear, cambiar, etiquetas y campos), así que el agente le pone esta etiqueta a quien no
// tiene intención de compra y Cande los borra o desuscribe en tanda desde ManyChat, filtrando por ella.
//
// La llevan solo (criterio aprobado por Cande el 30/10):
//   - quien no es dev (estado.quien "no_dev": no tech, coqueteo, halagos, gente de citas) en una charla del agente;
//   - las charlas personales (dm_contactos.personal: las borró el agente porque no era un lead, o Cande con "borrar").
// Quien dijo que no le interesa sin ser dev ya está en la primera: cualquier otro quien es de la lista de abajo.
// Nunca: devs (aunque no busquen), estudiantes, empresas o founders, "no_se_sabe", compradores (la base dice que compró,
// le salió el código del pago en pesos, el contexto de la charla dice que compró o el modelo vio el pago) ni las charlas
// de Cande por otra razón que no sea personal. Tampoco quien habló de un pago o dio una señal de empresa (lib/dm/frenos.js,
// senales): ante la duda, no. Si deja de cumplirlo (pasa a dev, la toma Cande, compró), se le saca.
//
// La etiqueta se mira cuando puede cambiar (lib/dm/agente.js: el turno, el pase a Cande, la charla personal que se
// borra; /api/dm/config: borrar y dueno) y en el barrido (/api/dm/config, accion sin_intencion), que también corrige a
// quien la tiene y ya no la lleva. Siempre con lo que dice la base (paraSinIntencion en lib/dm/base.js), así el turno y
// el barrido deciden con lo mismo. Si ManyChat falla, no frena nada: dm_contactos.sin_intencion_en queda como estaba y
// lo intenta el turno siguiente o el barrido. Nada de esto registra textos de los leads ni sus ids.
import { plano, senales } from "./frenos";

export const ETIQUETA_SIN_INTENCION = "sin_intencion";

/** Cuántos contactos toca como mucho un pedido del barrido, si no se dice, y el tope. */
export const TANDA_SIN_INTENCION = 25;
export const TANDA_MAX_SIN_INTENCION = 100;
// ManyChat deja 10 pedidos por segundo: el barrido va de a uno y con esta pausa entre uno y otro.
const PAUSA_MS = 150;

// Lo que en el contexto de una charla (lo escribe Cande al sembrarla) dice que compró. En plano: sin tildes ni mayúsculas.
const COMPRO = /\b(compr(o|e|aste|aron|ador|adora)|ya pag(o|e|aste|aron)|pag(o|aron) el (programa|acceso|1 a 1)|alumn[oa]s?|tiene (el )?(programa|acceso)|cliente)\b/;

/**
 * Si el contexto de la charla dice que compró. El de las altas (ajuste contexto_alta: qué le mandó el automático antes)
 * es el mismo para todos y no dice nada de esta persona: no cuenta.
 */
export function dijoQueCompro(contexto, contextoAlta = "") {
  const t = String(contexto || "").trim();
  if (!t || t === String(contextoAlta || "").trim()) return false;
  return COMPRO.test(plano(t));
}

/**
 * Por qué este contacto no lleva la etiqueta, o null si la lleva.
 * `quien`: lo último que dijo el modelo (estado.quien). `personal`, `dueno` y `contexto`: los de dm_contactos.
 * `compro`: la base dice que compró o le salió el código del pago en pesos. `charlaDelLead`: todo lo que escribió el
 * lead (también lo que se habló por Instagram antes de la base).
 */
export function motivoSinIntencion({
  quien = null, personal = false, dueno = null, compro = false, contexto = "", contextoAlta = "", charlaDelLead = [],
} = {}) {
  if (compro === true) return "compró";
  if (dijoQueCompro(contexto, contextoAlta)) return "el contexto dice que compró";
  // Un dev, un estudiante, una empresa, alguien que construye algo o de quien no se sabe: nunca.
  if (quien && quien !== "no_dev") return `es ${quien}`;
  // Una charla personal ya no tiene nada guardado (borrarCharla): cuenta lo que dice la base de compras.
  if (personal === true) return null;
  if (dueno !== "agente") return "es de Cande";
  if (quien !== "no_dev") return "no se sabe quién es";
  const lead = senales((charlaDelLead || []).map((t) => String(t ?? "")));
  if (lead.pagos) return "habló de un pago";
  if (lead.empresa || lead.contrataDevs) return "dio una señal de empresa";
  return null;
}

/** Lo que escribió el lead en una fila de paraSinIntencion: lo de Instagram antes de la base y lo guardado. */
function charlaDeLaFila(f) {
  const previo = (Array.isArray(f?.previo_ig) ? f.previo_ig : []).filter((m) => m?.quien === "lead").map((m) => String(m.texto ?? ""));
  return [...previo, ...(Array.isArray(f?.del_lead) ? f.del_lead : [])];
}

const datosDeLaFila = (f, contextoAlta) => ({
  quien: f.quien || null, personal: f.personal === true, dueno: f.dueno, compro: f.compro === true, contexto: f.contexto,
  contextoAlta, charlaDelLead: charlaDeLaFila(f),
});

/** Un renglón para el registro, sin ids ni textos de nadie (como armado.registrar). */
function registrar(que, detalle) {
  console.error(`dm: sin_intencion, ${que}`, String(detalle ?? "").replace(/\d{6,}/g, "…").slice(0, 160));
}

/**
 * Le pone (lleva: true) o le saca la etiqueta al contacto `c` ({ id, sin_intencion_en }) y lo anota en la base. Una sola
 * vez: si ya está como tiene que estar, no hace nada (null). true si quedó; false si ManyChat o la base fallaron: queda
 * como estaba y lo intenta la próxima vez. Nunca tira.
 */
export async function etiquetarSinIntencion({ base, manychat }, c, lleva) {
  try {
    if (!c?.id || Boolean(lleva) === Boolean(c.sin_intencion_en)) return null;
    const llamar = lleva ? manychat?.ponerEtiqueta : manychat?.quitarEtiqueta;
    if (typeof llamar !== "function" || typeof base?.marcarSinIntencion !== "function") return null;
    const r = await llamar(c.id, ETIQUETA_SIN_INTENCION);
    if (!r?.ok) {
      registrar(`ManyChat no la ${lleva ? "puso" : "sacó"}`, r?.error || "sin respuesta");
      return false;
    }
    await base.marcarSinIntencion(c.id, Boolean(lleva));
    return true;
  } catch (e) {
    registrar("falló", e?.message);
    return false;
  }
}

/**
 * Mira con lo que dice la base si el contacto `id` lleva la etiqueta y se la pone o se la saca (etiquetarSinIntencion).
 * `pagoPesos`: lo que el modelo vio del pago en este turno (si vio algo, no la lleva). `contextoAlta`: el ajuste, si ya
 * está a mano (si no, se lee). null si no hay nada que hacer. Nunca tira: es lo último de un turno que ya salió.
 */
export async function revisarSinIntencion({ base, manychat }, id, { contextoAlta, pagoPesos = null } = {}) {
  try {
    if (!id || typeof base?.paraSinIntencion !== "function") return null;
    const [fila] = await base.paraSinIntencion({ id: String(id) });
    // Ni la tiene, ni es personal, ni es no_dev en una charla del agente: no hay nada que mirar.
    if (!fila) return null;
    const alta = contextoAlta !== undefined ? contextoAlta : (await base.ajustes())?.contexto_alta;
    const lleva = !pagoPesos && motivoSinIntencion(datosDeLaFila(fila, alta)) === null;
    return await etiquetarSinIntencion({ base, manychat }, { id: fila.id, sin_intencion_en: fila.etiquetado }, lleva);
  } catch (e) {
    registrar("no la pude revisar", e?.message);
    return false;
  }
}

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * El barrido de los que ya existen. Con dry (lo que pasa si no se dice dry: false) no escribe nada, ni en ManyChat ni en
 * la base: dice cuántos la llevarían, cuántos la tienen y ya no, por qué no la llevan los demás, y una muestra de hasta
 * `limite` ({ id, quien, personal }, sin textos). Sin dry, de a uno y con pausa (ManyChat deja 10 por segundo): primero
 * les saca la etiqueta a quienes ya no la llevan (Cande borra por la etiqueta: ahí no puede quedar nadie que no va) y
 * después se la pone a los que faltan, hasta `limite` o hasta la hora `hasta`. `quedan`: lo que falta para otra tanda.
 */
export async function barrerSinIntencion({ base, manychat, dry = true, limite = TANDA_SIN_INTENCION, hasta = Infinity, esperar = dormir }) {
  const alta = (await base.ajustes())?.contexto_alta;
  const filas = await base.paraSinIntencion();
  const poner = [];
  const sacar = [];
  const noLaLlevan = {};
  for (const f of filas) {
    const motivo = motivoSinIntencion(datosDeLaFila(f, alta));
    if (motivo === null && !f.etiquetado) poner.push(f);
    else if (motivo !== null && f.etiquetado) sacar.push(f);
    else if (motivo !== null) noLaLlevan[motivo] = (noLaLlevan[motivo] || 0) + 1;
  }
  const resumen = { ok: true, dry, para_poner: poner.length, para_sacar: sacar.length, no_la_llevan: noLaLlevan };
  const fichas = (lista) => lista.slice(0, limite).map((f) => ({ id: f.id, quien: f.quien || null, personal: f.personal === true }));
  if (dry) return { ...resumen, muestra: fichas(poner), muestra_sacar: fichas(sacar) };

  const cola = [...sacar.map((f) => [f, false]), ...poner.map((f) => [f, true])].slice(0, limite);
  // La etiqueta tiene que existir en la cuenta para ponerla: se crea antes, por si falta (si ya existe, no pasa nada).
  if (poner.length && cola.length && typeof manychat?.crearEtiqueta === "function") {
    try {
      await manychat.crearEtiqueta(ETIQUETA_SIN_INTENCION);
    } catch {
      // si no se pudo crear, lo dice el primero que falle al ponerla
    }
    await esperar(PAUSA_MS);
  }
  let puestas = 0;
  let sacadas = 0;
  const fallaron = [];
  for (let i = 0; i < cola.length && Date.now() < hasta; i++) {
    if (i) await esperar(PAUSA_MS);
    const [f, lleva] = cola[i];
    const r = await etiquetarSinIntencion({ base, manychat }, { id: f.id, sin_intencion_en: f.etiquetado }, lleva);
    if (r === true && lleva) puestas++;
    else if (r === true) sacadas++;
    else fallaron.push(f.id);
  }
  return {
    ...resumen, puestas, sacadas, fallaron: fallaron.slice(0, 20), quedan: poner.length + sacar.length - puestas - sacadas,
  };
}
