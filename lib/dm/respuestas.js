// Cande contesta desde Telegram: responde el aviso de una charla en el bot del agente
// (TELEGRAM_DM_BOT_TOKEN) y eso le llega al lead por Instagram, por la API de ManyChat.
// Lo pidió el 15/10: "podemos hacer que conteste los mensajes ahí mismo a telegram?".
//
// Lo que escribe es una indicación para el agente, no el mensaje tal cual: el 16/10 le contestó
// "A este decirle que si entra al programa antes del lunes me avise..." y le llegó así al lead
// ("yo le estaba hablando al agente y copió y pegó sin sentido"). Ahora el agente escribe el
// mensaje siguiendo lo que pide, con su voz, y le cuenta qué mandó. "/textual texto" manda el
// texto tal cual y "/agente" le devuelve la charla al agente sin escribir.
//
// Acá va todo lo que se puede probar sin red: de qué charla es la respuesta, qué pidió y qué se
// hace con eso (crearRespuestaTelegram recibe la base, ManyChat y el bot de afuera). El webhook
// está en pages/api/dm/telegram.js y se conecta con config { accion: "telegram_respuestas" }.

export const TOPE_RESPUESTA = 1000; // Instagram corta los mensajes a los 1.000 caracteres

export const AYUDA = "Respondiendo un aviso: escribime lo que querés que le diga y el agente se lo escribe con tu voz. " +
  "/textual y el mensaje le manda tu texto tal cual. /agente le devuelve la charla al agente sin escribir.";

/** Por qué no salió lo que pidió Cande, dicho para ella. */
export function porQueNoSalio(r) {
  const h = r?.hecho || "";
  if (h === "ventana de 24 horas cerrada") return "su último mensaje fue hace más de un día e Instagram no deja escribirle por acá: escribile desde la app";
  if (h === "error del modelo") return "el agente no está contestando (la Mac sin red o apagada)";
  if (h === "calló") return "el agente no supo qué escribirle";
  if (h === "frenada") return `lo frené: ${r.motivo || "no pasaba los frenos"}`;
  if (h === "error al mandar" && String(r.code) === "3011") return "su último mensaje fue hace más de un día e Instagram no deja escribirle por acá: escribile desde la app";
  if (h === "error al mandar") return `ManyChat no dejó mandarlo (${r.error || "sin detalle"})`;
  if (h === "el agente prefirió no escribir") return `el agente prefirió no escribirle${r.aviso ? `: ${r.aviso}` : ""}`;
  if (h === "envío incierto") return "ManyChat tardó: puede haber salido, fijate en Instagram antes de repetir";
  if (/otro mensaje/.test(h)) return "justo escribió el lead: fijate en Instagram antes de mandar algo";
  if (/charla cambió|otra corrida/.test(h)) return "el agente estaba escribiéndole justo en ese momento: mandámela de nuevo en un minuto";
  return h || "no sé por qué";
}

/**
 * El contacto del aviso que Cande respondió. Solo vale el formato de avisar() (lib/notificar.js):
 * título con 🔔, un renglón en blanco y "Quién: Nombre (id)" como primer renglón. Así un texto
 * del lead que aparezca más abajo en un aviso (o en un repaso, o en una confirmación del bot) no
 * puede hacer que la respuesta vaya a otro contacto. El nombre va en un solo renglón (entrada.js
 * y quienEs en agente.js) y el número que cuenta es el último del renglón.
 */
export function contactoDeAviso(texto) {
  const m = String(texto || "").match(/^🔔 [^\n]*\n\nQuién: [^\n]*\((\d{3,20})\)(?:\n|$)/);
  return m ? m[1] : null;
}

/**
 * Qué hacer con una novedad de Telegram. Solo cuenta un mensaje de texto de la dueña, en su chat
 * privado con el bot, que responde un aviso del bot. Devuelve uno de:
 *   { ignorar: true }                                  no es para esto
 *   { ayuda: "..." }                                   es de ella pero así no se puede usar
 *   { contacto, accion: "indicacion", texto, fechaAviso }  el agente le escribe siguiendo eso
 *   { contacto, accion: "mandar", texto, fechaAviso }  mandarle ese texto tal cual (/textual)
 *   { contacto, accion: "agente" }                     devolverle la charla al agente
 */
export function leerRespuesta(novedad, { duena }) {
  const m = novedad?.message;
  const deElla = m && duena && m.chat?.type === "private"
    && String(m.chat?.id) === String(duena) && String(m.from?.id) === String(duena);
  if (!deElla) return { ignorar: true };
  const texto = String(m.text || "").trim();
  if (!texto) return { ayuda: "Por ahora solo puedo mandarle texto." };
  const respondido = m.reply_to_message;
  const contacto = respondido?.from?.is_bot === true ? contactoDeAviso(respondido.text) : null;
  if (!contacto) return { ayuda: "Para contestarle a alguien, respondé (deslizá) el aviso de su charla." };
  if (/^\/agente\b/i.test(texto)) return { contacto, accion: "agente" };
  const fechaAviso = Number.isFinite(respondido.date) ? new Date(respondido.date * 1000) : new Date();
  const textual = texto.match(/^\/textual\b\s*([\s\S]*)$/i);
  if (textual) {
    const t = textual[1].trim();
    if (!t) return { ayuda: "Escribí el mensaje después de /textual: se lo mando tal cual." };
    if (t.length > TOPE_RESPUESTA) return { ayuda: `Es muy largo para Instagram: hasta ${TOPE_RESPUESTA} caracteres.` };
    return { contacto, accion: "mandar", texto: t, fechaAviso };
  }
  if (texto.startsWith("/")) return { ayuda: AYUDA };
  if (texto.length > TOPE_RESPUESTA) return { ayuda: `Es muy largo: hasta ${TOPE_RESPUESTA} caracteres.` };
  return { contacto, accion: "indicacion", texto, fechaAviso };
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

/**
 * Lo que hace el webhook con una respuesta ya leída por leerRespuesta. Devuelve qué pasó (para
 * las pruebas y el registro); a Cande se lo dice `decir`, que contesta en su chat con el bot.
 * Cada novedad se reclama una sola vez: Telegram reintenta, y un reintento no puede mandar dos veces.
 */
export function crearRespuestaTelegram({ base, manychat, decir, agente = null }) {
  return async (r, { updateId }) => {
    if (!(await base.reclamarNovedad(updateId))) return "repetida";
    const c = await base.contacto(r.contacto);
    if (!c) {
      await decir("No salió: no encuentro esa charla en la base del agente.");
      return "sin contacto";
    }
    const nombre = c.nombre || r.contacto;

    // Le devuelve la charla al agente. La etiqueta primero: sin ella ManyChat no le pasa los mensajes
    // al agente, y la charla quedaría del agente sin que nadie la atienda.
    const devolver = async () => {
      if (!(await manychat.ponerEtiqueta(r.contacto, "agente_dm")).ok) {
        await decir(`No la devolví: no pude ponerle la etiqueta agente_dm a ${nombre}. Ponésela en ManyChat y probá de nuevo.`);
        return null;
      }
      if (c.dueno === "cande") {
        // Lo que el lead escribió mientras era de ella no se guarda acá (anotarLead solo guarda
        // charlas del agente): que el agente sepa que falta ese tramo.
        await base.anotar(r.contacto, "sistema", "Cande llevó esta charla a mano: lo que escribió el lead en ese tramo no está guardado acá");
        await base.cerrarTurno(r.contacto, (await base.ultimoIdLead(r.contacto)) || 0);
      }
      await base.ponerDueno(r.contacto, "agente");
      return manychat.ponerCampo(r.contacto, "dm_dueno", "agente");
    };

    if (r.accion === "agente") {
      const campo = await devolver();
      if (!campo) return "sin etiqueta";
      await decir(`${nombre} vuelve a ser del agente.${campo.ok ? "" : " Ojo: no pude cambiar el campo dm_dueno en ManyChat."}`);
      return "agente";
    }

    if (r.accion === "indicacion") {
      if (!agente) {
        await decir("No salió: el agente no está conectado acá. Si querés mandarle tu texto tal cual: /textual y el mensaje.");
        return "sin agente";
      }
      // Ella le está hablando al agente: él le escribe al lead. De quién es la charla no cambia (si es de
      // ella, sigue de ella: para dársela al agente está /agente).
      const hecho = await agente.procesar(r.contacto, null, { evento: "indicacion", indicacion: r.texto });
      const sigueTuya = c.dueno !== "agente" ? "\nLa charla sigue siendo tuya (/agente para que la siga el agente)" : "";
      if (hecho?.hecho === "enviada" && hecho.enviado?.length) {
        await decir(`✓ Le mandé a ${nombre}: «${hecho.enviado.join(" / ")}»${sigueTuya}`);
        return "indicacion enviada";
      }
      if (hecho?.hecho === "enviada sin guardar" || (hecho?.mando > 0 && hecho?.hecho !== "envío incierto")) {
        await decir(`✓ Le mandé a ${nombre} lo que pediste, pero no lo pude anotar: no lo repitas${sigueTuya}`);
        return "indicacion enviada sin anotar";
      }
      if (hecho?.hecho === "envío incierto") {
        await decir(`ManyChat tardó: puede haberle llegado a ${nombre}. Fijate en Instagram antes de repetir.`);
        return "indicacion incierta";
      }
      await decir(`No le mandé nada a ${nombre}: ${porQueNoSalio(hecho)}. Si querés mandarle tu texto tal cual: /textual y el mensaje.`);
      return "indicacion sin salir";
    }

    const envio = await manychat.mandarTextos(r.contacto, [r.texto]);
    const resultado = resultadoDeEnvio(envio, nombre);
    if (!resultado.ok) {
      await decir(resultado.texto);
      return "no salió";
    }
    try {
      // Lo que salió queda en el historial (si no, el agente redacta sin saber qué contestó ella),
      // y lo que el agente había dejado para retirar ya no sale detrás.
      await base.anotarDeCande(r.contacto, r.texto, r.fechaAviso);
      await base.descartarPendientes(r.contacto);
    } catch {
      await decir(`✓ ${resultado.texto}, pero no lo pude anotar en la base: no lo mandes de nuevo.`);
      return "salió sin anotar";
    }
    await decir(`✓ ${resultado.texto}`);
    return "mandado";
  };
}
