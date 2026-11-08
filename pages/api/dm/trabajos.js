// Ventanilla del cerebro local: la Mac de Cande retira acá los turnos que hay que redactar y
// entrega la respuesta. La llama tracker/dm_cerebro.py con el secreto del dashboard (COLA_SECRET).
// Ver lib/dm/cola.js.
//
//   { accion: "tomar" }                    → { trabajo: { id, turno, link_de_pago, imagenes, edad } } o { trabajo: null }
//                                            (edad: segundos desde que se armó el turno; la Mac descuenta eso
//                                            del tiempo que tiene antes de que ManyChat retire la respuesta.
//                                            imagenes: los links de las fotos que mandó el lead en ese turno,
//                                            casi siempre vacío; la Mac se las muestra a Claude)
//   { accion: "resultado", id, salida }    → entrega la salida del modelo (con imagenes_vistas: cuántas de esas
//                                            fotos pudo ver; sin el dato, el agente las da por no vistas)
//   { accion: "resultado", id, error }     → avisa que no pudo: la charla pasa a ser de Cande
//
// Correcciones por Telegram (09/11, lib/dm/correcciones.js). El cerebro de la nube:
//   { accion: "prompt_leer" }                     → { prompt, revisor, huellas: { prompt, revisor } }: los que están en la
//                                                    base (el cerebro los usa en vez de los archivos que trae) y su md5
//   { accion: "prompt_escribir", cual, texto, base }
//                                                 → cual "prompt" o "revisor". Solo si el de la base sigue siendo el que se
//                                                    leyó (base: su md5): si no, 409 y no pisa nada. El anterior queda en
//                                                    prompt_anterior o revisor_anterior
//   { accion: "correccion_tomar" }                → { correccion: { lote, texto, fotos: n, contacto, respondiendo,
//                                                    deshacer, anterior, mensajeId } } o { correccion: null }
//   { accion: "correccion_foto", lote, i }        → { foto: { tipo, datos } } (base64, de a una: Vercel corta las
//                                                    respuestas a los 4,5 MB) o { foto: null }
//   { accion: "charla_buscar", contacto|usuario } → { charla: { contacto, mensajes, salidas } } o { charla: null }
//   { accion: "correccion_ultima" }               → { ultima: { lote, resultado } }: la última que cambió algo
//   { accion: "correccion_resultado", lote, estado, texto, resultado, deshizo, mensaje_id }
//                                                 → la cierra y le contesta a Cande por el bot
import { createHash } from "node:crypto";
import { mismoSecreto, secretoDe } from "../../../lib/dm/armado";
import { guardarConfig, guardarPrompt, hayBase, leerConfig, prompt as promptGuardado, tablas } from "../../../lib/dm/base";
import { bajarFoto, cortarParaTelegram } from "../../../lib/dm/correcciones";
import {
  charlaParaCorregir, fotosDelLote, marcarDeshecha, tomarCorreccion, terminarCorreccion, ultimaConCambios,
} from "../../../lib/dm/correccionesBase";
import { chatDuena, llamarTelegram, tokenBotDm } from "../../../lib/notificar";
import { entregarTrabajo, latido, tomarTrabajo } from "../../../lib/dm/cola";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!mismoSecreto(secretoDe(req), process.env.COLA_SECRET)) return res.status(401).json({ error: "no" });
  if (!hayBase()) return res.status(503).json({ error: "sin base" });

  const b = req.body || {};
  if (b.accion === "tomar") {
    await latido();
    return res.status(200).json({ trabajo: await tomarTrabajo() });
  }
  if (b.accion === "resultado") {
    const id = Number(b.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "falta id" });
    const resultado = b.salida && typeof b.salida === "object" ? b.salida : { error: String(b.error || "sin detalle").slice(0, 300) };
    return res.status(200).json({ ok: await entregarTrabajo(id, resultado) });
  }
  if (b.accion === "prompt_leer") {
    await tablas();
    const prompt = (await promptGuardado()) || null;
    const revisor = (await leerConfig("revisor"))?.texto || null;
    return res.status(200).json({ prompt, revisor, huellas: { prompt: huella(prompt), revisor: huella(revisor) } });
  }
  if (b.accion === "prompt_escribir") {
    await tablas();
    const texto = String(b.texto || "");
    if (!["prompt", "revisor"].includes(b.cual)) return res.status(400).json({ error: "cual es prompt o revisor" });
    const [minimo, maximo] = TOPES[b.cual];
    if (texto.length < minimo) return res.status(400).json({ error: `el ${b.cual} es demasiado corto para ser el real` });
    // El sistema le llega a Claude por la línea de comandos, con tope de 128 KB en Linux: que no crezca sin control.
    if (Buffer.byteLength(texto) > maximo) return res.status(400).json({ error: `el ${b.cual} pasa de ${maximo} bytes` });
    const actual = b.cual === "prompt" ? await promptGuardado() : (await leerConfig("revisor"))?.texto || null;
    // Solo sobre el que se leyó: si alguien subió otro mientras tanto (dm_nube.py, otra corrección), no se pisa.
    if (huella(actual) !== String(b.base || "")) return res.status(409).json({ error: `el ${b.cual} cambió mientras tanto: no lo piso` });
    if (b.cual === "prompt") await guardarPrompt(texto);
    else {
      if (actual && actual !== texto) await guardarConfig("revisor_anterior", { texto: actual });
      await guardarConfig("revisor", { texto });
    }
    return res.status(200).json({ ok: true, huella: huella(texto) });
  }
  if (b.accion === "correccion_tomar") {
    const { correccion, perdidas } = await tomarCorreccion();
    for (const p of perdidas || []) {
      await llamarTelegram(tokenBotDm(), "sendMessage", {
        chat_id: chatDuena(), text: "🔧 No pude con esta corrección (lo intenté tres veces). No cambié nada: mandámela de nuevo?",
        ...(p.mensaje_id ? { reply_to_message_id: Number(p.mensaje_id), allow_sending_without_reply: true } : {}),
      });
    }
    if (!correccion) return res.status(200).json({ correccion: null });
    const fotosAnteriores = correccion.fotos.length ? [] : correccion.anterior?.fotos || [];
    return res.status(200).json({ correccion: { ...correccion, fotos: correccion.fotos.length || fotosAnteriores.length, anterior: correccion.anterior ? { contacto: correccion.anterior.contacto, resultado: correccion.anterior.resultado } : null } });
  }
  if (b.accion === "correccion_foto") {
    const lote = Number(b.lote);
    const i = Number(b.i);
    if (!Number.isInteger(lote) || !Number.isInteger(i) || i < 0) return res.status(400).json({ error: "falta lote o i" });
    // Las del lote o, si sigue otra corrección sin captura nueva, las de esa (fotosDelLote).
    const f = (await fotosDelLote(lote))[i];
    return res.status(200).json({ foto: f ? await bajarFoto(tokenBotDm(), f, { tope: 3 * 1024 * 1024 }) : null });
  }
  if (b.accion === "charla_buscar") {
    await tablas();
    return res.status(200).json({ charla: await charlaParaCorregir({ contacto: b.contacto || null, usuario: b.usuario || null }) });
  }
  if (b.accion === "correccion_ultima") {
    return res.status(200).json({ ultima: await ultimaConCambios() });
  }
  if (b.accion === "correccion_resultado") {
    const lote = Number(b.lote);
    if (!Number.isInteger(lote)) return res.status(400).json({ error: "falta lote" });
    const estado = ["hecha", "error"].includes(b.estado) ? b.estado : "error";
    const texto = cortarParaTelegram(b.texto);
    let respuestaId = null;
    if (texto) {
      const mensajeId = b.mensaje_id == null ? NaN : Number(b.mensaje_id);
      const r = await llamarTelegram(tokenBotDm(), "sendMessage", {
        chat_id: chatDuena(), text: texto,
        ...(Number.isInteger(mensajeId) && mensajeId > 0 ? { reply_to_message_id: mensajeId, allow_sending_without_reply: true } : {}),
      });
      respuestaId = r?.messageId ?? null;
    }
    await terminarCorreccion(lote, { estado, resultado: b.resultado && typeof b.resultado === "object" ? b.resultado : null, respuestaId });
    if (b.deshizo != null && Number.isInteger(Number(b.deshizo))) await marcarDeshecha(Number(b.deshizo));
    return res.status(200).json({ ok: true, avisada: respuestaId != null });
  }
  return res.status(400).json({ error: "accion desconocida" });
}

/** El md5 de un prompt, para saber si es el mismo que se leyó. "" si no hay. */
function huella(texto) {
  return texto ? createHash("md5").update(String(texto)).digest("hex") : "";
}

/** Mínimo (caracteres) y máximo (bytes) de cada prompt. */
const TOPES = { prompt: [2000, 90000], revisor: [1000, 26000] };
