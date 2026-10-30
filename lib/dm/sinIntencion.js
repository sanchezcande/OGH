// La etiqueta "sin_intencion" de ManyChat (30/10, Cande: "puede el agente leer cuando hay intención CERO de compra y
// matarlo de ManyChat?"). ManyChat cobra por contacto activo y la cuenta ya pasó los 2.500. Su API no deja borrar ni
// desuscribir a nadie (solo crear, cambiar, etiquetas y campos), así que el agente le pone esta etiqueta a quien no
// tiene intención de compra y Cande los borra o desuscribe en tanda desde ManyChat, filtrando por ella.
//
// Lo peor que puede pasar es un falso positivo: alguien interesado con la etiqueta, que Cande borra. Ante la duda, NO
// la lleva.
//
// La llevan solo (criterio aprobado por Cande el 30/10):
//   - quien no es dev (estado.quien "no_dev": no tech, coqueteo, halagos, gente de citas) en una charla del agente;
//   - las charlas personales que marcó borrarCharla desde el 31/10 (dm_contactos.personal_en). Las de antes no: entre el
//     17 y el 20/10 borrarCharla marcó personal a charlas que Cande tomaba a mano (revisión del 31/10).
// Quien dijo que no le interesa sin ser dev ya está en la primera: cualquier otro quien es de la lista de abajo.
// Nunca: devs (aunque no busquen), estudiantes, empresas o founders, "no_se_sabe", compradores (la base dice que compró,
// le salió el código del pago en pesos, el contexto de la charla dice que compró o el modelo vio el pago) ni las charlas
// de Cande por otra razón que no sea personal. Tampoco, aunque el modelo diga no_dev (revisión del 31/10: el prompt
// pone callar y no_dev a un "yo quiero" suelto, a una respuesta a una historia y a todo lo que "no es para vos"):
//   - quien en algún mensaje mostró interés o habló de trabajo, de tech o del contenido de Cande (INTERES);
//   - si ya le llegó el formulario o el precio (estado.link_formulario_enviado, estado.precio_dicho) o la cuenta le
//     ofreció el programa, el 1 a 1 (frenos.ofertaDe) o una llamada (LLAMADA);
//   - quien habló de un pago o dio una señal de empresa (frenos.senales);
//   - quien contestó algo suelto que no se sabe a qué responde: una reacción, un sí, un saludo, un adjunto (esSuelto).
// En una charla personal, eso se mira con lo que había antes de que borrarCharla lo borrara (antesDeBorrar): si había
// algo de eso, queda dm_contactos.personal_dudosa y no la lleva nunca. Si deja de cumplirlo (pasa a dev, la toma
// Cande, compró), se le saca.
//
// La etiqueta se mira cuando puede cambiar (lib/dm/agente.js: el turno, el pase a Cande, la charla personal que se
// borra; lib/dm/instagram.js: sacar; lib/dm/respuestas.js: /cande y /agente; /api/dm/config: borrar, dueno y sembrar)
// y en el barrido (/api/dm/config, accion sin_intencion), que también corrige a quien la tiene y ya no la lleva.
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
// Lo que dice que algo le interesa, o que habla de trabajo, de tech o de lo que ofrece y publica Cande. Se mira en plano,
// en cualquier mensaje del lead. Es amplio a propósito: lo que entra acá solo hace que no lleve la etiqueta. Un "no me
// interesa" o un "no quiero" no cuentan como interés (con un "yo" o cualquier otra cosa de la lista, sí).
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
].join("|"));

// Una palabra de un mensaje suelto: un sí, un saludo, un gracias, una risa, un elogio a lo que hace, una pregunta
// sin más. Un mensaje hecho solo de esto (o de emojis y signos) no dice a qué responde: puede ser un dev que reacciona
// a una historia. Un halago a ella ("hermosa", "divina") no está: eso sí es coqueteo.
const SUELTA = new RegExp(`^(${[
  "s+i+", "y+e+s+", "yep", "o+k+(a+y*|i+s?|e+y*)?", "dale+", "obvio+", "claro+", "porfa+", "porfis", "plis+", "please", "pls",
  "por", "favor", "yo+", "a", "mi", "me", "aca", "aqui", "presente", "sumo", "anoto", "apunto", "tambien", "tmb", "tb", "igual",
  "info", "graci+a+s+", "thanks?", "thank", "you", "ty", "hola+s?", "buenas?", "buenos", "dias", "tardes", "noches", "hi+",
  "hello+", "hey+", "wow+", "uau+", "guau+", "genial", "top", "crack", "idola", "capa", "bien", "bueno", "excelente",
  "perfecto", "eso+", "asi", "(j+[aeiou]+)+j*", "(h+[aeiou]+)+h*", "xd+", "lol", "lmao", "jsj+", "que", "como", "donde",
  "cuando", "cual", "quien", "y", "o", "ah+", "oh+", "eh+", "uh+", "mm+",
].join("|")})$`);

// Un mensaje de la cuenta que le ofrece una llamada (lo que contesta la palabra TRABAJO desde el 31/10, lib/dm/palabraClave.js).
const LLAMADA = /\bllamadas?\b|\bagend|calendly|strategy ?\. ?opengatehub|opengatehub ?\. ?com ?\/ ?15min/;

/**
 * Si este mensaje del lead es algo suelto que no se sabe a qué responde: solo emojis o signos (una reacción a una
 * historia), solo palabras sueltas (SUELTA: "si!", "yo", "jaja", "hola", "gracias"), un adjunto o un link solo (puede
 * ser un CV o un comprobante).
 */
export function esSuelto(texto) {
  const t = String(texto ?? "").trim();
  if (/^\[adjunto/i.test(t) || /^https?:\/\/\S+$/i.test(t)) return true;
  const palabras = plano(t).replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(" ").filter(Boolean);
  return palabras.every((p) => SUELTA.test(p));
}

/**
 * Lo que en la charla dice que no lleva la etiqueta, o null. `charlaDelLead`: todo lo que escribió el lead (textos).
 * `charlaDeLaCuenta`: lo que le mandó la cuenta (el agente, Cande o un automático). `estado`: el del modelo (si ya le
 * llegó el formulario o el precio del programa).
 */
export function senalDeLaCharla({ charlaDelLead = [], charlaDeLaCuenta = [], estado = null } = {}) {
  const lead = (charlaDelLead || []).map((t) => String(t ?? ""));
  const dijo = senales(lead);
  if (dijo.pagos) return "habló de un pago";
  if (dijo.empresa || dijo.contrataDevs) return "dio una señal de empresa";
  if (lead.some((t) => INTERES.test(plano(t)))) return "mostró interés o habló de trabajo";
  if (estado?.link_formulario_enviado === true) return "le llegó el formulario";
  if (estado?.precio_dicho === true) return "le llegó el precio";
  if ((charlaDeLaCuenta || []).some((t) => ofertaDe(t) || LLAMADA.test(plano(t)))) return "la cuenta le ofreció algo";
  if (lead.some(esSuelto)) return "contestó algo suelto: no se sabe a qué";
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

/**
 * Por qué este contacto no lleva la etiqueta, o null si la lleva.
 * `quien`: lo último que dijo el modelo (estado.quien). `dueno` y `contexto`: los de dm_contactos. `personal`: una
 * charla personal que marcó borrarCharla desde el 31/10; `personalVieja`: una de antes (no la lleva); `dudosa`: al
 * borrarse había algo que dice que no (personal_dudosa). `compro`: la base dice que compró o le salió el código del pago
 * en pesos. `charlaDelLead`, `charlaDeLaCuenta` y `estado`: ver senalDeLaCharla (en una charla personal ya no hay nada
 * guardado, salvo lo que se pase de antes de borrarla).
 */
export function motivoSinIntencion({
  quien = null, personal = false, personalVieja = false, dudosa = false, dueno = null, compro = false, contexto = "",
  contextoAlta = "", charlaDelLead = [], charlaDeLaCuenta = [], estado = null,
} = {}) {
  if (compro === true) return "compró";
  if (dijoQueCompro(contexto, contextoAlta)) return "el contexto dice que compró";
  // Un dev, un estudiante, una empresa, alguien que construye algo o de quien no se sabe: nunca.
  if (quien && quien !== "no_dev") return `es ${quien}`;
  if (dudosa === true) return "al borrarse, la charla decía otra cosa";
  const senal = senalDeLaCharla({ charlaDelLead, charlaDeLaCuenta, estado });
  if (senal) return senal;
  if (personal === true) return null;
  if (personalVieja === true) return MOTIVO_PERSONAL_VIEJA;
  if (dueno !== "agente") return "es de Cande";
  if (quien !== "no_dev") return "no se sabe quién es";
  return null;
}

const lista = (x) => (Array.isArray(x) ? x : []);

/** Lo que dice una fila de paraSinIntencion (más lo de `antes`, si se borró recién), como lo pide motivoSinIntencion. */
function datosDeLaFila(f, contextoAlta, antes = null) {
  const previo = lista(f?.previo_ig);
  const textos = (quien) => previo.filter((m) => m?.quien === quien).map((m) => String(m?.texto ?? ""));
  const estado = {
    link_formulario_enviado: f.link_formulario_enviado === true || antes?.estado?.link_formulario_enviado === true,
    precio_dicho: f.precio_dicho === true || antes?.estado?.precio_dicho === true,
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
async function revisarUno({ base, manychat }, id, { contextoAlta, pagoPesos = null, antes = null } = {}) {
  if (!id || typeof base?.paraSinIntencion !== "function") return { lleva: null, hecho: null };
  const [fila] = await base.paraSinIntencion({ id: String(id) });
  // Ni la tiene, ni es personal, ni es no_dev en una charla del agente: no hay nada que mirar.
  if (!fila) return { lleva: null, hecho: null };
  const alta = contextoAlta !== undefined ? contextoAlta : (await base.ajustes())?.contexto_alta;
  const lleva = !pagoPesos && motivoSinIntencion(datosDeLaFila(fila, alta, antes)) === null;
  return { lleva, hecho: await etiquetarSinIntencion({ base, manychat }, { id: fila.id, sin_intencion_en: fila.etiquetado }, lleva) };
}

/**
 * Mira con lo que dice la base si el contacto `id` lleva la etiqueta y se la pone o se la saca (etiquetarSinIntencion).
 * `pagoPesos`: lo que el modelo vio del pago en este turno (si vio algo, no la lleva). `contextoAlta`: el ajuste, si ya
 * está a mano (si no, se lee). `antes`: lo de la charla de antes de que borrarCharla la borrara (antesDeBorrar), que
 * cuenta junto con lo que queda en la base. null si no hay nada que hacer. Nunca tira: va después de cosas que ya pasaron.
 */
export async function revisarSinIntencion(deps, id, opciones = {}) {
  try {
    return (await revisarUno(deps, id, opciones)).hecho;
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
