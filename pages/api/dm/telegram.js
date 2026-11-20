// Webhook del bot del agente (TELEGRAM_DM_BOT_TOKEN). Cande responde en Telegram el aviso de una
// charla con lo que quiere que le diga, y el agente le escribe al lead por Instagram. "/textual
// texto" lo manda tal cual; "/agente" le devuelve la charla al agente. La lógica está en
// lib/dm/respuestas.js.
//
// Lo que sale de acá va por el mismo envío que lo del agente (lib/dm/envio.js: Instagram primero y
// ManyChat de respaldo). Hasta el 02/11 salía solo por ManyChat: a un contacto solo de Instagram (la
// gente nueva desde que ManyChat llegó al tope, ver lib/dm/manychat.js) un /textual no le llegaba.
//
// Lo conecta config { accion: "telegram_respuestas" }: llama a setWebhook con un secreto propio
// que Telegram manda en cada novedad (x-telegram-bot-api-secret-token). Sin ese secreto, no entra.
// Solo vale lo que escribe la dueña en su chat privado con el bot, respondiendo un aviso del bot.
//
// Contesta 200 aunque algo falle: con otro código Telegram reintenta. Igual cada novedad se
// reclama una sola vez (base.reclamarNovedad), así un reintento no manda dos veces.
//
// Correcciones (09/11, lib/dm/correcciones.js): una captura, un texto suelto o un "wtf" respondiendo un aviso no es un
// mensaje para el lead: se guarda para que el cerebro de la nube corrija al agente y le conteste a ella por acá.
//
// WhatsApp (10/11, lib/whatsapp/respuestas.js): por el mismo bot entran los avisos del WhatsApp de la empresa
// (pages/api/whatsapp/webhook.js), y lo que ella responde ahí sale TAL CUAL por WhatsApp, sin pasar por el agente.
// Se mira antes que una respuesta de Instagram y después de una corrección: el aviso de WhatsApp se reconoce por el
// prefijo "wa:" del renglón "Quién", que ningún aviso de una charla de DM tiene. Una captura o un "wtf" respondiendo
// un aviso de WhatsApp siguen siendo una corrección del agente, como cualquier captura que le mande al bot.
import { waitUntil } from "@vercel/functions";
import { agente, envio, mismoSecreto } from "../../../lib/dm/armado";
import * as base from "../../../lib/dm/base";
import { RECIBIDA, leerCorreccion } from "../../../lib/dm/correcciones";
import { guardarCorreccion } from "../../../lib/dm/correccionesBase";
import { crearRespuestaTelegram, leerRespuesta } from "../../../lib/dm/respuestas";
import { chatDuena, llamarTelegram, tokenBotDm } from "../../../lib/notificar";
import * as whatsapp from "../../../lib/whatsapp/api";
import * as waBase from "../../../lib/whatsapp/base";
import { crearRespuestaWhatsapp, leerRespuestaWa } from "../../../lib/whatsapp/respuestas";

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
  const correccion = leerCorreccion(novedad, { duena: chatDuena() });
  if (correccion) {
    try {
      // "Lo miro" una sola vez por tanda: si ya había otra parte esperando, ya se lo dijo.
      const g = await guardarCorreccion(correccion);
      if (g.nueva && g.primera) {
        await llamarTelegram(token, "sendMessage", {
          chat_id: chatDuena(), text: correccion.deshacer ? `${RECIBIDA.split(",")[0]}, lo vuelvo atrás` : RECIBIDA,
          reply_to_message_id: novedad.message?.message_id, allow_sending_without_reply: true,
        });
      }
    } catch (e) {
      console.error("dm telegram, corrección:", e.message);
      await llamarTelegram(token, "sendMessage", { chat_id: chatDuena(), text: `No pude guardar la corrección: ${String(e.message).slice(0, 150)}` });
    }
    return res.status(200).json({ ok: true });
  }
  // El bot le contesta como respuesta a lo que ella escribió, en texto plano.
  const decir = (texto) => llamarTelegram(token, "sendMessage", {
    chat_id: chatDuena(), text: texto, reply_to_message_id: novedad.message?.message_id, allow_sending_without_reply: true,
  });

  // Un aviso de WhatsApp: lo que ella escribe sale tal cual por WhatsApp y no pasa por el agente.
  const wa = leerRespuestaWa(novedad, { duena: chatDuena() });
  if (!wa.ignorar) {
    // Una ayuda se contesta acá y no toca la base: no hay por qué despertar a Neon para decirle cómo se usa.
    if (wa.ayuda) {
      await decir(wa.ayuda);
      return res.status(200).json({ ok: true });
    }
    try {
      await waBase.tablas();
    } catch (e) {
      // Si la base no está, el 500 lo reintentaría Telegram y ella no se enteraría de nada.
      console.error("whatsapp desde telegram, base:", e.message);
      await decir(`No salió: no pude llegar a la base (${String(e.message).slice(0, 150)})`);
      return res.status(200).json({ ok: false });
    }
    waitUntil(
      crearRespuestaWhatsapp({ base: waBase, wa: whatsapp, decir, reclamarNovedad: base.reclamarNovedad })(wa, { updateId: novedad.update_id })
        .catch(async (e) => {
          console.error("whatsapp desde telegram:", e.message);
          await decir(`No salió: algo falló del lado del sitio (${String(e.message).slice(0, 150)})`);
        }),
    );
    return res.status(200).json({ ok: true });
  }

  const r = leerRespuesta(novedad, { duena: chatDuena() });
  if (r.ignorar) return res.status(200).json({ ok: true });
  if (r.ayuda) {
    // Un texto suelto que no arranca como queja no corrige nada: la ayuda de siempre, y cómo se corrige (09/11).
    await decir(r.ayuda.startsWith("Para contestarle a alguien") ? `${r.ayuda}\nPara corregir al agente, mandame la captura o escribí wtf y qué pasó.` : r.ayuda);
    return res.status(200).json({ ok: true });
  }
  // Una indicación espera a que el agente la redacte (hasta un minuto y pico con la Mac): Telegram
  // recibe el 200 enseguida y el trabajo sigue aparte. La novedad igual se reclama una sola vez.
  waitUntil(
    crearRespuestaTelegram({ base, manychat: envio, decir, agente })(r, { updateId: novedad.update_id }).catch(async (e) => {
      // Si el mensaje ya había salido, crearRespuestaTelegram lo dice antes: acá solo llega lo que falló antes de mandar.
      console.error("dm telegram:", e.message);
      await decir(`No salió: algo falló del lado del sitio (${String(e.message).slice(0, 150)})`);
    }),
  );
  return res.status(200).json({ ok: true });
}

export const config = { maxDuration: 300 };
