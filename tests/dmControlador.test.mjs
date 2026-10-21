// El controlador del agente de DM (lib/dm/controlador.js, 20/10): reglas fijas, sin modelo, que miran las charlas,
// corrigen solas lo que es seguro y le listan lo demás a Cande en el resumen de las notas. Con una base, un agente, un
// ManyChat y un Telegram de mentira (tests/dobles): ninguna prueba sale a la red ni manda un mensaje.
//
// Todos los textos de este archivo son inventados para la prueba. Este repo es público: acá no va ninguna frase de
// una charla real ni del prompt del agente (que vive en la base). Por eso tampoco van los patrones de verdad con que el
// controlador reconoce el recorrido (viven en la base, dm_config "controlador_patrones"): las pruebas le pasan unos
// inventados, PATRONES_DE_PRUEBA, con textos inventados que los cumplen.
//
// Lo que estas pruebas NO cubren: lo que hace Postgres con las consultas nuevas de lib/dm/base.js (reclamarControl,
// arranqueDelControlador, datosParaControl, guardarControl, marcarControl, borrarControl) y el índice único
// dm_salidas_control_idx. Abajo hay una revisión del texto de esas consultas; antes de subir se prueban a mano contra un
// Postgres de verdad (el 20/10, con un Postgres 16 local y el agente de verdad): que tablas() cree el índice y se pueda
// correr dos veces, que guardarControl no anote dos veces la misma clave en una charla (ON CONFLICT con el índice
// parcial) y sí en otra, que borrarControl borre solo lo que sigue corrigiendo, que reclamarControl dé la vuelta a una
// sola corrida, la suelte solo quien la tiene y la libere sola a los 6 minutos, que datosParaControl traiga las charlas
// de la bandeja por su id o su usuario de Instagram, que notasParaResumen traiga los renglones del controlador y que
// corridasEnUnDia, sinContestar (quizas_salio), salidaSinLlegar, enviadosEnLaCharla y salidasDesde no los cuenten. Y
// después de la revisión: que marcarControl le ponga la hora de ahora solo a la fila que recibe un renglón, y que
// datosParaControl traiga dueno_desde de los contactos y el detalle de las salidas. Y después de la segunda revisión
// (21/10, otra vez con un Postgres 16 local de prueba): que marcarControl deje la hora del renglón en enviado sin tocar
// creado y notasParaResumen la tome de ahí (las demás salidas siguen por su creado), que arranqueDelControlador guarde
// la hora una sola vez, que datosParaControl traiga los toques, que resumen() no cuente lo del controlador, y que
// reclamarEspera con el tope de la espera dé "lleno" con los lugares ocupados.
//
// Correr:  node --test tests/*.test.mjs
import { respuesta } from "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const C = await import("../lib/dm/controlador.js");
const { crearAgente, notaControl, DETALLE_INDICACION } = await import("../lib/dm/agente.js");
const { ESPERA_EN_PARALELO } = await import("../lib/dm/seguimientos.js");
const baseJs = await import("../lib/dm/base.js");
const { esUrgente } = await import("../lib/dm/resumen.js");
const { base: pg } = await import("./dobles/postgres.mjs");

const MIN = 60000;
const HORA = 60 * MIN;
const AHORA = new Date("2026-10-20T15:00:00Z");
const hace = (min, desde = AHORA) => new Date(desde.getTime() - min * MIN).toISOString();
const ID = "5550001";

// Patrones inventados, con la forma de los de verdad: cada uno una expresión regular sobre el texto en plano.
const PATRONES_DE_PRUEBA = {
  oferta: "te muestro el atajo\\?|te paso el mapa\\?",
  entrega: "aca va el atajo",
  pregunta_si_vio: "miraste el video de prueba",
  pide_opinion: "que opinas\\?",
  lo_ve_despues: "cuando lo mires",
  pregunta_sirve: "te suma esto",
  antes_del_precio: "tarjeta de afuera|te suma esto",
  programa: "mi taller",
  frena: "lo voy a rumiar|lo dejo en remojo",
  cierre: "sin drama|abrazo grande",
  paso_mas: "que te traba|hay garantia",
  toque: "^ey ey",
  clases: [["sos_dev", "escribis codigo"], ["busca", "andas buscando laburo"], ["como_va", "como viene eso"]],
};
const P = C.compilarPatrones(PATRONES_DE_PRUEBA);

// Frases inventadas que cumplen cada regla con esos patrones.
const OFERTA = "Uy qué garrón\nY si te muestro el atajo?";
const SI = "ok, contame vos";
const OTRA = "Antes decime, en qué país estás?";
const LO_QUE_SEGUIA = "Genial, va el formulario de prueba\nopengatehub.com/devs";

/** Una charla: [quien, texto, hace cuántos minutos], con ids seguidos desde `desde`. */
const charla = (lineas, { contacto = ID, desde = 100, ahora = AHORA } = {}) =>
  lineas.map(([quien, texto, min], i) => ({ contacto, id: desde + i, quien, texto, creado: hace(min, ahora) }));
const ultimoLeadDe = (ms) => ms.filter((m) => m.quien === "lead").at(-1);

/** El contacto de la charla, con el turno cerrado hasta lo último del lead (salvo que se diga otra cosa). */
const contactoDe = (ms, extra = {}) => ({
  id: ID, nombre: "Lead de prueba", dueno: "agente", personal: false, tomada: false, ig_id: "9001", ig_usuario: "lead.prueba",
  estado: { quien: "dev", busca: "si", dolor: "de prueba" }, toques: 0,
  ultimo_lead: ultimoLeadDe(ms)?.creado ?? null, respondido_hasta: ultimoLeadDe(ms)?.id ?? 0, ...extra,
});

/** El caso del 20/10: le ofreció algo, dijo que sí y el agente le hizo otra pregunta. */
const puenteConOtraPregunta = () => charla([
  ["lead", "hola, soy dev y busco hace un tiempo", 200],
  ["agente", "Va un mensaje automático de prueba\nY cómo te va con eso?", 199],
  ["lead", "mal, mando y mando y nada", 120],
  ["agente", OFERTA, 119],
  ["lead", SI, 60],
  ["agente", OTRA, 59],
]);

/** Una base de mentira para el controlador: lo que traería datosParaControl y lo que anota en dm_salidas. */
function baseFalsa({
  mensajes = [], contactos = null, salidas = [], pendientes = [], controles = [], ajustes = {}, config = {},
  arranque = AHORA.getTime() - 30 * 24 * HORA, lugar = () => ({ tomada: true, lleno: false }),
} = {}) {
  const b = {
    mensajes, contactos: contactos ?? (mensajes.length ? [contactoDe(mensajes)] : []), salidas, pendientes,
    filas: controles.map((x, i) => ({ id: i + 1, ...x })), llamadas: [], ocupada: false,
    config: { [C.CLAVE_PATRONES]: PATRONES_DE_PRUEBA, ...config }, arranque, lugares: [], soltadas: [],
    // La hora de la base (NOW()): guardarControl la pone al anotar y marcarControl al poner un renglón (en enviado).
    reloj: () => AHORA,
    ajustes: async () => ({ modo: "auto", bandeja: true, controlador: true, ...ajustes }),
    leerConfig: async (clave) => b.config[clave] ?? null,
    reclamarControl: async () => { b.llamadas.push("reclamar"); return !b.ocupada; },
    soltarControl: async () => { b.llamadas.push("soltar"); },
    // La primera vuelta deja la hora de la base; las siguientes la leen.
    arranqueDelControlador: async () => {
      if (b.arranque == null) b.arranque = b.reloj().getTime();
      return b.arranque;
    },
    datosParaControl: async (horas) => {
      b.llamadas.push(`datos ${horas}`);
      return { mensajes: b.mensajes, contactos: b.contactos, salidas: b.salidas, controles: b.filas.map((f) => ({ ...f })), pendientes: b.pendientes };
    },
    guardarControl: async ({ contacto, clave, estado, aviso = null, motivo = null }) => {
      if (b.filas.some((f) => f.contacto === contacto && f.detalle === clave)) return null;
      const id = (b.filas.at(-1)?.id ?? 0) + 1;
      b.filas.push({ id, contacto, detalle: clave, estado, aviso, motivo, creado: b.reloj().toISOString(), enviado: null });
      return id;
    },
    marcarControl: async (id, { estado, aviso = null, motivo = null }) => {
      Object.assign(b.filas.find((f) => f.id === id), { estado, aviso, ...(motivo ? { motivo } : {}), ...(aviso ? { enviado: b.reloj().toISOString() } : {}) });
    },
    borrarControl: async (id) => {
      b.filas = b.filas.filter((f) => !(f.id === id && f.estado === C.ESTADOS.corrigiendo));
    },
    reclamarEspera: async (id, op) => { b.lugares.push({ id, ...op }); return lugar(id); },
    soltarEspera: async (id) => { b.soltadas.push(id); },
  };
  return b;
}

/** Un agente de mentira: anota lo que le piden y contesta `resultado`. */
function agenteFalso(resultado = { hecho: "enviada", mando: 1, enviado: ["x"] }) {
  const a = { pedidos: [], procesar: async (id, disparo, op) => { a.pedidos.push({ id, disparo, ...op }); return typeof resultado === "function" ? resultado(a, id, op) : resultado; } };
  return a;
}

const controlador = (base, { agente = agenteFalso(), macViva = true, ahora = AHORA } = {}) =>
  ({ agente, controlar: C.crearControlador({ base, agente, reloj: () => ahora, macViva: async () => macViva }) });
const detectar = (mensajes, extra = {}) =>
  C.detectar({ mensajes, contactos: [contactoDe(mensajes, extra)], salidas: [], pendientes: [] }, { ahora: AHORA.getTime(), patrones: P });
const reglas = (fallas) => fallas.map((d) => `${d.regla} ${d.tipo}`);

/* ---------- F1: la oferta aceptada sin entregar ---------- */

test("F1: un sí a la oferta contestado con otra pregunta es la falla, y uno contestado con lo que seguía no", () => {
  const ms = puenteConOtraPregunta();
  const [d] = detectar(ms);
  assert.equal(d.regla, "F1");
  assert.equal(d.tipo, "otra_cosa");
  assert.equal(d.clave, `F1#${ms[3].id}`, "la ancla es la oferta: la misma en cada vuelta");
  assert.equal(d.siguiente, OTRA);
  const bien = charla([["agente", OFERTA, 70], ["lead", SI, 60], ["agente", LO_QUE_SEGUIA, 59]]);
  assert.deepEqual(reglas(detectar(bien)), [], "con lo que seguía ya dado no hay nada");
  // Lo que seguía en dos mensajes: alcanza con que alguno traiga el formulario.
  const enDos = charla([["agente", OFERTA, 70], ["lead", SI, 60], ["agente", "Buenísimo, mirá esto de prueba", 59], ["agente", "opengatehub.com/devs", 59]]);
  assert.deepEqual(reglas(detectar(enDos)), []);
  // O que alguno traiga el patrón de la entrega.
  const conEntrega = charla([["agente", OFERTA, 70], ["lead", SI, 60], ["agente", "Dale, acá va el atajo de prueba", 59]]);
  assert.deepEqual(reglas(detectar(conEntrega)), []);
});

test("F1: lo que parece un sí a la oferta y no lo es no se marca", () => {
  // Un "dale" a otra pregunta (no es la oferta).
  assert.deepEqual(reglas(detectar(charla([["agente", "Te paso un video corto de prueba?", 70], ["lead", "dale", 60], ["agente", "Ahí va", 59]]))), []);
  // Un no.
  assert.deepEqual(reglas(detectar(charla([["agente", OFERTA, 70], ["lead", "no gracias, por ahora no", 60], ["agente", "Dale!", 59]]))), []);
  // Después de la oferta preguntó otra cosa en el mismo turno: el sí puede ser a eso.
  assert.deepEqual(reglas(detectar(charla([["agente", OFERTA, 70], ["agente", "Y de dónde sos?", 70], ["lead", "sí, de un lugar de prueba", 60], ["agente", "Qué lindo", 59]]))), []);
  // La oferta que contestó con otra cosa, y el sí que vino después a otra pregunta.
  assert.deepEqual(reglas(detectar(charla([
    ["agente", OFERTA, 90], ["lead", "y vos de dónde sos?", 80], ["agente", "De lejos! Y querés un video?", 79], ["lead", "dale", 60], ["agente", "Ahí va", 59],
  ]))), []);
  for (const t of ["Sii", "dale dale", "👍", "Bueno", "me interesa", "obvio que sí"]) assert.equal(C.esSi(t), true, t);
  for (const t of ["no", "No, gracias", "sinceramente no sé", "nop"]) assert.equal(C.esSi(t), false, t);
});

test("F1: nada después del sí es falla a los 15 minutos y con el turno cerrado; abierto, lo contesta la espera", () => {
  const ms = charla([["agente", OFERTA, 70], ["lead", SI, 30]]);
  assert.deepEqual(reglas(detectar(ms)), ["F1 nada"]);
  assert.deepEqual(reglas(detectar(charla([["agente", OFERTA, 70], ["lead", SI, 10]]))), [], "todavía puede llegar");
  // Turno abierto: no lo contestó nadie todavía (la Mac apagada). No es F1: lo contesta la espera, y si pasaron dos
  // vueltas de la espera sin que nadie lo conteste, es F5.
  assert.deepEqual(reglas(detectar(ms, { respondido_hasta: 0 })), [], "la espera todavía tiene su vuelta");
  assert.deepEqual(reglas(detectar(charla([["agente", OFERTA, 90], ["lead", SI, 50]]), { respondido_hasta: 0 })), ["F5 base"]);
});

test("F1: lo que seguía y llegó más de una hora tarde queda solo para medir", () => {
  const ms = charla([["agente", OFERTA, 300], ["lead", SI, 290], ["agente", LO_QUE_SEGUIA, 100]]);
  const [d] = detectar(ms);
  assert.equal(`${d.regla} ${d.tipo}`, "F1 tarde");
  assert.equal(d.medida, true);
  assert.deepEqual(reglas(detectar(charla([["agente", OFERTA, 300], ["lead", SI, 290], ["agente", LO_QUE_SEGUIA, 280]]))), [], "a los 10 minutos está bien");
});

/* ---------- F2: vio el video con interés y no le llegó cuánto sale ---------- */

const videoConInteres = (respuesta, extra = []) => charla([
  ...extra,
  ["agente", "Miraste el video de prueba? Qué opinás?", 70],
  ["lead", "sí! me gustó mucho, muy claro", 60],
  ["agente", respuesta, 59],
]);

test("F2: le gustó el video y lo que siguió no dice cuánto sale", () => {
  assert.deepEqual(reglas(detectar(videoConInteres("Genial! Y hace cuánto programás?"))), ["F2 otra_cosa"]);
  assert.deepEqual(reglas(detectar(videoConInteres("Qué bueno! Sale 27 dólares de prueba"))), [], "con el precio está bien");
  // Ya sabía cuánto sale y lo que siguió es el paso de después.
  assert.deepEqual(reglas(detectar(videoConInteres("Y qué te falta para sumarte?", [["agente", "Son 27 dólares de prueba", 90], ["lead", "ok", 80]]))), []);
  // Si el estado no dice que busca y qué le cuesta, no se le vende: no venderle no es una falla.
  assert.deepEqual(reglas(detectar(videoConInteres("Bárbaro, y hoy andás en búsqueda?"), { estado: { quien: "dev", busca: "no_se_sabe", dolor: "" } })), []);
  assert.deepEqual(reglas(C.videoSinPrecio(charla([["agente", "Miraste el video de prueba?", 70], ["lead", "no me gustó", 60], ["agente", "Y por qué?", 59]]), {
    contacto: contactoDe([]), ahora: AHORA.getTime(), patrones: P,
  })), [], "sin interés no hay falla");
});

test("F2: las preguntas del agente para quien todavía no vio el video no cuentan, ni quien dice que lo va a ver", () => {
  // El agente calló después (o contestó otra cosa): antes se tomaba como que lo vio y le gustó.
  const caso = (lineas) => reglas(detectar(charla(lineas)));
  assert.deepEqual(caso([["agente", "Dale! cuando lo mires me avisás, qué opinás?", 70], ["lead", "Siii genial!", 60]]), []);
  assert.deepEqual(caso([["agente", "Te dejo el video corto de prueba, te da para mirarlo hoy?", 70], ["lead", "Genial, ahora lo veo!", 60]]), []);
  assert.deepEqual(caso([["agente", "Y la entrevista de prueba, qué opinás?", 70], ["lead", "me gustó", 60]]), [], "no es el video");
  // Su opinión a quien ya dijo que lo vio sí cuenta.
  assert.deepEqual(caso([
    ["agente", "Te llegó?", 90], ["lead", "sii ya lo vi", 80], ["agente", "Y qué opinás?", 70], ["lead", "me encantó, muy claro todo", 60],
  ]), ["F2 nada"]);
});

test("F2: un sí cuando se le preguntó si le sirve, después del video, también cuenta", () => {
  const conVideo = [["agente", "Te dejo el video de prueba acá", 120], ["lead", "listo, está bien", 90]];
  const sirve = (resp) => charla([...conVideo, ["agente", "Y te suma esto para lo que buscás?", 70], ["lead", "seguro que si", 60], ...resp]);
  assert.deepEqual(reglas(detectar(sirve([["agente", "Buenísimo, y de qué país sos?", 59]]))), ["F2 otra_cosa"]);
  assert.deepEqual(reglas(detectar(sirve([]))), ["F2 nada"]);
  assert.deepEqual(reglas(detectar(sirve([["agente", "Genial! Sale 27 dólares de prueba", 59]]))), []);
  // Sin video antes, o con una oferta en el mismo tramo (el sí es a la oferta), no.
  assert.deepEqual(reglas(detectar(charla([["agente", "Y te suma esto para lo que buscás?", 70], ["lead", "seguro que si", 60]]))), []);
});

test("F2: no es falla si ya sabía cuánto sale, ni si lo que siguió es una pregunta que va antes del monto", () => {
  // Se le dijo cuánto sale antes del video.
  const sabia = charla([
    ["agente", "Te cuento, sale 27 dólares de prueba", 120], ["lead", "ok, lo miro", 110],
    ["agente", "Miraste el video de prueba?", 70], ["lead", "Listo, lo vi. Me re gustó", 60], ["agente", "Genial! Querés el link de prueba?", 59],
  ]);
  assert.deepEqual(reglas(detectar(sabia)), []);
  // El estado dice que ya se le dijo, aunque la frase no esté en lo que se mira.
  assert.deepEqual(reglas(detectar(videoConInteres("Genial, qué bueno de prueba"), { estado: { quien: "dev", busca: "si", dolor: "x", precio_dicho: true } })), []);
  // Las preguntas que van antes del monto (el patrón antes_del_precio).
  assert.deepEqual(reglas(detectar(videoConInteres("Che, y tenés tarjeta de afuera de prueba?"))), []);
  assert.deepEqual(reglas(detectar(videoConInteres("Y te suma esto para lo que buscás?"))), []);
});

/* ---------- F3: pregunta repetida ---------- */

test("F3: la misma pregunta dos veces con el lead en el medio, o lo que el lead ya había contado", () => {
  const ahora = AHORA.getTime();
  const repetida = charla([["agente", "Y vos escribís código?", 90], ["lead", "jaja", 80], ["agente", "Perdón, escribís código o no?", 79]]);
  const [d] = C.preguntaRepetida(repetida, { ahora, patrones: P });
  assert.equal(`${d.regla} ${d.tipo}`, "F3 repetida");
  const yaDicho = charla([["lead", "hola! soy backend hace 3 años", 90], ["agente", "Y vos escribís código o qué hacés?", 89]]);
  assert.equal(C.preguntaRepetida(yaDicho, { ahora, patrones: P })[0].tipo, "ya_dicho");
  // Un seguimiento tiene su regla, y dos preguntas seguidas sin que el lead escriba no son una repetida.
  assert.deepEqual(C.preguntaRepetida(charla([["agente", "Y escribís código?", 90], ["lead", "jaja", 80], ["agente", "Ey ey, escribís código?", 79]]), { ahora, patrones: P }), []);
  assert.deepEqual(C.preguntaRepetida(charla([["agente", "Y escribís código?", 90], ["agente", "Perdón, escribís código?", 89], ["lead", "sí", 80]]), { ahora, patrones: P }), []);
  assert.equal(C.claseDePregunta("Y cómo viene eso?", P), "como_va");
  assert.equal(C.claseDePregunta("cómo viene eso", P), null, "sin signo de pregunta no es una pregunta");
});

/* ---------- F4: cierre prematuro ---------- */

test("F4: mostró interés y frenó, y el agente cerró sin dar un paso más", () => {
  const conLink = [["agente", "Va el formulario\nopengatehub.com/devs", 200], ["lead", "listo", 190]];
  const cierre = (resp, antes = conLink) => charla([...antes, ["lead", "me copa, lo voy a rumiar", 60], ["agente", resp, 59]]);
  assert.deepEqual(reglas(detectar(cierre("Dale, sin drama, acá estoy"))), ["F4 cierre"]);
  assert.deepEqual(reglas(detectar(cierre("Dale, y qué te traba ahora?"))), [], "con una pregunta da un paso más");
  assert.deepEqual(reglas(detectar(cierre("Dale, sin drama, igual hay 2 pagos de 13,50"))), [], "con los 2 pagos da un paso más");
  assert.deepEqual(reglas(detectar(cierre("Dale, sin drama, y hay garantía"))), [], "con el patrón paso_mas da un paso más");
  assert.deepEqual(reglas(detectar(cierre("Dale, sin drama, acá estoy", []))), [], "si nunca se le nombró el programa no es este paso");
  assert.deepEqual(reglas(detectar(cierre("Dale, sin drama, acá estoy", [["agente", "Te cuento de mi taller de prueba", 200], ["lead", "ok", 190]]))), ["F4 cierre"],
    "el programa nombrado con el patrón también cuenta");
  // Lo que escribió Cande horas después en el mismo tramo no cuenta: se mira lo que contestó el agente en el momento.
  const conCande = charla([...conLink, ["lead", "me copa, lo voy a rumiar", 600], ["agente", "Dale, sin drama, acá estoy", 599], ["cande", "Hola! qué te trabó?", 30]]);
  assert.deepEqual(reglas(detectar(conCande)), ["F4 cierre"]);
});

/* ---------- F5 y F6: el lead que espera ---------- */

test("F5: un mensaje sin atender después de dos vueltas de la espera (40 minutos) sin ninguna respuesta después", () => {
  // La espera corre cada 15 minutos y toma lo de más de 5: lo que no se pudo contestar en el momento sale en la vuelta
  // siguiente, y lo que guardó la red de la bandeja, en la otra. Antes de eso no es una falla.
  assert.equal(C.SIN_ATENDER_MS, 40 * MIN);
  const ms = charla([["agente", "Pregunta de prueba?", 60], ["lead", "respuesta de prueba", 50]]);
  const c = contactoDe(ms, { respondido_hasta: 0 });
  assert.deepEqual(reglas(C.sinAtender(ms, { contacto: c, ahora: AHORA.getTime() })), ["F5 base"]);
  const conLead = (min) => charla([["agente", "Pregunta de prueba?", 60], ["lead", "respuesta de prueba", min]]);
  const f5 = (m2) => reglas(C.sinAtender(m2, { contacto: contactoDe(m2, { respondido_hasta: 0 }), ahora: AHORA.getTime() }));
  assert.deepEqual(f5(conLead(39)), [], "a los 39 minutos la espera todavía tiene su vuelta");
  assert.deepEqual(f5(conLead(41)), ["F5 base"]);
  const salio = [{ contacto: ID, accion: "responder", estado: "enviada", creado: hace(49) }];
  assert.deepEqual(C.sinAtender(ms, { contacto: c, salidas: salio, ahora: AHORA.getTime() }), [], "una respuesta salió");
  assert.deepEqual(C.sinAtender(charla([["lead", "recién", 5]]), { contacto: c, ahora: AHORA.getTime() }), []);
  assert.deepEqual(C.sinAtender(ms, { contacto: { ...c, dueno: "cande" }, ahora: AHORA.getTime() }), [], "las de Cande las mira la bandeja");
});

test("F5: la revisión de la Mac calló la respuesta a una pregunta y nadie le contestó", () => {
  const ms = charla([["agente", "Pregunta de prueba?", 60], ["lead", "y eso cómo funciona?", 30]]);
  const c = contactoDe(ms);
  const callada = [{ id: 7, contacto: ID, accion: "callar", estado: "callo", motivo: "algo | revisión: callado", creado: hace(29) }];
  assert.deepEqual(reglas(C.calladoPorLaRevision(ms, { contacto: c, salidas: callada, ahora: AHORA.getTime() })), ["F5 revision"]);
  const despues = [...ms, { contacto: ID, id: 200, quien: "agente", texto: "Respuesta de prueba", creado: hace(10) }];
  assert.deepEqual(C.calladoPorLaRevision(despues, { contacto: c, salidas: callada, ahora: AHORA.getTime() }), [], "después le contestaron");
  const sinPregunta = charla([["agente", "Pregunta de prueba?", 60], ["lead", "jaja buenísimo", 30]]);
  assert.deepEqual(C.calladoPorLaRevision(sinPregunta, { contacto: c, salidas: callada, ahora: AHORA.getTime() }), []);
  assert.deepEqual(C.calladoPorLaRevision(ms, { contacto: c, salidas: [{ ...callada[0], motivo: "algo | revisión: ok" }], ahora: AHORA.getTime() }), []);
});

const pendiente = (min, extra = {}) => ({ igsid: "9001", usuario: "lead.prueba", mid: `mid-${min}`, creado: hace(min), texto: "texto de prueba", nota: null, ...extra });

test("F5 y F6 según la bandeja real: un mensaje que no le llegó al agente, y una charla de Cande que espera más de 6 horas", () => {
  const delAgente = contactoDe([], { dueno: "agente" });
  const deCande = contactoDe([], { dueno: "cande" });
  const ahora = AHORA.getTime();
  assert.deepEqual(reglas(C.deLaBandeja([pendiente(120, { nota: "el mensaje no le llegó al agente" })], [delAgente], { ahora })), ["F5 bandeja"]);
  assert.deepEqual(reglas(C.deLaBandeja([pendiente(7 * 60)], [deCande], { ahora })), ["F6 pase"]);
  assert.deepEqual(C.deLaBandeja([pendiente(5 * 60)], [deCande], { ahora }), [], "todavía no pasaron 6 horas");
  assert.deepEqual(C.deLaBandeja([pendiente(7 * 60)], [{ ...deCande, personal: true }], { ahora }), [], "una personal nunca");
  assert.deepEqual(C.deLaBandeja([pendiente(7 * 60, { igsid: "otro", usuario: "otra.persona" })], [deCande], { ahora }), [], "sin su charla en la base, nada");
  // Por el usuario, si todavía no se sabe su id.
  assert.deepEqual(reglas(C.deLaBandeja([pendiente(7 * 60, { igsid: "9002" })], [{ ...deCande, ig_id: null }], { ahora })), ["F6 pase"]);
  const [a] = C.deLaBandeja([pendiente(7 * 60)], [deCande], { ahora });
  const [b] = C.deLaBandeja([pendiente(7 * 60)], [deCande], { ahora: ahora + 10 * MIN });
  assert.equal(a.ancla, b.ancla, "la misma ancla en cada vuelta");
});

/* ---------- el controlador: corrige lo seguro ---------- */

test("corrige el sí a la oferta: le pide al agente lo que seguía con su indicación, una sola vez, y no lo anota para el resumen", async () => {
  const base = baseFalsa({ mensajes: puenteConOtraPregunta() });
  const { agente, controlar } = controlador(base);
  const r = await controlar();
  assert.equal(r.hecho, "listo");
  assert.equal(r.corregidas, 1);
  assert.equal(agente.pedidos.length, 1);
  assert.equal(agente.pedidos[0].id, ID);
  assert.equal(agente.pedidos[0].disparo, null);
  assert.equal(agente.pedidos[0].evento, "control");
  assert.match(agente.pedidos[0].indicacion, /todavía no le llegó lo que corresponde después de ese sí/);
  assert.match(agente.pedidos[0].indicacion, /sin hacerle otra pregunta/);
  const [fila] = base.filas;
  assert.equal(fila.detalle, "F1#103");
  assert.equal(fila.estado, C.ESTADOS.corregida);
  assert.equal(fila.aviso, null, "lo corregido no va al resumen");
  assert.match(fila.motivo, /^F1 oferta aceptada sin entregar/);
  assert.deepEqual(base.llamadas, ["reclamar", "datos 72", "soltar"]);
  // La vuelta siguiente no la vuelve a corregir.
  assert.equal((await controlar()).corregidas, 0);
  assert.equal(agente.pedidos.length, 1);
});

test("una sola vez por charla y regla: otro sí a la oferta en la misma charla ya no se corrige, va al resumen", async () => {
  const primera = puenteConOtraPregunta();
  const base = baseFalsa({ mensajes: primera });
  const { agente, controlar } = controlador(base);
  await controlar();
  base.mensajes = [...primera, ...charla([["lead", "en un país de prueba", 40], ["agente", OFERTA, 39], ["lead", "dale!", 30], ["agente", OTRA, 29]], { desde: 200 })];
  base.contactos = [contactoDe(base.mensajes)];
  const r = await controlar();
  assert.equal(agente.pedidos.length, 1);
  assert.equal(r.al_resumen, 1);
  const segunda = base.filas.find((f) => f.detalle === "F1#201");
  assert.equal(segunda.estado, C.ESTADOS.alResumen);
  assert.match(segunda.aviso, /^Controlador: dijo que sí a la oferta del agente .* No la corregí: ya corregí esta charla una vez por lo mismo\.$/);
});

test("no corrige si Cande escribió después (en la base o a mano en Instagram), ni si el lead volvió a escribir", async () => {
  // Cande le escribió desde Telegram después de la oferta.
  const conCande = [...puenteConOtraPregunta(), { contacto: ID, id: 300, quien: "cande", texto: "Hola, te escribo yo", creado: hace(30) }];
  let base = baseFalsa({ mensajes: conCande });
  let { agente, controlar } = controlador(base);
  await controlar();
  assert.equal(agente.pedidos.length, 0);
  assert.equal(base.filas[0].estado, C.ESTADOS.alResumen);
  assert.match(base.filas[0].aviso, /No la corregí: le escribiste vos\.$/);

  // El lead contestó la otra pregunta y la cuenta le contestó a eso: ya no se mete.
  const siguio = [...puenteConOtraPregunta(), ...charla([["lead", "en un país de prueba", 40], ["agente", "Qué lindo!", 39]], { desde: 300 })];
  base = baseFalsa({ mensajes: siguio });
  ({ agente, controlar } = controlador(base));
  await controlar();
  assert.equal(agente.pedidos.length, 0);
  assert.match(base.filas[0].aviso, /No la corregí: el lead escribió después\.$/);

  // El lead contestó y el agente todavía no (la espera lo va a contestar): no se anota nada, se mira de nuevo después.
  const espera = [...puenteConOtraPregunta(), ...charla([["lead", "en un país de prueba", 40]], { desde: 300 })];
  base = baseFalsa({ mensajes: espera, contactos: [contactoDe(espera, { respondido_hasta: 105 })] });
  ({ agente, controlar } = controlador(base));
  const r = await controlar();
  assert.equal(agente.pedidos.length, 0);
  assert.equal(base.filas.filter((f) => f.detalle.startsWith("F1")).length, 0);
  assert.equal(r.esperan, 1);
  // Y si después el agente le dio lo que seguía, queda solo para medir.
  base.mensajes = [...espera, ...charla([["agente", LO_QUE_SEGUIA, 30]], { desde: 400 })];
  base.contactos = [contactoDe(base.mensajes)];
  await controlar();
  assert.equal(base.filas.find((f) => f.detalle === "F1#103").estado, C.ESTADOS.medida);
});

test("la ventana de 23 horas: pasado eso no se corrige, va al resumen", async () => {
  const viejo = charla([["agente", OFERTA, 23 * 60 + 40], ["lead", SI, 23 * 60 + 20], ["agente", OTRA, 23 * 60 + 19]]);
  const base = baseFalsa({ mensajes: viejo });
  const { agente, controlar } = controlador(base);
  await controlar();
  assert.equal(agente.pedidos.length, 0);
  assert.match(base.filas[0].aviso, /No la corregí: pasó el día: el agente ya no le puede escribir\.$/);
  assert.deepEqual(C.decidirCorreccion(C.detectar({ mensajes: viejo, contactos: [contactoDe(viejo)] }, { ahora: AHORA.getTime(), patrones: P })[0], {
    contacto: contactoDe(viejo, { ultimo_lead: hace(22 * 60) }), mensajes: viejo, ahora: AHORA.getTime(),
  }), { si: true }, "a las 22 horas sí");
});

test("lo que se arregla esperando no se anota: la Mac apagada, otra corrida en la charla, una respuesta por salir, el agente sin automático", async () => {
  const ms = puenteConOtraPregunta();
  for (const [que, opciones] of [
    ["la Mac apagada", { macViva: false }],
    ["otra corrida", { contactos: [contactoDe(ms, { tomada: true })] }],
    ["una respuesta por salir", { salidas: [{ contacto: ID, accion: "responder", estado: "pendiente", creado: hace(1) }] }],
    ["en sombra", { ajustes: { modo: "sombra" } }],
  ]) {
    const base = baseFalsa({ mensajes: ms, ...opciones });
    const { agente, controlar } = controlador(base, { macViva: opciones.macViva ?? true });
    const r = await controlar();
    assert.equal(agente.pedidos.length, 0, que);
    assert.equal(base.filas.length, 0, que);
    assert.equal(r.esperan, 1, que);
  }
  // Cuando la Mac vuelve, se corrige.
  const base = baseFalsa({ mensajes: ms });
  const apagada = controlador(base, { macViva: false });
  await apagada.controlar();
  const prendida = controlador(base, { agente: apagada.agente, macViva: true });
  assert.equal((await prendida.controlar()).corregidas, 1);
});

test("no corrige a quien contó una crisis, pidió que no le escriban, dio una señal de empresa o no es dev", async () => {
  for (const [que, lead, estado] of [
    ["crisis", "estoy con depresión hace meses", null],
    ["baja", "no me escribas más después", null],
    ["empresa", "tengo una agencia chiquita", null],
    ["no es dev", "hola", { quien: "no_dev" }],
    ["construye", "hola", { quien: "construye" }],
  ]) {
    const ms = [...charla([["lead", lead, 300]], { desde: 50 }), ...puenteConOtraPregunta()];
    const base = baseFalsa({ mensajes: ms, contactos: [contactoDe(ms, estado ? { estado } : {})] });
    const { agente, controlar } = controlador(base);
    await controlar();
    assert.equal(agente.pedidos.length, 0, que);
    assert.match(base.filas[0].aviso, /No la corregí: /, que);
  }
});

test("si la corrección no sale (se frena, calla), no se reintenta: va al resumen con el porqué", async () => {
  const base = baseFalsa({ mensajes: puenteConOtraPregunta() });
  const { agente, controlar } = controlador(base, { agente: agenteFalso({ hecho: "frenada", motivo: "promete un plazo" }) });
  const r = await controlar();
  assert.equal(r.sin_corregir, 1);
  assert.equal(base.filas[0].estado, C.ESTADOS.sinCorregir);
  assert.match(base.filas[0].aviso, /^Controlador: dijo que sí a la oferta del agente .* No la pude corregir: lo frené: promete un plazo\.$/);
  await controlador(base, { agente }).controlar();
  assert.equal(agente.pedidos.length, 1, "no se reintenta");
  // Una que quedó a medias (la función murió): al resumen, sin saber si salió.
  const colgada = baseFalsa({ controles: [{ contacto: ID, detalle: "F1#103", estado: C.ESTADOS.corrigiendo, creado: hace(20) }] });
  await controlador(colgada).controlar();
  assert.equal(colgada.filas[0].estado, C.ESTADOS.sinCorregir);
  assert.match(colgada.filas[0].aviso, /quedó a medias/);
});

test("si la corrección salió pero no trajo lo que seguía, la vuelta siguiente lo ve y va al resumen; nunca se pide otra", async () => {
  const ms = puenteConOtraPregunta();
  const base = baseFalsa({ mensajes: ms });
  const { agente, controlar } = controlador(base);
  await controlar();
  assert.equal(base.filas[0].estado, C.ESTADOS.corregida);
  // Lo que salió fue otra cosa, sin el formulario.
  base.mensajes = [...ms, ...charla([["agente", "Bueno, igual contame más de vos", 0]], { desde: 300 })];
  base.contactos = [contactoDe(base.mensajes)];
  const r = await controlar();
  assert.equal(r.sin_corregir, 1);
  assert.equal(base.filas[0].estado, C.ESTADOS.sinCorregir);
  assert.match(base.filas[0].aviso, /lo que salió tampoco lo trae\.$/);
  assert.equal(agente.pedidos.length, 1);
  // Si lo que salió sí lo traía, queda corregida.
  const bien = baseFalsa({ mensajes: ms });
  const otro = controlador(bien);
  await otro.controlar();
  bien.mensajes = [...ms, ...charla([["agente", LO_QUE_SEGUIA, 0]], { desde: 300 })];
  bien.contactos = [contactoDe(bien.mensajes)];
  await otro.controlar();
  assert.equal(bien.filas[0].estado, C.ESTADOS.corregida);
  assert.equal(C.porQueNoCorregi({ hecho: "de Cande por Instagram", motivo: "le escribiste vos" }), "le escribiste vos");
  assert.match(C.porQueNoCorregi({ hecho: "frenada", motivo: "promete un plazo" }), /lo frené: promete un plazo/);
});

test("si otra corrida tenía la charla (el cron de los toques), no pasó nada: la corrección no se gasta y se intenta en la vuelta siguiente", async () => {
  const base = baseFalsa({ mensajes: puenteConOtraPregunta() });
  let vez = 0;
  const { agente, controlar } = controlador(base, { agente: agenteFalso(() => (++vez === 1 ? { hecho: "otra corrida lo tiene" } : { hecho: "enviada", mando: 1 })) });
  const r = await controlar();
  assert.equal(r.esperan, 1);
  assert.deepEqual(r.fallas, {});
  assert.deepEqual(base.filas, [], "no quedó anotada");
  assert.equal((await controlar()).corregidas, 1);
  assert.equal(agente.pedidos.length, 2);
  assert.equal(base.filas[0].estado, C.ESTADOS.corregida);
});

test("corrige el video con interés sin precio pidiendo cuánto sale; si el agente le hizo otra pregunta, no se la pisa", async () => {
  const base = baseFalsa({ mensajes: videoConInteres("Genial, qué bueno de prueba") });
  const { agente, controlar } = controlador(base);
  assert.equal((await controlar()).corregidas, 1);
  assert.match(agente.pedidos[0].indicacion, /no le llegó cuánto sale/);
  assert.match(agente.pedidos[0].indicacion, /antes del monto según de dónde es/, "lo que va antes del monto según de dónde es, primero");
  assert.equal(base.filas[0].detalle, "F2#101");
  // Con otra pregunta en el medio (puede ser una de las que van antes del monto): al resumen, sin corregir.
  const conPregunta = baseFalsa({ mensajes: videoConInteres("Genial! Y hace cuánto programás?") });
  const otro = controlador(conPregunta);
  const r = await otro.controlar();
  assert.equal(otro.agente.pedidos.length, 0);
  assert.equal(r.al_resumen, 1);
  assert.match(conPregunta.filas[0].aviso, /No la corregí: el agente le hizo otra pregunta y no se la piso\.$/);
});

test("F2 no se corrige en el turno en que contó que se quedó sin trabajo", async () => {
  const ms = charla([["agente", "Miraste el video de prueba?", 70], ["lead", "sí, me gustó mucho. Igual me quedé sin trabajo la semana pasada", 60]]);
  const [d] = detectar(ms);
  assert.equal(`${d.regla} ${d.tipo}`, "F2 nada");
  assert.deepEqual(C.decidirCorreccion(d, { contacto: contactoDe(ms), mensajes: ms, ahora: AHORA.getTime() }), { no: "contó que se quedó sin trabajo" });
});

test("una sola corrección por charla en cada vuelta: el sí a la oferta y el video en el mismo turno no salen seguidos", async () => {
  // Le ofreció algo, dijo que sí y que ya vio el video y le encantó, y el agente calló: F1 y F2 a la vez.
  const ms = charla([["agente", OFERTA, 70], ["lead", "Sii! y ya vi el video de prueba, me encantó", 60]]);
  assert.deepEqual(reglas(detectar(ms)), ["F1 nada", "F2 nada"]);
  const base = baseFalsa({ mensajes: ms });
  const { agente, controlar } = controlador(base);
  const r = await controlar();
  assert.equal(agente.pedidos.length, 1, "una sola");
  assert.equal(agente.pedidos[0].indicacion, C.indicacionPara({ regla: "F1", tipo: "nada", dijo: ms[1].texto }));
  assert.equal(r.esperan, 1, "la otra queda para la vuelta siguiente");
  assert.equal(base.filas.length, 1);
  // Salió lo que seguía y el lead no contestó: la del video ya no se corrige (sería el segundo mensaje seguido).
  base.mensajes = [...ms, ...charla([["agente", LO_QUE_SEGUIA, 0]], { desde: 300 })];
  base.contactos = [contactoDe(base.mensajes)];
  await controlar();
  assert.equal(agente.pedidos.length, 1);
  const video = base.filas.find((f) => f.detalle.startsWith("F2"));
  assert.equal(video.estado, C.ESTADOS.alResumen);
  assert.match(video.aviso, /No la corregí: ya le mandé otra corrección después y no contestó\.$/);
});

test("no corrige una charla que pasó por Cande después de la falla, ni encima de lo que salió con una indicación suya", () => {
  const ms = puenteConOtraPregunta();
  const [d] = detectar(ms);
  const decidir = (extra = {}, mensajes = ms, salidas = []) =>
    C.decidirCorreccion(d, { contacto: contactoDe(ms, extra), mensajes, salidas, ahora: AHORA.getTime() });
  assert.deepEqual(decidir(), { si: true });
  // La sacó la vuelta de Instagram (escribió a mano) y la devolvió con /agente: lo que mandó a mano no está en la base.
  assert.deepEqual(decidir({ dueno_desde: hace(20) }), { no: "pasó por vos después" });
  assert.deepEqual(decidir({ dueno_desde: hace(300) }), { si: true }, "si la devolvió antes, no cuenta");
  // La nota que deja esa vuelta, o la devolución desde Telegram.
  for (const nota of ["La charla quedó de Cande: le escribiste vos", "Cande llevó esta charla a mano: lo de prueba"]) {
    assert.deepEqual(decidir({}, [...ms, { contacto: ID, id: 300, quien: "sistema", texto: nota, creado: hace(30) }]), { no: "le escribiste vos" });
  }
  // Lo que salió con una indicación de Cande desde Telegram queda como del agente: lo decidió ella.
  const indicacion = { contacto: ID, accion: "responder", estado: "enviada", detalle: DETALLE_INDICACION, creado: hace(59) };
  assert.deepEqual(decidir({}, ms, [indicacion]), { no: "le diste una indicación desde Telegram" });
  assert.deepEqual(decidir({}, ms, [{ ...indicacion, creado: hace(200) }]), { si: true }, "una de antes de la oferta, no");
});

test("el controlador arranca en el mismo minuto que los toques: si a la charla le toca un seguimiento, va primero y la corrección no sale después", async () => {
  const ms = puenteConOtraPregunta();
  const [d] = detectar(ms);
  const decidir = (extra, toques = true) =>
    C.decidirCorreccion(d, { contacto: contactoDe(ms, extra), mensajes: ms, ahora: AHORA.getTime(), toques });
  const enMin = (min) => new Date(AHORA.getTime() + min * MIN).toISOString();
  assert.deepEqual(decidir({ proximo_toque: null }), { si: true });
  const espera = { espera: "le toca un seguimiento: va primero" };
  assert.deepEqual(decidir({ proximo_toque: enMin(-5) }), espera, "vencido: lo manda el cron de los toques en esta vuelta");
  assert.deepEqual(decidir({ proximo_toque: enMin(14) }), espera, "antes de la vuelta siguiente: también va primero");
  assert.deepEqual(decidir({ proximo_toque: enMin(16) }), { si: true }, "más adelante: la corrección lo corre (el agente lo vuelve a agendar)");
  assert.deepEqual(decidir({ proximo_toque: enMin(-5) }, false), { si: true }, "con los toques apagados no sale ninguno");
  // De noche en Argentina (las 2 de la mañana) no sale ningún seguimiento: la corrección no lo espera.
  const deNoche = new Date("2026-10-20T05:00:00Z");
  const ms2 = charla([["agente", OFERTA, 70], ["lead", SI, 30], ["agente", OTRA, 29]], { ahora: deNoche });
  const [d2] = C.detectar({ mensajes: ms2, contactos: [contactoDe(ms2)] }, { ahora: deNoche.getTime(), patrones: P });
  const c2 = contactoDe(ms2, { proximo_toque: new Date(deNoche.getTime() - 5 * MIN).toISOString() });
  assert.deepEqual(C.decidirCorreccion(d2, { contacto: c2, mensajes: ms2, ahora: deNoche.getTime(), toques: true }), { si: true });

  // La vuelta entera: con el seguimiento por salir, nada; en la vuelta siguiente ya salió, y la corrección no va.
  const base = baseFalsa({ mensajes: ms, contactos: [contactoDe(ms, { proximo_toque: enMin(-5) })], ajustes: { toques: true } });
  const { agente, controlar } = controlador(base);
  const r = await controlar();
  assert.equal(agente.pedidos.length, 0);
  assert.equal(r.esperan, 1);
  assert.equal(base.filas.length, 0, "no queda anotada: se decide de nuevo en la vuelta siguiente");
  base.contactos = [contactoDe(ms, { proximo_toque: null, toques: 1 })];
  await controlar();
  assert.equal(agente.pedidos.length, 0, "nunca dos mensajes seguidos sin que el lead conteste");
  assert.equal(base.filas[0].estado, C.ESTADOS.alResumen);
  assert.match(base.filas[0].aviso, /No la corregí: ya le volvió a escribir la cuenta después\.$/);
});

test("F1: la oferta que hizo Cande en una charla del agente también cuenta", async () => {
  const ms = charla([["cande", OFERTA, 70], ["lead", SI, 60], ["agente", OTRA, 59]]);
  assert.deepEqual(reglas(detectar(ms)), ["F1 otra_cosa"]);
  assert.deepEqual(reglas(detectar(ms, { dueno: "cande" })), [], "en una charla de Cande, lo que ella ofrece lo sigue ella");
  const base = baseFalsa({ mensajes: ms });
  assert.equal((await controlador(base).controlar()).corregidas, 1);
});

test("un renglón que se pone en otra vuelta lleva su hora: no se pierde si la fila es de antes del corte del resumen", async () => {
  const ms = puenteConOtraPregunta();
  const base = baseFalsa({ mensajes: ms });
  await controlador(base).controlar();
  assert.equal(base.filas[0].estado, C.ESTADOS.corregida);
  const creado = base.filas[0].creado;
  // El resumen corta entre las dos vueltas.
  const corte = new Date(AHORA.getTime() + 5 * MIN);
  const despues = new Date(AHORA.getTime() + 10 * MIN);
  base.mensajes = [...ms, ...charla([["agente", "Bueno, igual contame más de vos", 0]], { desde: 300 })];
  base.contactos = [contactoDe(base.mensajes)];
  base.reloj = () => despues;
  await controlador(base, { ahora: despues }).controlar();
  assert.equal(base.filas[0].estado, C.ESTADOS.sinCorregir);
  assert.ok(new Date(base.filas[0].enviado) > corte, "entra en el resumen siguiente (notasParaResumen toma esta hora)");
  assert.equal(base.filas[0].creado, creado, "la hora de la corrección no cambia");
});

test("F5 y F6 de la bandeja: no si la base ya tiene la respuesta, ni una despedida o un adjunto después de un cierre", () => {
  const ahora = AHORA.getTime();
  const deCande = contactoDe([], { dueno: "cande" });
  const cierre = charla([["lead", "dale, gracias por todo", 8 * 60 + 10], ["cande", "Un placer de prueba, éxitos!", 8 * 60]]);
  const ver = (p, mensajes) => reglas(C.deLaBandeja([p], [deCande], { ahora, mensajes }));
  assert.deepEqual(ver(pendiente(7 * 60), cierre), ["F6 pase"]);
  assert.deepEqual(ver(pendiente(7 * 60, { texto: "Igualmente! que tengas buen finde" }), cierre), []);
  assert.deepEqual(ver(pendiente(7 * 60, { texto: "[adjunto o mensaje sin texto]" }), cierre), []);
  assert.deepEqual(ver(pendiente(7 * 60, { texto: "gracias! y cuánto dura?" }), cierre), ["F6 pase"], "con una pregunta espera");
  // Si después del cierre Cande tuvo la charla (escribió a mano: no está en la base), no se sabe qué fue lo último.
  const aMano = [...cierre, { contacto: ID, id: 400, quien: "sistema", texto: "La charla quedó de Cande: le escribiste vos", creado: hace(7 * 60 + 30) }];
  assert.deepEqual(ver(pendiente(7 * 60, { texto: "[adjunto o mensaje sin texto]" }), aMano), ["F6 pase"]);
  // La cuenta le contestó (desde Telegram) y la bandeja todavía no lo vio.
  const contestada = [...cierre, ...charla([["cande", "Respuesta de prueba", 6 * 60]], { desde: 300 })];
  assert.deepEqual(ver(pendiente(7 * 60), contestada), []);
  // Y las dos quedan solo para medir.
  const [d] = C.deLaBandeja([pendiente(7 * 60)], [deCande], { ahora });
  assert.equal(d.medida, true);
});

test("como mucho 3 correcciones por vuelta, y ninguna pasada la hora: las demás quedan para la siguiente", async () => {
  const mensajes = [];
  const contactos = [];
  for (let n = 0; n < 4; n++) {
    const id = `555000${n + 2}`;
    const ms = charla([["agente", OFERTA, 70], ["lead", SI, 60], ["agente", OTRA, 59]], { contacto: id, desde: 100 + n * 10 });
    mensajes.push(...ms);
    contactos.push({ ...contactoDe(ms), id });
  }
  const base = baseFalsa({ mensajes, contactos });
  const { agente, controlar } = controlador(base);
  const r = await controlar();
  assert.equal(agente.pedidos.length, C.CORRECCIONES_POR_VUELTA);
  assert.equal(r.esperan, 1);
  assert.equal((await controlar()).corregidas, 1);
  const tarde = baseFalsa({ mensajes: puenteConOtraPregunta() });
  const sinTiempo = controlador(tarde);
  await sinTiempo.controlar({ hasta: 0 });
  assert.equal(sinTiempo.agente.pedidos.length, 0);
  assert.equal(tarde.filas.length, 0);
});

/* ---------- el controlador: lo demás va al resumen ---------- */

test("lo que no se corrige va al resumen de las notas: un renglón 'Controlador:' por charla y falla, sin sonido", async () => {
  const conLink = [["agente", "Va el formulario\nopengatehub.com/devs", 200], ["lead", "listo", 190], ["lead", "me copa, lo voy a rumiar", 60], ["agente", "Dale, sin drama, acá estoy", 59]];
  const base = baseFalsa({ mensajes: charla(conLink) });
  const { agente, controlar } = controlador(base);
  const r = await controlar();
  assert.equal(agente.pedidos.length, 0, "un cierre prematuro no se corrige solo: es plata");
  assert.deepEqual(r.fallas, { F4: 1 });
  const [fila] = base.filas;
  assert.equal(fila.estado, C.ESTADOS.alResumen);
  assert.match(fila.aviso, /^Controlador: mostró interés y frenó/);
  assert.equal(esUrgente(fila.aviso), false, "no suena: va al resumen");
  await controlar();
  assert.equal(base.filas.length, 1, "una sola vez");
});

test("F5 de la bandeja y F6 quedan solo para medir: ya salen en el resumen de la bandeja; una F5 de la base sale del resumen cuando le contestan", async () => {
  const deCande = contactoDe([], { dueno: "cande" });
  const base = baseFalsa({ contactos: [deCande], pendientes: [pendiente(7 * 60)] });
  const r = await controlador(base).controlar();
  assert.equal(r.medidas, 1);
  assert.deepEqual(r.fallas, { F6: 1 });
  assert.equal(base.filas[0].estado, C.ESTADOS.medida);
  assert.equal(base.filas[0].aviso, null, "no se repite en el resumen de las notas");
  assert.equal(base.filas[0].motivo, `F6 pase a Cande sin respuesta: pase (${C.EN_LA_BANDEJA})`);
  const delAgente = baseFalsa({ contactos: [contactoDe([])], pendientes: [pendiente(120, { nota: "el mensaje no le llegó al agente" })] });
  await controlador(delAgente).controlar();
  assert.equal(delAgente.filas[0].estado, C.ESTADOS.medida);
  assert.equal(delAgente.filas[0].aviso, null);

  // Una F5 de la base (la Mac apagada): al resumen; cuando la espera la contesta, el renglón sale.
  const ms = charla([["agente", "Pregunta de prueba?", 60], ["lead", "respuesta de prueba", 50]]);
  const abierta = baseFalsa({ mensajes: ms, contactos: [contactoDe(ms, { respondido_hasta: 0 })] });
  const ctl = controlador(abierta, { macViva: false });
  await ctl.controlar();
  assert.equal(abierta.filas[0].estado, C.ESTADOS.alResumen);
  assert.match(abierta.filas[0].aviso, /^Controlador: escribió hace 50 min .*la Mac no está contestando/);
  abierta.contactos = [contactoDe(ms)];
  assert.equal((await ctl.controlar()).resueltas, 1);
  assert.equal(abierta.filas[0].estado, C.ESTADOS.resuelta);
  assert.equal(abierta.filas[0].aviso, null);
});

test("una F5 de la base con la Mac prendida entre una ventana y la otra no dice que la Mac no contesta (21/10: era un aviso falso)", async () => {
  // La Mac escucha en una ventana de cada cuarto de hora: que no escuche en este momento no es que esté apagada.
  const ms = charla([["agente", "Pregunta de prueba?", 60], ["lead", "respuesta de prueba", 50]]);
  const abierta = baseFalsa({ mensajes: ms, contactos: [contactoDe(ms, { respondido_hasta: 0 })] });
  const ctl = C.crearControlador({
    base: abierta, agente: agenteFalso(), reloj: () => AHORA, macViva: async () => false, macEncendida: async () => true,
  });
  await ctl();
  assert.equal(abierta.filas[0].estado, C.ESTADOS.alResumen);
  assert.match(abierta.filas[0].aviso, /^Controlador: escribió hace 50 min .*: la espera no lo tomó\.$/);
  assert.doesNotMatch(abierta.filas[0].aviso, /la Mac/);
  assert.match(C.queDecir({ regla: "F5", tipo: "base", dijo: "algo", edad: 50 * 60000 }, { macEncendida: false }), /está apagada/);
});

test("en una charla de Cande, 'ya la contestaste vos' pide una prueba: un mensaje de la cuenta en la base después de la falla", async () => {
  const ms = charla([["agente", OFERTA, 70], ["lead", SI, 60]]);
  // La bandeja no la tiene esperando (la sigue, o contestó un automático): eso no prueba que Cande le contestó.
  const sinPrueba = baseFalsa({ mensajes: ms, contactos: [contactoDe(ms, { dueno: "cande" })], pendientes: [] });
  await controlador(sinPrueba).controlar();
  assert.equal(sinPrueba.filas[0].estado, C.ESTADOS.alResumen);
  assert.match(sinPrueba.filas[0].aviso, /No la corregí: la charla es tuya\. Si ya le contestaste, ignoralo\.$/);
  // Con su respuesta en la base (desde Telegram), solo para medir.
  const conPrueba = [...ms, ...charla([["cande", "Hola! te cuento yo de prueba", 40]], { desde: 300 })];
  const contestada = baseFalsa({ mensajes: conPrueba, contactos: [contactoDe(conPrueba, { dueno: "cande" })] });
  await controlador(contestada).controlar();
  assert.equal(contestada.filas[0].estado, C.ESTADOS.medida);
  assert.match(contestada.filas[0].motivo, /ya la contestaste vos/);
  // Las otras pruebas: la nota de la vuelta de Instagram que la vio escribir a mano, y una indicación suya. Un mensaje
  // del agente no prueba nada: puede ser justo la respuesta que falló.
  const deCande = contactoDe(ms, { dueno: "cande" });
  const nota = { contacto: ID, id: 300, quien: "sistema", texto: "La charla quedó de Cande: le escribiste vos", creado: hace(40) };
  const delAgente = { contacto: ID, id: 301, quien: "agente", texto: OTRA, creado: hace(50) };
  const indicacion = { contacto: ID, accion: "responder", estado: "enviada", detalle: DETALLE_INDICACION, creado: hace(40) };
  const desde = AHORA.getTime() - 60 * MIN;
  assert.equal(C.contestoCande(deCande, { mensajes: [...ms, nota], desde }), true);
  assert.equal(C.contestoCande(deCande, { mensajes: ms, salidas: [indicacion], desde }), true);
  assert.equal(C.contestoCande(deCande, { mensajes: [...ms, delAgente], desde }), false);
  assert.equal(C.contestoCande({ ...deCande, dueno: "agente" }, { mensajes: [...ms, nota], desde }), false);
  // Y si la respuesta aparece después de anotada, el renglón sale del resumen.
  const despues = new Date(AHORA.getTime() + 20 * MIN);
  sinPrueba.mensajes = [...ms, ...charla([["cande", "Hola! te cuento yo de prueba", -10]], { desde: 300 })];
  sinPrueba.reloj = () => despues;
  assert.equal((await controlador(sinPrueba, { ahora: despues }).controlar()).resueltas, 1);
  assert.equal(sinPrueba.filas[0].estado, C.ESTADOS.resuelta);
  assert.equal(sinPrueba.filas[0].aviso, null);
});

test("con el ajuste apagado no hace nada, y si otra vuelta lo tiene tampoco", async () => {
  const base = baseFalsa({ mensajes: puenteConOtraPregunta(), ajustes: { controlador: false } });
  const { agente, controlar } = controlador(base);
  assert.equal((await controlar()).hecho, "apagado");
  assert.deepEqual(base.llamadas, [], "ni siquiera mira las charlas");
  assert.equal(agente.pedidos.length, 0);
  const ocupada = baseFalsa({ mensajes: puenteConOtraPregunta() });
  ocupada.ocupada = true;
  const otra = controlador(ocupada);
  assert.equal((await otra.controlar()).hecho, "otra vuelta lo tiene");
  assert.equal(otra.agente.pedidos.length, 0);
  assert.equal(baseJs.AJUSTES_POR_DEFECTO.controlador, true, "prendido de fábrica");
  assert.equal(baseJs.validarAjustes({ controlador: "no" }).ok, false);
  assert.equal(baseJs.validarAjustes({ controlador: false }).ok, true);
});

/* ---------- después de la segunda revisión (21/10) ---------- */

test("no corrige si la cuenta ya le volvió a escribir después (un seguimiento o un automático): serían dos mensajes seguidos", async () => {
  // El seguimiento quedó en el mismo tramo de la cuenta, más de 10 minutos después de la otra pregunta.
  const conToque = [...puenteConOtraPregunta(), ...charla([["agente", "Ey ey, seguís por ahí?", 10]], { desde: 300 })];
  const [d] = detectar(conToque);
  assert.equal(`${d.regla} ${d.tipo}`, "F1 otra_cosa");
  assert.equal(d.cuentaDespues, true);
  let base = baseFalsa({ mensajes: conToque, contactos: [contactoDe(conToque, { toques: 1 })] });
  let { agente, controlar } = controlador(base);
  await controlar();
  assert.equal(agente.pedidos.length, 0);
  assert.match(base.filas[0].aviso, /No la corregí: ya le volvió a escribir la cuenta después\.$/);
  // Un automático en el mismo tramo, sin seguimientos contados.
  const conAutomatico = [...puenteConOtraPregunta(), ...charla([["automatico", "Mensaje fijo de prueba", 50]], { desde: 300 })];
  base = baseFalsa({ mensajes: conAutomatico });
  ({ agente, controlar } = controlador(base));
  await controlar();
  assert.equal(agente.pedidos.length, 0, "un automático también es otro mensaje de la cuenta");
  // El sí sin nada después, y lo que salió después fue un seguimiento: la falla queda "otra cosa" con el seguimiento
  // como lo que le llegó, y los toques contados lo frenan.
  const soloToque = charla([["agente", OFERTA, 300], ["lead", SI, 290], ["agente", "Ey ey, seguís por ahí?", 20]]);
  base = baseFalsa({ mensajes: soloToque, contactos: [contactoDe(soloToque, { toques: 1 })] });
  ({ agente, controlar } = controlador(base));
  await controlar();
  assert.equal(agente.pedidos.length, 0);
  // La carrera: el seguimiento tomó la charla mientras el controlador iba a corregir. No pasó nada, y la vuelta
  // siguiente ve el seguimiento que salió y ya no corrige encima.
  const ms = puenteConOtraPregunta();
  base = baseFalsa({ mensajes: ms });
  const carrera = agenteFalso(() => {
    base.mensajes = [...ms, ...charla([["agente", "Ey ey, seguís por ahí?", 0]], { desde: 300 })];
    base.contactos = [contactoDe(base.mensajes, { toques: 1 })];
    return { hecho: "otra corrida lo tiene" };
  });
  ({ controlar } = controlador(base, { agente: carrera }));
  assert.equal((await controlar()).esperan, 1);
  assert.deepEqual(base.filas, []);
  await controlar();
  assert.equal(carrera.pedidos.length, 1, "no se pide otra corrección encima del seguimiento");
  assert.equal(base.filas[0].estado, C.ESTADOS.alResumen);
});

test("cada corrección le dice al agente hasta dónde miró la charla; si después se escribió algo, el agente no corrige y se decide de nuevo", async () => {
  // Dos charlas con la misma falla. Mientras se corrige la primera, el lead de la segunda dice que no y la entrada le
  // contesta: lo que el controlador decidió para la segunda ya no vale.
  const A = "5550011";
  const B = "5550012";
  const msA = charla([["agente", OFERTA, 70], ["lead", SI, 60], ["agente", OTRA, 59]], { contacto: A, desde: 100 });
  const msB = charla([["agente", OFERTA, 70], ["lead", SI, 60], ["agente", OTRA, 59]], { contacto: B, desde: 200 });
  const base = baseFalsa({ mensajes: [...msA, ...msB], contactos: [{ ...contactoDe(msA), id: A }, { ...contactoDe(msB), id: B }] });
  const enLaBase = (id) => base.mensajes.filter((m) => m.contacto === id);
  const agente = agenteFalso((a, id, op) => {
    if (id === A) {
      const nuevos = charla([["lead", "no gracias, ya no me interesa", 1], ["agente", "Dale, éxitos!", 0]], { contacto: B, desde: 300 });
      base.mensajes = [...base.mensajes, ...nuevos];
      base.contactos = base.contactos.map((c) => (c.id === B ? { ...c, respondido_hasta: 300, ultimo_lead: nuevos[0].creado } : c));
    }
    // Lo que hace el agente de verdad con vistoHasta (ver la prueba del turno 'control' de abajo).
    if (op.vistoHasta == null || enLaBase(id).some((m) => m.id > op.vistoHasta)) return { hecho: "la charla cambió" };
    return { hecho: "enviada", mando: 1 };
  });
  const { controlar } = controlador(base, { agente });
  const r = await controlar();
  assert.deepEqual(agente.pedidos.map((p) => [p.id, p.vistoHasta]), [[A, 102], [B, 202]], "lo último que vio de cada charla");
  assert.equal(r.corregidas, 1);
  assert.equal(r.esperan, 1, "la segunda no se gastó");
  assert.deepEqual(base.filas.map((f) => [f.contacto, f.estado]), [[A, C.ESTADOS.corregida]]);
  // La vuelta siguiente la ve como es: el lead escribió después.
  await controlar();
  assert.equal(agente.pedidos.length, 2);
  assert.match(base.filas.find((f) => f.contacto === B).aviso, /No la corregí: el lead escribió después\.$/);
});

test("el turno 'control' no sale si en la charla se escribió algo después de lo que miró el controlador", async () => {
  const ms = puenteConOtraPregunta();
  const { agente, m } = agenteDeVerdad({ mensajes: ms });
  // Después de la foto del controlador (hasta la otra pregunta, el 105) salió un seguimiento.
  m.mensajes.push({ contacto: ID, id: 106, quien: "agente", texto: "Ey ey, seguís por ahí?", creado: AHORA.toISOString() });
  const r = await agente.procesar(ID, null, { evento: "control", indicacion: "indicación de prueba del controlador", vistoHasta: 105 });
  assert.equal(r.hecho, "la charla cambió");
  assert.equal(m.pedidos.length, 0, "ni se le pide al modelo");
  assert.deepEqual(m.enviados, []);
  // Con la charla como la vio, sale.
  const igual = agenteDeVerdad({ mensajes: ms });
  assert.equal((await igual.agente.procesar(ID, null, { evento: "control", indicacion: "x", vistoHasta: 105 })).hecho, "enviada");
});

test("no corrige encima de un borrador del agente en sombra: Cande pudo haberlo mandado a mano", async () => {
  const ms = charla([["agente", OFERTA, 70], ["lead", SI, 60]]);
  const borrador = { contacto: ID, accion: "responder", estado: "borrador", creado: hace(59) };
  const base = baseFalsa({ mensajes: ms, salidas: [borrador], ajustes: { modo: "sombra" } });
  const { agente, controlar } = controlador(base);
  await controlar();
  assert.match(base.filas[0]?.aviso ?? "", /No la corregí: quedó un borrador del agente y no sé si lo mandaste\.$/, "va al resumen, no espera");
  base.ajustes = async () => ({ modo: "auto", bandeja: true, controlador: true });
  await controlar();
  assert.equal(agente.pedidos.length, 0, "al volver a automático no manda lo que ya pudo haber salido");
  // Sin borrador, en sombra espera y en automático se corrige, como siempre.
  const sinBorrador = baseFalsa({ mensajes: ms, ajustes: { modo: "sombra" } });
  const ctl = controlador(sinBorrador);
  assert.equal((await ctl.controlar()).esperan, 1);
  sinBorrador.ajustes = async () => ({ modo: "auto", bandeja: true, controlador: true });
  assert.equal((await ctl.controlar()).corregidas, 1);
  // Un borrador de antes de la oferta no cuenta.
  const [d] = detectar(ms);
  assert.deepEqual(C.decidirCorreccion(d, { contacto: contactoDe(ms), mensajes: ms, salidas: [{ ...borrador, creado: hace(200) }], ahora: AHORA.getTime() }), { si: true });
});

test("solo corrige lo de después de que arrancó el controlador: la primera vuelta guarda la hora y lo de antes va al resumen", async () => {
  const ms = puenteConOtraPregunta();
  const base = baseFalsa({ mensajes: ms, arranque: null });
  const { agente, controlar } = controlador(base);
  await controlar();
  assert.equal(base.arranque, AHORA.getTime(), "la primera vuelta deja la hora");
  assert.equal(agente.pedidos.length, 0);
  assert.match(base.filas[0].aviso, /No la corregí: es de antes de que arrancara el controlador\.$/);
  // Una falla de después sí se corrige, y la hora no cambia.
  const despues = new Date(AHORA.getTime() + 2 * HORA);
  base.reloj = () => despues;
  base.mensajes = [...ms, ...charla([["lead", "dale, de prueba", 40], ["agente", OFERTA, 30], ["lead", SI, 20], ["agente", OTRA, 19]], { desde: 300, ahora: despues })];
  base.contactos = [contactoDe(base.mensajes)];
  await controlador(base, { agente, ahora: despues }).controlar();
  assert.equal(base.arranque, AHORA.getTime());
  assert.equal(agente.pedidos.length, 1);
  assert.equal(base.filas.find((f) => f.detalle === "F1#301").estado, C.ESTADOS.corregida);
});

test("arranqueDelControlador guarda la hora una sola vez y la lee", async () => {
  const consultas = [];
  pg.otras = (t, params) => {
    if (t.startsWith("INSERT INTO dm_config (clave, valor) VALUES ('controlador_arranque'")) {
      consultas.push(t);
      return { rows: [] };
    }
    if (t.startsWith("SELECT valor FROM dm_config WHERE clave =") && params[0] === "controlador_arranque") return { rows: [{ valor: { ms: "1760972400000" } }] };
    return undefined;
  };
  try {
    assert.equal(await baseJs.arranqueDelControlador(), 1760972400000);
  } finally {
    pg.otras = null;
  }
  assert.match(consultas[0], /ON CONFLICT \(clave\) DO NOTHING$/, "la primera queda: las vueltas de después no la pisan");
});

test("una corrección que sale tarde respeta el horario de los seguimientos: de noche espera, de día sale", async () => {
  // Las 3 de la mañana de Argentina. El sí fue hace 3 horas y el agente le hizo otra pregunta.
  const NOCHE = new Date("2026-10-20T06:00:00Z");
  const ms = charla([["agente", OFERTA, 190], ["lead", SI, 180], ["agente", OTRA, 179]], { ahora: NOCHE });
  const base = baseFalsa({ mensajes: ms });
  base.reloj = () => NOCHE;
  const { agente, controlar } = controlador(base, { ahora: NOCHE });
  const r = await controlar();
  assert.equal(agente.pedidos.length, 0);
  assert.equal(r.esperan, 1);
  assert.deepEqual(base.filas, [], "no se anota: sale de día");
  // A las 9 de Argentina sale.
  const DIA = new Date("2026-10-20T12:05:00Z");
  base.reloj = () => DIA;
  assert.equal((await controlador(base, { agente, ahora: DIA }).controlar()).corregidas, 1);
  // Lo que se corrige enseguida (el sí fue hace 20 minutos) sale aunque sea de noche: es la respuesta a lo que acaba de
  // escribir.
  const reciente = charla([["agente", OFERTA, 30], ["lead", SI, 20], ["agente", OTRA, 19]], { ahora: NOCHE });
  const otra = baseFalsa({ mensajes: reciente });
  otra.reloj = () => NOCHE;
  assert.equal((await controlador(otra, { ahora: NOCHE }).controlar()).corregidas, 1);
});

test("si el modelo no contestó a tiempo (la Mac llena), no pasó nada: la corrección se intenta en la vuelta siguiente", async () => {
  const base = baseFalsa({ mensajes: puenteConOtraPregunta() });
  let vez = 0;
  const { agente, controlar } = controlador(base, {
    agente: agenteFalso(() => (++vez === 1 ? { hecho: "error del modelo", error: "tardó más de 75 segundos", transitorio: true } : { hecho: "enviada", mando: 1 })),
  });
  const r = await controlar();
  assert.equal(r.esperan, 1);
  assert.equal(r.sin_corregir, 0);
  assert.deepEqual(base.filas, [], "no se gastó");
  assert.equal((await controlar()).corregidas, 1);
  assert.equal(agente.pedidos.length, 2);
  // Un error del modelo que no es de tiempo (se negó) sí va al resumen.
  const otra = baseFalsa({ mensajes: puenteConOtraPregunta() });
  assert.equal((await controlador(otra, { agente: agenteFalso({ hecho: "error del modelo", error: "se negó", transitorio: false }) }).controlar()).sin_corregir, 1);
});

test("cada corrección ocupa un lugar de la Mac de los de la espera, y lo suelta; sin lugar, espera a la vuelta siguiente", async () => {
  const base = baseFalsa({ mensajes: puenteConOtraPregunta() });
  const { controlar } = controlador(base);
  assert.equal((await controlar()).corregidas, 1);
  assert.deepEqual(base.lugares, [{ id: ID, tope: ESPERA_EN_PARALELO, paraPasar: true }], "el lugar libre queda para quien escribe en vivo");
  assert.deepEqual(base.soltadas, [ID]);
  // Con la espera usando sus lugares: nada se pide, nada se anota.
  const llena = baseFalsa({ mensajes: puenteConOtraPregunta(), lugar: () => ({ tomada: false, lleno: true }) });
  const ctl = controlador(llena);
  const r = await ctl.controlar();
  assert.equal(ctl.agente.pedidos.length, 0);
  assert.equal(r.esperan, 1);
  assert.deepEqual(llena.filas, []);
  // Y si el agente revienta, el lugar se suelta igual.
  const rota = baseFalsa({ mensajes: puenteConOtraPregunta() });
  await controlador(rota, { agente: { procesar: async () => { throw new Error("se cayó"); } } }).controlar();
  assert.deepEqual(rota.soltadas, [ID]);
});

test("marcarControl deja la hora del renglón en enviado y no toca creado; el resumen de las notas toma esa hora", async () => {
  // A T0 sale una corrección sin lo que faltaba. El lead contesta y le gusta el video, y el agente le contesta sin el
  // precio: una F2 nueva. A T0+10 la F1 pasa a sin corregir con su renglón y la F2 espera (la charla tomada). A T0+20 la
  // F2 se corrige: la corrección de la F1 fue antes de que el lead contestara.
  const ms = puenteConOtraPregunta();
  const base = baseFalsa({ mensajes: ms });
  const T = (min) => new Date(AHORA.getTime() + min * MIN);
  const { agente } = controlador(base);
  await controlador(base, { agente }).controlar();
  const conVideo = [...ms, ...charla([
    ["agente", "Bueno, igual contame más de vos", 0], ["lead", "ya lo vi el video, me encantó", -3], ["agente", "Qué bueno de prueba!", -4],
  ], { desde: 300 })];
  base.mensajes = conVideo;
  base.contactos = [contactoDe(conVideo, { tomada: true })];
  base.reloj = () => T(10);
  await controlador(base, { agente, ahora: T(10) }).controlar();
  assert.equal(base.filas[0].estado, C.ESTADOS.sinCorregir);
  assert.equal(base.filas[0].creado, AHORA.toISOString());
  base.contactos = [contactoDe(conVideo)];
  base.reloj = () => T(20);
  const r = await controlador(base, { agente, ahora: T(20) }).controlar();
  assert.equal(r.corregidas, 1, "la F2 se corrige");
  assert.equal(base.filas.find((f) => f.detalle.startsWith("F2")).estado, C.ESTADOS.corregida);

  // La consulta: el renglón en enviado, creado como estaba.
  const src = await readFile(new URL("../lib/dm/base.js", import.meta.url), "utf8");
  const cuerpo = (nombre) => src.slice(src.indexOf(`export async function ${nombre}`), src.indexOf("\n}\n", src.indexOf(`export async function ${nombre}`)));
  assert.match(cuerpo("marcarControl"), /enviado = CASE WHEN \$\{aviso \|\| null\}::text IS NULL THEN enviado ELSE NOW\(\) END/);
  assert.doesNotMatch(cuerpo("marcarControl"), /creado =/);
  assert.match(cuerpo("notasParaResumen"), /CASE WHEN s\.accion = 'control' THEN COALESCE\(s\.enviado, s\.creado\) ELSE s\.creado END AS en/);
  assert.match(cuerpo("notasParaResumen"), /h\.en > \$\{desde\.toISOString\(\)\} AND h\.en <= \$\{hasta\.toISOString\(\)\}/);
  assert.match(cuerpo("notasParaResumen"), /h\.en AS creado/, "la hora con que el resumen sigue en la tanda siguiente es la misma");
});

test("contestoCande cuenta solo una indicación suya que salió: no la que dio error ni la que el agente prefirió no escribir", () => {
  const ms = charla([["agente", OFERTA, 70], ["lead", SI, 60]]);
  const deCande = contactoDe(ms, { dueno: "cande" });
  const desde = AHORA.getTime() - 60 * MIN;
  const salida = (estado, detalle) => ({ contacto: ID, accion: "responder", estado, detalle, creado: hace(40) });
  for (const estado of ["enviando", "enviada", "incierta"]) {
    assert.equal(C.contestoCande(deCande, { mensajes: ms, salidas: [salida(estado, DETALLE_INDICACION)], desde }), true, estado);
  }
  assert.equal(C.contestoCande(deCande, { mensajes: ms, salidas: [salida("incierta", `${DETALLE_INDICACION}: ManyChat tardó`)], desde }), true);
  assert.equal(C.contestoCande(deCande, { mensajes: ms, salidas: [salida("error", `${DETALLE_INDICACION}: fuera de la ventana`)], desde }), false, "no le llegó");
  assert.equal(C.contestoCande(deCande, { mensajes: ms, salidas: [salida("descartada", "indicación: el agente prefirió no escribir")], desde }), false);
});

test("sin los patrones cargados, F1 a F4 no marcan nada ni se corrigen, y la vuelta lo dice; F5 sigue", async () => {
  const ms = [...puenteConOtraPregunta(), ...charla([["lead", "y eso cómo funciona?", 50]], { desde: 300 })];
  for (const [que, config] of [["sin cargar", { [C.CLAVE_PATRONES]: null }], ["uno que no compila", { [C.CLAVE_PATRONES]: { ...PATRONES_DE_PRUEBA, oferta: "(" } }]]) {
    const base = baseFalsa({ mensajes: ms, contactos: [contactoDe(ms, { respondido_hasta: 105 })], config });
    const { agente, controlar } = controlador(base);
    const r = await controlar();
    assert.equal(r.sin_patrones, true, que);
    assert.equal(agente.pedidos.length, 0, que);
    assert.deepEqual(r.fallas, { F5: 1 }, que);
  }
  assert.equal((await controlador(baseFalsa({ mensajes: puenteConOtraPregunta() })).controlar()).sin_patrones, false);
  assert.deepEqual(C.detectar({ mensajes: puenteConOtraPregunta(), contactos: [contactoDe(puenteConOtraPregunta())] }, { ahora: AHORA.getTime() }), []);
  assert.equal(C.claseDePregunta("Y escribís código?"), null);
});

test("los patrones se revisan antes de usarlos: todos, que compilen y que no coincidan con cualquier texto", () => {
  assert.equal(C.validarPatrones(PATRONES_DE_PRUEBA).ok, true);
  const { patrones } = C.validarPatrones({ ...PATRONES_DE_PRUEBA, _nota: "esto no se guarda" });
  assert.deepEqual(Object.keys(patrones).sort(), [...C.PATRONES, "clases"].sort(), "solo lo que usa el controlador");
  for (const [que, mal] of [
    ["falta uno", (({ cierre, ...resto }) => resto)(PATRONES_DE_PRUEBA)],
    ["no compila", { ...PATRONES_DE_PRUEBA, frena: "(" }],
    ["vacío", { ...PATRONES_DE_PRUEBA, toque: "" }],
    ["coincide con todo", { ...PATRONES_DE_PRUEBA, oferta: "x|" }],
    ["sin clases", { ...PATRONES_DE_PRUEBA, clases: [] }],
    ["clase sin nombre", { ...PATRONES_DE_PRUEBA, clases: [["Mal Nombre", "algo"]] }],
    ["no es un objeto", ["oferta"]],
  ]) {
    const v = C.validarPatrones(mal);
    assert.equal(v.ok, false, que);
    assert.equal(C.compilarPatrones(mal), null, que);
  }
  assert.match(C.validarPatrones({ ...PATRONES_DE_PRUEBA, frena: "(secreto" }).error, /^frena:/);
  assert.doesNotMatch(C.validarPatrones({ ...PATRONES_DE_PRUEBA, frena: "(secreto" }).error, /secreto/, "el error no muestra el patrón");
});

test("la acción controlador_patrones de /api/dm/config guarda solo patrones válidos, en la base y sin devolverlos", async () => {
  const { default: handler } = await import("../pages/api/dm/config.js");
  const guardados = [];
  pg.otras = (t, params) => {
    if (t.startsWith("INSERT INTO dm_config (clave, valor) VALUES (?, ?::jsonb)")) {
      guardados.push({ clave: params[0], valor: JSON.parse(params[1]) });
      return { rows: [] };
    }
    if (/^(CREATE|ALTER|UPDATE|DROP|DELETE|INSERT|SELECT)/.test(t)) return { rows: [] };
    return undefined;
  };
  process.env.COLA_SECRET = "secreto-de-prueba";
  process.env.POSTGRES_URL = "postgres://de-prueba";
  const llamar = async (body) => {
    const res = respuesta();
    await handler({ method: "POST", headers: { authorization: "Bearer secreto-de-prueba" }, body }, res);
    return res;
  };
  try {
    const mal = await llamar({ accion: "controlador_patrones", patrones: { ...PATRONES_DE_PRUEBA, cierre: "[" } });
    assert.equal(mal.codigo, 400);
    assert.match(mal.cuerpo.error, /^cierre:/);
    assert.deepEqual(guardados, [], "con uno malo no se guarda nada");
    const bien = await llamar({ accion: "controlador_patrones", patrones: PATRONES_DE_PRUEBA });
    assert.equal(bien.codigo, 200);
    assert.deepEqual(bien.cuerpo, { ok: true, patrones: C.PATRONES.length, clases: PATRONES_DE_PRUEBA.clases.length });
    assert.deepEqual(guardados, [{ clave: C.CLAVE_PATRONES, valor: PATRONES_DE_PRUEBA }]);
    assert.doesNotMatch(JSON.stringify(bien.cuerpo), /atajo/, "no devuelve los patrones");
  } finally {
    pg.otras = null;
    delete process.env.COLA_SECRET;
    delete process.env.POSTGRES_URL;
  }
});

test("ni el código del controlador ni lo que le pide al agente nombran los pasos o los frenos del prompt", async () => {
  const src = await readFile(new URL("../lib/dm/controlador.js", import.meta.url), "utf8");
  const pruebas = await readFile(new URL("./dmControlador.test.mjs", import.meta.url), "utf8");
  const numerados = new RegExp(["paso \\d", "freno \\d", "turno " + "2"].join("|"), "i");
  assert.doesNotMatch(src, numerados);
  assert.doesNotMatch(pruebas, numerados);
  for (const d of [{ regla: "F1", tipo: "otra_cosa", dijo: SI }, { regla: "F2", tipo: "nada", dijo: "me gustó" }]) {
    assert.doesNotMatch(C.indicacionPara(d), numerados);
    assert.doesNotMatch(C.indicacionPara(d), /cuba|mercado ?pago/i, "las reglas de cada país las sabe el agente");
  }
});

test("la vuelta devuelve solo cantidades: ningún id ni nombre de una charla", async () => {
  // Una de cada: una que se corrige, una al resumen, una medida y una F5.
  const otro = "5550099";
  const ms = puenteConOtraPregunta();
  // Una charla de Cande con un cierre prematuro de hace unas horas y un mensaje del lead que espera desde hace 7.
  const f4 = charla([["agente", "Va el formulario\nopengatehub.com/devs", 900], ["lead", "listo", 890], ["lead", "me copa, lo voy a rumiar", 500], ["agente", "Dale, sin drama, acá estoy", 499]], { contacto: otro, desde: 500 });
  const base = baseFalsa({
    mensajes: [...ms, ...f4],
    contactos: [contactoDe(ms), { ...contactoDe(f4), id: otro, nombre: "Otro de prueba", ig_usuario: "otro.prueba", ig_id: "9009", dueno: "cande" }],
    pendientes: [pendiente(7 * 60, { igsid: "9009", usuario: "otro.prueba" })],
  });
  const r = await controlador(base).controlar();
  assert.deepEqual([r.corregidas, r.al_resumen, r.medidas], [1, 1, 1], "hubo de todo");
  assert.deepEqual(Object.keys(r).sort(), ["al_resumen", "corregidas", "esperan", "fallas", "hecho", "medidas", "resueltas", "sin_corregir", "sin_patrones"]);
  for (const v of Object.values(r.fallas)) assert.equal(typeof v, "number");
  const todo = JSON.stringify(r);
  for (const dato of [ID, otro, "9001", "9009", "Lead de prueba", "Otro de prueba", "lead.prueba", "otro.prueba"]) assert.equal(todo.includes(dato), false, dato);
  // Y el cron devuelve eso tal cual, sin sumarle nada.
  const handler = await readFile(new URL("../pages/api/dm/controlador.js", import.meta.url), "utf8");
  assert.deepEqual([...handler.matchAll(/\.json\((.*?)\);/g)].map((x) => x[1]), ['{ error: "no" }', '{ ok: true, motivo: "sin base" }', "{ ok: true, ...r }", "{ ok: false }"]);
  assert.match(handler, /const r = await controlar\(/);
});

/* ---------- la corrección por dentro: el turno "control" del agente ---------- */

/**
 * Un agente de verdad (lib/dm/agente.js) con todo de mentira, para ver qué hace con el evento "control": la base en
 * memoria, un modelo que contesta `responde`, ManyChat y Telegram que anotan.
 */
function agenteDeVerdad({ mensajes = puenteConOtraPregunta(), contacto = null, responde, aj = {}, instagram = null } = {}) {
  const m = {
    mensajes: mensajes.map((x) => ({ ...x })), contacto: { ...(contacto || contactoDe(mensajes)), toques: 0, proximo_toque: null },
    salidas: [], enviados: [], avisos: [], pedidos: [], tomado: null, cerrados: [],
  };
  const base = {
    tablas: async () => {},
    ajustes: async () => ({ modo: "auto", envio: "api", espera_ms: 0, tope_por_dia: 12, toques: false, link_de_pago: "", ...aj }),
    prompt: async () => "PROMPT DE PRUEBA",
    contacto: async () => ({ ...m.contacto }),
    ultimoIdLead: async () => m.mensajes.filter((x) => x.quien === "lead").at(-1)?.id ?? null,
    historial: async (id, tope = 80) => m.mensajes.slice(-tope),
    corridasEnUnDia: async () => 0,
    tomar: async (id, marca, { cualquierDueno = false } = {}) => {
      if (m.tomado || (m.contacto.dueno !== "agente" && !cualquierDueno)) return null;
      m.tomado = marca;
      return { ...m.contacto };
    },
    soltar: async (id, marca) => { if (m.tomado === marca) m.tomado = null; },
    guardarSalida: async (s) => { m.salidas.push({ ...s }); return m.salidas.length; },
    marcarSalida: async (i, estado) => { m.salidas[i - 1].estado = estado; },
    anotar: async (id, quien, texto) => { m.mensajes.push({ contacto: ID, id: 1000 + m.mensajes.length, quien, texto, creado: AHORA.toISOString() }); },
    guardarEstado: async (id, e, p) => { m.contacto.estado = e; m.contacto.proximo_toque = p; },
    cerrarTurno: async (id, hasta) => { m.cerrados.push(hasta); m.contacto.respondido_hasta = Math.max(m.contacto.respondido_hasta, hasta); },
    ponerDueno: async (id, d) => { m.contacto.dueno = d; },
    descartarPendientes: async () => {},
    anotarLead: async () => null,
  };
  const pedir = async (p) => {
    m.pedidos.push(p);
    return responde ? responde(p) : { accion: "responder", mensajes: [LO_QUE_SEGUIA], estado: { quien: "dev", busca: "si", dolor: "de prueba" } };
  };
  const manychat = {
    hayManyChat: () => true,
    mandarTextos: async (id, textos) => { m.enviados.push(...textos); return { ok: true }; },
    ponerCampo: async () => ({ ok: true }),
  };
  const avisar = async (titulo, campos) => { m.avisos.push({ titulo, campos }); return true; };
  const agente = crearAgente({ base, pedir, manychat, avisar, esperar: async () => {}, reloj: () => AHORA, instagram, esperaInstagramMs: 50 });
  return { agente, m };
}
const corregir = (agente) => agente.procesar(ID, null, { evento: "control", indicacion: "indicación de prueba del controlador" });

test("el turno 'control' del agente: escribe siguiendo la indicación, con el link con el id de la charla, y cierra el turno", async () => {
  const { agente, m } = agenteDeVerdad();
  const r = await corregir(agente);
  assert.equal(r.hecho, "enviada");
  assert.equal(m.pedidos.length, 1);
  const { turno } = m.pedidos[0];
  assert.deepEqual(turno.mensajes_del_lead, [], "no hay mensajes nuevos: todo va en el historial");
  assert.match(turno.contexto, /INDICACIÓN DEL CONTROLADOR/);
  assert.match(turno.contexto, /indicación de prueba del controlador/);
  assert.doesNotMatch(turno.contexto, /INDICACIÓN DE CANDE/, "con eso la revisión de la Mac no revisaría");
  assert.equal(m.enviados.length, 1);
  assert.match(m.enviados[0], new RegExp(`opengatehub\\.com/devs\\?ig=${ID}`));
  assert.equal(m.contacto.dueno, "agente");
  assert.ok(m.cerrados.includes(104), "lo último del lead queda atendido");
  assert.deepEqual(m.avisos, [], "a Cande no le llega nada");
  assert.equal(notaControl("x").includes("INDICACIÓN DE CANDE"), false);
});

test("el turno 'control' pasa por todos los frenos (lo que pide Cande desde Telegram, no): si se frena no sale, no pasa la charla y no avisa", async () => {
  const promete = () => ({ accion: "responder", mensajes: ["Mañana te escribo con el link"], estado: { quien: "dev" } });
  const { agente, m } = agenteDeVerdad({ responde: promete });
  const r = await corregir(agente);
  assert.equal(r.hecho, "frenada");
  assert.equal(r.motivo, "promete avisar o escribir después");
  assert.deepEqual(m.enviados, []);
  assert.equal(m.contacto.dueno, "agente", "no le pasa la charla a Cande");
  assert.deepEqual(m.avisos, []);
  assert.equal(m.pedidos.length, 1, "sin otra vuelta");
  // Lo mismo como indicación de Cande sale: esa la decide ella.
  const deCande = agenteDeVerdad({ responde: promete });
  assert.equal((await deCande.agente.procesar(ID, null, { evento: "indicacion", indicacion: "decile algo" })).hecho, "enviada");
});

test("el turno 'control' solo en una charla del agente, con la ventana abierta, todo atendido y sin Cande en Instagram", async () => {
  const deCande = agenteDeVerdad({ contacto: contactoDe(puenteConOtraPregunta(), { dueno: "cande" }) });
  assert.equal((await corregir(deCande.agente)).hecho, "no es del agente");
  assert.equal(deCande.m.pedidos.length, 0);

  const vieja = agenteDeVerdad({ contacto: contactoDe(puenteConOtraPregunta(), { ultimo_lead: hace(24 * 60) }) });
  assert.equal((await corregir(vieja.agente)).hecho, "ventana de 24 horas cerrada");
  assert.equal(vieja.m.pedidos.length, 0);

  const abierta = agenteDeVerdad({ contacto: contactoDe(puenteConOtraPregunta(), { respondido_hasta: 102 }) });
  assert.equal((await corregir(abierta.agente)).hecho, "hay un mensaje del lead sin atender");
  assert.equal(abierta.m.pedidos.length, 0);

  const sacadas = [];
  const instagram = { conApi: true, porQueSale: async () => "le escribiste vos", sacar: async (c, motivo) => { sacadas.push(motivo); } };
  const aMano = agenteDeVerdad({ aj: { instagram: true }, instagram });
  assert.equal((await corregir(aMano.agente)).hecho, "de Cande por Instagram");
  assert.deepEqual(aMano.m.enviados, []);
  assert.deepEqual(sacadas, ["le escribiste vos"]);
});

test("el turno 'control' mira los frenos del último turno del lead: no dice cuánto sale a quien acaba de contar que se quedó sin trabajo", async () => {
  const mensajes = charla([
    ["lead", "hola, soy dev y busco hace un tiempo", 200],
    ["agente", "Va un mensaje automático de prueba\nY cómo te va con eso?", 199],
    ["lead", "sí, el video me gustó mucho. Igual me quedé sin trabajo la semana pasada", 60],
  ]);
  const precio = () => ({ accion: "responder", mensajes: ["Genial! Sale 27 dólares de prueba"], estado: { quien: "dev", busca: "si", dolor: "x" } });
  const { agente, m } = agenteDeVerdad({ mensajes, responde: precio });
  const r = await corregir(agente);
  assert.equal(r.hecho, "frenada");
  assert.match(r.motivo, /sin trabajo/);
  assert.deepEqual(m.enviados, []);
});

test("lo que sale por una indicación de Cande desde Telegram queda marcado en su salida", async () => {
  const { agente, m } = agenteDeVerdad();
  assert.equal((await agente.procesar(ID, null, { evento: "indicacion", indicacion: "decile algo de prueba" })).hecho, "enviada");
  assert.equal(m.salidas.at(-1).detalle, DETALLE_INDICACION);
  // Lo del controlador no lleva esa marca: es del agente.
  const otro = agenteDeVerdad();
  await corregir(otro.agente);
  assert.equal(otro.m.salidas.at(-1).detalle ?? null, null);
});

test("si ante el controlador el agente calla, el toque que ya estaba agendado sigue", async () => {
  const agendado = new Date(AHORA.getTime() + 3 * HORA);
  const { agente, m } = agenteDeVerdad({
    contacto: { ...contactoDe(puenteConOtraPregunta()), proximo_toque: agendado.toISOString() },
    responde: () => ({ accion: "callar", mensajes: [], estado: { quien: "dev" }, aviso_para_cande: "NOTA: de prueba" }),
  });
  m.contacto.proximo_toque = agendado.toISOString();
  assert.equal((await corregir(agente)).hecho, "calló");
  assert.equal(m.contacto.proximo_toque?.getTime(), agendado.getTime());
});

/* ---------- lo que queda en la base ---------- */

test("lo que anota el controlador nunca cuenta como respuesta: ni para la red, ni para la espera, ni para el tope del día, ni para el estado", async () => {
  const respuestas = ["pendiente", "enviando", "enviada", "incierta", "callo"];
  for (const e of Object.values(C.ESTADOS)) assert.equal(respuestas.includes(e), false, e);
  const src = await readFile(new URL("../lib/dm/base.js", import.meta.url), "utf8");
  const cuerpo = (nombre) => {
    const i = src.indexOf(`export async function ${nombre}(`);
    assert.ok(i > -1, `falta ${nombre}`);
    return src.slice(i, src.indexOf("\n}\n", i));
  };
  assert.match(cuerpo("corridasEnUnDia"), /accion NOT IN \('codigo_mp', 'nota', 'control'\)/);
  for (const n of ["enviadosEnLaCharla", "textosDeLaCuenta", "salidaSinLlegar", "salidasDesde"]) assert.match(cuerpo(n), /accion <> 'control'/, n);
  assert.equal((cuerpo("sinContestar").match(/accion <> 'control'/g) || []).length, 2, "ni quizás salió ni una respuesta esperando retiro");
  assert.match(cuerpo("reclamarEspera"), /accion <> 'control'/);
  // El estado del agente (dm_nube.py estado, y la vuelta de reserva del repaso de la Mac): ni en la cuenta por estado
  // ni en las últimas.
  assert.equal((cuerpo("resumen").match(/accion <> 'control'/g) || []).length, 2, "salidas_24h y ultimas");
  // Y sí va al resumen de las notas: notasParaResumen no deja afuera ni la accion ni sus estados con renglón.
  const notas = cuerpo("notasParaResumen");
  assert.doesNotMatch(notas, /accion (NOT IN \([^)]*'control'|<> 'control')/);
  for (const e of [C.ESTADOS.alResumen, C.ESTADOS.sinCorregir]) assert.doesNotMatch(notas, new RegExp(`'${e}'`));
  assert.match(src, /CREATE UNIQUE INDEX IF NOT EXISTS dm_salidas_control_idx ON dm_salidas \(contacto, detalle\) WHERE accion = 'control'/);
});

test("guardarControl anota una sola vez por charla y clave, y marcarControl solo toca lo del controlador", async () => {
  const consultas = [];
  pg.otras = (t, params) => {
    if (t.startsWith("INSERT INTO dm_salidas") || t.startsWith("UPDATE dm_salidas") || t.startsWith("DELETE FROM dm_salidas")) {
      consultas.push({ t, params });
      return { rows: t.startsWith("INSERT") ? [{ id: 9 }] : [] };
    }
    return undefined;
  };
  try {
    assert.equal(await baseJs.guardarControl({ contacto: ID, clave: "F1#103", estado: "al_resumen", aviso: "Controlador: algo", motivo: "F1 algo" }), 9);
    await baseJs.marcarControl(9, { estado: "resuelta" });
    await baseJs.borrarControl(9);
  } finally {
    pg.otras = null;
  }
  assert.match(consultas[0].t, /VALUES \(\?, 'control', '\[\]'::jsonb, \?, \?, \?, \?\)/);
  assert.match(consultas[0].t, /ON CONFLICT \(contacto, detalle\) WHERE accion = 'control' DO NOTHING/);
  assert.deepEqual(consultas[0].params, [ID, "Controlador: algo", "F1 algo", "al_resumen", "F1#103"]);
  assert.match(consultas[1].t, /WHERE id = \? AND accion = 'control'/);
  assert.equal(consultas[1].params[1], null, "resuelta: el renglón sale del resumen");
  // Un renglón puesto después lleva la hora de ahora (en enviado): si no, puede caer en una franja del resumen que ya
  // salió. creado queda: es la hora de la corrección.
  assert.match(consultas[1].t, /enviado = CASE WHEN \?::text IS NULL THEN enviado ELSE NOW\(\) END/);
  assert.doesNotMatch(consultas[1].t, /creado =/);
  assert.match(consultas[2].t, /^DELETE FROM dm_salidas WHERE id = \? AND accion = 'control' AND estado = 'corrigiendo'$/, "solo lo que no llegó a pasar");
});

test("datosParaControl busca las charlas de la bandeja por su id y su usuario de Instagram", async () => {
  const consultas = [];
  pg.otras = (t, params) => {
    if (t.startsWith("SELECT valor FROM dm_config WHERE clave =")) {
      if (params[0] === "bandeja_paginas") return { rows: [{ valor: { marca: "2026-10-20T14:58:00.000Z" } }] };
      return { rows: [{ valor: { pendientes: { h1: pendiente(400, { usuario: "Lead.Prueba" }), h2: null } } }] };
    }
    if (/^(WITH activos|SELECT c\.id|SELECT s\.id|SELECT id, contacto, estado)/.test(t)) {
      consultas.push({ t, params });
      return { rows: [] };
    }
    return undefined;
  };
  let d;
  try {
    d = await baseJs.datosParaControl(72);
  } finally {
    pg.otras = null;
  }
  assert.equal(consultas.length, 4);
  assert.deepEqual(d.pendientes.length, 1);
  const contactos = consultas.find((x) => x.t.startsWith("SELECT c.id"));
  assert.match(contactos.t, /c\.dueno_desde/, "desde cuándo es de quien es: si pasó por Cande después de la falla no se corrige");
  assert.match(contactos.t, /c\.toques/, "los seguimientos que le salieron desde lo último del lead");
  assert.match(contactos.t, /c\.proximo_toque/, "cuándo le toca el próximo: si es ahora, el seguimiento va primero");
  assert.match(consultas.find((x) => x.t.startsWith("SELECT s.id")).t, /s\.detalle/, "lo que salió con una indicación de Cande lo dice ahí");
  assert.ok(contactos.params.includes(JSON.stringify(["9001"])));
  assert.ok(contactos.params.includes(JSON.stringify(["lead.prueba"])), "el usuario en minúscula");
  assert.match(contactos.t, /AS tomada/);
  assert.match(consultas.find((x) => x.t.startsWith("SELECT id, contacto, estado")).t, /accion = 'control' AND creado > NOW\(\) - INTERVAL '8 days'/);
});

/* ---------- el cron ---------- */

test("el cron del controlador no entra sin CRON_SECRET, corre cada 15 minutos (en el mismo minuto que los toques) y no devuelve ids", async () => {
  const { default: handler, config } = await import("../pages/api/dm/controlador.js");
  const llamar = async (req) => { const res = respuesta(); await handler(req, res); return res; };
  const pedido = (extra = {}) => ({ method: "GET", headers: {}, ...extra });
  delete process.env.CRON_SECRET;
  assert.equal((await llamar(pedido())).codigo, 401);
  process.env.CRON_SECRET = "secreto-de-prueba";
  try {
    assert.equal((await llamar(pedido({ headers: { authorization: "Bearer otro" } }))).codigo, 401);
    const bien = await llamar(pedido({ headers: { authorization: "Bearer secreto-de-prueba" } }));
    assert.equal(bien.codigo, 200);
    assert.deepEqual(bien.cuerpo, { ok: true, motivo: "sin base" });
  } finally {
    delete process.env.CRON_SECRET;
  }
  assert.equal(config.maxDuration, 300);
  const crons = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8")).crons;
  // Todos en los mismos minutos (lib/crons.js): la base se despierta una vez por vuelta. Lo que el desfasaje cuidaba (el
  // seguimiento de una charla sale antes que su corrección) lo cuida decidirCorreccion.
  assert.deepEqual(crons.find((c) => c.path === "/api/dm/controlador"), { path: "/api/dm/controlador", schedule: "*/15 * * * *" });
  assert.deepEqual(crons.find((c) => c.path === "/api/dm/toques"), { path: "/api/dm/toques", schedule: "*/15 * * * *" });
  // Lo que devuelve con la base: el resultado de la vuelta, que son solo cantidades (la prueba de "la vuelta devuelve
  // solo cantidades", arriba).
  const src = await readFile(new URL("../pages/api/dm/controlador.js", import.meta.url), "utf8");
  assert.match(src, /return res\.status\(200\)\.json\(\{ ok: true, \.\.\.r \}\);/);
});

test("si Cande escribió a mano y no se pudo anotar lo suyo (el agente mira de nuevo), no pasó nada: la corrección no se gasta", async () => {
  const { MIRAR_DE_NUEVO } = await import("../lib/dm/agente.js");
  const { NO_AHORA } = await import("../lib/dm/instagram.js");
  assert.equal(typeof MIRAR_DE_NUEVO, "string");
  const base = baseFalsa({ mensajes: puenteConOtraPregunta() });
  let vez = 0;
  const { agente, controlar } = controlador(base, {
    agente: agenteFalso(() => (++vez === 1 ? { hecho: MIRAR_DE_NUEVO, motivo: NO_AHORA } : { hecho: "enviada", mando: 1 })),
  });
  const r = await controlar();
  assert.equal(r.esperan, 1);
  assert.equal(r.sin_corregir, 0);
  assert.deepEqual(base.filas, [], "no quedó anotada");
  assert.equal((await controlar()).corregidas, 1);
  assert.equal(agente.pedidos.length, 2);
});

/* ---------- segunda revisión de las charlas retomadas (21/10) ---------- */

test("charla retomada: lo de Cande que se anotó después de la respuesta del lead pero lo escribió antes se lee en el orden en que se escribió (sin fallas que no existen)", async () => {
  // Lo último era un sí viejo (de hace 4 días) a una oferta, sin lo que seguía. Cande pegó C hace 25 minutos, el lead le
  // contestó R hace 20 y el agente contestó A2 hace 19. C lo anotó recién la mirada del turno de R: quedó con un id más
  // alto que R, con la hora de Instagram.
  const ms = [
    { contacto: ID, id: 100, quien: "lead", texto: "hola, soy dev y busco hace un tiempo", creado: hace(5200) },
    { contacto: ID, id: 101, quien: "agente", texto: OFERTA, creado: hace(5100) },
    { contacto: ID, id: 102, quien: "lead", texto: SI, creado: hace(5000) },
    { contacto: ID, id: 103, quien: "lead", texto: "hola! sigo en la misma, de prueba", creado: hace(20) },
    { contacto: ID, id: 104, quien: "cande", texto: "Texto de prueba que Cande pegó a mano", creado: hace(25) },
    { contacto: ID, id: 105, quien: "agente", texto: "Uh, y qué es lo que más te traba?", creado: hace(19) },
  ];
  const contacto = contactoDe(ms, { respondido_hasta: 103, dueno_desde: hace(120) });
  // La charla tiene la marca de retomada: solo en esas se lee por la hora (sin la marca, como en main: por el id).
  const retomadas = { [ID]: { hasta: AHORA.getTime() + 24 * HORA, marcada: AHORA.getTime() - 60 * 60000, usada: AHORA.getTime() - 25 * 60000 } };
  const datos = { mensajes: ms, contactos: [contacto], salidas: [], pendientes: [] };
  assert.deepEqual(reglas(C.detectar(datos, { ahora: AHORA.getTime(), patrones: P, retomadas })), []);
  const base = baseFalsa({ mensajes: ms, contactos: [contacto], config: { retomadas } });
  const { agente, controlar } = controlador(base);
  const r = await controlar();
  assert.deepEqual(r.fallas, {});
  assert.equal(r.al_resumen, 0);
  assert.deepEqual(base.filas, [], "ningún renglón 'Controlador:' falso en el resumen");
  assert.equal(agente.pedidos.length, 0);
});

test("lo último que miró el controlador (vistoHasta) es el id más alto de la charla, aunque por la hora lo último sea otro mensaje", async () => {
  // Una falla de verdad (el sí de recién contestado con otra pregunta) y lo de Cande anotado tarde, más atrás por la hora.
  const ms = [
    ...charla([["agente", OFERTA, 70], ["lead", SI, 60], ["agente", OTRA, 59]], { desde: 100 }),
    { contacto: ID, id: 103, quien: "automatico", texto: "Mensaje fijo de prueba", creado: hace(200) },
  ];
  // En una charla retomada (solo ahí se lee por la hora).
  const base = baseFalsa({ mensajes: ms, config: { retomadas: { [ID]: { hasta: AHORA.getTime() + 24 * HORA } } } });
  const { agente, controlar } = controlador(base);
  await controlar();
  assert.deepEqual(agente.pedidos.map((p) => p.vistoHasta), [103]);
});

/* ---------- tercera revisión de las charlas retomadas (21/10) ---------- */

// Las pruebas que empiezan con "como en main" pasan también con el código de origin/main (se corrieron contra una copia
// de origin/main con este mismo archivo).

test("como en main: una charla sin la marca de retomada (o sin poder leer las marcas) el controlador la lee en el orden de la base, aunque las horas digan otra cosa", async () => {
  // Lo mismo que la charla retomada de arriba, pero sin la marca: por el orden en la base, como siempre.
  const ms = [
    { contacto: ID, id: 100, quien: "lead", texto: "hola, soy dev y busco hace un tiempo", creado: hace(5200) },
    { contacto: ID, id: 101, quien: "agente", texto: OFERTA, creado: hace(5100) },
    { contacto: ID, id: 102, quien: "lead", texto: SI, creado: hace(5000) },
    { contacto: ID, id: 103, quien: "lead", texto: "hola! sigo en la misma, de prueba", creado: hace(20) },
    { contacto: ID, id: 104, quien: "cande", texto: "Texto de prueba que Cande escribió", creado: hace(25) },
    { contacto: ID, id: 105, quien: "agente", texto: "Uh, y qué es lo que más te traba?", creado: hace(19) },
  ];
  const contacto = contactoDe(ms, { respondido_hasta: 103, dueno_desde: hace(120) });
  const datos = { mensajes: ms, contactos: [contacto], salidas: [], pendientes: [] };
  const otra = { 999: { hasta: AHORA.getTime() + 24 * HORA } };
  const enMain = reglas(C.detectar(datos, { ahora: AHORA.getTime(), patrones: P }));
  assert.deepEqual(enMain, ["F1 otra_cosa"]);
  assert.deepEqual(reglas(C.detectar(datos, { ahora: AHORA.getTime(), patrones: P, retomadas: otra })), enMain, "la marca de otra charla");
  const vueltas = [];
  for (const [caso, ajustar] of [["sin la marca", () => {}], ["sin poder leer las marcas", (b) => {
    const leer = b.leerConfig;
    b.leerConfig = async (k) => { if (k === "retomadas") throw new Error("base caída de prueba"); return leer(k); };
  }]]) {
    const base = baseFalsa({ mensajes: ms, contactos: [contacto], config: { retomadas: otra } });
    ajustar(base);
    const { agente, controlar } = controlador(base);
    const r = await controlar();
    vueltas.push({ caso, fallas: r.fallas, pedidos: agente.pedidos.map((p) => p.vistoHasta) });
  }
  assert.deepEqual(vueltas.map((v) => v.fallas), [{ F1: 1 }, { F1: 1 }]);
  assert.deepEqual(vueltas[0].pedidos, vueltas[1].pedidos);
});
