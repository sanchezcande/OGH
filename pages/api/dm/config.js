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
//   { accion: "desanotar", contacto, textos }      → saca lo anotado como de Cande en las últimas 24 h que al final no
//                                                  salió (texto exacto); para corregir un borrador antes de que ella lo pegue
//   { accion: "retomar_marcar", contactos: [id, ...], dias?, quitar? } → marca como retomadas esas charlas por `dias`
//                                                  (7 si no se dice, de 1 a 30): si Cande les escribe a mano desde
//                                                  Instagram, el agente no sale, anota lo suyo y sigue (lib/dm/instagram.js).
//                                                  Con quitar: true les saca la marca. Su "--" las saca igual
//   { accion: "borrar", contacto }                 → borra todo lo guardado de una charla
//   { accion: "charla", contacto }                 → lo guardado de una charla
//   { accion: "telegram", grupo }                  → manda los avisos del agente a ese grupo de Telegram (el bot
//                                                  tiene que estar adentro); con quitar: true vuelven al chat de siempre
//   { accion: "estado" }                           → ajustes, cuántos contactos y las últimas salidas
//   { accion: "salidas", desde }                   → las respuestas del agente desde esa fecha (el repaso de cada hora)
//   { accion: "aviso", texto, contacto? }          → le avisa a Cande lo que encontró el repaso, por el Telegram del agente
//   { accion: "mandar_humano", contacto, textos }  → manda un mensaje de Cande (escrito o aprobado por ella) dentro
//                                                  de las 24 h del último mensaje del lead (ManyChat no acepta HUMAN_AGENT
//                                                  en Instagram: pasadas las 24 h, solo a mano). Queda anotado como de ella.
//                                                  Sin contacto, con igsid, usuario y nombres: lo busca en ManyChat como
//                                                  la red de la bandeja; con etiquetar: true le pone agente_dm, así lo que
//                                                  conteste le llega al agente. Devuelve el contacto de ManyChat.
//   { accion: "buscar_ig", igsid, usuario, nombres, etiquetar? } → quién es en ManyChat alguien de Instagram que no
//                                                  está en la base, sin mandarle nada (con etiquetar: true, le pone agente_dm).
//                                                  Para sembrar una charla que Cande va a contestar a mano y que siga el agente
//   { accion: "nota", contacto, texto }            → lo que encontró el repaso y no es para ahora: va al resumen de las
//                                                  notas, a las 9 y a las 18 de Bali y sin sonido (lib/dm/resumen.js)
//   { accion: "telegram_respuestas" }              → Cande contesta desde el bot del agente (webhook a /api/dm/telegram);
//                                                  con quitar: true se desconecta
//   { accion: "controlador_patrones", patrones }   → guarda cómo reconoce el recorrido el controlador (lib/dm/controlador.js):
//                                                  salen del prompt, que es privado, así que viven en la base y no en el
//                                                  código. Cada patrón tiene que compilar; si falta uno no se guarda nada.
//                                                  No devuelve los patrones
//   { accion: "seguidos", usuarios: [...], reemplazar? } → carga la lista de cuentas que sigue Cande (la baja ella de
//                                                  Instagram); con el ajuste "seguidos", el agente no le escribe a esa gente
//   { accion: "instagram", contacto? }             → prueba la lectura directa de Instagram sin cambiar nada: la cuenta,
//                                                  si lee la bandeja y, con contacto, si encuentra su charla, si Cande
//                                                  la sigue y si hay un "--" que cuente (lib/dm/instagram.js)
//
// Cada cambio de prompt, de modo o de cualquier otro ajuste le llega a Cande por Telegram: si
// alguien más consigue el secreto y toca algo (el link de pago, por ejemplo), ella se entera en
// el momento. El prompt anterior queda guardado.
import { randomBytes } from "node:crypto";
import {
  avisarDm, guardarSecretoDm, instagram, mismoSecreto, olvidarChatDm, olvidarRespuestas, reglasInstagram, secretoDe,
} from "../../../lib/dm/armado";
import { segundosDesdeElLatido } from "../../../lib/dm/cola";
import {
  ajustes, anotarAMano, anotarSeguidos, borrarCharla, cualesDelAgente, desanotar, guardarIg, guardarSalida, textosDeLaCuenta, tokenRed, cerrarTurno, reabrirTurno, contacto, descartarPendientes, guardarConfig, guardarPrompt,
  desdeValido, hayBase, historial, leerConfig, marcarRetomadas, ponerDueno, prompt, reservar, resumen, salidasDesde, sembrar, tablas,
  ultimoIdLead, validarAjustes,
} from "../../../lib/dm/base";
import {
  CLAVE_RETOMADAS, DIAS_RETOMADA, codigoEnHilo, desdeDe, desdeManual, esRetomada, explicarError, linkCharlaIg, manualEnHilo, usuarioIg,
  usuarioParaAviso,
} from "../../../lib/dm/instagram";
import { buscarPorNombre, datosDe, hayManyChat, mandarTextos, ponerCampo, ponerEtiqueta } from "../../../lib/dm/manychat";
import { ETIQUETA_AGENTE, identificar } from "../../../lib/dm/bandeja";
import { CLAVE_PATRONES, validarPatrones } from "../../../lib/dm/controlador";
import { frenoDelCodigo } from "../../../lib/dm/frenos";
import { avisar, buscarGrupo, chatDuena, hayBotDm, hayTelegram, llamarTelegram, tokenBotDm } from "../../../lib/notificar";

// Quién puede figurar en una charla cargada a mano. "agente" no: lo que mandó el agente lo anota él.
const QUIEN_SEMBRADO = ["lead", "cande", "automatico", "sistema"];
const QUIEN_A_MANO = ["cande", "automatico"];
const TOPE_TEXTO = 4000;
const TOPE_SIEMBRA = 300;
const TOPE_RESERVA = 5000;
const TOPE_RETOMADAS = 1000;
const DIA_MS = 86400000;
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
    // Sin aviso: el anterior queda guardado, y a Cande solo le llega lo que necesita que haga algo
    // (16/10: "los avisos tienen que ser solo de los que el bot no sabe qué hacer o si es relevante").
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
    // Los demás ajustes cambian sin aviso.
    if (ahora.link_mercadopago !== antes.link_mercadopago) {
      const ver = (v) => (v === "" ? "(vacío)" : v);
      await avisarDm("DM: cambió el link de MercadoPago del agente", { Antes: ver(antes.link_mercadopago), Ahora: ver(ahora.link_mercadopago) });
    }
    if (ahora.link_de_pago !== antes.link_de_pago) {
      const ver = (v) => (v === "" ? "(vacío)" : v);
      await avisarDm("DM: cambió el link de pago del agente", { Antes: ver(antes.link_de_pago), Ahora: ver(ahora.link_de_pago) });
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

  if (b.accion === "retomar_marcar") {
    // Antes de que Cande conteste a mano las charlas viejas (20/10): la marca dura `dias` y después vence sola.
    const ids = Array.isArray(b.contactos) ? [...new Set(b.contactos.map((x) => String(x ?? "").trim()))] : [];
    if (!ids.length || ids.length > TOPE_RETOMADAS || ids.some((x) => !/^[0-9A-Za-z_-]{1,40}$/.test(x))) {
      return res.status(400).json({ error: `contactos tiene que ser una lista de hasta ${TOPE_RETOMADAS} ids` });
    }
    const dias = b.dias === undefined || b.dias === null ? DIAS_RETOMADA : b.dias;
    if (!Number.isInteger(dias) || dias < 1 || dias > 30) return res.status(400).json({ error: "dias: un entero de 1 a 30" });
    const quitar = b.quitar === true;
    const hasta = Date.now() + dias * DIA_MS;
    const vigentes = await marcarRetomadas(ids, { hasta, quitar });
    if (quitar) return res.status(200).json({ ok: true, recibidos: ids.length, vigentes });
    // Las que todavía no son del agente: la marca sola no se las da (eso es "dueno" o "sembrar").
    const delAgente = new Set(await cualesDelAgente(ids));
    return res.status(200).json({
      ok: true, recibidos: ids.length, vigentes, hasta: new Date(hasta).toISOString(), no_son_del_agente: ids.filter((x) => !delAgente.has(x)),
    });
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
    // Con retomar (una charla que se le pasó a Cande y nadie contestó) es al revés: lo que el lead
    // escribió después de lo último de la cuenta queda abierto y la espera se lo contesta tarde.
    let abiertos = 0;
    if (b.dueno === "agente" && b.retomar === true) abiertos = await reabrirTurno(id);
    else if (b.dueno === "agente" && previo?.dueno === "cande") await cerrarTurno(id, (await ultimoIdLead(id)) || 0);
    // El mismo campo que mira la Regla de ManyChat para pausar sus automáticos.
    const campo = await ponerCampo(id, "dm_dueno", b.dueno);
    return res.status(200).json({ ok: true, contacto: await contacto(id), manychat: campo.ok, ...(b.retomar === true ? { abiertos } : {}) });
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

  if (b.accion === "mandar_humano") {
    // Un mensaje de Cande (escrito o aprobado por ella), dentro de las 24 h: queda anotado como de ella. Se pensó
    // para las charlas de hasta 7 días con la etiqueta HUMAN_AGENT, pero ManyChat la rechaza en Instagram (20/10,
    // "Unsupported message tag"): pasadas las 24 h no hay API, se contesta a mano.
    // Si no está en la base (escribió y ManyChat nunca lo pasó), se lo busca en ManyChat por su id de Instagram.
    const textos = (Array.isArray(b.textos) ? b.textos : [b.texto]).map((t) => String(t || "").trim()).filter(Boolean);
    const igsid = String(b.igsid || "").trim();
    if (!(id || igsid) || !textos.length || textos.length > 3 || textos.some((t) => t.length > 1000)) {
      return res.status(400).json({ error: "falta contacto o textos (de 1 a 3, hasta 1000 caracteres)" });
    }
    const aj = await ajustes();
    if (frenoDelCodigo({ mensajes: textos }, aj.codigo_mercadopago)?.ok === false) {
      return res.status(400).json({ error: "el texto trae el código de acceso: eso sale solo con el ok del aviso del código" });
    }
    let destino = id;
    if (!destino) {
      const q = await buscarIg(igsid, b);
      if (!q.id) return res.status(q.status).json({ ok: false, error: q.error });
      destino = q.id;
    }
    const envio = await mandarTextos(destino, textos);
    if (!envio.ok) return res.status(502).json({ ok: false, contacto: destino, error: envio.error, code: envio.code, incierto: envio.incierto || false });
    if (await contacto(destino)) await anotarAMano(destino, "cande", textos.join("\n").slice(0, TOPE_TEXTO));
    const etiqueta = b.etiquetar === true ? (await ponerEtiqueta(destino, ETIQUETA_AGENTE))?.ok === true : null;
    return res.status(200).json({ ok: true, contacto: destino, etiqueta });
  }

  if (b.accion === "buscar_ig") {
    const igsid = String(b.igsid || "").trim();
    if (!igsid) return res.status(400).json({ error: "falta igsid" });
    const q = await buscarIg(igsid, b);
    if (!q.id) return res.status(q.status).json({ ok: false, error: q.error });
    const etiqueta = b.etiquetar === true ? (await ponerEtiqueta(q.id, ETIQUETA_AGENTE))?.ok === true : null;
    return res.status(200).json({ ok: true, contacto: q.id, nombre: q.nombre || null, etiqueta });
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

  if (b.accion === "desanotar") {
    const textos = (Array.isArray(b.textos) ? b.textos : []).map((t) => String(t || "").trim()).filter(Boolean);
    if (!id || !textos.length || textos.length > 10) return res.status(400).json({ error: "falta contacto o textos (de 1 a 10)" });
    return res.status(200).json({ ok: true, sacados: await desanotar(id, textos) });
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
      const link = linkCharlaIg(await usuarioParaAviso(c, { base: { guardarIg }, manychat: { datosDe } }));
      const llego = await avisarDm("DM: charla para mirar", { Quién: `${nombre} (${id})`, Aviso: texto, ...(link ? { Instagram: link } : {}) });
      return res.status(llego ? 200 : 502).json({ ok: Boolean(llego) });
    }
    const llego = await avisarDm("DM: repaso de las charlas", { Repaso: texto });
    return res.status(llego ? 200 : 502).json({ ok: Boolean(llego) });
  }

  if (b.accion === "nota") {
    // Queda como una salida con aviso "NOTA:", igual que las notas del agente: el resumen las junta (20/10).
    const texto = String(b.texto || "").replace(/^NOTA:\s*/, "").trim().slice(0, 500);
    if (!texto) return res.status(400).json({ error: "falta el texto" });
    if (!id || !(await contacto(id))) return res.status(404).json({ error: "ese contacto no está en la base del agente" });
    await guardarSalida({ contacto: id, accion: "nota", estado: "nota", aviso: `NOTA: ${texto}` });
    return res.status(200).json({ ok: true });
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

  if (b.accion === "automaticos") {
    // Los textos de los automáticos de ManyChat: salen de la cuenta pero no los escribió Cande a mano.
    const textos = Array.isArray(b.textos) ? b.textos.map((t) => String(t || "").trim()).filter(Boolean).slice(0, 200) : [];
    if (!textos.length) return res.status(400).json({ error: "textos: una lista" });
    await guardarConfig("automaticos", { textos });
    return res.status(200).json({ ok: true, textos: textos.length });
  }

  if (b.accion === "controlador_patrones") {
    // Como los automáticos: viven en la base. Se revisan enteros antes de guardar (validarPatrones): uno que no compila,
    // o que coincide con cualquier texto, haría marcar o corregir lo que no es. El error nombra la clave, no el patrón.
    if (JSON.stringify(b.patrones ?? null).length > 50000) return res.status(400).json({ error: "patrones: demasiado grande" });
    const v = validarPatrones(b.patrones);
    if (!v.ok) return res.status(400).json({ error: v.error });
    await guardarConfig(CLAVE_PATRONES, v.patrones);
    return res.status(200).json({ ok: true, patrones: Object.keys(v.patrones).length - 1, clases: v.patrones.clases.length });
  }

  if (b.accion === "seguidos") {
    const usuarios = Array.isArray(b.usuarios) ? [...new Set(b.usuarios.map((u) => usuarioIg(u)))].filter(Boolean) : [];
    if (!usuarios.length || usuarios.length > 20000 || usuarios.some((u) => !/^[a-z0-9._]{1,30}$/.test(u))) {
      return res.status(400).json({ error: "usuarios: una lista de usuarios de Instagram" });
    }
    return res.status(200).json({ ok: true, recibidos: usuarios.length, en_la_lista: await anotarSeguidos(usuarios, { reemplazar: b.reemplazar === true }) });
  }

  if (b.accion === "instagram") {
    // Para probar la conexión el día que se carga el token. Solo lee: lo único que guarda es el
    // usuario y el id de Instagram del contacto, si los encuentra. No devuelve textos ni usuarios.
    const out = { reglas: (await ajustes()).instagram === true, dias_de_token: await instagram.diasQueQuedan() };
    let yo;
    try {
      yo = await instagram.cuenta();
      out.cuenta = yo.username;
    } catch (e) {
      return res.status(502).json({ ...out, error: explicarError(e), code: e.code ?? null });
    }
    try {
      const hs = await instagram.hilos({ limite: 5 });
      const conTexto = await Promise.all(hs.slice(0, 2).map((h) => instagram.completo(h)));
      out.bandeja = {
        charlas: hs.length, con_la_otra_persona: hs.filter((h) => h.otro).length,
        anidado: hs.every((h) => (h.crudo?.messages?.data || []).every((m) => m.from)),
        mensajes_con_texto: conTexto.reduce((n, h) => n + h.mensajes.filter((m) => m.texto != null).length, 0),
      };
    } catch (e) {
      out.bandeja = { error: explicarError(e), code: e.code ?? null };
    }
    if (id) {
      const c = await contacto(id);
      if (!c) return res.status(404).json({ ...out, error: "ese contacto no está en la base del agente" });
      try {
        const igsid = await reglasInstagram.resolver(c);
        out.contacto = { dueno: c.dueno, encontrado: Boolean(igsid) };
        if (igsid) {
          const [hilo, p] = await Promise.all([instagram.hiloDe(igsid), instagram.perfil(igsid)]);
          Object.assign(out.contacto, {
            la_seguis: p.laSigue, mensajes_con_texto: hilo ? hilo.mensajes.filter((m) => m.texto != null).length : 0,
            hay_codigo: Boolean(hilo && codigoEnHilo(hilo, yo, desdeDe(c))),
            escribio_cande: Boolean(hilo && manualEnHilo(hilo, yo, await textosDeLaCuenta(id), desdeManual(c))),
            retomada: esRetomada(await leerConfig(CLAVE_RETOMADAS), id),
          });
        }
      } catch (e) {
        out.contacto = { error: explicarError(e), code: e.code ?? null };
      }
    }
    return res.status(200).json(out);
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
        cron_secret: Boolean(process.env.CRON_SECRET), instagram: Boolean(await tokenRed("ig")),
      },
      cerebro_local_hace_segundos: await segundosDesdeElLatido(),
      ...(await resumen()),
    });
  }

  return res.status(400).json({ error: "accion desconocida" });
}

/**
 * Quién es en ManyChat alguien de Instagram que no está en la base: lo busca igual que la red de la bandeja (por
 * nombre, y vale solo si coincide su usuario o su id de Instagram). { id, nombre } o { id: null, status, error }.
 */
async function buscarIg(igsid, b) {
  if (!hayManyChat()) return { id: null, status: 503, error: "falta la clave de ManyChat" };
  const nombres = (Array.isArray(b.nombres) ? b.nombres : []).concat(b.usuario).slice(0, 4);
  const q = await identificar({ buscarPorNombre, datosDe }, { igsid, usuario: String(b.usuario || ""), nombres, hasta: Date.now() + 20000 });
  if (q.id) return q;
  const error = q.varios ? "hay más de un contacto con ese usuario en ManyChat" : q.falla ? "ManyChat no contestó" : "no está en ManyChat";
  return { id: null, status: 404, error };
}
