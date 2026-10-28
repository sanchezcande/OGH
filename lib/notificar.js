// Aviso por Telegram cuando entra un lead.
//
// Es "dispará y olvidate" a propósito: si Telegram no está configurado, se cae,
// o tarda, el lead YA está guardado en Postgres. El aviso nunca puede romper ni
// demorar la respuesta al que completó el formulario.
//
// Config en Vercel:
//   TELEGRAM_BOT_TOKEN  → el que te da @BotFather
//   TELEGRAM_CHAT_ID    → tu chat con el bot (o el id de un grupo, empieza con -)
//   TELEGRAM_DM_BOT_TOKEN → (opcional) un bot aparte para los avisos del agente de DM: llegan a tu
//                           chat con ese bot (hay que haberle dado Iniciar) y no se mezclan con los devs

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT = process.env.TELEGRAM_CHAT_ID;
const TOKEN_DM = process.env.TELEGRAM_DM_BOT_TOKEN;

export const hayTelegram = () => Boolean(TOKEN && CHAT);
/** Hay bot aparte para el agente de DM. Va a tu chat privado: con un grupo en TELEGRAM_CHAT_ID no sirve. */
export const hayBotDm = () => Boolean(TOKEN_DM && /^\d+$/.test(String(CHAT || "")));
export const tokenBotDm = () => (hayBotDm() ? TOKEN_DM : null);
/** El chat privado de Cande (TELEGRAM_CHAT_ID): con el bot del agente, solo ella puede contestar desde ahí. */
export const chatDuena = () => (/^\d+$/.test(String(CHAT || "")) ? String(CHAT) : null);

/** Telegram rompe el mensaje si le llegan estos caracteres sin escapar. */
const esc = (s) =>
  String(s ?? "—").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

/**
 * Manda el aviso. `chat` cambia a qué chat va y `token` por qué bot sale; por defecto, los de
 * siempre (TELEGRAM_CHAT_ID y TELEGRAM_BOT_TOKEN).
 *
 * El token es para los avisos que Cande pidió aparte de los leads: las ventas (14/10, quedó
 * @oghventas_bot, con su propio token y su chat) y el agente de DM (15/10, TELEGRAM_DM_BOT_TOKEN,
 * a su chat privado con ese bot).
 *
 * `foto`: el link de una foto (la que mandó un lead, 19/10). Va como foto con el aviso de epígrafe
 * (sendPhoto); si Telegram no la puede bajar o el aviso no entra en un epígrafe (1.024 caracteres), sale
 * el aviso de texto de siempre con el link a la foto.
 *
 * `silencioso`: llega sin sonido (disable_notification). Es para el resumen de las notas del agente de DM, que
 * se mira cuando ella quiere (20/10, lib/dm/resumen.js).
 *
 * `boton`: { texto, url }, un botón abajo del aviso que abre ese link (29/10: el de la venta abre WhatsApp con
 * la oferta del 1 a 1 ya escrita, lib/ofertaWhatsapp.js). Si Telegram rechaza el aviso por el botón, sale sin él:
 * el aviso importa más que el atajo. Solo si lo rechazó: después de un corte o un error de red el aviso pudo
 * haber llegado, y mandarlo de nuevo sería avisar dos veces la misma venta.
 */
export async function avisar(titulo, campos, { chat = CHAT, token = TOKEN, foto = null, silencioso = false, boton = null } = {}) {
  if (!token || !chat) return false;

  const filas = Object.entries(campos).filter(([, v]) => v !== undefined && v !== null && v !== "");
  const armar = (lista) => `🔔 <b>${esc(titulo)}</b>\n\n${lista.map(([k, v]) => `<b>${esc(k)}:</b> ${esc(v)}`).join("\n")}`;
  // Lo que cuenta Telegram para el tope del epígrafe: el texto sin las marcas.
  const visible = `🔔 ${titulo}\n\n${filas.map(([k, v]) => `${k}: ${v}`).join("\n")}`;
  const sinSonido = silencioso ? { disable_notification: true } : {};
  const teclado = boton?.url ? { reply_markup: { inline_keyboard: [[{ text: String(boton.texto || "Abrir"), url: String(boton.url) }]] } } : {};
  if (foto && visible.length <= 1024) {
    // Bajar la foto le lleva a Telegram un poco más: 10 segundos.
    if (await enviar(token, "sendPhoto", { chat_id: chat, parse_mode: "HTML", photo: String(foto), caption: armar(filas), ...sinSonido, ...teclado }, 10000)) return true;
  }
  const conFoto = foto ? [...filas, ["Foto", String(foto)]] : filas;
  const mensaje = { chat_id: chat, parse_mode: "HTML", disable_web_page_preview: true, text: armar(conFoto), ...sinSonido };
  const inicio = Date.now();
  const r = await pedir(token, "sendMessage", { ...mensaje, ...teclado });
  if (r.ok || !boton?.url || !r.rechazado) return r.ok;
  // Dentro de los mismos 5 segundos: Gumroad corta a los 5 y, si no le contestamos, repite el ping.
  return enviar(token, "sendMessage", mensaje, Math.max(1000, 5000 - (Date.now() - inicio)));
}

/** Un mensaje del bot. 5 segundos y corta: si Telegram está lento, no vamos a hacer esperar a nadie. */
async function enviar(token, metodo, cuerpo, espera = 5000) {
  return (await pedir(token, metodo, cuerpo, espera)).ok;
}

/** Lo mismo, y además si Telegram lo rechazó (un 400: el mensaje seguro que no llegó), a diferencia de un corte,
 *  un error de red o un 5xx, donde pudo haber llegado. */
async function pedir(token, metodo, cuerpo, espera = 5000) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), espera);
    const r = await fetch(`https://api.telegram.org/bot${token}/${metodo}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!r.ok) console.error(`telegram ${metodo}:`, r.status, (await r.text()).slice(0, 200));
    return { ok: r.ok, rechazado: r.status === 400 };
  } catch (e) {
    console.error(`telegram ${metodo} falló:`, e.message);
    return { ok: false, rechazado: false };
  }
}

/**
 * De lo último que vio el bot (el resultado de getUpdates), el grupo o canal con ese nombre.
 * Devuelve { id, nombre }, null si no hay ninguno, o { varios: true } si hay más de uno: a un bot
 * lo puede sumar cualquiera a un grupo con el mismo nombre, y elegir "el más reciente" sería
 * mandarle los avisos a un extraño. Por lo mismo, con `soloDe` cuenta únicamente lo que hizo esa
 * persona (quien sumó al bot o escribió), y no cuenta un grupo del que al bot ya lo sacaron.
 */
export function grupoConNombre(actualizaciones, nombre, { soloDe = null } = {}) {
  const buscado = String(nombre || "").trim().toLowerCase();
  if (!buscado) return null;
  const hallados = new Map();
  for (const u of Array.isArray(actualizaciones) ? actualizaciones : []) {
    const novedad = u?.my_chat_member || u?.message || u?.channel_post;
    const c = novedad?.chat;
    if (!c || !["group", "supergroup", "channel"].includes(c.type)) continue;
    const id = String(c.id);
    if (["left", "kicked"].includes(u.my_chat_member?.new_chat_member?.status)) {
      hallados.delete(id);
      continue;
    }
    if (String(c.title || "").trim().toLowerCase() !== buscado) continue;
    if (soloDe && String(novedad.from?.id ?? "") !== String(soloDe)) continue;
    hallados.set(id, String(c.title).trim());
  }
  if (hallados.size > 1) return { varios: true };
  const [unico] = hallados;
  return unico ? { id: unico[0], nombre: unico[1] } : null;
}

/**
 * Busca un grupo donde esté el bot, por su nombre. El bot se entera de un grupo cuando lo suman
 * (los mensajes comunes del grupo no los ve, por el modo privacidad de Telegram) y Telegram guarda
 * esa novedad un día: hay que buscarlo en ese rato. Si el chat de siempre es un chat privado, su
 * id es el de la dueña, y solo cuenta un grupo al que el bot lo sumó ella.
 * Nadie más lee las novedades de este bot (solo manda avisos), así que consultarlas no le saca
 * nada a nadie. No devuelve ni registra el texto de ningún mensaje.
 */
export async function buscarGrupo(nombre) {
  if (!TOKEN) return null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(`https://api.telegram.org/bot${TOKEN}/getUpdates?limit=100&offset=-100`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) {
      console.error("telegram getUpdates:", r.status);
      return null;
    }
    return grupoConNombre((await r.json())?.result, nombre, { soloDe: /^\d+$/.test(String(CHAT || "")) ? CHAT : null });
  } catch (e) {
    console.error("telegram getUpdates falló:", e.message);
    return null;
  }
}

/** Un método de la API de Telegram con el token que se le pase. Devuelve { ok, description }. Nunca muestra el token. */
export async function llamarTelegram(token, metodo, cuerpo) {
  if (!token) return { ok: false, description: "sin token" };
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(`https://api.telegram.org/bot${token}/${metodo}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo), signal: ctrl.signal,
    });
    clearTimeout(t);
    const j = await r.json().catch(() => ({}));
    return { ok: Boolean(j.ok), description: String(j.description || (r.ok ? "" : `Telegram contestó ${r.status}`)).slice(0, 200) };
  } catch (e) {
    return { ok: false, description: e.message };
  }
}
