// Aviso por Telegram cuando entra un lead.
//
// Es "dispará y olvidate" a propósito: si Telegram no está configurado, se cae,
// o tarda, el lead YA está guardado en Postgres. El aviso nunca puede romper ni
// demorar la respuesta al que completó el formulario.
//
// Config en Vercel:
//   TELEGRAM_BOT_TOKEN  → el que te da @BotFather
//   TELEGRAM_CHAT_ID    → tu chat con el bot (o el id de un grupo, empieza con -)

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT = process.env.TELEGRAM_CHAT_ID;

export const hayTelegram = () => Boolean(TOKEN && CHAT);

/** Telegram rompe el mensaje si le llegan estos caracteres sin escapar. */
const esc = (s) =>
  String(s ?? "—").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

/**
 * Lo mismo que avisar(), pero por OTRO bot y a otro chat.
 *
 * Cande, 14/10, pidió las ventas aparte de los leads: "tipo uno nuevo exclusivamente para
 * esto en telegram". Quedó el bot @oghventas_bot, con su token y su chat propios. Si alguno
 * de los dos falta cae al bot de los leads, que es mejor que perder el aviso de una venta.
 */
export async function avisarPor({ token, chat }, titulo, campos) {
  return avisar(titulo, campos, { token: token || TOKEN, chat: chat || CHAT });
}

export async function avisar(titulo, campos, bot = {}) {
  const token = bot.token || TOKEN;
  const chat = bot.chat || CHAT;
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
