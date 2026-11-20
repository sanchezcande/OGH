// Mandar por WhatsApp (Cloud API de Meta).
//
//     POST https://graph.facebook.com/v23.0/<WHATSAPP_PHONE_NUMBER_ID>/messages
//     Authorization: Bearer <WHATSAPP_TOKEN>
//
// Lo único que manda esto es TEXTO LIBRE, y texto libre se puede mandar solo adentro de la ventana
// de 24 horas desde el último mensaje de la persona. Fuera de esa ventana Meta lo rechaza (error
// 131047) y la única forma de escribir primero es una plantilla aprobada. Las plantillas las manda
// el otro lado, el de salida: tracker/recordatorio_llamadas.py, en el repo Personal Brand. Acá no
// hay ninguna a propósito: lo que sale por este archivo es siempre una respuesta de Cande a algo
// que la persona escribió, y eso siempre cae adentro de la ventana.
//
// Mientras el número no esté dado de alta (al 10/11 falta un chip argentino) las dos variables no
// están y todo esto queda inerte: mandar devuelve { ok: false, sinConfigurar: true } y nadie se
// cae. En Vercel hacen falta:
//   WHATSAPP_TOKEN            → token permanente del usuario del sistema de la app de Meta
//   WHATSAPP_PHONE_NUMBER_ID  → el id del número dado de alta (NO el número en sí)

const VERSION = "v23.0";

/** Se leen en cada llamada y no al cargar el archivo: cambiarlas en el entorno no pide reiniciar. */
const token = () => process.env.WHATSAPP_TOKEN || "";
const numeroId = () => process.env.WHATSAPP_PHONE_NUMBER_ID || "";

/** Está el número dado de alta y con token? Sin esto no sale nada por WhatsApp. */
export const hayWhatsapp = () => Boolean(token() && numeroId());

/** El tope de un mensaje de texto de WhatsApp. */
export const TOPE_TEXTO = 4096;

/**
 * Los errores de Meta que significan "pasó la ventana de 24 horas": hay que escribirle con una
 * plantilla aprobada o esperar a que escriba la persona.
 *   131047 → el mensaje necesita una plantilla (la ventana se cerró)
 *   470    → el mismo caso, como lo devolvía la versión vieja de la API
 */
const FUERA_DE_VENTANA = [131047, 470];

/** Los que dicen que al número no le llega nada: no existe en WhatsApp, o bloqueó a la cuenta. */
const NO_LLEGA = [131026, 131052, 131053];

/**
 * Manda un texto a un número (solo dígitos, con código de país). Devuelve:
 *   { ok: true, id }                        salió, con el id del mensaje en WhatsApp
 *   { ok: false, sinConfigurar: true }      falta el token o el número: no se intentó
 *   { ok: false, fueraDeVentana: true }     pasaron más de 24 horas desde que escribió
 *   { ok: false, noLlega: true, ... }       ese número no recibe (no tiene WhatsApp, o bloqueó)
 *   { ok: false, incierto: true, ... }      se cortó por tiempo: pudo haber salido, no se repite
 *   { ok: false, error, code }              cualquier otra cosa que dijo Meta
 *
 * Nunca tira: el que llama tiene que poder contarle a Cande qué pasó, no caerse.
 */
export async function mandarTexto(telefono, texto, { espera = 15000 } = {}) {
  const t = String(texto ?? "").trim();
  const numero = String(telefono ?? "").replace(/\D/g, "");
  if (!hayWhatsapp()) return { ok: false, sinConfigurar: true };
  if (!numero) return { ok: false, error: "sin número" };
  if (!t) return { ok: false, error: "sin texto" };
  if (t.length > TOPE_TEXTO) return { ok: false, error: `el texto pasa los ${TOPE_TEXTO} caracteres` };

  const ctrl = new AbortController();
  const reloj = setTimeout(() => ctrl.abort(), espera);
  try {
    const r = await fetch(`https://graph.facebook.com/${VERSION}/${numeroId()}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: numero,
        type: "text",
        text: { preview_url: false, body: t },
      }),
      signal: ctrl.signal,
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j?.messages?.[0]?.id) return { ok: true, id: String(j.messages[0].id) };
    const e = j?.error || {};
    const code = Number(e.code);
    // Sin ids ni textos en el registro: el mensaje es de un lead y el número, un dato personal.
    console.error("whatsapp: no salió", r.status, code || "", String(e.error_subcode || ""));
    if (FUERA_DE_VENTANA.includes(code)) return { ok: false, fueraDeVentana: true, code };
    if (NO_LLEGA.includes(code)) return { ok: false, noLlega: true, code, error: String(e.message || "no le llega").slice(0, 200) };
    return { ok: false, code: code || r.status, error: String(e.message || `Meta contestó ${r.status}`).slice(0, 200) };
  } catch (err) {
    // Un corte por tiempo o de red: el pedido pudo haber llegado igual, así que no se repite solo.
    console.error("whatsapp: falló el envío:", err.name === "AbortError" ? "se cortó por tiempo" : err.message);
    return { ok: false, incierto: true, error: err.name === "AbortError" ? "se cortó por tiempo" : err.message };
  } finally {
    clearTimeout(reloj);
  }
}
