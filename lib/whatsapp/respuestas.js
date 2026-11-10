// Cande lee y contesta el WhatsApp desde Telegram, igual que los DM de Instagram.
//
// Entra por el MISMO bot y el MISMO webhook que el agente de DM (TELEGRAM_DM_BOT_TOKEN,
// pages/api/dm/telegram.js): Telegram deja un solo webhook por bot, y un bot nuevo sería otro chat
// más para ella. El aviso de un WhatsApp se distingue del de una charla de Instagram por el
// prefijo "wa:" en el renglón "Quién", y lo mira primero el webhook: un número de teléfono también
// es un montón de dígitos, y sin el prefijo un WhatsApp se podría leer como el id de un contacto
// de ManyChat y la respuesta se iría a otra persona por otro canal.
//
// LA DIFERENCIA GRANDE CON LOS DM: acá no redacta nadie. En Instagram lo que ella escribe es una
// indicación y el agente arma el mensaje con su voz. Por WhatsApp sale TAL CUAL lo que escribe
// ella. No es una simplificación: no hay prompt, ni corpus, ni revisor para este canal, y el texto
// que le llega a un lead lo decide ella. /textual también vale, por costumbre del otro bot, y hace
// exactamente lo mismo.
//
// La ventana de 24 horas la hace cumplir Meta: texto libre solo hasta 24 horas después del último
// mensaje de la persona. Pasado eso, el único camino es una plantilla aprobada (las manda
// tracker/recordatorio_llamadas.py, en el repo Personal Brand). Si ella contesta tarde, el bot se
// lo dice y por qué, en vez de que el mensaje falle en silencio.
//
// Todo lo de este archivo se prueba sin red y sin base (tests/whatsappRespuestas.test.mjs).
import { esCodigoSalir } from "../dm/respuestas";
import { TOPE_TEXTO } from "./api";

/** Hasta cuándo deja WhatsApp escribir texto libre, contado desde el último mensaje de la persona. */
export const VENTANA_HORAS = 24;

/** El prefijo del renglón "Quién" de un aviso de WhatsApp: lo que lo distingue de una charla de DM. */
export const MARCA = "wa:";

/** El comienzo del título de todos los avisos de WhatsApp. */
export const TITULO = "WhatsApp";

/** El renglón que le recuerda cómo contestar. */
export const COMO_CONTESTAR = "respondé este mensaje con lo que querés que le llegue y sale tal cual por WhatsApp";

/** Lo que le contesta el bot cuando no se puede usar así. */
export const AYUDA = "Respondiendo un aviso de WhatsApp: escribime lo que querés que le llegue y sale tal cual. " +
  "Por WhatsApp no redacta ningún agente, así que no hace falta /textual (igual vale) ni -- para agarrar la charla.";

/** Horas enteras y decimales desde que escribió la persona. null si nunca escribió. */
export function horasDesde(ultimoLead, ahora = new Date()) {
  const t = ultimoLead instanceof Date ? ultimoLead : new Date(ultimoLead);
  if (!ultimoLead || Number.isNaN(t.getTime())) return null;
  return (ahora.getTime() - t.getTime()) / 3600000;
}

/** Cuánto se le perdona a un reloj adelantado: Meta pone la hora del mensaje y no tiene por qué
 *  coincidir al minuto con la nuestra. Sin esto, un mensaje de "hace -3 minutos" daría la ventana
 *  cerrada con la ventana recién abierta, que es el peor momento para decirle que no se puede. */
const DESFASAJE_HORAS = 1;

/**
 * Se le puede escribir texto libre? Solo hasta VENTANA_HORAS desde su último mensaje. Si nunca
 * escribió, no: la charla la abre una plantilla, no esto.
 */
export function ventanaAbierta(ultimoLead, ahora = new Date()) {
  const h = horasDesde(ultimoLead, ahora);
  return h !== null && h > -DESFASAJE_HORAS && h < VENTANA_HORAS;
}

/** Cómo se dice el tiempo que pasó, para contárselo a ella ("hace 3 días", "hace 26 horas"). */
export function haceCuanto(horas) {
  if (horas === null) return "nunca te escribió";
  if (horas < 1) return "hace menos de una hora";
  if (horas < 48) return `hace ${Math.round(horas)} horas`;
  return `hace ${Math.round(horas / 24)} días`;
}

/** Lo que le dice el bot cuando la ventana se cerró: qué pasó y por qué, sin mandar nada. */
export function porQueNoSalio({ horas, nombre }) {
  return `No le mandé nada a ${nombre}: te escribió ${haceCuanto(horas)} y WhatsApp deja contestar hasta ` +
    `${VENTANA_HORAS} horas después del último mensaje de la persona. Pasado eso solo sale una plantilla aprobada, ` +
    "no un mensaje escrito. Si tiene que salir algo igual, decímelo y vemos por dónde.";
}

/**
 * El aviso que le llega a Telegram cuando entra un WhatsApp: { titulo, campos } para avisar()
 * (lib/notificar.js). "Quién" va PRIMERO y en un solo renglón: así lo que escribió la persona, que
 * va después, no puede hacerse pasar por ese renglón y mandarle la respuesta a otro número.
 */
export function avisoDeEntrante({ telefono, nombre = null, texto, ultimoLead = null, ahora = new Date() }) {
  const quien = String(nombre || "").replace(/\s+/g, " ").trim() || "sin nombre";
  const abierta = ventanaAbierta(ultimoLead || ahora, ahora);
  return {
    titulo: `${TITULO}: te escribió ${quien}`,
    campos: {
      Quién: `${quien} (${MARCA}${String(telefono).replace(/\D/g, "")})`,
      Dijo: String(texto ?? "").slice(0, 900),
      ...(abierta ? { Contestar: COMO_CONTESTAR } : { Ojo: `pasaron más de ${VENTANA_HORAS} horas: solo sale una plantilla aprobada` }),
    },
  };
}

/**
 * El número del aviso de WhatsApp que Cande respondió, o null si ese aviso no es de WhatsApp.
 * Solo vale el formato de avisar(): 🔔 y el título que arranca con "WhatsApp", un renglón en
 * blanco, y "Quién: Nombre (wa:<número>)" como primer renglón de los campos.
 */
export function telefonoDeAviso(texto) {
  const m = String(texto || "").match(new RegExp(`^🔔 ${TITULO}[^\\n]*\\n\\nQuién: [^\\n]*\\(${MARCA}(\\d{6,20})\\)(?:\\n|$)`));
  return m ? m[1] : null;
}

/**
 * Qué hacer con una novedad de Telegram que responde un aviso de WhatsApp. Igual que
 * leerRespuesta de lib/dm/respuestas.js: solo cuenta un mensaje de texto de la dueña, en su chat
 * privado con el bot, respondiendo un aviso del bot. Devuelve uno de:
 *   { ignorar: true }                       no es de acá (ni de ella, o no responde un aviso de WhatsApp)
 *   { ayuda: "..." }                        es de ella pero así no se puede usar
 *   { telefono, texto }                     mandarle ese texto tal cual por WhatsApp
 */
export function leerRespuestaWa(novedad, { duena }) {
  const m = novedad?.message;
  const deElla = m && duena && m.chat?.type === "private"
    && String(m.chat?.id) === String(duena) && String(m.from?.id) === String(duena);
  if (!deElla) return { ignorar: true };
  const respondido = m.reply_to_message;
  if (respondido?.from?.is_bot !== true) return { ignorar: true };
  const telefono = telefonoDeAviso(respondido.text ?? respondido.caption);
  if (!telefono) return { ignorar: true };
  const texto = String(m.text || "").trim();
  if (!texto) return { ayuda: "Por ahora solo puedo mandarle texto." };
  // /textual hace lo mismo que escribir el mensaje: por WhatsApp todo sale tal cual.
  const textual = texto.match(/^\/textual\b\s*([\s\S]*)$/i);
  const suyo = textual ? textual[1].trim() : texto;
  if (textual && !suyo) return { ayuda: "Escribí el mensaje después de /textual: se lo mando tal cual." };
  if (!textual && texto.startsWith("/")) return { ayuda: AYUDA };
  // Acá no hay agente que sacar de la charla: lo que escribe ella es lo único que sale. El "--" lo
  // reconoce esCodigoSalir (lib/dm/respuestas.js), que ya sabe los guiones que le pone el corrector.
  if (esCodigoSalir(suyo)) {
    return { ayuda: "Por WhatsApp no contesta ningún agente, la charla ya es tuya: escribime el mensaje y sale tal cual." };
  }
  if (suyo.length > TOPE_TEXTO) return { ayuda: `Es muy largo para WhatsApp: hasta ${TOPE_TEXTO} caracteres.` };
  return { telefono, texto: suyo };
}

/**
 * Lo que hace el webhook con una respuesta ya leída por leerRespuestaWa. Devuelve qué pasó (para
 * las pruebas y el registro); a Cande se lo dice `decir`, que contesta en su chat con el bot.
 *
 * Cada novedad se reclama una sola vez (reclamarNovedad, el mismo de lib/dm/base.js: es el mismo
 * bot y los update_id no se repiten entre canales): Telegram reintenta lo que tarda, y un reintento
 * no puede mandarle dos veces el mismo mensaje a un lead.
 */
export function crearRespuestaWhatsapp({ base, wa, decir, reclamarNovedad }) {
  return async (r, { updateId, ahora = new Date() } = {}) => {
    if (r?.ayuda) {
      await decir(r.ayuda);
      return "ayuda";
    }
    if (!r?.telefono || !r?.texto) return "nada";
    if (!(await reclamarNovedad(updateId))) return "repetida";
    const c = await base.contacto(r.telefono);
    const nombre = c?.nombre || `+${r.telefono}`;
    // La ventana, antes de intentar: si está cerrada, Meta lo rechazaría igual y ella se quedaría
    // esperando. Se lo decimos con el por qué.
    if (!ventanaAbierta(c?.ultimo_lead, ahora)) {
      const texto = porQueNoSalio({ horas: horasDesde(c?.ultimo_lead, ahora), nombre });
      await decir(texto);
      // Queda en la charla: si no, nadie se acuerda de que hubo algo que no salió.
      try {
        await base.anotarSistema({ telefono: r.telefono, texto: `no salió (ventana de ${VENTANA_HORAS} h cerrada): ${r.texto}` });
      } catch {
        // el aviso ya salió: que no se caiga por no poder anotarlo
      }
      return "ventana cerrada";
    }
    const envio = await wa.mandarTexto(r.telefono, r.texto);
    if (envio?.sinConfigurar) {
      await decir(`No salió: el número de WhatsApp todavía no está dado de alta, así que no puedo mandar nada a ${nombre}.`);
      return "sin configurar";
    }
    if (envio?.incierto) {
      await decir(`WhatsApp tardó y no sé si le llegó a ${nombre}. Fijate antes de mandarlo de nuevo.`);
      // Sin wa_mid: queda la constancia de que pudo haber salido, para no repetirlo a ciegas.
      try {
        await base.anotarDeCande({ telefono: r.telefono, texto: r.texto });
      } catch {
        // ya se lo dijimos
      }
      return "incierto";
    }
    if (envio?.fueraDeVentana) {
      // La ventana se cerró entre la cuenta nuestra y la de Meta (o su último mensaje no se guardó).
      await decir(porQueNoSalio({ horas: horasDesde(c?.ultimo_lead, ahora), nombre }));
      return "ventana cerrada";
    }
    if (envio?.noLlega) {
      await decir(`No le llega a ${nombre}: ese número no recibe WhatsApp de la cuenta (no lo tiene, o bloqueó).`);
      return "no llega";
    }
    if (!envio?.ok) {
      await decir(`No salió a ${nombre}: ${envio?.error || "WhatsApp no contestó"}`);
      return "no salió";
    }
    try {
      await base.anotarDeCande({ telefono: r.telefono, texto: r.texto, waMid: envio.id || null });
    } catch {
      await decir(`✓ Le mandé a ${nombre}, pero no lo pude anotar en la base: no lo mandes de nuevo.`);
      return "mandado sin anotar";
    }
    await decir(`✓ Mandado a ${nombre} por WhatsApp`);
    return "mandado";
  };
}
