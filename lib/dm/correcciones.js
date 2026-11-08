// Correcciones del agente por Telegram (09/11).
//
// Cande, 09/11: "hacé que las correcciones de chats se puedan hacer en el telegram, que yo te pueda mandar capturas de
// pantalla y decirte wtf mismo por telegram y vos lo arregles en la nube". Hasta acá, para corregir una respuesta del
// agente tenía que abrir la Mac y explicarle a una sesión qué estaba mal.
//
// Cómo anda:
//   1. Ella le manda al bot del agente una captura (o varias), con o sin texto, o un texto suelto contando qué está mal.
//      También puede responder el aviso de una charla con una captura, o con un texto que diga "wtf" o empiece con
//      /corregir: ahí ya se sabe de qué charla es. Un texto que responde un aviso sin eso sigue siendo lo de siempre,
//      una indicación para el lead (lib/dm/respuestas.js).
//   2. pages/api/dm/telegram.js la guarda en dm_correcciones (lib/dm/correccionesBase.js) y le contesta que la mira.
//   3. El cerebro de la nube (tracker/dm_corrector.py en Personal Brand) la retira por /api/dm/trabajos cuando ella
//      dejó de mandar cosas (lo que mandó seguido es una sola corrección), mira las capturas, busca la charla, encuentra
//      la regla del prompt que falló y la corrige en la base (con copia), y le contesta por el bot qué entendió, qué
//      cambió y qué contestaría ahora. "deshacé" vuelve atrás el último cambio.
//
// Lo que se lee acá es solo de Cande en su chat privado con el bot, como las respuestas a los avisos.
import { contactoDeAviso } from "./respuestas";

// Sin \b después de una letra con tilde: en JS sin la bandera u, "í" no es una letra y \b no corta ahí.
const FIN = "(?![a-záéíóúñ])";
/**
 * Una queja sobre lo que hizo el agente, no un mensaje para el lead: el mensaje ARRANCA con "wtf" o "/corregir", o es
 * solo "corregí". Revisión del 09/11: suelto en cualquier parte ("decile que wtf, que ya le pasé el link") desviaba
 * indicaciones para el lead.
 */
const QUEJA = new RegExp(`^\\s*(wtf+${FIN}|\\/corregir${FIN})|^\\s*correg[ií]\\s*[.!]*\\s*$`, "i");
/** Volver atrás el último cambio: el mensaje entero es eso ("deshacé", "/deshacer", "volvé atrás"). */
const DESHACER = new RegExp(`^\\s*(\\/deshacer|deshac[eé](lo)?|volv[eé] (para )?atr[aá]s)\\s*[.!]*\\s*$`, "i");
/** Lo que el bot le contesta a una corrección empieza así: un texto que responde eso sigue la misma corrección. */
export const MARCA_RESPUESTA = "🔧";

/** La foto más grande de un mensaje de Telegram (las manda en varios tamaños), o una imagen mandada como archivo. */
function fotoDe(m) {
  if (Array.isArray(m.photo) && m.photo.length) {
    const mayor = [...m.photo].sort((a, b) => (b.file_size || b.width * b.height || 0) - (a.file_size || a.width * a.height || 0))[0];
    return mayor?.file_id ? String(mayor.file_id) : null;
  }
  if (m.document?.file_id && /^image\//.test(String(m.document.mime_type || ""))) return String(m.document.file_id);
  return null;
}

/**
 * Si esta novedad de Telegram es una corrección de Cande, lo que hay que guardar; si no, null (sigue el camino de
 * siempre: lib/dm/respuestas.js). `duena`: el chat privado de Cande (lib/notificar.js, chatDuena).
 */
export function leerCorreccion(novedad, { duena }) {
  const m = novedad?.message;
  const deElla = m && duena && m.chat?.type === "private"
    && String(m.chat?.id) === String(duena) && String(m.from?.id) === String(duena);
  if (!deElla || !Number.isFinite(novedad.update_id)) return null;
  const foto = fotoDe(m);
  const texto = String(m.text ?? m.caption ?? "").trim();
  const respondido = m.reply_to_message;
  const delBot = respondido?.from?.is_bot === true;
  const textoRespondido = String(respondido?.text ?? respondido?.caption ?? "");
  const contacto = delBot ? contactoDeAviso(textoRespondido) : null;
  const sigue = delBot && textoRespondido.startsWith(MARCA_RESPUESTA);
  const base = {
    updateId: novedad.update_id, mensajeId: m.message_id ?? null, grupo: m.media_group_id ? String(m.media_group_id) : null,
    texto: texto.slice(0, 2000), fotos: foto ? [foto] : [], contacto: contacto || null,
    respondiendo: sigue ? textoRespondido.slice(0, 1500) : null,
    // A qué mensaje del bot responde: si es la respuesta a una corrección, el sitio le suma esa corrección (su charla,
    // sus capturas, lo que se le preguntó) para que no se siga a ciegas.
    respondeA: sigue && Number.isFinite(respondido?.message_id) ? respondido.message_id : null,
    deshacer: false,
  };
  // Con captura siempre es una corrección: a un lead no se le manda una foto desde acá.
  if (foto) return base;
  if (!texto) return null;
  // "deshacé" nunca va al lead, tampoco respondiendo un aviso (revisión del 09/11: salía como indicación).
  if (DESHACER.test(texto)) return { ...base, contacto: null, deshacer: true };
  if (texto.startsWith("/") && !/^\/corregir\b/i.test(texto)) return null;
  // Responder lo que el bot contestó de una corrección sigue esa corrección ("no, era otra cosa").
  if (sigue) return base;
  // Respondiendo el aviso de una charla o suelto: solo si arranca como queja. Lo demás sigue como siempre (una indicación
  // para el lead, o la ayuda del bot): un "ok" o un "gracias" sueltos no corrigen nada.
  return QUEJA.test(texto) ? base : null;
}

/** Lo que el bot le contesta enseguida a la primera parte de una corrección. */
export const RECIBIDA = `${MARCA_RESPUESTA} Recibido, lo miro y te cuento`;

/**
 * Baja una foto de Telegram (getFile y el archivo) y la devuelve en base64 para el cerebro: el link de Telegram lleva el
 * token del bot, así que no sale del sitio. `pedir`: fetch. null si no se pudo o es muy grande.
 */
export async function bajarFoto(token, fileId, { pedir = fetch, tope = 8 * 1024 * 1024 } = {}) {
  if (!token || !fileId) return null;
  try {
    const r = await pedir(`https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`);
    const j = await r.json();
    const ruta = j?.ok ? j.result?.file_path : null;
    if (!ruta || (j.result.file_size || 0) > tope) return null;
    const a = await pedir(`https://api.telegram.org/file/bot${token}/${ruta}`);
    if (!a.ok) return null;
    const datos = Buffer.from(await a.arrayBuffer());
    if (!datos.length || datos.length > tope) return null;
    const tipo = /\.png$/i.test(ruta) ? "image/png" : /\.webp$/i.test(ruta) ? "image/webp" : "image/jpeg";
    return { tipo, datos: datos.toString("base64") };
  } catch {
    return null;
  }
}

/** Telegram corta los mensajes a los 4.096 caracteres. */
export const TOPE_TELEGRAM = 4000;
export const cortarParaTelegram = (texto) => {
  const t = String(texto || "").trim();
  return t.length > TOPE_TELEGRAM ? `${t.slice(0, TOPE_TELEGRAM - 3)}...` : t;
};
