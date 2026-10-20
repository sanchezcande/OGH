// Salida por ManyChat, que es quien habla con Instagram por la API oficial.
//
// Config en Vercel: MANYCHAT_API_KEY (ManyChat > Ajustes > API). Nunca se registra ni se devuelve.
//
// Regla de Instagram que ManyChat hace cumplir: un automático solo puede escribir dentro de
// las 24 horas del último mensaje de la persona. Pasado eso, la API contesta con el error
// 3011 y no manda nada.
//
// Sin clave no se pudo llamar a ManyChat: las rutas, el formato del cuerpo y el de los errores
// salen de su especificación y se confirman en la primera prueba real con una cuenta de prueba.

const API = "https://api.manychat.com";

export const hayManyChat = () => Boolean(process.env.MANYCHAT_API_KEY);

async function llamar(ruta, cuerpo) {
  const clave = process.env.MANYCHAT_API_KEY;
  if (!clave) return { ok: false, error: "falta MANYCHAT_API_KEY" };
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(API + ruta, {
      method: "POST",
      headers: { Authorization: `Bearer ${clave}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(cuerpo),
      signal: ctrl.signal,
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.status === "success") return { ok: true };
    // El código dice por qué no salió: 3011 es la ventana de 24 horas cerrada.
    const detalle = [j.code && `código ${j.code}`, j.message, ...(j.details?.messages || []).map((m) => m.message)]
      .filter(Boolean).join(" | ");
    return { ok: false, status: r.status, code: j.code, error: (detalle || `ManyChat contestó ${r.status}`).slice(0, 300) };
  } catch (e) {
    // Si se cortó por tiempo, el pedido ya había salido: puede haber llegado igual. Quien llama
    // no lo puede dar por no enviado (si Cande lo reenvía a mano, sale dos veces).
    if (e.name === "AbortError") {
      return { ok: false, incierto: true, error: "ManyChat tardó más de 8 segundos: puede haber salido igual" };
    }
    return { ok: false, error: e.message };
  } finally {
    clearTimeout(t);
  }
}

// La especificación de ManyChat declara subscriber_id como número, y acá el id se guarda como
// texto. Si es todo dígitos va como número; si no, tal cual. Se confirma en la primera prueba real.
const idNumerico = (contacto) => (/^\d{1,15}$/.test(String(contacto)) ? Number(contacto) : contacto);

/**
 * Manda de 1 a 3 mensajes de texto a un contacto de Instagram, dentro de las 24 h desde su último mensaje.
 * Sin etiqueta a propósito: ManyChat no acepta HUMAN_AGENT por la API en Instagram (20/10, "Unsupported message
 * tag"). Pasadas las 24 h solo se puede contestar a mano, desde Instagram o el Live Chat de ManyChat.
 */
export function mandarTextos(contacto, textos) {
  return llamar("/fb/sending/sendContent", {
    subscriber_id: idNumerico(contacto),
    data: {
      version: "v2",
      content: { type: "instagram", messages: textos.map((text) => ({ type: "text", text })) },
    },
  });
}

/** Cambia un campo del contacto. Una Regla de ManyChat lo mira para pausar sus automáticos. */
export function ponerCampo(contacto, campo, valor) {
  return llamar("/fb/subscriber/setCustomFieldByName", {
    subscriber_id: idNumerico(contacto), field_name: campo, field_value: valor,
  });
}

/** Le pone una etiqueta al contacto. La del agente (agente_dm) es la que deja pasar sus mensajes al flujo. */
export function ponerEtiqueta(contacto, etiqueta) {
  return llamar("/fb/subscriber/addTagByName", { subscriber_id: idNumerico(contacto), tag_name: etiqueta });
}

/** Una consulta GET a ManyChat: { ok, data } o { ok: false, error }. Nunca tira. */
async function consultar(ruta) {
  const clave = process.env.MANYCHAT_API_KEY;
  if (!clave) return { ok: false, error: "falta MANYCHAT_API_KEY" };
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(API + ruta, { headers: { Authorization: `Bearer ${clave}`, Accept: "application/json" }, signal: ctrl.signal });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.status !== "success") return { ok: false, error: (j.message || `ManyChat contestó ${r.status}`).slice(0, 200) };
    return { ok: true, data: j.data };
  } catch (e) {
    return { ok: false, error: e.name === "AbortError" ? "ManyChat tardó más de 8 segundos" : e.message };
  } finally {
    clearTimeout(t);
  }
}

/**
 * Los datos de Instagram de un contacto: su usuario y el id que le da ManyChat. Los usa la lectura
 * directa de Instagram (lib/dm/instagram.js) para encontrar su charla. ManyChat deja 10 por segundo.
 */
export async function datosDe(contacto) {
  const r = await consultar(`/fb/subscriber/getInfo?subscriber_id=${encodeURIComponent(String(contacto))}`);
  if (!r.ok) return r;
  return { ok: true, ig_username: r.data?.ig_username || "", ig_id: r.data?.ig_id ?? null };
}

/**
 * Los contactos de ManyChat con ese nombre (su búsqueda por nombre, hasta 100): [{ id, nombre, ig_username, ig_id }].
 * ig_username e ig_id quedan en null si ManyChat no los trae en la búsqueda: hay que pedírselos con datosDe.
 * La usa la red de la bandeja (lib/dm/bandeja.js) para saber quién es en ManyChat alguien que escribió por
 * Instagram y nunca llegó por la entrada. ManyChat no busca por usuario de Instagram.
 */
export async function buscarPorNombre(nombre) {
  const n = String(nombre || "").trim();
  if (!n) return { ok: true, contactos: [] };
  const r = await consultar(`/fb/subscriber/findByName?name=${encodeURIComponent(n)}`);
  if (!r.ok) return r;
  const lista = Array.isArray(r.data) ? r.data : [];
  return {
    ok: true,
    contactos: lista.filter((s) => s && s.id != null).map((s) => ({
      id: String(s.id),
      nombre: String(s.name || [s.first_name, s.last_name].filter(Boolean).join(" ") || "").trim() || null,
      ig_username: s.ig_username == null ? null : String(s.ig_username),
      ig_id: s.ig_id == null || s.ig_id === "" ? null : String(s.ig_id),
    })),
  };
}
