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

/** Manda de 1 a 3 mensajes de texto a un contacto de Instagram. */
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
