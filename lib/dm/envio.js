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
 * `base` lib/dm/base.js (de ahí sale el ig_id del contacto). `hayIg` dice si hay token de Instagram.
 */
export function crearEnvio({ manychat, ig = null, base, hayIg = () => Boolean(process.env.INSTAGRAM_TOKEN) }) {
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

  return { mandarTextos, hayManyChat: manychat.hayManyChat };
}
