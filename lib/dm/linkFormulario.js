// El link del formulario de /devs con el id de la charla de Instagram (20/10/2026).
//
// Cande terminaba llamando por WhatsApp a gente que ya hablaba con el agente por Instagram: el formulario
// guardaba al lead en red_devs sin saber de qué charla venía. Ahora:
//   1. Cuando el agente le pasa el link del formulario, el sitio le suma el id de la charla (el de
//      dm_contactos, que es el id del contacto en ManyChat): opengatehub.com/devs?ig=<id>. Lo hace
//      lib/dm/agente.js después de los frenos y antes de guardar y mandar, así lo que ve el lead es lo
//      mismo que queda en dm_salidas y dm_mensajes. El prompt no se entera.
//   2. /devs lee ?ig= y lo manda con el formulario (pages/devs/index.jsx); la API lo guarda en
//      red_devs.ig_contacto (lib/db.js, guardarDev) y le deja a la charla la nota NOTA_FORMULARIO
//      (lib/dm/base.js, anotarFormularioLleno): el agente deja de preguntarle si lo llenó.
//   3. El CRM cruza las dos cosas (scripts/crm_sync.mjs).
//
// Funciones puras, sin base ni red: las usan el agente, los frenos, la página y la API.

// Un id de charla: solo dígitos, como los que da ManyChat. El mismo largo que acepta lib/dm/respuestas.js
// para el renglón "Quién" de los avisos.
const ID = /^\d{3,20}$/;

/** El id de charla si vale (un texto de 3 a 20 dígitos, sin espacios alrededor), o null. Cualquier otra cosa es null. */
export function idDeCharla(valor) {
  if (typeof valor !== "string") return null;
  const s = valor.trim();
  return ID.test(s) ? s : null;
}

// El link del formulario como lo puede escribir el modelo: con o sin https y www, con o sin la barra final y con
// lo que traiga después del "?". No toca /devs/gracias (la página del video) ni ninguna otra página de /devs, ni
// un dominio que solo termine parecido. Lo de antes del link va en el primer grupo y no en un (?<!...): este
// archivo también lo carga la página /devs, y un navegador viejo (el de Instagram en un iPhone sin actualizar)
// no entiende ese (?<!...) y deja la página entera en blanco.
const LINK = /(^|[^\w.-])((?:https?:\/\/)?(?:www\.)?opengatehub\.com\/devs)\/?(\?[^\s#]*)?(?![\w/-])/gi;
// La puntuación que quedó pegada al final del link (la misma que saca sinEsquema en lib/dm/frenos.js): un
// "opengatehub.com/devs?" al final de una pregunta no es una consulta vacía.
const COLA = /[.,;:!?)]+$/;
// Instagram corta los mensajes a los 1.000 caracteres: si con el id no entra, sale como estaba.
const TOPE_INSTAGRAM = 1000;

/**
 * El texto con cada link del formulario llevando el id de esta charla: ?ig=<id>, o &ig=<id> si el link ya traía
 * otra cosa (el ?de= de lib/origenForm.js, por ejemplo). Un ig= que ya estuviera se reemplaza por este, así
 * pasarlo dos veces da lo mismo. Sin un id válido, o si el mensaje se pasaría del tope de Instagram, el texto
 * queda igual.
 */
export function conIdDeCharla(texto, id, { tope = TOPE_INSTAGRAM } = {}) {
  const original = String(texto ?? "");
  const ig = idDeCharla(id);
  if (!ig) return original;
  const nuevo = original.replace(LINK, (_, antes, base, consulta = "") => {
    const cola = (consulta.match(COLA) || [""])[0];
    const otros = consulta.slice(1, consulta.length - cola.length).split("&").filter((p) => p && !/^ig=/i.test(p));
    return `${antes}${base}?${[...otros, `ig=${ig}`].join("&")}${cola}`;
  });
  return nuevo.length <= tope ? nuevo : original;
}

/**
 * Para los frenos: este link (ya en plano, sin https, sin www y sin la puntuación pegada, como lo deja sinEsquema
 * en lib/dm/frenos.js) es el del formulario con un id de charla y nada más? Con `contacto`, el id tiene que ser
 * el de esa charla: el link de otra persona no sale.
 */
export function esLinkConId(link, contacto = null) {
  const m = /^opengatehub\.com\/devs\/?\?ig=([^&#/?]*)$/.exec(String(link ?? ""));
  const ig = m ? idDeCharla(m[1]) : null;
  if (!ig) return false;
  return contacto == null || ig === idDeCharla(String(contacto));
}

/**
 * La nota que queda en la charla (dm_mensajes, quien "sistema") cuando la persona llena el formulario con el link
 * de esa charla. El agente la ve en el historial, o en el contexto del turno si quedó más atrás de lo que le llega
 * (lib/dm/agente.js). No es un mensaje para el lead: no sale nunca.
 */
export const NOTA_FORMULARIO =
  "Llenó el formulario de opengatehub.com/devs con el link de esta charla: lo confirma el sitio, no hace falta preguntárselo";

/** Este mensaje de la charla es la nota del formulario (NOTA_FORMULARIO)? */
export const esNotaDeFormulario = (m) => m?.quien === "sistema" && m?.texto === NOTA_FORMULARIO;
