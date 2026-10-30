// La etiqueta "sin_intencion" de ManyChat (30/10, Cande: "puede el agente leer cuando hay intención CERO de compra y
// matarlo de ManyChat?"). ManyChat cobra por contacto activo y la cuenta ya pasó los 2.500. Su API no deja borrar ni
// desuscribir a nadie (solo crear, cambiar, etiquetas y campos), así que el agente le pone esta etiqueta a quien no
// tiene intención de compra y Cande los borra o desuscribe en tanda desde ManyChat, filtrando por ella.
//
// Lo peor que puede pasar es un falso positivo: alguien interesado con la etiqueta, que Cande borra. Ante la duda, NO
// la lleva.
//
// Dónde se puede poner (criterio aprobado por Cande el 30/10):
//   - quien no es dev (estado.quien "no_dev") en una charla del agente que el modelo ya cerró (estado.etapa "cerrada").
//     Con la charla abierta no: a quien no es de tech el prompt le pregunta "a qué te dedicás?" para ver si contrata;
//   - las charlas personales que marcó borrarCharla desde el 31/10 (dm_contactos.personal_en). Las de antes no: entre el
//     17 y el 20/10 borrarCharla marcó personal a charlas que Cande tomaba a mano (revisión del 31/10).
// Nunca: devs (aunque no busquen), estudiantes, empresas o founders, "no_se_sabe", compradores (la base dice que compró,
// le salió el código del pago en pesos, el contexto de la charla dice que compró o el modelo vio el pago) ni las charlas
// de Cande por otra razón que no sea personal.
//
// Y aun ahí, la regla está al revés de una lista de lo que frena (tercera revisión del 31/10: con una lista, todo lo que
// no estaba en ella la llevaba, y la llevaban "hay cupo?", "cómo pago?" o "tenés gente?"). Que el modelo diga no_dev no
// alcanza: la lleva solo una charla personal o de coqueteo y NADA más (tipoDeMensaje). O sea, lo que escribió el lead
// tiene un halago a ella o algo de su vida o de una cita (PERSONAL), y todo lo demás que escribió es eso mismo o algo
// suelto (un saludo, un gracias, un sí, una risa, un emoji). No la lleva:
//   - una pregunta (un "?" o un arranque como qué, cómo, cuánto, hay, tenés o quedan), aunque sea "salgamos?";
//   - una palabra de interés, compra, trabajo, tech o del contenido de Cande (INTERES);
//   - un mensaje que no se reconoce entero (cualquier palabra que no esté en la lista de esa charla), un adjunto o un
//     link: puede ser un CV o un comprobante;
//   - una charla de solo cosas sueltas ("hola", "🔥"): no se sabe a qué responde;
//   - si ya le llegó el formulario o el precio (estado.link_formulario_enviado, estado.precio_dicho) o la cuenta le
//     ofreció el programa, el 1 a 1 (frenos.ofertaDe) o una llamada (LLAMADA);
//   - quien habló de un pago o dio una señal de empresa (frenos.senales).
// En una charla personal, eso se mira con lo que había antes de que borrarCharla lo borrara (antesDeBorrar): si no era
// una charla personal pura, queda dm_contactos.personal_dudosa y no la lleva nunca. Lo mismo si escribe algo después
// de la etiqueta (pages/api/dm/entrada.js, escribioDespues): eso no se guarda en ningún lado, así que cualquier mensaje
// nuevo la saca. Si deja de cumplir lo de arriba (pasa a dev, la toma Cande, compró), se le saca.
//
// La etiqueta se mira cuando puede cambiar (lib/dm/agente.js: el turno, el pase a Cande, la charla personal que se
// borra; lib/dm/instagram.js: sacar; lib/dm/respuestas.js: /cande y /agente; /api/dm/config: borrar, dueno y sembrar;
// /api/dm/entrada: un mensaje nuevo en una charla de Cande con la etiqueta o personal) y en el barrido (/api/dm/config, accion sin_intencion), que también corrige a quien la tiene y ya no la lleva.
// Siempre con lo que dice la base (paraSinIntencion en lib/dm/base.js), así el turno y el barrido deciden con lo mismo.
// Si ManyChat falla, no frena nada: dm_contactos.sin_intencion_en queda como estaba, la falla queda anotada
// (sin_intencion_falla) y lo intenta el turno siguiente o el barrido. Nada de esto registra textos de los leads ni sus ids.
//
// Ojo: este archivo y lib/dm/frenos.js se importan en círculo (frenos → respuestas → este → frenos). Anda porque acá
// nada de frenos se usa al cargar el archivo, solo adentro de las funciones: que siga así.
import { ofertaDe, plano, senales } from "./frenos";

export const ETIQUETA_SIN_INTENCION = "sin_intencion";

/** Cuántos contactos toca como mucho un pedido del barrido, si no se dice, y el tope. */
export const TANDA_SIN_INTENCION = 25;
export const TANDA_MAX_SIN_INTENCION = 100;
// ManyChat deja 10 pedidos por segundo: el barrido va de a uno y con esta pausa entre uno y otro.
const PAUSA_MS = 150;
/**
 * Un contacto con el que ManyChat falló hace menos que esto no entra al barrido: queda para después (en_espera). Así uno
 * que ManyChat rechaza siempre no tapa la cola, y una corrida entera de dm_nube.py (unos minutos) no lo pide dos veces.
 */
export const ESPERA_FALLA_MS = 60 * 60 * 1000;

/** Por qué no la llevan las personales de antes del 31/10 (sin personal_en): el barrido las cuenta aparte. */
export const MOTIVO_PERSONAL_VIEJA = "personal de antes del 31/10";

// Lo que en el contexto de una charla (lo escribe Cande al sembrarla) dice que compró. En plano: sin tildes ni mayúsculas.
const COMPRO = /\b(compr(o|e|aste|aron|ador|adora)|ya pag(o|e|aste|aron)|pag(o|aron) el (programa|acceso|1 a 1)|alumn[oa]s?|tiene (el )?(programa|acceso)|cliente)\b/;

const r = String.raw;
// Lo que dice que algo le interesa, o que habla de trabajo, de compra, de quien contrata, de tech o de lo que ofrece y
// publica Cande. Se mira en plano, en cualquier mensaje del lead. Es amplio a propósito: lo que entra acá solo hace que
// no lleve la etiqueta. Un "no me interesa" o un "no quiero" no cuentan como interés, pero tampoco son una charla
// personal: no la llevan igual.
const INTERES = new RegExp([
  r`(?<!\bno )\b(quiero|quiere|quisiera|queria|me gustaria|me encantaria|necesito)\b`,
  r`(?<!\bno )\bme (interesa|interesan|interesaria|intereso|sumo|anoto|apunto|prendo)\b`, r`\binteresad[oa]s?\b`,
  r`\byo\b`, r`\b(info|informacion|detalles?|pasame|mandame|link|formulario|ayuda\w*)\b`,
  r`\b(precios?|cuant[oa]s?|cuesta|costo|valor|tarifa|pagar|comprar?|inscrib\w*)\b`,
  r`\b(trabaj\w*|laburo|laburar|empleos?|chamba|busco|buscando|postul\w*|entrevistas?|sueldos?|salari\w*|linkedin)\b`,
  r`\b(cv|curricul\w*|portfolio|portafolio|recruit\w*|contrat\w*|freelance\w*|remoto)\b`,
  r`\b(devs?|developers?|desarroll\w*|program\w*|codigo|codear|code|coding|tech|tecnolog\w*|software|sistemas|informatica)\b`,
  r`\b(ingenier\w*|front ?end|back ?end|full ?stack|react|python|javascript|java|node|sql)\b`,
  r`\b(cursos?|bootcamp|mentor\w*|1 ?a ?1|uno a uno|videos?|reels?|contenido|consejos?|tips?|clases?)\b`,
  r`\b(i want|i need|interested|how much|price|jobs?|work\w*|interviews?|resume|salary|hiring|course|help)\b`,
  // Comprar (tercera revisión del 31/10): "hay cupo?", "cómo pago?", "me cierra, cómo reservo?", "quedan lugares?".
  r`\b(reserv\w*|cupos?|lugar(es)?|pag\w*|cuotas?|tarjetas?|mercado ?pago|descuentos?|promo\w*|garant\w*|compr\w*|anot\w*)\b`,
  r`\b(docs?|document\w*|disponib\w*|online|inscri\w*|uno|contame|decime|explic\w*|consiste|funciona\w*|dolar\w*|usd|pesos)\b`,
  // Quien contrata ("tenés gente?").
  r`\b(gente|equipos?|empresas?|emprend\w*|startups?|clientes?|proyectos?)\b`,
  r`\b(sign ?(me )?up|join|available|buy|pay\w*|team|company)\b`,
].join("|"));

/** Las letras repetidas de más quedan en una ("hermosaaa", "holaaa", "siii"). */
const apretar = (s) => String(s).replace(/(\p{L})\1{2,}/gu, "$1");
/** Las palabras de un texto, en plano y apretadas. */
const palabrasDe = (t) => apretar(plano(t)).replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(" ").filter(Boolean);

// Un halago a ella (femenino: "qué lindo" suele ser a una historia o a un video) y sus variantes.
const HALAGO = r`(hermos|divin|lind|bell|precios|guap)(a+|isima+)|hermosura|belleza|reina|diosa`;
// Una señal clara de charla personal o de coqueteo, en plano y apretado: un halago a ella o algo de su vida o de una cita.
const PERSONAL = new RegExp([
  r`\b(${HALAGO})\b`, r`\bmi amor\b|\bamor mio\b|\bbebe\b`,
  r`\bamiga\b|\bte extran\w*|\bnos vemos\b|\bsalgamos\b|\bcafe(cito)?\b|\bcitas?\b`,
  r`\b(tu|el) (numero|whatsapp|whats|wsp|wpp|cel|celular|telefono)\b`,
].join("|"));
// Las palabras de esas señales, una por una ("app" va con "app de citas", "numero" con "tu numero").
const DE_LO_PERSONAL = new RegExp(`^(${HALAGO}|amor|mio|bebe|amiga|extran\\w*|vemos|salgamos|cafe(cito)?|citas?|app|numero|whatsapp|whats|wsp|wpp|cel|celular|telefono)$`);
// Lo que acompaña a una señal en un mensaje personal sin cambiar lo que dice ("sos re linda", "te vi en la app de citas").
// Fuera de esto, cualquier otra palabra hace que el mensaje no se reconozca: ante la duda, no la lleva.
const RELLENO = new RegExp(`^(${[
  "sos", "eres", "es", "estas", "esta", "muy", "re", "tan", "mas", "super", "demasiado", "que", "q", "te", "ti", "vos", "tu",
  "tus", "mi", "mis", "me", "la", "el", "las", "los", "lo", "un", "una", "en", "de", "del", "a", "al", "con", "y", "e", "o",
  "para", "por", "nos", "vi", "ver", "tomar", "algo", "conmigo", "toda", "todo", "hoy", "ay", "uy", "dame",
].join("|")})$`);
// Lo suelto: un sí, un saludo, un gracias, una risa. Un mensaje de solo esto (o de emojis y signos) no dice a qué
// responde: puede ser un dev que reacciona a una historia.
const NEUTRO = new RegExp(`^(${[
  "s+i+", "y+e+s+", "yep", "o+k+(a+y*|i+s?|e+y*)?", "dale+", "hola+s?", "buen(a|o)?s?", "dias?", "tardes?", "noches?", "hi+",
  "hello+", "hey+", "graci+a+s+", "muchas", "mil", "thanks?", "thank", "you", "ty", "(j+[aeiou]+)+j*", "(h+[aeiou]+)+h*",
  "xd+", "lol", "jsj+", "a+h+", "o+h+", "e+h+", "u+h+", "mm+",
].join("|")})$`);
// Los signos que pueden acompañar a un halago: puntuación y emojis de coqueteo (con sus variantes de color y unión).
const SIGNO_DE_COQUETEO = /^[!¡.,;:()'"*~\-❤♥❣😍🥰😘💋😻💕💖💗💓💞💘💝😚😙😗🤤🫦🌹😏😉🔥🧡💛💚💙💜🖤🤍🤎\u{FE0F}\u{200D}\u{1F3FB}-\u{1F3FF}]$/u;

// Un arranque de pregunta sin el "?" ("cuanto sale", "hay cupo", "tenes gente", "quedan lugares").
const INTERROGATIVA = /^(que|q|como|cuant[oa]s?|cuando|donde|adonde|cual(es)?|quien(es)?|porque|por que|hay|tenes|tienes|tiene|tienen|quedan?|siguen?|puedo|podes|puedes|podria|aceptan?|existe|sirve|vale|hacen|haces|se puede)\b/;

/** Si el mensaje pregunta algo: un "?" o un arranque de pregunta (después de los saludos). "Qué linda sos" no pregunta. */
export function esPregunta(texto) {
  if (/[?¿]/.test(String(texto ?? ""))) return true;
  const palabras = palabrasDe(texto);
  let i = 0;
  while (i < palabras.length && NEUTRO.test(palabras[i])) i++;
  const resto = palabras.slice(i).join(" ");
  if (!INTERROGATIVA.test(resto)) return false;
  return !new RegExp(`^(que|q) ((muy|re|tan|mas) )?(${HALAGO})\\b`).test(resto);
}

/**
 * Qué es este mensaje del lead, para la etiqueta:
 *   - "personal": tiene una señal clara de charla personal o coqueteo (PERSONAL) y nada más (solo palabras de esa señal,
 *     de relleno o sueltas, puntuación y emojis de coqueteo): "hermosa 😍", "qué linda sos 😘", "te vi en la app de citas";
 *   - "suelto": solo un saludo, un gracias, un sí, una risa, emojis o signos: "hola", "🔥", "jaja";
 *   - "otro": todo lo demás. Una pregunta, una palabra de interés, un adjunto, un link, un mensaje vacío o cualquier
 *     palabra que no está en las listas. Ante la duda, esto.
 */
export function tipoDeMensaje(texto) {
  const t = String(texto ?? "").trim();
  if (!t || /^\[adjunto/i.test(t) || /https?:\/\/|www\./i.test(t)) return "otro";
  if (esPregunta(t) || INTERES.test(plano(t))) return "otro";
  const palabras = palabrasDe(t);
  if (palabras.every((p) => NEUTRO.test(p))) return "suelto";
  const p = apretar(plano(t));
  if (!PERSONAL.test(p)) return "otro";
  if (!palabras.every((x) => NEUTRO.test(x) || RELLENO.test(x) || DE_LO_PERSONAL.test(x))) return "otro";
  const signos = [...p.replace(/[\p{L}\p{N}\s]/gu, "")];
  return signos.every((s) => SIGNO_DE_COQUETEO.test(s)) ? "personal" : "otro";
}

/** Si este mensaje del lead es algo suelto que no dice a qué responde ("hola", "gracias", "sí", "jaja", un emoji). */
export const esSuelto = (texto) => tipoDeMensaje(texto) === "suelto";

// Un mensaje de la cuenta que le ofrece una llamada (lo que contesta la palabra TRABAJO desde el 31/10, lib/dm/palabraClave.js).
const LLAMADA = /\bllamadas?\b|\bagend|calendly|strategy ?\. ?opengatehub|opengatehub ?\. ?com ?\/ ?15min/;

/**
 * Lo que en la charla dice que no lleva la etiqueta, o null si es una charla personal o de coqueteo y nada más.
 * `charlaDelLead`: todo lo que escribió el lead (textos). `charlaDeLaCuenta`: lo que le mandó la cuenta (el agente,
 * Cande o un automático). `estado`: el del modelo (si ya le llegó el formulario o el precio del programa). `borrada`: la
 * charla ya se borró (una personal), así que no queda nada del lead: lo que escribió se miró al borrarla (personal_dudosa).
 */
export function senalDeLaCharla({ charlaDelLead = [], charlaDeLaCuenta = [], estado = null, borrada = false } = {}) {
  const lead = (charlaDelLead || []).map((t) => String(t ?? ""));
  const dijo = senales(lead);
  if (dijo.pagos) return "habló de un pago";
  if (dijo.empresa || dijo.contrataDevs) return "dio una señal de empresa";
  if (lead.some((t) => INTERES.test(plano(t)))) return "mostró interés o habló de trabajo";
  if (lead.some(esPregunta)) return "hizo una pregunta";
  if (estado?.link_formulario_enviado === true) return "le llegó el formulario";
  if (estado?.precio_dicho === true) return "le llegó el precio";
  if ((charlaDeLaCuenta || []).some((t) => ofertaDe(t) || LLAMADA.test(plano(t)))) return "la cuenta le ofreció algo";
  if (!lead.length) return borrada ? null : "no escribió nada";
  const tipos = lead.map(tipoDeMensaje);
  if (tipos.includes("otro")) return "escribió algo que no es una charla personal";
  // Lo suelto frena solo si es lo único: un "hola" al lado de un "hermosa 😍" no cambia lo que dice la charla.
  if (!tipos.includes("personal")) return "contestó solo algo suelto: no se sabe a qué";
  return null;
}

const CUENTA = new Set(["agente", "cande", "automatico"]);

/**
 * Lo que hace falta de una charla para decidir la etiqueta, tomado antes de que borrarCharla lo borre: `mensajes` (los
 * de la base, { quien, texto }), `previo` (lo que se habló por Instagram antes, { quien: "lead" | "cande", texto }) y
 * `estados` (el guardado y, en un turno, el que acaba de decir el modelo).
 */
export function antesDeBorrar({ mensajes = [], previo = [], estados = [] } = {}) {
  const todos = [...(Array.isArray(previo) ? previo : []), ...(Array.isArray(mensajes) ? mensajes : [])];
  const textos = (cuales) => todos.filter((m) => cuales(m?.quien)).map((m) => String(m?.texto ?? ""));
  const alguno = (campo) => (estados || []).some((e) => e?.[campo] === true);
  return {
    charlaDelLead: textos((q) => q === "lead"),
    charlaDeLaCuenta: textos((q) => CUENTA.has(q)),
    estado: { link_formulario_enviado: alguno("link_formulario_enviado"), precio_dicho: alguno("precio_dicho") },
  };
}

/**
 * Si el contexto de la charla dice que compró. El de las altas (ajuste contexto_alta: qué le mandó el automático antes)
 * es el mismo para todos y no dice nada de esta persona: no cuenta.
 */
export function dijoQueCompro(contexto, contextoAlta = "") {
  const t = String(contexto || "").trim();
  if (!t || t === String(contextoAlta || "").trim()) return false;
  return COMPRO.test(plano(t));
}

/** Por qué no la lleva una charla personal que decía otra cosa al borrarla, o en la que el lead escribió después. */
export const MOTIVO_DUDOSA = "la charla personal decía otra cosa (al borrarla o después)";

/**
 * Por qué este contacto no lleva la etiqueta, o null si la lleva.
 * `quien`: lo último que dijo el modelo (estado.quien). `dueno` y `contexto`: los de dm_contactos. `personal`: una
 * charla personal que marcó borrarCharla desde el 31/10; `personalVieja`: una de antes (no la lleva); `dudosa`: al
 * borrarse no era una charla personal pura, o el lead escribió después (personal_dudosa). `compro`: la base dice que
 * compró o le salió el código del pago en pesos. `charlaDelLead`, `charlaDeLaCuenta` y `estado`: ver senalDeLaCharla
 * (en una charla personal ya no hay nada guardado, salvo lo que se pase de antes de borrarla). `estado.etapa`: la de
 * una charla del agente, que la lleva solo "cerrada".
 */
export function motivoSinIntencion({
  quien = null, personal = false, personalVieja = false, dudosa = false, dueno = null, compro = false, contexto = "",
  contextoAlta = "", charlaDelLead = [], charlaDeLaCuenta = [], estado = null,
} = {}) {
  if (compro === true) return "compró";
  if (dijoQueCompro(contexto, contextoAlta)) return "el contexto dice que compró";
  // Un dev, un estudiante, una empresa, alguien que construye algo o de quien no se sabe: nunca.
  if (quien && quien !== "no_dev") return `es ${quien}`;
  if (dudosa === true) return MOTIVO_DUDOSA;
  const borrada = (personal === true || personalVieja === true) && lista(charlaDelLead).length === 0;
  const senal = senalDeLaCharla({ charlaDelLead, charlaDeLaCuenta, estado, borrada });
  if (senal) return senal;
  if (personal === true) return null;
  if (personalVieja === true) return MOTIVO_PERSONAL_VIEJA;
  if (dueno !== "agente") return "es de Cande";
  if (quien !== "no_dev") return "no se sabe quién es";
  // Con la charla abierta el modelo todavía pregunta (a quien no es de tech, "a qué te dedicás?", por si contrata).
  if (estado?.etapa !== "cerrada") return "la charla sigue abierta";
  return null;
}

const lista = (x) => (Array.isArray(x) ? x : []);

/** Lo que dice una fila de paraSinIntencion (más lo de `antes`, si se borró recién), como lo pide motivoSinIntencion. */
function datosDeLaFila(f, contextoAlta, antes = null) {
  const previo = lista(f?.previo_ig);
  const textos = (quien) => previo.filter((m) => m?.quien === quien).map((m) => String(m?.texto ?? ""));
  const estado = {
    link_formulario_enviado: f.link_formulario_enviado === true || antes?.estado?.link_formulario_enviado === true,
    precio_dicho: f.precio_dicho === true || antes?.estado?.precio_dicho === true, etapa: f.etapa ?? null,
  };
  return {
    quien: f.quien || null, personal: f.personal === true && f.personal_en != null,
    personalVieja: f.personal === true && f.personal_en == null, dudosa: f.personal_dudosa === true, dueno: f.dueno,
    compro: f.compro === true, contexto: f.contexto, contextoAlta,
    charlaDelLead: [...textos("lead"), ...lista(f.del_lead), ...lista(antes?.charlaDelLead)],
    charlaDeLaCuenta: [...textos("cande"), ...lista(f.de_la_cuenta), ...lista(antes?.charlaDeLaCuenta)],
    estado,
  };
}

/** Un renglón para el registro, sin ids ni textos de nadie (como armado.registrar). */
function registrar(que, detalle) {
  console.error(`dm: sin_intencion, ${que}`, String(detalle ?? "").replace(/\d{6,}/g, "…").slice(0, 160));
}

/** Si ManyChat dice que no tiene a ese contacto (lo borraron, o borró su cuenta): no tiene sentido volver a pedírselo. */
export function noLoTieneManyChat(respuesta) {
  return /\bsubscriber\b[^|]{0,40}?\b(does ?n[o']?t exist|not (be )?found|not exist|no existe)/i.test(String(respuesta?.error ?? ""));
}

/** Anota la falla de ManyChat con este contacto (base.anotarFallaSinIntencion). Nunca tira. */
async function anotarFalla(base, id, noExiste) {
  try {
    if (typeof base?.anotarFallaSinIntencion === "function") await base.anotarFallaSinIntencion(id, noExiste);
  } catch (e) {
    registrar("no pude anotar la falla", e?.message);
  }
}

/**
 * Le pone (lleva: true) o le saca la etiqueta al contacto `c` ({ id, sin_intencion_en }) y lo anota en la base. Una sola
 * vez: si ya está como tiene que estar, no hace nada (null). true si quedó; false si ManyChat o la base fallaron: queda
 * como estaba, la falla queda anotada (sin_intencion_falla; si ManyChat dice que no tiene al contacto, también eso) y lo
 * intenta la próxima vez. Para sacarla, que ManyChat no tenga al contacto es lo mismo que sacarla: tampoco tiene la
 * etiqueta. Nunca tira.
 */
export async function etiquetarSinIntencion({ base, manychat }, c, lleva) {
  try {
    if (!c?.id || Boolean(lleva) === Boolean(c.sin_intencion_en)) return null;
    const llamar = lleva ? manychat?.ponerEtiqueta : manychat?.quitarEtiqueta;
    if (typeof llamar !== "function" || typeof base?.marcarSinIntencion !== "function") return null;
    let r;
    try {
      r = await llamar(c.id, ETIQUETA_SIN_INTENCION);
    } catch (e) {
      r = { ok: false, error: e?.message };
    }
    if (!r?.ok) {
      const noExiste = noLoTieneManyChat(r);
      if (noExiste && !lleva) {
        await base.marcarSinIntencion(c.id, false);
        return true;
      }
      registrar(`ManyChat no la ${lleva ? "puso" : "sacó"}`, r?.error || "sin respuesta");
      await anotarFalla(base, c.id, noExiste);
      return false;
    }
    await base.marcarSinIntencion(c.id, Boolean(lleva));
    return true;
  } catch (e) {
    registrar("falló", e?.message);
    return false;
  }
}

/**
 * Relee el contacto `id` en la base, decide si lleva la etiqueta y se la pone o se la saca. { lleva, hecho }: lleva es
 * null si no está entre los que la pueden llevar o tenerla; hecho, lo de etiquetarSinIntencion. Puede tirar.
 */
async function revisarUno({ base, manychat }, id, { contextoAlta, pagoPesos = null, antes = null, escribio = false } = {}) {
  if (!id || typeof base?.paraSinIntencion !== "function") return { lleva: null, hecho: null };
  const [fila] = await base.paraSinIntencion({ id: String(id) });
  // Ni la tiene, ni es personal, ni es no_dev en una charla del agente: no hay nada que mirar.
  if (!fila) return { lleva: null, hecho: null };
  const alta = contextoAlta !== undefined ? contextoAlta : (await base.ajustes())?.contexto_alta;
  // Lo de antes de borrar decide por sí solo (aunque la base no haya podido guardar personal_dudosa), y lo que escribió
  // después también (escribioDespues).
  const lleva = !pagoPesos && !escribio && !(antes && senalDeLaCharla(antes) !== null)
    && motivoSinIntencion(datosDeLaFila(fila, alta, antes)) === null;
  return { lleva, hecho: await etiquetarSinIntencion({ base, manychat }, { id: fila.id, sin_intencion_en: fila.etiquetado }, lleva) };
}

/**
 * Mira con lo que dice la base si el contacto `id` lleva la etiqueta y se la pone o se la saca (etiquetarSinIntencion).
 * `pagoPesos`: lo que el modelo vio del pago en este turno (si vio algo, no la lleva). `contextoAlta`: el ajuste, si ya
 * está a mano (si no, se lee). `antes`: lo de la charla de antes de que borrarCharla la borrara (antesDeBorrar), que
 * cuenta junto con lo que queda en la base. `escribio`: el lead escribió algo que no se guardó (escribioDespues): no la
 * lleva. null si no hay nada que hacer. Nunca tira: va después de cosas que ya pasaron.
 */
export async function revisarSinIntencion(deps, id, opciones = {}) {
  try {
    return (await revisarUno(deps, id, opciones)).hecho;
  } catch (e) {
    registrar("no la pude revisar", e?.message);
    return false;
  }
}

/**
 * Si un mensaje nuevo de este contacto (la fila de dm_contactos) se tiene que mirar para la etiqueta aunque no se
 * guarde: es de una charla de Cande (lo que escribe no entra a la base) y tiene la etiqueta, o es personal desde el 31/10
 * (se la pueden poner después, en el barrido).
 */
export function miraLoQueEscribe(c) {
  return Boolean(c?.id) && c.dueno !== "agente" && (c.sin_intencion_en != null || (c.personal === true && c.personal_en != null));
}

/**
 * El lead de una charla de Cande escribió algo (pages/api/dm/entrada.js, cuando recibir no lo guarda). Lo que escribió
 * no queda en ningún lado, así que no se puede saber si ahora pide el programa: cualquier mensaje nuevo, sea cual sea,
 * deja la charla dudosa (base.marcarDudosa, para que el barrido no se la vuelva a poner) y le saca la etiqueta. `c`: la
 * fila de dm_contactos. Nunca tira. null si no hay nada que mirar (miraLoQueEscribe).
 */
export async function escribioDespues({ base, manychat }, c) {
  try {
    if (!miraLoQueEscribe(c)) return null;
    try {
      if (typeof base?.marcarDudosa === "function") await base.marcarDudosa(c.id);
    } catch (e) {
      registrar("no pude anotar la charla como dudosa", e?.message);
    }
    return await revisarSinIntencion({ base, manychat }, c.id, { escribio: true });
  } catch (e) {
    registrar("no la pude revisar", e?.message);
    return false;
  }
}

const dormir = (ms) => new Promise((res) => setTimeout(res, ms));

/**
 * El barrido de los que ya existen. Con dry (lo que pasa si no se dice dry: false) no escribe nada, ni en ManyChat ni en
 * la base: dice cuántos la llevarían (para_poner), cuántos la tienen y ya no (para_sacar), por qué no la llevan los demás
 * (no_la_llevan), cuántas personales de antes del 31/10 quedan afuera (personales_viejas), cuántos esperan porque
 * ManyChat falló hace poco (en_espera) o porque ManyChat no los tiene (no_existen), y una muestra de hasta `limite`
 * ({ id, quien, personal }, sin textos). Sin dry, de a uno y con pausa (ManyChat deja 10 por segundo): primero les saca
 * la etiqueta a quienes ya no la llevan (Cande borra por la etiqueta: ahí no puede quedar nadie que no va) y después se
 * la pone a los que faltan, hasta `limite` o hasta la hora `hasta`. Antes de cada uno relee su fila y decide de nuevo
 * (un turno pudo cambiarla mientras tanto). `quedan`: lo que falta, contando los que fallaron en esta tanda (`fallidas`,
 * que la tanda siguiente ya no pide): hay más para hacer mientras quedan sea mayor que fallidas.
 */
export async function barrerSinIntencion({
  base, manychat, dry = true, limite = TANDA_SIN_INTENCION, hasta = Infinity, esperar = dormir, ahora = Date.now(),
}) {
  const alta = (await base.ajustes())?.contexto_alta;
  const filas = await base.paraSinIntencion();
  const poner = [];
  const sacar = [];
  const noLaLlevan = {};
  const enEspera = { poner: 0, sacar: 0 };
  let noExisten = 0;
  let personalesViejas = 0;
  const fallo = (f) => {
    const en = f.falla_en == null ? NaN : new Date(f.falla_en).getTime();
    return ahora - en < ESPERA_FALLA_MS;
  };
  for (const f of filas) {
    const motivo = motivoSinIntencion(datosDeLaFila(f, alta));
    if (motivo === null && !f.etiquetado) {
      if (f.no_existe === true) noExisten++;
      else if (fallo(f)) enEspera.poner++;
      else poner.push(f);
    } else if (motivo !== null && f.etiquetado) {
      if (fallo(f)) enEspera.sacar++;
      else sacar.push(f);
    } else if (motivo === MOTIVO_PERSONAL_VIEJA) personalesViejas++;
    else if (motivo !== null) noLaLlevan[motivo] = (noLaLlevan[motivo] || 0) + 1;
  }
  const resumen = {
    ok: true, dry, para_poner: poner.length, para_sacar: sacar.length, no_la_llevan: noLaLlevan,
    personales_viejas: personalesViejas, en_espera: enEspera, no_existen: noExisten,
  };
  // Cande borra por la etiqueta: si alguien que no la lleva la sigue teniendo, se le dice antes.
  const ojo = (pendientes) => (pendientes > 0
    ? { ojo: `${pendientes} tienen la etiqueta y ya no la llevan: no borres por la etiqueta hasta que esto quede en 0` }
    : {});
  const fichas = (cuales) => cuales.slice(0, limite).map((f) => ({ id: f.id, quien: f.quien || null, personal: f.personal === true }));
  if (dry) return { ...resumen, ...ojo(sacar.length + enEspera.sacar), muestra: fichas(poner), muestra_sacar: fichas(sacar) };

  const cola = [...sacar, ...poner].slice(0, limite);
  // La etiqueta tiene que existir en la cuenta para ponerla: se crea antes, por si falta (si ya existe, no pasa nada).
  if (poner.length && cola.length > sacar.length && typeof manychat?.crearEtiqueta === "function") {
    try {
      await manychat.crearEtiqueta(ETIQUETA_SIN_INTENCION);
    } catch {
      // si no se pudo crear, lo dice el primero que falle al ponerla
    }
    await esperar(PAUSA_MS);
  }
  let puestas = 0;
  let sacadas = 0;
  let cambiaron = 0;
  const fallaron = [];
  for (let i = 0; i < cola.length && Date.now() < hasta; i++) {
    if (i) await esperar(PAUSA_MS);
    const f = cola[i];
    let r;
    try {
      r = await revisarUno({ base, manychat }, f.id, { contextoAlta: alta });
    } catch (e) {
      registrar("no la pude revisar", e?.message);
      r = { lleva: null, hecho: false };
    }
    if (r.hecho === true && r.lleva) puestas++;
    else if (r.hecho === true) sacadas++;
    else if (r.hecho === false) fallaron.push(f.id);
    else cambiaron++; // desde que se leyó la lista ya no hacía falta
  }
  const sinSacar = sacar.length + enEspera.sacar - sacadas;
  return {
    ...resumen, ...ojo(sinSacar), puestas, sacadas, cambiaron, fallidas: fallaron.length, fallaron: fallaron.slice(0, 20),
    quedan: poner.length + sacar.length - puestas - sacadas - cambiaron,
  };
}
