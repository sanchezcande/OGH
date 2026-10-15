// Configuración del agente de DM. La usa Cande desde su dashboard (mismo secreto que la cola
// de publicación, COLA_SECRET). Nunca devuelve claves.
//
//   { accion: "prompt", texto }                    → guarda el prompt (vive en la base: este repo es público)
//   { accion: "ajustes", ajustes: { modo, ... } }  → cambia ajustes (modo: apagado | sombra | auto)
//   { accion: "dueno", contacto, dueno, nombre }   → le da un contacto al agente o se lo saca
//   { accion: "sembrar", contacto, nombre, contexto, mensajes: [{ quien, texto }] }
//                                                  → carga una charla que ya existía y se la da al agente
//   { accion: "anotar", contacto, quien, texto }   → deja constancia de lo que Cande mandó a mano
//   { accion: "reservar", contactos: [id, ...] }   → deja como de Cande, en tanda, a quienes todavía no figuran
//                                                  (se corre antes de prender las altas, con los contactos que ya existen)
//   { accion: "borrar", contacto }                 → borra todo lo guardado de una charla
//   { accion: "charla", contacto }                 → lo guardado de una charla
//   { accion: "telegram", grupo }                  → manda los avisos del agente a ese grupo de Telegram (el bot
//                                                  tiene que estar adentro); con quitar: true vuelven al chat de siempre
//   { accion: "estado" }                           → ajustes, cuántos contactos y las últimas salidas
//   { accion: "salidas", desde }                   → las respuestas del agente desde esa fecha (el repaso de cada hora)
//   { accion: "aviso", texto, contacto? }          → le avisa a Cande lo que encontró el repaso, por el Telegram del agente
//                                                  (con contacto, como aviso de esa charla: lo puede responder desde el bot)
//   { accion: "telegram_respuestas" }              → Cande contesta desde el bot del agente (webhook a /api/dm/telegram);
//                                                  con quitar: true se desconecta
//
// Cada cambio de prompt, de modo o de cualquier otro ajuste le llega a Cande por Telegram: si
// alguien más consigue el secreto y toca algo (el link de pago, por ejemplo), ella se entera en
// el momento. El prompt anterior queda guardado.
import { randomBytes } from "node:crypto";
import { avisarDm, mismoSecreto, olvidarChatDm, olvidarRespuestas, secretoDe, guardarSecretoDm } from "../../../lib/dm/armado";
import { segundosDesdeElLatido } from "../../../lib/dm/cola";
import {
  ajustes, anotarAMano, borrarCharla, cerrarTurno, contacto, descartarPendientes, guardarConfig, guardarPrompt,
  desdeValido, hayBase, historial, leerConfig, ponerDueno, prompt, reservar, resumen, salidasDesde, sembrar, tablas,
  ultimoIdLead, validarAjustes,
} from "../../../lib/dm/base";
import { hayManyChat, ponerCampo } from "../../../lib/dm/manychat";
import { avisar, buscarGrupo, chatDuena, hayBotDm, hayTelegram, llamarTelegram, tokenBotDm } from "../../../lib/notificar";

// Quién puede figurar en una charla cargada a mano. "agente" no: lo que mandó el agente lo anota él.
const QUIEN_SEMBRADO = ["lead", "cande", "automatico", "sistema"];
const QUIEN_A_MANO = ["cande", "automatico"];
const TOPE_TEXTO = 4000;
const TOPE_SIEMBRA = 300;
const TOPE_RESERVA = 5000;
const TOPE_AVISO = 3000;   // Telegram corta a los 4096
const SITIO = "https://www.opengatehub.com"; // con www: sin www redirige y Telegram no sigue la redirección

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!mismoSecreto(secretoDe(req), process.env.COLA_SECRET)) return res.status(401).json({ error: "no" });
  if (!hayBase()) return res.status(503).json({ error: "sin base" });
  await tablas();

  const b = req.body || {};
  const id = String(b.contacto || "").trim();

  if (b.accion === "prompt") {
    const texto = String(b.texto || "");
    if (texto.length < 2000) return res.status(400).json({ error: "el prompt es demasiado corto para ser el real" });
    const antes = await prompt();
    await guardarPrompt(texto);
    if (antes !== texto) {
      await avisarDm("DM: cambió el prompt del agente", {
        Caracteres: texto.length, "El anterior": antes ? `${antes.length} caracteres, quedó guardado` : "no había",
      });
    }
    return res.status(200).json({ ok: true, caracteres: texto.length, cambio: antes !== texto });
  }

  if (b.accion === "ajustes") {
    const pedido = validarAjustes(b.ajustes);
    if (!pedido.ok) return res.status(400).json({ error: pedido.error });
    const antes = await ajustes();
    const prende = pedido.ajustes.modo === "auto" || pedido.ajustes.modo === "sombra";
    // Sin prompt el agente no puede contestar nada: cada mensaje terminaría en error y aviso.
    if (prende && !(await prompt())) return res.status(409).json({ error: "no hay prompt cargado: primero subí el prompt" });
    // Un alta entra solo si el aviso a Cande sale: sin Telegram no entraría nadie y nadie sabría por qué.
    if (pedido.ajustes.altas === true && !hayTelegram()) return res.status(409).json({ error: "sin Telegram no hay altas: el aviso a Cande no saldría" });
    await guardarConfig("ajustes", { ...((await leerConfig("ajustes")) || {}), ...pedido.ajustes });
    const ahora = await ajustes();
    if (ahora.modo !== antes.modo) await avisarDm("DM: cambió el modo del agente", { Ahora: ahora.modo, Antes: antes.modo });
    // El link de pago es el único link ajeno que los frenos dejan pasar: un cambio no puede ser callado.
    const otros = Object.keys(pedido.ajustes).filter((k) => k !== "modo" && ahora[k] !== antes[k]);
    if (otros.length) {
      const ver = (v) => (v === "" ? "(vacío)" : v);
      await avisarDm("DM: cambiaron ajustes del agente", Object.fromEntries(otros.map((k) => [k, `${ver(antes[k])} → ${ver(ahora[k])}`])));
    }
    return res.status(200).json({ ok: true, ajustes: ahora });
  }

  if (b.accion === "reservar") {
    const ids = Array.isArray(b.contactos) ? [...new Set(b.contactos.map((x) => String(x ?? "").trim()))] : [];
    if (!ids.length || ids.length > TOPE_RESERVA || ids.some((x) => !/^[0-9A-Za-z_-]{1,40}$/.test(x))) {
      return res.status(400).json({ error: `contactos tiene que ser una lista de hasta ${TOPE_RESERVA} ids` });
    }
    return res.status(200).json({ ok: true, recibidos: ids.length, reservados: await reservar(ids) });
  }

  if (b.accion === "dueno") {
    if (!id || !["agente", "cande"].includes(b.dueno)) return res.status(400).json({ error: "falta contacto o dueno" });
    const previo = await contacto(id);
    await ponerDueno(id, b.dueno, b.nombre || null);
    // Si la toma Cande, lo que el agente había dejado listo para retirar ya no sale.
    if (b.dueno === "cande") await descartarPendientes(id);
    // Si vuelve de Cande al agente, lo escrito hasta acá queda como atendido y él sigue desde lo
    // que el lead escriba de ahí en más. Sin esto el cron la encuentra de nuevo con un mensaje
    // sin contestar y se la vuelve a pasar a Cande, una y otra vez. Si ya era del agente no se
    // toca: puede haber un mensaje en camino.
    if (b.dueno === "agente" && previo?.dueno === "cande") await cerrarTurno(id, (await ultimoIdLead(id)) || 0);
    // El mismo campo que mira la Regla de ManyChat para pausar sus automáticos.
    const campo = await ponerCampo(id, "dm_dueno", b.dueno);
    return res.status(200).json({ ok: true, contacto: await contacto(id), manychat: campo.ok });
  }

  if (b.accion === "sembrar") {
    // Para retomar una charla vieja: se carga entera, con lo que Cande mandó a mano al final.
    // No hace que el agente escriba: el agente recién puede contestar cuando el lead escribe,
    // que es lo que abre la ventana de 24 horas. El primer mensaje lo manda siempre Cande.
    const filas = (Array.isArray(b.mensajes) ? b.mensajes : [])
      .filter((m) => QUIEN_SEMBRADO.includes(m?.quien) && String(m?.texto || "").trim())
      .map((m) => ({ quien: m.quien, texto: String(m.texto).trim().slice(0, TOPE_TEXTO) }));
    if (!id || !filas.length) return res.status(400).json({ error: "falta contacto o mensajes" });
    if (filas.length > TOPE_SIEMBRA) return res.status(400).json({ error: `son más de ${TOPE_SIEMBRA} mensajes` });
    if ((await historial(id, 1)).length) return res.status(409).json({ error: "esa charla ya tiene historial" });
    await sembrar(id, {
      nombre: String(b.nombre || "").trim().slice(0, 80) || null,
      contexto: String(b.contexto || "").trim().slice(0, 300), mensajes: filas,
    });
    const campo = await ponerCampo(id, "dm_dueno", "agente");
    return res.status(200).json({ ok: true, cargados: filas.length, manychat: campo.ok });
  }

  if (b.accion === "anotar") {
    // Lo que Cande manda a mano (o el borrador del agente que ella copió) tiene que quedar en el
    // historial: si no, en el turno siguiente el modelo redacta sin saber qué se contestó.
    const texto = String(b.texto || "").trim();
    if (!id || !texto || !QUIEN_A_MANO.includes(b.quien)) return res.status(400).json({ error: "falta contacto, quien o texto" });
    if (!(await contacto(id))) return res.status(404).json({ error: "ese contacto no está en la base del agente" });
    await anotarAMano(id, b.quien, texto.slice(0, TOPE_TEXTO));
    return res.status(200).json({ ok: true });
  }

  if (b.accion === "borrar") {
    if (!id) return res.status(400).json({ error: "falta contacto" });
    const borrado = await borrarCharla(id);
    const campo = await ponerCampo(id, "dm_dueno", "cande");
    return res.status(200).json({ ok: true, ...borrado, manychat: campo.ok });
  }

  if (b.accion === "charla") {
    return res.status(200).json({ contacto: await contacto(id), mensajes: await historial(id) });
  }

  if (b.accion === "secreto") {
    // El secreto que ManyChat manda en x-dm-secreto. Lo genera el dashboard de Cande; acá queda
    // solo su huella. Así no hace falta cargar nada en Vercel.
    const valor = String(b.valor || "");
    if (valor.length < 24) return res.status(400).json({ error: "el secreto tiene que tener 24 caracteres o más" });
    await guardarSecretoDm(valor);
    await avisarDm("DM: cambió el secreto de ManyChat", { Nota: "si no fuiste vos, apagá el agente" });
    return res.status(200).json({ ok: true });
  }

  if (b.accion === "telegram") {
    // El cambio de chat se avisa siempre en el de siempre (TELEGRAM_CHAT_ID, que no se toca con este
    // secreto): quien consiga el secreto no puede llevarse los avisos a otro lado sin que Cande lo vea.
    if (b.quitar === true) {
      await guardarConfig("telegram_dm", {});
      olvidarChatDm();
      await avisar("DM: los avisos del agente volvieron a este chat", { Nota: "si no fuiste vos, apagá el agente" });
      return res.status(200).json({ ok: true, grupo: null });
    }
    const nombre = String(b.grupo || "").trim().slice(0, 80);
    if (!nombre) return res.status(400).json({ error: "falta el nombre del grupo" });
    const grupo = await buscarGrupo(nombre);
    if (grupo?.varios) return res.status(409).json({ error: "hay más de un grupo con ese nombre: ponele un nombre único y probá de nuevo" });
    if (!grupo) {
      return res.status(404).json({ error: "no veo ese grupo: tiene que llamarse igual y tenés que haber sumado vos al bot hace menos de un día. Sacá el bot del grupo, volvé a sumarlo y probá de nuevo" });
    }
    // Primero las dos pruebas: si alguno de los dos mensajes no llega, no se guarda y todo sigue como estaba.
    const llego = await avisar("DM: este es el chat del agente", {
      Nota: "acá te van a llegar las charlas que te pasa, los devs nuevos que entran y las fallas",
    }, { chat: grupo.id });
    if (!llego) return res.status(502).json({ error: "encontré el grupo pero el mensaje de prueba no llegó: nada cambió" });
    const supo = await avisar("DM: los avisos del agente cambiaron de chat", { Grupo: grupo.nombre, Nota: "si no fuiste vos, apagá el agente" });
    if (!supo) return res.status(502).json({ error: "no pude avisar del cambio en el chat de siempre: nada cambió" });
    await guardarConfig("telegram_dm", grupo);
    olvidarChatDm();
    return res.status(200).json({ ok: true, grupo: grupo.nombre });
  }

  if (b.accion === "salidas") {
    const desde = desdeValido(b.desde);
    if (!desde) return res.status(400).json({ error: "desde: una fecha de la última semana" });
    return res.status(200).json({ salidas: await salidasDesde(desde) });
  }

  if (b.accion === "aviso") {
    const texto = String(b.texto || "").trim().slice(0, TOPE_AVISO);
    if (!texto) return res.status(400).json({ error: "falta el texto" });
    // Con contacto, el aviso es de una charla: lleva su renglón Quién y Cande lo puede responder desde el bot.
    if (id) {
      const c = await contacto(id);
      if (!c) return res.status(404).json({ error: "ese contacto no está en la base del agente" });
      const nombre = String(c.nombre || "sin nombre").replace(/\s+/g, " ");
      const llego = await avisarDm("DM: charla para mirar", { Quién: `${nombre} (${id})`, Aviso: texto });
      return res.status(llego ? 200 : 502).json({ ok: Boolean(llego) });
    }
    const llego = await avisarDm("DM: repaso de las charlas", { Repaso: texto });
    return res.status(llego ? 200 : 502).json({ ok: Boolean(llego) });
  }

  if (b.accion === "telegram_respuestas") {
    const token = tokenBotDm();
    if (!token) return res.status(409).json({ error: "falta el bot del agente: TELEGRAM_DM_BOT_TOKEN, con TELEGRAM_CHAT_ID de tu chat privado" });
    if (b.quitar === true) {
      const r = await llamarTelegram(token, "deleteWebhook", {});
      await guardarConfig("telegram_respuestas", {});
      olvidarRespuestas();
      return res.status(r.ok ? 200 : 502).json(r.ok ? { ok: true } : { error: r.description });
    }
    // El secreto se guarda antes de conectar: si no, la primera novedad llegaría sin con qué compararlo.
    const secreto = randomBytes(24).toString("hex");
    await guardarConfig("telegram_respuestas", { secreto, vistos: [] });
    const r = await llamarTelegram(token, "setWebhook", {
      url: `${SITIO}/api/dm/telegram`, secret_token: secreto, allowed_updates: ["message"], drop_pending_updates: true,
    });
    if (!r.ok) {
      await guardarConfig("telegram_respuestas", {});
      return res.status(502).json({ error: `Telegram no aceptó la conexión: ${r.description}` });
    }
    olvidarRespuestas();
    await llamarTelegram(token, "sendMessage", {
      chat_id: chatDuena(),
      text: "Ya podés contestar desde acá: respondé (deslizá) el aviso de una charla y se lo mando al lead por Instagram. " +
        "Respondiendo un aviso con /agente, esa charla vuelve al agente.",
    });
    return res.status(200).json({ ok: true, manychat: hayManyChat() });
  }

  if (b.accion === "estado") {
    return res.status(200).json({
      ajustes: await ajustes(),
      prompt_cargado: (await prompt()).length,
      prompt_anterior: ((await leerConfig("prompt_anterior"))?.texto || "").length,
      claves: {
        anthropic: Boolean(process.env.ANTHROPIC_API_KEY), manychat: hayManyChat(),
        dm_secreto: Boolean(process.env.DM_SECRETO) || Boolean((await leerConfig("secreto_dm"))?.huella),
        telegram: hayTelegram(), bot_del_agente: hayBotDm(), respuestas_por_telegram: Boolean((await leerConfig("telegram_respuestas"))?.secreto), telegram_del_agente: (await leerConfig("telegram_dm"))?.nombre || null,
        cron_secret: Boolean(process.env.CRON_SECRET),
      },
      cerebro_local_hace_segundos: await segundosDesdeElLatido(),
      ...(await resumen()),
    });
  }

  return res.status(400).json({ error: "accion desconocida" });
}
