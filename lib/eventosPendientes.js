// Los eventos del embudo (/api/evento y los clicks de los mails, /api/ir) se juntan fuera de la base y pasan a
// funnel_eventos en la vuelta de los crons (21/10).
//
// Por qué: la base de Neon se apaga sola a los 5 minutos sin consultas y cobra por hora prendida. Cada visita a /devs,
// /hola o /preguntas manda varios eventos (form_visto, paso_2, video_25...), y cada uno escribía en la base en el
// momento: una visita a los 8 minutos de una vuelta la despertaba de nuevo y la dejaba prendida 5 minutos más. Ahora
// cada evento queda como un archivo vacío en el Blob privado del sitio (el mismo de los CVs), con todo lo que hace
// falta en el nombre, y el cron de la cola (/api/cola-publicar, que despierta la base igual en cada vuelta) los pasa
// todos de una vez. El formulario (/api/devs-red) y los pagos se siguen guardando en el momento: son pocos y valen.
//
// El nombre: embudo-pendiente/<fase>/<sid>.<ms>.<azar>. La fase ya viene validada por quien llama (solo letras,
// números, _ y -) y el sid es el id al azar del navegador (lib/embudo.js, letras y números); si viene otra cosa, va
// "_" (sin sid). `ms` es la hora en que llegó: así queda en funnel_eventos la hora de la visita y no la del pase. El
// nombre entero es la clave del evento en funnel_eventos: si una tanda se pasa dos veces (el borrado falló), no queda
// repetida.
//
// Las dependencias (el Blob, la base) entran por parámetro para probarlo sin red.
import { randomBytes } from "node:crypto";
import { del, list, put } from "@vercel/blob";
import { guardarEvento, guardarEventosJuntados, hayBase } from "./db";

export const CARPETA = "embudo-pendiente/";
const FASE = /^[a-z0-9_-]{1,80}$/;
const SID = /^[A-Za-z0-9]{1,40}$/;
/** Cuántos se piden por vez al Blob, y cuántas veces como mucho en una vuelta (lo que sobre, en la siguiente). */
const POR_PAGINA = 500;
const PAGINAS_POR_VUELTA = 20;

/** Un evento juntado, leído de su nombre: { fase, sid, creado, clave }, o null si el nombre no es de acá. */
export function eventoDe(pathname) {
  const p = String(pathname || "");
  if (!p.startsWith(CARPETA)) return null;
  const [fase, resto, ...mas] = p.slice(CARPETA.length).split("/");
  if (mas.length || !FASE.test(fase || "")) return null;
  const [sid, ms, azar, ...otros] = String(resto || "").split(".");
  const creado = Number(ms);
  if (otros.length || !azar || !Number.isFinite(creado) || creado <= 0) return null;
  return { fase, sid: SID.test(sid) ? sid : null, creado: new Date(creado), clave: p };
}

export function crearEventosPendientes({
  blob = { put, list, del }, guardar = guardarEventosJuntados, hay = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  ahora = () => Date.now(), azar = () => randomBytes(6).toString("hex"),
} = {}) {
  return {
    /** Si se pueden juntar (el sitio tiene el Blob). Si no, quien llama guarda en la base como antes. */
    hay,

    /** Junta un evento para la vuelta. Tira si no pudo: quien llama lo guarda directo en la base, para no perderlo. */
    async juntar(fase, sid) {
      const f = String(fase || "");
      if (!FASE.test(f)) throw new Error("fase con caracteres que no van en el nombre");
      const s = SID.test(String(sid || "")) ? String(sid) : "_";
      await blob.put(`${CARPETA}${f}/${s}.${ahora()}.${azar()}`, "1", {
        access: "private", addRandomSuffix: false, contentType: "text/plain",
      });
    },

    /**
     * Pasa a funnel_eventos todo lo juntado y lo borra del Blob, de a POR_PAGINA, hasta la hora `hasta` (y como mucho
     * PAGINAS_POR_VUELTA). Cada página se pide de nuevo desde el principio: la anterior ya se borró, y seguir con el
     * cursor de una lista a la que se le borró lo de adelante puede saltear eventos. Lo que no se pudo leer (un nombre
     * que no es de acá) se borra igual. Si guardar falla, no se borra nada de esa página: se pasa en la vuelta
     * siguiente. Devuelve { leidos, guardados } (guardados: los nuevos en la base).
     */
    async pasar({ hasta = Infinity } = {}) {
      let leidos = 0;
      let guardados = 0;
      for (let pagina = 0; pagina < PAGINAS_POR_VUELTA; pagina++) {
        const r = await blob.list({ prefix: CARPETA, limit: POR_PAGINA });
        const blobs = r?.blobs || [];
        const eventos = blobs.map((b) => eventoDe(b.pathname)).filter(Boolean);
        if (eventos.length) guardados += Number(await guardar(eventos)) || 0;
        leidos += eventos.length;
        if (blobs.length) await blob.del(blobs.map((b) => b.url));
        if (!r?.hasMore || ahora() >= hasta) break;
      }
      return { leidos, guardados };
    },
  };
}

export const eventosPendientes = crearEventosPendientes();

/**
 * Lo que hacen /api/evento y /api/ir con cada evento: lo junta para la vuelta de los crons y, si no se puede (sin el
 * Blob, o el Blob falló), lo guarda en la base en el momento, como antes: el dato no se pierde. Tira solo si falla
 * la base (quien llama lo registra y sigue: medir nunca rompe la página ni el click).
 */
export async function guardarOJuntar(fase, sid, { pendientes = eventosPendientes, guardar = guardarEvento, base = hayBase } = {}) {
  if (pendientes.hay()) {
    try {
      await pendientes.juntar(fase, sid);
      return "juntado";
    } catch (e) {
      console.error("evento: no se pudo juntar, va directo a la base:", e.message);
    }
  }
  if (base()) {
    await guardar(fase, sid || null);
    return "guardado";
  }
  return "nada";
}
