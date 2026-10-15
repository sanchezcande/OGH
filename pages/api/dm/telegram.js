// Webhook del bot del agente (TELEGRAM_DM_BOT_TOKEN). Cande responde en Telegram el aviso de una
// charla y acá se le manda al lead por Instagram, por la API de ManyChat. "/agente" respondiendo
// un aviso le devuelve esa charla al agente. La lógica está en lib/dm/respuestas.js.
//
// Lo conecta config { accion: "telegram_respuestas" }: llama a setWebhook con un secreto propio
// que Telegram manda en cada novedad (x-telegram-bot-api-secret-token). Sin ese secreto, no entra.
// Solo vale lo que escribe la dueña en su chat privado con el bot, respondiendo un aviso del bot.
//
// Contesta 200 aunque algo falle: con otro código Telegram reintenta. Igual cada novedad se
// reclama una sola vez (base.reclamarNovedad), así un reintento no manda dos veces.
import { mismoSecreto } from "../../../lib/dm/armado";
import * as base from "../../../lib/dm/base";
import * as manychat from "../../../lib/dm/manychat";
import { crearRespuestaTelegram, leerRespuesta } from "../../../lib/dm/respuestas";
import { chatDuena, llamarTelegram, tokenBotDm } from "../../../lib/notificar";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const token = tokenBotDm();
  if (!base.hayBase() || !token) return res.status(200).json({ ok: false });
  await base.tablas();
  const secreto = (await base.leerConfig("telegram_respuestas"))?.secreto;
  if (!secreto || !mismoSecreto(String(req.headers["x-telegram-bot-api-secret-token"] || ""), secreto)) {
    return res.status(401).json({ error: "no" });
  }
  const novedad = req.body || {};
  const r = leerRespuesta(novedad, { duena: chatDuena() });
  if (r.ignorar) return res.status(200).json({ ok: true });
  // El bot le contesta como respuesta a lo que ella escribió, en texto plano.
  const decir = (texto) => llamarTelegram(token, "sendMessage", {
    chat_id: chatDuena(), text: texto, reply_to_message_id: novedad.message?.message_id, allow_sending_without_reply: true,
  });
  if (r.ayuda) {
    await decir(r.ayuda);
    return res.status(200).json({ ok: true });
  }
  try {
    await crearRespuestaTelegram({ base, manychat, decir })(r, { updateId: novedad.update_id });
  } catch (e) {
    // Si el mensaje ya había salido, crearRespuestaTelegram lo dice antes: acá solo llega lo que falló antes de mandar.
    console.error("dm telegram:", e.message);
    await decir(`No salió: algo falló del lado del sitio (${String(e.message).slice(0, 150)})`);
  }
  return res.status(200).json({ ok: true });
}
