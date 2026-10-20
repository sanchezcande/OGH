// El controlador del agente de DM (20/10). Cande: "dijimos que íbamos a poner un controlador o algo para que estas
// cosas no pasen más", después de abrir una charla donde el lead aceptó lo que le ofreció el agente y lo que le llegó
// fue otra pregunta en vez de lo prometido.
//
// Son reglas fijas, sin modelo: no dependen de que un LLM se dé cuenta (el repaso de la Mac, tracker/dm_repaso.py, es
// un modelo y no lo vio). Miran las charlas de las últimas 72 horas y encuentran fallas del recorrido:
//
//   F1  oferta aceptada sin entregar: el agente le ofreció contarle cómo lo puede ayudar (o la lista), el lead dijo que
//       sí y lo que siguió no trae el formulario ni lo que tenía que seguir (nada, otra cosa, o llegó más de una hora
//       tarde).
//   F2  vio el video con interés (o dijo que sí cuando se le preguntó si le sirve) y no le llegó cuánto sale. Solo si
//       es dev, busca trabajo, ya contó qué le cuesta y todavía no sabía cuánto sale: sin eso, no venderle es lo que
//       corresponde.
//   F3  pregunta repetida: una pregunta de la misma clase que ya hizo la cuenta, o que el lead ya había contestado.
//   F4  cierre prematuro: mostró interés y frenó y el agente cerró sin dar un paso más.
//   F5  lead sin respuesta: un mensaje sin atender hace más de 15 minutos, uno que no le llegó al agente (la red de la
//       bandeja), o una respuesta que la revisión de la Mac calló ante una pregunta.
//   F6  pase a Cande sin respuesta: según la bandeja real (lo que Cande escribe a mano no queda en la base), una charla
//       suya donde el lead espera hace más de 6 horas.
//
// Cómo reconoce F1 a F4 (la oferta, lo que tiene que seguir, las preguntas por clase, los cierres) sale de cómo escribe
// el agente, y eso vive en su prompt, que es privado. Este repo es público: esos patrones no están acá. Viven en la base
// (dm_config "controlador_patrones", los sube tracker/dm_nube.py controlador_patrones) y se leen en cada vuelta. Sin
// ellos, F1 a F4 no marcan nada ni se corrigen (F5 y F6 siguen), y la vuelta lo dice (sin_patrones).
//
// Qué hace con cada una:
//   - F1 y F2 se corrigen solas si es seguro: la charla es del agente y no pasó por Cande después de la falla (si ella
//     la tuvo y la devolvió, lo que escribió a mano en ese rato no está en la base: pudo haberle mandado ya lo que
//     falta), el lead no escribió después, la cuenta tampoco (ni Cande en la base, con una indicación desde Telegram o
//     a mano en Instagram, ni un seguimiento, ni un automático, ni un borrador que ella pudo haber mandado a mano: lo de
//     Instagram lo mira el agente al corregir, como en cualquier turno), la falla es de después de que arrancó el
//     controlador, la ventana sigue abierta (23 h), no hay una respuesta por salir, la Mac contesta y tiene un lugar
//     libre de los de la espera, esa charla no se corrigió antes por la misma regla (una sola vez por charla y regla) ni
//     recibió otra corrección después de la falla, y es una sola corrección por charla en cada vuelta (dos mensajes
//     seguidos sin que el lead conteste, nunca). Una corrección que sale más de una hora después de lo que dijo el lead
//     respeta el horario de los seguimientos (lib/dm/frenos.js, horaDeToques): de noche espera. Una F2 se corrige solo
//     si después el agente calló o escribió algo sin pregunta: si le hizo otra pregunta (puede ser una de las que van
//     antes del monto), no se la pisa y va al resumen. La corrección es un turno del agente con la indicación del
//     controlador (evento "control" de lib/dm/agente.js): pasa por todos los frenos (los del último turno del lead
//     también) y por la revisión de la Mac, como siempre, y no sale si la charla cambió desde que el controlador la
//     miró. Si no sale (se frena, calla), no se reintenta: va al resumen. Si no llegó a pasar nada (otra corrida tenía
//     la charla, la charla cambió, el modelo no contestó a tiempo), se decide de nuevo en la vuelta siguiente, con la
//     charla al día. Si sale pero no trae lo que faltaba (la vuelta siguiente encuentra la misma falla), va al resumen.
//   - Lo demás (F3, F4, F5 de la base y de la revisión de la Mac, y lo que no se pudo corregir) va al resumen de las
//     notas (lib/dm/resumen.js), sin sonido, como un renglón "Controlador: ..." de esa charla, una vez por charla y
//     falla. Un renglón que se pone después (una corrección que salió mal) entra en el resumen siguiente.
//   - F5 de la bandeja y F6 ya salen en el resumen de la bandeja ("DM: charlas que esperan respuesta tuya"): quedan
//     solo para medir, sin repetirlas. Tampoco cuentan si la base ya tiene una respuesta de la cuenta, ni una
//     despedida o un adjunto del lead después de un cierre de la cuenta.
//   - Una F1 o F2 que llegó tarde (o se arregló sola después) queda solo para medir. También una F1, F2 o F4 en una
//     charla de Cande con una prueba de que ella contestó: un mensaje de la cuenta en la base después de la falla, o
//     algo que salió con una indicación suya. Sin esa prueba va al resumen con "si ya le contestaste, ignoralo": que la
//     bandeja no la tenga esperando no prueba nada (la saca también si Cande sigue a la persona o si le contestó un
//     automático).
//   - F5 se "resuelve": si en una vuelta siguiente ya no está (le contestaron), su renglón sale del resumen. Lo mismo
//     una F1, F2 o F4 de una charla de Cande cuando aparece su respuesta en la base.
//
// Cada falla queda en dm_salidas (accion "control", detalle "F1#<ancla>", estado: ESTADOS) para poder medir. No cuenta
// como respuesta para nada: ni para la red de la bandeja, ni para la espera, ni para el tope del día, ni para el estado
// del agente (lib/dm/base.js las deja afuera por accion y por estado).
//
// Lo corre el cron /api/dm/controlador cada 10 minutos, con el ajuste "controlador" (prendido de fábrica). Las reglas
// son funciones puras, para probarlas sin base (tests/dmControlador.test.mjs, con patrones inventados).
import { randomUUID } from "node:crypto";
import { DETALLE_INDICACION, MIRAR_DE_NUEVO, enOrdenDeEscritura, esFoto } from "./agente";
import { haceCuanto } from "./bandeja";
import { esEmpresa, horaDeToques, plano, senales } from "./frenos";
import { porQueNoSalio } from "./respuestas";
import { ESPERA_EN_PARALELO } from "./seguimientos";

const MIN = 60000;
const HORA = 60 * MIN;

/** Las reglas, como le llegan a Cande y quedan en la base. */
export const REGLAS = {
  F1: "oferta aceptada sin entregar",
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
/**
 * Lo que tenía que seguir y llega más de esto después de lo que dijo el lead llegó tarde. Una corrección que saldría
 * más de esto después respeta el horario de los seguimientos.
 */
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

/* ---------- los patrones privados ---------- */

/** Dónde viven en dm_config los patrones del controlador (los sube tracker/dm_nube.py controlador_patrones). */
export const CLAVE_PATRONES = "controlador_patrones";
/**
 * Los patrones que tiene que traer, cada uno una expresión regular sobre el texto en plano (frenos.plano: sin tildes ni
 * mayúsculas, con los espacios juntados). Todos o ninguno: con uno que falta o que no compila no se usa ninguno.
 *   oferta            el mensaje de la cuenta que le ofrece contarle cómo lo puede ayudar, o pasarle la lista (F1)
 *   entrega           lo que trae el mensaje que tiene que seguir a un sí a la oferta, además del link del formulario
 *   pregunta_si_vio   la cuenta le pregunta si vio el video (F2)
 *   pide_opinion      la cuenta le pide su opinión (cuenta solo a quien ya dijo que lo vio)
 *   lo_ve_despues     lo que le dice la cuenta a quien todavía no lo vio: esas preguntas no cuentan
 *   pregunta_sirve    la cuenta le pregunta si le sirve: después del video, un sí ahí también cuenta
 *   antes_del_precio  las preguntas que van antes del monto: hacerlas no es una falla
 *   programa          el programa nombrado (además del link del formulario y del precio): F4 pide que ya se haya dicho
 *   frena             el lead dice que le interesa pero lo deja para después (F4)
 *   cierre            la cuenta cierra la charla
 *   paso_mas          la cuenta da un paso más (además del precio y el link)
 *   toque             un seguimiento de la cuenta: tiene su regla, no es una pregunta repetida (F3)
 * Y "clases": [[nombre, patrón], ...], las preguntas de la cuenta por clase, en orden (la primera que coincide). Las
 * clases "sos_dev" y "busca" además se cruzan con lo que ya contó el lead.
 */
export const PATRONES = [
  "oferta", "entrega", "pregunta_si_vio", "pide_opinion", "lo_ve_despues", "pregunta_sirve", "antes_del_precio",
  "programa", "frena", "cierre", "paso_mas", "toque",
];
const TOPE_PATRON = 2000;
const TOPE_CLASES = 40;

const compilar = (s) => {
  if (typeof s !== "string" || !s.trim() || s.length > TOPE_PATRON) return null;
  try {
    const r = new RegExp(s);
    // Uno que coincide con un texto vacío coincide con cualquier cosa: marcaría todo.
    return r.test("") ? null : r;
  } catch {
    return null;
  }
};

/**
 * Revisa los patrones antes de guardarlos (la acción "controlador_patrones" de /api/dm/config) y al leerlos: cada uno
 * tiene que compilar y no coincidir con un texto vacío. Devuelve { ok: true, patrones (lo que se guarda), compilados }
 * o { ok: false, error }. El error nombra la clave, nunca el patrón.
 */
export function validarPatrones(json) {
  if (!json || typeof json !== "object" || Array.isArray(json)) return { ok: false, error: "patrones: un objeto" };
  const patrones = {};
  const compilados = {};
  for (const k of PATRONES) {
    const r = compilar(json[k]);
    if (!r) return { ok: false, error: `${k}: falta, está vacío o no compila` };
    patrones[k] = json[k];
    compilados[k] = r;
  }
  const clases = json.clases;
  if (!Array.isArray(clases) || !clases.length || clases.length > TOPE_CLASES) return { ok: false, error: `clases: una lista de 1 a ${TOPE_CLASES} pares [nombre, patrón]` };
  patrones.clases = [];
  compilados.clases = [];
  for (const par of clases) {
    const r = Array.isArray(par) && par.length === 2 && /^[a-z_]{1,30}$/.test(String(par[0])) ? compilar(par[1]) : null;
    if (!r) return { ok: false, error: `clases: ${Array.isArray(par) ? String(par[0]).slice(0, 30) : "?"}: el nombre en minúsculas y un patrón que compile` };
    patrones.clases.push([par[0], par[1]]);
    compilados.clases.push([par[0], r]);
  }
  return { ok: true, patrones, compilados };
}

/** Los patrones listos para usar, o null si no están cargados o no sirven (entonces F1 a F4 no marcan nada). */
export function compilarPatrones(json) {
  const v = validarPatrones(json);
  return v.ok ? v.compilados : null;
}

// Lo que no sale del prompt y queda acá: lo que escribe el lead y los datos públicos (el link del formulario, el precio,
// los links de pago).
const SI = /^[^a-z0-9]*(si+|sip|dale+|ok+|okey|okay|bueno+|claro|obvio|contame|cuentame|comentame|dime|decime|por (supuesto|favor)|porfa|seguro|me encantaria|me interesa|sin problema|a ver|de una|vale)(?![a-z0-9])|como quieras|me interesa|cuentame|contame|pasamela|me encantaria|me ayudarias|escucho|tips|consejos|👍|👌/u;
const NO = /^[^a-z0-9]*no(?![a-z0-9])|no,? (muchas )?gracias|no me interesa|por ahora no|no por (ahora|el momento)/;
const LINK_FORMULARIO = /opengatehub\.com\/devs/;
const VIO_VIDEO = /\bvi el video\b|\bya lo vi\b|\blo acabo de ver\b|\b(listo|si+),? lo vi\b/;
const NO_LO_VIO = /no lo vi|todavia no|aun no/;
// "útil" entera: "inútil" no es interés.
const INTERES = /me gust|me encant|me sirv|muy buen|esta (muy )?buen|buenisimo|interesante|excelente|genial|\butil\b|perfecto|buen precio|me interes|me convenci|vale la pena|copado/;
// Sin interés todavía: no le gustó, o lo va a ver después (lo mira en un rato).
const SIN_INTERES = /no me (gust|sirv|convenc|interes)|no lo vi|todavia no|aun no|ahora lo (veo|miro)|lo (veo|miro) (despues|mas tarde|luego|en un rato|ahora)|(despues|luego|mas tarde) lo (veo|miro)|cuando pueda|en un rato/;
const PRECIO_DADO = /27 dolares|13[,.]50|2 pagos|link de pago|get\.opengatehub|gumroad|pagar-pesos/;
const PRECIO_O_LINK = /27|13[,.]50|2 pagos|link/;
const PROGRAMA_PUBLICO = /opengatehub\.com\/devs|27 dolares/;
const NO_CORTO = /^[^a-z0-9]*no(?![a-z0-9])|no me interesa|no,? (muchas )?gracias/;
const DIJO_QUE_ES_DEV = /\bsoy (dev|developer|desarrollador|programador|full ?stack|frontend|backend|ingenier[oa] (en sistemas|informatic[oa]|de software))/;
const DIJO_SI_BUSCA = /(estoy|ando) buscando (trabajo|laburo|empleo)|\bbusco (trabajo|laburo|empleo)|en busqueda (laboral|activa)|no estoy buscando|tengo trabajo|estoy tranqui|todo tranqui/;
const CALLADO_POR_LA_REVISION = /\|\s*revisi[oó]n:\s*callado/i;
const NO_LE_LLEGO = /no le lleg[oó]/i;
// Las notas que dejan la vuelta de Instagram (instagram.sacar) y la devolución desde Telegram (respuestas.js): Cande
// tuvo la charla. Lo que escribió a mano en ese rato no queda en la base.
const NOTA_DE_CANDE = /^(la charla quedo de cande|cande llevo esta charla)/;
// La de la vuelta de Instagram cuando la vio escribir a mano (instagram.porQueSale: "le escribiste vos").
const ESCRIBIO_A_MANO = /^la charla quedo de cande: le escribiste vos/;
// Un turno con una indicación de Cande desde Telegram (lib/dm/agente.js): queda como del agente en la charla, pero lo
// decidió ella. Esta marca la llevan también la que no salió (error) y la que el agente prefirió no escribir.
const DE_UNA_INDICACION = /^indicaci[oó]n/i;
// Lo que salió (o pudo salir) de una indicación suya: la marca exacta y un estado de envío.
const ENTREGADAS = new Set(["enviando", "enviada", "incierta"]);
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
 * Los mensajes de una charla en el orden en que se escribieron, como los lee el agente (enOrdenDeEscritura: por la hora
 * y, a la misma hora, por el orden en la base). Lo que Cande escribió a mano en una charla retomada se anota cuando se
 * ve, con la hora de Instagram: si el lead le contestó antes de que se viera, por el orden de la base quedaba después de
 * esa respuesta y armaba tramos que no existen (un sí viejo pegado a lo nuevo del lead, revisión del 21/10). Lo que
 * mira qué está contestado sigue con los ids.
 */
const enOrden = (lista) => enOrdenDeEscritura([...lista].sort((a, b) => a.id - b.id));
/** El id más alto de la charla (lo último que se anotó en la base), o null: hasta dónde miró el controlador. */
const ultimoId = (ms) => (ms.length ? Math.max(...ms.map((m) => m.id)) : null);

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
 * La oferta (patrón "oferta") en un tramo de la cuenta: el último mensaje del agente que la hace (o de Cande, en una
 * charla del agente: un /textual suyo, y el sí lo contesta el agente), si después no preguntó otra cosa en ese mismo
 * tramo (el sí podría ser a eso). null si no hay.
 */
function ofertaEn(t, P, { delAgente = false } = {}) {
  let oferta = null;
  for (const m of t.mensajes) {
    const p = plano(m.texto);
    if ((m.quien === "agente" || (delAgente && m.quien === "cande")) && P.oferta.test(p)) oferta = m;
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

/** Si un mensaje trae lo que tiene que seguir a un sí a la oferta: el link del formulario o el patrón "entrega". */
const entregaEn = (texto, P) => LINK_FORMULARIO.test(texto) || P.entrega.test(texto);

/**
 * F1. La oferta aceptada sin lo que tenía que seguir. Por cada oferta del agente seguida de un sí del lead, mira el
 * tramo de la cuenta que siguió:
 *   nada       no salió nada en 15 minutos y el turno ya está cerrado (si está abierto, lo contesta la espera: es F5);
 *   otra_cosa  salió algo sin el formulario ni lo que tenía que seguir;
 *   tarde      lo que tenía que seguir llegó más de una hora después del sí (lo mandó tarde el agente o lo mandó Cande).
 * Lo que se le dice a Cande que le llegó es lo que contestó la cuenta en el momento (turnoDe). `cuentaDespues`: en ese
 * tramo la cuenta escribió algo más después de eso (un seguimiento, un automático): el lead ya tiene dos mensajes sin
 * contestar. Sin patrones no marca nada.
 * Devuelve [{ regla, ancla (el id de la oferta), tipo, dijo, siguiente, desde (el id de la oferta), desdeEn (su hora),
 * momento (la hora del sí), ... }].
 */
export function puenteSinEntregar(mensajes, { contacto = null, ahora, patrones: P = null }) {
  if (!P) return [];
  const ts = tramos(mensajes);
  const delAgente = contacto?.dueno === "agente";
  const out = [];
  for (let i = 0; i + 1 < ts.length; i++) {
    if (ts[i].tipo !== "cuenta") continue;
    const oferta = ofertaEn(ts[i], P, { delAgente });
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
      out.push({ ...base, tipo: "nada", siguiente: null, leadDespues: false, pendiente: false, llegoDespues: false, cuentaDespues: false });
      continue;
    }
    const entrega = sig.mensajes.find((m) => entregaEn(plano(m.texto), P));
    if (entrega) {
      const demora = hora(entrega.creado) - hora(ultimoLead.creado);
      if (demora > TARDE_MS) out.push({ ...base, tipo: "tarde", siguiente: textoDe(turnoDe(sig)), demora, medida: true });
      continue;
    }
    const turno = turnoDe(sig);
    const siguio = loQueSiguio(ts, i + 2, contacto, (x) => entregaEn(planoDe(x), P));
    out.push({
      ...base, tipo: "otra_cosa", siguiente: textoDe(turno), deCande: sig.mensajes.some((m) => m.quien === "cande"),
      cuentaDespues: sig.mensajes.length > turno.mensajes.length, ...siguio,
    });
  }
  return out;
}

/** Si el lead dice que vio el video (y no que no lo vio). */
const dijoQueLoVio = (p) => VIO_VIDEO.test(p) && !NO_LO_VIO.test(p);

/**
 * F2. Vio el video, opinó a favor y no le llegó cuánto sale. El turno del lead cuenta si la cuenta le había preguntado
 * si lo vio (o su opinión, a quien ya dijo que lo vio), si él dice que lo vio, o si contesta que sí cuando se le
 * preguntó si le sirve (ahí un sí simple alcanza). Solo si el estado del modelo dice que es dev, que busca trabajo y
 * cuál es su dolor: sin eso no corresponde venderle, y no venderle no es una falla. Tampoco es falla si ya sabía cuánto sale (se
 * le dijo antes, o el estado dice que se le dijo), ni si lo que siguió es una pregunta de las que van antes del monto.
 * `pregunta`: lo que contestó la cuenta en el momento es otra pregunta (esa no se pisa con una corrección).
 * `cuentaDespues`: como en F1. Sin patrones no marca nada.
 */
export function videoSinPrecio(mensajes, { contacto = null, ahora, patrones: P = null }) {
  if (!P) return [];
  const e = contacto?.estado || {};
  if (!esDev(e.quien) || e.busca !== "si" || !String(e.dolor || "").trim()) return [];
  const ts = tramos(mensajes);
  const out = [];
  for (let i = 0; i < ts.length; i++) {
    const L = ts[i];
    if (L.tipo !== "lead") continue;
    const ultimoLead = L.mensajes.at(-1);
    if (ahora - hora(ultimoLead.creado) > MIRAR_MS) continue;
    const prev = i > 0 ? ts[i - 1] : null;
    const t = planoDe(L);
    const yaLoVio = mensajes.some((m) => m.quien === "lead" && m.id < L.mensajes[0].id && dijoQueLoVio(plano(m.texto)));
    const pregunta = (prev?.mensajes || []).map((m) => plano(m.texto)).filter((p) => !P.lo_ve_despues.test(p));
    // Si le sirve, después del video (lo nombró la cuenta) y sin una oferta en ese mismo tramo (el sí sería a eso).
    const huboVideo = mensajes.some((m) => CUENTA.has(m.quien) && m.id < L.mensajes[0].id && /\bvideo\b/.test(plano(m.texto)));
    const sirve = huboVideo && !pregunta.some((p) => P.oferta.test(p)) && pregunta.some((p) => P.pregunta_sirve.test(p));
    const cuenta = pregunta.some((p) => P.pregunta_si_vio.test(p) || (yaLoVio && P.pide_opinion.test(p))) || sirve || dijoQueLoVio(t);
    if (!cuenta || !(INTERES.test(t) || (sirve && esSi(textoDe(L)))) || SIN_INTERES.test(t)) continue;
    // Ya sabía cuánto sale: lo que sigue es otro paso. El estado lo dice aunque la frase no esté en la base.
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
      out.push({ ...base, tipo: "nada", siguiente: null, leadDespues: false, pendiente: false, llegoDespues: false, cuentaDespues: false });
      continue;
    }
    const precio = N.mensajes.find((m) => PRECIO_DADO.test(plano(m.texto)));
    if (precio) {
      const demora = hora(precio.creado) - hora(ultimoLead.creado);
      if (demora > TARDE_MS) out.push({ ...base, tipo: "tarde", siguiente: textoDe(turnoDe(N)), demora, medida: true });
      continue;
    }
    const turno = turnoDe(N);
    if (P.antes_del_precio.test(planoDe(turno))) continue;
    const siguio = loQueSiguio(ts, i + 1, contacto, (x) => PRECIO_DADO.test(planoDe(x)));
    out.push({
      ...base, tipo: "otra_cosa", siguiente: textoDe(turno), pregunta: planoDe(turno).includes("?"),
      deCande: N.mensajes.some((m) => m.quien === "cande"), cuentaDespues: N.mensajes.length > turno.mensajes.length, ...siguio,
    });
  }
  return out;
}

/** La clase de una pregunta de la cuenta (patrones "clases"), o null (también sin patrones). */
export function claseDePregunta(texto, P = null) {
  const p = plano(texto);
  if (!P || !p.includes("?")) return null;
  return P.clases.find(([, r]) => r.test(p))?.[0] ?? null;
}

/**
 * F3. El agente pregunta algo que ya preguntó la cuenta (la misma clase, con el lead escribiendo en el medio), o si es
 * dev a quien ya dijo que es dev, o si busca a quien ya dijo si busca. Los seguimientos tienen su regla. Sin patrones
 * no marca nada.
 */
export function preguntaRepetida(mensajes, { ahora, patrones: P = null }) {
  if (!P) return [];
  const preguntas = (mensajes || []).filter((m) => m.quien === "agente" || m.quien === "cande")
    .map((m) => ({ ...m, clase: claseDePregunta(m.texto, P) })).filter((m) => m.clase);
  const delLead = (mensajes || []).filter((m) => m.quien === "lead");
  const out = [];
  for (const b of preguntas) {
    if (b.quien !== "agente" || ahora - hora(b.creado) > MIRAR_MS || P.toque.test(plano(b.texto))) continue;
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
 * F4. Mostró interés y frenó (patrón "frena") en una charla donde la cuenta ya le nombró el formulario, el programa o
 * cuánto sale, y el agente cerró: sin pregunta, con un cierre (patrón "cierre") y sin dar un paso más (el precio, el
 * link o el patrón "paso_mas"). Se mira lo que contestó el agente en el momento (turnoDe): lo que escribió Cande horas
 * después en el mismo tramo es otra cosa. Sin patrones no marca nada.
 */
export function cierrePrematuro(mensajes, { ahora, patrones: P = null }) {
  if (!P) return [];
  const ts = tramos(mensajes);
  const out = [];
  const nombra = (p) => PROGRAMA_PUBLICO.test(p) || P.programa.test(p);
  for (let i = 0; i + 1 < ts.length; i++) {
    const L = ts[i];
    if (L.tipo !== "lead" || ts[i + 1].mensajes[0].quien !== "agente") continue;
    const N = turnoDe(ts[i + 1]);
    if (ahora - hora(L.mensajes.at(-1).creado) > MIRAR_MS) continue;
    const t = planoDe(L);
    if (!P.frena.test(t) || NO_CORTO.test(t)) continue;
    const nombrado = mensajes.some((m) => CUENTA.has(m.quien) && m.id < N.mensajes[0].id && nombra(plano(m.texto)));
    const tn = planoDe(N);
    if (!nombrado || tn.includes("?") || !P.cierre.test(tn) || PRECIO_O_LINK.test(tn) || P.paso_mas.test(tn)) continue;
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
 * de la vuelta de Instagram que la vio escribir a mano. De las indicaciones cuenta solo la que salió o pudo salir (la
 * marca exacta y un estado de envío): una que terminó en error o que el agente prefirió no escribir no le llegó al lead.
 * Un mensaje del agente no prueba nada (puede ser justo la respuesta que falló), y que la bandeja real no la tenga
 * esperando tampoco: la red la saca también si Cande sigue a la persona o si lo último lo contestó un automático.
 */
export function contestoCande(c, { mensajes = [], salidas = [], desde }) {
  if (c?.dueno !== "cande") return false;
  const deEsta = (x) => String(x.contacto ?? c.id) === String(c.id) && hora(x.creado) > desde;
  return mensajes.some((m) => deEsta(m) && (m.quien === "cande" || (m.quien === "sistema" && ESCRIBIO_A_MANO.test(plano(m.texto)))))
    || salidas.some((s) => deEsta(s) && String(s.detalle || "").startsWith(DETALLE_INDICACION) && ENTREGADAS.has(s.estado));
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

/**
 * Lo que se le pide al agente para corregir cada una. Son para el modelo: nunca le llegan al lead. Dicen qué falta con
 * palabras de acá: lo que corresponde mandar lo sabe el agente por su prompt.
 */
export function indicacionPara(d) {
  if (d.regla === "F1") {
    return `El lead aceptó lo que le ofreciste («${corto(d.dijo, 120)}») y todavía no le llegó lo que corresponde después de ese sí. ` +
      "Mandáselo ahora, completo, sin hacerle otra pregunta antes" +
      (d.tipo === "otra_cosa" ? " (si tu último mensaje fue una pregunta, no la repitas)." : ".");
  }
  if (d.regla === "F2") {
    return `El lead vio el video y opinó a favor («${corto(d.dijo, 120)}») y no le llegó cuánto sale. Seguí ahora con lo ` +
      "que corresponde después de esa opinión, sin otra pregunta antes, salvo una que tus reglas pidan antes del monto " +
      "según de dónde es él: esa va primero, sola.";
  }
  return "";
}

/** El renglón de cada falla para el resumen de las notas, sin el prefijo. */
export function queDecir(d, { macViva = true } = {}) {
  const dijo = corto(d.dijo);
  const sig = d.siguiente ? `«${corto(d.siguiente)}»` : "nada";
  switch (d.regla) {
    case "F1":
      if (d.tipo === "tarde") return `dijo que sí a la oferta del agente («${dijo}») y lo que seguía le llegó ${haceCuanto(d.demora)} después.`;
      return d.tipo === "nada"
        ? `dijo que sí a la oferta del agente («${dijo}») y no le llegó lo que seguía.`
        : `dijo que sí a la oferta del agente («${dijo}») y lo que le llegó fue ${sig}, sin lo que seguía.`;
    case "F2":
      if (d.tipo === "tarde") return `vio el video y opinó a favor («${dijo}») y cuánto sale le llegó ${haceCuanto(d.demora)} después.`;
      return `vio el video y opinó a favor («${dijo}») y no le llegó cuánto sale (le llegó ${sig}).`;
    case "F3":
      return d.tipo === "repetida"
        ? `el agente le volvió a preguntar «${corto(d.pregunta)}» (ya se lo había preguntado: «${corto(d.antes)}»).`
        : `el agente le preguntó «${corto(d.pregunta)}» y ya lo había dicho él: «${corto(d.antes)}».`;
    case "F4":
      return `mostró interés y frenó («${dijo}») y el agente cerró con ${sig}, sin dar un paso más.`;
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
 * `bandeja`: si se miran los pendientes de la red de la bandeja (el ajuste "bandeja"). `patrones`: los compilados
 * (compilarPatrones); sin ellos solo F5 y F6. Una charla personal no se mira.
 */
export function detectar({ mensajes = [], contactos = [], salidas = [], pendientes = [] }, { ahora, bandeja = true, patrones = null } = {}) {
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
    const ms = enOrden(lista);
    const sal = salidas.filter((s) => String(s.contacto) === id);
    const ctx = { contacto: c, salidas: sal, ahora, patrones };
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
 * { espera: motivo } (se mira de nuevo en la vuelta siguiente: la Mac, una corrida en marcha, el agente apagado, la
 * noche). `yaCorregida`: esta charla ya tuvo una corrección por la misma regla. `otraCorreccion`: ya tuvo una
 * corrección (de cualquier regla) después de esta falla, y el lead no contestó (si hubiera contestado, la falla tendría
 * al lead después): una segunda sería el segundo mensaje seguido sin respuesta. `arranque`: desde cuándo corre el
 * controlador (ms): lo de antes no se corrige.
 */
export function decidirCorreccion(d, {
  contacto: c, mensajes = [], salidas = [], ahora, yaCorregida = false, otraCorreccion = false, modo = "auto", macViva = true,
  arranque = null,
}) {
  if (!c) return { no: "no encuentro la charla" };
  if (c.dueno !== "agente") return { no: "la charla es tuya" };
  // La tuvo Cande después de la falla (la sacó la vuelta de Instagram, se la pasó el agente, o la devolvió con /agente):
  // lo que escribió a mano en ese rato no está en la base, y pudo haberle mandado ya lo que falta.
  if (hora(c.dueno_desde) > d.momento) return { no: "pasó por vos después" };
  // Antes de que arrancara el controlador la base no marcaba todo lo que hoy mira (una indicación de Cande salía sin su
  // marca), y lo atrasado saldría de golpe: eso va al resumen.
  if (Number.isFinite(arranque) && d.momento < arranque) return { no: "es de antes de que arrancara el controlador" };
  if (yaCorregida) return { no: "ya corregí esta charla una vez por lo mismo" };
  if (otraCorreccion) return { no: "ya le mandé otra corrección después y no contestó" };
  const conCande = (m) => m.quien === "cande" || (m.quien === "sistema" && NOTA_DE_CANDE.test(plano(m.texto)));
  if (d.deCande || mensajes.some((m) => m.id > d.desde && conCande(m))) return { no: "le escribiste vos" };
  // Lo que salió con una indicación suya desde Telegram queda como del agente, pero lo decidió ella (aunque no haya
  // salido: estuvo en la charla).
  const desdeEn = Number.isFinite(d.desdeEn) ? d.desdeEn : d.momento;
  const deEsta = (s) => String(s.contacto) === String(c.id) && hora(s.creado) >= desdeEn;
  if (salidas.some((s) => deEsta(s) && DE_UNA_INDICACION.test(String(s.detalle || "")))) {
    return { no: "le diste una indicación desde Telegram" };
  }
  // Un borrador (el agente en sombra, o el código de quien pagó en pesos): no queda en la charla, y Cande pudo haberlo
  // mandado a mano.
  if (salidas.some((s) => deEsta(s) && s.estado === "borrador")) return { no: "quedó un borrador del agente y no sé si lo mandaste" };
  const ultimo = hora(c.ultimo_lead);
  if (!(ahora - ultimo < VENTANA_CORREGIR_MS)) return { no: "pasó el día: el agente ya no le puede escribir" };
  if (d.llegoDespues) return { no: "le llegó más tarde" };
  if (d.leadDespues) return d.pendiente ? { espera: "el agente todavía no contestó lo último" } : { no: "el lead escribió después" };
  // La cuenta ya le escribió otra vez después de lo que contestó en el momento (un seguimiento, un automático): una
  // corrección sería otro mensaje seguido sin que el lead conteste. Los seguimientos se cuentan desde lo último del lead
  // (base.anotarLead los vuelve a cero), y lo último del lead es esta falla: el lead no escribió después.
  if (d.cuentaDespues || Number(c.toques) > 0) return { no: "ya le volvió a escribir la cuenta después" };
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
  // En el turno en que contó que se quedó sin trabajo no se le dice cuánto sale.
  if (d.regla === "F2" && senales([d.dijo]).sinTrabajo) return { no: "contó que se quedó sin trabajo" };
  // Otra pregunta del agente (una de las que van antes del monto con otras palabras, o una de más) no se pisa con el precio.
  if (d.regla === "F2" && d.tipo === "otra_cosa" && d.pregunta) return { no: "el agente le hizo otra pregunta y no se la piso" };
  if (modo !== "auto") return { espera: "el agente no está en automático" };
  if (!macViva) return { espera: "la Mac no está contestando" };
  // Lo que sale tarde le llega sin que el lead haya escrito recién, como un seguimiento: con su horario.
  if (ahora - d.momento > TARDE_MS && !horaDeToques(new Date(ahora))) return { espera: "es tarde y es de noche: sale de día" };
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
 * espera), se apagó, la charla cambió desde que el controlador la miró (antes o mientras se generaba) o Cande escribió a
 * mano y no se pudo anotar lo suyo (MIRAR_DE_NUEVO). No le salió nada al lead: la corrección no se gasta y se decide de
 * nuevo en la vuelta siguiente, con la charla al día (si ya le escribió la cuenta, no sale).
 */
const SIN_PASAR_NADA = new Set(["otra corrida lo tiene", "apagado", "la charla cambió", "la charla cambió durante la generación", MIRAR_DE_NUEVO]);
/** El modelo no contestó a tiempo (la Mac llena o lenta): tampoco salió nada. */
const noPasoNada = (r) => SIN_PASAR_NADA.has(r?.hecho) || (r?.hecho === "error del modelo" && r?.transitorio === true);

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
 *   base     ajustes, leerConfig (los patrones), reclamarControl, soltarControl, arranqueDelControlador,
 *            datosParaControl, guardarControl, marcarControl, borrarControl, reclamarEspera, soltarEspera (lib/dm/base.js)
 *   agente   el de lib/dm/armado.js: la corrección es agente.procesar(id, null, { evento: "control", indicacion,
 *            vistoHasta })
 *   macViva  si la Mac está contestando (sin ella no se corrige: queda para la vuelta siguiente)
 * Devuelve controlar({ hasta }): pasada la hora `hasta` (ms) no arranca otra corrección. Devuelve solo cantidades:
 * { hecho, fallas (las nuevas de esta vuelta, por regla), corregidas, sin_corregir, al_resumen, medidas, resueltas,
 * esperan (las que se pueden corregir pero no ahora: se miran de nuevo en la vuelta siguiente), sin_patrones (no están
 * cargados: F1 a F4 no se miraron) }.
 */
export function crearControlador({ base, agente = null, reloj = () => new Date(), macViva = async () => false }) {
  return async function controlar({ hasta = Infinity, ahoraMs = () => Date.now() } = {}) {
    const r = {
      hecho: "", fallas: {}, corregidas: 0, sin_corregir: 0, al_resumen: 0, medidas: 0, resueltas: 0, esperan: 0, sin_patrones: false,
    };
    const aj = await base.ajustes();
    if (aj.controlador === false) return { ...r, hecho: "apagado" };
    const marca = randomUUID();
    if (!(await base.reclamarControl(marca))) return { ...r, hecho: "otra vuelta lo tiene" };
    try {
      const ahora = reloj().getTime();
      const arranque = await base.arranqueDelControlador();
      const patrones = compilarPatrones(await base.leerConfig(CLAVE_PATRONES));
      r.sin_patrones = !patrones;
      const datos = await base.datosParaControl(MIRAR_HORAS);
      const conBandeja = aj.bandeja !== false;
      const fallas = detectar(datos, { ahora, bandeja: conBandeja, patrones });
      const contactos = new Map(datos.contactos.map((c) => [String(c.id), c]));
      const mensajesDe = (id) => enOrden(datos.mensajes.filter((m) => String(m.contacto) === id));
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

      // 4. Lo nuevo: se anota, y lo que se puede corregir se junta para el 5.
      // Una corrección (de cualquier regla) en esa charla después de esta falla: el lead no contestó desde entonces. La
      // hora de la fila es la de la corrección: un renglón que se le pone después no la cambia (base.marcarControl).
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
            macViva: await laMacContesta(), arranque,
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
      // cada vuelta). Las que no entran en esta vuelta (tope, tiempo, la Mac sin lugar, otra corrección en la misma
      // charla) no quedan anotadas: se vuelven a mirar en la siguiente, con la charla ya actualizada.
      let hechas = 0;
      const enEstaVuelta = new Set();
      for (const [k, d] of aCorregir.entries()) {
        if (hechas >= CORRECCIONES_POR_VUELTA || ahoraMs() >= hasta || !agente) {
          r.esperan += aCorregir.length - k;
          break;
        }
        // Dos fallas en una charla (el sí a la oferta y el video, en el mismo turno): una corrección por vuelta. La otra
        // se decide en la vuelta siguiente: si el lead no contestó la primera, ya no sale (otraCorreccion).
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
        // Un lugar de la Mac, de los de la espera (base.reclamarEspera): el que queda libre es para quien escribe en vivo.
        // Si están ocupados, la espera va primero y lo que falta se corrige en otra vuelta. Si la espera tiene apartada
        // esta charla, también.
        const lugar = await base.reclamarEspera(d.contacto, { tope: ESPERA_EN_PARALELO, paraPasar: true });
        if (lugar?.lleno) {
          r.esperan += aCorregir.length - k;
          break;
        }
        if (!lugar?.tomada) {
          r.esperan++;
          continue;
        }
        try {
          const id = await anotar(d, ESTADOS.corrigiendo);
          if (!id) continue;
          intentadas.add(`${d.contacto}|${d.regla}`);
          enEstaVuelta.add(d.contacto);
          hechas++;
          let res;
          try {
            // vistoHasta: lo último de la charla que miró esta vuelta. Si después se escribió algo (el lead, la cuenta, una
            // nota), el agente no corrige: la decisión era con una charla que ya no es la misma.
            res = await agente.procesar(d.contacto, null, {
              evento: "control", indicacion: indicacionPara(d), vistoHasta: ultimoId(mensajesDe(d.contacto)),
            });
          } catch (e) {
            res = { hecho: "error", error: e.message };
          }
          if (salio(res)) {
            await base.marcarControl(id, { estado: ESTADOS.corregida, aviso: null, motivo: motivoDe(d, "corregida") });
            r.corregidas++;
            continue;
          }
          if (noPasoNada(res)) {
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
        } finally {
          try {
            await base.soltarEspera(d.contacto);
          } catch {
            // se libera sola a los 6 minutos
          }
        }
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
