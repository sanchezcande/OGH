// Webhook del bot del agente (TELEGRAM_DM_BOT_TOKEN). Cande responde en Telegram el aviso de una
// charla y acá se le manda al lead por Instagram, por la API de ManyChat (ver lib/dm/respuestas.js).
// "/agente" respondiendo un aviso le devuelve esa charla al agente.
//
// Lo conecta config { accion: "telegram_respuestas" }: llama a setWebhook con un secreto propio
// que Telegram manda en cada novedad (x-telegram-bot-api-secret-token). Sin ese secreto, no entra.
// Solo vale lo que escribe la dueña en su chat privado con el bot.
//
// Contesta 200 aunque algo falle: con otro código Telegram reintenta y el mensaje saldría dos veces.
// Por lo mismo, cada novedad se anota antes de mandar y una repetida se ignora.
import { mismoSecreto } from "../../../lib/dm/armado";
import {
  anotarAMano, cerrarTurno, contacto, guardarConfig, hayBase, leerConfig, ponerDueno, tablas, ultimoIdLead,
} from "../../../lib/dm/base";
import { mandarTextos, ponerCampo, ponerEtiqueta } from "../../../lib/dm/manychat";
import { leerRespuesta, resultadoDeEnvio } from "../../../lib/dm/respuestas";
import { chatDuena, llamarTelegram, tokenBotDm } from "../../../lib/notificar";

const VISTOS = 50; // novedades recordadas para no mandar dos veces la misma

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const token = tokenBotDm();
  if (!hayBase() || !token) return res.status(200).json({ ok: false });
  await tablas();
  const conf = (await leerConfig("telegram_respuestas")) || {};
  if (!conf.secreto || !mismoSecreto(String(req.headers["x-telegram-bot-api-secret-token"] || ""), conf.secreto)) {
    return res.status(401).json({ error: "no" });
  }
  const novedad = req.body || {};
  const r = leerRespuesta(novedad, { duena: chatDuena() });
  if (r.ignorar) return res.status(200).json({ ok: true });
  // La respuesta del bot va como respuesta a lo que ella escribió, en texto plano.
  const decir = (texto) => llamarTelegram(token, "sendMessage", {
    chat_id: chatDuena(), text: texto, reply_to_message_id: novedad.message?.message_id, allow_sending_without_reply: true,
  });
  if (r.ayuda) {
    await decir(r.ayuda);
    return res.status(200).json({ ok: true });
  }

  const vistos = Array.isArray(conf.vistos) ? conf.vistos : [];
  if (vistos.includes(novedad.update_id)) return res.status(200).json({ ok: true });
  await guardarConfig("telegram_respuestas", { ...conf, vistos: [...vistos, novedad.update_id].slice(-VISTOS) });

  try {
    const c = await contacto(r.contacto);
    if (!c) {
      await decir("No salió: no encuentro esa charla en la base del agente.");
      return res.status(200).json({ ok: true });
    }
    const nombre = c.nombre || r.contacto;
    if (r.accion === "agente") {
      const ojo = [];
      await ponerDueno(r.contacto, "agente");
      // Igual que config { accion: "dueno" }: lo escrito hasta acá queda atendido y sigue desde lo próximo.
      if (c.dueno === "cande") await cerrarTurno(r.contacto, (await ultimoIdLead(r.contacto)) || 0);
      if (!(await ponerCampo(r.contacto, "dm_dueno", "agente")).ok) ojo.push("no pude cambiar el campo en ManyChat");
      if (!(await ponerEtiqueta(r.contacto, "agente_dm")).ok) ojo.push("no pude ponerle la etiqueta agente_dm: ponésela vos");
      await decir(`${nombre} vuelve a ser del agente.${ojo.length ? ` Ojo: ${ojo.join("; ")}.` : ""}`);
      return res.status(200).json({ ok: true });
    }
    const envio = await mandarTextos(r.contacto, [r.texto]);
    const resultado = resultadoDeEnvio(envio, nombre);
    // Lo que salió queda en el historial: si no, el agente redacta sin saber qué le contestó ella.
    if (resultado.ok) await anotarAMano(r.contacto, "cande", r.texto);
    await decir(resultado.ok ? `✓ ${resultado.texto}` : resultado.texto);
  } catch (e) {
    console.error("dm telegram:", e.message);
    await decir(`No salió: algo falló del lado del sitio (${String(e.message).slice(0, 150)})`);
  }
  return res.status(200).json({ ok: true });
}
