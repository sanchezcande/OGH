// El controlador del agente de DM (20/10). Cande: "dijimos que íbamos a poner un controlador o algo para que estas
// cosas no pasen más", después de abrir una charla donde el lead le dijo que sí al puente y el agente, en vez del
// turno 2, le hizo otra pregunta.
//
// Son reglas fijas, sin modelo: no dependen de que un LLM se dé cuenta (el repaso de la Mac, tracker/dm_repaso.py, es
// un modelo y no lo vio). Miran las charlas de las últimas 72 horas y encuentran fallas del recorrido:
//
//   F1  puente aceptado sin entregar: el agente ofreció el puente (o la lista), el lead dijo que sí y lo que siguió no
//       trae el formulario ni el turno 2 (nada, otra cosa, o llegó más de una hora tarde).
//   F2  vio el video con interés (o dijo que sí cuando se le preguntó si le sirve) y no le llegó cuánto sale. Solo si
//       es dev, busca trabajo, ya dijo su dolor y todavía no sabía cuánto sale: sin eso, no vender es lo que pide el prompt.
//   F3  pregunta repetida: una pregunta de la misma clase que ya hizo la cuenta, o que el lead ya había contestado.
//   F4  cierre prematuro: mostró interés y frenó ("lo pienso", "a fin de mes") y el agente cerró sin dar un paso más.
//   F5  lead sin respuesta: un mensaje sin atender hace más de 15 minutos, uno que no le llegó al agente (la red de la
//       bandeja), o una respuesta que la revisión de la Mac calló ante una pregunta.
//   F6  pase a Cande sin respuesta: según la bandeja real (lo que Cande escribe a mano no queda en la base), una charla
//       suya donde el lead espera hace más de 6 horas.
//
// Qué hace con cada una:
//   - F1 y F2 se corrigen solas si es seguro: la charla es del agente y no pasó por Cande después de la falla (si ella
//     la tuvo y la devolvió, lo que escribió a mano en ese rato no está en la base: pudo haberle mandado ya lo que
//     falta), el lead no escribió después, Cande tampoco (en la base, con una indicación desde Telegram, o a mano en
//     Instagram: eso lo mira el agente al corregir, como en cualquier turno), la ventana sigue abierta (23 h), no hay
//     una respuesta por salir, la Mac contesta, esa charla no se corrigió antes por la misma regla (una sola vez por
//     charla y regla) ni recibió otra corrección después de la falla, y es una sola corrección por charla en cada
//     vuelta (dos mensajes seguidos sin que el lead conteste, nunca). Una F2 se corrige solo si después el agente calló o
//     escribió algo sin pregunta: si le hizo otra pregunta (puede ser la de Cuba, o si le sirve: el prompt las
//     pide antes de cuánto sale), no se la pisa y va al resumen. La corrección es un turno del agente con la indicación
//     del controlador (evento "control" de lib/dm/agente.js): pasa por todos los frenos (los del último turno del lead
//     también) y por la revisión de la Mac, como siempre. Si no sale (se frena, calla, el modelo no está), no se
//     reintenta: va al resumen. Si sale pero no trae lo que faltaba (la vuelta siguiente encuentra la misma falla),
//     también.
//   - Lo demás (F3, F4, F5 de la base y de la revisión de la Mac, y lo que no se pudo corregir) va al resumen de las
//     notas (lib/dm/resumen.js), sin sonido, como un renglón "Controlador: ..." de esa charla, una vez por charla y
//     falla. Un renglón que se pone después (una corrección que salió mal) entra en el resumen siguiente.
//   - F5 de la bandeja y F6 ya salen en el resumen de la bandeja ("DM: charlas que esperan respuesta tuya"): quedan
//     solo para medir, sin repetirlas. Tampoco cuentan si la base ya tiene una respuesta de la cuenta, ni una
//     despedida o un adjunto del lead después de un cierre de la cuenta.
//   - Una F1 o F2 que llegó tarde (o se arregló sola después) queda solo para medir. También una F1, F2 o F4 en una
//     charla de Cande con una prueba de que ella contestó: un mensaje de la cuenta en la base después de la falla. Sin
//     esa prueba va al resumen con "si ya le contestaste, ignoralo": que la bandeja no la tenga esperando no prueba
//     nada (la saca también si Cande sigue a la persona o si le contestó un automático).
//   - F5 se "resuelve": si en una vuelta siguiente ya no está (le contestaron), su renglón sale del resumen. Lo mismo
//     una F1, F2 o F4 de una charla de Cande cuando aparece su respuesta en la base.
//
// Cada falla queda en dm_salidas (accion "control", detalle "F1#<ancla>", estado: ESTADOS) para poder medir. No cuenta
// como respuesta para nada: ni para la red de la bandeja, ni para la espera, ni para el tope del día (lib/dm/base.js
// las deja afuera por accion y por estado).
//
// Lo corre el cron /api/dm/controlador cada 10 minutos, con el ajuste "controlador" (prendido de fábrica). Las reglas
// son funciones puras, para probarlas sin base (tests/dmControlador.test.mjs).
import { randomUUID } from "node:crypto";
import { esFoto } from "./agente";
import { haceCuanto } from "./bandeja";
import { esEmpresa, plano, senales } from "./frenos";
import { porQueNoSalio } from "./respuestas";

const MIN = 60000;
const HORA = 60 * MIN;

/** Las reglas, como le llegan a Cande y quedan en la base. */
export const REGLAS = {
  F1: "puente aceptado sin entregar",
  F2: "vio el video con interés y no le llegó cuánto sale",
  F3: "pregunta repetida",
  F4: "cierre prematuro",
  F5: "lead sin respuesta",
  F6: "pase a Cande sin respuesta",
};
/** Las que el controlador corrige solo. */
export const SE_CORRIGEN = new Set(["F1", "F2"]);
/** Las que se resuelven solas si le contestan: su renglón sale del resumen. */
export const SE_RESUELVEN = new Set(["F5", "F6"]);
/**
 * Las que, en una charla de Cande que ella ya contestó (un mensaje de la cuenta en la base después de la falla), quedan
 * solo para medir: ella ya está ahí. Si se anotaron antes de que contestara, su renglón sale del resumen.
 */
export const LAS_VE_CANDE = new Set(["F1", "F2", "F4"]);
/** Lo que se le suma al renglón de una charla de Cande sin prueba de que contestó. */
export const SI_YA_CONTESTASTE = "Si ya le contestaste, ignoralo.";
/** Por qué la F5 de la bandeja y la F6 quedan solo para medir. */
export const EN_LA_BANDEJA = "ya sale en el resumen de la bandeja";

/**
 * Cómo queda cada falla en dm_salidas (accion "control"). Ninguno es un estado de una respuesta que salió o puede salir
 * (pendiente, enviando, enviada, incierta, callo): así nada de lo que mira si el agente contestó lo cuenta.
 */
export const ESTADOS = {
  corrigiendo: "corrigiendo", // constancia antes de pedirle el turno al agente
  corregida: "corregida",     // salió la corrección
  sinCorregir: "sin_corregir", // se intentó y no salió: va al resumen
  alResumen: "al_resumen",    // no se corrige: va al resumen
  medida: "medida",           // solo para medir (llegó tarde, o se arregló sola)
  resuelta: "resuelta",       // F5 o F6 que ya tuvo respuesta: sale del resumen
};
const INTENTADAS = new Set([ESTADOS.corrigiendo, ESTADOS.corregida, ESTADOS.sinCorregir]);

/** Las charlas que se miran: las que tuvieron algún mensaje en estas horas. */
export const MIRAR_HORAS = 72;
const MIRAR_MS = MIRAR_HORAS * HORA;
/** Un sí sin nada después, o un mensaje sin atender, recién es una falla pasado esto. */
export const SIN_RESPUESTA_MS = 15 * MIN;
/** El turno 2 que llega más de esto después del sí llegó tarde. */
export const TARDE_MS = 60 * MIN;
/** Una charla pasada a Cande con el lead esperando más de esto. */
export const PASE_SIN_RESPUESTA_MS = 6 * HORA;
/** Hasta cuándo se corrige: la ventana de Instagram es de 24 horas, el agente escribe hasta las 23,5. */
export const VENTANA_CORREGIR_MS = 23 * HORA;
/** Una corrección que quedó a medias (la función murió) pasado esto va al resumen. */
export const CORRIGIENDO_VENCE_MS = 10 * MIN;
/** Correcciones por vuelta: cada una es un turno del modelo (hasta un minuto y pico). Las que no entran, a la siguiente. */
export const CORRECCIONES_POR_VUELTA = 3;
/** El prefijo de cada renglón del controlador en el resumen de las notas. */
export const PREFIJO = "Controlador:";

// Las reglas se miran "en plano" (frenos.plano: sin tildes ni mayúsculas, con los espacios juntados), como los frenos.
// Son las del barrido del 20/10, probadas contra la base de esas 72 horas.
const OFERTA = /te (cuente|cuento) como te (podria|puedo) ayudar|queres que te (la )?pase( la lista)?\?/;
const SI = /^[^a-z0-9]*(si+|sip|dale+|ok+|okey|okay|bueno+|claro|obvio|contame|cuentame|comentame|dime|decime|por (supuesto|favor)|porfa|seguro|me encantaria|me interesa|sin problema|a ver|de una|vale)(?![a-z0-9])|como quieras|me interesa|cuentame|contame|pasamela|me encantaria|me ayudarias|escucho|tips|consejos|👍|👌/u;
const NO = /^[^a-z0-9]*no(?![a-z0-9])|no,? (muchas )?gracias|no me interesa|por ahora no|no por (ahora|el momento)/;
const ENTREGA = /opengatehub\.com\/devs|hablo un monton/;
// Lo que pregunta si vio el video (paso 8). Preguntarle qué le pareció cuenta solo si el lead ya había dicho que lo
// vio: si no, puede ser por otra cosa (la entrevista, el formulario). Las plantillas del propio agente para cuando
// todavía no lo vio no cuentan: la de "cuando lo veas (o lo llenes)" (el que lo va a ver después) y la de si lo puede
// ver ahora (el turno 2 cuando el formulario ya está).
const PREGUNTA_SI_VIO = /viste el video|llegaste a ver el video|pudiste (ver|mirar) el video/;
const QUE_TE_PARECIO = /que te parecio( el video)? ?\?/;
const LO_VE_DESPUES = /cuando (lo )?(veas|llenes|mires)/;
// Si le puede servir (la pregunta del paso 8 ante una respuesta vaga): ahí un sí simple ya es el paso 9.
const PREGUNTA_SIRVE = /te puede servir|sentis que (eso )?te sirve/;
const VIO_VIDEO = /\bvi el video\b|\bya lo vi\b|\blo acabo de ver\b|\b(listo|si+),? lo vi\b/;
const NO_LO_VIO = /no lo vi|todavia no|aun no/;
// "útil" entera: "inútil" no es interés.
const INTERES = /me gust|me encant|me sirv|muy buen|esta (muy )?buen|buenisimo|interesante|excelente|genial|\butil\b|perfecto|buen precio|me interes|me convenci|vale la pena|copado/;
// Sin interés todavía: no le gustó, o lo va a ver después (lo mira en un rato).
const SIN_INTERES = /no me (gust|sirv|convenc|interes)|no lo vi|todavia no|aun no|ahora lo (veo|miro)|lo (veo|miro) (despues|mas tarde|luego|en un rato|ahora)|(despues|luego|mas tarde) lo (veo|miro)|cuando pueda|en un rato/;
const PRECIO_DADO = /27 dolares|13[,.]50|2 pagos|link de pago|get\.opengatehub|gumroad|pagar-pesos/;
// Lo que el prompt pide preguntar antes de cuánto sale: a quien es de Cuba, si tiene cómo pagar desde afuera; ante
// una respuesta vaga, si le sirve. Hacer esa pregunta no es una falla.
const ANTES_DEL_PRECIO = /desde cuba|pagar desde afuera|te puede servir|sentis que (eso )?te sirve/;
const PROGRAMA_NOMBRADO = /opengatehub\.com\/devs|mi programa|27 dolares/;
const FRENA = /me interes|lo voy a pensar|lo pienso|pensarlo|guarde|anotad[oa]|luego veo|despues (lo )?(veo|hago|pago|compro)|mas adelante|me animo|evaluar|fin de mes|cuando cobre|priorid/;
const NO_CORTO = /^[^a-z0-9]*no(?![a-z0-9])|no me interesa|no,? (muchas )?gracias/;
const CIERRE = /entiendo totalmente|un placer|gracias a vos|tranqui|la lista te queda|exitos|suerte|dale de una/;
const PASO_MAS = /27|13[,.]50|2 pagos|link|garantia|te frena|tendria que tener|mercado ?pago|pesos/;
// Las preguntas de la cuenta, por clase (la primera que coincide).
const CLASES = [
  ["sos_dev", /sos dev( o|\?)|sos programador\?|estas construyendo algo\?/],
  ["busca", /estas buscando (trabajo|laburo)|buscando (trabajo|laburo) o tranqui|ya estas buscando|ya arrancaste a buscar/],
  ["como_va", /como va (la|tu|esa) busqueda|como viene (la|esa) busqueda/],
  ["que_cuesta", /que (es lo que )?(mas )?te (esta )?cost(ando|aba)|que sentis que te (esta )?(frena|cuesta)/],
  ["para_cuando", /para cuando pensas/],
  ["manda_cvs", /estas mandando cvs/],
  ["que_parecio", /que te parecio/],
  ["puede_pagar", /es algo que podes pagar/],
];
const DIJO_QUE_ES_DEV = /\bsoy (dev|developer|desarrollador|programador|full ?stack|frontend|backend|ingenier[oa] (en sistemas|informatic[oa]|de software))/;
const DIJO_SI_BUSCA = /(estoy|ando) buscando (trabajo|laburo|empleo)|\bbusco (trabajo|laburo|empleo)|en busqueda (laboral|activa)|no estoy buscando|tengo trabajo|estoy tranqui|todo tranqui/;
const TOQUE = /^holii/;
const CALLADO_POR_LA_REVISION = /\|\s*revisi[oó]n:\s*callado/i;
const NO_LE_LLEGO = /no le lleg[oó]/i;
// Las notas que dejan la vuelta de Instagram (instagram.sacar) y la devolución desde Telegram (respuestas.js): Cande
// tuvo la charla. Lo que escribió a mano en ese rato no queda en la base.
const NOTA_DE_CANDE = /^(la charla quedo de cande|cande llevo esta charla)/;
// La de la vuelta de Instagram cuando la vio escribir a mano (instagram.porQueSale: "le escribiste vos").
const ESCRIBIO_A_MANO = /^la charla quedo de cande: le escribiste vos/;
// La salida de un turno con una indicación de Cande desde Telegram (lib/dm/agente.js, DETALLE_INDICACION): queda
// como del agente en la charla, pero lo decidió ella.
const DE_UNA_INDICACION = /^indicaci[oó]n/i;
// Una despedida del lead ("gracias, que tengas buen finde"): después de un cierre de la cuenta no espera respuesta.
const DESPEDIDA = /gracias|saludos|que tengas|buen (finde|fin de semana|dia|domingo)|igualmente|estamos en contacto|que sigas bien|abrazo|exitos|nos vemos|chau|bendiciones|un placer/;

const CUENTA = new Set(["agente", "cande", "automatico"]);
const RESPUESTAS = new Set(["pendiente", "enviando", "enviada", "incierta", "callo"]);
const hora = (d) => (d ? new Date(d).getTime() : NaN);
const corto = (s, n = 70) => {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  return Array.from(t).length > n ? `${Array.from(t).slice(0, n).join("")}…` : t;
};
const esDev = (quien) => quien === "dev" || quien === "estudia";

/**
 * La charla en tramos: lo que escribió el lead de corrido y lo que salió de la cuenta de corrido (el agente, Cande o un
 * automático), alternados y en orden. Las notas del sistema no cuentan.
 */
export function tramos(mensajes) {
  const out = [];
  for (const m of mensajes || []) {
    const tipo = m.quien === "lead" ? "lead" : CUENTA.has(m.quien) ? "cuenta" : null;
    if (!tipo) continue;
    const ultimo = out.at(-1);
    if (ultimo?.tipo === tipo) ultimo.mensajes.push(m);
    else out.push({ tipo, mensajes: [m] });
  }
  return out;
}
const textoDe = (t) => (t?.mensajes || []).map((m) => String(m.texto ?? "")).join(" / ");
const planoDe = (t) => plano(textoDe(t));

/** Lo que contestó la cuenta en el momento: los primeros mensajes del tramo, de quien lo empezó y en sus primeros 10 minutos. */
export const MISMO_TURNO_MS = 10 * MIN;
function turnoDe(t) {
  const [primero] = t.mensajes;
  const fin = t.mensajes.findIndex((m) => m.quien !== primero.quien || hora(m.creado) - hora(primero.creado) > MISMO_TURNO_MS);
  return { tipo: t.tipo, mensajes: fin === -1 ? t.mensajes : t.mensajes.slice(0, fin) };
}

/** Si lo que escribió el lead después de la oferta es un sí (y no un no). */
export const esSi = (texto) => SI.test(plano(texto)) && !NO.test(plano(texto));

/**
 * La oferta del puente (o de la lista) en un tramo de la cuenta: el último mensaje del agente que la hace (o de Cande, en
 * una charla del agente: un /textual suyo, y el sí lo contesta el agente), si después no preguntó otra cosa en ese
 * mismo tramo (el sí podría ser a eso). null si no hay.
 */
function ofertaEn(t, { delAgente = false } = {}) {
  let oferta = null;
  for (const m of t.mensajes) {
    const p = plano(m.texto);
    if ((m.quien === "agente" || (delAgente && m.quien === "cande")) && OFERTA.test(p)) oferta = m;
    else if (oferta && p.includes("?")) oferta = null;
  }
  return oferta;
}

/**
 * Lo que vino después de la respuesta del lead (tramo `i` de la cuenta, o nada): si el turno del lead sigue abierto
 * (lo va a contestar el agente: la espera), si el lead escribió después y la cuenta le contestó, y si en algún tramo de
 * después llegó lo que faltaba (`llego`).
 */
function loQueSiguio(ts, i, contacto, llego) {
  const despues = ts.slice(i + 1);
  const ultimo = ts.at(-1);
  const pendiente = ultimo?.tipo === "lead" && (Number(contacto?.respondido_hasta) || 0) < ultimo.mensajes.at(-1).id;
  return { leadDespues: despues.some((x) => x.tipo === "lead"), pendiente, llegoDespues: despues.some((x) => x.tipo === "cuenta" && llego(x)) };
}

/**
 * F1. El puente (o la lista) aceptado sin el turno 2. Por cada oferta del agente seguida de un sí del lead, mira el
 * tramo de la cuenta que siguió:
 *   nada       no salió nada en 15 minutos y el turno ya está cerrado (si está abierto, lo contesta la espera: es F5);
 *   otra_cosa  salió algo sin el formulario ni el turno 2;
 *   tarde      el turno 2 llegó más de una hora después del sí (lo mandó tarde el agente o lo mandó Cande).
 * Lo que se le dice a Cande que le llegó es lo que contestó la cuenta en el momento (turnoDe).
 * Devuelve [{ regla, ancla (el id de la oferta), tipo, dijo, siguiente, desde (el id de la oferta), desdeEn (su hora),
 * momento (la hora del sí), ... }].
 */
export function puenteSinEntregar(mensajes, { contacto = null, ahora }) {
  const ts = tramos(mensajes);
  const delAgente = contacto?.dueno === "agente";
  const out = [];
  for (let i = 0; i + 1 < ts.length; i++) {
    if (ts[i].tipo !== "cuenta") continue;
    const oferta = ofertaEn(ts[i], { delAgente });
    if (!oferta) continue;
    const resp = ts[i + 1];
    const dijo = textoDe(resp);
    if (!esSi(dijo)) continue;
    const ultimoLead = resp.mensajes.at(-1);
    if (ahora - hora(ultimoLead.creado) > MIRAR_MS) continue;
    const sig = ts[i + 2] || null;
    const base = {
      regla: "F1", ancla: String(oferta.id), desde: oferta.id, desdeEn: hora(oferta.creado), dijo, momento: hora(ultimoLead.creado),
    };
    if (!sig) {
      if (ahora - hora(ultimoLead.creado) < SIN_RESPUESTA_MS) continue; // todavía puede llegar
      if ((Number(contacto?.respondido_hasta) || 0) < ultimoLead.id) continue; // turno abierto: lo contesta la espera (F5)
      out.push({ ...base, tipo: "nada", siguiente: null, leadDespues: false, pendiente: false, llegoDespues: false });
      continue;
    }
    const entrega = sig.mensajes.find((m) => ENTREGA.test(plano(m.texto)));
    if (entrega) {
      const demora = hora(entrega.creado) - hora(ultimoLead.creado);
      if (demora > TARDE_MS) out.push({ ...base, tipo: "tarde", siguiente: textoDe(turnoDe(sig)), demora, medida: true });
      continue;
    }
    const siguio = loQueSiguio(ts, i + 2, contacto, (x) => ENTREGA.test(planoDe(x)));
    out.push({ ...base, tipo: "otra_cosa", siguiente: textoDe(turnoDe(sig)), deCande: sig.mensajes.some((m) => m.quien === "cande"), ...siguio });
  }
  return out;
}

/** Si el lead dice que vio el video (y no que no lo vio). */
const dijoQueLoVio = (p) => VIO_VIDEO.test(p) && !NO_LO_VIO.test(p);

/**
 * F2. Vio el video, opinó a favor y no le llegó cuánto sale. El turno del lead cuenta si la cuenta le había preguntado
 * si lo vio (o qué le pareció, a quien ya dijo que lo vio), si él dice que lo vio, o si contesta que sí cuando se le
 * preguntó si le sirve (ahí un sí simple alcanza). Solo si es dev, busca trabajo y ya dijo su dolor (el estado del
 * modelo): sin eso el prompt no deja vender, y no venderle no es una falla. Tampoco es falla si ya sabía cuánto sale
 * (se le dijo antes, o el estado dice que se le dijo), ni si lo que siguió es una pregunta que el prompt pide antes del
 * monto (la de Cuba, la de si le sirve). `pregunta`: lo que contestó la cuenta en el momento es otra pregunta (esa no se
 * pisa con una corrección).
 */
export function videoSinPrecio(mensajes, { contacto = null, ahora }) {
  const e = contacto?.estado || {};
  if (!esDev(e.quien) || e.busca !== "si" || !String(e.dolor || "").trim()) return [];
  const ts = tramos(mensajes);
  const out = [];
  for (let i = 0; i < ts.length; i++) {
    const L = ts[i];
    if (L.tipo !== "lead") continue;
    const ultimoLead = L.mensajes.at(-1);
    if (ahora - hora(ultimoLead.creado) > MIRAR_MS) continue;
    const P = i > 0 ? ts[i - 1] : null;
    const t = planoDe(L);
    const yaLoVio = mensajes.some((m) => m.quien === "lead" && m.id < L.mensajes[0].id && dijoQueLoVio(plano(m.texto)));
    const pregunta = (P?.mensajes || []).map((m) => plano(m.texto)).filter((p) => !LO_VE_DESPUES.test(p));
    // Si le sirve, después del video (el turno 2 lo nombra) y sin una oferta en ese mismo tramo (el sí sería a eso).
    const huboVideo = mensajes.some((m) => CUENTA.has(m.quien) && m.id < L.mensajes[0].id && /\bvideo\b/.test(plano(m.texto)));
    const sirve = huboVideo && !pregunta.some((p) => OFERTA.test(p)) && pregunta.some((p) => PREGUNTA_SIRVE.test(p));
    const cuenta = pregunta.some((p) => PREGUNTA_SI_VIO.test(p) || (yaLoVio && QUE_TE_PARECIO.test(p))) || sirve || dijoQueLoVio(t);
    if (!cuenta || !(INTERES.test(t) || (sirve && esSi(textoDe(L)))) || SIN_INTERES.test(t)) continue;
    // Ya sabía cuánto sale: lo que sigue es otro paso, no el 9. El estado lo dice aunque la frase no esté en la base.
    const cuentaDijo = (m) => CUENTA.has(m.quien) && PRECIO_DADO.test(plano(m.texto));
    const precioDespues = mensajes.some((m) => m.id > ultimoLead.id && cuentaDijo(m));
    if (mensajes.some((m) => m.id < L.mensajes[0].id && cuentaDijo(m)) || (e.precio_dicho === true && !precioDespues)) continue;
    const N = ts[i + 1] || null;
    const base = {
      regla: "F2", ancla: String(L.mensajes[0].id), desde: L.mensajes[0].id, desdeEn: hora(L.mensajes[0].creado), dijo: textoDe(L),
      momento: hora(ultimoLead.creado),
    };
    if (!N) {
      if (ahora - hora(ultimoLead.creado) < SIN_RESPUESTA_MS) continue;
      if ((Number(contacto?.respondido_hasta) || 0) < ultimoLead.id) continue; // lo contesta la espera (F5)
      out.push({ ...base, tipo: "nada", siguiente: null, leadDespues: false, pendiente: false, llegoDespues: false });
      continue;
    }
    const precio = N.mensajes.find((m) => PRECIO_DADO.test(plano(m.texto)));
    if (precio) {
      const demora = hora(precio.creado) - hora(ultimoLead.creado);
      if (demora > TARDE_MS) out.push({ ...base, tipo: "tarde", siguiente: textoDe(turnoDe(N)), demora, medida: true });
      continue;
    }
    const turno = turnoDe(N);
    if (ANTES_DEL_PRECIO.test(planoDe(turno))) continue;
    const siguio = loQueSiguio(ts, i + 1, contacto, (x) => PRECIO_DADO.test(planoDe(x)));
    out.push({
      ...base, tipo: "otra_cosa", siguiente: textoDe(turno), pregunta: planoDe(turno).includes("?"),
      deCande: N.mensajes.some((m) => m.quien === "cande"), ...siguio,
    });
  }
  return out;
}

/** La clase de una pregunta de la cuenta (CLASES), o null. */
export function claseDePregunta(texto) {
  const p = plano(texto);
  if (!p.includes("?")) return null;
  return CLASES.find(([, r]) => r.test(p))?.[0] ?? null;
}

/**
 * F3. El agente pregunta algo que ya preguntó la cuenta (la misma clase, con el lead escribiendo en el medio), o "sos
 * dev?" a quien ya dijo que es dev, o si busca a quien ya dijo si busca. Los toques ("Holii...") tienen su regla.
 */
export function preguntaRepetida(mensajes, { ahora }) {
  const preguntas = (mensajes || []).filter((m) => m.quien === "agente" || m.quien === "cande")
    .map((m) => ({ ...m, clase: claseDePregunta(m.texto) })).filter((m) => m.clase);
  const delLead = (mensajes || []).filter((m) => m.quien === "lead");
  const out = [];
  for (const b of preguntas) {
    if (b.quien !== "agente" || ahora - hora(b.creado) > MIRAR_MS || TOQUE.test(plano(b.texto))) continue;
    const base = { regla: "F3", ancla: String(b.id), desde: b.id, pregunta: b.texto, momento: hora(b.creado) };
    const antes = preguntas.find((a) => a.clase === b.clase && a.id < b.id && delLead.some((l) => l.id > a.id && l.id < b.id));
    if (antes) {
      out.push({ ...base, tipo: "repetida", antes: antes.texto });
      continue;
    }
    const dicho = b.clase === "sos_dev" ? DIJO_QUE_ES_DEV : b.clase === "busca" ? DIJO_SI_BUSCA : null;
    const lo = dicho && delLead.find((l) => l.id < b.id && dicho.test(plano(l.texto)));
    if (lo) out.push({ ...base, tipo: "ya_dicho", antes: lo.texto });
  }
  return out;
}

/**
 * F4. Mostró interés y frenó ("lo pienso", "lo guardé", "a fin de mes") en una charla donde la cuenta ya le nombró el
 * formulario, el programa o cuánto sale, y el agente cerró: sin pregunta, con una despedida y sin los 2 pagos, el link,
 * la garantía ni "qué te frena?". Se mira lo que contestó el agente en el momento (turnoDe): lo que escribió Cande horas
 * después en el mismo tramo es otra cosa.
 */
export function cierrePrematuro(mensajes, { ahora }) {
  const ts = tramos(mensajes);
  const out = [];
  for (let i = 0; i + 1 < ts.length; i++) {
    const L = ts[i];
    if (L.tipo !== "lead" || ts[i + 1].mensajes[0].quien !== "agente") continue;
    const N = turnoDe(ts[i + 1]);
    if (ahora - hora(L.mensajes.at(-1).creado) > MIRAR_MS) continue;
    const t = planoDe(L);
    if (!FRENA.test(t) || NO_CORTO.test(t)) continue;
    const nombrado = mensajes.some((m) => CUENTA.has(m.quien) && m.id < N.mensajes[0].id && PROGRAMA_NOMBRADO.test(plano(m.texto)));
    const tn = planoDe(N);
    if (!nombrado || tn.includes("?") || !CIERRE.test(tn) || PASO_MAS.test(tn)) continue;
    out.push({
      regla: "F4", ancla: String(L.mensajes[0].id), desde: L.mensajes[0].id, tipo: "cierre", dijo: textoDe(L), siguiente: textoDe(N),
      momento: hora(L.mensajes.at(-1).creado),
    });
  }
  return out;
}

/**
 * F5 en la base. Una charla del agente con un mensaje del lead sin atender hace más de 15 minutos y ninguna respuesta
 * después (ni una que pudo haber salido, ni un silencio decidido): la Mac apagada, o algo que la espera no tomó.
 */
export function sinAtender(mensajes, { contacto: c, salidas = [], ahora }) {
  if (!c || c.dueno !== "agente" || c.personal === true) return [];
  const abiertos = (mensajes || []).filter((m) => m.quien === "lead" && m.id > (Number(c.respondido_hasta) || 0));
  if (!abiertos.length) return [];
  const primero = abiertos[0];
  const edad = ahora - hora(primero.creado);
  if (edad < SIN_RESPUESTA_MS || edad > MIRAR_MS) return [];
  const algo = salidas.some((s) => String(s.contacto) === String(c.id) && hora(s.creado) >= hora(primero.creado)
    && RESPUESTAS.has(s.estado) && s.accion !== "pasar_a_cande");
  if (algo) return [];
  return [{
    regla: "F5", ancla: `b${primero.id}`, tipo: "base", dijo: abiertos.map((m) => m.texto).join(" / "), edad, momento: hora(primero.creado),
  }];
}

/**
 * F5 por la revisión de la Mac: callar ("| revisión: callado" en el motivo) después de un turno del lead con una
 * pregunta, y nada de la cuenta después. En una charla del agente (si pasó a Cande, lo ve la bandeja: F6).
 */
export function calladoPorLaRevision(mensajes, { contacto: c, salidas = [], ahora }) {
  if (!c || c.dueno !== "agente" || c.personal === true) return [];
  const out = [];
  for (const s of salidas) {
    if (String(s.contacto) !== String(c.id) || s.estado !== "callo" || !CALLADO_POR_LA_REVISION.test(String(s.motivo || ""))) continue;
    if (ahora - hora(s.creado) > MIRAR_MS) continue;
    const antes = (mensajes || []).filter((m) => m.quien === "lead" && hora(m.creado) <= hora(s.creado));
    const ultimo = antes.at(-1);
    if (!ultimo) continue;
    const turno = tramos(mensajes).find((t) => t.tipo === "lead" && t.mensajes.some((m) => m.id === ultimo.id));
    if (!turno?.mensajes.some((m) => String(m.texto || "").includes("?"))) continue;
    if ((mensajes || []).some((m) => CUENTA.has(m.quien) && m.id > ultimo.id)) continue;
    out.push({ regla: "F5", ancla: `r${s.id}`, tipo: "revision", dijo: textoDe(turno), momento: hora(s.creado) });
  }
  return out;
}

/** La charla de la base de un pendiente de la bandeja: por el id de Instagram de la persona o, si no, por su usuario. */
export function contactoDePendiente(p, contactos) {
  const igsid = String(p?.igsid || "");
  const usuario = String(p?.usuario || "").toLowerCase();
  return (igsid && contactos.find((c) => String(c.ig_id || "") === igsid))
    || (usuario && contactos.find((c) => String(c.ig_usuario || "").toLowerCase() === usuario && (!c.ig_id || !igsid || String(c.ig_id) === igsid)))
    || null;
}

const deLaCuenta = (m) => m.quien === "agente" || m.quien === "cande";

/**
 * Si Cande ya contestó esta charla suya: es de ella y hay una prueba después de `desde` (ms). Un mensaje suyo en la base
 * (/textual desde Telegram), lo que salió con una indicación suya (queda como del agente: su salida lo dice), o la nota
 * de la vuelta de Instagram que la vio escribir a mano. Un mensaje del agente no prueba nada (puede ser justo la
 * respuesta que falló), y que la bandeja real no la tenga esperando tampoco: la red la saca también si Cande sigue a
 * la persona o si lo último lo contestó un automático.
 */
export function contestoCande(c, { mensajes = [], salidas = [], desde }) {
  if (c?.dueno !== "cande") return false;
  const deEsta = (x) => String(x.contacto ?? c.id) === String(c.id) && hora(x.creado) > desde;
  return mensajes.some((m) => deEsta(m) && (m.quien === "cande" || (m.quien === "sistema" && ESCRIBIO_A_MANO.test(plano(m.texto)))))
    || salidas.some((s) => deEsta(s) && DE_UNA_INDICACION.test(String(s.detalle || "")));
}

/** Una despedida o un adjunto del lead: después de un cierre de la cuenta no espera respuesta. */
export function despedidaOAdjunto(texto) {
  if (esFoto(texto)) return true;
  const p = plano(texto);
  return DESPEDIDA.test(p) && !p.includes("?");
}

/** El ancla de un pendiente de la bandeja: el id del mensaje de Instagram es largo, va su huella corta. */
const anclaDe = (mid) => {
  let h = 0;
  for (const ch of String(mid || "")) h = (Math.imul(h, 31) + ch.codePointAt(0)) >>> 0;
  return `i${h.toString(36)}${String(mid || "").length}`;
};

/**
 * F5 y F6 según la bandeja real (dm_config "bandeja_estado": lo que la red de la bandeja ve sin respuesta en
 * Instagram). Una charla del agente con un mensaje que no le llegó (o una respuesta que no le llegó al lead): F5. Una
 * charla de Cande con el lead esperando más de 6 horas: F6. Las dos ya salen en el resumen de la bandeja: quedan solo
 * para medir (medida). Sin la charla en la base, nada (el resumen de las notas es por charla). Tampoco si la base ya
 * tiene una respuesta de la cuenta después (la bandeja todavía no la vio), ni si es una despedida o un adjunto después
 * de un cierre de la cuenta (lo último de la cuenta no preguntaba nada). `mensajes`: los de la base (detectar).
 * Devuelve [{ contacto, regla, ancla, ... }].
 */
export function deLaBandeja(pendientes, contactos, { ahora, mensajes = [] }) {
  const out = [];
  for (const p of pendientes || []) {
    const c = contactoDePendiente(p, contactos || []);
    if (!c || c.personal === true || !p.creado) continue;
    const edad = ahora - hora(p.creado);
    if (!(edad >= 0) || edad > MIRAR_MS) continue;
    const suyos = mensajes.filter((m) => String(m.contacto) === String(c.id));
    const cuenta = suyos.filter(deLaCuenta);
    if (cuenta.some((m) => hora(m.creado) > hora(p.creado))) continue;
    const antes = cuenta.filter((m) => hora(m.creado) <= hora(p.creado)).at(-1);
    // Después de lo último de la cuenta en la base: si el lead preguntó algo, o Cande tuvo la charla (lo que escribió a
    // mano no está), no se sabe si fue un cierre.
    const despues = antes ? suyos.filter((m) => m.id > antes.id) : [];
    const sinSaber = despues.some((m) => (m.quien === "lead" && plano(m.texto).includes("?")) || (m.quien === "sistema" && NOTA_DE_CANDE.test(plano(m.texto))));
    if (antes && !plano(antes.texto).includes("?") && !sinSaber && despedidaOAdjunto(p.texto)) continue;
    const base = {
      contacto: String(c.id), ancla: anclaDe(p.mid), dijo: String(p.texto || ""), nota: String(p.nota || ""), edad, momento: hora(p.creado),
      medida: true, porQue: EN_LA_BANDEJA,
    };
    if (c.dueno === "agente" && NO_LE_LLEGO.test(base.nota) && edad >= SIN_RESPUESTA_MS) out.push({ ...base, regla: "F5", tipo: "bandeja" });
    else if (c.dueno === "cande" && edad >= PASE_SIN_RESPUESTA_MS) out.push({ ...base, regla: "F6", tipo: "pase" });
  }
  return out;
}

/** Lo que se le pide al agente para corregir cada una. Son para el modelo: nunca le llegan al lead. */
export function indicacionPara(d) {
  if (d.regla === "F1") {
    return `El lead dijo que sí a lo que le ofreciste en el paso 7 («${corto(d.dijo, 120)}») y no le llegó el turno 2. ` +
      "Mandale ahora el turno 2 del paso 7, entero, sin hacerle otra pregunta antes" +
      (d.tipo === "otra_cosa" ? " (si tu último mensaje fue una pregunta, no la repitas: seguí con el turno 2)." : ".");
  }
  if (d.regla === "F2") {
    return `El lead vio el video y opinó a favor («${corto(d.dijo, 120)}») y no le llegó cuánto sale. Mandale ahora el ` +
      "paso 9 (cuánto sale, y lo de MercadoPago si es de Argentina), sin otra pregunta antes. Si es de Cuba y todavía no " +
      "le preguntaste si puede pagar desde afuera, esa pregunta va primero, sola.";
  }
  return "";
}

/** El renglón de cada falla para el resumen de las notas, sin el prefijo. */
export function queDecir(d, { macViva = true } = {}) {
  const dijo = corto(d.dijo);
  const sig = d.siguiente ? `«${corto(d.siguiente)}»` : "nada";
  switch (d.regla) {
    case "F1":
      if (d.tipo === "tarde") return `dijo que sí al puente («${dijo}») y el turno 2 le llegó ${haceCuanto(d.demora)} después.`;
      return d.tipo === "nada"
        ? `dijo que sí al puente («${dijo}») y no le llegó el turno 2.`
        : `dijo que sí al puente («${dijo}») y lo que le llegó fue ${sig}, sin el turno 2.`;
    case "F2":
      if (d.tipo === "tarde") return `vio el video y opinó a favor («${dijo}») y cuánto sale le llegó ${haceCuanto(d.demora)} después.`;
      return `vio el video y opinó a favor («${dijo}») y no le llegó cuánto sale (le llegó ${sig}).`;
    case "F3":
      return d.tipo === "repetida"
        ? `el agente le volvió a preguntar «${corto(d.pregunta)}» (ya se lo había preguntado: «${corto(d.antes)}»).`
        : `el agente le preguntó «${corto(d.pregunta)}» y ya lo había dicho él: «${corto(d.antes)}».`;
    case "F4":
      return `mostró interés y frenó («${dijo}») y el agente cerró con ${sig}, sin los 2 pagos ni preguntarle qué lo frena.`;
    case "F5":
      if (d.tipo === "revision") return `preguntó «${dijo}» y la revisión de la Mac calló la respuesta: nadie le contestó.`;
      if (d.tipo === "bandeja") return `escribió hace ${haceCuanto(d.edad)} («${dijo}») y sigue sin respuesta: ${d.nota || "no le llegó al agente"}.`;
      return `escribió hace ${haceCuanto(d.edad)} («${dijo}») y nadie le contestó: ${macViva ? "la espera no lo tomó" : "la Mac no está contestando, sigue en espera"}.`;
    case "F6":
      return `es tuya y el lead espera hace ${haceCuanto(d.edad)} («${dijo}»).`;
    default:
      return "";
  }
}

const renglon = (d, extra = "") => `${PREFIJO} ${queDecir(d)}${extra ? ` ${extra}` : ""}`.slice(0, 600);
const motivoDe = (d, extra = "") => `${d.regla} ${REGLAS[d.regla]}: ${d.tipo}${extra ? ` (${extra})` : ""}`.slice(0, 300);

/**
 * Todas las fallas de todas las charlas: [{ contacto, regla, ancla, clave, tipo, ... }], de la más vieja a la más nueva.
 * `bandeja`: si se miran los pendientes de la red de la bandeja (el ajuste "bandeja"). Una charla personal no se mira.
 */
export function detectar({ mensajes = [], contactos = [], salidas = [], pendientes = [] }, { ahora, bandeja = true } = {}) {
  const porCharla = new Map();
  for (const m of mensajes) {
    const k = String(m.contacto);
    if (!porCharla.has(k)) porCharla.set(k, []);
    porCharla.get(k).push(m);
  }
  const contacto = new Map(contactos.map((c) => [String(c.id), c]));
  const out = [];
  for (const [id, lista] of porCharla) {
    const c = contacto.get(id) || null;
    if (c?.personal === true) continue;
    const ms = [...lista].sort((a, b) => a.id - b.id);
    const sal = salidas.filter((s) => String(s.contacto) === id);
    const ctx = { contacto: c, salidas: sal, ahora };
    for (const d of [
      ...puenteSinEntregar(ms, ctx), ...videoSinPrecio(ms, ctx), ...preguntaRepetida(ms, ctx), ...cierrePrematuro(ms, ctx),
      ...sinAtender(ms, ctx), ...calladoPorLaRevision(ms, ctx),
    ]) out.push({ ...d, contacto: id });
  }
  if (bandeja) out.push(...deLaBandeja(pendientes, contactos, { ahora, mensajes }));
  return out.map((d) => ({ ...d, clave: `${d.regla}#${d.ancla}` })).sort((a, b) => a.momento - b.momento);
}

/**
 * Si una F1 o F2 se puede corregir ahora: { si: true }, { no: motivo } (no cambia esperando: va al resumen), o
 * { espera: motivo } (se mira de nuevo en la vuelta siguiente: la Mac, una corrida en marcha, el agente apagado).
 * `yaCorregida`: esta charla ya tuvo una corrección por la misma regla. `otraCorreccion`: ya tuvo una corrección (de
 * cualquier regla) después de esta falla, y el lead no contestó (si hubiera contestado, la falla tendría al lead
 * después): una segunda sería el segundo mensaje seguido sin respuesta.
 */
export function decidirCorreccion(d, {
  contacto: c, mensajes = [], salidas = [], ahora, yaCorregida = false, otraCorreccion = false, modo = "auto", macViva = true,
}) {
  if (!c) return { no: "no encuentro la charla" };
  if (c.dueno !== "agente") return { no: "la charla es tuya" };
  // La tuvo Cande después de la falla (la sacó la vuelta de Instagram, se la pasó el agente, o la devolvió con /agente):
  // lo que escribió a mano en ese rato no está en la base, y pudo haberle mandado ya lo que falta.
  if (hora(c.dueno_desde) > d.momento) return { no: "pasó por vos después" };
  if (yaCorregida) return { no: "ya corregí esta charla una vez por lo mismo" };
  if (otraCorreccion) return { no: "ya le mandé otra corrección después y no contestó" };
  const conCande = (m) => m.quien === "cande" || (m.quien === "sistema" && NOTA_DE_CANDE.test(plano(m.texto)));
  if (d.deCande || mensajes.some((m) => m.id > d.desde && conCande(m))) return { no: "le escribiste vos" };
  // Lo que salió con una indicación suya desde Telegram queda como del agente, pero lo decidió ella.
  const desdeEn = Number.isFinite(d.desdeEn) ? d.desdeEn : d.momento;
  if (salidas.some((s) => String(s.contacto) === String(c.id) && DE_UNA_INDICACION.test(String(s.detalle || "")) && hora(s.creado) >= desdeEn)) {
    return { no: "le diste una indicación desde Telegram" };
  }
  const ultimo = hora(c.ultimo_lead);
  if (!(ahora - ultimo < VENTANA_CORREGIR_MS)) return { no: "pasó el día: el agente ya no le puede escribir" };
  if (d.llegoDespues) return { no: "le llegó más tarde" };
  if (d.leadDespues) return d.pendiente ? { espera: "el agente todavía no contestó lo último" } : { no: "el lead escribió después" };
  const lead = senales(mensajes.filter((m) => m.quien === "lead").map((m) => m.texto));
  if (lead.crisis) return { no: "contó una crisis" };
  if (lead.baja) return { no: "pidió que no le escriban" };
  if (lead.pagos) return { no: "habló de un pago o de un acceso" };
  if (lead.empresa || lead.contrataDevs) return { no: "dio una señal de empresa" };
  if (senales([d.dijo]).dijoQueNo) return { no: "dijo que no" };
  const quien = c.estado?.quien || "no_se_sabe";
  if (esEmpresa(quien)) return { no: "construye algo o contrata" };
  if (d.regla === "F1" && !["dev", "estudia", "no_se_sabe"].includes(quien)) return { no: "no es dev" };
  if (d.regla === "F2" && lead.sinPlata) return { no: "dijo que le falta plata o que tiene apuro" };
  // El freno 13: en el turno en que contó que lo echaron no se dice cuánto sale.
  if (d.regla === "F2" && senales([d.dijo]).sinTrabajo) return { no: "contó que se quedó sin trabajo" };
  // Otra pregunta del agente (la de Cuba o la de si le sirve con otras palabras, o una de más) no se pisa con el precio.
  if (d.regla === "F2" && d.tipo === "otra_cosa" && d.pregunta) return { no: "el agente le hizo otra pregunta y no se la piso" };
  if (modo !== "auto") return { espera: "el agente no está en automático" };
  if (!macViva) return { espera: "la Mac no está contestando" };
  if (c.tomada === true) return { espera: "la está contestando otra corrida" };
  const abierto = mensajes.some((m) => m.quien === "lead" && m.id > (Number(c.respondido_hasta) || 0));
  if (abierto) return { espera: "hay un mensaje del lead sin atender" };
  const porSalir = salidas.some((s) => String(s.contacto) === String(c.id)
    && (s.estado === "pendiente" || (s.estado === "enviando" && ahora - hora(s.creado) < CORRIGIENDO_VENCE_MS)));
  if (porSalir) return { espera: "hay una respuesta por salir" };
  return { si: true };
}

/**
 * Lo que devuelve el agente cuando no llegó a pasar nada: otra corrida tenía la charla (el cron de los toques, la
 * espera) o se apagó. No le salió nada al lead: la corrección no se gasta y se vuelve a mirar en la vuelta siguiente.
 */
const SIN_PASAR_NADA = new Set(["otra corrida lo tiene", "apagado"]);

/** Si el turno que pidió el controlador salió (como lo cuenta lib/dm/respuestas.js con una indicación de Cande). */
const salio = (r) => r?.hecho === "enviada" || r?.hecho === "enviada sin guardar" || (r?.mando > 0 && r?.hecho !== "envío incierto");

/** Por qué no salió la corrección, dicho para Cande (lo de siempre está en respuestas.porQueNoSalio). */
export function porQueNoCorregi(r) {
  const h = r?.hecho || "";
  if (h === "de Cande por Instagram") return r.motivo || "estás vos en la charla";
  if (h === "envío incierto") return "ManyChat tardó y no sé si le llegó, fijate en Instagram";
  if (h === "hay un mensaje del lead sin atender" || /otro mensaje/.test(h)) return "el lead escribió justo: le contesta el agente";
  if (h === "no es del agente") return "la charla ya es tuya";
  return porQueNoSalio(r);
}

/**
 * Arma la vuelta del controlador. Dependencias por parámetro, para probarla con dobles:
 *   base     ajustes, reclamarControl, soltarControl, datosParaControl, guardarControl, marcarControl, borrarControl
 *            (lib/dm/base.js)
 *   agente   el de lib/dm/armado.js: la corrección es agente.procesar(id, null, { evento: "control", indicacion })
 *   macViva  si la Mac está contestando (sin ella no se corrige: queda para la vuelta siguiente)
 * Devuelve controlar({ hasta }): pasada la hora `hasta` (ms) no arranca otra corrección. Devuelve solo cantidades:
 * { hecho, fallas (las nuevas de esta vuelta, por regla), corregidas, sin_corregir, al_resumen, medidas, resueltas,
 * esperan (las que se pueden corregir pero no ahora: se miran de nuevo en la vuelta siguiente) }.
 */
export function crearControlador({ base, agente = null, reloj = () => new Date(), macViva = async () => false }) {
  return async function controlar({ hasta = Infinity, ahoraMs = () => Date.now() } = {}) {
    const r = { hecho: "", fallas: {}, corregidas: 0, sin_corregir: 0, al_resumen: 0, medidas: 0, resueltas: 0, esperan: 0 };
    const aj = await base.ajustes();
    if (aj.controlador === false) return { ...r, hecho: "apagado" };
    const marca = randomUUID();
    if (!(await base.reclamarControl(marca))) return { ...r, hecho: "otra vuelta lo tiene" };
    try {
      const ahora = reloj().getTime();
      const datos = await base.datosParaControl(MIRAR_HORAS);
      const conBandeja = aj.bandeja !== false;
      const fallas = detectar(datos, { ahora, bandeja: conBandeja });
      const contactos = new Map(datos.contactos.map((c) => [String(c.id), c]));
      const mensajesDe = (id) => datos.mensajes.filter((m) => String(m.contacto) === id).sort((a, b) => a.id - b.id);
      const reglaDe = (x) => String(x.detalle || "").split("#")[0];
      const anotadas = new Set(datos.controles.map((x) => `${x.contacto}|${x.detalle}`));
      const intentadas = new Set(datos.controles.filter((x) => INTENTADAS.has(x.estado)).map((x) => `${x.contacto}|${reglaDe(x)}`));
      let viva = null;
      const laMacContesta = async () => {
        if (viva === null) {
          try {
            viva = (await macViva(aj)) === true;
          } catch {
            viva = false;
          }
        }
        return viva;
      };
      /** Deja anotada una falla nueva. Devuelve su id, o null si ya estaba. */
      const anotar = async (d, estado, { aviso = null, extra = "" } = {}) => {
        const id = await base.guardarControl({ contacto: d.contacto, clave: d.clave, estado, aviso, motivo: motivoDe(d, extra) });
        if (id) r.fallas[d.regla] = (r.fallas[d.regla] || 0) + 1;
        return id;
      };

      // 1. Una corrección que quedó a medias (la función murió en el medio): no se sabe si salió. Al resumen.
      for (const x of datos.controles) {
        if (x.estado !== ESTADOS.corrigiendo || ahora - hora(x.creado) < CORRIGIENDO_VENCE_MS) continue;
        await base.marcarControl(x.id, {
          estado: ESTADOS.sinCorregir,
          aviso: `${PREFIJO} encontré una falla (${REGLAS[reglaDe(x)] || reglaDe(x)}) y la corrección quedó a medias: mirá la charla, no sé si le llegó.`,
        });
        r.sin_corregir++;
      }

      // 2. Lo que ya tuvo respuesta: su renglón sale del resumen. Las F5 que ya no están (las de la bandeja, solo si se
      // miró), y las F1, F2 y F4 de una charla de Cande con su respuesta en la base.
      const vigentes = new Set(fallas.map((d) => `${d.contacto}|${d.clave}`));
      const yaContesto = (id, desde) =>
        contestoCande(contactos.get(String(id)), { mensajes: mensajesDe(String(id)), salidas: datos.salidas, desde });
      for (const x of datos.controles) {
        if (x.estado !== ESTADOS.alResumen && x.estado !== ESTADOS.sinCorregir) continue;
        const regla = reglaDe(x);
        const yaNoEsta = x.estado === ESTADOS.alResumen && SE_RESUELVEN.has(regla) && !vigentes.has(`${x.contacto}|${x.detalle}`)
          && (conBandeja || !String(x.detalle || "").includes("#i"));
        if (!yaNoEsta && !(LAS_VE_CANDE.has(regla) && yaContesto(x.contacto, hora(x.creado)))) continue;
        await base.marcarControl(x.id, { estado: ESTADOS.resuelta, aviso: null });
        r.resueltas++;
      }

      // 3. Una corrección que salió pero no trajo lo que faltaba (el agente escribió otra cosa): sigue la misma falla, con la
      // corrección ya en la charla. No se corrige de nuevo: al resumen.
      const ahoraVistas = new Map(fallas.map((d) => [`${d.contacto}|${d.clave}`, d]));
      for (const x of datos.controles) {
        const d = x.estado === ESTADOS.corregida ? ahoraVistas.get(`${x.contacto}|${x.detalle}`) : null;
        if (!d || d.medida || d.llegoDespues) continue;
        await base.marcarControl(x.id, {
          estado: ESTADOS.sinCorregir, aviso: renglon(d, "Le pedí al agente que lo corrigiera y lo que salió tampoco lo trae."),
          motivo: motivoDe(d, "corregida sin lo que faltaba"),
        });
        r.sin_corregir++;
      }

      // 4. Lo nuevo: se anota, y lo que se puede corregir se junta para el paso 5.
      // Una corrección (de cualquier regla) en esa charla después de esta falla: el lead no contestó desde entonces.
      const corregidaDespues = (d) => datos.controles.some((x) =>
        String(x.contacto) === d.contacto && INTENTADAS.has(x.estado) && hora(x.creado) > d.momento);
      const aCorregir = [];
      for (const d of fallas) {
        if (anotadas.has(`${d.contacto}|${d.clave}`)) continue;
        const c = contactos.get(d.contacto) || null;
        // Llegó tarde, se arregló sola después, ya sale en el resumen de la bandeja, o es una charla de Cande con su
        // respuesta en la base: solo para medir.
        const contesto = LAS_VE_CANDE.has(d.regla) && yaContesto(d.contacto, d.momento);
        if (d.medida || d.llegoDespues || contesto) {
          const extra = d.tipo === "tarde" ? `llegó ${haceCuanto(d.demora)} después` : d.porQue || (d.llegoDespues ? "le llegó más tarde" : "ya la contestaste vos");
          if (await anotar(d, ESTADOS.medida, { extra })) r.medidas++;
          continue;
        }
        // Una charla de Cande sin prueba de que contestó: va igual, por si no lo hizo.
        const siYa = c?.dueno === "cande" && LAS_VE_CANDE.has(d.regla) ? ` ${SI_YA_CONTESTASTE}` : "";
        if (SE_CORRIGEN.has(d.regla)) {
          const dec = decidirCorreccion(d, {
            contacto: c, mensajes: mensajesDe(d.contacto), salidas: datos.salidas, ahora,
            yaCorregida: intentadas.has(`${d.contacto}|${d.regla}`), otraCorreccion: corregidaDespues(d), modo: aj.modo,
            macViva: await laMacContesta(),
          });
          if (dec.espera) r.esperan++;
          else if (dec.si) aCorregir.push(d);
          else if (await anotar(d, ESTADOS.alResumen, { aviso: renglon(d, `No la corregí: ${dec.no}.${siYa}`), extra: dec.no })) r.al_resumen++;
          continue;
        }
        const aviso = d.regla === "F5" && d.tipo === "base" ? `${PREFIJO} ${queDecir(d, { macViva: await laMacContesta() })}` : renglon(d, siYa.trim());
        if (await anotar(d, ESTADOS.alResumen, { aviso })) r.al_resumen++;
      }

      // 5. Las correcciones: de a una, con su constancia antes (una sola vez por charla y regla, y una sola por charla en
      // cada vuelta). Las que no entran en esta vuelta (tope, tiempo, otra corrección en la misma charla) no quedan
      // anotadas: se vuelven a mirar en la siguiente, con la charla ya actualizada.
      let hechas = 0;
      const enEstaVuelta = new Set();
      for (const [k, d] of aCorregir.entries()) {
        if (hechas >= CORRECCIONES_POR_VUELTA || ahoraMs() >= hasta || !agente) {
          r.esperan += aCorregir.length - k;
          break;
        }
        // Dos fallas en una charla (el sí al puente y el video, en el mismo turno): una corrección por vuelta. La otra se
        // decide en la vuelta siguiente: si el lead no contestó la primera, ya no sale (otraCorreccion).
        if (enEstaVuelta.has(d.contacto)) {
          r.esperan++;
          continue;
        }
        // Dos fallas de la misma regla en una charla, en la misma vuelta: la segunda ya no se corrige.
        if (intentadas.has(`${d.contacto}|${d.regla}`)) {
          const no = "ya corregí esta charla una vez por lo mismo";
          if (await anotar(d, ESTADOS.alResumen, { aviso: renglon(d, `No la corregí: ${no}.`), extra: no })) r.al_resumen++;
          continue;
        }
        const id = await anotar(d, ESTADOS.corrigiendo);
        if (!id) continue;
        intentadas.add(`${d.contacto}|${d.regla}`);
        enEstaVuelta.add(d.contacto);
        hechas++;
        let res;
        try {
          res = await agente.procesar(d.contacto, null, { evento: "control", indicacion: indicacionPara(d) });
        } catch (e) {
          res = { hecho: "error", error: e.message };
        }
        if (salio(res)) {
          await base.marcarControl(id, { estado: ESTADOS.corregida, aviso: null, motivo: motivoDe(d, "corregida") });
          r.corregidas++;
          continue;
        }
        if (SIN_PASAR_NADA.has(res?.hecho)) {
          await base.borrarControl(id);
          if (!--r.fallas[d.regla]) delete r.fallas[d.regla];
          intentadas.delete(`${d.contacto}|${d.regla}`);
          r.esperan++;
          continue;
        }
        await base.marcarControl(id, {
          estado: ESTADOS.sinCorregir, aviso: renglon(d, `No la pude corregir: ${porQueNoCorregi(res)}.`),
          motivo: motivoDe(d, `sin corregir: ${res?.hecho || "?"}`),
        });
        r.sin_corregir++;
      }
      return { ...r, hecho: "listo" };
    } finally {
      try {
        await base.soltarControl(marca);
      } catch {
        // se libera sola a los 6 minutos
      }
    }
  };
}
