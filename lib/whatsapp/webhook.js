// El webhook de WhatsApp: lo que entra cuando alguien le contesta al número de la empresa.
//
// Por qué hace falta: un número dado de alta en WhatsApp Business Platform DESAPARECE de la app de
// WhatsApp. No hay chat en el celular. Si alguien contesta un recordatorio de una llamada, ese
// mensaje llega acá y a ningún otro lado. Sin esto, mandar recordatorios (tracker/recordatorio_
// llamadas.py, en el repo Personal Brand) sería hablarle a gente que no te puede contestar.
//
// Es el mismo esquema que el webhook de comentarios de Instagram (lib/dm/webhookIg.js), porque es
// la misma plataforma: verificación por GET con hub.challenge, y cada aviso firmado con
// HMAC-SHA256 del cuerpo CRUDO en el encabezado x-hub-signature-256. Lo único distinto es la clave
// (la app de WhatsApp es otra: "RealEstate WA Bot", 1483985306438017) y la forma del cuerpo.
//
// Cómo avisa Meta un mensaje entrante:
//   { "object": "whatsapp_business_account",
//     "entry": [{ "id": "<la cuenta de mensajes>",
//                 "changes": [{ "field": "messages",
//                               "value": { "messaging_product": "whatsapp",
//                                          "metadata": { "display_phone_number": "...", "phone_number_id": "..." },
//                                          "contacts": [{ "profile": { "name": "Juan" }, "wa_id": "5491122334455" }],
//                                          "messages": [{ "from": "5491122334455", "id": "wamid.HBg...",
//                                                         "timestamp": "1762000000", "type": "text",
//                                                         "text": { "body": "si, mañana puedo" } }] } }] }] }
//
// El mismo evento también trae los acuses de entrega (value.statuses: sent, delivered, read,
// failed). Esos no son mensajes de nadie: no se guardan ni se avisan, solo se cuentan.
//
// Acá va todo lo que se puede probar sin red y sin base (tests/whatsappWebhook.test.mjs). Lo que
// toca la base está en lib/whatsapp/base.js y lo que manda, en lib/whatsapp/api.js.
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * El App Secret de la app de Meta de WhatsApp, con el que viene firmado cada aviso. Se lee en cada
 * llamada y no al cargar el archivo: así cambiarlo en el entorno (o en una prueba) no pide
 * reiniciar.
 *
 * Sin esta clave NINGÚN aviso pasa (ver firmaValidaDeMeta). Es una URL abierta a internet: sin la
 * firma, cualquiera que la conozca puede inventar un mensaje entrante y hacer que a Cande le
 * llegue un aviso con lo que ese alguien quiera escrito, y que lo que ella conteste salga a un
 * número que eligió un extraño.
 */
const secreto = () => process.env.WHATSAPP_APP_SECRET || "";
/** El token que Meta devuelve en la verificación de la URL, para saber que el endpoint es nuestro. */
const tokenVerificacion = () => process.env.WHATSAPP_VERIFY_TOKEN || "";

/** Están las dos claves? Sin ellas el endpoint queda inerte: no verifica y no entra ningún aviso. */
export const webhookConfigurado = () => Boolean(secreto() && tokenVerificacion());

/** Dos textos iguales, comparados en tiempo constante (uno más corto no vale). */
function iguales(a, b) {
  const x = Buffer.from(String(a ?? ""));
  const y = Buffer.from(String(b ?? ""));
  return x.length > 0 && x.length === y.length && timingSafeEqual(x, y);
}

/** La firma que tendría que traer este cuerpo, tal como la manda Meta ("sha256=<hex>"). */
export function firmaDeMeta(crudo, clave = secreto()) {
  if (!clave) return null;
  return `sha256=${createHmac("sha256", clave).update(String(crudo ?? ""), "utf8").digest("hex")}`;
}

/**
 * El aviso viene firmado por Meta? Se firma el cuerpo CRUDO, con los espacios y el orden con los
 * que llegó: por eso el endpoint lee el stream y no usa el lector de Next (bodyParser en false).
 */
export function firmaValidaDeMeta(crudo, encabezado, clave = secreto()) {
  const esperada = firmaDeMeta(crudo, clave);
  return Boolean(esperada) && typeof encabezado === "string" && iguales(encabezado.trim(), esperada);
}

/**
 * La respuesta a la verificación de la URL (el GET que hace Meta al dar de alta el webhook): el
 * hub.challenge si el modo y el token son los que esperamos, o null. Sin token configurado no se
 * verifica nada: así nadie da de alta esta URL en otra app de Meta.
 */
export function desafioDeVerificacion(query, token = tokenVerificacion()) {
  const q = query || {};
  if (!token || q["hub.mode"] !== "subscribe" || !iguales(q["hub.verify_token"], token)) return null;
  return String(q["hub.challenge"] ?? "") || null;
}

/** Lo que se guarda de un mensaje que no es texto: qué llegó, para que ella sepa que llegó algo. */
const DESCRIPCION = {
  reaction: "reaccionó",
  image: "mandó una foto",
  audio: "mandó un audio",
  video: "mandó un video",
  document: "mandó un archivo",
  sticker: "mandó un sticker",
  location: "mandó una ubicación",
  contacts: "mandó un contacto",
};

/** El texto de un mensaje entrante, según su tipo. null si no se puede leer nada de él. */
export function textoDelMensaje(m) {
  const tipo = String(m?.type || "");
  if (tipo === "text") return String(m.text?.body ?? "").trim() || null;
  // Los botones de una plantilla y las listas: lo que la persona apretó es su respuesta.
  if (tipo === "button") return String(m.button?.text ?? "").trim() || null;
  if (tipo === "interactive") {
    const i = m.interactive || {};
    return String(i.button_reply?.title ?? i.list_reply?.title ?? "").trim() || null;
  }
  // Una reacción al recordatorio es un "lo vi", no una respuesta: se guarda con el emoji y avisa
  // sin sonido (ver avisaSinSonido). Cande, 08/11: a una reacción no se le contesta.
  if (tipo === "reaction") {
    const emoji = String(m.reaction?.emoji ?? "").trim();
    return emoji ? `(reaccionó con ${emoji})` : "(reaccionó)";
  }
  // Una foto o un audio con epígrafe: el epígrafe es lo que escribió.
  const pie = String(m?.[tipo]?.caption ?? "").trim();
  const que = DESCRIPCION[tipo];
  if (!que) return null;
  return pie ? `(${que}) ${pie}` : `(${que})`;
}

/** Un número de teléfono tal como lo manda Meta: solo dígitos, con código de país. */
export const soloDigitos = (x) => String(x ?? "").replace(/\D/g, "");

/**
 * Los mensajes entrantes que trae un aviso: { id, telefono, nombre, texto, tipo, creado }.
 *
 * Deja afuera todo lo que no sea un mensaje de WhatsApp: los acuses de entrega (value.statuses),
 * los avisos de la cuenta misma y los campos que no son "messages". Un id repetido se cuenta una
 * vez: Meta puede repetir el mismo evento en un lote, y el reintento de un lote entero por un 500
 * nuestro llega igual que el primero.
 *
 * `creado` es la hora que dice Meta (timestamp en segundos), que es cuando la persona lo escribió,
 * y de ahí se cuenta la ventana de 24 horas. Si no viene o no se puede leer, queda null y la
 * cuenta la hace la base con su propio NOW().
 */
export function mensajesDelEvento(cuerpo) {
  if (cuerpo?.object !== "whatsapp_business_account") return [];
  const vistos = new Set();
  const salida = [];
  for (const entrada of cuerpo.entry || []) {
    for (const cambio of entrada?.changes || []) {
      if (cambio?.field !== "messages") continue;
      const v = cambio.value || {};
      // El nombre del perfil, por si Cande no tiene el número agendado. Lo escribe la persona: es
      // texto suyo, y va al aviso como tal (lib/notificar.js lo escapa).
      const nombres = new Map();
      for (const c of v.contacts || []) {
        const wa = soloDigitos(c?.wa_id);
        const nombre = String(c?.profile?.name ?? "").trim();
        // Sin saltos de línea: el nombre lo escribe la persona y va al renglón "Quién" del aviso,
        // que es de donde sale a qué número se contesta (lib/whatsapp/respuestas.js).
        if (wa && nombre) nombres.set(wa, nombre.replace(/\s+/g, " ").slice(0, 80));
      }
      for (const m of v.messages || []) {
        const id = String(m?.id || "");
        const telefono = soloDigitos(m?.from);
        if (!id || !telefono || vistos.has(id)) continue;
        vistos.add(id);
        const segundos = Number(m?.timestamp);
        salida.push({
          id,
          telefono,
          nombre: nombres.get(telefono) || null,
          texto: textoDelMensaje(m),
          tipo: String(m?.type || "desconocido"),
          creado: Number.isFinite(segundos) && segundos > 0 ? new Date(segundos * 1000) : null,
          // El número de la empresa por el que entró, para mandar la respuesta por el mismo.
          numeroId: v.metadata?.phone_number_id ? String(v.metadata.phone_number_id) : null,
        });
      }
    }
  }
  return salida;
}

/** Cuántos acuses de entrega trae el aviso (solo para el registro: no se guardan ni se avisan). */
export function acusesDelEvento(cuerpo) {
  if (cuerpo?.object !== "whatsapp_business_account") return 0;
  let cuenta = 0;
  for (const entrada of cuerpo.entry || []) {
    for (const cambio of entrada?.changes || []) {
      if (cambio?.field === "messages") cuenta += (cambio.value?.statuses || []).length;
    }
  }
  return cuenta;
}

/** A una reacción se le avisa sin sonido: es un "lo vi", no una respuesta que haya que contestar. */
const avisaSinSonido = (m) => m?.tipo === "reaction";

/**
 * Guarda los mensajes entrantes de un aviso y le avisa a Cande por Telegram, uno por mensaje. Todo
 * entra por parámetro, así se prueba sin red y sin base (tests/whatsappWebhook.test.mjs).
 *
 * `base` es lib/whatsapp/base.js (alDia, reclamarEntrante) y `avisar`, el aviso del bot del agente
 * (lib/dm/armado.js, avisarDm), que es el mismo bot por el que ella contesta.
 *
 * El orden importa y es siempre este:
 *   1. la charla al día (alDia): idempotente, y es lo que deja la ventana de 24 horas bien puesta;
 *   2. reclamar el mensaje (reclamarEntrante): el que ya estaba no sigue, así un reintento de Meta
 *      no le avisa dos veces de lo mismo;
 *   3. el aviso a Telegram.
 * Si la función se corta entre el 2 y el 3, ese mensaje queda guardado sin aviso: se pierde el
 * aviso, no se duplica. Es a propósito: un aviso repetido le hace contestar dos veces al lead.
 *
 * Un mensaje del que no se puede leer nada (un tipo que no sabemos mirar) se guarda igual con lo
 * que se sepa y se avisa: que ella se entere de que entró algo es más importante que el detalle.
 *
 * Si la base falla (Neon dormida, la cuota, un corte), el aviso sale IGUAL, con un Ojo que dice que
 * no se pudo guardar. Sí, eso puede avisar dos veces si Meta reintenta: se prefiere eso a que la
 * respuesta de un lead se pierda sin que nadie se entere, que es la forma de fallar que ya costó
 * caro (el agente estuvo 34 horas caído sin avisar, 31/10 y 01/11). Contestar desde Telegram igual
 * no va a poder hasta que la base vuelva, y ahí el bot le dice qué falló.
 *
 * Y al revés: si el que falla es Telegram, avisarDm devuelve false sin tirar (lib/notificar.js) y el
 * mensaje ya quedó reclamado, así que nadie lo reintenta. Entonces queda escrito en la charla que ese
 * mensaje entró sin avisarse, y se registra: un contador en un console.log no es enterarse.
 */
export async function guardarYAvisar({ base, avisar, mensajes, avisoDe, registrar = () => {} }) {
  const cuentas = { entrantes: (mensajes || []).length, nuevos: 0, repetidos: 0, avisados: 0, sin_aviso: 0, errores: 0 };
  for (const m of mensajes || []) {
    try {
      const contacto = await base.alDia({ telefono: m.telefono, nombre: m.nombre, creado: m.creado });
      const texto = m.texto || `(llegó un mensaje de tipo ${m.tipo} que no puedo mostrar)`;
      if (!(await base.reclamarEntrante({ telefono: m.telefono, texto, waMid: m.id, creado: m.creado }))) {
        cuentas.repetidos++;
        continue;
      }
      cuentas.nuevos++;
      const { titulo, campos } = avisoDe({ ...m, texto, ultimoLead: contacto?.ultimo_lead || m.creado });
      // contestable en false: la pista de "respondé este mensaje" ya la pone avisoDe, con el texto
      // de WhatsApp y no el de los DM (lib/dm/armado.js se la agrega a los avisos de una charla).
      if (await avisar(titulo, campos, { contestable: false, silencioso: avisaSinSonido(m) })) {
        cuentas.avisados++;
        continue;
      }
      // Telegram no lo tomó por ningún camino (ni el bot, ni el grupo, ni el chat de siempre): que
      // por lo menos quede en la charla, porque el mensaje ya está reclamado y nadie lo reintenta.
      cuentas.sin_aviso++;
      registrar(new Error("no pude avisar este mensaje por Telegram"));
      if (base.anotarSistema) await base.anotarSistema({ telefono: m.telefono, texto: "este mensaje entró y no te lo pude avisar por Telegram" });
    } catch (e) {
      cuentas.errores++;
      // Sin números ni textos en el registro: es un lead y su teléfono.
      registrar(e);
      try {
        const { titulo, campos } = avisoDe({ ...m, texto: m.texto || `(un mensaje de tipo ${m.tipo})`, ultimoLead: m.creado });
        if (await avisar(titulo, { ...campos, Ojo: "no pude guardarlo en la base: contestar desde acá puede no andar" }, { contestable: false })) {
          cuentas.avisados++;
        }
      } catch (otro) {
        registrar(otro);
      }
    }
  }
  return cuentas;
}
