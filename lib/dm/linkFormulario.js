// El link del formulario de /devs con el id de la charla de Instagram (20/10/2026).
//
// Cande terminaba llamando por WhatsApp a gente que ya hablaba con el agente por Instagram: el formulario
// guardaba al lead en red_devs sin saber de qué charla venía. Ahora:
//   1. Cuando el agente le pasa el link del formulario, el sitio le suma el id de la charla (el de
//      dm_contactos, que es el id del contacto en ManyChat): opengatehub.com/devs?ig=<id>. Lo hace
//      lib/dm/agente.js después de los frenos y antes de guardar y mandar, así lo que ve el lead es lo
//      mismo que queda en dm_salidas y dm_mensajes. El prompt no se entera.
//   2. /devs lee ?ig= (idDeLink: también con un signo pegado), lo guarda en la pestaña, lo saca de la barra
//      y lo manda con el formulario (pages/devs/index.jsx); la API lo guarda en red_devs.ig_contacto (lib/db.js,
//      guardarDev) y le deja a la charla la nota NOTA_FORMULARIO (lib/dm/base.js, anotarFormularioLleno): el
//      agente deja de preguntarle si lo llenó.
//   3. El CRM cruza las dos cosas (scripts/crm_sync.mjs).
//
// El id viaja en claro: un lead puede reenviar su link, y la API es pública. Por eso la nota queda solo si a esa
// charla le salió el link con ese id y si ningún otro mail lo usó antes; si lo usó, el aviso y el CRM dicen "link
// compartido" en vez de "ya habla con el agente". Lo que no se puede saber es quién de los que lo usaron es la
// persona de la charla.
//
// Y va firmado: opengatehub.com/devs?ig=<id>&f=<firma>. La firma la hace y la mira lib/dm/firmaIg.js (solo
// servidor, con la clave del entorno); acá solo se la pone en el link y se la lleva de la barra a la API. Un número
// cambiado a mano ya no coincide con su firma y la API no lo ata a ninguna charla.
//
// Funciones puras, sin base ni red: las usan el agente, los frenos, la página y la API. Este archivo lo carga el
// navegador: no importa nada (tampoco node:crypto ni firmaIg.js).

// Un id de charla: solo dígitos, como los que da ManyChat. El mismo largo que acepta lib/dm/respuestas.js
// para el renglón "Quién" de los avisos.
const ID = /^\d{3,20}$/;

/** El id de charla si vale (un texto de 3 a 20 dígitos, sin espacios alrededor), o null. Cualquier otra cosa es null. */
export function idDeCharla(valor) {
  if (typeof valor !== "string") return null;
  const s = valor.trim();
  return ID.test(s) ? s : null;
}

// El ig= como llega en la barra del navegador: el id y, pegado atrás, lo que el lector de links de Instagram se
// haya llevado del texto (el "?" de una pregunta, el "." del final, un paréntesis, un emoji). Solo signos: una
// letra o un número de más ya no es este id.
const ID_EN_LINK = /^\s*(\d{3,20})[^\w\s]*\s*$/;

/**
 * El id de charla del ?ig= de /devs. conIdDeCharla deja la puntuación del mensaje afuera del link, pero pegada
 * ("...devs?ig=123?" al final de una pregunta), y si Instagram la mete adentro del link, el valor llega como
 * "123?": acá se le saca, así la unión con la charla no se pierde por un signo. Lo usan la página y la API.
 */
export function idDeLink(valor) {
  if (typeof valor !== "string") return null;
  const m = ID_EN_LINK.exec(valor);
  return m ? idDeCharla(m[1]) : null;
}

// La firma del id (lib/dm/firmaIg.js): 10 caracteres base64url. Acá solo se mira la forma; si es la de ese id lo
// mira firmaValida, en el servidor.
const FIRMA = /^[A-Za-z0-9_-]{10}$/;
// El f= como llega en la barra: con el link firmado, el f= es lo último del link, así que el signo que se lleve el
// lector de links de Instagram queda pegado acá y no en el ig=. Los mismos signos que idDeLink.
const FIRMA_EN_LINK = /^\s*([A-Za-z0-9_-]{10})[^\w\s]*\s*$/;

/** La firma del f= de /devs si tiene la forma de una (10 caracteres base64url, con o sin un signo pegado), o null. */
export function firmaDeLink(valor) {
  if (typeof valor !== "string") return null;
  const m = FIRMA_EN_LINK.exec(valor);
  return m ? m[1] : null;
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
// La consulta llega hasta el primer caracter que no es ASCII. Un emoji pegado ("devs?de=dm🙌", lo puede escribir
// Cande en una indicación) es del texto, no del link: el id va antes del emoji y no después, donde el lector de
// links de Instagram puede haber cortado. Los ?de= de lib/origenForm.js son todos ASCII.
const CONSULTA_ASCII = /^[\x21-\x7e]*/;
// Instagram corta los mensajes a los 1.000 caracteres: si con el id no entra, sale como estaba.
const TOPE_INSTAGRAM = 1000;

/**
 * El texto con cada link del formulario llevando el id de esta charla: ?ig=<id>, o &ig=<id> si el link ya traía
 * otra cosa (el ?de= de lib/origenForm.js, por ejemplo), y atrás la firma del id si se la pasan (&f=<firma>, la
 * hace firmarIg en lib/dm/firmaIg.js; este archivo no firma). Un ig= o un f= que ya estuvieran se reemplazan por
 * estos (o el f= se saca, si no hay firma), así pasarlo dos veces da lo mismo. Sin un id válido, o si el mensaje se
 * pasaría del tope de Instagram, el texto queda igual. Una firma sin la forma de una no se pone.
 */
export function conIdDeCharla(texto, id, { tope = TOPE_INSTAGRAM, firma = null } = {}) {
  const original = String(texto ?? "");
  const ig = idDeCharla(id);
  if (!ig) return original;
  const f = typeof firma === "string" && FIRMA.test(firma) ? firma : null;
  const nuevos = [`ig=${ig}`, ...(f ? [`f=${f}`] : [])];
  const nuevo = original.replace(LINK, (_, antes, base, todo = "") => {
    const consulta = todo.match(CONSULTA_ASCII)[0];
    const signos = (consulta.match(COLA) || [""])[0];
    const otros = consulta.slice(1, consulta.length - signos.length).split("&").filter((p) => p && !/^(ig|f)=/i.test(p));
    return `${antes}${base}?${[...otros, ...nuevos].join("&")}${signos}${todo.slice(consulta.length)}`;
  });
  return nuevo.length <= tope ? nuevo : original;
}

// Dónde quedan el id y su firma en la pestaña: /devs los saca de la barra apenas los lee, y si la persona recarga
// siguen estando.
const CLAVE_PESTANA = "ogh_charla_ig";
const CLAVE_FIRMA = "ogh_charla_ig_f";

/**
 * El id de charla y su firma para el formulario de /devs: los del ?ig= y el f= de la dirección (`busqueda`, el
 * location.search) o, si no viene un ig= que valga, los que quedaron guardados en esta pestaña. Van siempre juntos:
 * un ig= nuevo sin f= borra la firma guardada, así nunca se manda la firma de un id con otro. `almacen` devuelve el
 * sessionStorage (es una función: en modo privado o con el almacenamiento bloqueado, pedirlo ya tira). Nunca tira.
 */
function charlaDeLaPestana(busqueda, almacen) {
  let ig = null;
  let f = null;
  try {
    const q = new URLSearchParams(busqueda);
    ig = idDeLink(q.get("ig"));
    f = ig ? firmaDeLink(q.get("f")) : null;
  } catch (e) {
    ig = null;
    f = null;
  }
  try {
    const s = almacen();
    if (ig) {
      s.setItem(CLAVE_PESTANA, ig);
      s.setItem(CLAVE_FIRMA, f || "");
    } else {
      ig = idDeCharla(s.getItem(CLAVE_PESTANA));
      f = ig ? firmaDeLink(s.getItem(CLAVE_FIRMA)) : null;
    }
  } catch (e) {
    /* sin almacenamiento: quedan los de la dirección, si había */
  }
  return { ig, f };
}

/** El id de charla para el formulario de /devs (ver charlaDeLaPestana), o null. Nunca tira. */
export const idDeLaPestana = (busqueda, almacen) => charlaDeLaPestana(busqueda, almacen).ig;

/** La firma de ese id (el f= que vino con el ig=, ver charlaDeLaPestana), o null. Nunca tira. */
export const firmaDeLaPestana = (busqueda, almacen) => charlaDeLaPestana(busqueda, almacen).f;

/**
 * La dirección sin el ig= ni su firma (f=) y con todo lo demás igual (el ?de=, el #): /devs la usa para sacar el id
 * de la barra del navegador una vez leído. Así quien copia la dirección para pasársela a otro no le pasa también su
 * charla.
 */
export function sinIg(direccion) {
  const s = String(direccion ?? "");
  const h = s.indexOf("#");
  const sinHash = h < 0 ? s : s.slice(0, h);
  const q = sinHash.indexOf("?");
  if (q < 0) return s;
  const resto = sinHash.slice(q + 1).split("&").filter((p) => p && !/^(ig|f)(=|$)/i.test(p));
  return sinHash.slice(0, q) + (resto.length ? `?${resto.join("&")}` : "") + (h < 0 ? "" : s.slice(h));
}

/**
 * Para los frenos: este link (ya en plano, sin https, sin www y sin la puntuación pegada, como lo deja sinEsquema
 * en lib/dm/frenos.js) es el del formulario con un id de charla, y a lo sumo su firma (&f= con 10 caracteres
 * base64url), y nada más? Con `contacto`, el id tiene que ser el de esa charla: el link de otra persona no sale. Si
 * la firma es la de ese id no se mira acá (no hay clave en este archivo): el agente la vuelve a poner con
 * conIdDeCharla antes de mandar.
 */
export function esLinkConId(link, contacto = null) {
  const m = /^opengatehub\.com\/devs\/?\?ig=([^&#/?]*)(?:&f=[A-Za-z0-9_-]{10})?$/.exec(String(link ?? ""));
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
