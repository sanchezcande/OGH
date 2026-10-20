// El controlador del agente de DM (lib/dm/controlador.js, 20/10): reglas fijas, sin modelo, que miran las charlas,
// corrigen solas lo que es seguro y le listan lo demás a Cande en el resumen de las notas. Con una base, un agente, un
// ManyChat y un Telegram de mentira (tests/dobles): ninguna prueba sale a la red ni manda un mensaje.
//
// Todos los textos de este archivo son inventados para la prueba. Este repo es público: acá no va ninguna frase de
// una charla real ni del prompt del agente (que vive en la base).
//
// Lo que estas pruebas NO cubren: lo que hace Postgres con las consultas nuevas de lib/dm/base.js (reclamarControl,
// datosParaControl, guardarControl, marcarControl, borrarControl) y el índice único dm_salidas_control_idx. Abajo hay
// una revisión del texto de esas consultas; antes de subir se prueban a mano contra un Postgres de verdad (el 20/10, con
// un Postgres 16 local y el agente de verdad): que tablas() cree el índice y se pueda correr dos veces, que
// guardarControl no anote dos veces la misma clave en una charla (ON CONFLICT con el índice parcial) y sí en otra, que
// borrarControl borre solo lo que sigue corrigiendo, que reclamarControl dé la vuelta a una sola corrida, la suelte solo
// quien la tiene y la libere sola a los 6 minutos, que datosParaControl traiga las charlas de la bandeja por su id o su
// usuario de Instagram, que notasParaResumen traiga los renglones del controlador y que corridasEnUnDia, sinContestar
// (quizas_salio), salidaSinLlegar, enviadosEnLaCharla y salidasDesde no los cuenten. Y después de la revisión: que
// marcarControl le ponga la hora de ahora solo a la fila que recibe un renglón, y que datosParaControl traiga
// dueno_desde de los contactos y el detalle de las salidas.
//
// Correr:  node --test tests/*.test.mjs
import { respuesta } from "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const C = await import("../lib/dm/controlador.js");
const { crearAgente, notaControl, DETALLE_INDICACION } = await import("../lib/dm/agente.js");
const baseJs = await import("../lib/dm/base.js");
const { esUrgente } = await import("../lib/dm/resumen.js");
const { base: pg } = await import("./dobles/postgres.mjs");

const MIN = 60000;
const HORA = 60 * MIN;
const AHORA = new Date("2026-10-20T15:00:00Z");
const hace = (min) => new Date(AHORA.getTime() - min * MIN).toISOString();
const ID = "5550001";

// Frases inventadas que cumplen cada regla.
const OFERTA = "Uff te entiendo\nY si te cuento cómo te podría ayudar en eso?";
const SI = "ok, contame vos";
const OTRA = "Antes decime, en qué país estás?";
const TURNO_2 = "Genial, te dejo el formulario de prueba\nopengatehub.com/devs";

/** Una charla: [quien, texto, hace cuántos minutos], con ids seguidos desde `desde`. */
const charla = (lineas, { contacto = ID, desde = 100 } = {}) =>
  lineas.map(([quien, texto, min], i) => ({ contacto, id: desde + i, quien, texto, creado: hace(min) }));
const ultimoLeadDe = (ms) => ms.filter((m) => m.quien === "lead").at(-1);

/** El contacto de la charla, con el turno cerrado hasta lo último del lead (salvo que se diga otra cosa). */
const contactoDe = (ms, extra = {}) => ({
  id: ID, nombre: "Lead de prueba", dueno: "agente", personal: false, tomada: false, ig_id: "9001", ig_usuario: "lead.prueba",
  estado: { quien: "dev", busca: "si", dolor: "de prueba" },
  ultimo_lead: ultimoLeadDe(ms)?.creado ?? null, respondido_hasta: ultimoLeadDe(ms)?.id ?? 0, ...extra,
});

/** El caso del 20/10: le ofreció el puente, dijo que sí y el agente le hizo otra pregunta. */
const puenteConOtraPregunta = () => charla([
  ["lead", "hola, soy dev y busco hace un tiempo", 200],
  ["agente", "Va un mensaje automático de prueba\nY cómo viene eso?", 199],
  ["lead", "mal, mando y mando y nada", 120],
  ["agente", OFERTA, 119],
  ["lead", SI, 60],
  ["agente", OTRA, 59],
]);

/** Una base de mentira para el controlador: lo que traería datosParaControl y lo que anota en dm_salidas. */
function baseFalsa({ mensajes = [], contactos = null, salidas = [], pendientes = [], controles = [], ajustes = {} } = {}) {
  const b = {
    mensajes, contactos: contactos ?? (mensajes.length ? [contactoDe(mensajes)] : []), salidas, pendientes,
    filas: controles.map((x, i) => ({ id: i + 1, ...x })), llamadas: [], ocupada: false,
    // La hora de la base (NOW()): guardarControl la pone al anotar y marcarControl al poner un renglón.
    reloj: () => AHORA,
    ajustes: async () => ({ modo: "auto", bandeja: true, controlador: true, ...ajustes }),
    reclamarControl: async () => { b.llamadas.push("reclamar"); return !b.ocupada; },
    soltarControl: async () => { b.llamadas.push("soltar"); },
    datosParaControl: async (horas) => {
      b.llamadas.push(`datos ${horas}`);
      return { mensajes: b.mensajes, contactos: b.contactos, salidas: b.salidas, controles: b.filas.map((f) => ({ ...f })), pendientes: b.pendientes };
    },
    guardarControl: async ({ contacto, clave, estado, aviso = null, motivo = null }) => {
      if (b.filas.some((f) => f.contacto === contacto && f.detalle === clave)) return null;
      const id = (b.filas.at(-1)?.id ?? 0) + 1;
      b.filas.push({ id, contacto, detalle: clave, estado, aviso, motivo, creado: b.reloj().toISOString() });
      return id;
    },
    marcarControl: async (id, { estado, aviso = null, motivo = null }) => {
      Object.assign(b.filas.find((f) => f.id === id), { estado, aviso, ...(motivo ? { motivo } : {}), ...(aviso ? { creado: b.reloj().toISOString() } : {}) });
    },
    borrarControl: async (id) => {
      b.filas = b.filas.filter((f) => !(f.id === id && f.estado === C.ESTADOS.corrigiendo));
    },
  };
  return b;
}

/** Un agente de mentira: anota lo que le piden y contesta `resultado`. */
function agenteFalso(resultado = { hecho: "enviada", mando: 1, enviado: ["x"] }) {
  const a = { pedidos: [], procesar: async (id, disparo, op) => { a.pedidos.push({ id, disparo, ...op }); return typeof resultado === "function" ? resultado(a) : resultado; } };
  return a;
}

const controlador = (base, { agente = agenteFalso(), macViva = true, ahora = AHORA } = {}) =>
  ({ agente, controlar: C.crearControlador({ base, agente, reloj: () => ahora, macViva: async () => macViva }) });
const detectar = (mensajes, extra = {}) => C.detectar({ mensajes, contactos: [contactoDe(mensajes, extra)], salidas: [], pendientes: [] }, { ahora: AHORA.getTime() });
const reglas = (fallas) => fallas.map((d) => `${d.regla} ${d.tipo}`);

/* ---------- F1: el puente aceptado sin entregar ---------- */

test("F1: un sí al puente contestado con otra pregunta es la falla, y uno contestado con el turno 2 no", () => {
  const ms = puenteConOtraPregunta();
  const [d] = detectar(ms);
  assert.equal(d.regla, "F1");
  assert.equal(d.tipo, "otra_cosa");
  assert.equal(d.clave, `F1#${ms[3].id}`, "la ancla es la oferta: la misma en cada vuelta");
  assert.equal(d.siguiente, OTRA);
  const bien = charla([["agente", OFERTA, 70], ["lead", SI, 60], ["agente", TURNO_2, 59]]);
  assert.deepEqual(reglas(detectar(bien)), [], "con el turno 2 ya dado no hay nada");
  // El turno 2 en dos mensajes: alcanza con que alguno traiga el formulario.
  const enDos = charla([["agente", OFERTA, 70], ["lead", SI, 60], ["agente", "Genial! De eso hablo un montón de verdad", 59], ["agente", "opengatehub.com/devs", 59]]);
  assert.deepEqual(reglas(detectar(enDos)), []);
});

test("F1: lo que parece un sí al puente y no lo es no se marca", () => {
  // Un "dale" a otra pregunta (no es la oferta del puente).
  assert.deepEqual(reglas(detectar(charla([["agente", "Te paso un video corto de prueba?", 70], ["lead", "dale", 60], ["agente", "Ahí va", 59]]))), []);
  // Un no.
  assert.deepEqual(reglas(detectar(charla([["agente", OFERTA, 70], ["lead", "no gracias, por ahora no", 60], ["agente", "Dale!", 59]]))), []);
  // Después de la oferta preguntó otra cosa en el mismo turno: el sí puede ser a eso.
  assert.deepEqual(reglas(detectar(charla([["agente", OFERTA, 70], ["agente", "Y de dónde sos?", 70], ["lead", "sí, de un lugar de prueba", 60], ["agente", "Qué lindo", 59]]))), []);
  // La oferta que contestó con otra cosa, y el sí que vino después a otra pregunta.
  assert.deepEqual(reglas(detectar(charla([
    ["agente", OFERTA, 90], ["lead", "y vos de dónde sos?", 80], ["agente", "Del sur! Y te sirve un video?", 79], ["lead", "dale", 60], ["agente", "Ahí va", 59],
  ]))), []);
  for (const t of ["Sii", "dale dale", "👍", "Bueno", "me interesa", "obvio que sí"]) assert.equal(C.esSi(t), true, t);
  for (const t of ["no", "No, gracias", "sinceramente no sé", "nop"]) assert.equal(C.esSi(t), false, t);
});

test("F1: nada después del sí es falla a los 15 minutos y con el turno cerrado; abierto, lo contesta la espera", () => {
  const ms = charla([["agente", OFERTA, 70], ["lead", SI, 30]]);
  assert.deepEqual(reglas(detectar(ms)), ["F1 nada"]);
  assert.deepEqual(reglas(detectar(charla([["agente", OFERTA, 70], ["lead", SI, 10]]))), [], "todavía puede llegar");
  // Turno abierto: no lo contestó nadie todavía (la Mac apagada). Es F5, y lo contesta la espera.
  assert.deepEqual(reglas(detectar(ms, { respondido_hasta: 0 })), ["F5 base"]);
});

test("F1: el turno 2 que llegó más de una hora tarde queda solo para medir", () => {
  const ms = charla([["agente", OFERTA, 300], ["lead", SI, 290], ["agente", TURNO_2, 100]]);
  const [d] = detectar(ms);
  assert.equal(`${d.regla} ${d.tipo}`, "F1 tarde");
  assert.equal(d.medida, true);
  assert.deepEqual(reglas(detectar(charla([["agente", OFERTA, 300], ["lead", SI, 290], ["agente", TURNO_2, 280]]))), [], "a los 10 minutos está bien");
});

/* ---------- F2: vio el video con interés y no le llegó cuánto sale ---------- */

const videoConInteres = (respuesta, extra = []) => charla([
  ...extra,
  ["agente", "Pudiste mirar el video? Qué te pareció?", 70],
  ["lead", "sí! me gustó mucho, muy claro", 60],
  ["agente", respuesta, 59],
]);

test("F2: le gustó el video y lo que siguió no dice cuánto sale", () => {
  assert.deepEqual(reglas(detectar(videoConInteres("Genial! Y sentís que te suma?"))), ["F2 otra_cosa"]);
  assert.deepEqual(reglas(detectar(videoConInteres("Qué bueno! Está en 27 dólares de prueba"))), [], "con el precio está bien");
  // Ya sabía cuánto sale y lo que siguió es el paso de después.
  assert.deepEqual(reglas(detectar(videoConInteres("Y qué te frena para sumarte?", [["agente", "Son 27 dólares de prueba", 90], ["lead", "ok", 80]]))), []);
  // Si el estado no dice que busca y cuál es su dolor, no se le vende: no venderle no es una falla.
  assert.deepEqual(reglas(detectar(videoConInteres("Bárbaro, y hoy andás en búsqueda?"), { estado: { quien: "dev", busca: "no_se_sabe", dolor: "" } })), []);
  assert.deepEqual(reglas(C.videoSinPrecio(charla([["agente", "Pudiste mirar el video?", 70], ["lead", "no me gustó", 60], ["agente", "Y por qué?", 59]]), {
    contacto: contactoDe([]), ahora: AHORA.getTime(),
  })), [], "sin interés no hay falla");
});

test("F2: las preguntas del agente para quien todavía no vio el video no cuentan, ni quien dice que lo va a ver", () => {
  // El agente calló después (o contestó otra cosa): antes se tomaba como que lo vio y le gustó.
  const caso = (lineas) => reglas(detectar(charla(lineas)));
  assert.deepEqual(caso([["agente", "Dale! cuando lo llenes y lo mires me avisás qué tal, qué te pareció?", 70], ["lead", "Siii genial!", 60]]), []);
  assert.deepEqual(caso([["agente", "Te dejo el video corto de prueba, lo podés ver ahora?", 70], ["lead", "Genial, ahora lo veo!", 60]]), []);
  assert.deepEqual(caso([["agente", "Y qué te pareció la entrevista de prueba?", 70], ["lead", "me gustó", 60]]), [], "no es el video");
  // "Qué te pareció?" a quien ya dijo que lo vio sí cuenta.
  assert.deepEqual(caso([
    ["agente", "Pudiste?", 90], ["lead", "sii ya lo vi", 80], ["agente", "Y qué te pareció?", 70], ["lead", "me encantó, muy claro todo", 60],
  ]), ["F2 nada"]);
});

test("F2: un sí cuando se le preguntó si le sirve, después del video, también es el paso 9", () => {
  const conVideo = [["agente", "Te dejo el video de prueba acá", 120], ["lead", "listo, está bien", 90]];
  const sirve = (resp) => charla([...conVideo, ["agente", "Y eso te puede servir para lo que buscás?", 70], ["lead", "seguro que si", 60], ...resp]);
  assert.deepEqual(reglas(detectar(sirve([["agente", "Buenísimo, y de qué país sos?", 59]]))), ["F2 otra_cosa"]);
  assert.deepEqual(reglas(detectar(sirve([]))), ["F2 nada"]);
  assert.deepEqual(reglas(detectar(sirve([["agente", "Genial! Está en 27 dólares de prueba", 59]]))), []);
  // Sin video antes, o con una oferta en el mismo tramo (el sí es a la oferta), no.
  assert.deepEqual(reglas(detectar(charla([["agente", "Y eso te puede servir para lo que buscás?", 70], ["lead", "seguro que si", 60]]))), []);
});

test("F2: no es falla si ya sabía cuánto sale, ni si lo que siguió es una pregunta que va antes del monto", () => {
  // Se le dijo cuánto sale antes del video.
  const sabia = charla([
    ["agente", "Te cuento, está en 27 dólares de prueba", 120], ["lead", "ok, lo miro", 110],
    ["agente", "Pudiste mirar el video?", 70], ["lead", "Listo, lo vi. Me re gustó", 60], ["agente", "Genial! Te paso el link?", 59],
  ]);
  assert.deepEqual(reglas(detectar(sabia)), []);
  // El estado dice que ya se le dijo, aunque la frase no esté en lo que se mira.
  assert.deepEqual(reglas(detectar(videoConInteres("Genial, me alegra un montón de prueba"), { estado: { quien: "dev", busca: "si", dolor: "x", precio_dicho: true } })), []);
  // Las preguntas que el prompt pide antes del monto: a quien es de Cuba, y si le sirve.
  assert.deepEqual(reglas(detectar(videoConInteres("Che, y desde Cuba podés pagar desde afuera con alguna tarjeta?"))), []);
  assert.deepEqual(reglas(detectar(videoConInteres("Y eso te puede servir para lo que buscás?"))), []);
});

/* ---------- F3: pregunta repetida ---------- */

test("F3: la misma pregunta dos veces con el lead en el medio, o lo que el lead ya había contado", () => {
  const repetida = charla([["agente", "Y qué onda, sos dev o estás en otra?", 90], ["lead", "jaja", 80], ["agente", "Perdón, sos dev o no?", 79]]);
  const [d] = C.preguntaRepetida(repetida, { ahora: AHORA.getTime() });
  assert.equal(`${d.regla} ${d.tipo}`, "F3 repetida");
  const yaDicho = charla([["lead", "hola! soy backend hace 3 años", 90], ["agente", "Y vos sos dev o qué hacés?", 89]]);
  assert.equal(C.preguntaRepetida(yaDicho, { ahora: AHORA.getTime() })[0].tipo, "ya_dicho");
  // Un toque tiene su regla, y dos preguntas seguidas sin que el lead escriba no son una repetida.
  assert.deepEqual(C.preguntaRepetida(charla([["agente", "Y sos dev o?", 90], ["lead", "jaja", 80], ["agente", "Holii, sos dev o?", 79]]), { ahora: AHORA.getTime() }), []);
  assert.deepEqual(C.preguntaRepetida(charla([["agente", "Y sos dev o?", 90], ["agente", "Perdón, sos dev o?", 89], ["lead", "sí", 80]]), { ahora: AHORA.getTime() }), []);
  assert.equal(C.claseDePregunta("Y cómo va la búsqueda?"), "como_va");
  assert.equal(C.claseDePregunta("cómo va la búsqueda"), null, "sin signo de pregunta no es una pregunta");
});

/* ---------- F4: cierre prematuro ---------- */

test("F4: mostró interés y frenó, y el agente cerró sin dar un paso más", () => {
  const conLink = [["agente", "Va el formulario\nopengatehub.com/devs", 200], ["lead", "listo", 190]];
  const cierre = (resp, antes = conLink) => charla([...antes, ["lead", "me copa, lo voy a pensar", 60], ["agente", resp, 59]]);
  assert.deepEqual(reglas(detectar(cierre("Dale tranqui, acá estoy"))), ["F4 cierre"]);
  assert.deepEqual(reglas(detectar(cierre("Dale, y qué te frena ahora?"))), [], "con una pregunta da un paso más");
  assert.deepEqual(reglas(detectar(cierre("Dale tranqui, igual hay 2 pagos de 13,50"))), [], "con los 2 pagos da un paso más");
  assert.deepEqual(reglas(detectar(cierre("Dale tranqui, acá estoy", []))), [], "si nunca se le nombró el programa no es este paso");
  // Lo que escribió Cande horas después en el mismo tramo no cuenta: se mira lo que contestó el agente en el momento.
  const conCande = charla([...conLink, ["lead", "me copa, lo voy a pensar", 600], ["agente", "Dale tranqui, acá estoy", 599], ["cande", "Hola! qué te frenó?", 30]]);
  assert.deepEqual(reglas(detectar(conCande)), ["F4 cierre"]);
});

/* ---------- F5 y F6: el lead que espera ---------- */

test("F5: un mensaje sin atender hace más de 15 minutos sin ninguna respuesta después", () => {
  const ms = charla([["agente", "Pregunta de prueba?", 60], ["lead", "respuesta de prueba", 30]]);
  const c = contactoDe(ms, { respondido_hasta: 0 });
  assert.deepEqual(reglas(C.sinAtender(ms, { contacto: c, ahora: AHORA.getTime() })), ["F5 base"]);
  const salio = [{ contacto: ID, accion: "responder", estado: "enviada", creado: hace(29) }];
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

test("corrige el sí al puente: le pide al agente el turno 2 con su indicación, una sola vez, y no lo anota para el resumen", async () => {
  const base = baseFalsa({ mensajes: puenteConOtraPregunta() });
  const { agente, controlar } = controlador(base);
  const r = await controlar();
  assert.equal(r.hecho, "listo");
  assert.equal(r.corregidas, 1);
  assert.equal(agente.pedidos.length, 1);
  assert.equal(agente.pedidos[0].id, ID);
  assert.equal(agente.pedidos[0].disparo, null);
  assert.equal(agente.pedidos[0].evento, "control");
  assert.match(agente.pedidos[0].indicacion, /turno 2 del paso 7/);
  assert.match(agente.pedidos[0].indicacion, /sin hacerle otra pregunta/);
  const [fila] = base.filas;
  assert.equal(fila.detalle, "F1#103");
  assert.equal(fila.estado, C.ESTADOS.corregida);
  assert.equal(fila.aviso, null, "lo corregido no va al resumen");
  assert.match(fila.motivo, /^F1 puente aceptado sin entregar/);
  assert.deepEqual(base.llamadas, ["reclamar", "datos 72", "soltar"]);
  // La vuelta siguiente no la vuelve a corregir.
  assert.equal((await controlar()).corregidas, 0);
  assert.equal(agente.pedidos.length, 1);
});

test("una sola vez por charla y regla: otro sí al puente en la misma charla ya no se corrige, va al resumen", async () => {
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
  assert.match(segunda.aviso, /^Controlador: dijo que sí al puente .* No la corregí: ya corregí esta charla una vez por lo mismo\.$/);
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
  // Y si después el agente le dio el turno 2, queda solo para medir.
  base.mensajes = [...espera, ...charla([["agente", TURNO_2, 30]], { desde: 400 })];
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
  assert.deepEqual(C.decidirCorreccion(C.detectar({ mensajes: viejo, contactos: [contactoDe(viejo)] }, { ahora: AHORA.getTime() })[0], {
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

test("si la corrección no sale (se frena, calla, el modelo no está), no se reintenta: va al resumen con el porqué", async () => {
  const base = baseFalsa({ mensajes: puenteConOtraPregunta() });
  const { agente, controlar } = controlador(base, { agente: agenteFalso({ hecho: "frenada", motivo: "promete un plazo" }) });
  const r = await controlar();
  assert.equal(r.sin_corregir, 1);
  assert.equal(base.filas[0].estado, C.ESTADOS.sinCorregir);
  assert.match(base.filas[0].aviso, /^Controlador: dijo que sí al puente .* No la pude corregir: lo frené: promete un plazo\.$/);
  await controlar();
  assert.equal(agente.pedidos.length, 1, "no se reintenta");
  // Una que quedó a medias (la función murió): al resumen, sin saber si salió.
  const colgada = baseFalsa({ controles: [{ contacto: ID, detalle: "F1#103", estado: C.ESTADOS.corrigiendo, creado: hace(20) }] });
  await controlador(colgada).controlar();
  assert.equal(colgada.filas[0].estado, C.ESTADOS.sinCorregir);
  assert.match(colgada.filas[0].aviso, /quedó a medias/);
});

test("si la corrección salió pero no trajo el turno 2, la vuelta siguiente lo ve y va al resumen; nunca se pide otra", async () => {
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
  bien.mensajes = [...ms, ...charla([["agente", TURNO_2, 0]], { desde: 300 })];
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

test("corrige el video con interés sin precio pidiendo el paso 9; si el agente le hizo otra pregunta, no se la pisa", async () => {
  const base = baseFalsa({ mensajes: videoConInteres("Genial, me alegra un montón de prueba") });
  const { agente, controlar } = controlador(base);
  assert.equal((await controlar()).corregidas, 1);
  assert.match(agente.pedidos[0].indicacion, /paso 9/);
  assert.match(agente.pedidos[0].indicacion, /Cuba/, "a quien es de Cuba, primero si puede pagar desde afuera");
  assert.equal(base.filas[0].detalle, "F2#101");
  // Con otra pregunta en el medio (puede ser una que el prompt pide antes del monto): al resumen, sin corregir.
  const conPregunta = baseFalsa({ mensajes: videoConInteres("Genial! Y sentís que te suma?") });
  const otro = controlador(conPregunta);
  const r = await otro.controlar();
  assert.equal(otro.agente.pedidos.length, 0);
  assert.equal(r.al_resumen, 1);
  assert.match(conPregunta.filas[0].aviso, /No la corregí: el agente le hizo otra pregunta y no se la piso\.$/);
});

test("F2 no se corrige en el turno en que contó que se quedó sin trabajo (el freno 13)", async () => {
  const ms = charla([["agente", "Pudiste mirar el video?", 70], ["lead", "sí, me gustó mucho. Igual me quedé sin trabajo la semana pasada", 60]]);
  const [d] = detectar(ms);
  assert.equal(`${d.regla} ${d.tipo}`, "F2 nada");
  assert.deepEqual(C.decidirCorreccion(d, { contacto: contactoDe(ms), mensajes: ms, ahora: AHORA.getTime() }), { no: "contó que se quedó sin trabajo" });
});

test("una sola corrección por charla en cada vuelta: el sí al puente y el video en el mismo turno no salen seguidos", async () => {
  // Le ofreció el puente, dijo que sí y que ya vio el video y le encantó, y el agente calló: F1 y F2 a la vez.
  const ms = charla([["agente", OFERTA, 70], ["lead", "Sii! y ya vi el video de prueba, me encantó", 60]]);
  assert.deepEqual(reglas(detectar(ms)), ["F1 nada", "F2 nada"]);
  const base = baseFalsa({ mensajes: ms });
  const { agente, controlar } = controlador(base);
  const r = await controlar();
  assert.equal(agente.pedidos.length, 1, "una sola");
  assert.equal(agente.pedidos[0].indicacion.includes("turno 2"), true);
  assert.equal(r.esperan, 1, "la otra queda para la vuelta siguiente");
  assert.equal(base.filas.length, 1);
  // Salió el turno 2 y el lead no contestó: la del video ya no se corrige (sería el segundo mensaje seguido).
  base.mensajes = [...ms, ...charla([["agente", TURNO_2, 0]], { desde: 300 })];
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

test("F1: el puente que ofreció Cande en una charla del agente también cuenta", async () => {
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
  // El resumen corta entre las dos vueltas.
  const corte = new Date(AHORA.getTime() + 5 * MIN);
  const despues = new Date(AHORA.getTime() + 10 * MIN);
  base.mensajes = [...ms, ...charla([["agente", "Bueno, igual contame más de vos", 0]], { desde: 300 })];
  base.contactos = [contactoDe(base.mensajes)];
  base.reloj = () => despues;
  await controlador(base, { ahora: despues }).controlar();
  assert.equal(base.filas[0].estado, C.ESTADOS.sinCorregir);
  assert.ok(new Date(base.filas[0].creado) > corte, "entra en el resumen siguiente");
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
  const conLink = [["agente", "Va el formulario\nopengatehub.com/devs", 200], ["lead", "listo", 190], ["lead", "me copa, lo voy a pensar", 60], ["agente", "Dale tranqui, acá estoy", 59]];
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
  const ms = charla([["agente", "Pregunta de prueba?", 60], ["lead", "respuesta de prueba", 30]]);
  const abierta = baseFalsa({ mensajes: ms, contactos: [contactoDe(ms, { respondido_hasta: 0 })] });
  const ctl = controlador(abierta, { macViva: false });
  await ctl.controlar();
  assert.equal(abierta.filas[0].estado, C.ESTADOS.alResumen);
  assert.match(abierta.filas[0].aviso, /^Controlador: escribió hace 30 min .*la Mac no está contestando/);
  abierta.contactos = [contactoDe(ms)];
  assert.equal((await ctl.controlar()).resueltas, 1);
  assert.equal(abierta.filas[0].estado, C.ESTADOS.resuelta);
  assert.equal(abierta.filas[0].aviso, null);
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
    return responde ? responde(p) : { accion: "responder", mensajes: [TURNO_2], estado: { quien: "dev", busca: "si", dolor: "de prueba" } };
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
    ["agente", "Va un mensaje automático de prueba\nY cómo viene eso?", 199],
    ["lead", "sí, el video me gustó mucho. Igual me quedé sin trabajo la semana pasada", 60],
  ]);
  const precio = () => ({ accion: "responder", mensajes: ["Genial! Está en 27 dólares de prueba"], estado: { quien: "dev", busca: "si", dolor: "x" } });
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

test("lo que anota el controlador nunca cuenta como respuesta: ni para la red, ni para la espera, ni para el tope del día", async () => {
  const respuestas = ["pendiente", "enviando", "enviada", "incierta", "callo"];
  for (const e of Object.values(C.ESTADOS)) assert.equal(respuestas.includes(e), false, e);
  const src = await readFile(new URL("../lib/dm/base.js", import.meta.url), "utf8");
  const cuerpo = (nombre) => {
    const i = src.indexOf(`export async function ${nombre}`);
    assert.ok(i > -1, `falta ${nombre}`);
    return src.slice(i, src.indexOf("\n}\n", i));
  };
  assert.match(cuerpo("corridasEnUnDia"), /accion NOT IN \('codigo_mp', 'nota', 'control'\)/);
  for (const n of ["enviadosEnLaCharla", "textosDeLaCuenta", "salidaSinLlegar", "salidasDesde"]) assert.match(cuerpo(n), /accion <> 'control'/, n);
  assert.equal((cuerpo("sinContestar").match(/accion <> 'control'/g) || []).length, 2, "ni quizás salió ni una respuesta esperando retiro");
  assert.match(cuerpo("reclamarEspera"), /accion <> 'control'/);
  // Y sí va al resumen de las notas: notasParaResumen no deja afuera ni la accion ni sus estados con renglón.
  const notas = cuerpo("notasParaResumen");
  assert.doesNotMatch(notas, /'control'/);
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
  // Un renglón puesto después lleva la hora de ahora: si no, puede caer en una franja del resumen que ya salió.
  assert.match(consultas[1].t, /creado = CASE WHEN \?::text IS NULL THEN creado ELSE NOW\(\) END/);
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
  assert.match(consultas.find((x) => x.t.startsWith("SELECT s.id")).t, /s\.detalle/, "lo que salió con una indicación de Cande lo dice ahí");
  assert.ok(contactos.params.includes(JSON.stringify(["9001"])));
  assert.ok(contactos.params.includes(JSON.stringify(["lead.prueba"])), "el usuario en minúscula");
  assert.match(contactos.t, /AS tomada/);
  assert.match(consultas.find((x) => x.t.startsWith("SELECT id, contacto, estado")).t, /accion = 'control' AND creado > NOW\(\) - INTERVAL '8 days'/);
});

/* ---------- el cron ---------- */

test("el cron del controlador no entra sin CRON_SECRET, corre cada 10 minutos (fuera del minuto de los toques) y no devuelve ids", async () => {
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
  assert.deepEqual(crons.find((c) => c.path === "/api/dm/controlador"), { path: "/api/dm/controlador", schedule: "5,15,25,35,45,55 * * * *" });
  assert.deepEqual(crons.find((c) => c.path === "/api/dm/toques"), { path: "/api/dm/toques", schedule: "*/10 * * * *" });
});
