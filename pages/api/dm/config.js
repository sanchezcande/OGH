// Configuración del agente de DM. La usa Cande desde su dashboard (mismo secreto que la cola
// de publicación, COLA_SECRET). Nunca devuelve claves.
//
//   { accion: "prompt", texto }                    → guarda el prompt (vive en la base: este repo es público)
//   { accion: "ajustes", ajustes: { modo, ... } }  → cambia ajustes (modo: apagado | sombra | auto)
//   { accion: "dueno", contacto, dueno, nombre }   → le da un contacto al agente o se lo saca
//   { accion: "sembrar", contacto, nombre, contexto, mensajes: [{ quien, texto }] }
//                                                  → carga una charla que ya existía y se la da al agente
//   { accion: "anotar", contacto, quien, texto }   → deja constancia de lo que Cande mandó a mano
//   { accion: "borrar", contacto }                 → borra todo lo guardado de una charla
//   { accion: "charla", contacto }                 → lo guardado de una charla
//   { accion: "estado" }                           → ajustes, cuántos contactos y las últimas salidas
//
// Cada cambio de prompt, de modo o de cualquier otro ajuste le llega a Cande por Telegram: si
// alguien más consigue el secreto y toca algo (el link de pago, por ejemplo), ella se entera en
// el momento. El prompt anterior queda guardado.
import { mismoSecreto, secretoDe, guardarSecretoDm } from "../../../lib/dm/armado";
import { segundosDesdeElLatido } from "../../../lib/dm/cola";
import {
  ajustes, anotarAMano, borrarCharla, cerrarTurno, contacto, descartarPendientes, guardarConfig, guardarPrompt,
  hayBase, historial, leerConfig, ponerDueno, prompt, resumen, sembrar, tablas, ultimoIdLead, validarAjustes,
} from "../../../lib/dm/base";
import { hayManyChat, ponerCampo } from "../../../lib/dm/manychat";
import { avisar, hayTelegram } from "../../../lib/notificar";

// Quién puede figurar en una charla cargada a mano. "agente" no: lo que mandó el agente lo anota él.
const QUIEN_SEMBRADO = ["lead", "cande", "automatico", "sistema"];
const QUIEN_A_MANO = ["cande", "automatico"];
const TOPE_TEXTO = 4000;
const TOPE_SIEMBRA = 300;

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
      await avisar("DM: cambió el prompt del agente", {
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
    await guardarConfig("ajustes", { ...((await leerConfig("ajustes")) || {}), ...pedido.ajustes });
    const ahora = await ajustes();
    if (ahora.modo !== antes.modo) await avisar("DM: cambió el modo del agente", { Ahora: ahora.modo, Antes: antes.modo });
    // El link de pago es el único link ajeno que los frenos dejan pasar: un cambio no puede ser callado.
    const otros = Object.keys(pedido.ajustes).filter((k) => k !== "modo" && ahora[k] !== antes[k]);
    if (otros.length) {
      const ver = (v) => (v === "" ? "(vacío)" : v);
      await avisar("DM: cambiaron ajustes del agente", Object.fromEntries(otros.map((k) => [k, `${ver(antes[k])} → ${ver(ahora[k])}`])));
    }
    return res.status(200).json({ ok: true, ajustes: ahora });
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
    await avisar("DM: cambió el secreto de ManyChat", { Nota: "si no fuiste vos, apagá el agente" });
    return res.status(200).json({ ok: true });
  }

  if (b.accion === "estado") {
    return res.status(200).json({
      ajustes: await ajustes(),
      prompt_cargado: (await prompt()).length,
      prompt_anterior: ((await leerConfig("prompt_anterior"))?.texto || "").length,
      claves: {
        anthropic: Boolean(process.env.ANTHROPIC_API_KEY), manychat: hayManyChat(),
        dm_secreto: Boolean(process.env.DM_SECRETO) || Boolean((await leerConfig("secreto_dm"))?.huella),
        telegram: hayTelegram(),
        cron_secret: Boolean(process.env.CRON_SECRET),
      },
      cerebro_local_hace_segundos: await segundosDesdeElLatido(),
      ...(await resumen()),
    });
  }

  return res.status(400).json({ error: "accion desconocida" });
}
