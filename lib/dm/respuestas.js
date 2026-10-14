// Cande contesta desde Telegram: responde el aviso de una charla en el bot del agente
// (TELEGRAM_DM_BOT_TOKEN) y eso le llega al lead por Instagram, por la API de ManyChat.
// Lo pidió el 15/10: "podemos hacer que conteste los mensajes ahí mismo a telegram?".
//
// Acá va lo que se puede probar sin red: de qué charla es la respuesta y qué pidió. El webhook
// está en pages/api/dm/telegram.js y se conecta con config { accion: "telegram_respuestas" }.

export const TOPE_RESPUESTA = 1000; // Instagram corta los mensajes a los 1.000 caracteres

/** El contacto del aviso que Cande respondió: el número entre paréntesis del renglón "Quién:". */
export function contactoDeAviso(texto) {
  const m = String(texto || "").match(/Quién:[^\n]*\((\d{3,20})\)/);
  return m ? m[1] : null;
}

/**
 * Qué hacer con una novedad de Telegram. Solo cuenta un mensaje de texto de la dueña, en su chat
 * privado con el bot, que responde un aviso con contacto. Devuelve uno de:
 *   { ignorar: true }                      no es para esto (otro chat, otra persona, otra novedad)
 *   { ayuda: "..." }                       es de ella pero así no se puede usar
 *   { contacto, accion: "mandar", texto }  mandarle ese texto al lead
 *   { contacto, accion: "agente" }         devolverle la charla al agente
 */
export function leerRespuesta(novedad, { duena }) {
  const m = novedad?.message;
  const deElla = m && duena && m.chat?.type === "private"
    && String(m.chat?.id) === String(duena) && String(m.from?.id) === String(duena);
  if (!deElla) return { ignorar: true };
  const texto = String(m.text || "").trim();
  if (!texto) return { ayuda: "Por ahora solo puedo mandarle texto." };
  const contacto = contactoDeAviso(m.reply_to_message?.text);
  if (!contacto) return { ayuda: "Para contestarle a alguien, respondé (deslizá) el aviso de su charla." };
  if (/^\/agente\b/i.test(texto)) return { contacto, accion: "agente" };
  if (texto.startsWith("/")) {
    return { ayuda: "Respondiendo un aviso: /agente le devuelve la charla al agente. Cualquier otro texto se lo mando al lead." };
  }
  if (texto.length > TOPE_RESPUESTA) return { ayuda: `Es muy largo para Instagram: hasta ${TOPE_RESPUESTA} caracteres.` };
  return { contacto, accion: "mandar", texto };
}

/** Lo que le contesta el bot a Cande según cómo salió el envío por ManyChat. */
export function resultadoDeEnvio(envio, nombre) {
  if (envio?.ok) return { ok: true, texto: `Mandado a ${nombre}` };
  if (envio?.incierto) return { ok: false, texto: `ManyChat tardó: puede haber salido. Fijate en Instagram antes de mandarlo de nuevo a ${nombre}.` };
  if (String(envio?.code) === "3011") {
    return { ok: false, texto: `No salió: pasaron más de 24 horas desde el último mensaje de ${nombre} e Instagram no deja. Contestale desde Instagram.` };
  }
  return { ok: false, texto: `No salió a ${nombre}: ${envio?.error || "ManyChat no contestó"}` };
}
