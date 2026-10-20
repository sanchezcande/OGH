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
// El código de quien pagó en pesos (19/10, Cande: "un YA y yo le mando un: ok a telegram o algo así, y el
// bot lo manda"): el agente nunca lo pasa solo. Le llega a ella un aviso con el borrador (lib/dm/agente.js,
// avisarPago) y, si responde ese aviso con "ok" (o dale, sí, mandalo, mandá, va, listo), el bot le manda
// al lead ese borrador tal cual, una sola vez. Un ok solo a un aviso de foto sin borrador (el URGENTE de siempre,
// o la foto que el agente no pudo confirmar como pago) no manda nada ni va al agente: el bot le pide qué contestar.
// Y lo que escribe el agente siguiendo una indicación nunca lleva el código (frenoDelCodigo, lib/dm/frenos.js).
//
// El resumen de las notas (20/10, lib/dm/resumen.js): dos veces por día, sin sonido, con un número por charla.
// Respondiéndolo con "2: lo que quiere que le diga", vale como si hubiera respondido el aviso de esa charla (también
// "2: /textual ...", "2: --" o "2: /agente"). Varias en un mismo mensaje, una por renglón ("1: ...", "3: --"): cada
// una va a su charla. El número se busca en la lista que se guardó con ese resumen
// (base.numeroDeResumen), nunca en el texto del aviso: ahí hay nombres y notas que pudo escribir un lead.
//
// Acá va todo lo que se puede probar sin red: de qué charla es la respuesta, qué pidió y qué se
// hace con eso (crearRespuestaTelegram recibe la base, ManyChat y el bot de afuera). El webhook
// está en pages/api/dm/telegram.js y se conecta con config { accion: "telegram_respuestas" }.

export const TOPE_RESPUESTA = 1000; // Instagram corta los mensajes a los 1.000 caracteres

export const AYUDA = "Respondiendo un aviso: escribime lo que querés que le diga y el agente se lo escribe con tu voz. " +
  "/textual y el mensaje le manda tu texto tal cual. \"salí\", \"yo\" o -- sacan al agente: la charla queda tuya. " +
  "/agente le devuelve la charla al agente sin escribir. Al aviso de un pago en pesos con borrador, ok le manda ese borrador tal cual.";

/** El renglón del aviso del código que dice cómo mandarlo: con él, un "ok" respondido manda el borrador. */
export const MARCA_OK = "Respondé ok y se lo mando";

/** Los títulos de los avisos que traen el borrador del código (los arma avisarPago en lib/dm/agente.js). */
export const TITULOS_CODIGO = {
  comprobante: "DM URGENTE: pagó en pesos (vi el comprobante)",
  dice: "DM URGENTE: dice que pagó en pesos",
};

/**
 * Los títulos de los avisos de una foto que no traen un mensaje para mandar (los arman avisarFotos y avisarPago en
 * lib/dm/agente.js): el URGENTE de siempre y la foto que el agente miró y no pudo confirmar como pago.
 */
export const TITULOS_FOTO = {
  urgente: "DM URGENTE: mandó una foto",
  dudoso: "DM URGENTE: mandó una foto que no pude confirmar como pago",
};

/** El título del resumen de las notas del agente (lib/dm/resumen.js), sin la etiqueta de la franja. */
export const TITULO_RESUMEN = "DM: notas del agente";

/** Lo que le contesta el bot si responde el resumen sin decir a qué número. */
export const AYUDA_RESUMEN = "Para contestarle a alguien del resumen, empezá por su número: 2: lo que querés que le diga";

/**
 * Si el aviso respondido es un resumen de notas: su etiqueta ("20/10 18 h"), o null. Mira solo el primer renglón,
 * que arma el sitio (como contactoDeAviso).
 */
const PRIMER_RENGLON_RESUMEN = new RegExp(`^🔔 ${TITULO_RESUMEN} · (\\d{2}/\\d{2} \\d{1,2} h)(?: \\(\\d+/\\d+\\))?(?:\\n|$)`);
export function etiquetaDeResumen(textoAviso) {
  const m = String(textoAviso || "").match(PRIMER_RENGLON_RESUMEN);
  return m ? m[1] : null;
}

/**
 * Lo que escribió respondiendo el resumen, partido por número: [{ numero, texto }], uno por cada renglón que arranca
 * con un número ("2: ...", "3) ..."); los renglones sin número siguen al de arriba. null si no arranca con un número.
 * Un número repetido: { repetido }.
 */
export function porNumero(texto) {
  const items = [];
  for (const renglon of String(texto || "").split("\n")) {
    const m = renglon.trim().match(/^(\d{1,3})\s*[:.)-]\s*(.*)$/);
    if (m) items.push({ numero: Number(m[1]), texto: m[2] });
    else if (items.length) items.at(-1).texto += `\n${renglon}`;
    else if (renglon.trim()) return null;
  }
  const limpios = items.map((x) => ({ ...x, texto: x.texto.trim() }));
  if (!limpios.length || limpios.some((x) => !x.texto)) return null;
  const repetido = limpios.find((x, i) => limpios.findIndex((y) => y.numero === x.numero) !== i);
  return repetido ? { repetido: repetido.numero } : limpios;
}

/** Lo que le contesta el bot a un ok solo respondido a un aviso de foto sin borrador. */
export const SIN_MENSAJE = "Ese aviso no tiene un mensaje para mandar: decime qué le contesto";

/** Un "ok" de Cande para mandar el borrador: la palabra sola, sin más texto (con o sin tilde y signos al final). */
export function esOk(texto) {
  const t = String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  return /^(ok|dale|si|mandalo|manda|va|listo)[.!]*$/.test(t);
}

/**
 * Si el aviso respondido es el del código: su primer renglón termina con uno de esos títulos (el nombre del lead
 * va antes y no tiene saltos de línea, así que no puede fingirlo). Traiga o no el borrador: un ok a ese aviso
 * nunca es una indicación para el agente. Si no hay borrador vigente, el bot le dice que no hay nada pendiente.
 */
export function ofreceCodigo(textoAviso) {
  const primero = String(textoAviso || "").split("\n")[0];
  return Object.values(TITULOS_CODIGO).some((x) => primero.endsWith(x));
}

/** Si el aviso respondido es el de una foto sin borrador (TITULOS_FOTO), con el mismo criterio que ofreceCodigo. */
export function esAvisoDeFoto(textoAviso) {
  const primero = String(textoAviso || "").split("\n")[0];
  return Object.values(TITULOS_FOTO).some((x) => primero.endsWith(x));
}

/** El código para sacar al agente de una charla (16/10: "pongamos un código, dos guiones"). */
export const esCodigoSalir = (texto) => /^(-{2,}|—|–|\/yo)$/i.test(String(texto).trim());

/**
 * Cande dice con sus palabras que la charla la agarra ella (17/10: "si le digo a Telegram que yo agarro la
 * charla, que se vaya"): "yo agarro la charla", "la sigo yo", "salí de la charla", "me encargo yo", "ya estoy yo".
 * Un pedido para el lead ("decile que...") es una indicación aunque nombre a Cande.
 */
export function quiereLaCharla(texto) {
  const t = String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  if (!t || t.length > 120) return false;
  // Lo más corto (17/10: "salí no más", "yo"): una palabra sola.
  if (/^(sali|salite|yo|mia|afuera|fuera|out)[.!]*$/.test(t)) return true;
  if (/^(decile|decirle|contestale|respondele|preguntale|mandale|escribile|pasale|ofrecele|avisale)\b/.test(t)) return false;
  return [
    /\b(yo|la|lo) (agarro|tomo|sigo|llevo|manejo|contesto|respondo|atiendo)\b/,
    /\b(agarro|tomo|sigo|llevo|manejo|contesto|respondo|atiendo|escribo|hablo)( la charla| esta charla| la conversacion)? yo\b/,
    /\byo (le|lo|la) (escribo|contesto|respondo|hablo|sigo|agarro)\b/,
    /\bme (encargo|ocupo)\b/,
    /\b(ya )?estoy yo\b/,
    /\bes mia\b/,
    /\b(sali|salite|anda|andate|retirate|correte)\b.{0,20}\b(charla|chat|conversacion|aca|ahi)\b/,
    /^(sali|salite|andate|retirate|correte|dejala|dejamela|deja|dejame)\b/,
    /\bno (le )?(escribas|contestes|respondas) mas\b/,
    /\bno te metas\b/,
  ].some((r) => r.test(t));
}

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
 *   { contacto, accion: "cande" }                      sacar al agente: la charla queda de Cande ("--")
 *   { contacto, accion: "ok", fechaAviso }             mandarle el borrador del código (respondió "ok" a ese aviso)
 * Respondiendo el resumen de las notas, cualquiera de esas con { resumen, numero } y contacto en null: el contacto
 * lo resuelve crearRespuestaTelegram con la lista guardada de ese resumen. Con varias (una por renglón):
 *   { varias: [...] }                                  cada una como las de arriba, en orden
 */
export function leerRespuesta(novedad, { duena }) {
  const m = novedad?.message;
  const deElla = m && duena && m.chat?.type === "private"
    && String(m.chat?.id) === String(duena) && String(m.from?.id) === String(duena);
  if (!deElla) return { ignorar: true };
  const texto = String(m.text || "").trim();
  if (!texto) return { ayuda: "Por ahora solo puedo mandarle texto." };
  const respondido = m.reply_to_message;
  // Un aviso con foto llega como foto: su texto es el epígrafe (caption).
  const textoAviso = respondido?.text ?? respondido?.caption;
  const delBot = respondido?.from?.is_bot === true;
  const fechaAviso = () => (Number.isFinite(respondido?.date) ? new Date(respondido.date * 1000) : new Date());
  const contacto = delBot ? contactoDeAviso(textoAviso) : null;
  if (contacto) return queHacer(texto, { contacto, textoAviso, fechaAviso });
  const resumen = delBot ? etiquetaDeResumen(textoAviso) : null;
  if (!resumen) return { ayuda: "Para contestarle a alguien, respondé (deslizá) el aviso de su charla." };
  const items = porNumero(texto);
  if (!items) return { ayuda: AYUDA_RESUMEN };
  if (items.repetido) return { ayuda: `El ${items.repetido} está dos veces: va un renglón por número. No mandé nada.` };
  const leidas = [];
  for (const { numero, texto: suyo } of items) {
    const r = queHacer(suyo, { contacto: null, textoAviso, fechaAviso });
    // Si una no se puede usar, no sale ninguna: que no quede la mitad hecha sin que sepa cuál.
    if (r.ayuda) return { ayuda: items.length > 1 ? `El ${numero}: ${r.ayuda} No mandé nada.` : r.ayuda };
    leidas.push({ ...r, resumen, numero });
  }
  return leidas.length === 1 ? leidas[0] : { varias: leidas };
}

/** Qué pidió Cande con lo que escribió, respondiendo el aviso de esa charla (o su renglón del resumen). */
function queHacer(texto, { contacto, textoAviso, fechaAviso: cuando }) {
  if (/^\/agente\b/i.test(texto)) return { contacto, accion: "agente" };
  if (esCodigoSalir(texto)) return { contacto, accion: "cande" };
  const fechaAviso = cuando();
  if (esOk(texto) && ofreceCodigo(textoAviso)) return { contacto, accion: "ok", fechaAviso };
  // Un ok solo a un aviso de foto sin borrador no es una indicación: no hay mensaje que aprobar, y el agente
  // tendría que adivinar qué quiso decir (el URGENTE dice "pasale el código"). Nada sale; el bot le pregunta.
  if (esOk(texto) && esAvisoDeFoto(textoAviso)) return { ayuda: SIN_MENSAJE };
  const textual = texto.match(/^\/textual\b\s*([\s\S]*)$/i);
  if (textual) {
    const t = textual[1].trim();
    if (!t) return { ayuda: "Escribí el mensaje después de /textual: se lo mando tal cual." };
    if (t.length > TOPE_RESPUESTA) return { ayuda: `Es muy largo para Instagram: hasta ${TOPE_RESPUESTA} caracteres.` };
    return { contacto, accion: "mandar", texto: t, fechaAviso };
  }
  if (texto.startsWith("/")) return { ayuda: AYUDA };
  if (quiereLaCharla(texto)) return { contacto, accion: "cande" };
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
    // El webhook ya contesta las ayudas sin llegar acá: si una llega igual, se dice y no se manda nada.
    if (r?.ayuda) {
      await decir(r.ayuda);
      return "ayuda";
    }
    if (!(await base.reclamarNovedad(updateId))) return "repetida";
    if (!r?.varias) return atender(r);
    // Varias desde el resumen: de a una, en orden. Si una falla, se dice cuál y siguen las demás.
    const hechos = [];
    for (const una of r.varias) {
      try {
        hechos.push(await atender(una));
      } catch (e) {
        await decir(`El ${una.numero}: no salió, algo falló del lado del sitio (${String(e.message).slice(0, 120)})`);
        hechos.push("falló");
      }
    }
    return hechos.join(", ");
  };

  /** Una respuesta, ya reclamada: la de un aviso, o un renglón del resumen. */
  async function atender(r) {
    // Respondió el resumen de las notas: el número es de la lista que se guardó con ese resumen.
    if (r?.resumen) {
      const id = await base.numeroDeResumen(r.resumen, r.numero);
      if (!id) {
        await decir(`No encuentro el ${r.numero} en ese resumen: fijate el número y respondé de nuevo.`);
        return "sin contacto";
      }
      r = { ...r, contacto: id };
    }
    const c = await base.contacto(r.contacto);
    if (!c) {
      await decir("No salió: no encuentro esa charla en la base del agente.");
      return "sin contacto";
    }
    const nombre = c.nombre || r.contacto;

    /**
     * El ok al borrador del código: sale tal cual, por el mismo camino que /textual, una sola vez (el
     * borrador se aparta antes de mandar). Si ManyChat dice que no salió, el borrador vuelve a quedar para
     * otro ok; si no se sabe, queda como incierto y no se repite.
     */
    const mandarCodigo = async () => {
      const s = await base.tomarBorradorCodigo(r.contacto);
      if (!s) {
        const previo = await base.codigoDe(r.contacto);
        if (previo?.estado === "enviada") await decir(`Ya se lo había mandado a ${nombre}: no lo repito.`);
        else if (previo && previo.estado !== "borrador") await decir(`No sé si le llegó a ${nombre}: fijate en Instagram antes de repetir. Si no lo tiene, mandáselo con /textual.`);
        else await decir(`No hay nada pendiente para mandarle a ${nombre}: no le mandé nada.`);
        return "ok sin borrador";
      }
      const mensajes = Array.isArray(s.mensajes) ? s.mensajes : [];
      const envio = await manychat.mandarTextos(r.contacto, mensajes);
      const resultado = resultadoDeEnvio(envio, nombre);
      if (!resultado.ok) {
        try {
          await base.marcarSalida(s.id, envio?.incierto ? "incierta" : "borrador", String(envio?.error || "no salió").slice(0, 300));
        } catch {
          // queda "enviando": un ok de nuevo dice que no se sabe si salió
        }
        await decir(envio?.incierto ? resultado.texto : `${resultado.texto.replace(/\.$/, "")}. El borrador sigue guardado: respondé ok de nuevo cuando se pueda.`);
        return "codigo sin salir";
      }
      try {
        await base.marcarSalida(s.id, "enviada");
        // Para el agente lo mandó Cande: queda en el historial como suyo, como lo de /textual.
        for (const t of mensajes) await base.anotarDeCande(r.contacto, t, r.fechaAviso);
        await base.descartarPendientes(r.contacto);
      } catch {
        await decir(`✓ Le mandé el código a ${nombre}, pero no lo pude anotar en la base: no lo mandes de nuevo.`);
        return "codigo enviado sin anotar";
      }
      await decir(`✓ Le mandé el código a ${nombre}: «${mensajes.join(" / ")}»`);
      return "codigo enviado";
    };

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

    if (r.accion === "cande") {
      // Ella se queda con la charla: el agente no le escribe más (ni toques) hasta que diga /agente.
      await base.ponerDueno(r.contacto, "cande");
      await base.descartarPendientes(r.contacto);
      const campo = await manychat.ponerCampo(r.contacto, "dm_dueno", "cande");
      await decir(`Listo: ${nombre} queda tuyo, el agente no le escribe más (/agente para devolvérselo).${campo.ok ? "" : " Ojo: no pude cambiar el campo dm_dueno en ManyChat."}`);
      return "cande";
    }

    if (r.accion === "agente") {
      const campo = await devolver();
      if (!campo) return "sin etiqueta";
      await decir(`${nombre} vuelve a ser del agente.${campo.ok ? "" : " Ojo: no pude cambiar el campo dm_dueno en ManyChat."}`);
      return "agente";
    }

    if (r.accion === "ok") return mandarCodigo();

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

    // Tal cual sale solo lo que Cande pidió así (/textual). Cualquier otra cosa no sale.
    if (r.accion !== "mandar") {
      await decir(AYUDA);
      return "sin accion";
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
  }
}
