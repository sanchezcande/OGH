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
 */
export async function avisar(titulo, campos, { chat = CHAT, token = TOKEN } = {}) {
  if (!token || !chat) return false;

  const cuerpo = Object.entries(campos)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `<b>${esc(k)}:</b> ${esc(v)}`)
    .join("\n");

  try {
    // 5 segundos y corta: si Telegram está lento, no vamos a hacer esperar a nadie.
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chat,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        text: `🔔 <b>${esc(titulo)}</b>\n\n${cuerpo}`,
      }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!r.ok) console.error("telegram:", r.status, (await r.text()).slice(0, 200));
    return r.ok;
  } catch (e) {
    console.error("telegram falló:", e.message);
    return false;
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
