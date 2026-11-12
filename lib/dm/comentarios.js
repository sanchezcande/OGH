// "Comentá CV y te mando la lista": la puerta principal de entrada de leads, sin ManyChat (30/10).
// Desde el 02/11 también "comentá DEV" (founders): el mismo camino con las mismas trabas, otro texto.
//
// Por qué: la cuenta se pasó del tope de contactos activos del plan Pro de ManyChat (un video le
// trajo más de 1.400 seguidores en dos días y la bienvenida los volvió contactos pagos) y ManyChat
// pausó TODAS sus automatizaciones, la de CV entre ellas. El 29/10 quedaron 39 comentarios con CV
// sin contestar en un solo día.
//
// Cómo se contesta un comentario por la API: con una private reply. Instagram deja mandar UN DM en
// respuesta a un comentario, con el id del comentario en lugar del de la persona
// (recipient: { comment_id }), dentro de los 7 días, por POST a /{página de Facebook}/messages con
// el token de la página. Lo pide Meta así y lo confirmó la API real el 30/10: un comentario del
// 20/10 contestó "(#-1) el comentario es demasiado antiguo para recibir una respuesta",
// error_subcode 2534024, sin mandarle nada a nadie. Los permisos que hacen falta
// (instagram_manage_comments y pages_messaging) ya los tiene el token con el que el sitio publica.
//
// UNO por comentario. Lo que NO hace Instagram, y se comprobó mandando uno de verdad el 30/10, es
// impedir que un comentario reciba dos private replies de distintos lados: el automático de CV de
// ManyChat seguía vivo y contestando a los 7 segundos, y @juliovasquez_m.a recibió el mismo link
// dos veces. Así que las trabas contra contestar dos veces son dos, las dos nuestras:
//   1. bandejaDe: antes de mandar se mira la bandeja y a quien ya recibió algo de la cuenta
//      (ManyChat, el agente o Cande) DESDE QUE COMENTÓ, o el DM de CV cuando sea, no se le manda
//      nada. Lo demás de antes del comentario no cuenta: el que charló con Cande hace semanas y hoy
//      comenta CV también recibe la lista (ver contestadoDesde). De un comentario anterior a lo que se
//      alcanzó a mirar no se afirma nada: ese tampoco se contesta.
//   2. lib/dm/comentariosBase.js: el comentario queda tomado en la base ANTES de mandar, así que si
//      la función se corta a mitad nadie lo vuelve a tomar.
// Con eso esto contesta solo lo que ManyChat dejó pasar, y cuando ManyChat esté apagado de verdad
// contesta todo sin que haya que cambiarle nada.
//
// La palabra es más estricta que la de ManyChat a propósito. El automático viejo era "contiene CV"
// y se metía en charlas reales (hubo que apagarlo el 08/10). Acá CV tiene que ser una palabra del
// comentario y todo lo demás, relleno: un saludo, un gracias, un porfa, una risa, emojis. De los
// 113 comentarios reales de la última semana eso deja entrar los 45 que piden la lista ("Cv",
// "CV holaaaaaa😂", "Holaaa! Cv. 🙌🏻", "CV, thanks") y deja afuera los dos que no la piden:
// "CV rico 😋" y "Si... tiene buen cvlo".
//
// Funciones puras: sin base y sin red. Lo que toca la base está en lib/dm/comentariosBase.js y lo
// que toca Instagram, en lib/dm/instagram.js (medios, comentarios, responderComentario).

/** El texto sin tildes, sin mayúsculas, sin signos ni emojis y con los espacios juntados. */
const plano = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

// Lo que puede acompañar a la palabra sin que deje de ser un pedido de la lista. Lista cerrada: una
// palabra que no esté acá hace que el comentario sea una charla y no un pedido ("CV rico").
const RELLENO = new Set([
  "buenas", "buenass", "buenos", "hey", "hi", "hello",
  "gracias", "graciass", "thanks", "thank", "thx", "ty", "you",
  "por", "favor", "please", "pls", "plis", "plz",
  "si", "sii", "yes", "yep", "ok", "oka", "okay", "dale", "listo", "vamos", "ya",
]);
// Saludos y risas estirados: "holaaaaaa", "holiii", "jajaja", "hehe".
const ESTIRADAS = [/^hol+a+s?$/, /^hol+i+s?$/, /^porfa\w*$/, /^[jahe]{2,}$/];

/** Esta palabra acompaña a CV sin cambiar lo que pide el comentario? */
const esRelleno = (p) => RELLENO.has(p) || ESTIRADAS.some((r) => r.test(p));

/** El comentario es SOLO esa palabra, más relleno? (la regla estricta de abajo, la misma para cada palabra) */
function pidePalabra(texto, palabra) {
  const p = plano(texto);
  if (!p) return false;
  const palabras = p.split(" ");
  return palabras.includes(palabra) && palabras.every((w) => w === palabra || esRelleno(w));
}

/**
 * El comentario pide la lista de developers?
 *
 * CV tiene que ser una palabra del comentario (no "cvlo", no "mandé muchos cv") y todo lo demás,
 * relleno. Un comentario que dice algo más está hablando, no pidiendo el link, y ese no se contesta
 * solo: lo ve Cande en Instagram como siempre.
 */
export const esPalabraCV = (texto) => pidePalabra(texto, "cv");

/**
 * El comentario pide la llamada, o sea es un founder que comenta DEV (02/11)? Misma regla que CV, y
 * por eso un comentario no puede ser los dos: "cv dev" no es ninguno, porque dev no es relleno.
 */
export const esPalabraDEV = (texto) => pidePalabra(texto, "dev");

/** Qué pide el comentario: "cv", "dev" o null si es una charla y no un pedido. */
export const tipoDelComentario = (texto) => (esPalabraCV(texto) ? "cv" : esPalabraDEV(texto) ? "dev" : null);

// El automático de CV de ManyChat, tal cual quedó cargado en dm_config "automaticos". El texto de
// abajo arranca con él a propósito: así la red de la bandeja lo reconoce como automático
// (esAutomatico en lib/dm/instagram.js compara 30 letras del principio) y la charla queda del
// agente. Si no, lo que salió de la cuenta pasaría por algo que Cande escribió a mano y el agente
// se saldría de esa charla sin haber dicho una palabra.
export const AUTOMATICO_CV_MANYCHAT =
  "Holii! Gracias por comentar :) Te paso mi lista de developers: es donde busco cuando me entra un proyecto. Llenás un form de 3 min y quedás adentro!";

const PRINCIPIO_CV = plano(AUTOMATICO_CV_MANYCHAT).slice(0, 40);
/**
 * Este mensaje es el DM de CV? El de ManyChat y el nuestro arrancan igual (ver TEXTO_CV), y lo que
 * lleve el link de la lista también vale: quien ya lo tiene no lo necesita otra vez.
 */
export function esDmDeCV(texto) {
  const p = plano(texto);
  return Boolean(p) && (p.startsWith(PRINCIPIO_CV) || p.includes("opengatehub com devs"));
}

/**
 * El DM que recibe quien comenta CV. Es UNO solo: Instagram deja una sola private reply por
 * comentario, así que el link va adentro de este texto y no en un segundo mensaje.
 *
 * Es el de ManyChat con el link pegado: ese texto ya venía funcionando y además lo tiene cargado la
 * red de la bandeja (ver AUTOMATICO_CV_MANYCHAT). El link va limpio, sin ?de= ni ?ig=: todavía no
 * hay charla a la que atarlo, y los links con cosas colgadas le dan desconfianza a los devs.
 */
export const TEXTO_CV =
  "Holii! Gracias por comentar :) Te paso mi lista de developers: es donde busco cuando me entra un proyecto. Llenás un form de 3 min y quedás adentro 👉 opengatehub.com/devs";

// El DM de apertura de "DEV → llamada (comentario DEV)" de ManyChat, que Cande armó el 08/10 y que se
// apaga con el plan. En dm_config "automaticos" quedó cargada la primera versión de ese mismo texto
// (la del flujo del 02/10), tal cual abajo. El nuestro termina igual que ella a propósito: así la red
// de la bandeja (esAutomatico) lo reconoce como automático y la charla queda del agente, que es quien
// le contesta al founder que responde. Lo prueba tests/dmComentarios.test.mjs.
export const AUTOMATICO_DEV_MANYCHAT =
  "Genial! Estoy haciendo una llamada de 15/30 min gratis, donde te dejo un plan concreto para encontrar y contratar al programador que necesitás sin que tengas que entender nada de código.";

/**
 * El DM que recibe quien comenta DEV: uno solo, con el link adentro por lo mismo que TEXTO_CV. Es el
 * de apertura de ManyChat: el botón "Quiero mi plan" y el segundo mensaje con el link no existen en una
 * private reply (es un solo mensaje y sin botones), así que el link de la agenda va en el mismo texto.
 * Es el mismo link que usa el agente con las empresas (LINK_REUNION en lib/dm/frenos.js), y va limpio.
 */
export const TEXTO_DEV =
  "Holii! Gracias por comentar :) estoy haciendo una llamada de 15/30 min gratis, donde te dejo un plan concreto para encontrar y contratar al programador que necesitás sin que tengas que entender nada de código. Agendá directo acá 👉 strategy.opengatehub.com";

const PRINCIPIO_DEV = plano(TEXTO_DEV).slice(0, 40);
/** Este mensaje es el DM de DEV? El nuestro arranca igual que el de ManyChat y lo que lleve el link de la agenda también vale. */
export function esDmDeDev(texto) {
  const p = plano(texto);
  return Boolean(p) && (p.startsWith(PRINCIPIO_DEV) || p.includes("strategy opengatehub com"));
}

/** Es uno de los DM fijos que salen de un comentario (el de CV o el de DEV)? Quien ya lo recibió no lo necesita otra vez. */
const esDmFijo = (texto) => esDmDeCV(texto) || esDmDeDev(texto);

// La respuesta pública que sale abajo del comentario después de la private reply (02/11, aprobada
// por Cande). Los tres textos son los suyos, tal cual: el DM de un desconocido cae en solicitudes y
// sin esta línea el que comentó no sabe dónde mirar. Rotan por el id del comentario: el mismo
// comentario siempre recibe el mismo texto y no hace falta guardar a cuál le tocó.
export const RESPUESTAS_PUBLICAS = [
  "Te mandé DM 💌 si no lo ves, fijate en solicitudes",
  "Listo, te escribí por privado! Si no aparece, mirá en solicitudes",
  "Ya te llegó por DM :) fijate en solicitudes si no lo ves",
];

/** El texto de la respuesta pública de este comentario. */
export function respuestaPublica(id) {
  let suma = 0;
  for (const ch of String(id ?? "")) suma += ch.charCodeAt(0);
  return RESPUESTAS_PUBLICAS[suma % RESPUESTAS_PUBLICAS.length];
}

/**
 * Contesta en público abajo del comentario, UNA vez, después de que la private reply salió bien.
 * Nunca tira y nunca frena nada: si falla, el DM ya salió y a esa persona le llegó igual.
 *
 * Queda anotada ANTES de salir (tomarPublica), por lo mismo que el DM: si la función se corta a
 * mitad, o el pedido tarda y no se sabe si salió, no se repite. Peor que un comentario sin su
 * respuesta pública es uno con dos. Devuelve true si salió. Sin `ig.responderPublico` o sin
 * `base.tomarPublica` no hace nada, así las pruebas de lo demás no lo necesitan.
 */
export async function responderEnPublico({ ig, base, id, registrar = () => {} }) {
  if (!ig?.responderPublico || !base?.tomarPublica) return false;
  try {
    if (!(await base.tomarPublica(id))) return false;
    await ig.responderPublico(id, respuestaPublica(id));
    return true;
  } catch (e) {
    try {
      registrar("publica", e);
    } catch {
      // el registro no puede frenar nada
    }
    return false;
  }
}

/** Los días que Instagram deja contestar un comentario por private reply. */
export const VENTANA_DIAS = 7;
/**
 * Con cuánto margen se deja de intentar. Un comentario de 6 días y 23 horas puede vencerse entre
 * que se lo lee y que sale el DM: ese no se toma, así no queda tomado uno que nunca se va a poder
 * contestar.
 */
export const MARGEN_HORAS = 6;

/**
 * Cuánto se espera antes de contestar un comentario recién hecho. Era el margen que se le dejaba a
 * ManyChat, cuyo automático contestaba a los 7 segundos: si mandábamos los dos, el lead recibía el
 * link dos veces. Bajó de 5 a 2 el 31/10, cuando ManyChat dejó de atender contactos nuevos.
 *
 * 05/11: Cande dio de baja ManyChat. No queda nadie más contestando esos comentarios, así que la
 * espera es cero y el comentario se toma en la misma vuelta en que se lo lee. El que comenta está
 * mirando el reel en ese momento, y cada minuto de demora es un lead que ya se fue a otra cosa. Si
 * alguna vez vuelve a haber otro automático sobre los mismos comentarios, esto sube de nuevo.
 */
export const FRESCO_MINUTOS = 0;

/** Este comentario está dentro de la ventana de la private reply, y ya no es recién hecho? */
export function enVentana(creado, ahora = new Date()) {
  const t = creado instanceof Date ? creado.getTime() : Date.parse(String(creado || ""));
  if (!Number.isFinite(t)) return false;
  const vence = t + VENTANA_DIAS * 86400000 - MARGEN_HORAS * 3600000;
  return t + FRESCO_MINUTOS * 60000 <= ahora.getTime() && ahora.getTime() < vence;
}

/**
 * Los posts y reels cuyos comentarios hay que leer en esta vuelta, y lo que se anota de cada uno para
 * la vuelta siguiente.
 *
 * La ventana de 7 días corre desde el COMENTARIO, no desde el post: un CV de hoy en un reel de hace
 * tres semanas se puede contestar igual. Antes se leían solo los posts de la última semana, y los
 * comentarios nuevos de los viejos no los veía nadie (06/11: 10 pedidos de CV o DEV de esa semana
 * estaban en posts de más de 7 días, cuatro en uno que era el 192 de la lista). Leer todos los viejos
 * en cada vuelta no entra en el tiempo, así que de
 * cada uno se anota cuántos comentarios tenía (`comments_count`) y cuándo cambió ese número por
 * última vez. Un post viejo se lee mientras ese cambio tenga menos de 7 días: ahí puede haber un
 * comentario que todavía está a tiempo. Los de la última semana se leen siempre, como antes.
 *
 * `antes` es lo anotado en la vuelta anterior ({ id: { n, cambio } }) o null si no hay nada: un
 * post viejo que se ve por primera vez queda anotado y no se lee (no se sabe desde cuándo tiene lo
 * que tiene). `comments_count` cuenta también las respuestas, las de Cande y la pública de este
 * cron: eso solo hace que un post se lea alguna vuelta de más.
 */
export function mediosParaLeer(medios, antes, hoy = new Date()) {
  const anotados = {};
  const leer = [];
  for (const m of medios || []) {
    if (!m?.id) continue;
    const n = Number(m.comments_count) || 0;
    const previo = antes?.[m.id];
    const cambio = previo && previo.n !== n ? hoy.toISOString() : (previo?.cambio ?? null);
    anotados[m.id] = { n, cambio };
    if (!n) continue;
    const reciente = cambio && hoy.getTime() - Date.parse(cambio) < VENTANA_DIAS * 86400000;
    if (enVentana(m.timestamp, hoy) || reciente) leer.push(m);
  }
  return { leer, anotados };
}

/**
 * De los comentarios de un medio, los que hay que contestar: los que piden la lista (CV) o la llamada
 * (DEV), están dentro de la ventana y no los escribió la cuenta misma (Cande contesta sus propios posts). Los más
 * nuevos primero: si la vuelta no alcanza para todos, el que acaba de comentar no espera.
 *
 * `cuenta` es { user_id, username } (lib/dm/instagram.js, cuenta). `comentarios` son los que
 * devuelve la API: { id, text, timestamp, username, from }. Cada uno sale con su `tipo` ("cv" o "dev").
 */
export function comentariosParaContestar(comentarios, cuenta, ahora = new Date()) {
  const mio = String(cuenta?.username || "").toLowerCase();
  const miId = String(cuenta?.user_id || "");
  return (comentarios || [])
    .filter((c) => {
      if (!c?.id || !tipoDelComentario(c.text)) return false;
      if (!enVentana(c.timestamp, ahora)) return false;
      const u = String(c.username || "").toLowerCase();
      const id = String(c.from?.id || "");
      return !((mio && u === mio) || (miId && id === miId));
    })
    .map((c) => ({ ...c, tipo: tipoDelComentario(c.text) }))
    .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
}

/**
 * Lo que dice el error de Instagram sobre por qué no salió, para anotarlo y para decidir si hay que
 * avisarle a Cande:
 *   - "vencido": el comentario ya tiene más de 7 días (2534024). No hay nada que hacer.
 *   - "ya_contestado": ese comentario ya recibió su private reply, casi siempre de ManyChat antes
 *     de pausarse. Es exactamente la traba que queremos: no se insiste.
 *   - "sin_aceptar": el mensaje quedaría en una solicitud que Cande no aceptó (2534037). Eso solo
 *     lo destraba ella desde la app, así que se le avisa.
 *   - "otro": cualquier otra. Se anota con su código y se reintenta en otra vuelta.
 */
export function motivoDelError(e) {
  const sub = Number(e?.subcode ?? e?.error_subcode ?? NaN);
  const texto = String(e?.message || e || "").toLowerCase();
  if (sub === 2534024 || /demasiado antiguo|too old/.test(texto)) return "vencido";
  if (sub === 2534025 || sub === 2534014 || /invalid for a private reply|no es válido para una respuesta privada/.test(texto)) {
    return "ya_contestado";
  }
  if (sub === 2534037 || /no es propietaria del hilo|does not own the thread/.test(texto)) return "sin_aceptar";
  return "otro";
}

// Los códigos con los que Instagram pide que se le pregunte más despacio: no llegó a procesar el
// envío, así que el comentario se suelta y lo toma la vuelta siguiente (los mismos que mira
// explicarError en lib/dm/instagram.js). Lo mira igual el webhook (lib/dm/webhookIg.js).
export const DESPACIO = [4, 17, 32, 613, 80002];
/** Cuántos errores raros seguidos antes de cortar la vuelta: algo anda mal, no se quema la lista. */
const SEGUIDOS_PARA_CORTAR = 3;

/** Páginas de la bandeja que se leen como mucho para saber a quién ya le contestaron. */
// Tres páginas de 50 charlas tardan unos 30 segundos y cubren, con el ritmo de su bandeja, varias
// horas: de sobra para los comentarios de la vuelta (15 minutos). De cada charla se miran los 5
// mensajes más nuevos: con 2 no alcanzaba para saber si la cuenta escribió DESPUÉS del comentario
// cuando el lead ya había contestado un par de veces (el flujo de ManyChat son tres mensajes).
const PAGINAS_BANDEJA = 3;
const HILOS_POR_PAGINA = 50;
export const MENSAJES_POR_HILO = 5;
/**
 * Cuando la bandeja no alcanza para decidir, la charla de esa persona se busca sola (hiloDe, por el id
 * que trae el comentario) con 10 mensajes: si escribió 5 veces y nadie le contestó en el medio, o si
 * el comentario es más viejo de lo que cubren las 3 páginas (el 31/10 una dev que comentó CV el 29
 * quedó así, sin charla y sin respuesta). Como mucho 5 por vuelta: son pedidos de a uno y la función
 * tiene 2 minutos. Lo que se averigua así se anota en la base para que las vueltas siguientes avancen
 * con los demás: si ya estaba contestado, para siempre; si sigue en duda, por unas horas (ver
 * anotarEnDuda en lib/dm/comentariosBase.js).
 */
export const MENSAJES_HONDOS = 10;
const HONDAS_POR_VUELTA = 5;

/**
 * Las charlas de la bandeja por usuario, y hasta dónde atrás se pudo mirar.
 *
 * Esto es la traba contra el automático de CV de ManyChat, que el 30/10 seguía vivo y contestaba
 * los comentarios a los 7 segundos: si los dos contestan, el lead recibe el mismo link dos veces
 * (le pasó a una persona esa noche). Como ManyChat contesta al instante, su respuesta está arriba
 * en la bandeja, así que alcanza con mirar las páginas que cubren el rato de los comentarios.
 *
 * Devuelve { charlas, cubreDesde }: por usuario, sus charlas (casi siempre una, ver charlaDe), y la
 * charla más vieja que se alcanzó a mirar. De un comentario anterior a `cubreDesde` no se puede
 * afirmar que nadie le contestó, así que ese no se contesta (ver contestarComentarios). Qué cuenta
 * como contestado lo decide contestadoDesde.
 *
 * Si falla una página que no es la primera, se corta ahí con lo leído, como la red de la bandeja
 * (lib/dm/bandeja.js): los comentarios más viejos que eso quedan sin mirar y no se contestan.
 */
export async function bandejaDe(ig, cuenta, hasta, { paginas = PAGINAS_BANDEJA, porPagina = HILOS_POR_PAGINA } = {}) {
  const charlas = new Map();
  let cubreDesde = null;
  let despues = null;
  for (let i = 0; i < paginas; i++) {
    let p;
    try {
      p = await ig.pagina({ limite: porPagina, mensajes: MENSAJES_POR_HILO, despues });
    } catch (e) {
      if (i === 0) throw e;
      break;
    }
    for (const h of p.lista) {
      const u = String(h.otro?.usuario || "").toLowerCase();
      if (u) charlas.set(u, [...(charlas.get(u) || []), charlaDe(h, cuenta, MENSAJES_POR_HILO)]);
      if (h.actualizado && (!cubreDesde || h.actualizado < cubreDesde)) cubreDesde = h.actualizado;
    }
    despues = p.despues;
    if (!despues) return { charlas, cubreDesde: null }; // se leyó la bandeja entera: cubre todo
    if (hasta && cubreDesde && cubreDesde <= hasta) break;
  }
  return { charlas, cubreDesde };
}

/**
 * Una charla de Instagram (leerHilo en lib/dm/instagram.js) como la mira contestadoDesde: el id de la
 * persona, sus mensajes ({ deLaCuenta, creado, texto }, los más nuevos primero) y cuántos se pidieron.
 */
export function charlaDe(h, cuenta, pedidos) {
  return {
    igsid: h?.otro?.id ? String(h.otro.id) : null,
    pedidos,
    mensajes: (h?.mensajes || []).map((m) => ({ deLaCuenta: esDeLaCuentaDe(m.de, cuenta), creado: m.creado || null, texto: m.texto || "" })),
  };
}

/**
 * La cuenta ya le contestó a esta persona el comentario? "si", "no" o "no_se".
 *
 * Cuenta lo que salió de la cuenta a partir del comentario, y el DM de CV o el de DEV cuando sea
 * (esDmDeCV, esDmDeDev): el que ya recibió la lista y vuelve a comentar CV no la recibe dos veces, y
 * lo mismo con el link de la llamada. Lo demás de antes no
 * cuenta. Antes se miraba si la cuenta le había escrito alguna vez, y sin ManyChat (que desde el
 * 31/10 no les contesta a los contactos nuevos) eso dejaba afuera para siempre al que charló con
 * Cande hace semanas y hoy comenta CV.
 *
 * El DM de CV se ve solo si está entre los mensajes leídos de la charla (5 en la bandeja, 10 cuando se
 * busca sola). Si ManyChat o el agente se lo mandaron hace semanas y después hubo charla, no se ve y la
 * lista le llega otra vez: es lo mismo que hacía ManyChat con cada comentario, y buscar la charla
 * entera de cada uno que ya habló con la cuenta no entra en la vuelta. Lo que mandó este cron sí se
 * sabe siempre (usuariosConDm).
 *
 * `charlas` son las de bandejaDe para esa persona y `desde` es la hora del comentario, en
 * milisegundos. Las dudas van del lado de no mandar, porque peor que un lead sin respuesta es uno
 * con la misma respuesta dos veces:
 *   - Un mensaje de la cuenta sin fecha cuenta como contestado.
 *   - Si de una charla se vieron todos los mensajes que se pidieron y son todos posteriores al
 *     comentario sin ninguno de la cuenta, no se llegó a ver hasta el comentario: lo que vino antes
 *     pudo ser la respuesta. Es "no_se".
 */
export function contestadoDesde(charlas, desde) {
  const vistas = (charlas || []).map((ch) => enLaCharla(ch, desde));
  if (vistas.includes("si")) return "si";
  if (vistas.includes("no_se")) return "no_se";
  return "no";
}

function enLaCharla({ mensajes = [], pedidos = MENSAJES_POR_HILO } = {}, desde) {
  const despues = (m) => !m.creado || m.creado.getTime() >= desde;
  if (mensajes.some((m) => m.deLaCuenta && (despues(m) || esDmFijo(m.texto)))) return "si";
  if (mensajes.length >= pedidos && mensajes.every(despues)) return "no_se";
  return "no";
}

// Lo mismo que esDeLaCuenta de lib/dm/instagram.js, acá para no arrastrar ese módulo entero (este
// archivo lo cargan las pruebas sin red). Si el id no coincide, vale el usuario.
function esDeLaCuentaDe(p, cuenta) {
  if (!p || !cuenta) return false;
  const u = String(p.usuario || "").toLowerCase();
  return (Boolean(p.id) && String(p.id) === String(cuenta.user_id)) || (Boolean(u) && u === String(cuenta.username || "").toLowerCase());
}

/**
 * Contesta los comentarios con CV (la lista) o DEV (la llamada) que todavía no tienen su DM. Todo entra por parámetro, así se
 * prueba sin red y sin base (tests/dmComentarios.test.mjs).
 *
 * `ig` es el cliente de lib/dm/instagram.js (cuenta, medios, comentarios, pagina, hiloDe,
 * responderComentario). `base` es lib/dm/comentariosBase.js (tomarComentario, anotarComentario,
 * soltarComentario, comentariosEnLaBase, anotarYaContestado, anotarEnDuda, soltarDuda, usuariosConDm, tomarPublica) más
 * leerMedios y guardarMedios, lo anotado de cada post para saber si hay que leer uno viejo (mediosParaLeer).
 * `limite` es la hora (en milisegundos) en que la vuelta deja de empezar cosas nuevas: si la función se
 * corta a mitad de un envío, el comentario queda en "enviando" y esa persona no recibe nunca nada.
 * `avisar` es el aviso de Telegram del agente (lib/dm/armado.js, avisarDm).
 *
 * El orden de cada comentario es siempre el mismo: primero queda tomado en la base y después sale
 * el DM. Si se corta en el medio, el comentario queda tomado y nadie lo vuelve a intentar.
 */
export async function contestarComentarios({
  ig, base, avisar = async () => {}, texto = TEXTO_CV, textoDev = TEXTO_DEV,
  tope = 10, mediosQueMira = 25, paginasDeMedios = 1, ahora = () => new Date(), registrar = () => {}, limite = null,
}) {
  const cuenta = await ig.cuenta();
  const hoy = ahora();
  const listados = await ig.medios({ limite: mediosQueMira, paginas: paginasDeMedios });
  // Lo anotado de la vuelta anterior (ver mediosParaLeer). Si no se puede leer, esta vuelta mira solo
  // los posts de la semana, como antes, y no pisa lo anotado.
  let antes = null;
  let anotar = Boolean(base.leerMedios && base.guardarMedios);
  if (anotar) {
    try {
      antes = await base.leerMedios();
    } catch {
      anotar = false;
    }
  }
  const { leer: medios, anotados } = mediosParaLeer(listados, antes, hoy);

  const candidatos = [];
  for (const m of medios) {
    const cs = await ig.comentarios(m.id);
    for (const c of comentariosParaContestar(cs, cuenta, hoy)) candidatos.push({ ...c, medio: m.id, permalink: m.permalink });
  }
  // Se anota después de leer: si Instagram falla antes, no se anota nada y la vuelta siguiente ve los
  // mismos cambios.
  if (anotar) await base.guardarMedios(anotados).catch(() => {});
  candidatos.sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));

  // Los que ya pasaron por acá (salió el DM, falló, o se averiguó que ya estaba contestado) no se
  // vuelven a mirar: así la búsqueda de a una charla no se gasta siempre en los mismos.
  const enBase = new Set(candidatos.length && base.comentariosEnLaBase ? await base.comentariosEnLaBase(candidatos.map((c) => c.id)) : []);
  // Los que vuelven a entrar porque su DM había caído en una solicitud sin aceptar: si vuelve a
  // fallar, a Cande no se le avisa otra vez (el primer aviso ya salió).
  const reintentos = new Set(candidatos.length && base.comentariosParaReintentar ? await base.comentariosParaReintentar(candidatos.map((c) => c.id)) : []);
  const pendientes = candidatos.filter((c) => !enBase.has(c.id));

  // Lo último de cada charla (para saber si ManyChat, el agente o Cande ya le contestaron) y hasta
  // dónde atrás se pudo ver.
  const masViejo = pendientes.length ? new Date(Date.parse(pendientes[pendientes.length - 1].timestamp)) : null;
  const { charlas, cubreDesde } = pendientes.length
    ? await bandejaDe(ig, cuenta, masViejo)
    : { charlas: new Map(), cubreDesde: null };

  // A quién ya le tomó el DM de CV este cron, en otra vuelta o en esta: el que comentó CV en dos
  // reels recibe uno solo. (La bandeja es una foto de antes de empezar: no ve lo que sale ahora.)
  const yaSalio = new Set(pendientes.length && base.usuariosConDm ? await base.usuariosConDm() : []);

  const cuentas = {
    medios: medios.length, viejos: medios.filter((m) => !enVentana(m.timestamp, hoy)).length, candidatos: candidatos.length, en_base: enBase.size, enviadas: 0, ya_contestado: 0, vencido: 0,
    sin_aceptar: 0, errores: 0, tomados: 0, ya_tenia: 0, sin_mirar: 0, buscadas: 0, publicas: 0, sin_tiempo: false,
  };
  let seguidos = 0;
  for (const c of pendientes) {
    if (cuentas.enviadas >= tope) break;
    if (limite && ahora().getTime() >= limite) {
      cuentas.sin_tiempo = true; // lo que falta queda para la vuelta siguiente
      break;
    }
    const u = String(c.username || "").toLowerCase();
    const t = Date.parse(c.timestamp);
    const suyas = charlas.get(u) || [];
    // Ya recibió algo de la cuenta desde que comentó, o el DM de CV: si le mandamos el link otra vez,
    // lo recibe dos veces. Si su charla no está en lo leído y el comentario es más viejo que lo que se
    // alcanzó a mirar, no se puede afirmar que nadie le contestó.
    let visto;
    if (u && yaSalio.has(u)) visto = "si";
    else if (suyas.length) visto = contestadoDesde(suyas, t);
    else visto = cubreDesde && t < cubreDesde.getTime() ? "no_se" : "no";
    // La duda se resuelve buscando su charla sola, más atrás (ver MENSAJES_HONDOS). Si Instagram falla
    // acá, o la charla tampoco alcanza, queda la duda y no se manda: se anota para buscarlo de nuevo en
    // unas horas, así no le saca el lugar a los demás en cada vuelta.
    if (visto === "no_se" && ig.hiloDe && cuentas.buscadas < HONDAS_POR_VUELTA) {
      const igsid = suyas.find((ch) => ch.igsid && contestadoDesde([ch], t) === "no_se")?.igsid || (suyas.length ? null : c.from?.id);
      if (igsid) {
        cuentas.buscadas++;
        try {
          const h = await ig.hiloDe(String(igsid), MENSAJES_HONDOS);
          const resto = suyas.filter((ch) => ch.igsid !== String(igsid));
          // Sin charla y sin nada en la bandeja: la cuenta no le escribió nunca.
          if (h || !suyas.length) visto = contestadoDesde([...resto, ...(h ? [charlaDe(h, cuenta, MENSAJES_HONDOS)] : [])], t);
          if (visto === "si" && base.anotarYaContestado) await base.anotarYaContestado(c.id, { medio: c.medio, usuario: c.username || null });
          // Si era una duda de otra vuelta y ahora se sabe que nadie le contestó, se borra para poder tomarlo.
          if (visto === "no" && base.soltarDuda) await base.soltarDuda(c.id);
        } catch {
          visto = "no_se";
        }
        if (visto === "no_se" && base.anotarEnDuda) await base.anotarEnDuda(c.id, { medio: c.medio, usuario: c.username || null }).catch(() => {});
      }
    }
    if (visto === "si") {
      cuentas.ya_tenia++;
      continue;
    }
    // La duda no se resuelve mandando. Queda para una vuelta que llegue más atrás.
    if (visto === "no_se") {
      cuentas.sin_mirar++;
      continue;
    }
    if (!(await base.tomarComentario(c.id, { medio: c.medio, usuario: c.username || null }))) continue;
    cuentas.tomados++;
    if (u) yaSalio.add(u);
    try {
      const r = await ig.responderComentario(c.id, c.tipo === "dev" ? textoDev : texto);
      await base.anotarComentario(c.id, "enviada", { igId: r?.recipient_id ? String(r.recipient_id) : null });
      cuentas.enviadas++;
      seguidos = 0;
      if (await responderEnPublico({ ig, base, id: c.id, registrar })) cuentas.publicas++;
    } catch (e) {
      const motivo = motivoDelError(e);
      // Un pedido que se cortó por tiempo pudo haber salido igual: no se suelta y no se reintenta.
      if (e?.demora) {
        await base.anotarComentario(c.id, "enviando", { detalle: "incierta: se cortó por tiempo" });
        cuentas.errores++;
        break;
      }
      if (motivo === "otro" && DESPACIO.includes(e?.code)) {
        await base.soltarComentario(c.id);
        cuentas.errores++;
        break; // Instagram pidió despacio: el resto queda para la vuelta siguiente
      }
      await base.anotarComentario(c.id, motivo === "otro" ? "error" : motivo, { detalle: e?.message || String(e) });
      cuentas[motivo === "otro" ? "errores" : motivo]++;
      registrar(motivo, e);
      if (motivo === "sin_aceptar" && !reintentos.has(c.id)) {
        // Esto solo lo destraba Cande aceptando la solicitud en la app: callarse sería perder al
        // lead. El aviso sale una sola vez; después se reintenta solo cada SIN_ACEPTAR_HORAS.
        const dev = c.tipo === "dev";
        await avisar(`Un comentario con ${dev ? "DEV" : "CV"} quedó sin contestar`, {
          Quién: c.username ? `@${c.username}` : "no se sabe",
          Qué: `me escribió ${dev ? "DEV" : "CV"} en un comentario pero el DM queda en una solicitud sin aceptar`,
          Hacé: `aceptale la solicitud en Instagram y le mando ${dev ? "el link de la llamada" : "la lista"}`,
          ...(c.permalink ? { Dónde: c.permalink } : {}),
        }, { contestable: false });
      }
      seguidos = motivo === "otro" ? seguidos + 1 : 0;
      if (seguidos >= SEGUIDOS_PARA_CORTAR) break;
    }
  }
  return cuentas;
}
