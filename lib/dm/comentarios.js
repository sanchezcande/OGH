// "Comentá CV y te mando la lista": la puerta principal de entrada de leads, sin ManyChat (30/10).
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
//      (ManyChat, el agente o Cande) no se le manda nada. De un comentario anterior a lo que se
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

/**
 * El comentario pide la lista de developers?
 *
 * CV tiene que ser una palabra del comentario (no "cvlo", no "mandé muchos cv") y todo lo demás,
 * relleno. Un comentario que dice algo más está hablando, no pidiendo el link, y ese no se contesta
 * solo: lo ve Cande en Instagram como siempre.
 */
export function esPalabraCV(texto) {
  const p = plano(texto);
  if (!p) return false;
  const palabras = p.split(" ");
  return palabras.includes("cv") && palabras.every((w) => w === "cv" || esRelleno(w));
}

// El automático de CV de ManyChat, tal cual quedó cargado en dm_config "automaticos". El texto de
// abajo arranca con él a propósito: así la red de la bandeja lo reconoce como automático
// (esAutomatico en lib/dm/instagram.js compara 30 letras del principio) y la charla queda del
// agente. Si no, lo que salió de la cuenta pasaría por algo que Cande escribió a mano y el agente
// se saldría de esa charla sin haber dicho una palabra.
export const AUTOMATICO_CV_MANYCHAT =
  "Holii! Gracias por comentar :) Te paso mi lista de developers: es donde busco cuando me entra un proyecto. Llenás un form de 3 min y quedás adentro!";

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

/** Los días que Instagram deja contestar un comentario por private reply. */
export const VENTANA_DIAS = 7;
/**
 * Con cuánto margen se deja de intentar. Un comentario de 6 días y 23 horas puede vencerse entre
 * que se lo lee y que sale el DM: ese no se toma, así no queda tomado uno que nunca se va a poder
 * contestar.
 */
export const MARGEN_HORAS = 6;

/**
 * Cuánto se le deja a ManyChat antes de meterse. Su automático contesta a los 7 segundos, pero si
 * alguna vez tarda y nosotros mandamos en el medio, el lead recibe el link dos veces.
 *
 * 31/10: bajó de 5 a 2. ManyChat tiene el tope de contactos puesto en 2.500 sin excedente, así que
 * a los contactos NUEVOS ya no les contesta nada; a los que ya existen les sigue contestando a los
 * segundos, y por eso la espera no es cero todavía. Cuando ManyChat se borre, esto va a 0 y lo que
 * queda es el cron (cada 5 minutos).
 */
export const FRESCO_MINUTOS = 2;

/** Este comentario está dentro de la ventana de la private reply, y ya no es recién hecho? */
export function enVentana(creado, ahora = new Date()) {
  const t = creado instanceof Date ? creado.getTime() : Date.parse(String(creado || ""));
  if (!Number.isFinite(t)) return false;
  const vence = t + VENTANA_DIAS * 86400000 - MARGEN_HORAS * 3600000;
  return t + FRESCO_MINUTOS * 60000 <= ahora.getTime() && ahora.getTime() < vence;
}

/**
 * De los comentarios de un medio, los que hay que contestar: los que piden la lista, están dentro
 * de la ventana y no los escribió la cuenta misma (Cande contesta sus propios posts). Los más
 * nuevos primero: si la vuelta no alcanza para todos, el que acaba de comentar no espera.
 *
 * `cuenta` es { user_id, username } (lib/dm/instagram.js, cuenta). `comentarios` son los que
 * devuelve la API: { id, text, timestamp, username, from }.
 */
export function comentariosParaContestar(comentarios, cuenta, ahora = new Date()) {
  const mio = String(cuenta?.username || "").toLowerCase();
  const miId = String(cuenta?.user_id || "");
  return (comentarios || [])
    .filter((c) => {
      if (!c?.id || !esPalabraCV(c.text)) return false;
      if (!enVentana(c.timestamp, ahora)) return false;
      const u = String(c.username || "").toLowerCase();
      const id = String(c.from?.id || "");
      return !((mio && u === mio) || (miId && id === miId));
    })
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
// explicarError en lib/dm/instagram.js).
const DESPACIO = [4, 17, 32, 613, 80002];
/** Cuántos errores raros seguidos antes de cortar la vuelta: algo anda mal, no se quema la lista. */
const SEGUIDOS_PARA_CORTAR = 3;

/** Páginas de la bandeja que se leen como mucho para saber a quién ya le contestaron. */
// Tres páginas de 50 charlas tardan unos 30 segundos y cubren, con el ritmo de su bandeja, varias
// horas: de sobra para los comentarios de la vuelta (15 minutos). De cada charla alcanza con los 2
// mensajes más nuevos: la respuesta de ManyChat sale a los segundos, así que es lo último que hay.
const PAGINAS_BANDEJA = 3;
const HILOS_POR_PAGINA = 50;
const MENSAJES_POR_HILO = 2;

/**
 * Quién de la bandeja ya recibió algo de la cuenta, y hasta dónde atrás se pudo mirar.
 *
 * Esto es la traba contra el automático de CV de ManyChat, que el 30/10 seguía vivo y contestaba
 * los comentarios a los 7 segundos: si los dos contestan, el lead recibe el mismo link dos veces
 * (le pasó a una persona esa noche). Como ManyChat contesta al instante, su respuesta está arriba
 * en la bandeja, así que alcanza con mirar las páginas que cubren el rato de los comentarios.
 *
 * Devuelve { escritos, cubreDesde }: un Map de usuario a CUÁNDO fue el último mensaje de la cuenta
 * en esa charla, y la charla más vieja que se alcanzó a mirar. De un comentario anterior a
 * `cubreDesde` no se puede afirmar que nadie le contestó, así que ese no se contesta.
 *
 * El cuándo importa (31/10). Antes esto era un Set: alcanzaba con que la cuenta le hubiera escrito
 * alguna vez para no mandarle nunca más la lista. Con ManyChat contestando al instante eso no se
 * notaba, pero el que charló con Cande hace tres semanas y hoy vuelve a comentar CV quedaba
 * salteado para siempre. Lo que prueba que ya le contestaron a ESTE comentario es un mensaje de la
 * cuenta POSTERIOR al comentario, no uno de antes.
 */
export async function bandejaDe(ig, cuenta, hasta, { paginas = PAGINAS_BANDEJA, porPagina = HILOS_POR_PAGINA } = {}) {
  const escritos = new Map();
  let cubreDesde = null;
  let despues = null;
  for (let i = 0; i < paginas; i++) {
    const { lista, despues: sig } = await ig.pagina({ limite: porPagina, mensajes: MENSAJES_POR_HILO, despues });
    for (const h of lista) {
      const u = String(h.otro?.usuario || "").toLowerCase();
      const mios = u ? h.mensajes.filter((m) => esDeLaCuentaDe(m.de, cuenta)) : [];
      if (mios.length) {
        // Sin fecha no se puede comparar, y la duda se resuelve del lado de no mandar: Infinity es
        // "le escribimos después de cualquier comentario", o sea que no se le manda nada.
        const cuando = Math.max(...mios.map((m) => (m.creado ? new Date(m.creado).getTime() : Infinity)));
        escritos.set(u, Math.max(escritos.get(u) ?? -Infinity, cuando));
      }
      if (h.actualizado && (!cubreDesde || h.actualizado < cubreDesde)) cubreDesde = h.actualizado;
    }
    despues = sig;
    if (!despues) return { escritos, cubreDesde: null }; // se leyó la bandeja entera: cubre todo
    if (hasta && cubreDesde && cubreDesde <= hasta) break;
  }
  return { escritos, cubreDesde };
}

// Lo mismo que esDeLaCuenta de lib/dm/instagram.js, acá para no arrastrar ese módulo entero (este
// archivo lo cargan las pruebas sin red). Si el id no coincide, vale el usuario.
function esDeLaCuentaDe(p, cuenta) {
  if (!p || !cuenta) return false;
  const u = String(p.usuario || "").toLowerCase();
  return (Boolean(p.id) && String(p.id) === String(cuenta.user_id)) || (Boolean(u) && u === String(cuenta.username || "").toLowerCase());
}

/**
 * Contesta los comentarios con CV que todavía no tienen su DM. Todo entra por parámetro, así se
 * prueba sin red y sin base (tests/dmComentarios.test.mjs).
 *
 * `ig` es el cliente de lib/dm/instagram.js (cuenta, medios, comentarios, responderComentario).
 * `base` es lib/dm/comentariosBase.js (tomarComentario, anotarComentario, soltarComentario).
 * `avisar` es el aviso de Telegram del agente (lib/dm/armado.js, avisarDm).
 *
 * El orden de cada comentario es siempre el mismo: primero queda tomado en la base y después sale
 * el DM. Si se corta en el medio, el comentario queda tomado y nadie lo vuelve a intentar.
 */
export async function contestarComentarios({
  ig, base, avisar = async () => {}, texto = TEXTO_CV,
  tope = 10, mediosQueMira = 25, ahora = () => new Date(), registrar = () => {},
}) {
  const cuenta = await ig.cuenta();
  const hoy = ahora();
  const medios = (await ig.medios({ limite: mediosQueMira }))
    .filter((m) => Number(m.comments_count) > 0 && enVentana(m.timestamp, hoy));

  const candidatos = [];
  for (const m of medios) {
    const cs = await ig.comentarios(m.id);
    for (const c of comentariosParaContestar(cs, cuenta, hoy)) candidatos.push({ ...c, medio: m.id, permalink: m.permalink });
  }
  candidatos.sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));

  // A quién ya le contestó alguien (ManyChat, el agente o Cande) y hasta dónde atrás se pudo ver.
  const masViejo = candidatos.length ? new Date(Date.parse(candidatos[candidatos.length - 1].timestamp)) : null;
  const { escritos, cubreDesde } = candidatos.length
    ? await bandejaDe(ig, cuenta, masViejo)
    : { escritos: new Map(), cubreDesde: null };

  const cuentas = {
    medios: medios.length, candidatos: candidatos.length, enviadas: 0, ya_contestado: 0, vencido: 0, sin_aceptar: 0,
    errores: 0, tomados: 0, ya_tenia: 0, sin_mirar: 0,
  };
  let seguidos = 0;
  for (const c of candidatos) {
    if (cuentas.enviadas >= tope) break;
    // La cuenta ya le escribió DESPUÉS de este comentario: ya le contestaron (ManyChat, el agente o
    // Cande) y mandarle el link otra vez es que lo reciba dos veces. Un mensaje de antes no cuenta:
    // ese es otro asunto, no la respuesta a esto.
    const leEscribieron = escritos.get(String(c.username || "").toLowerCase());
    if (leEscribieron != null && leEscribieron >= Date.parse(c.timestamp)) {
      cuentas.ya_tenia++;
      continue;
    }
    // Más viejo de lo que se alcanzó a mirar en la bandeja: no se puede afirmar que nadie le
    // contestó, y la duda no se resuelve mandando. Queda para una vuelta que llegue más atrás.
    if (cubreDesde && Date.parse(c.timestamp) < cubreDesde.getTime()) {
      cuentas.sin_mirar++;
      continue;
    }
    if (!(await base.tomarComentario(c.id, { medio: c.medio, usuario: c.username || null }))) continue;
    cuentas.tomados++;
    try {
      const r = await ig.responderComentario(c.id, texto);
      await base.anotarComentario(c.id, "enviada", { igId: r?.recipient_id ? String(r.recipient_id) : null });
      cuentas.enviadas++;
      seguidos = 0;
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
      if (motivo === "sin_aceptar") {
        // Esto solo lo destraba Cande aceptando la solicitud en la app: callarse sería perder al lead.
        await avisar("Un comentario con CV quedó sin contestar", {
          Quién: c.username ? `@${c.username}` : "no se sabe",
          Qué: "me escribió CV en un comentario pero el DM queda en una solicitud sin aceptar",
          Hacé: "aceptale la solicitud en Instagram y le mando la lista",
          ...(c.permalink ? { Dónde: c.permalink } : {}),
        }, { contestable: false });
      }
      seguidos = motivo === "otro" ? seguidos + 1 : 0;
      if (seguidos >= SEGUIDOS_PARA_CORTAR) break;
    }
  }
  return cuentas;
}
