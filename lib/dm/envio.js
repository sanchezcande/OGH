// Por dónde sale lo que escribe el agente.
//
// Hasta el 29/10 todo salía por ManyChat, que es quien hablaba con Instagram. El problema es que
// ManyChat cobra por contacto: cada persona nueva que contesta una historia se vuelve un contacto
// pago, haya comprado o no. Entre el 28 y el 29/10 entraron más de 500 seguidores en un día y la
// cuenta quedó contra el techo del plan.
//
// Instagram deja mandar con el mismo permiso con el que el sitio ya lee las charlas
// (instagram_business_manage_messages), y por ahí no hay tope ni costo por persona. Así que de acá
// en adelante se intenta primero por Instagram y ManyChat queda de respaldo.
//
// Para mandar por Instagram hace falta el id de la persona EN Instagram (dm_contactos.ig_id), que
// no es el de ManyChat. Lo anota la red de la bandeja (lib/dm/bandeja.js) cuando ve la charla. Si
// una charla todavía no lo tiene, sale por ManyChat como antes: nadie se queda sin respuesta.
//
// Tiene la forma de lib/dm/manychat.js a propósito: el agente no sabe por dónde salió su mensaje.
//
// Un contacto solo de Instagram (02/11, esSoloInstagram en lib/dm/manychat.js: su id es su IGSID) sale siempre
// por Instagram, con su propio id, sin ir a la base a buscar el ig_id. Si Instagram no deja, no hay respaldo:
// ManyChat no lo conoce. Queda el error, igual que "sin ig_id y sin ManyChat".
import { esSoloInstagram } from "./manychat";

/**
 * `manychat` es lib/dm/manychat.js, `ig` el cliente de lib/dm/instagram.js (con mandarTextos) y
 * `base` lib/dm/base.js (de ahí sale el ig_id del contacto). `hayIg` apaga Instagram si devuelve false.
 *
 * Por defecto se intenta siempre. Hasta el 01/11 esto miraba INSTAGRAM_TOKEN, pero el cliente que le
 * pasa lib/dm/armado.js manda con el permiso del sitio (tokens_redes "ig", desde el #69 del 17/10) y
 * esa variable no está en Vercel: el agente NUNCA mandaba por Instagram. Con ManyChat en el tope de
 * contactos, lo que les salía a los contactos nuevos quedaba "incierta" y no llegaba: el 31/10 y el
 * 01/11, diez pedidos de CV por DM y cuatro respuestas del agente. Si el permiso falta, Instagram
 * falla sin mandar nada y se sigue por ManyChat como antes.
 */
/** Cuántas páginas de la bandeja se miran buscando la charla de un contacto sin ig_id. */
export const PAGINAS_BUSCANDO = 2;

export function crearEnvio({ manychat, ig = null, base, hayIg = () => true, paginas = PAGINAS_BUSCANDO }) {
  /** El id de la persona en Instagram, o null si no se pudo saber cuál es. */
  async function igIdDe(id) {
    if (!ig?.mandarTextos || !hayIg()) return null;
    try {
      const c = await base.contacto(id);
      const igId = c?.ig_id ? String(c.ig_id).trim() : "";
      if (/^\d{5,}$/.test(igId)) return igId;
      return await buscarEnLaBandeja(id, c);
    } catch {
      // Si la base no contesta, se manda por ManyChat: es peor no contestarle al lead.
      return null;
    }
  }

  /**
   * El contacto no tiene ig_id guardado: se lo busca en las primeras páginas de la bandeja por su
   * usuario de Instagram. Una sola vez en la vida del contacto (la marca es dm_contactos.ig_buscado).
   *
   * Por qué una vez y por qué tan poco: al 01/11 hay 620 contactos sin ig_id, pero solo unos 56 con
   * movimiento en la última semana, y esto solo hace falta cuando escribimos nosotros primero (los
   * toques), porque al que escribe lo trae la red de la bandeja con su id. Probado contra la bandeja
   * real: de 542 contactos con usuario y sin id, 1250 hilos leídos emparejaron uno solo. Sus charlas
   * son más viejas que eso, así que barrer miles de hilos es gastar la cuota de Instagram para nada.
   */
  async function buscarEnLaBandeja(id, c) {
    const usuario = String(c?.ig_usuario || "").trim().toLowerCase();
    if (!usuario || c?.ig_buscado || !ig.pagina || !base.marcarIgBuscado) return null;
    let encontrado = null;
    try {
      let despues = null;
      for (let i = 0; i < paginas && !encontrado; i++) {
        const { lista, despues: sig } = await ig.pagina({ limite: 50, mensajes: 1, despues });
        for (const h of lista || []) {
          const u = String(h?.otro?.usuario || "").toLowerCase();
          const otroId = String(h?.otro?.id || "");
          if (u === usuario && /^\d{5,}$/.test(otroId)) { encontrado = otroId; break; }
        }
        if (!sig) break;
        despues = sig;
      }
    } catch {
      // Instagram no contestó: no se marca como buscado, así la próxima vez se vuelve a intentar.
      return null;
    }
    await base.marcarIgBuscado(id);
    if (encontrado && base.guardarIg) await base.guardarIg(id, { igId: encontrado });
    return encontrado;
  }

  /**
   * Devuelve { ok } o { ok: false, error, code, incierto }, igual que ManyChat.
   *
   * Si Instagram falla sin haber mandado nada, se reintenta por ManyChat: mientras ManyChat tenga
   * lugar, que el mensaje salga importa más que por dónde. Si Instagram YA mandó alguno de los
   * textos, no se reintenta: el lead recibiría dos veces lo mismo.
   */
  async function mandarTextos(id, textos) {
    const soloIg = esSoloInstagram(id);
    const igId = soloIg ? (ig?.mandarTextos && hayIg() ? String(id) : null) : await igIdDe(id);
    let porIg = null;
    if (igId) {
      porIg = await ig.mandarTextos(igId, textos);
      if (porIg.ok || porIg.incierto || porIg.mando > 0) {
        await marcarQueContesto(id);
        return { ...porIg, por: "instagram" };
      }
    }
    // Solo de Instagram (02/11): ManyChat no lo conoce, así que no hay reintento. El error dice por qué no salió,
    // como "sin ig_id y sin ManyChat" más abajo: quien llamó no cree que salió (y un toque se cancela).
    if (soloIg) {
      const motivo = porIg?.error || "no se puede mandar por Instagram desde acá";
      return { ...(porIg || {}), ok: false, por: "ninguno", error: `solo de Instagram y no salió por ahí: no hay respaldo por ManyChat (${motivo})` };
    }
    const r = await manychat.mandarTextos(id, textos);
    if (r.ok || r.incierto) await marcarQueContesto(id);
    // Sin ig_id y sin ManyChat no hay por dónde: que el error lo diga, así el que llamó no cree que
    // salió. Cuando ManyChat se borre, este es el camino de los contactos que nunca vimos en la
    // bandeja, y lo correcto ahí es cancelar el toque, no inventar un envío.
    if (!r.ok && !r.incierto && !manychat.hayManyChat?.()) {
      return { ...r, por: "ninguno", error: `sin ig_id y sin ManyChat no hay por dónde mandarle${r.error ? ` (${r.error})` : ""}` };
    }
    return { ...r, por: "manychat" };
  }

  // Que ManyChat sepa que la cuenta ya le escribió (02/11). Su automatización "Seguimiento lista CV (6 h sin escribir)"
  // sale con la condición "dm_accion es desconocido", y con el envío por la API ese campo no se llenaba nunca: al lead
  // le llegaba un "pudiste anotarte?" de más aunque el agente ya le hubiera escrito, y Cande pidió un solo seguimiento.
  // Una vez por contacto en cada instancia, y si falla no frena el envío (se intenta de nuevo la próxima vez).
  const marcados = new Set();
  async function marcarQueContesto(id) {
    const clave = String(id);
    // Un contacto solo de Instagram no tiene automatizaciones de ManyChat que frenar.
    if (marcados.has(clave) || esSoloInstagram(id) || typeof manychat.ponerCampo !== "function" || manychat.hayManyChat?.() === false) return;
    marcados.add(clave);
    try {
      const r = await manychat.ponerCampo(id, "dm_accion", "agente");
      if (r && r.ok === false) marcados.delete(clave);
    } catch {
      marcados.delete(clave);
    }
  }

  // Todo lo demás del cliente de ManyChat pasa tal cual, y no solo hayManyChat. El agente le pide
  // más cosas que mandar mensajes: `ponerCampo(id, "dm_dueno", "cande")`, que es lo que pausa los
  // automáticos de ManyChat cuando una charla pasa a Cande, y `datosDe` para el link del aviso.
  //
  // Del 30/10 (el PR que trajo este archivo) al 31/10 esto devolvía solo las dos funciones de abajo,
  // así que el envío tapaba al cliente entero: una charla que pasaba a Cande quedaba con los
  // automáticos de ManyChat prendidos y el aviso avisaba "no pude pausar los automáticos".
  //
  // Por eso se copia el cliente y se reemplaza SOLO el envío: lo que el agente no sabe que cambió,
  // no se puede romper.
  return { ...manychat, mandarTextos };
}
