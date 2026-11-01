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
export function crearEnvio({ manychat, ig = null, base, hayIg = () => true }) {
  /** El id de la persona en Instagram, o null si esta charla todavía no lo tiene. */
  async function igIdDe(id) {
    if (!ig?.mandarTextos || !hayIg()) return null;
    try {
      const c = await base.contacto(id);
      const igId = c?.ig_id ? String(c.ig_id).trim() : "";
      return /^\d{5,}$/.test(igId) ? igId : null;
    } catch {
      // Si la base no contesta, se manda por ManyChat: es peor no contestarle al lead.
      return null;
    }
  }

  /**
   * Devuelve { ok } o { ok: false, error, code, incierto }, igual que ManyChat.
   *
   * Si Instagram falla sin haber mandado nada, se reintenta por ManyChat: mientras ManyChat tenga
   * lugar, que el mensaje salga importa más que por dónde. Si Instagram YA mandó alguno de los
   * textos, no se reintenta: el lead recibiría dos veces lo mismo.
   */
  async function mandarTextos(id, textos) {
    const igId = await igIdDe(id);
    if (igId) {
      const r = await ig.mandarTextos(igId, textos);
      if (r.ok || r.incierto || r.mando > 0) return { ...r, por: "instagram" };
    }
    const r = await manychat.mandarTextos(id, textos);
    return { ...r, por: "manychat" };
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
