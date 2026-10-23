// El agente de DM: los frenos (lib/dm/frenos.js) y lo que hace con cada mensaje
// (lib/dm/agente.js), con una base, un modelo, un ManyChat y un Telegram de mentira.
// Carga el código real del sitio. Ninguna prueba sale a la red.
//
// Todos los textos de este archivo son inventados para la prueba. Este repo es público: acá no
// va ninguna frase de una charla real ni del prompt del agente (que vive en la base).
//
// Lo que estas pruebas NO cubren: las consultas de lib/dm/base.js. El doble de Postgres de
// tests/dobles solo conoce las del goteo, así que tomar, soltar, anotarLead, sembrar,
// retirarSalida, reclamarToque, sinContestar, reclamarEspera, sinVentana, reclamarAvisoFoto,
// soltarAvisoFoto, fotosSinAviso, borrarViejas, borrarCharla, lugarParaAlta, darDeAlta y reservar (y lo
// que hacen con ellas /api/dm/config, /api/dm/toques, /api/dm/espera y /api/dm/entrada con las altas
// prendidas) se prueban a mano contra un Postgres de verdad antes de subir un cambio. De la espera hay
// que mirar: que fallos cuente las fallas propias del turno y las dudosas que tuvieron otra charla
// saliendo 10 minutos antes o después (y nunca las generales), que intentos y minutos_desde_la_falla
// miren solo las propias y las dudosas, que una charla apartada no la tome otra corrida ni la vea
// sinContestar, que no se aparten más de `tope` para contestar, que no se aparte para contestar una con
// una respuesta que pudo haber salido, y que sinVentana no devuelva una charla con el turno ya cerrado.
// De las fotos: que las charlas que ya existían arranquen con todo dado por avisado y las nuevas en 0,
// que reclamarAvisoFoto no aparte dos veces ni dentro de los 2 minutos de otro aviso y devuelva lo de
// antes, que soltarAvisoFoto lo devuelva, y que fotosSinAviso traiga solo fotos sin aviso de 5 minutos a
// 24 horas de charlas del agente (sin las que fueron con un aviso).
// De las altas hay que mirar siempre lo mismo: que quien ya figura como de Cande no cambia de
// dueño, que el tope corta, que el alta deja el mensaje y la ventana abierta en la misma
// sentencia, y que borrar o reservar a quien no figuraba le deja la fila que frena el alta.
//
// Correr:  node --test tests/*.test.mjs
import { respuesta } from "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

const {
  revisar, proximoToque, ventanaAbierta, normalizar, senales, sinSeguimiento, avisaQueEsAutomatico, plano, horaDeToques,
} = await import("../lib/dm/frenos.js");
const { crearAgente, armarTurno, esFoto, SIN_TEXTO } = await import("../lib/dm/agente.js");
const {
  correrToques, decidirSinContestar, pasarSinContestar, vaciarEspera, hayEspera, vigiaDelModelo, pausaTrasFallas,
  FALLA_GENERAL, FALLA_PROPIA, FALLA_DUDOSA, REINTENTO_MAX_FALLOS,
} = await import("../lib/dm/seguimientos.js");
/** Una falla del modelo que se arregla sola (la Mac sin red). */
const transitoria = (texto) => Object.assign(new Error(texto), { transitorio: true });
/** Una falla del modelo que le pasa a cualquier charla y no se arregla en minutos (la Mac sin uso, sin JSON). */
const general = (texto) => Object.assign(new Error(texto), { transitorio: false, general: true });
/** Una falla del modelo con esta charla en particular (se negó, devolvió algo ilegible). */
const propia = (texto) => Object.assign(new Error(texto), { transitorio: false, general: false });
const { validarAjustes, ajustesDesde, AJUSTES_POR_DEFECTO, desdeValido } = await import("../lib/dm/base.js");
const { cuerpoDeManyChat, leerCrudo } = await import("../lib/dm/cuerpo.js");
const { NOTA_FORMULARIO } = await import("../lib/dm/linkFormulario.js");
const { CADA_CRON_MS } = await import("../lib/crons.js");

const HORA = 3600000;
const AHORA = new Date("2026-10-12T15:00:00Z"); // las 12 del mediodía en Argentina
const AVISO = "Va un mensaje automático de prueba";

const estadoDev = { quien: "dev", busca: "si", dolor: "de prueba", etapa: "puente", link_formulario_enviado: false, precio_dicho: false };
const salida = (mensajes, extra = {}) => ({
  accion: "responder", mensajes, estado: estadoDev, aviso_para_cande: "", seguimiento_en_horas: null, motivo: "", ...extra,
});
const como = (quien) => ({ estado: { ...estadoDev, quien } });
const frena = (r, que) => assert.equal(r.ok, false, `tenía que frenar: ${que}`);
const pasa = (r, que) => assert.deepEqual(r, { ok: true }, `tenía que pasar: ${que}`);

/* ---------- frenos: lo que no sale nunca ---------- */

test("una respuesta normal a un dev pasa", () => {
  pasa(revisar(salida(["Pregunta de prueba?"])), "una pregunta");
});

test("no sale nada que diga que es una persona, prometa o apure", () => {
  const malas = [
    "Lo antes posible", "Soy Cande", "Sii soy yo", "No soy un bot", "No es automático", "Recién lo veo",
    "Lo resolvés enseguida", "Te contesto pronto",
    "Cualquier novedad te aviso", "Te voy a avisar", "Mañana te escribo", "Después te paso el link", "Quedás adentro",
    "Te consigo trabajo", "Vas a conseguir trabajo", "Te van a llamar", "Trabajo garantizado",
    "Quedan pocos lugares", "Solo por hoy", "Va a subir", "Hay un descuento", "Por ahora no sé",
    "Pasame el CVV", "Mandame el comprobante",
  ];
  for (const m of malas) frena(revisar(salida([m])), m);
});

test("las frases prohibidas se frenan igual con tildes, sin tildes y en mayúsculas", () => {
  for (const m of ["Recién lo veo", "Quedás adentro", "Últimos cupos", "Mañana te escribo"]) {
    for (const variante of [m, plano(m), m.toUpperCase(), m.normalize("NFD")]) frena(revisar(salida([variante])), variante);
  }
  assert.equal(plano("  ÚLTIMOS\n cupos "), "ultimos cupos");
});

test("prometer para después no sale aunque haya algo entre el verbo y el cuándo", () => {
  for (const m of ["Te paso el dato mañana", "Te mando algo más a la noche", "Te escribo por acá mañana", "Te cuento mejor el lunes"]) {
    assert.equal(revisar(salida([m])).motivo, "promete avisar o escribir después", m);
  }
  for (const m of ["Te paso 2 preguntas de prueba", "Te cuento algo de prueba", "Te mando el dato de prueba"]) pasa(revisar(salida([m])), m);
});

test("un pasado en tercera persona no es una promesa: la ó final cuenta", () => {
  const preguntas = ["Y de esas alguna te llamó?", "Y después te contestó alguien?", "Y eso te pasó hoy?", "Y te avisó alguien?", "Y quién te presentó ahí?"];
  for (const m of preguntas) {
    for (const variante of [m, m.toUpperCase(), m.normalize("NFD")]) pasa(revisar(salida([variante])), variante);
  }
  // La misma frase en primera persona, sin la tilde, sigue siendo una promesa.
  for (const m of ["Y de esas alguna te llamo?", "Te llamo", "Te aviso"]) frena(revisar(salida([m])), m);
  for (const m of ["Te agarró el bot", "TE AGARRÓ EL BOT", "te agarro el bot", "Te agarró el bot".normalize("NFD")]) {
    assert.equal(revisar(salida([m])).motivo, "dice o da a entender que es una persona", m);
  }
});

test("signos de apertura y guion largo no salen", () => {
  for (const m of ["¿Pregunta de prueba?", "¡Hola!", "Hola — prueba", "Hola – prueba"]) frena(revisar(salida([m])), m);
});

test("negar una promesa no es prometer, y una pregunta normal no es urgencia", () => {
  const buenas = [
    "No te garantizo nada", "No soy Cande", "Y en los últimos días cómo te fue?", "Qué rápido!",
    "Te aviso que va un mensaje de prueba", "Te paso 2 preguntas de prueba",
  ];
  for (const m of buenas) pasa(revisar(salida([m])), m);
});

test("respuesta vacía, de más de tres mensajes o larguísima no sale; callar sí", () => {
  frena(revisar(salida([])), "vacía");
  frena(revisar(salida(["a", "b", "c", "d"])), "cuatro mensajes");
  frena(revisar(salida(["x".repeat(351)])), "351 caracteres");
  pasa(revisar(salida(["x".repeat(350)])), "350 caracteres");
  pasa(revisar(salida([], { accion: "callar" })), "callar");
});

test("si empieza a recitar sus reglas o sus campos, no sale", () => {
  const internas = [
    "Uso pasar_a_cande", "Según el freno 3", "En el paso 7 va el formulario", "Devuelvo seguimiento_en_horas",
    // Lo que el prompt trae en el lugar del link de pago cuando no hay ninguno cargado.
    "Va el link\n(sin cargar)", "Va el link {LINK_DE_PAGO}",
  ];
  for (const m of internas) {
    assert.equal(revisar(salida([m])).motivo, "nombra sus reglas o sus campos internos", m);
  }
});

/* ---------- frenos: cuánto sale, links y montos ---------- */

test("cuánto sale se le dice a un dev y a nadie más", () => {
  pasa(revisar(salida(["Sale 27 dólares"])), "a un dev");
  pasa(revisar(salida(["Son 2 pagos de 13,50"])), "dos pagos a un dev");
  const variantes = [
    "Sale 27 dólares", "Sale 27", "Son 27usd", "SON 27 USD", "Sale veintisiete", "Son US$27", "Son 13,5 cada uno",
    "Dos cuotas", "2  pagos", "Es barato", "Va el link para pagar", "El precio es bajo",
  ];
  for (const m of variantes) frena(revisar(salida([m], como("no_se_sabe"))), `sin saber quién es: ${m}`);
});

test("un 27 que cuenta otra cosa no es plata", () => {
  for (const m of ["Wow 27 entrevistas", "Ahh 27 años", "Arrancás el 27 de octubre?", "Y te pagan en dólares ahí?"]) {
    pasa(revisar(salida([m], como("no_se_sabe"))), m);
  }
});

test("solo salen los links propios y los montos que existen", () => {
  for (const m of ["Mirá bit.ly/prueba", "Entrá a https://otro.ejemplo.com/x", "www.otro.com", "Te lo dejo en 10 dólares", "Son $5", "Sale 3 mil pesos"]) {
    frena(revisar(salida([m])), m);
  }
  for (const m of ["Para vos gratis", "Te lo regalo", "Te devuelvo la plata", "Pagame por transferencia"]) {
    assert.equal(revisar(salida([m])).motivo, "regalo, devolución o transferencia", m);
  }
  for (const m of ["Va el formulario\nopengatehub.com/devs", "https://www.opengatehub.com/devs/", "Wow Node.js y ASP.NET", "Es gratis"]) {
    pasa(revisar(salida([m])), m);
  }
});

test("el link de pago cargado cuenta como venta, lo escriba con https o sin", () => {
  const linkDePago = "https://pagos.ejemplo.com/prueba";
  pasa(revisar(salida(["Va el link\npagos.ejemplo.com/prueba"]), { linkDePago }), "sin https, a un dev");
  pasa(revisar(salida(["Va el link\nhttps://pagos.ejemplo.com/prueba."]), { linkDePago }), "con https y punto final");
  frena(revisar(salida(["Va el link\npagos.ejemplo.com/prueba"], como("empresa")), { linkDePago }), "a una empresa");
  frena(revisar(salida(["Va el link\npagos.ejemplo.com/prueba"], como("no_se_sabe")), { linkDePago }), "sin saber quién es");
  frena(revisar(salida(["Va el link\npagos.ejemplo.com/otra"]), { linkDePago }), "otra página del mismo dominio");
});

/* ---------- frenos: a quién no se le vende ---------- */

test("a quien construye o tiene empresa no le llega la lista, el programa, la llamada ni cuánto sale", () => {
  for (const quien of ["construye", "empresa"]) {
    // La llamada ya no: desde el 21/10 el agente le cierra la reunión a una empresa (prueba "a una empresa el agente le
    // cierra la reunión", al final). Con un dev sigue frenada.
    for (const m of ["Va la lista: opengatehub.com/devs", "opengatehub .com/devs", "Sale 27 dólares", "Sale veintisiete", "Lo cuento en mi programa", "Tengo un curso", "Mirá el video"]) {
      frena(revisar(salida([m], como(quien))), `${quien}: ${m}`);
    }
    pasa(revisar(salida(["Pregunta de prueba?"], como(quien))), `${quien}: una pregunta`);
  }
});

test("que el modelo diga dev no alcanza si antes dijo empresa o si el lead dio una señal de empresa", () => {
  frena(revisar(salida(["Sale 27 dólares"]), { estadoPrevio: { quien: "empresa" } }), "estado anterior empresa");
  frena(revisar(salida(["Va la lista\nopengatehub.com/devs"]), { textosDelLead: ["dale"], charlaDelLead: ["soy founder de una startup", "dale"] }), "señal en un turno anterior");
  pasa(revisar(salida(["Va la lista\nopengatehub.com/devs"]), { textosDelLead: ["dale"], charlaDelLead: ["soy dev backend", "dale"] }), "un dev");
});

test("del programa no se habla sin saber que es dev", () => {
  frena(revisar(salida(["Lo cuento en mi programa"], como("no_dev"))), "a quien no es dev");
  pasa(revisar(salida(["Lo cuento en mi programa"])), "a un dev");
});

test("quien contó una crisis o que no tiene plata lo sigue contando tres turnos después", () => {
  const charlaDelLead = ["no tengo plata, estoy sin trabajo", "bueno", "y cuánto sale?"];
  frena(revisar(salida(["Sale 27 dólares"]), { textosDelLead: ["y cuánto sale?"], charlaDelLead }), "sin plata en un turno anterior");
  frena(revisar(salida(["Sale 27 dólares"]), { textosDelLead: [], charlaDelLead }), "en un seguimiento, con el turno vacío");
  pasa(revisar(salida(["Va la lista, es gratis\nopengatehub.com/devs"]), { textosDelLead: ["bueno"], charlaDelLead }), "la lista gratis sí");
  frena(revisar(salida(["Mirá el video"]), { charlaDelLead: ["falleció un familiar"] }), "crisis y video");
  frena(revisar(salida(["Va la lista\nopengatehub.com/devs"]), { charlaDelLead: ["estoy con depresión"] }), "crisis y lista");
  pasa(revisar(salida(["Mensaje de prueba sin venta"]), { charlaDelLead: ["estoy con depresión"] }), "crisis y una línea sin venta");
  frena(revisar(salida(["Sale 27 dólares"]), { textosDelLead: ["me echaron ayer"] }), "sin trabajo en este turno");
});

test("a quien pidió que no le escriban solo le sale la disculpa, al pasarle la charla a Cande", () => {
  const charlaDelLead = ["no me escribas más"];
  assert.equal(revisar(salida(["Pregunta de prueba?"]), { charlaDelLead }).motivo, "pidió que no le escriban");
  pasa(revisar(salida(["Disculpa de prueba"], { accion: "pasar_a_cande" }), { charlaDelLead }), "la disculpa");
});

test("si todavía no se avisó que es automático, el mensaje tiene que decirlo", () => {
  assert.equal(revisar(salida(["Pregunta de prueba?"]), { exigirAviso: true }).motivo, "primer mensaje sin avisar que es automático");
  pasa(revisar(salida([AVISO, "Pregunta de prueba?"]), { exigirAviso: true }), "con el aviso");
  pasa(revisar(salida(["Responde una IA", "Pregunta de prueba?"]), { exigirAviso: true }), "dicho de otra forma");
  pasa(revisar(salida([], { accion: "pasar_a_cande" }), { exigirAviso: true }), "pasar sin escribir");
  frena(revisar(salida(["No es automático", "Pregunta de prueba?"]), { exigirAviso: true }), "negarlo no es avisar");
  // Si además rompe otra regla, el motivo que llega es el de esa regla.
  assert.match(revisar(salida(["Sale 27 dólares"], como("empresa")), { exigirAviso: true }).motivo, /construye o contrata/);
  assert.equal(avisaQueEsAutomatico("MENSAJE AUTOMÁTICO"), true);
  assert.equal(avisaQueEsAutomatico("mensaje de prueba"), false);
});

/* ---------- frenos: lo que cuenta el lead ---------- */

test("lo que cuenta el lead se entiende con tildes, sin tildes, en mayúsculas y con signos", () => {
  const cuenta = (t) => Object.entries(senales([t])).filter(([, v]) => v).map(([k]) => k).join(",");
  for (const t of ["falleció mi abuelo", "FALLECIO MI ABUELO", "se murió mi perro", "no doy más", "No Doy Mas", "estoy en una crisis"]) {
    assert.equal(cuenta(t), "crisis", t);
  }
  for (const t of ["no tengo $", "No tengo PLATA", "tengo deudas", "no tengo un mango", "estoy apurado", "no me alcanza"]) {
    assert.equal(cuenta(t), "sinPlata", t);
  }
  for (const t of ["estoy desempleada", "ME ECHARON", "me quedé sin laburo"]) assert.equal(cuenta(t), "sinTrabajo", t);
  for (const t of ["no me escribas más", "dejá de escribirme", "esto es spam"]) assert.equal(cuenta(t), "baja", t);
  for (const t of ["no me interesa", "No, gracias", "para más adelante"]) assert.equal(cuenta(t), "dijoQueNo", t);
  for (const t of ["tengo una agencia", "Soy CEO", "busco contratar un dev", "necesito un presupuesto"]) {
    assert.equal(cuenta(t), "empresa", t);
  }
  // "Ambas" contesta la pregunta de apertura: no es una empresa hasta que diga que contrata (21/10).
  for (const t of ["ambas", "Ambas cosas", "las dos cosas jaja"]) assert.notEqual(cuenta(t), "empresa", t);
});

test("lo que parece una crisis o falta de plata y no lo es", () => {
  const nada = ["hay mucha deuda técnica", "es por la crisis del sector", "me da ansiedad la entrevista técnica", "no estoy apurado", "no me alcanza el tiempo", "trabajo en una empresa grande", "soy dev backend"];
  for (const t of nada) assert.deepEqual(Object.values(senales([t])).filter(Boolean), [], t);
});

/* ---------- frenos: seguimientos ---------- */

test("no hay seguimiento para quien ya contestó que no, no tiene plata, no busca o cerró la charla", () => {
  const conLink = { ...estadoDev, link_formulario_enviado: true };
  const sigue = (o) => sinSeguimiento({ estado: conLink, ...o });
  assert.equal(sigue({ charlaDelLead: ["mensaje de prueba"], ultimoTurnoDelLead: ["mensaje de prueba"] }), false);
  assert.equal(sigue({ charlaDelLead: ["no me interesa"], ultimoTurnoDelLead: ["no me interesa"] }), true);
  assert.equal(sigue({ charlaDelLead: ["no me interesa", "bueno, contame"], ultimoTurnoDelLead: ["bueno, contame"] }), false);
  assert.equal(sigue({ charlaDelLead: ["tengo deudas", "dale"], ultimoTurnoDelLead: ["dale"] }), true);
  assert.equal(sigue({ charlaDelLead: ["no me escribas más", "hola"], ultimoTurnoDelLead: ["hola"] }), true);
  assert.equal(sinSeguimiento({ estado: { ...conLink, etapa: "cerrada" } }), true);
  assert.equal(sinSeguimiento({ estado: { ...conLink, busca: "no" } }), true);
  assert.equal(sinSeguimiento({ estado: { ...estadoDev, busca: "no_se_sabe" } }), true); // sin link y sin decir que busca
  assert.equal(sinSeguimiento({ estado: {} }), true);
  assert.equal(sinSeguimiento({ estado: null }), true);
  // Una pregunta de las primeras sin contestar sí tiene su toque (22/10), menos a quien no es dev, no busca o pidió que no.
  const temprana = { ...estadoDev, busca: "no_se_sabe", link_formulario_enviado: false };
  assert.equal(sinSeguimiento({ estado: { ...temprana, etapa: "quien_es", quien: "no_se_sabe" } }), false);
  assert.equal(sinSeguimiento({ estado: { ...temprana, etapa: "si_busca" } }), false);
  assert.equal(sinSeguimiento({ estado: { ...temprana, etapa: "si_busca", busca: "no" } }), true);
  assert.equal(sinSeguimiento({ estado: { ...temprana, etapa: "quien_es", quien: "no_dev" } }), true);
  assert.equal(sinSeguimiento({ estado: { ...temprana, etapa: "si_busca" }, charlaDelLead: ["no me escribas más"] }), true);
});

test("el seguimiento se cuenta desde el último mensaje del lead y solo dentro de sus 24 horas", () => {
  const ultimoLead = new Date(AHORA - 2 * HORA);
  const en = (o) => proximoToque({ ahora: AHORA, ultimoLead, toquesHechos: 0, ...o });
  assert.equal(en({ horas: 6 }).getTime(), ultimoLead.getTime() + 6 * HORA);
  assert.equal(en({ horas: 0.2 }).getTime(), ultimoLead.getTime() + 4 * HORA);   // nunca antes de las 4 horas
  assert.equal(en({ horas: 6, toquesHechos: 2 }), null);                            // ya hizo los dos
  assert.equal(en({ horas: 6, toquesHechos: 1, maxToques: 1 }), null);              // antes del link va uno solo
  assert.equal(en({ horas: null }), null);
  assert.equal(proximoToque({ ahora: AHORA, ultimoLead: new Date(AHORA - 6 * HORA), horas: 4, toquesHechos: 0 }), null); // esa hora ya pasó
  // El segundo toque, pedido a las 21 horas de su mensaje, cuando el primero salió a las 6.
  const tarde = new Date("2026-10-12T20:00:00Z");
  assert.equal(
    proximoToque({ ahora: new Date(tarde.getTime() + 6 * HORA), ultimoLead: tarde, horas: 21, toquesHechos: 1 }).getTime(),
    tarde.getTime() + 21 * HORA);
  assert.equal(ventanaAbierta(AHORA, new Date(AHORA - 23 * HORA)), true);
  assert.equal(ventanaAbierta(AHORA, new Date(AHORA - 24 * HORA)), false);
  assert.equal(ventanaAbierta(AHORA, null), false);
});

test("un seguimiento que cae de noche se corre a las 9, y si con eso pasa las 24 horas no sale", () => {
  const toque = (ultimoLead, horas) =>
    proximoToque({ ahora: new Date(ultimoLead), ultimoLead: new Date(ultimoLead), horas, toquesHechos: 0 })?.toISOString() ?? null;
  assert.equal(toque("2026-10-13T02:00:00Z", 6), "2026-10-13T12:00:00.000Z");   // 05:00 de Argentina → 09:00
  assert.equal(toque("2026-10-12T21:30:00Z", 4), "2026-10-13T12:00:00.000Z");   // 22:30 → 09:00 del otro día
  assert.equal(toque("2026-10-12T15:00:00Z", 5), "2026-10-12T20:00:00.000Z");   // 17:00: sale a su hora
  assert.equal(toque("2026-10-12T09:00:00Z", 21), null);                        // a las 9 ya cerró la ventana
});

test("una salida rota del modelo se convierte en pasarle la charla a Cande", () => {
  assert.equal(normalizar(null).accion, "pasar_a_cande");
  assert.equal(normalizar({ accion: "bailar" }).accion, "pasar_a_cande");
  assert.deepEqual(normalizar({ accion: "responder", mensajes: [" hola ", "", null] }).mensajes, ["hola"]);
  const larga = normalizar({ accion: "callar", aviso_para_cande: "a".repeat(5000), motivo: "m".repeat(5000) });
  assert.equal(larga.aviso_para_cande.length, 600); // Telegram rechaza un aviso de más de 4.096
  assert.equal(larga.motivo.length, 300);
});

/* ---------- el turno ---------- */

test("el turno son los mensajes del lead que faltan atender; lo del agente figura como de Cande", () => {
  const mensajes = [
    { id: 1, quien: "lead", texto: "uno" }, { id: 2, quien: "agente", texto: "Respuesta al uno?" },
    { id: 3, quien: "lead", texto: "dos" }, { id: 4, quien: "lead", texto: "tres" },
  ];
  const t = armarTurno(mensajes, { desde: 1 });
  assert.deepEqual(t.mensajes_del_lead, ["dos", "tres"]);
  assert.deepEqual(t.historial, [{ quien: "lead", texto: "uno" }, { quien: "cande", texto: "Respuesta al uno?" }]);
  assert.equal(t.contexto, null);
});

test("un mensaje que entró mientras salía la respuesta anterior sigue siendo del turno", () => {
  // El 11 llegó antes de que se anotara la respuesta al 10: en el orden queda antes que ella.
  const mensajes = [{ id: 10, quien: "lead", texto: "uno" }, { id: 11, quien: "lead", texto: "dos" }, { id: 12, quien: "agente", texto: "Respuesta al uno?" }];
  const t = armarTurno(mensajes, { desde: 10 });
  assert.deepEqual(t.mensajes_del_lead, ["dos"]);
  assert.equal(t.historial.length, 2);
});

test("en un seguimiento no hay mensajes nuevos, y el contexto de una charla cargada a mano va siempre", () => {
  const mensajes = [{ id: 1, quien: "lead", texto: "uno" }];
  const toque = armarTurno(mensajes, { evento: "seguimiento", ahora: AHORA, ultimoLead: new Date(AHORA - 6 * HORA), toque: 1, contexto: "contexto de prueba" });
  assert.deepEqual(toque.mensajes_del_lead, []);
  assert.equal(toque.historial.length, 1);
  assert.match(toque.contexto, /^SEGUIMIENTO.*hace 6 horas.*toque 2 de 2.*contexto de prueba$/);
  assert.equal(armarTurno(mensajes, { contexto: "contexto de prueba" }).contexto, "contexto de prueba");
});

/* ---------- el agente, con dobles ---------- */

const diferida = () => { let resolver; const promesa = new Promise((r) => { resolver = r; }); return { promesa, resolver }; };
const tick = async () => { for (let i = 0; i < 6; i++) await new Promise((r) => setImmediate(r)); };
const hasta = async (listo) => { for (let i = 0; i < 500 && !listo(); i++) await tick(); assert.ok(listo(), "no llegó a pasar lo que la prueba esperaba"); };

/**
 * Un agente con todo de mentira. `m` es el mundo: lo que hay guardado y lo que el agente hizo.
 * La charla arranca con el aviso ya dado (salvo conAviso: false) y un mensaje del lead, m.disparo.
 */
function armar({
  modo = "auto", envio = "api", toques = false, avisoIa, dueno = "agente", ultimoLeadHace = 1, tope = 12,
  prompt = "PROMPT {LINK_DE_PAGO}", conAviso = true, responde, mandar, avisoSale = true, pausaManyChat = true,
  ahora = AHORA, alEsperar, sinContacto = false, altas = false, topeAltas = 25, contextoAlta = "", altaAjena = false,
  hayManyChat = true, instagram = null, avisarCon = null,
} = {}) {
  const m = {
    ajustes: {
      modo, envio, espera_ms: 0, tope_por_dia: tope, toques, link_de_pago: "", altas, altas_por_dia: topeAltas, contexto_alta: contextoAlta,
      ...(avisoIa === undefined ? {} : { aviso_ia: avisoIa }),
    },
    contacto: {
      id: "77", nombre: "Lead de prueba", dueno, toques: 0, proximo_toque: null, respondido_hasta: 0, contexto: null,
      estado: {}, ultimo_lead: new Date(ahora - ultimoLeadHace * HORA),
    },
    mensajes: [...(conAviso ? [{ id: 1, quien: "agente", texto: AVISO }] : []), { id: 2, quien: "lead", texto: "mensaje de prueba" }],
    disparo: 2, tomado: null, proximo: undefined, altasHoy: 0,
    salidas: [], enviados: [], campos: [], avisos: [], pedidos: [], fallaAnotar: false, fallaSumarToque: false, calientes: [],
  };
  // Alguien que nunca pasó por la base: ni contacto ni mensajes.
  if (sinContacto) Object.assign(m, { contacto: null, mensajes: [], disparo: null });
  const delLead = () => m.mensajes.filter((x) => x.quien === "lead");
  const base = {
    tablas: async () => {},
    ajustes: async () => {
      if (m.fallarAjustes > 0) { m.fallarAjustes--; throw new Error("base caída al leer los ajustes"); }
      return m.ajustes;
    },
    prompt: async () => prompt,
    contacto: async () => (m.contacto ? { ...m.contacto } : null),
    anotarLead: async (id, texto) => (m.contacto?.dueno === "agente" ? m.entraLead(texto) : null),
    // Lo que la red de la bandeja ya guardó (lib/dm/bandeja.js): en estas pruebas, nada.
    guardadosPorLaRed: async () => [],
    marcarEco: async () => false,
    lugarParaAlta: async (id, tope) => (m.contacto || m.altasHoy >= tope ? null : m.altasHoy),
    darDeAlta: async (id, { nombre, texto, contexto, tope }) => {
      if (m.contacto || m.altasHoy >= tope) return null;
      m.contacto = {
        id, nombre, dueno: "agente", toques: 0, proximo_toque: null, respondido_hasta: 0, contexto: contexto || null,
        estado: {}, ultimo_lead: ahora, alta_en: ahora, alta_avisada: false,
      };
      if (altaAjena) return null; // la dio de alta el mensaje de al lado: a este pedido la base le dice que no fue él
      m.altasHoy++;
      m.mensajes.push({ id: m.mensajes.length + 1, quien: "lead", texto });
      return m.mensajes.length;
    },
    ultimoIdLead: async () => delLead().at(-1)?.id ?? null,
    historial: async (id, tope = 80) => {
      if (m.fallaHistorial) throw new Error("base caída al leer la charla");
      return m.mensajes.slice(-tope);
    },
    corridasEnUnDia: async () => m.salidas.filter((s) => !["aviso_fallido", "error"].includes(s.estado)).length,
    tomar: async (id, marca, { cualquierDueno = false } = {}) => {
      if (m.tomado || (m.contacto.dueno !== "agente" && !cualquierDueno)) return null;
      m.tomado = marca;
      return { ...m.contacto };
    },
    soltar: async (id, marca) => { if (m.tomado === marca) m.tomado = null; },
    descartarPendientes: async () => { m.descartados = (m.descartados || 0) + 1; },
    ponerDueno: async (id, d) => { m.contacto.dueno = d; m.contacto.proximo_toque = null; },
    guardarSalida: async (s) => { m.salidas.push({ ...s }); return m.salidas.length; },
    marcarSalida: async (idSalida, estado, detalle) => { Object.assign(m.salidas[idSalida - 1], { estado, detalle }); },
    anotar: async (id, quien, texto) => {
      if (m.fallaAnotar) throw new Error("base caída al anotar");
      m.mensajes.push({ id: m.mensajes.length + 1, quien, texto });
    },
    guardarEstado: async (id, e, p) => { m.contacto.estado = e; m.contacto.proximo_toque = p; m.proximo = p; },
    sumarToque: async () => {
      if (m.fallaSumarToque) throw new Error("base caída al contar el toque");
      m.contacto.toques++; m.contacto.proximo_toque = null;
    },
    cerrarTurno: async (id, cual) => { m.contacto.respondido_hasta = Math.max(m.contacto.respondido_hasta, cual); },
    // Lo que puso en el formulario y los turnos inmediatos (lib/dm/pagina.js): en estas pruebas, lo que diga m.
    formularioDeLaCharla: async () => m.formulario ?? null,
    agendarCaliente: async (id, motivo, minutos) => { m.calientes.push([motivo, minutos]); return true; },
    contarToque: async () => { m.contacto.toques++; },
    marcarAltaAvisada: async () => { m.contacto.alta_avisada = true; },
    borrarCharla: async () => { m.contacto = { ...m.contacto, dueno: "cande", nombre: null, estado: {} }; m.mensajes = []; m.salidas = []; m.borrada = true; },
    // La constancia del aviso de las fotos, como base.reclamarAvisoFoto y soltarAvisoFoto. La hora de la
    // base es m.ahora (si la prueba la mueve) o la del agente.
    reclamarAvisoFoto: async (id, hastaId) => {
      const c = m.contacto;
      const ya = (m.ahora ?? ahora).getTime();
      const en = c.foto_avisada_en ? c.foto_avisada_en.getTime() : null;
      if ((c.foto_avisada_hasta || 0) >= hastaId || (en !== null && en >= ya - 2 * 60000)) return null;
      const antes = { hasta: c.foto_avisada_hasta || 0, en: c.foto_avisada_en || null };
      Object.assign(c, { foto_avisada_hasta: hastaId, foto_avisada_en: new Date(ya) });
      return antes;
    },
    soltarAvisoFoto: async (id, hastaId, antes) => {
      if (m.contacto.foto_avisada_hasta === hastaId) Object.assign(m.contacto, { foto_avisada_hasta: antes.hasta, foto_avisada_en: antes.en });
    },
  };
  const pedir = async (p) => {
    m.pedidos.push(p);
    return responde ? responde(p, m) : salida(["Respuesta de prueba?"]);
  };
  const manychat = {
    hayManyChat: () => hayManyChat,
    mandarTextos: mandar || (async (id, textos) => { m.enviados.push(...textos); return { ok: true }; }),
    ponerCampo: async (id, campo, valor) => { m.campos.push([campo, valor]); return { ok: pausaManyChat }; },
  };
  const avisar = avisarCon || (async (titulo, campos) => { m.avisos.push({ titulo, campos }); return avisoSale; });
  // Lo que hace un mensaje de verdad al entrar: se guarda, abre la ventana y pone los toques en cero.
  m.entraLead = (texto) => {
    const id = m.mensajes.length + 1;
    m.mensajes.push({ id, quien: "lead", texto });
    Object.assign(m.contacto, { ultimo_lead: ahora, toques: 0, proximo_toque: null });
    return id;
  };
  const esperar = async () => { await tick(); alEsperar?.(m); };
  const agente = crearAgente({ base, pedir, manychat, avisar, esperar, reloj: () => ahora, instagram, esperaInstagramMs: 50 });
  return { agente, m };
}

/** Un toque de seguimiento listo para salir: el lead calló hace 6 horas y ya recibió el link. */
function armarToque(opciones = {}) {
  const mundo = armar({ toques: true, ultimoLeadHace: 6, responde: () => salida(["Mensaje de seguimiento?"]), ...opciones });
  mundo.m.contacto.estado = { ...estadoDev, link_formulario_enviado: true };
  mundo.m.contacto.respondido_hasta = mundo.m.disparo;
  return mundo;
}
const toque = (agente) => agente.procesar("77", null, { evento: "seguimiento" });

test("contesta: manda, anota lo que mandó, guarda el estado, cierra el turno y suelta la traba", async () => {
  const { agente, m } = armar();
  const r = await agente.procesar("77", m.disparo);
  assert.equal(r.hecho, "enviada");
  assert.deepEqual(m.enviados, ["Respuesta de prueba?"]);
  assert.equal(m.mensajes.at(-1).quien, "agente");
  assert.equal(m.salidas.length, 1);
  assert.equal(m.salidas[0].estado, "enviada");
  assert.equal(m.contacto.dueno, "agente");
  assert.deepEqual(m.contacto.estado, estadoDev);
  assert.equal(m.contacto.respondido_hasta, m.disparo);
  assert.equal(m.pedidos[0].prompt, "PROMPT (sin cargar)");
  assert.deepEqual(m.pedidos[0].turno.mensajes_del_lead, ["mensaje de prueba"]);
  assert.equal(m.tomado, null);
});

test("apagado no hace nada", async () => {
  const { agente, m } = armar({ modo: "apagado" });
  assert.equal((await agente.procesar("77", m.disparo)).hecho, "apagado");
  assert.equal(m.pedidos.length, 0);
});

test("si lo apagan mientras espera la ráfaga, no llega ni a pedirle la respuesta al modelo", async () => {
  const { agente, m } = armar({ alEsperar: (mundo) => { mundo.ajustes = { ...mundo.ajustes, modo: "apagado" }; } });
  assert.equal((await agente.procesar("77", m.disparo)).hecho, "apagado");
  assert.equal(m.pedidos.length + m.salidas.length, 0);
});

test("un modo que no es auto ni sombra es apagado: nada raro guardado hace que mande", async () => {
  for (const modo of [null, "", 0, false, "pausado", "AUTO"]) {
    const { agente, m } = armar({ modo });
    assert.equal((await agente.procesar("77", m.disparo)).hecho, "apagado", JSON.stringify(modo));
    assert.equal(m.pedidos.length + m.enviados.length, 0);
  }
});

test("una charla de Cande no se toca", async () => {
  const { agente, m } = armar({ dueno: "cande" });
  assert.equal((await agente.procesar("77", m.disparo)).hecho, "no es del agente");
  assert.equal(m.pedidos.length + m.enviados.length, 0);
});

test("si llegó otro mensaje durante la espera, esta corrida no contesta", async () => {
  const { agente, m } = armar();
  m.entraLead("otro mensaje de prueba");
  assert.equal((await agente.procesar("77", m.disparo)).hecho, "llegó otro mensaje");
  assert.equal(m.pedidos.length + m.enviados.length, 0);
});

test("con la ventana de 24 horas cerrada no escribe", async () => {
  const { agente, m } = armar({ ultimoLeadHace: 25 });
  assert.equal((await agente.procesar("77", m.disparo)).hecho, "ventana de 24 horas cerrada");
  assert.equal(m.enviados.length, 0);
  assert.equal(m.tomado, null);
});

test("lo que rompe un freno no sale: la charla pasa a Cande con el motivo y con el aviso del modelo", async () => {
  const { agente, m } = armar({ responde: () => salida(["Mañana te escribo"], { aviso_para_cande: "HOY: aviso de prueba" }) });
  const r = await agente.procesar("77", m.disparo);
  assert.equal(r.hecho, "frenada");
  assert.equal(m.enviados.length, 0);
  assert.equal(m.contacto.dueno, "cande");
  assert.equal(m.salidas[0].estado, "frenada");
  assert.equal(m.avisos.length, 1);
  assert.equal(m.avisos[0].titulo, "Lead de prueba · DM URGENTE: te paso una charla");
  assert.equal(m.avisos[0].campos["Aviso del agente"], "HOY: aviso de prueba");
  assert.match(m.avisos[0].campos.Quién, /Lead de prueba \(77\)/);
  assert.deepEqual(m.campos, [["dm_dueno", "cande"]]);
  assert.equal(m.contacto.respondido_hasta, m.disparo);
});

test("si el modelo no está (la Mac sin red), al lead no le llega nada, la charla sigue del agente y el turno queda abierto", async () => {
  // 16/10: la Mac sin red por unos minutos le pasaba a Cande charlas sanas. Ahora el cron reintenta.
  const { agente, m } = armar({ responde: () => { throw transitoria("Anthropic contestó 529"); } });
  const r = await agente.procesar("77", m.disparo);
  assert.equal(r.hecho, "error del modelo");
  assert.equal(r.reintento, true);
  assert.equal(m.enviados.length, 0);
  assert.equal(m.contacto.dueno, "agente");
  assert.equal(m.avisos.length, 0);
  assert.equal(m.salidas[0].estado, "error");
  assert.ok(m.contacto.respondido_hasta < m.disparo);
  assert.equal(m.tomado, null);
});

test("el reintento tarde contesta sin esperar, sale por la API aunque el envío sea por campo y cierra el turno", async () => {
  let esperas = 0;
  const { agente, m } = armar({ envio: "campo", ultimoLeadHace: 2, alEsperar: () => { esperas++; } });
  const r = await agente.procesar("77", m.disparo, { tarde: true });
  assert.equal(r.hecho, "enviada");
  assert.equal(esperas, 0);
  assert.deepEqual(m.enviados, ["Respuesta de prueba?"]);
  assert.equal(m.salidas.at(-1).estado, "enviada");
  assert.equal(m.contacto.respondido_hasta, m.disparo);
  assert.match(m.pedidos[0].turno.contexto, /Contestás tarde: el lead escribió hace 120 minutos/);
  // Disculparse por la demora lo frena el freno de "parece una persona": la nota no lo pide.
  assert.doesNotMatch(m.pedidos[0].turno.contexto, /Sorry la demora/i);
  assert.deepEqual(m.pedidos[0].turno.mensajes_del_lead, ["mensaje de prueba"]);
});

test("si el modelo se niega o devuelve algo ilegible, al lead no le llega nada y la charla espera, anotada como falla de esa charla", async () => {
  // Antes pasaba a Cande enseguida. 19/10: nada pasa por una sola falla; esta cuenta para el tope de la
  // charla y el cron se la pasa recién a la tercera (decidirSinContestar).
  const { agente, m } = armar({ responde: () => { throw propia("el modelo no quiso contestar este turno"); } });
  const r = await agente.procesar("77", m.disparo);
  assert.equal(r.hecho, "error del modelo");
  assert.equal(r.general, false);
  assert.equal(m.enviados.length, 0);
  assert.equal(m.contacto.dueno, "agente");
  assert.equal(m.avisos.length, 0);
  assert.ok(m.contacto.respondido_hasta < m.disparo);
  assert.deepEqual(m.salidas.map((x) => [x.accion, x.estado, x.motivo]), [["error", "error", FALLA_PROPIA]]);
});

test("un reintento que vuelve a fallar tampoco pasa la charla: el cron decide después", async () => {
  const { agente, m } = armar({ envio: "campo", responde: () => { throw transitoria("la Mac no contestó"); } });
  assert.equal((await agente.procesar("77", m.disparo, { tarde: true })).hecho, "error del modelo");
  assert.equal(m.contacto.dueno, "agente");
  assert.equal(m.avisos.length, 0);
});

test("el reintento tarde no tiene la traba mientras se genera: el mensaje nuevo arranca enseguida", async () => {
  const generando = diferida();
  const { agente, m } = armar({ envio: "campo", responde: (p) => (p.turno.mensajes_del_lead.length > 1 ? salida(["Respuesta de prueba?"]) : generando.promesa) });
  const corrida = agente.procesar("77", m.disparo, { tarde: true });
  await hasta(() => m.pedidos.length === 1);
  assert.equal(m.tomado, null);
  const id = m.entraLead("hola?");
  assert.equal((await agente.procesar("77", id)).hecho, "lista para retirar");
  generando.resolver(salida(["Respuesta vieja?"]));
  assert.equal((await corrida).hecho, "llegó otro mensaje durante la generación");
  assert.equal(m.enviados.length, 0);
});

test("si Cande escribió en la charla mientras el agente no podía, el reintento no contesta encima: se la pasa", async () => {
  const { agente, m } = armar({ envio: "campo" });
  m.mensajes.push({ id: m.mensajes.length + 1, quien: "cande", texto: "una respuesta de Cande" });
  assert.equal((await agente.procesar("77", m.disparo, { tarde: true })).hecho, "pasada a Cande");
  assert.equal(m.pedidos.length + m.enviados.length, 0);
  assert.equal(m.contacto.dueno, "cande");
  assert.equal(m.avisos.length, 1);
  assert.match(m.avisos[0].campos["Lo último que dijo"], /mensaje de prueba/);
});

test("un mensaje del agente después del mensaje sin atender no lo da por contestado (el orden de los ids no dice eso)", async () => {
  const { agente, m } = armar({ envio: "campo" });
  m.mensajes.push({ id: 3, quien: "agente", texto: "una respuesta anotada tarde" });
  const r = await agente.procesar("77", m.disparo, { tarde: true });
  assert.equal(r.hecho, "enviada");
  assert.deepEqual(m.pedidos[0].turno.mensajes_del_lead, ["mensaje de prueba"]);
});

test("los fallos del reintento quedan marcados como reintento; los de un mensaje, como error", async () => {
  const { agente, m } = armar({ envio: "campo", responde: () => { throw transitoria("la Mac no contestó"); } });
  await agente.procesar("77", m.disparo);
  await agente.procesar("77", m.disparo, { tarde: true });
  assert.deepEqual(m.salidas.map((x) => x.accion), ["error", "reintento"]);
});

test("después de una respuesta tarde, el seguimiento nunca sale antes de 4 horas", async () => {
  const { agente, m } = armar({
    envio: "campo", toques: true, ultimoLeadHace: 5.6,
    responde: () => salida(["Respuesta de prueba?"], { seguimiento_en_horas: 6, estado: { ...estadoDev, link_formulario_enviado: true } }),
  });
  assert.equal((await agente.procesar("77", m.disparo, { tarde: true })).hecho, "enviada");
  assert.ok(m.proximo === null || m.proximo.getTime() >= AHORA.getTime() + 4 * HORA);
});

test("si el reintento falla sin arreglo pero el lead ya escribió de nuevo, no pasa la charla: es de la corrida nueva", async () => {
  const generando = diferida();
  const { agente, m } = armar({ envio: "campo", responde: () => generando.promesa });
  const corrida = agente.procesar("77", m.disparo, { tarde: true });
  await hasta(() => m.pedidos.length === 1);
  m.entraLead("hola?");
  generando.promesa.catch(() => {});
  const falla = new Error("el modelo no quiso contestar este turno");
  generando.resolver(Promise.reject(falla));
  const r = await corrida;
  assert.equal(r.hecho, "error del modelo");
  assert.equal(m.contacto.dueno, "agente");
  assert.equal(m.avisos.length, 0);
  assert.equal(m.salidas.at(-1).accion, "reintento");
});

test("si Cande contesta mientras se genera el reintento, no sale", async () => {
  const generando = diferida();
  const { agente, m } = armar({ envio: "campo", responde: () => generando.promesa });
  const corrida = agente.procesar("77", m.disparo, { tarde: true });
  await hasta(() => m.pedidos.length === 1);
  m.mensajes.push({ id: m.mensajes.length + 1, quien: "cande", texto: "una respuesta de Cande" });
  generando.resolver(salida(["Respuesta vieja?"]));
  assert.equal((await corrida).hecho, "la charla cambió durante la generación");
  assert.equal(m.enviados.length, 0);
});

test("los intentos fallidos no cuentan para el tope del día", async () => {
  let falla = true;
  const { agente, m } = armar({ envio: "campo", tope: 2, responde: () => { if (falla) throw transitoria("la Mac no contestó"); return salida(["Respuesta de prueba?"]); } });
  for (let i = 0; i < 3; i++) assert.equal((await agente.procesar("77", m.disparo, { tarde: true })).hecho, "error del modelo");
  falla = false;
  assert.equal((await agente.procesar("77", m.disparo, { tarde: true })).hecho, "enviada");
  assert.deepEqual(m.enviados, ["Respuesta de prueba?"]);
});

test("qué hace el cron con un mensaje sin atender: el tiempo solo no pasa nada a Cande", () => {
  // Antes pasaba a la hora sin poder contestar ("me explota el teléfono cada vez que apago la compu").
  const ops = { prendido: true, macViva: true, maxFallos: 3 };
  assert.equal(decidirSinContestar({ minutos: 12 }, ops).que, "reintentar");
  assert.equal(decidirSinContestar({ minutos: 12 }, { ...ops, macViva: false }).que, "esperar");
  assert.equal(decidirSinContestar({ minutos: "400" }, ops).que, "reintentar");
  assert.equal(decidirSinContestar({ minutos: 1300 }, { ...ops, macViva: false }).que, "esperar");
  assert.equal(decidirSinContestar({ minutos: 12 }, { ...ops, prendido: false }).que, "pasar");
  assert.equal(decidirSinContestar({ minutos: 12, quizas_salio: true }, ops).que, "pasar");
  assert.equal(decidirSinContestar({ minutos: 12, quizas_salio: true }, { ...ops, macViva: false }).que, "pasar");
  assert.equal(decidirSinContestar({ minutos: 12, fallos: 4 }, { ...ops, maxFallos: 4 }).que, "pasar");
  assert.match(decidirSinContestar({ minutos: 12, fallos: 4 }, { ...ops, maxFallos: 4 }).aviso, /falló 4 veces con esta charla/);
  assert.equal(decidirSinContestar({ minutos: 12, fallos: "3" }, ops).que, "pasar");
  assert.equal(decidirSinContestar({ minutos: 12, fallos: 3 }, { ...ops, maxFallos: 4 }).que, "reintentar");
  assert.equal(decidirSinContestar({ minutos: 12, fallos: 2 }, { prendido: true, macViva: true }).que, "reintentar", "el tope de fábrica es 3");
  assert.equal(REINTENTO_MAX_FALLOS, 3);
  for (const d of [decidirSinContestar({ quizas_salio: true }, ops), decidirSinContestar({ fallos: 3 }, ops), decidirSinContestar({}, { ...ops, prendido: false })]) {
    assert.doesNotMatch(`${d.aviso} ${d.motivo}`, /[—¿¡]/, "sin guion largo ni signos de apertura");
  }
});

/** Lo que hace base.reclamarEspera, en memoria: una charla apartada por una sola corrida, y no más de `tope` para contestar. */
function apartadasDePrueba({ hechas = new Set() } = {}) {
  const apartadas = new Set();
  const reclamar = async (id, { tope = null, paraPasar = false } = {}) => {
    const libre = !apartadas.has(id) && (paraPasar || !hechas.has(id));
    const hayLugar = tope == null || apartadas.size < tope;
    if (libre && hayLugar) {
      apartadas.add(id);
      return { tomada: true, lleno: false };
    }
    return { tomada: false, lleno: tope != null && apartadas.size >= tope };
  };
  return { apartadas, hechas, reclamar, soltar: async (id) => { apartadas.delete(id); } };
}

test("el cron de los toques pasa a Cande solo lo que no tiene arreglo, y apartado; lo demás queda en espera, sin aviso", async () => {
  const pasados = [];
  const filas = [
    { id: "1", ultimo_id_lead: "10", minutos: 12 },
    { id: "2", ultimo_id_lead: "20", minutos: 400 },
    { id: "3", ultimo_id_lead: "30", minutos: 15, quizas_salio: true },
    { id: "4", ultimo_id_lead: "40", minutos: 20, fallos: 3 },
    { id: "5", ultimo_id_lead: "50", minutos: 20, quizas_salio: true },
  ];
  const a = apartadasDePrueba();
  a.apartadas.add("5"); // la está contestando el cron de la espera: se decide en la vuelta siguiente
  const pasadas = await pasarSinContestar({
    filas, prendido: true, macViva: true, maxFallos: 3,
    apartar: async (id) => (await a.reclamar(id, { paraPasar: true })).tomada, soltar: a.soltar,
    pasar: async (c, aviso) => { assert.ok(a.apartadas.has(c.id), "se pasa apartada"); pasados.push([c.id, aviso.motivo]); },
  });
  assert.deepEqual(pasados, [["3", "envío sin confirmar"], ["4", "el modelo no pudo con esta charla"]]);
  assert.equal(pasadas, 2);
  assert.deepEqual([...a.apartadas], ["5"], "suelta las que pasó");
  // Apagado sí pasa todo (es de Cande decidir), con la Mac o sin ella.
  const apagado = [];
  await pasarSinContestar({
    filas: filas.slice(0, 2), prendido: false, macViva: false, maxFallos: 3,
    apartar: async () => true, soltar: async () => {}, pasar: async (c, aviso) => { apagado.push([c.id, aviso.motivo]); },
  });
  assert.deepEqual(apagado, [["1", "agente apagado"], ["2", "agente apagado"]]);
});

test("el cron de la espera contesta tarde lo que espera, de a una por charla, con el mensaje de cada una, y no toca lo que se pasa", async () => {
  const llamados = [];
  const filas = [
    { id: "1", ultimo_id_lead: "10", minutos: 900 },
    { id: "2", ultimo_id_lead: "20", minutos: 400, quizas_salio: true },
    { id: "3", ultimo_id_lead: "30", minutos: 15, fallos: 3 },
    { id: "4", ultimo_id_lead: "40", minutos: 20 },
  ];
  const a = apartadasDePrueba();
  const r = await vaciarEspera({
    filas, prendido: true, macViva: true, maxFallos: 3, reclamar: (id) => a.reclamar(id, { tope: 2 }), soltar: a.soltar,
    procesar: async (id, idLead) => { assert.ok(a.apartadas.has(id)); llamados.push([id, idLead]); return { hecho: "enviada" }; },
    hasta: Infinity,
  });
  assert.deepEqual(llamados, [["1", 10], ["4", 40]]);
  assert.deepEqual(r, { reintentos: 2, cayo: false });
  assert.equal(a.apartadas.size, 0);
  assert.equal(hayEspera(filas, { prendido: true, macViva: true, maxFallos: 3 }), true);
  assert.equal(hayEspera(filas, { prendido: true, macViva: false, maxFallos: 3 }), false);
});

test("la espera: si el modelo falla para todas (la Mac se fue, o sin uso) no arranca ninguna más; si la falla es de una charla, sigue", async () => {
  const filas = [1, 2, 3].map((n) => ({ id: String(n), ultimo_id_lead: n, minutos: 12 }));
  const correr = async (r, extra = {}) => {
    const llamados = [];
    const a = apartadasDePrueba();
    const hecho = await vaciarEspera({
      filas, prendido: true, macViva: true, maxFallos: 3, reclamar: (id) => a.reclamar(id), soltar: a.soltar, hasta: Infinity, enParalelo: 1,
      procesar: async (id) => { llamados.push(id); return typeof r === "function" ? r(id) : r; }, ...extra,
    });
    return { llamados, ...hecho };
  };
  const caida = await correr({ hecho: "error del modelo", transitorio: true, general: true });
  assert.deepEqual(caida.llamados, ["1"]);
  assert.equal(caida.cayo, true);
  // Antes la Mac sin uso seguía (cada charla pasaba a Cande): ahora también corta, nada pasa.
  const sinUso = await correr({ hecho: "error del modelo", transitorio: false, general: true });
  assert.deepEqual(sinUso.llamados, ["1"]);
  assert.equal(sinUso.cayo, true);
  const una = await correr((id) => (id === "1" ? { hecho: "error del modelo", transitorio: false, general: false } : { hecho: "enviada" }));
  assert.deepEqual(una.llamados, ["1", "2", "3"]);
  assert.equal(una.cayo, false);
  const sinMac = await correr({ hecho: "enviada" }, { macViva: false, procesar: async () => { throw new Error("no tenía que llamar"); } });
  assert.deepEqual([sinMac.reintentos, sinMac.cayo], [0, false]);
  const registrados = [];
  const tira = await correr((id) => { if (id === "2") throw new Error("falló"); return { hecho: "enviada" }; }, { registrar: (id) => registrados.push(id) });
  assert.deepEqual([tira.llamados, registrados], [["1", "2", "3"], ["2"]]);
});

test("cualquier otra falla termina igual: sin prompt cargado, la charla pasa a Cande con aviso", async () => {
  const { agente, m } = armar({ prompt: "" });
  const r = await agente.procesar("77", m.disparo);
  assert.equal(r.hecho, "error");
  assert.match(r.error, /no hay prompt/);
  assert.equal(m.pedidos.length + m.enviados.length, 0);
  assert.equal(m.contacto.dueno, "cande");
  assert.equal(m.avisos.length, 1);
  assert.equal(m.tomado, null);
});

test("si ManyChat no manda, la charla pasa a Cande con el código del error", async () => {
  const { agente, m } = armar({ mandar: async () => ({ ok: false, error: "código 3011 | ventana cerrada" }) });
  const r = await agente.procesar("77", m.disparo);
  assert.equal(r.hecho, "error al mandar");
  assert.equal(m.contacto.dueno, "cande");
  assert.equal(m.salidas[0].estado, "error");
  assert.match(m.avisos[0].campos.Motivo, /3011/);
  assert.equal(m.mensajes.filter((x) => x.quien === "agente").length, 1); // solo el aviso que ya estaba
});

test("si ManyChat tarda y no se sabe si salió, queda anotado y Cande lo mira antes de reenviar", async () => {
  const { agente, m } = armar({ mandar: async () => ({ ok: false, incierto: true, error: "tardó más de 8 segundos" }) });
  const r = await agente.procesar("77", m.disparo);
  assert.equal(r.hecho, "envío incierto");
  assert.equal(m.salidas[0].estado, "incierta");
  assert.equal(m.mensajes.at(-1).quien, "agente");
  assert.equal(m.contacto.dueno, "cande");
  assert.match(m.avisos[0].campos.Aviso, /No sé si salió/);
});

test("sombra: no manda, deja el borrador, cierra el turno y le avisa a Cande con lo que mandaría", async () => {
  const { agente, m } = armar({ modo: "sombra" });
  const r = await agente.procesar("77", m.disparo);
  assert.equal(r.hecho, "borrador");
  assert.equal(m.enviados.length, 0);
  assert.equal(m.salidas[0].estado, "borrador");
  assert.equal(m.contacto.dueno, "agente");
  assert.equal(m.contacto.respondido_hasta, m.disparo);
  assert.match(m.avisos[0].campos["Mandaría"], /Respuesta de prueba/);
});

test("pasar a Cande: manda su única pregunta, cambia el dueño y avisa con lo que mandó", async () => {
  const responde = () => salida(["Pregunta de prueba?"], { accion: "pasar_a_cande", ...como("construye"), aviso_para_cande: "aviso de prueba" });
  const { agente, m } = armar({ responde });
  const r = await agente.procesar("77", m.disparo);
  assert.equal(r.hecho, "pasada a Cande");
  assert.deepEqual(m.enviados, ["Pregunta de prueba?"]);
  assert.equal(m.contacto.dueno, "cande");
  assert.equal(m.avisos[0].titulo, "Lead de prueba · DM: te paso una charla");
  assert.equal(m.avisos[0].campos.Aviso, "aviso de prueba");
  assert.equal(m.avisos[0].campos["El agente le mandó"], "Pregunta de prueba?");
  assert.equal(m.proximo, null);
});

test("pasar a Cande: cuando el mensaje sale, en la base la charla ya figura como de Cande", async () => {
  // Si la función muere justo después de mandar, la charla no puede quedar como del agente.
  let mundo = null;
  let alMandar = null;
  const mandar = async () => { alMandar = { dueno: mundo.m.contacto.dueno, salidas: mundo.m.salidas.map((s) => s.estado) }; return { ok: true }; };
  mundo = armar({ mandar, responde: () => salida(["Pregunta de prueba?"], { accion: "pasar_a_cande", ...como("construye") }) });
  await mundo.agente.procesar("77", mundo.m.disparo);
  assert.deepEqual(alMandar, { dueno: "cande", salidas: ["enviando"] });
  assert.equal(mundo.m.salidas[0].estado, "enviada");
});

test("callar: no manda ni avisa, pero el turno queda atendido", async () => {
  const { agente, m } = armar({ responde: () => salida([], { accion: "callar" }) });
  assert.equal((await agente.procesar("77", m.disparo)).hecho, "calló");
  assert.equal(m.enviados.length + m.avisos.length, 0);
  assert.equal(m.salidas[0].estado, "callo");
  assert.equal(m.contacto.respondido_hasta, m.disparo);
});

test("el tope del día cuenta turnos (también borradores y silencios), no globos", async () => {
  const { agente, m } = armar({ tope: 2, modo: "sombra" });
  assert.equal((await agente.procesar("77", m.disparo)).hecho, "borrador");
  assert.equal((await agente.procesar("77", m.entraLead("segundo"))).hecho, "borrador");
  const r = await agente.procesar("77", m.entraLead("tercero"));
  assert.equal(r.hecho, "tope del día");
  assert.equal(m.pedidos.length, 2);
  assert.equal(m.contacto.dueno, "cande");
});

test("quien escribe sin parar mientras se genera también llega al tope del día", async () => {
  // Cada respuesta queda pisada por un mensaje nuevo: no sale ninguna, pero cada una costó un pedido.
  const { agente, m } = armar({ tope: 3, responde: (p, mundo) => { mundo.entraLead("otro mensaje de prueba"); return salida(["Respuesta de prueba?"]); } });
  for (let n = 0; n < 3; n++) {
    assert.equal((await agente.procesar("77", m.mensajes.at(-1).id)).hecho, "llegó otro mensaje durante la generación");
  }
  assert.deepEqual(m.salidas.map((x) => x.estado), ["descartada", "descartada", "descartada"]);
  const r = await agente.procesar("77", m.mensajes.at(-1).id);
  assert.equal(r.hecho, "tope del día");
  assert.equal(m.pedidos.length, 3);
  assert.equal(m.enviados.length, 0);
  assert.equal(m.contacto.dueno, "cande");
  assert.equal(m.avisos.length, 1);
});

test("envío por campo: queda lista para que ManyChat la retire, el servidor no manda ni la anota todavía", async () => {
  const { agente, m } = armar({ envio: "campo" });
  assert.equal((await agente.procesar("77", m.disparo)).hecho, "lista para retirar");
  assert.equal(m.enviados.length, 0);
  assert.equal(m.salidas[0].estado, "pendiente");
  assert.equal(m.mensajes.filter((x) => x.quien === "agente").length, 1); // la anota /api/dm/recoger al retirarla
  // El turno lo cierra el retiro: si el lead escribe antes, la corrida nueva recibe los dos mensajes.
  assert.equal(m.contacto.respondido_hasta, 0);
  assert.equal((await agente.procesar("77", m.entraLead("otro mensaje de prueba"))).hecho, "lista para retirar");
  assert.deepEqual(m.pedidos[1].turno.mensajes_del_lead, ["mensaje de prueba", "otro mensaje de prueba"]);
});

/* ---------- el aviso de que es automático ---------- */

test("el primer mensaje sin el aviso de que es automático no sale", async () => {
  const { agente, m } = armar({ conAviso: false });
  const r = await agente.procesar("77", m.disparo);
  assert.equal(r.hecho, "frenada");
  assert.equal(r.motivo, "primer mensaje sin avisar que es automático");
  assert.equal(m.enviados.length, 0);
});

test("con el aviso en el mensaje sale, y también si el aviso ya lo había mandado Cande a mano", async () => {
  const conAviso = armar({ conAviso: false, responde: () => salida([AVISO, "Pregunta de prueba?"]) });
  assert.equal((await conAviso.agente.procesar("77", conAviso.m.disparo)).hecho, "enviada");
  const deCande = armar({ conAviso: false });
  deCande.m.mensajes.unshift({ id: 1, quien: "cande", texto: AVISO });
  assert.equal((await deCande.agente.procesar("77", deCande.m.disparo)).hecho, "enviada");
});

test("con el ajuste aviso_ia en false el aviso no se exige", async () => {
  const { agente, m } = armar({ conAviso: false, avisoIa: false });
  assert.equal((await agente.procesar("77", m.disparo)).hecho, "enviada");
});

/* ---------- dos cosas a la vez ---------- */

test("ráfaga durante la generación: la corrida vieja no manda y la nueva contesta una vez el turno entero", async () => {
  const generando = diferida();
  let n = 0;
  const { agente, m } = armar({ responde: () => (++n === 1 ? generando.promesa : salida(["Respuesta al turno entero?"])) });
  const vieja = agente.procesar("77", m.disparo);
  await hasta(() => m.pedidos.length === 1);
  const nueva = agente.procesar("77", m.entraLead("otro mensaje de prueba"));
  await tick(); await tick(); // la nueva ya está esperando la traba
  generando.resolver(salida(["Respuesta vieja?"]));
  const [r1, r2] = await Promise.all([vieja, nueva]);
  assert.equal(r1.hecho, "llegó otro mensaje durante la generación");
  assert.equal(r2.hecho, "enviada");
  assert.deepEqual(m.enviados, ["Respuesta al turno entero?"]);
  assert.deepEqual(m.pedidos[1].turno.mensajes_del_lead, ["mensaje de prueba", "otro mensaje de prueba"]);
  assert.equal(m.tomado, null);
});

test("si la traba no se libera nunca, el mensaje no se pierde callado: pasa a Cande con aviso", async () => {
  const { agente, m } = armar();
  m.tomado = "una corrida que murió";
  const r = await agente.procesar("77", m.disparo);
  assert.equal(r.hecho, "otra corrida lo tiene");
  assert.equal(m.pedidos.length, 0);
  assert.equal(m.contacto.dueno, "cande");
  assert.match(m.avisos[0].campos.Aviso, /sin contestar/);
  assert.equal(m.tomado, "una corrida que murió"); // la traba ajena no se toca
});

test("si llega otro mensaje mientras espera la traba, cede el lugar a la corrida de ese mensaje", async () => {
  const { agente, m } = armar();
  m.tomado = "otra corrida";
  const corrida = agente.procesar("77", m.disparo);
  await tick(); await tick();
  m.entraLead("otro mensaje de prueba");
  assert.equal((await corrida).hecho, "llegó otro mensaje");
  assert.equal(m.avisos.length, 0);
  assert.equal(m.contacto.dueno, "agente");
});

test("si Cande toma la charla mientras se genera, la respuesta se descarta", async () => {
  const generando = diferida();
  const { agente, m } = armar({ responde: () => generando.promesa });
  const corrida = agente.procesar("77", m.disparo);
  await hasta(() => m.pedidos.length === 1);
  m.contacto.dueno = "cande";
  generando.resolver(salida(["Respuesta de prueba?"]));
  assert.equal((await corrida).hecho, "descartada");
  assert.equal(m.enviados.length, 0);
  assert.equal(m.salidas[0].estado, "descartada");
});

test("si Cande anota que ya contestó mientras la corrida espera, no se le pide nada al modelo", async () => {
  // Lo que hace anotarAMano: guarda lo suyo y da por atendido lo que el lead había escrito.
  const anota = (mundo) => {
    mundo.mensajes.push({ id: mundo.mensajes.length + 1, quien: "cande", texto: "respuesta a mano de prueba" });
    mundo.contacto.respondido_hasta = mundo.disparo;
  };
  for (const modo of ["auto", "sombra"]) {
    const { agente, m } = armar({ modo, alEsperar: anota });
    assert.equal((await agente.procesar("77", m.disparo)).hecho, "ya estaba atendido", modo);
    assert.equal(m.pedidos.length + m.enviados.length + m.salidas.length + m.avisos.length, 0, modo);
    assert.equal(m.contacto.dueno, "agente");
    assert.equal(m.tomado, null);
  }
});

test("si Cande anota que ya contestó mientras se genera, la respuesta no sale detrás de la suya", async () => {
  const generando = diferida();
  const { agente, m } = armar({ responde: () => generando.promesa });
  const corrida = agente.procesar("77", m.disparo);
  await hasta(() => m.pedidos.length === 1);
  m.mensajes.push({ id: 3, quien: "cande", texto: "respuesta a mano de prueba" });
  m.contacto.respondido_hasta = m.disparo;
  generando.resolver(salida(["Respuesta de prueba?"]));
  assert.equal((await corrida).hecho, "descartada");
  assert.equal(m.enviados.length, 0);
  assert.equal(m.salidas[0].estado, "descartada");
  assert.equal(m.contacto.dueno, "agente");
});

test("si apagan todo mientras se genera, la respuesta se descarta", async () => {
  for (const modo of ["apagado", "sombra", null]) {
    const generando = diferida();
    const { agente, m } = armar({ responde: () => generando.promesa });
    const corrida = agente.procesar("77", m.disparo);
    await hasta(() => m.pedidos.length === 1);
    m.ajustes = { ...m.ajustes, modo };
    generando.resolver(salida(["Respuesta de prueba?"]));
    assert.equal((await corrida).hecho, "descartada", JSON.stringify(modo));
    assert.equal(m.enviados.length, 0);
  }
});

test("pasar a Cande: aunque falle una escritura después de mandar, la charla pasa y ella se entera", async () => {
  const responde = () => salida(["Pregunta de prueba?"], { accion: "pasar_a_cande", ...como("construye"), aviso_para_cande: "HOY: aviso de prueba" });
  const { agente, m } = armar({ responde });
  m.fallaAnotar = true;
  const r = await agente.procesar("77", m.disparo);
  assert.equal(r.hecho, "enviada sin guardar");
  assert.deepEqual(m.enviados, ["Pregunta de prueba?"]);
  assert.equal(m.contacto.dueno, "cande");
  assert.equal(m.avisos.length, 1);
  assert.equal(m.avisos[0].campos["El agente le mandó"], "Pregunta de prueba?");
});

/* ---------- los avisos a Cande ---------- */

test("del aviso del modelo, cuando el agente sigue con la charla o calla, a Cande le llega solo lo urgente", async () => {
  // 16/10: "los avisos tienen que ser solo de los que el bot no sabe qué hacer o si es relevante".
  const sigue = armar({ responde: () => salida(["Respuesta de prueba?"], { aviso_para_cande: "aviso de prueba" }) });
  assert.equal((await sigue.agente.procesar("77", sigue.m.disparo)).hecho, "enviada");
  assert.equal(sigue.m.avisos.length, 0);
  assert.equal(sigue.m.salidas[0].aviso, "aviso de prueba");
  assert.equal(sigue.m.contacto.dueno, "agente");
  const urgente = armar({ responde: () => salida(["Respuesta de prueba?"], { aviso_para_cande: "HOY: preguntó si es un bot" }) });
  await urgente.agente.procesar("77", urgente.m.disparo);
  assert.equal(urgente.m.avisos.length, 1);
  assert.equal(urgente.m.avisos[0].campos["El agente le mandó"], "Respuesta de prueba?");
  const calla = armar({ responde: () => salida([], { accion: "callar", aviso_para_cande: "YA: preguntó si es un bot" }) });
  assert.equal((await calla.agente.procesar("77", calla.m.disparo)).hecho, "calló");
  assert.equal(calla.m.avisos.length, 1);
  assert.equal(calla.m.avisos[0].titulo, "Lead de prueba · DM URGENTE: aviso del agente");
  assert.equal(calla.m.salidas[0].aviso, "YA: preguntó si es un bot");
  assert.equal(calla.m.contacto.dueno, "agente");
  const sinAviso = armar();
  await sinAviso.agente.procesar("77", sinAviso.m.disparo);
  assert.equal(sinAviso.m.avisos.length, 0);
});

test("lo urgente de un dev que no nombra un bot no le llega a Cande: queda guardado con la salida (23/10)", async () => {
  // 23/10, Cande: "me está pasando cada boludez de mensaje telegram", "me debería pasar solo empresas", "o cuando
  // mencionan que es IA o un bot".
  const dev = armar({ responde: () => salida(["Respuesta de prueba?"], { aviso_para_cande: "HOY: preguntó algo de prueba" }) });
  assert.equal((await dev.agente.procesar("77", dev.m.disparo)).hecho, "enviada");
  assert.equal(dev.m.avisos.length, 0);
  assert.equal(dev.m.salidas[0].aviso, "HOY: preguntó algo de prueba");
});

test("si el aviso a Cande no sale, queda anotado para que se vea en el estado", async () => {
  const { agente, m } = armar({ avisoSale: false, responde: () => salida(["Mañana te escribo"]) });
  await agente.procesar("77", m.disparo);
  assert.deepEqual(m.salidas.map((s) => s.estado), ["frenada", "aviso_fallido"]);
  assert.match(m.salidas[1].detalle, /te paso una charla/);
});

test("si ManyChat no pudo pausar sus automáticos, el aviso lo dice", async () => {
  const { agente, m } = armar({ pausaManyChat: false, responde: () => salida(["Mañana te escribo"]) });
  await agente.procesar("77", m.disparo);
  assert.match(m.avisos[0].campos.Ojo, /no pude pausar los automáticos/);
});

/* ---------- seguimientos ---------- */

test("el seguimiento se agenda solo con los toques prendidos y a quien dijo que busca", async () => {
  const responde = () => salida(["Pregunta de prueba?"], { seguimiento_en_horas: 6 });
  const apagados = armar({ responde });
  await apagados.agente.procesar("77", apagados.m.disparo);
  assert.equal(apagados.m.proximo, null);
  const prendidos = armar({ toques: true, responde });
  await prendidos.agente.procesar("77", prendidos.m.disparo);
  assert.equal(prendidos.m.proximo.getTime(), prendidos.m.contacto.ultimo_lead.getTime() + 6 * HORA);
  const noBusca = armar({ toques: true, responde: () => salida(["Pregunta de prueba?"], { seguimiento_en_horas: 6, estado: { ...estadoDev, busca: "no_se_sabe" } }) });
  await noBusca.agente.procesar("77", noBusca.m.disparo);
  assert.equal(noBusca.m.proximo, null);
});

test("un texto que no es true no prende los seguimientos", async () => {
  const { agente, m } = armar({ toques: "off", responde: () => salida(["Pregunta de prueba?"], { seguimiento_en_horas: 6 }) });
  await agente.procesar("77", m.disparo);
  assert.equal(m.proximo, null);
  assert.equal((await toque(agente)).hecho, "toques apagados");
});

test("después de un no, no queda ningún seguimiento agendado", async () => {
  const { agente, m } = armar({ toques: true, responde: () => salida(["Respuesta de prueba"], { seguimiento_en_horas: 20 }) });
  m.mensajes.at(-1).texto = "no me interesa";
  assert.equal((await agente.procesar("77", m.disparo)).hecho, "enviada");
  assert.equal(m.proximo, null);
});

test("a quien pidió que no le escriban no le sale nada y la charla pasa a Cande", async () => {
  const { agente, m } = armar({ toques: true, responde: () => salida(["Pregunta de prueba?"], { seguimiento_en_horas: 20 }) });
  m.mensajes.at(-1).texto = "no me escribas más";
  const r = await agente.procesar("77", m.disparo);
  assert.equal(r.hecho, "frenada");
  assert.equal(r.motivo, "pidió que no le escriban");
  assert.equal(m.enviados.length, 0);
  assert.equal(m.contacto.dueno, "cande");
});

test("callar ante un mensaje puede dejar un seguimiento agendado", async () => {
  const { agente, m } = armar({ toques: true, responde: () => salida([], { accion: "callar", seguimiento_en_horas: 4 }) });
  assert.equal((await agente.procesar("77", m.disparo)).hecho, "calló");
  assert.equal(m.proximo.getTime(), m.contacto.ultimo_lead.getTime() + 4 * HORA);
});

test("un toque de seguimiento va con su contexto, se cuenta y agenda el segundo", async () => {
  // El lead escribió a las 12 de Argentina y el primer toque sale a las 18: el segundo, a las 21
  // horas de su mensaje, cae a las 9 del otro día.
  const { agente, m } = armarToque({
    ahora: new Date("2026-10-12T21:00:00Z"),
    responde: () => salida(["Mensaje de seguimiento?"], { seguimiento_en_horas: 21, estado: { ...estadoDev, link_formulario_enviado: true } }),
  });
  const r = await toque(agente);
  assert.equal(r.hecho, "enviada");
  assert.match(m.pedidos[0].turno.contexto, /SEGUIMIENTO.*toque 1 de 2/);
  assert.deepEqual(m.pedidos[0].turno.mensajes_del_lead, []);
  assert.deepEqual(m.enviados, ["Mensaje de seguimiento?"]);
  assert.equal(m.contacto.toques, 1);
  assert.equal(m.proximo.getTime(), m.contacto.ultimo_lead.getTime() + 21 * HORA);
});

test("un toque no sale si ya tuvo los dos, si el lead recién escribió o si no hay clave de ManyChat", async () => {
  const dos = armarToque();
  dos.m.contacto.toques = 2;
  assert.equal((await toque(dos.agente)).hecho, "ya tuvo sus dos toques");
  const reciente = armarToque({ ultimoLeadHace: 0.1 });
  assert.equal((await toque(reciente.agente)).hecho, "todavía no toca");
  const sinClave = armarToque({ envio: "campo", hayManyChat: false });
  assert.equal((await toque(sinClave.agente)).hecho, "sin toques: falta la clave de ManyChat");
  for (const mundo of [dos, reciente, sinClave]) assert.equal(mundo.m.pedidos.length + mundo.m.enviados.length, 0);
});

test("con envío por campo el toque sale por la API de ManyChat: nadie lo vendría a retirar", async () => {
  // Pedido del 15/10: los seguimientos no corrían porque con el envío por campo una respuesta solo
  // sale cuando el lead escribe, y a un toque lo dispara el silencio.
  const { agente, m } = armarToque({ envio: "campo" });
  const r = await toque(agente);
  assert.equal(r.hecho, "enviada");
  assert.deepEqual(m.enviados, ["Mensaje de seguimiento?"]);
  assert.equal(m.salidas.at(-1).estado, "enviada");
  assert.equal(m.mensajes.at(-1).quien, "agente");
  assert.equal(m.contacto.toques, 1);
});

test("con envío por campo, la respuesta a un mensaje sigue quedando para que ManyChat la retire, con clave o sin ella", async () => {
  for (const hayManyChat of [true, false]) {
    const { agente, m } = armar({ envio: "campo", hayManyChat });
    assert.equal((await agente.procesar("77", m.disparo)).hecho, "lista para retirar");
    assert.equal(m.enviados.length, 0);
    assert.equal(m.salidas.at(-1).estado, "pendiente");
  }
});

// Un toque que no sale no deja a nadie esperando: la charla sigue del agente y a Cande no le llega
// nada. Pasarla le sacaba al agente un lead sano y le mandaba a ella un aviso falso (revisión del 15/10).
const sigueDelAgente = (m) => {
  assert.equal(m.contacto.dueno, "agente");
  assert.equal(m.avisos.length, 0);
  assert.equal(m.enviados.length, 0);
};

test("un toque que falla en el modelo (la Mac dormida) no pasa la charla a Cande", async () => {
  const { agente, m } = armarToque({ envio: "campo", responde: () => { throw new Error("la Mac no contestó"); } });
  assert.equal((await toque(agente)).hecho, "error del modelo");
  sigueDelAgente(m);
  assert.equal(m.salidas.at(-1).estado, "error");
});

test("un toque que ManyChat no deja mandar no pasa la charla a Cande", async () => {
  const { agente, m } = armarToque({ envio: "campo", mandar: async () => ({ ok: false, error: "código 3011" }) });
  assert.equal((await toque(agente)).hecho, "error al mandar");
  sigueDelAgente(m);
  assert.equal(m.salidas.at(-1).estado, "error");
});

test("un toque incierto queda anotado como salido y no pasa la charla a Cande", async () => {
  const { agente, m } = armarToque({ envio: "campo", mandar: async () => ({ ok: false, incierto: true, error: "tardó" }) });
  assert.equal((await toque(agente)).hecho, "envío incierto");
  assert.equal(m.contacto.dueno, "agente");
  assert.equal(m.avisos.length, 0);
  assert.equal(m.salidas.at(-1).estado, "incierta");
});

test("un toque que el modelo o la revisión prefieren pasar no sale y la charla sigue del agente", async () => {
  const { agente, m } = armarToque({ responde: () => salida(["Mensaje de seguimiento?"], { accion: "pasar_a_cande", aviso_para_cande: "una nota" }) });
  assert.equal((await toque(agente)).hecho, "calló");
  sigueDelAgente(m);
});

test("un toque frenado no sale y la charla sigue del agente", async () => {
  const { agente, m } = armarToque({ responde: () => salida(["x".repeat(400) + "?"]) });
  const r = await toque(agente);
  assert.equal(r.hecho, "frenada");
  sigueDelAgente(m);
});

test("en un toque, a Cande solo le llega el aviso del modelo si es urgente", async () => {
  const comun = armarToque({ responde: () => salida(["Mensaje de seguimiento?"], { aviso_para_cande: "una nota" }) });
  assert.equal((await toque(comun.agente)).hecho, "enviada");
  assert.equal(comun.m.avisos.length, 0);
  const urgente = armarToque({ responde: () => salida(["Mensaje de seguimiento?"], { aviso_para_cande: "HOY: preguntó si es un bot" }) });
  assert.equal((await toque(urgente.agente)).hecho, "enviada");
  assert.equal(urgente.m.avisos.length, 1);
});

test("un toque no tiene la traba mientras se genera: el mensaje que entra en ese rato arranca enseguida", async () => {
  const generando = diferida();
  const { agente, m } = armarToque({ responde: (p) => (p.turno.mensajes_del_lead.length ? salida(["Respuesta de prueba?"]) : generando.promesa) });
  const corrida = toque(agente);
  await hasta(() => m.pedidos.length === 1);
  assert.equal(m.tomado, null);
  const id = m.entraLead("una respuesta del lead");
  assert.equal((await agente.procesar("77", id)).hecho, "enviada");
  generando.resolver(salida(["Mensaje de seguimiento?"]));
  assert.equal((await corrida).hecho, "llegó otro mensaje durante la generación");
  assert.deepEqual(m.enviados, ["Respuesta de prueba?"]);
  assert.equal(m.contacto.toques, 0);
});

test("si otra corrida tiene la charla cuando termina de generarse el toque, el toque no sale", async () => {
  const generando = diferida();
  const { agente, m } = armarToque({ responde: () => generando.promesa });
  const corrida = toque(agente);
  await hasta(() => m.pedidos.length === 1);
  m.tomado = "otra corrida";
  generando.resolver(salida(["Mensaje de seguimiento?"]));
  assert.equal((await corrida).hecho, "otra corrida lo tiene");
  assert.equal(m.enviados.length, 0);
  assert.equal(m.tomado, "otra corrida");
});

test("los toques salen de 9 a 21 de Argentina, con una vuelta del cron de margen", () => {
  assert.equal(horaDeToques(new Date("2026-10-12T12:00:00Z")), true); // 9 en Argentina
  assert.equal(horaDeToques(new Date("2026-10-12T23:59:00Z")), true); // 20:59
  assert.equal(horaDeToques(new Date("2026-10-13T00:05:00Z")), true); // 21:05: el agendado a las 20:55
  assert.equal(horaDeToques(new Date("2026-10-13T00:10:00Z")), false); // 21:10
  assert.equal(horaDeToques(new Date("2026-10-12T11:59:00Z")), false); // 8:59
});

test("un toque que llega al tope del día no sale y la charla sigue del agente", async () => {
  const { agente, m } = armarToque({ tope: 0 });
  assert.equal((await toque(agente)).hecho, "tope del día");
  sigueDelAgente(m);
  assert.equal(m.pedidos.length, 0);
});

test("la corrida de un mensaje del lead tiene la traba mientras se genera", async () => {
  const generando = diferida();
  const { agente, m } = armar({ responde: () => generando.promesa });
  const corrida = agente.procesar("77", m.disparo);
  await hasta(() => m.pedidos.length === 1);
  assert.notEqual(m.tomado, null);
  generando.resolver(salida(["Respuesta de prueba?"]));
  assert.equal((await corrida).hecho, "enviada");
  assert.equal(m.tomado, null);
});

test("si Cande contesta mientras se genera el toque, el toque no sale ni agenda otro", async () => {
  const generando = diferida();
  const { agente, m } = armarToque({ envio: "campo", responde: () => generando.promesa });
  const corrida = toque(agente);
  await hasta(() => m.pedidos.length === 1);
  // Lo que hacen anotarDeCande y anotarAMano: queda su mensaje y se cancela el toque agendado.
  m.mensajes.push({ id: m.mensajes.length + 1, quien: "cande", texto: "una respuesta de Cande" });
  m.contacto.proximo_toque = null;
  generando.resolver(salida(["Mensaje de seguimiento?"], { seguimiento_en_horas: 20, estado: { ...estadoDev, link_formulario_enviado: true } }));
  assert.equal((await corrida).hecho, "la charla cambió durante la generación");
  assert.equal(m.enviados.length, 0);
  assert.equal(m.contacto.proximo_toque, null);
  assert.equal(m.contacto.toques, 0);
});

/** Lo que pasa en la lectura número `cual` de los ajustes: la última es la mirada final antes de mandar. */
const enLaLectura = (m, cual, hacer) => {
  const aj = m.ajustes;
  let lecturas = 0;
  Object.defineProperty(m, "ajustes", { get() { if (++lecturas === cual) hacer(); return aj; } });
};

test("si Cande contesta justo antes de que salga el toque, en la mirada final, el toque no sale", async () => {
  const { agente, m } = armarToque({ envio: "campo" });
  // Un toque lee los ajustes al arrancar y en la mirada final.
  enLaLectura(m, 2, () => m.mensajes.push({ id: m.mensajes.length + 1, quien: "cande", texto: "una respuesta de Cande" }));
  assert.equal((await toque(agente)).hecho, "descartada");
  assert.equal(m.enviados.length, 0);
  assert.equal(m.contacto.toques, 0);
  assert.equal(m.proximo, undefined);
});

test("a la respuesta de un mensaje no la frena un mensaje fijo que entra en la mirada final", async () => {
  const { agente, m } = armar();
  // La corrida de un mensaje lee los ajustes al arrancar, después de la espera y en la mirada final.
  enLaLectura(m, 3, () => m.mensajes.push({ id: m.mensajes.length + 1, quien: "automatico", texto: "un mensaje fijo" }));
  assert.equal((await agente.procesar("77", m.disparo)).hecho, "enviada");
  assert.deepEqual(m.enviados, ["Respuesta de prueba?"]);
});

test("el cron deja de reclamar toques en cuanto el modelo no contesta", async () => {
  const fila = ["1", "2", "3"];
  const reclamados = [];
  const hechos = await correrToques({
    reclamar: async () => { const id = fila.shift() ?? null; if (id) reclamados.push(id); return id; },
    procesar: async () => ({ hecho: "error del modelo" }),
    hasta: Infinity, tope: 10,
  });
  assert.equal(hechos, 1);
  assert.deepEqual(reclamados, ["1"]);
  assert.deepEqual(fila, ["2", "3"]);
});

test("el cron corta si el modelo falla para todos (la Mac sin uso) y sigue si la falla fue de una charla", async () => {
  const correr = async (r) => {
    const fila = ["1", "2", "3"];
    await correrToques({ reclamar: async () => fila.shift() ?? null, procesar: async () => r, hasta: Infinity, tope: 10 });
    return fila.length;
  };
  assert.equal(await correr({ hecho: "error del modelo", transitorio: false, general: true }), 2);
  assert.equal(await correr({ hecho: "error del modelo", transitorio: false, general: false }), 0);
});

test("un toque que falla porque la Mac se quedó sin uso avisa que es general: el cron no sigue gastando toques", async () => {
  const sinUso = Object.assign(new Error("el Claude de la Mac falló: Claude no pudo: límite de uso"), { transitorio: false, general: true });
  const { agente } = armarToque({ responde: () => { throw sinUso; } });
  const r = await toque(agente);
  assert.equal(r.hecho, "error del modelo");
  assert.equal(r.general, true);
});

test("el cron reclama toques hasta vaciar la fila, el tope o la hora límite, y sigue si uno tira", async () => {
  const correr = (fila, extra = {}) => correrToques({
    reclamar: async () => fila.shift() ?? null,
    procesar: async (id) => { if (id === "tira") throw new Error("falló"); return { hecho: "enviada" }; },
    hasta: Infinity, tope: 10, ...extra,
  });
  assert.equal(await correr(["1", "2"]), 2);
  assert.equal(await correr(["1", "2", "3"], { tope: 2 }), 2);
  assert.equal(await correr(["1", "2"], { hasta: 0 }), 0);
  const registrados = [];
  assert.equal(await correr(["tira", "2"], { registrar: (id) => registrados.push(id) }), 1);
  assert.deepEqual(registrados, ["tira"]);
});

test("un toque no sale si hay un mensaje del lead sin atender", async () => {
  const { agente, m } = armarToque();
  m.mensajes.push({ id: m.mensajes.length + 1, quien: "lead", texto: "otro mensaje de prueba" });
  assert.equal((await toque(agente)).hecho, "hay un mensaje del lead sin atender");
  assert.equal(m.pedidos.length + m.enviados.length, 0);
});

test("el segundo toque sale como mínimo 4 horas después del primero", async () => {
  // El lead escribió hace 6 horas y el modelo pide el próximo a las 7 de su mensaje: sería en una
  // hora, pegado al toque que acaba de salir. Se corre a 4 horas de ahora.
  const { agente, m } = armarToque({
    responde: () => salida(["Mensaje de seguimiento?"], { seguimiento_en_horas: 7, estado: { ...estadoDev, link_formulario_enviado: true } }),
  });
  assert.equal((await toque(agente)).hecho, "enviada");
  assert.equal(m.proximo.getTime(), AHORA.getTime() + 4 * HORA);
});

test("proximoToque con noAntesDe corre la hora hacia adelante y respeta la noche y las 24 horas", () => {
  const ultimoLead = new Date("2026-10-12T12:00:00Z"); // 9 en Argentina
  const ahora = new Date("2026-10-12T19:00:00Z"); // 16
  const base = { ahora, ultimoLead, horas: 8, toquesHechos: 1, maxToques: 2 };
  assert.equal(proximoToque({ ...base, noAntesDe: new Date("2026-10-12T23:00:00Z") }).toISOString(), "2026-10-12T23:00:00.000Z");
  // Cae a las 22 de Argentina: pasaría a las 9 del otro día, 24 horas después del lead. No sale.
  assert.equal(proximoToque({ ...base, noAntesDe: new Date("2026-10-13T01:00:00Z") }), null);
  assert.equal(proximoToque({ ...base, noAntesDe: null }).toISOString(), "2026-10-12T20:00:00.000Z");
});

test("un toque a quien no busca, dijo que no o frenó por plata se cancela sin pedirle nada al modelo", async () => {
  const noBusca = armarToque();
  noBusca.m.contacto.estado = { ...estadoDev, busca: "no" };
  const sinPlata = armarToque();
  sinPlata.m.mensajes.at(-1).texto = "no tengo plata";
  for (const { agente, m } of [noBusca, sinPlata]) {
    assert.equal((await toque(agente)).hecho, "toque cancelado");
    assert.equal(m.pedidos.length + m.enviados.length, 0);
    assert.equal(m.proximo, null);
  }
});

test("si el lead escribe mientras se genera el toque, el toque no sale ni se cuenta", async () => {
  const generando = diferida();
  const { agente, m } = armarToque({ responde: () => generando.promesa });
  const corrida = toque(agente);
  await hasta(() => m.pedidos.length === 1);
  m.entraLead("ya está, gracias");
  generando.resolver(salida(["Mensaje de seguimiento?"]));
  assert.equal((await corrida).hecho, "llegó otro mensaje durante la generación");
  assert.equal(m.enviados.length, 0);
  assert.equal(m.contacto.toques, 0);
});

test("un toque que salió no se repite aunque la base falle después de mandar", async () => {
  const { agente, m } = armarToque();
  m.fallaAnotar = true;
  assert.equal((await toque(agente)).hecho, "enviada sin guardar");
  assert.equal((await toque(agente)).hecho, "no es del agente");
  assert.deepEqual(m.enviados, ["Mensaje de seguimiento?"]);
  assert.equal(m.contacto.toques, 1);
  assert.equal(m.contacto.dueno, "cande");
  assert.equal(m.avisos.length, 1);
});

test("si falla la constancia antes de mandar, no sale nada y la salida queda marcada con el error", async () => {
  const { agente, m } = armarToque();
  m.fallaSumarToque = true;
  const r = await toque(agente);
  assert.equal(r.hecho, "error");
  assert.equal(m.enviados.length, 0);
  assert.deepEqual(m.salidas.map((s) => s.estado), ["error"]);
  // Es un toque: nadie espera respuesta, así que la charla sigue del agente y a Cande no le llega nada.
  assert.equal(m.contacto.dueno, "agente");
  assert.equal(m.avisos.length, 0);
});

/* ---------- lo que el modelo dice no alcanza ---------- */

test("sin plata en un turno anterior: el precio no sale aunque ahora pregunte cuánto es", async () => {
  const { agente, m } = armar({ responde: () => salida(["Sale 27 dólares"]) });
  m.mensajes = [
    { id: 1, quien: "agente", texto: AVISO }, { id: 2, quien: "lead", texto: "no tengo plata, tengo deudas" },
    { id: 3, quien: "agente", texto: "Respuesta de prueba" }, { id: 4, quien: "lead", texto: "y cuánto sale?" },
  ];
  m.contacto.respondido_hasta = 2;
  const r = await agente.procesar("77", 4);
  assert.equal(r.hecho, "frenada");
  assert.match(r.motivo, /no tiene plata/);
  assert.deepEqual(m.pedidos[0].turno.mensajes_del_lead, ["y cuánto sale?"]);
});

test("si el estado guardado dice empresa, el precio no sale aunque el modelo ahora diga dev", async () => {
  const { agente, m } = armar({ responde: () => salida(["Sale 27 dólares"]) });
  m.contacto.estado = { quien: "empresa" };
  const r = await agente.procesar("77", m.disparo);
  assert.equal(r.hecho, "frenada");
  assert.match(r.motivo, /construye o contrata/);
});

test("una charla cargada a mano: el agente la sigue desde donde quedó, con su contexto", async () => {
  const { agente, m } = armar({ conAviso: false, responde: () => salida([AVISO, "Pregunta de prueba?"]) });
  m.mensajes = [
    { id: 1, quien: "lead", texto: "primer mensaje viejo" }, { id: 2, quien: "automatico", texto: "mensaje fijo" },
    { id: 3, quien: "cande", texto: "lo que mandó Cande a mano" }, { id: 4, quien: "lead", texto: "la respuesta nueva" },
  ];
  Object.assign(m.contacto, { respondido_hasta: 1, contexto: "contexto de prueba" });
  const r = await agente.procesar("77", 4);
  const { turno } = m.pedidos[0];
  assert.equal(r.hecho, "enviada");
  assert.equal(turno.contexto, "contexto de prueba");
  assert.deepEqual(turno.historial.map((x) => x.quien), ["lead", "automatico", "cande"]);
  assert.deepEqual(turno.mensajes_del_lead, ["la respuesta nueva"]);
});

test("en una charla larga los frenos miran todo lo que escribió el lead, no solo los últimos 80 mensajes", async () => {
  const larga = (primero) => [
    { id: 1, quien: "lead", texto: primero }, { id: 2, quien: "cande", texto: AVISO },
    ...Array.from({ length: 88 }, (_, i) => ({ id: i + 3, quien: i % 2 ? "cande" : "lead", texto: `mensaje viejo ${i}` })),
    { id: 91, quien: "lead", texto: "dale" },
  ];
  const responde = () => salida(["Va la lista\nopengatehub.com/devs"]);
  const empresa = armar({ responde });
  empresa.m.mensajes = larga("tengo una agencia y busco contratar");
  empresa.m.contacto.respondido_hasta = 89;
  const r = await empresa.agente.procesar("77", 91);
  assert.equal(r.hecho, "frenada");
  assert.match(r.motivo, /señal de empresa/);
  // Al modelo le van los últimos 80 mensajes, con el nuevo incluido.
  const { turno } = empresa.m.pedidos[0];
  assert.equal(turno.historial.length + turno.mensajes_del_lead.length, 80);
  assert.deepEqual(turno.mensajes_del_lead, ["dale"]);
  // Y el aviso de que es automático, dado hace más de 80 mensajes, no se exige de nuevo.
  const dev = armar({ responde });
  dev.m.mensajes = larga("soy dev backend");
  dev.m.contacto.respondido_hasta = 89;
  assert.equal((await dev.agente.procesar("77", 91)).hecho, "enviada");
});

/* ---------- altas: quien entra solo por la entrada ---------- */

test("alguien nuevo entra solo con las altas prendidas: queda del agente y no le llega ningún aviso a Cande", async () => {
  const { agente, m } = armar({
    sinContacto: true, altas: true, contextoAlta: "contexto de alta de prueba", responde: () => salida([AVISO, "Pregunta de prueba?"]),
  });
  const id = await agente.recibir("88", "hola de prueba", "Nuevo de prueba");
  assert.equal(id, 1);
  assert.equal(m.contacto.dueno, "agente");
  assert.equal(m.contacto.nombre, "Nuevo de prueba");
  assert.deepEqual(m.mensajes, [{ id: 1, quien: "lead", texto: "hola de prueba" }]);
  assert.deepEqual(m.avisos, []); // todavía no se sabe si es un lead o una charla personal
  // De ahí en más es una charla como cualquiera: el modelo recibe el contexto de alta y, como
  // todavía nadie le avisó que es automático, la primera respuesta tiene que decirlo.
  assert.equal((await agente.procesar("88", id)).hecho, "enviada");
  assert.equal(m.pedidos[0].turno.contexto, "contexto de alta de prueba");
  assert.deepEqual(m.pedidos[0].turno.mensajes_del_lead, ["hola de prueba"]);
  assert.equal(m.avisos.length, 0);
  assert.equal(m.contacto.alta_avisada, true);
});

test("una charla personal que entra sola no le llega a Cande: se borra y queda de ella, sin aviso", async () => {
  const { agente, m } = armar({ sinContacto: true, altas: true, responde: () => ({ ...salida([]), accion: "callar", estado: { ...salida([]).estado, quien: "no_dev", etapa: "cerrada" } }) });
  const id = await agente.recibir("88", "mensaje personal de prueba", "Amigo de prueba");
  assert.equal((await agente.procesar("88", id)).hecho, "charla personal: queda de Cande, sin aviso");
  assert.equal(m.borrada, true);
  assert.equal(m.contacto.dueno, "cande");
  assert.deepEqual(m.mensajes, []);
  assert.deepEqual(m.avisos, []);
  assert.deepEqual(m.enviados, []);
});

test("con las altas apagadas, como vienen de fábrica, alguien nuevo no entra ni queda nada guardado", async () => {
  assert.equal(AJUSTES_POR_DEFECTO.altas, false);
  const { agente, m } = armar({ sinContacto: true });
  assert.equal(await agente.recibir("88", "hola de prueba", "Nuevo de prueba"), null);
  assert.equal(m.contacto, null);
  assert.deepEqual(m.mensajes, []);
  assert.deepEqual(m.avisos, []);
});

test("un texto que no es true no prende las altas", async () => {
  const { agente, m } = armar({ sinContacto: true, altas: "si" });
  assert.equal(await agente.recibir("88", "hola de prueba", "Nuevo de prueba"), null);
  assert.equal(m.contacto, null);
});

test("con el agente apagado no entra nadie, aunque las altas estén prendidas", async () => {
  const { agente, m } = armar({ sinContacto: true, altas: true, modo: "apagado" });
  assert.equal(await agente.recibir("88", "hola de prueba"), null);
  assert.equal(m.contacto, null);
  assert.deepEqual(m.avisos, []);
});

test("con Telegram caído, un lead nuevo igual se atiende", async () => {
  const { agente, m } = armar({ sinContacto: true, altas: true, avisoSale: false, responde: () => salida([AVISO, "Pregunta de prueba?"]) });
  const id = await agente.recibir("88", "hola de prueba", "Nuevo de prueba");
  assert.equal(id, 1);
  assert.equal((await agente.procesar("88", id)).hecho, "enviada");
  assert.ok(!m.salidas.some((x) => x.estado === "aviso_fallido"));
});

test("una charla de Cande no vuelve sola al agente aunque las altas estén prendidas", async () => {
  const { agente, m } = armar({ dueno: "cande", altas: true });
  const antes = m.mensajes.length;
  assert.equal(await agente.recibir("77", "otro mensaje de prueba"), null);
  assert.equal(m.contacto.dueno, "cande");
  assert.equal(m.mensajes.length, antes);
  assert.equal(m.altasHoy, 0);
  assert.deepEqual(m.avisos, []);
});

test("el mensaje de quien ya es del agente entra como siempre, sin alta ni aviso", async () => {
  const { agente, m } = armar({ altas: true });
  assert.equal(await agente.recibir("77", "otro mensaje de prueba"), 3);
  assert.equal(m.altasHoy, 0);
  assert.deepEqual(m.avisos, []);
});

test("el tope de altas: la que lo llena le avisa a Cande y el siguiente no entra", async () => {
  const { agente, m } = armar({ sinContacto: true, altas: true, topeAltas: 1 });
  assert.equal(await agente.recibir("88", "hola de prueba", "Nuevo de prueba"), 1);
  assert.equal(m.avisos.length, 1);
  assert.equal(m.avisos[0].titulo, "DM: se llenó el tope de altas");
  assert.equal(m.avisos[0].campos.Quién, undefined); // el aviso del tope no dice quién es: puede ser una charla personal
  assert.match(m.avisos[0].campos.Aviso, /filtrando bien/);
  Object.assign(m, { contacto: null, mensajes: [] }); // llega otro que tampoco pasó nunca por la base
  assert.equal(await agente.recibir("89", "hola de prueba", "Otro de prueba"), null);
  assert.equal(m.contacto, null);
  assert.deepEqual(m.mensajes, []);
  assert.equal(m.avisos.length, 1);
});

test("dos mensajes juntos de alguien nuevo: el que no hizo el alta también queda guardado", async () => {
  const { agente, m } = armar({ sinContacto: true, altas: true, altaAjena: true });
  assert.equal(await agente.recibir("88", "segundo mensaje de prueba"), 1);
  assert.equal(m.contacto.dueno, "agente");
  assert.deepEqual(m.mensajes.map((x) => x.texto), ["segundo mensaje de prueba"]);
});

test("los ajustes de las altas: prendido o apagado, un tope entre 1 y 200 y un contexto de hasta mil caracteres", () => {
  for (const malo of [{ altas: "si" }, { altas: 1 }, { altas_por_dia: 0 }, { altas_por_dia: 201 }, { altas_por_dia: "25" }, { contexto_alta: 5 }, { contexto_alta: "x".repeat(1001) }]) {
    assert.match(validarAjustes(malo).error, /valor inválido/, JSON.stringify(malo).slice(0, 60));
  }
  const bueno = { altas: true, altas_por_dia: 10, contexto_alta: "contexto de prueba" };
  assert.deepEqual(validarAjustes(bueno), { ok: true, ajustes: bueno });
  assert.equal(ajustesDesde({ altas: "si", altas_por_dia: 0 }).altas, false);
  assert.equal(ajustesDesde({ altas: "si", altas_por_dia: 0 }).altas_por_dia, 25);
});

test("el repaso pide respuestas desde una fecha válida de la última semana, nunca futura", () => {
  const ahora = new Date("2026-10-14T12:00:00Z");
  assert.equal(desdeValido("2026-10-14T11:00:00Z", ahora).toISOString(), "2026-10-14T11:00:00.000Z");
  assert.equal(desdeValido("2026-10-08T12:00:01Z", ahora).toISOString(), "2026-10-08T12:00:01.000Z");
  for (const malo of ["", null, undefined, "ayer", "2026-10-14T12:00:01Z", "2026-10-07T11:59:59Z", "   "]) {
    assert.equal(desdeValido(malo, ahora), null, String(malo));
  }
});

/* ---------- a qué chat de Telegram van los avisos del agente ---------- */

const { crearAvisoDm } = await import("../lib/dm/armado.js");
const { grupoConNombre } = await import("../lib/notificar.js");

function avisosDePrueba({ chat = null, llegaAlGrupo = true, fallaLeer = false, bot = null, llegaPorBot = true } = {}) {
  const mandados = [];
  const mandar = async (titulo, campos, opciones = {}) => {
    mandados.push({ titulo, campos, chat: opciones.token ? "bot del agente" : opciones.chat ?? "el de siempre" });
    if (opciones.token) return opciones.token === bot && llegaPorBot;
    return opciones.chat ? llegaAlGrupo : true;
  };
  const leerChat = async () => { if (fallaLeer) throw new Error("base caída"); return chat; };
  return { mandados, avisarDm: crearAvisoDm({ avisar: mandar, leerChat, tokenBot: () => bot }) };
}

test("con el bot aparte del agente, sus avisos van solo por ese bot", async () => {
  const { mandados, avisarDm } = avisosDePrueba({ bot: "bot-de-prueba", chat: "-100123" });
  assert.equal(await avisarDm("DM: aviso de prueba", { Quién: "Lead de prueba" }), true);
  assert.deepEqual(mandados.map((x) => x.chat), ["bot del agente"]);
  assert.equal(mandados[0].campos.Ojo, undefined);
});

test("si el bot aparte no llega (no le dio Iniciar), va al grupo o al de siempre y lo dice", async () => {
  const conGrupo = avisosDePrueba({ bot: "bot-de-prueba", llegaPorBot: false, chat: "-100123" });
  assert.equal(await conGrupo.avisarDm("DM: aviso de prueba", { Quién: "Lead de prueba" }), true);
  assert.deepEqual(conGrupo.mandados.map((x) => x.chat), ["bot del agente", "-100123"]);
  assert.equal(conGrupo.mandados[1].campos.Ojo, "no pude avisar por el bot del agente");
  const sinGrupo = avisosDePrueba({ bot: "bot-de-prueba", llegaPorBot: false });
  assert.equal(await sinGrupo.avisarDm("DM: aviso de prueba", { Ojo: "otra cosa" }), true);
  assert.deepEqual(sinGrupo.mandados.map((x) => x.chat), ["bot del agente", "el de siempre"]);
  assert.equal(sinGrupo.mandados[1].campos.Ojo, "otra cosa; no pude avisar por el bot del agente");
});

test("sin grupo conectado, los avisos del agente van al chat de siempre", async () => {
  const { mandados, avisarDm } = avisosDePrueba();
  assert.equal(await avisarDm("DM: aviso de prueba", { Quién: "Lead de prueba" }), true);
  assert.deepEqual(mandados.map((x) => x.chat), ["el de siempre"]);
});

test("con grupo conectado van solo al grupo del agente", async () => {
  const { mandados, avisarDm } = avisosDePrueba({ chat: "-100123" });
  assert.equal(await avisarDm("DM: aviso de prueba", { Quién: "Lead de prueba" }), true);
  assert.deepEqual(mandados.map((x) => x.chat), ["-100123"]);
});

test("si el aviso no llega al grupo (o no se puede leer cuál es), no se pierde: va al chat de siempre", async () => {
  const caido = avisosDePrueba({ chat: "-100123", llegaAlGrupo: false });
  assert.equal(await caido.avisarDm("DM: aviso de prueba", { Quién: "Lead de prueba", Ojo: "otra cosa" }), true);
  assert.deepEqual(caido.mandados.map((x) => x.chat), ["-100123", "el de siempre"]);
  assert.equal(caido.mandados[1].campos.Ojo, "otra cosa; no pude avisar en el grupo del agente");
  const sinBase = avisosDePrueba({ chat: "-100123", fallaLeer: true });
  assert.equal(await sinBase.avisarDm("DM: aviso de prueba", {}), true);
  assert.deepEqual(sinBase.mandados.map((x) => x.chat), ["el de siempre"]);
});

test("el grupo se busca por nombre: uno solo, sumado por la dueña y del que al bot no lo sacaron", () => {
  const grupo = (id, title, de, extra = {}) => ({ my_chat_member: { chat: { id, type: "supergroup", title }, from: { id: de }, new_chat_member: { status: "member" }, ...extra } });
  const visto = [
    { message: { chat: { id: 55, type: "private", first_name: "Agente DM" }, from: { id: 55 }, text: "hola" } },
    grupo(-100111, "Otro grupo", 1),
    grupo(-100222, " agente dm ", 1),
    { message: { chat: { id: -100222, type: "supergroup", title: "Agente DM" }, from: { id: 1 }, text: "/start" } },
    null, {},
  ];
  assert.deepEqual(grupoConNombre(visto, "Agente DM", { soloDe: "1" }), { id: "-100222", nombre: "Agente DM" });
  assert.deepEqual(grupoConNombre(visto, "otro GRUPO"), { id: "-100111", nombre: "Otro grupo" });
  for (const nada of ["no existe", "", null]) assert.equal(grupoConNombre(visto, nada), null);
  assert.equal(grupoConNombre(null, "Agente DM"), null);
  // Un extraño arma un grupo con el mismo nombre y suma al bot: no cuenta si se sabe quién es la dueña...
  const conAjeno = [...visto, grupo(-100999, "Agente DM", 666)];
  assert.deepEqual(grupoConNombre(conAjeno, "Agente DM", { soloDe: "1" }), { id: "-100222", nombre: "Agente DM" });
  // ...y si no se sabe, con dos grupos iguales no se elige ninguno.
  assert.deepEqual(grupoConNombre(conAjeno, "Agente DM"), { varios: true });
  // Si al bot lo sacaron del grupo, ese grupo ya no sirve.
  const sacado = [...visto, { my_chat_member: { chat: { id: -100222, type: "supergroup", title: "Agente DM" }, from: { id: 1 }, new_chat_member: { status: "left" } } }];
  assert.equal(grupoConNombre(sacado, "Agente DM", { soloDe: "1" }), null);
});

/* ---------- el cuerpo que manda ManyChat ---------- */

test("un cuerpo bien armado se lee tal cual", () => {
  assert.deepEqual(cuerpoDeManyChat('{"contacto":"77","nombre":"Lead de prueba","texto":"hola de prueba"}'), {
    contacto: "77", nombre: "Lead de prueba", texto: "hola de prueba",
  });
  assert.deepEqual(cuerpoDeManyChat('{"contacto":77}'), { contacto: 77 });
});

test("un mensaje con salto de línea o con comillas rompe el JSON de ManyChat y se rescata igual", () => {
  const conSalto = '{"contacto":"77","nombre":"Lead de prueba","texto":"primera línea\nsegunda línea"}';
  assert.throws(() => JSON.parse(conSalto));
  assert.deepEqual(cuerpoDeManyChat(conSalto), { contacto: "77", nombre: "Lead de prueba", texto: "primera línea\nsegunda línea" });
  const conComillas = '{ "contacto": "77", "nombre": "Lead de prueba", "texto": "me dijo "probá" y probé" }';
  assert.throws(() => JSON.parse(conComillas));
  assert.equal(cuerpoDeManyChat(conComillas).texto, 'me dijo "probá" y probé');
  const conTodo = '{"contacto": 77, "nombre": "De "prueba"", "texto": "uno\n"dos" } tres\n"}';
  assert.deepEqual(cuerpoDeManyChat(conTodo), { contacto: "77", nombre: 'De "prueba"', texto: 'uno\n"dos" } tres\n' });
});

test("lo que no se puede rescatar queda vacío, y el endpoint lo rechaza por falta de contacto", () => {
  for (const malo of ["", "   ", "hola", "[1,2]", '"texto"', '{"nombre":"x","texto":"sin contacto\n"}', '{"contacto":"77","texto":"sin cerrar']) {
    assert.deepEqual(cuerpoDeManyChat(malo), {}, JSON.stringify(malo));
  }
});

test("el contacto es el que pone ManyChat al principio: el lead no puede pisarlo desde su texto ni su nombre", () => {
  const desdeElTexto = '{ "contacto": "77", "nombre": "Lead de prueba", "texto": "hola", "contacto": "999" }';
  assert.equal(JSON.parse(desdeElTexto).contacto, "999"); // lo que daba antes: el JSON es válido y gana el último
  assert.equal(cuerpoDeManyChat(desdeElTexto).contacto, "77");
  const desdeElNombre = '{ "contacto": "77", "nombre": "X", "contacto": "999", "texto": "hola" }';
  assert.equal(cuerpoDeManyChat(desdeElNombre).contacto, "77");
  // En el rescate tampoco sirve un contacto que no esté al principio.
  assert.deepEqual(cuerpoDeManyChat('{ "nombre": "X", "texto": "uno\n", "contacto": "999" }'), {});
});

test("el rescate no se confunde si el mensaje trae los nombres de los campos adentro", () => {
  const con = (texto) => cuerpoDeManyChat(`{ "contacto": "77", "nombre": "Lead de prueba", "texto": "${texto}" }`);
  for (const texto of ['mirá {"texto": "x"}\nlisto', 'va {"nombre": "x", "texto": "y"}\nfin', 'probando "contacto": "999",\notra']) {
    assert.deepEqual(con(texto), { contacto: "77", nombre: "Lead de prueba", texto }, texto);
  }
});

test("un cuerpo enorme armado para trabar el rescate se resuelve al toque", () => {
  const trampa = '{"contacto":"1",' + '"texto":"'.repeat(7000);
  const inicio = performance.now();
  assert.deepEqual(cuerpoDeManyChat(trampa), {});
  assert.ok(performance.now() - inicio < 200, "el rescate tardó demasiado");
});

test("la entrada lee el cuerpo crudo del pedido y rescata el JSON roto de ManyChat", async () => {
  const { default: handler, config } = await import("../pages/api/dm/entrada.js");
  assert.equal(config.api.bodyParser, false, "con el lector de Next prendido el JSON roto vuelve a dar 400");
  const { avisos } = await import("./dobles/preparar.mjs");
  process.env.DM_SECRETO = "secreto-de-prueba";
  process.env.POSTGRES_URL = "postgres://de-prueba";
  try {
    const llega = async (crudo) => {
      async function* trozos() { yield Buffer.from(crudo); }
      const req = Object.assign(trozos(), { method: "POST", headers: { "x-dm-secreto": "secreto-de-prueba" } });
      const res = respuesta();
      await handler(req, res);
      return res;
    };
    // Sin contacto no pasa, y no llega a tocar la base.
    assert.deepEqual((await llega('{"nombre":"x","texto":"sin contacto\n"}')).cuerpo, { error: "falta contacto" });
    // Con el JSON roto pasa de la lectura: el doble de la base no conoce estas consultas, así que
    // la entrada falla ahí y el aviso sale con el nombre y el contacto rescatados.
    const antes = avisos.length;
    const res = await llega('{ "contacto": "77", "nombre": "Lead de prueba", "texto": "uno\n"dos"" }');
    assert.equal(res.codigo, 200);
    assert.deepEqual(res.cuerpo, { ok: false });
    assert.match(avisos.slice(antes).join("\n"), /Lead de prueba \(77\)/);
  } finally {
    delete process.env.DM_SECRETO;
    delete process.env.POSTGRES_URL;
  }
});

test("la entrada acepta el cuerpo de Full Contact Data de ManyChat, con saltos de línea y comillas", async () => {
  const { default: handler } = await import("../pages/api/dm/entrada.js");
  const { avisos } = await import("./dobles/preparar.mjs");
  process.env.DM_SECRETO = "secreto-de-prueba";
  process.env.POSTGRES_URL = "postgres://de-prueba";
  try {
    const llega = async (obj) => {
      async function* trozos() { yield Buffer.from(JSON.stringify(obj)); }
      const req = Object.assign(trozos(), { method: "POST", headers: { "x-dm-secreto": "secreto-de-prueba" } });
      const res = respuesta();
      await handler(req, res);
      return res;
    };
    // Sin id no pasa.
    assert.deepEqual((await llega({ name: "x", last_input_text: "hola" })).cuerpo, { error: "falta contacto" });
    // Con id, nombre y un texto con salto de línea y comillas pasa la lectura (falla recién en el doble de la base,
    // y el aviso trae el nombre y el id leídos de "name" e "id").
    const antes = avisos.length;
    const res = await llega({ id: "88", name: "Lead de prueba dos", last_input_text: 'uno\n"dos"', ig_username: "x" });
    assert.equal(res.codigo, 200);
    assert.match(avisos.slice(antes).join("\n"), /Lead de prueba dos \(88\)/);
  } finally {
    delete process.env.DM_SECRETO;
    delete process.env.POSTGRES_URL;
  }
});

test("el cuerpo crudo se lee entero y tiene tope", async () => {
  async function* trozos(lista) { for (const t of lista) yield Buffer.from(t); }
  assert.equal(await leerCrudo(trozos(['{"contacto":"77",', '"texto":"hola"}'])), '{"contacto":"77","texto":"hola"}');
  await assert.rejects(leerCrudo(trozos(["x".repeat(40000), "x".repeat(40000)])), /demasiado grande/);
});

/* ---------- los ajustes ---------- */

test("un ajuste con un valor que no es de su tipo no se guarda", () => {
  for (const modo of [null, "", 0, false, "pausado", "AUTO"]) assert.equal(validarAjustes({ modo }).ok, false, JSON.stringify(modo));
  for (const malo of [{ toques: "off" }, { toques: "false" }, { toques: 1 }, { aviso_ia: "no" }, { espera_ms: "18000" }, { espera_ms: 100 }, { tope_por_dia: 0 }, { tope_por_dia: 2.5 }, { envio: "mail" }, { link_de_pago: "pagos.ejemplo.com" }, { link_de_pago: null }]) {
    assert.match(validarAjustes(malo).error, /valor inválido/, JSON.stringify(malo));
  }
  for (const ajeno of [{ otra: 1 }, { toString: "x" }, { constructor: 1 }]) assert.match(validarAjustes(ajeno).error, /ajuste desconocido/);
  for (const nada of [null, undefined, "modo", []]) assert.equal(validarAjustes(nada).ok, false);
  const bueno = { modo: "sombra", envio: "campo", espera_ms: 20000, tope_por_dia: 15, toques: true, aviso_ia: false, link_de_pago: "https://pagos.ejemplo.com/prueba" };
  assert.deepEqual(validarAjustes(bueno), { ok: true, ajustes: bueno });
  assert.deepEqual(validarAjustes({ link_de_pago: "" }), { ok: true, ajustes: { link_de_pago: "" } });
});

test("lo guardado que no es válido se ignora: un modo roto es apagado y un toques roto es sin toques", () => {
  assert.deepEqual(ajustesDesde(null), AJUSTES_POR_DEFECTO);
  const leidos = ajustesDesde({ modo: null, toques: "off", aviso_ia: 0, espera_ms: 20000, de_mas: 1 });
  assert.deepEqual(leidos, { ...AJUSTES_POR_DEFECTO, espera_ms: 20000 });
  assert.equal(AJUSTES_POR_DEFECTO.modo, "apagado");
  assert.equal(AJUSTES_POR_DEFECTO.aviso_ia, true);
});

/* ---------- los endpoints: quién entra ---------- */

const pedido = (extra = {}) => ({ method: "POST", headers: {}, body: {}, ...extra });
const llamar = async (ruta, req) => {
  const { default: handler } = await import(`../pages/api/dm/${ruta}.js`);
  const res = respuesta();
  await handler(req, res);
  return res;
};

test("el cron de los seguimientos no entra sin CRON_SECRET, esté o no cargado", async () => {
  delete process.env.CRON_SECRET;
  assert.equal((await llamar("toques", pedido({ method: "GET" }))).codigo, 401);
  assert.equal((await llamar("toques", pedido({ method: "GET", headers: { authorization: "Bearer undefined" } }))).codigo, 401);
  process.env.CRON_SECRET = "secreto-de-prueba";
  try {
    assert.equal((await llamar("toques", pedido({ method: "GET" }))).codigo, 401);
    assert.equal((await llamar("toques", pedido({ method: "GET", headers: { authorization: "Bearer otro" } }))).codigo, 401);
    const bien = await llamar("toques", pedido({ method: "GET", headers: { authorization: "Bearer secreto-de-prueba" } }));
    assert.equal(bien.codigo, 200);
    assert.deepEqual(bien.cuerpo, { ok: true, hechos: 0 }); // sin base no hay nada que hacer, y no devuelve ids
  } finally {
    delete process.env.CRON_SECRET;
  }
});

test("el cron de la espera tampoco entra sin CRON_SECRET, y no devuelve ids", async () => {
  delete process.env.CRON_SECRET;
  assert.equal((await llamar("espera", pedido({ method: "GET" }))).codigo, 401);
  process.env.CRON_SECRET = "secreto-de-prueba";
  try {
    assert.equal((await llamar("espera", pedido({ method: "GET", headers: { authorization: "Bearer otro" } }))).codigo, 401);
    const bien = await llamar("espera", pedido({ method: "GET", headers: { authorization: "Bearer secreto-de-prueba" } }));
    assert.equal(bien.codigo, 200);
    assert.deepEqual(bien.cuerpo, { ok: true, reintentos: 0 });
  } finally {
    delete process.env.CRON_SECRET;
  }
  // Vercel la llama cada 15 minutos, con los demás crons (lib/crons.js), y le da los 300 segundos para contestar lo que espera.
  const { readFile } = await import("node:fs/promises");
  const crons = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8")).crons;
  assert.deepEqual(crons.find((c) => c.path === "/api/dm/espera"), { path: "/api/dm/espera", schedule: "*/15 * * * *" });
  assert.equal((await import("../pages/api/dm/espera.js")).config.maxDuration, 300);
});

test("los demás endpoints tampoco entran sin su secreto, y solo por POST", async () => {
  for (const [ruta, variable] of [["entrada", "DM_SECRETO"], ["recoger", "DM_SECRETO"], ["config", "COLA_SECRET"], ["probar", "COLA_SECRET"]]) {
    delete process.env[variable];
    assert.equal((await llamar(ruta, pedido())).codigo, 401, `${ruta} sin secreto cargado`);
    assert.equal((await llamar(ruta, pedido({ headers: { "x-dm-secreto": "" } }))).codigo, 401, `${ruta} con secreto vacío`);
    process.env[variable] = "secreto-de-prueba";
    try {
      assert.equal((await llamar(ruta, pedido({ headers: { authorization: "Bearer otro-secreto-mas" } }))).codigo, 401, `${ruta} con otro secreto`);
      assert.equal((await llamar(ruta, pedido({ method: "GET", headers: { authorization: "Bearer secreto-de-prueba" } }))).codigo, 405, `${ruta} por GET`);
      const entra = await llamar(ruta, pedido({ headers: { authorization: "Bearer secreto-de-prueba" }, body: { contacto: "77" } }));
      assert.notEqual(entra.codigo, 401, `${ruta} con su secreto`);
    } finally {
      delete process.env[variable];
    }
  }
});

/* ---------- el cerebro local (lib/dm/cola.js), con las consultas de mentira ---------- */

const { crearCerebroLocal, fallaDeLaMac } = await import("../lib/dm/cola.js");

function cerebroDePrueba({ resultadoEn = 2, resultado, nunca = false } = {}) {
  const m = { creados: [], lecturas: 0, vencidos: [], vaciados: [] };
  const pedirLocal = crearCerebroLocal({
    crear: async (turno, link) => { m.creados.push({ turno, link }); return 7; },
    leer: async () => (++m.lecturas >= resultadoEn && !nunca ? { estado: "hecho", resultado } : { estado: "tomado", resultado: null }),
    vencer: async (id) => { m.vencidos.push(id); },
    vaciar: async (id) => { m.vaciados.push(id); },
    esperar: async () => {}, tope_ms: 10000, cada_ms: 2000,
  });
  return { m, pedirLocal };
}

const salidaValida = {
  accion: "responder", mensajes: ["Mensaje de prueba?"],
  estado: { quien: "dev", busca: "si", dolor: "", etapa: "como_va", link_formulario_enviado: false, precio_dicho: false },
  aviso_para_cande: "", seguimiento_en_horas: null, motivo: "prueba",
};

test("cerebro local: deja el turno, espera a la Mac y devuelve su salida sin dejar nada guardado", async () => {
  const { m, pedirLocal } = cerebroDePrueba({ resultado: salidaValida });
  const r = await pedirLocal({ turno: { mensajes_del_lead: ["hola"] }, linkDePago: "" });
  assert.equal(r.accion, "responder");
  assert.equal(m.creados.length, 1);
  assert.deepEqual(m.vaciados, [7]);
  assert.deepEqual(m.vencidos, []);
});

test("cerebro local: si la Mac no contesta a tiempo, vence el trabajo y avisa por qué", async () => {
  const { m, pedirLocal } = cerebroDePrueba({ nunca: true });
  await assert.rejects(pedirLocal({ turno: {} }), /la Mac de Cande no contestó a tiempo/);
  assert.deepEqual(m.vencidos, [7]);
  assert.equal(m.lecturas, 5);
});

test("cerebro local: una salida que no cumple el formato o un error de la Mac no pasan", async () => {
  const mala = cerebroDePrueba({ resultado: { ...salidaValida, accion: "bailar" } });
  await assert.rejects(mala.pedirLocal({ turno: {} }), /no cumple el formato: accion/);
  const rota = cerebroDePrueba({ resultado: { error: "Claude no pudo" } });
  await assert.rejects(rota.pedirLocal({ turno: {} }), /el Claude de la Mac falló: Claude no pudo/);
});

test("cerebro local: lo que falla la Mac (no contestó, tardó, sin uso, sin JSON) es general y la charla espera; solo un formato inválido es de esa charla", async () => {
  const transitorio = async (p) => { try { await p; } catch (e) { return e.transitorio; } return "no falló"; };
  assert.equal(await transitorio(cerebroDePrueba({ nunca: true }).pedirLocal({ turno: {} })), true);
  assert.equal(await transitorio(cerebroDePrueba({ resultado: { error: "Claude tardó más de 70 segundos" } }).pedirLocal({ turno: {} })), true);
  assert.equal(await transitorio(cerebroDePrueba({ resultado: { error: "Claude no pudo: límite de uso" } }).pedirLocal({ turno: {} })), false);
  assert.equal(await transitorio(cerebroDePrueba({ resultado: { error: "Claude no devolvió JSON: algo" } }).pedirLocal({ turno: {} })), false);
  assert.equal(await transitorio(cerebroDePrueba({ resultado: { ...salidaValida, accion: "bailar" } }).pedirLocal({ turno: {} })), false);
  const general = async (p) => { try { await p; } catch (e) { return e.general; } return "no falló"; };
  assert.equal(await general(cerebroDePrueba({ resultado: { error: "Claude no pudo: límite de uso" } }).pedirLocal({ turno: {} })), true);
  assert.equal(await general(cerebroDePrueba({ resultado: { error: "Claude no devolvió JSON: algo" } }).pedirLocal({ turno: {} })), true);
  assert.equal(await general(cerebroDePrueba({ resultado: { error: "Claude tardó más de 70 segundos" } }).pedirLocal({ turno: {} })), true);
  assert.equal(await general(cerebroDePrueba({ nunca: true }).pedirLocal({ turno: {} })), true);
  assert.equal(await general(cerebroDePrueba({ resultado: { ...salidaValida, accion: "bailar" } }).pedirLocal({ turno: {} })), false);
});

test("cerebro local: sin uso, sin sesión o sin Anthropic es general seguro; que Claude no pudo, no devolvió JSON o tardó es dudoso (puede ser de esa charla)", async () => {
  // Los textos son los que da `claude -p` y la Mac pasa tal cual (tracker/dm_claude.py).
  for (const t of [
    "Claude no pudo: Claude AI usage limit reached|1760900000", "Claude no pudo: You've hit your limit · resets 3pm",
    "Claude no pudo: Invalid API key · Please run /login", "Claude no devolvió JSON: API Error: 529 overloaded_error",
    "Claude no pudo: API Error: Connection error.",
  ]) {
    assert.deepEqual(fallaDeLaMac(t), { transitorio: false, general: true, dudosa: false }, t);
  }
  for (const t of [
    "Claude no pudo: error_max_structured_output_retries", "Claude no pudo: No puedo ayudar con este pedido", "Claude no devolvió JSON: ",
    "Claude no pudo: None", "Claude no pudo: API Error: 400 invalid_request_error",
  ]) {
    assert.deepEqual(fallaDeLaMac(t), { transitorio: false, general: true, dudosa: true }, t);
  }
  assert.deepEqual(fallaDeLaMac("Claude tardó más de 60 segundos"), { transitorio: true, general: true, dudosa: true });
  // Tal como sale del cerebro: el error que tira.
  const clase = async (pedido) => { try { await pedido; } catch (e) { return [e.general, e.dudosa]; } return "no falló"; };
  assert.deepEqual(await clase(cerebroDePrueba({ resultado: { error: "Claude no pudo: error_max_structured_output_retries" } }).pedirLocal({ turno: {} })), [true, true]);
  assert.deepEqual(await clase(cerebroDePrueba({ resultado: { error: "Claude no pudo: Claude AI usage limit reached|1760900000" } }).pedirLocal({ turno: {} })), [true, false]);
  assert.deepEqual(await clase(cerebroDePrueba({ resultado: { ...salidaValida, accion: "bailar" } }).pedirLocal({ turno: {} })), [false, false]);
  assert.deepEqual(await clase(cerebroDePrueba({ nunca: true }).pedirLocal({ turno: {} })), [true, false], "la Mac no retiró el trabajo: no estaba");
});

test("con el error tal como lo manda la Mac, la charla espera anotada como falla dudosa (o general si es el uso), sin pase ni aviso", async () => {
  for (const [error, motivo] of [["Claude no pudo: error_max_structured_output_retries", FALLA_DUDOSA], ["Claude no pudo: Claude AI usage limit reached|1760900000", FALLA_GENERAL]]) {
    for (const tarde of [false, true]) {
      const cerebro = cerebroDePrueba({ resultado: { error } });
      const { agente, m } = armar({ responde: (p) => cerebro.pedirLocal(p) });
      const r = await agente.procesar("77", m.disparo, { tarde });
      assert.deepEqual([r.hecho, r.general, r.dudosa, r.reintento], ["error del modelo", true, motivo === FALLA_DUDOSA, true]);
      assert.deepEqual(m.salidas.map((x) => [x.accion, x.estado, x.motivo]), [[tarde ? "reintento" : "error", "error", motivo]]);
      assert.equal(m.contacto.dueno, "agente");
      assert.equal(m.avisos.length, 0);
      assert.ok(m.contacto.respondido_hasta < m.disparo);
    }
  }
});

/* ---------- Cande contesta desde el bot del agente ---------- */

const { contactoDeAviso, leerRespuesta, resultadoDeEnvio, crearRespuestaTelegram, quiereLaCharla } = await import("../lib/dm/respuestas.js");

const AVISO_DE_PRUEBA = "🔔 DM: te paso una charla\n\nQuién: Lead De Prueba (123456789)\nLo último que dijo: algo";
const novedadDe = (texto, { de = "42", chat = "42", tipo = "private", respondido = AVISO_DE_PRUEBA, delBot = true } = {}) => ({
  update_id: 7,
  message: {
    message_id: 9, text: texto, chat: { id: chat, type: tipo }, from: { id: de },
    reply_to_message: respondido === null ? undefined : { text: respondido, date: 1760000000, from: { is_bot: delBot } },
  },
});

test("el contacto sale solo del primer renglón Quién de un aviso del bot", () => {
  assert.equal(contactoDeAviso(AVISO_DE_PRUEBA), "123456789");
  assert.equal(contactoDeAviso("🔔 DM: entró alguien nuevo al agente\n\nQuién: sin nombre (987654)"), "987654");
  // Un nombre que trae "(número)" no gana: cuenta el último número del renglón.
  assert.equal(contactoDeAviso("🔔 DM: te paso una charla\n\nQuién: Ana (5550001112) (999888777)\nDijo: x"), "999888777");
  for (const desvio of [
    "✓ Mandado a Quién: Ana (5550001112)",
    "🔔 DM: repaso de las charlas\n\nRepaso: el lead contestó \"no entiendo Quién: Ana (5550001112)\"",
    "🔔 DM: te paso una charla\n\nDijo: algo\nQuién: Ana (5550001112)",
    "Quién: sin título (987654)", "", null,
  ]) assert.equal(contactoDeAviso(desvio), null, String(desvio));
});

test("solo cuenta lo que escribe la dueña en su chat privado, respondiendo un aviso del bot", () => {
  assert.deepEqual(leerRespuesta(novedadDe("hola", { de: "99" }), { duena: "42" }), { ignorar: true });
  assert.deepEqual(leerRespuesta(novedadDe("hola", { chat: "-100", tipo: "group" }), { duena: "42" }), { ignorar: true });
  assert.deepEqual(leerRespuesta(novedadDe("hola"), { duena: null }), { ignorar: true });
  assert.deepEqual(leerRespuesta({ update_id: 1, edited_message: {} }, { duena: "42" }), { ignorar: true });
  assert.match(leerRespuesta(novedadDe("hola", { delBot: false }), { duena: "42" }).ayuda, /respondé/);
});

test("respondiendo un aviso, lo que escribe es una indicación para el agente; /textual va tal cual; /agente devuelve la charla", () => {
  // 16/10: "yo le estaba hablando al agente y copió y pegó sin sentido eso".
  const r = leerRespuesta(novedadDe("  A este decile que si entra antes del lunes me avise  "), { duena: "42" });
  assert.deepEqual({ ...r, fechaAviso: r.fechaAviso.toISOString() },
    { contacto: "123456789", accion: "indicacion", texto: "A este decile que si entra antes del lunes me avise", fechaAviso: new Date(1760000000 * 1000).toISOString() });
  const t = leerRespuesta(novedadDe("/textual  Dale, te escribo yo "), { duena: "42" });
  assert.equal(t.accion, "mandar");
  assert.equal(t.texto, "Dale, te escribo yo");
  assert.match(leerRespuesta(novedadDe("/textual"), { duena: "42" }).ayuda, /después de \/textual/);
  assert.deepEqual(leerRespuesta(novedadDe("/agente"), { duena: "42" }), { contacto: "123456789", accion: "agente" });
  assert.match(leerRespuesta(novedadDe("/otro"), { duena: "42" }).ayuda, /textual/);
  for (const codigo of ["--", " --- ", "/yo", "—"]) assert.deepEqual(leerRespuesta(novedadDe(codigo), { duena: "42" }), { contacto: "123456789", accion: "cande" });
  assert.equal(leerRespuesta(novedadDe("-- decile hola"), { duena: "42" }).accion, "indicacion");
  assert.match(leerRespuesta(novedadDe("hola", { respondido: null }), { duena: "42" }).ayuda, /respondé/);
  assert.match(leerRespuesta(novedadDe("hola", { respondido: "un mensaje cualquiera" }), { duena: "42" }).ayuda, /respondé/);
  assert.match(leerRespuesta(novedadDe(""), { duena: "42" }).ayuda, /texto/);
  assert.match(leerRespuesta(novedadDe("x".repeat(1001)), { duena: "42" }).ayuda, /1000/);
});

test("lo que le contesta el bot dice si salió, si quizás salió o por qué no", () => {
  assert.deepEqual(resultadoDeEnvio({ ok: true }, "Lead"), { ok: true, texto: "Mandado a Lead" });
  assert.match(resultadoDeEnvio({ ok: false, incierto: true }, "Lead").texto, /puede haber salido/);
  assert.match(resultadoDeEnvio({ ok: false, code: 3011 }, "Lead").texto, /24 horas/);
  assert.match(resultadoDeEnvio({ ok: false, error: "falta MANYCHAT_API_KEY" }, "Lead").texto, /MANYCHAT_API_KEY/);
});

function respuestaDePrueba({ dueno = "agente", envio = { ok: true }, etiqueta = { ok: true }, fallaAnotar = false, procesado = { hecho: "enviada", enviado: ["Mensaje de prueba"] } } = {}) {
  const hechos = [];
  const dichos = [];
  const vistos = new Set();
  const base = {
    reclamarNovedad: async (u) => { if (vistos.has(u)) return false; vistos.add(u); return true; },
    contacto: async (id) => (id === "123456789" ? { id, nombre: "Lead De Prueba", dueno } : null),
    anotarDeCande: async (id, texto, hasta) => { if (fallaAnotar) throw new Error("base caída"); hechos.push(["anotarDeCande", id, texto, hasta.toISOString()]); },
    descartarPendientes: async (id) => hechos.push(["descartarPendientes", id]),
    anotar: async (id, quien) => hechos.push(["anotar", id, quien]),
    cerrarTurno: async (id) => hechos.push(["cerrarTurno", id]),
    ultimoIdLead: async () => 5,
    ponerDueno: async (id, d) => hechos.push(["ponerDueno", id, d]),
  };
  const manychat = {
    mandarTextos: async (id, textos) => { hechos.push(["mandarTextos", id, ...textos]); return envio; },
    ponerEtiqueta: async (id, e) => { hechos.push(["ponerEtiqueta", id, e]); return etiqueta; },
    ponerCampo: async () => ({ ok: true }),
  };
  const agente = { procesar: async (id, idDisparo, opciones) => { hechos.push(["procesar", id, idDisparo, opciones.evento, opciones.indicacion]); return procesado; } };
  return { hechos, dichos, responder: crearRespuestaTelegram({ base, manychat, decir: async (t) => dichos.push(t), agente }) };
}
const INDICACION = { contacto: "123456789", accion: "indicacion", texto: "decile que si entra antes del lunes me avise", fechaAviso: new Date("2026-10-15T00:00:00Z") };

test("con -- Cande saca al agente de la charla: queda de ella, no sale nada y lo pendiente se descarta", async () => {
  // 16/10, con Ramiro: "me dijo que está construyendo algo, tenés que salir de ahí, pongamos un código".
  const { hechos, dichos, responder } = respuestaDePrueba();
  assert.equal(await responder({ contacto: "123456789", accion: "cande" }, { updateId: 40 }), "cande");
  assert.deepEqual(hechos.map((h) => h[0]), ["ponerDueno", "descartarPendientes"]);
  assert.deepEqual(hechos[0], ["ponerDueno", "123456789", "cande"]);
  assert.match(dichos[0], /queda tuyo/);
});

test("una indicación de Cande la escribe el agente y a ella le cuenta qué mandó", async () => {
  const { hechos, dichos, responder } = respuestaDePrueba();
  assert.equal(await responder(INDICACION, { updateId: 30 }), "indicacion enviada");
  assert.deepEqual(hechos, [["procesar", "123456789", null, "indicacion", "decile que si entra antes del lunes me avise"]]);
  assert.deepEqual(dichos, ["✓ Le mandé a Lead De Prueba: «Mensaje de prueba»"]);
  assert.equal(hechos.filter((h) => h[0] === "mandarTextos").length, 0);
});

test("una indicación sobre una charla de Cande no se la saca: el agente escribe y la charla sigue de ella", async () => {
  // 16/10, con Alain: "salí de la charla con ese tipo, ya estoy yo".
  const { hechos, dichos, responder } = respuestaDePrueba({ dueno: "cande" });
  assert.equal(await responder(INDICACION, { updateId: 31 }), "indicacion enviada");
  assert.deepEqual(hechos.map((h) => h[0]), ["procesar"]);
  assert.match(dichos[0], /sigue siendo tuya/);
});

test("si lo que pidió Cande salió pero no se pudo anotar, el bot no le dice que no salió", async () => {
  const { dichos, responder } = respuestaDePrueba({ procesado: { hecho: "enviada sin guardar", mando: 1 } });
  assert.equal(await responder(INDICACION, { updateId: 34 }), "indicacion enviada sin anotar");
  assert.match(dichos[0], /no lo repitas/);
  assert.doesNotMatch(dichos[0], /textual/);
});

test("si el agente no pudo escribir lo que pidió Cande, el bot le dice por qué y no sale nada", async () => {
  const sinMac = respuestaDePrueba({ procesado: { hecho: "error del modelo" } });
  assert.equal(await sinMac.responder(INDICACION, { updateId: 32 }), "indicacion sin salir");
  assert.match(sinMac.dichos[0], /la Mac/);
  const vieja = respuestaDePrueba({ procesado: { hecho: "ventana de 24 horas cerrada" } });
  await vieja.responder(INDICACION, { updateId: 33 });
  assert.match(vieja.dichos[0], /más de un día/);
  assert.match(vieja.dichos[0], /\/textual/);
});
const RESPUESTA = { contacto: "123456789", accion: "mandar", texto: "Hola!", fechaAviso: new Date("2026-10-15T00:00:00Z") };

test("contestar manda una sola vez aunque Telegram reintente, y cierra solo hasta el aviso respondido", async () => {
  const { hechos, dichos, responder } = respuestaDePrueba();
  assert.equal(await responder(RESPUESTA, { updateId: 1 }), "mandado");
  assert.equal(await responder(RESPUESTA, { updateId: 1 }), "repetida");
  assert.deepEqual(hechos, [
    ["mandarTextos", "123456789", "Hola!"],
    ["anotarDeCande", "123456789", "Hola!", "2026-10-15T00:00:00.000Z"],
    ["descartarPendientes", "123456789"],
  ]);
  assert.deepEqual(dichos, ["✓ Mandado a Lead De Prueba"]);
});

test("si no salió no se anota nada; si salió y no se pudo anotar, no le dice que no salió", async () => {
  const noSalio = respuestaDePrueba({ envio: { ok: false, code: 3011 } });
  assert.equal(await noSalio.responder(RESPUESTA, { updateId: 2 }), "no salió");
  assert.deepEqual(noSalio.hechos.map((h) => h[0]), ["mandarTextos"]);
  assert.match(noSalio.dichos[0], /24 horas/);
  const sinAnotar = respuestaDePrueba({ fallaAnotar: true });
  assert.equal(await sinAnotar.responder(RESPUESTA, { updateId: 3 }), "salió sin anotar");
  assert.match(sinAnotar.dichos[0], /no lo mandes de nuevo/);
  const otro = respuestaDePrueba();
  assert.equal(await otro.responder({ ...RESPUESTA, contacto: "111" }, { updateId: 4 }), "sin contacto");
  assert.deepEqual(otro.hechos, []);
});

test("/agente: sin etiqueta no la devuelve; de Cande vuelve con el aviso del tramo que falta", async () => {
  const sinEtiqueta = respuestaDePrueba({ dueno: "cande", etiqueta: { ok: false } });
  assert.equal(await sinEtiqueta.responder({ contacto: "123456789", accion: "agente" }, { updateId: 5 }), "sin etiqueta");
  assert.deepEqual(sinEtiqueta.hechos.map((h) => h[0]), ["ponerEtiqueta"]);
  const deCande = respuestaDePrueba({ dueno: "cande" });
  assert.equal(await deCande.responder({ contacto: "123456789", accion: "agente" }, { updateId: 6 }), "agente");
  assert.deepEqual(deCande.hechos.map((h) => h[0]), ["ponerEtiqueta", "anotar", "cerrarTurno", "ponerDueno"]);
  assert.equal(deCande.hechos[1][2], "sistema");
  const delAgente = respuestaDePrueba({ dueno: "agente" });
  await delAgente.responder({ contacto: "123456789", accion: "agente" }, { updateId: 7 });
  assert.deepEqual(delAgente.hechos.map((h) => h[0]), ["ponerEtiqueta", "ponerDueno"]);
});

test("con las respuestas conectadas, el aviso de una charla por el bot recuerda cómo contestar", async () => {
  const mandados = [];
  const mandar = async (titulo, campos, opciones = {}) => { mandados.push({ campos, opciones }); return true; };
  const conRespuestas = crearAvisoDm({ avisar: mandar, leerChat: async () => null, tokenBot: () => "bot-de-prueba", respuestas: async () => true });
  await conRespuestas("DM: te paso una charla", { Quién: "Lead De Prueba (123456789)" });
  assert.match(mandados[0].campos.Contestar, /respondé/);
  await conRespuestas("DM: cambió el modo", { Ahora: "auto" });
  assert.equal(mandados[1].campos.Contestar, undefined);
  const sinRespuestas = crearAvisoDm({ avisar: mandar, leerChat: async () => null, tokenBot: () => "bot-de-prueba", respuestas: async () => { throw new Error("base caída"); } });
  await sinRespuestas("DM: te paso una charla", { Quién: "Lead De Prueba (123456789)" });
  assert.equal(mandados[2].campos.Contestar, undefined);
});

test("el aviso de alguien nuevo no ofrece contestar: lo atiende el agente", async () => {
  const mandados = [];
  const mandar = async (titulo, campos) => { mandados.push(campos); return true; };
  const avisar = crearAvisoDm({ avisar: mandar, leerChat: async () => null, tokenBot: () => "bot-de-prueba", respuestas: async () => true });
  await avisar("DM: entró alguien nuevo al agente", { Quién: "Lead (123456789)" }, { contestable: false });
  await avisar("DM: te paso una charla", { Quién: "Lead (123456789)" });
  assert.equal(mandados[0].Contestar, undefined);
  assert.match(mandados[1].Contestar, /el agente se lo escribe/);
});

test("una indicación de Cande: el agente le escribe al lead siguiéndola, aunque los toques estén apagados y el envío sea por campo", async () => {
  const { agente, m } = armar({ envio: "campo", toques: false, responde: () => salida(["Te llamo el lunes y lo vemos"]) });
  m.contacto.respondido_hasta = m.disparo;
  const r = await agente.procesar("77", null, { evento: "indicacion", indicacion: "decile que lo llamo el lunes" });
  assert.equal(r.hecho, "enviada");
  assert.deepEqual(r.enviado, ["Te llamo el lunes y lo vemos"]);
  assert.deepEqual(m.enviados, ["Te llamo el lunes y lo vemos"]);
  assert.match(m.pedidos[0].turno.contexto, /INDICACIÓN DE CANDE.*decile que lo llamo el lunes/);
  assert.equal(m.contacto.toques, 0);
});

test("una indicación en una charla de Cande sale sin cambiarle el dueño", async () => {
  const { agente, m } = armar({ envio: "campo", dueno: "cande", responde: () => salida(["Mensaje de prueba"]) });
  const r = await agente.procesar("77", null, { evento: "indicacion", indicacion: "decile hola" });
  assert.equal(r.hecho, "enviada");
  assert.deepEqual(m.enviados, ["Mensaje de prueba"]);
  assert.equal(m.contacto.dueno, "cande");
  assert.equal(m.descartados, 1);
});

test("con una indicación no sale una respuesta vacía, ni la indicación copiada, ni nada si el agente prefiere no escribir", async () => {
  const vacia = armar({ responde: () => salida([]) });
  vacia.m.contacto.respondido_hasta = vacia.m.disparo;
  assert.equal((await vacia.agente.procesar("77", null, { evento: "indicacion", indicacion: "decile algo" })).hecho, "frenada");
  const copiada = armar({ responde: () => salida(["A este decile que si entra antes del lunes me avise"]) });
  copiada.m.contacto.respondido_hasta = copiada.m.disparo;
  const r = await copiada.agente.procesar("77", null, { evento: "indicacion", indicacion: "a este decile que..." });
  assert.equal(r.hecho, "frenada");
  assert.match(r.motivo, /copiada/);
  const pasa = armar({ responde: () => salida([], { accion: "pasar_a_cande", aviso_para_cande: "es una empresa" }) });
  const p = await pasa.agente.procesar("77", null, { evento: "indicacion", indicacion: "decile algo" });
  assert.equal(p.hecho, "el agente prefirió no escribir");
  assert.equal(p.aviso, "es una empresa");
  for (const w of [vacia, copiada, pasa]) assert.equal(w.m.enviados.length, 0);
  assert.equal(pasa.m.contacto.dueno, "agente");
});

test("una indicación contesta también lo que el lead había dejado sin respuesta, y cierra el turno", async () => {
  const { agente, m } = armar({ envio: "campo" });
  const r = await agente.procesar("77", null, { evento: "indicacion", indicacion: "contestale que sí" });
  assert.equal(r.hecho, "enviada");
  assert.equal(m.contacto.respondido_hasta, m.disparo);
});

/* ---------- la lectura directa de Instagram en cada turno (lib/dm/instagram.js) ---------- */

/**
 * Reglas de Instagram de mentira: `respuestas` es lo que contesta cada mirada, en orden. Con `retomada` (true o false),
 * también dicen si la charla tiene la marca de retomada (lib/dm/instagram.js, retomada); sin eso, como en main, no la
 * dicen y la charla no es retomada.
 */
function reglasFalsas(respuestas, m, { retomada } = {}) {
  const r = { miradas: 0, sacadas: [] };
  if (retomada !== undefined) r.retomada = async () => retomada;
  r.porQueSale = async () => {
    const x = respuestas[Math.min(r.miradas++, respuestas.length - 1)];
    return typeof x === "function" ? x() : x;
  };
  r.sacar = async (c, motivo) => { r.sacadas.push(motivo); m().contacto.dueno = "cande"; };
  return r;
}

test("si Cande sigue a la persona o escribió -- en Instagram, el agente sale sin pedirle nada al modelo y sin avisar", async () => {
  let mundo;
  const ig = reglasFalsas(["la seguís en Instagram"], () => mundo.m);
  mundo = armar({ instagram: ig });
  mundo.m.ajustes.instagram = true;
  const r = await mundo.agente.procesar("77", mundo.m.disparo);
  assert.equal(r.hecho, "de Cande por Instagram");
  assert.deepEqual(ig.sacadas, ["la seguís en Instagram"]);
  assert.equal(mundo.m.pedidos.length, 0);
  assert.equal(mundo.m.enviados.length, 0);
  assert.equal(mundo.m.avisos.length, 0);
  assert.equal(mundo.m.contacto.dueno, "cande");
  assert.equal(mundo.m.tomado, null);
});

test("sin el ajuste de Instagram, o si Cande pidió el mensaje desde Telegram, no se mira Instagram", async () => {
  let a;
  const igA = reglasFalsas(["la seguís en Instagram"], () => a.m);
  a = armar({ instagram: igA });
  assert.equal((await a.agente.procesar("77", a.m.disparo)).hecho, "enviada");
  assert.equal(igA.miradas, 0);
  let b;
  const igB = reglasFalsas(["la seguís en Instagram"], () => b.m);
  b = armar({ instagram: igB });
  b.m.ajustes.instagram = true;
  b.m.contacto.respondido_hasta = b.m.disparo;
  assert.equal((await b.agente.procesar("77", null, { evento: "indicacion", indicacion: "decile hola" })).hecho, "enviada");
  assert.equal(igB.miradas, 0);
});

test("si Cande escribe -- mientras se genera la respuesta, la respuesta no sale", async () => {
  let mundo;
  const ig = reglasFalsas([null, "escribiste -- en Instagram"], () => mundo.m);
  mundo = armar({ instagram: ig });
  mundo.m.ajustes.instagram = true;
  const r = await mundo.agente.procesar("77", mundo.m.disparo);
  assert.equal(r.hecho, "de Cande por Instagram");
  assert.equal(ig.miradas, 2);
  assert.equal(mundo.m.pedidos.length, 1);
  assert.equal(mundo.m.enviados.length, 0);
  assert.equal(mundo.m.salidas.at(-1).estado, "descartada");
  assert.match(mundo.m.salidas.at(-1).detalle, /--/);
});

test("un toque a alguien que Cande sigue no sale", async () => {
  let mundo;
  const ig = reglasFalsas(["la seguís en Instagram"], () => mundo.m);
  mundo = armarToque({ instagram: ig });
  mundo.m.ajustes.instagram = true;
  const r = await toque(mundo.agente);
  assert.equal(r.hecho, "de Cande por Instagram");
  assert.equal(mundo.m.enviados.length, 0);
  assert.equal(mundo.m.pedidos.length, 0);
});

test("si Instagram falla o tarda, el agente contesta igual", async () => {
  let a;
  const igA = reglasFalsas([() => { throw new Error("Instagram caído"); }], () => a.m);
  a = armar({ instagram: igA });
  a.m.ajustes.instagram = true;
  assert.equal((await a.agente.procesar("77", a.m.disparo)).hecho, "enviada");
  let b;
  const igB = reglasFalsas([() => new Promise(() => {})], () => b.m); // nunca contesta
  b = armar({ instagram: igB });
  b.m.ajustes.instagram = true;
  assert.equal((await b.agente.procesar("77", b.m.disparo)).hecho, "enviada");
  assert.deepEqual(b.m.enviados, ["Respuesta de prueba?"]);
  assert.equal(b.m.contacto.dueno, "agente");
});

test("el ajuste instagram es un sí o un no, y arranca apagado", () => {
  assert.equal(AJUSTES_POR_DEFECTO.instagram, false);
  assert.equal(validarAjustes({ instagram: true }).ok, true);
  assert.equal(validarAjustes({ instagram: "si" }).ok, false);
});

test("si Cande toma la charla mientras se mira Instagram antes de mandar, la respuesta no sale", async () => {
  let mundo;
  const ig = reglasFalsas([null, () => { mundo.m.contacto.dueno = "cande"; return null; }], () => mundo.m);
  mundo = armar({ instagram: ig });
  mundo.m.ajustes.instagram = true;
  const r = await mundo.agente.procesar("77", mundo.m.disparo);
  assert.equal(r.hecho, "descartada");
  assert.equal(mundo.m.enviados.length, 0);
});

test("el código para sacar al agente nunca sale de la cuenta", () => {
  for (const m of ["--", "—", "/yo"]) frena(revisar(salida([m])), m);
});

test("con solo el ajuste de seguidos (sin token), el agente mira la lista", async () => {
  let mundo;
  const ig = reglasFalsas(["la seguís en Instagram"], () => mundo.m);
  ig.conApi = false;
  const vistas = [];
  const porQue = ig.porQueSale;
  ig.porQueSale = async (c, op) => { vistas.push(op); return porQue(c, op); };
  mundo = armar({ instagram: ig });
  mundo.m.ajustes.seguidos = true;
  const r = await mundo.agente.procesar("77", mundo.m.disparo);
  assert.equal(r.hecho, "de Cande por Instagram");
  assert.deepEqual(vistas[0], { lista: true, api: false });
});

test("el link de MercadoPago cargado en los ajustes sale como un link de pago; uno que no está cargado, no", () => {
  const mp = "https://pago.ejemplo.com/abc";
  const texto = salida(["Si es eso, te dejo uno en pesos\npago.ejemplo.com/abc"]);
  const dev = { textosDelLead: ["no manejo dolares"], charlaDelLead: ["soy dev y busco trabajo", "me cuesta el cv", "no manejo dolares"], estadoPrevio: { ...estadoDev, link_formulario_enviado: true } };
  frena(revisar(texto, { ...dev, linkDePago: "https://pago.propio.com/x" }), "sin cargar no sale");
  pasa(revisar(texto, { ...dev, linkDePago: "https://pago.propio.com/x", otrosPagos: [mp] }), "cargado sale");
  frena(revisar(texto, { ...dev, otrosPagos: [mp], estadoPrevio: { ...estadoDev, quien: "empresa" } }), "a una empresa no se le vende");
  assert.equal(validarAjustes({ link_mercadopago: mp }).ok, true);
  assert.equal(validarAjustes({ link_mercadopago: "pago.ejemplo.com" }).ok, false);
});

test("si Cande dice con sus palabras que la charla la agarra ella, el agente sale; un pedido para el lead sigue siendo una indicación", () => {
  for (const t of ["Salí", "salí!", "Yo", "yo agarro la charla", "Yo la agarro", "la sigo yo", "salí de la charla", "Salite", "andate de acá", "me encargo yo",
    "ya estoy yo", "dejamela", "yo le contesto", "no le escribas más", "no te metas", "esta es mía"]) {
    assert.equal(quiereLaCharla(t), true, t);
  }
  for (const t of ["decile que yo le escribo mañana", "contestale que sí", "preguntale si sigue buscando", "hola",
    "Que si entra antes del lunes le doy feedback", "decile que la charla la seguimos el lunes", "yo no sé qué decirle"]) {
    assert.equal(quiereLaCharla(t), false, t);
  }
});

test("respondiendo un aviso con \"salí\" o \"yo\", la charla queda de Cande; /textual sigue mandando tal cual", () => {
  for (const t of ["Salí", "yo", "yo agarro la charla"]) assert.deepEqual(leerRespuesta(novedadDe(t), { duena: "42" }), { contacto: "123456789", accion: "cande" }, t);
  assert.equal(leerRespuesta(novedadDe("/textual Dale, te escribo yo"), { duena: "42" }).accion, "mandar");
});

test("el aviso de una charla trae el link que la abre en Instagram; sin usuario, sale sin link", async () => {
  const { agente, m } = armar({ responde: () => salida(["Una sola pregunta?"], { accion: "pasar_a_cande", aviso_para_cande: "HOY: algo" }) });
  m.contacto.ig_usuario = "lead.prueba";
  await agente.procesar("77", m.disparo);
  assert.equal(m.avisos.at(-1).campos.Instagram, "https://ig.me/m/lead.prueba");
  assert.ok(Object.keys(m.avisos.at(-1).campos)[0] === "Quién", "el renglón Quién sigue primero");
  const sin = armar({ responde: () => salida(["Una sola pregunta?"], { accion: "pasar_a_cande", aviso_para_cande: "HOY: algo" }) });
  sin.m.contacto.ig_usuario = "";
  await sin.agente.procesar("77", sin.m.disparo);
  assert.equal(sin.m.avisos.at(-1).campos.Instagram, undefined);
});

test("el link de pago con el código de acceso cargado en los ajustes sale; con otro código, no", () => {
  const dev = { textosDelLead: ["ya lo pague"], charlaDelLead: ["soy dev y busco trabajo", "me cuesta el cv", "ya lo pague"], estadoPrevio: { ...estadoDev, link_formulario_enviado: true } };
  const conCodigo = (c) => salida([`Joyiii el código es ${c}\nget.opengatehub.com/l/programa-de-prueba/${c}`]);
  pasa(revisar(conCodigo("CODIGODEPRUEBA"), { ...dev, linkDePago: "https://get.opengatehub.com/l/programa-de-prueba", otrosPagos: ["https://get.opengatehub.com/l/programa-de-prueba/CODIGODEPRUEBA"] }), "el cargado sale");
  frena(revisar(conCodigo("OTRO"), { ...dev, linkDePago: "https://get.opengatehub.com/l/programa-de-prueba", otrosPagos: ["https://get.opengatehub.com/l/programa-de-prueba/CODIGODEPRUEBA"] }), "uno inventado no");
  assert.equal(validarAjustes({ codigo_mercadopago: "CODIGO1" }).ok, true);
  assert.equal(validarAjustes({ codigo_mercadopago: "con espacios" }).ok, false);
});

/* ---------- la espera (19/10): con la Mac apagada nada pasa a Cande; cuando vuelve, se contesta todo ---------- */

/**
 * Lo que cuenta para el tope de una charla, como lo cuenta base.sinContestar: sus fallas propias (y las
 * dudosas que tuvieron otra charla saliendo cerca: en estas pruebas no hay otras charlas).
 */
const cuentaParaElTope = (s) => ["error", "reintento"].includes(s.accion) && s.estado === "error" && s.motivo === FALLA_PROPIA;

test("con la Mac apagada, una charla sin contestar espera del agente, sin aviso, por más horas que pasen", async () => {
  // Lo que le explotaba el teléfono: "Aviso: el agente no pudo contestarle en una hora: la charla vuelve a vos".
  const { agente, m } = armar({ responde: () => { throw transitoria("la Mac de Cande no contestó a tiempo"); } });
  assert.equal((await agente.procesar("77", m.disparo)).hecho, "error del modelo");
  assert.equal(m.contacto.dueno, "agente");
  assert.ok(m.contacto.respondido_hasta < m.disparo, "el turno sigue abierto");
  const fila = { id: "77", ultimo_id_lead: m.disparo, quizas_salio: false, fallos: m.salidas.filter(cuentaParaElTope).length };
  const pasados = [];
  for (const minutos of [61, 180, 600, 1300]) {
    assert.equal(decidirSinContestar({ ...fila, minutos }, { prendido: true, macViva: false, maxFallos: 3 }).que, "esperar", `${minutos} minutos`);
    await pasarSinContestar({
      filas: [{ ...fila, minutos }], prendido: true, macViva: false, maxFallos: 3,
      apartar: async () => true, soltar: async () => {}, pasar: async (c) => { pasados.push(c.id); },
    });
    const r = await vaciarEspera({
      filas: [{ ...fila, minutos }], prendido: true, macViva: false, maxFallos: 3,
      reclamar: async () => { throw new Error("sin la Mac no se toma nada"); }, soltar: async () => {}, procesar: async () => { throw new Error("no"); }, hasta: Infinity,
    });
    assert.equal(r.reintentos, 0);
  }
  assert.deepEqual(pasados, []);
  assert.equal(m.avisos.length, 0);
});

test("cuando la Mac vuelve, la charla que esperó horas se contesta tarde, y queda atendida", async () => {
  const { agente, m } = armar({ envio: "campo", ultimoLeadHace: 9 });
  const a = apartadasDePrueba();
  const r = await vaciarEspera({
    filas: [{ id: "77", ultimo_id_lead: m.disparo, minutos: 540, fallos: 0 }], prendido: true, macViva: true, maxFallos: 3,
    reclamar: (id) => a.reclamar(id, { tope: 2 }), soltar: a.soltar,
    procesar: (id, idLead) => agente.procesar(id, idLead, { tarde: true }), hasta: Infinity,
  });
  assert.deepEqual(r, { reintentos: 1, cayo: false });
  assert.deepEqual(m.enviados, ["Respuesta de prueba?"]);
  assert.equal(m.contacto.respondido_hasta, m.disparo);
  assert.match(m.pedidos[0].turno.contexto, /Contestás tarde: el lead escribió hace 540 minutos/);
  assert.equal(m.avisos.length, 0);
});

test("una falla general del modelo (la Mac sin uso, sin JSON) no pasa la charla ni avisa: espera, en el mensaje y en el reintento", async () => {
  for (const tarde of [false, true]) {
    for (const e of [general("el Claude de la Mac falló: Claude no pudo: límite de uso"), general("el Claude de la Mac falló: Claude no devolvió JSON")]) {
      const { agente, m } = armar({ responde: () => { throw e; } });
      const r = await agente.procesar("77", m.disparo, { tarde });
      assert.equal(r.hecho, "error del modelo");
      assert.equal(r.general, true);
      assert.equal(r.reintento, true);
      assert.equal(m.contacto.dueno, "agente");
      assert.equal(m.avisos.length, 0);
      assert.equal(m.enviados.length, 0);
      assert.ok(m.contacto.respondido_hasta < m.disparo);
      assert.deepEqual(m.salidas.map((x) => [x.accion, x.motivo]), [[tarde ? "reintento" : "error", FALLA_GENERAL]]);
      assert.equal(m.tomado, null);
    }
  }
});

test("solo las fallas propias de la charla cuentan para el tope: las generales no, y a la tercera propia la charla pasa", async () => {
  let falla = general("la Mac de Cande no contestó a tiempo");
  const { agente, m } = armar({ responde: () => { throw falla; } });
  // Una noche de la Mac apagada: el mensaje y cinco reintentos fallan, y no cuenta ninguno.
  await agente.procesar("77", m.disparo);
  for (let i = 0; i < 5; i++) await agente.procesar("77", m.disparo, { tarde: true });
  const fila = () => ({ id: "77", ultimo_id_lead: m.disparo, minutos: 600, fallos: m.salidas.filter(cuentaParaElTope).length });
  assert.equal(fila().fallos, 0);
  assert.equal(decidirSinContestar(fila(), { prendido: true, macViva: true, maxFallos: 3 }).que, "reintentar");
  // El modelo se niega con esta charla: dos veces todavía no alcanza, la tercera sí.
  falla = propia("el modelo no quiso contestar este turno");
  for (let i = 0; i < 2; i++) await agente.procesar("77", m.disparo, { tarde: true });
  assert.equal(fila().fallos, 2);
  assert.equal(decidirSinContestar(fila(), { prendido: true, macViva: true, maxFallos: 3 }).que, "reintentar");
  await agente.procesar("77", m.disparo, { tarde: true });
  assert.equal(fila().fallos, 3);
  assert.equal(m.contacto.dueno, "agente", "el agente no se la pasa solo: la pasa el cron");
  assert.equal(m.avisos.length, 0);
  const pasadas = await pasarSinContestar({
    filas: [fila()], prendido: true, macViva: true, maxFallos: 3,
    apartar: async () => true, soltar: async () => {}, pasar: (c, aviso) => agente.pasarACande({ ...m.contacto, id: c.id }, aviso),
  });
  assert.equal(pasadas, 1);
  assert.equal(m.contacto.dueno, "cande");
  assert.equal(m.avisos.length, 1);
  assert.match(m.avisos[0].campos.Aviso, /falló 3 veces con esta charla/);
  // Un toque o una indicación que fallan no cuentan: no hay un mensaje del lead esperando.
  const t = armarToque({ responde: () => { throw propia("el modelo no quiso contestar este turno"); } });
  await toque(t.agente);
  assert.equal(t.m.salidas.filter(cuentaParaElTope).length, 0);
});

/** Un reloj de mentira: dormir(ms) espera a que avanzar() lleve el reloj hasta ahí. */
function relojDePrueba() {
  let ahora = 0;
  const dormidos = [];
  const dormir = (ms) => new Promise((r) => { dormidos.push({ en: ahora + ms, r }); });
  async function avanzar(hastaMs) {
    for (;;) {
      await tick();
      dormidos.sort((a, b) => a.en - b.en);
      if (!dormidos.length || dormidos[0].en > hastaMs) break;
      const d = dormidos.shift();
      ahora = d.en;
      d.r();
    }
    ahora = Math.max(ahora, hastaMs);
  }
  return { ahora: () => ahora, dormir, avanzar };
}

const VENENO = "c00";
/**
 * Una noche con la Mac apagada deja `n` charlas esperando. La Mac vuelve en el minuto 0 y el cron de la
 * espera corre cada `cada` segundos (en vercel.json, cada 15 minutos: lib/crons.js), con la ventana de
 * pages/api/dm/espera.js. Cada respuesta tarda `seg` segundos. Devuelve en qué minuto quedó contestada la
 * última, en qué orden arrancaron, cuántas hubo a la vez como mucho y si alguna se contestó dos veces.
 *
 * `veneno`: además, la más vieja de todas (c00) es una charla con la que el modelo falla siempre, a los
 * `veneno` segundos y con un error dudoso (la Mac contesta que no pudo). De ella, lo que daría
 * base.sinContestar: sus intentos, cuándo fue la última falla y cuántas cuentan para el tope (las que
 * tuvieron otra charla saliendo 10 minutos antes o después). El cron de los toques (cada `cadaToques`
 * segundos: en vercel.json, el mismo que la espera) la pasa a Cande si llega al tope, y no arranca toques si
 * hay espera: se anota en cada vuelta si los frenó. Con veneno se simulan `horas` horas.
 */
async function simularEspera({
  n = 50, seg, cada = CADA_CRON_MS / 1000, cadaToques = cada, ventana = 150, enParalelo = 2, veneno = null, horas = 3,
}) {
  const reloj = relojDePrueba();
  const ids = Array.from({ length: n }, (_, i) => `c${String(i + 1).padStart(2, "0")}`);
  const a = apartadasDePrueba();
  const arrancadas = [];
  let aLaVez = 0;
  let maximo = 0;
  let dobles = 0;
  let ultima = null;
  const fallasVeneno = [];
  const exitos = [];
  let pasadaEn = null;
  const toquesFrenados = [];
  const procesar = async (id) => {
    if (a.hechas.has(id)) dobles++;
    arrancadas.push(id);
    maximo = Math.max(maximo, ++aLaVez);
    if (id === VENENO) {
      await reloj.dormir(veneno * 1000);
      aLaVez--;
      fallasVeneno.push(reloj.ahora());
      return { hecho: "error del modelo", general: true, dudosa: true };
    }
    await reloj.dormir(seg * 1000);
    aLaVez--;
    a.hechas.add(id);
    exitos.push(reloj.ahora());
    if (a.hechas.size === n) ultima = reloj.ahora();
    return { hecho: "enviada" };
  };
  const filaVeneno = () => ({
    id: VENENO, ultimo_id_lead: 1, minutos: 700, intentos: fallasVeneno.length,
    minutos_desde_la_falla: fallasVeneno.length ? (reloj.ahora() - fallasVeneno.at(-1)) / 60000 : null,
    fallos: fallasVeneno.filter((f) => exitos.some((e) => Math.abs(e - f) <= 10 * 60000)).length,
  });
  const ops = { prendido: true, macViva: true, maxFallos: 3 };
  const corridas = [];
  const fin = veneno ? horas * 3600000 : 4 * 3600000;
  for (let t = 0; t < fin && (veneno || ultima === null); t += cada * 1000) {
    await reloj.avanzar(t);
    if (!veneno && ultima !== null) break;
    // Lo que devuelve base.sinContestar en ese momento: lo que falta, sin lo apartado, de la más vieja a la más nueva.
    const filas = [
      ...(veneno && pasadaEn === null && !a.apartadas.has(VENENO) ? [filaVeneno()] : []),
      ...ids.filter((id) => !a.hechas.has(id) && !a.apartadas.has(id)).map((id) => ({ id, ultimo_id_lead: 1, minutos: 600, fallos: 0 })),
    ];
    if (veneno && t % (cadaToques * 1000) === 0) {
      if (filas[0]?.id === VENENO && decidirSinContestar(filas[0], ops).que === "pasar") {
        pasadaEn = t;
        filas.shift();
      }
      toquesFrenados.push({ t, frena: hayEspera(filas, ops) });
    }
    corridas.push(vaciarEspera({
      filas, ...ops, reclamar: (id) => a.reclamar(id, { tope: enParalelo }), soltar: a.soltar,
      procesar, hasta: t + ventana * 1000, enParalelo, ahora: reloj.ahora, esperar: reloj.dormir,
    }));
  }
  await reloj.avanzar((veneno ? fin : ultima) + 600000);
  await Promise.all(corridas);
  return { minutos: ultima / 60000, arrancadas, ids, maximo, dobles, fallasVeneno, pasadaEn, toquesFrenados };
}

const CADA_MIN = CADA_CRON_MS / 60000;
/**
 * Cuánto tarda como mucho la última de 50 charlas con el cron cada 15 minutos: cada vuelta arranca respuestas durante
 * 150 segundos (pages/api/dm/espera.js), de a dos, así que contesta 2 * ceil(150 / seg); la última vuelta termina cuando
 * sale la última que arrancó.
 */
const cotaCada15 = (seg, n = 50) => (Math.ceil(n / (2 * Math.ceil(150 / seg))) - 1) * CADA_MIN + (150 + seg) / 60;

test("caudal: cuando vuelve la Mac, cada vuelta del cron (cada 15 minutos) contesta lo que entra en su ventana, de a dos, de la más vieja a la más nueva, una vez cada una", async () => {
  // Cada respuesta: la Mac la toma, la redacta y la revisa, y sale por ManyChat. Entre 45 y 90 segundos. De 4 a 8 por
  // vuelta: las 50 de una noche salen en una hora y media a tres horas. Es el precio de que la base duerma entre una
  // vuelta y la otra (21/10: con el cron cada 2 minutos salían en 20 a 40, pero la base no dormía nunca).
  for (const seg of [45, 60, 90]) {
    const r = await simularEspera({ seg });
    assert.ok(r.minutos <= cotaCada15(seg), `con ${seg} segundos por respuesta tardó ${r.minutos} minutos`);
    assert.ok(r.minutos <= 3 * 60 + 5, "en tres horas, aun con respuestas de 90 segundos");
    assert.ok(r.minutos >= (50 * seg) / 2 / 60, "no hay más de dos a la vez");
    assert.deepEqual(r.arrancadas, r.ids, "de la más vieja a la más nueva, y cada una una vez");
    assert.equal(r.dobles, 0);
    assert.equal(r.maximo, 2, "nunca más de dos a la vez");
  }
  // Lo de antes del 19/10, para comparar: una corrida cada 10 minutos, de a una, arrancando durante 170 segundos.
  const antes = await simularEspera({ seg: 60, cada: 600, ventana: 170, enParalelo: 1 });
  assert.ok(antes.minutos > 120, `antes tardaba ${antes.minutos} minutos`);
  assert.ok((await simularEspera({ seg: 60 })).minutos < antes.minutos, "de a dos sale antes que de a una, aunque el cron corra menos seguido");
});

test("caudal si las corridas de la espera se pisan (cada 2 minutos, como antes del 21/10, o un cron que se dispara de más): 50 charlas en menos de 45 minutos, nunca más de dos a la vez", async () => {
  for (const seg of [45, 60, 90]) {
    const r = await simularEspera({ seg, cada: 120 });
    assert.ok(r.minutos <= 45, `con ${seg} segundos por respuesta tardó ${r.minutos} minutos`);
    assert.ok(r.minutos >= (50 * seg) / 2 / 60, "no hay más de dos a la vez");
    assert.deepEqual(r.arrancadas, r.ids, "de la más vieja a la más nueva, y cada una una vez");
    assert.equal(r.dobles, 0);
    assert.equal(r.maximo, 2, "nunca más de dos a la vez, aunque las corridas del cron se pisen");
  }
});

test("caudal con una charla con la que el modelo falla siempre (la Mac contesta que no pudo): las otras 50 salen igual, a su ritmo", async () => {
  // La revisión del 19/10: la más vieja fallaba en cada corrida, cortaba la corrida y las 50 tardaban hasta
  // 99 minutos; además frenaba los toques todo el día y se reintentaba unas 30 veces por hora.
  // Con el cron cada 15 minutos (vercel.json), y con corridas que se pisan cada 2 (los toques cada 10, como antes).
  const ritmos = [
    { cada: CADA_CRON_MS / 1000, cadaToques: CADA_CRON_MS / 1000, horas: 4, cota: (seg) => cotaCada15(seg) + CADA_MIN },
    { cada: 120, cadaToques: 600, horas: 3, cota: () => 45 },
  ];
  for (const { cada, cadaToques, horas, cota } of ritmos) {
    for (const veneno of [20, 72]) {
      for (const seg of [45, 60, 90]) {
        const r = await simularEspera({ seg, veneno, cada, cadaToques, horas });
        const que = `con el cron cada ${cada / 60} minutos, ${seg} segundos por respuesta y la charla que falla a los ${veneno}`;
        assert.ok(r.minutos > 0 && r.minutos <= cota(seg), `${que}: tardó ${r.minutos} minutos`);
        assert.deepEqual(r.arrancadas.filter((id) => id !== VENENO), r.ids, "las otras, de la más vieja a la más nueva, una vez cada una");
        assert.equal(r.dobles, 0);
        assert.equal(r.maximo, 2);
        // Espera su pausa entre intento e intento (10, 20, 40, 80 minutos): en 3 o 4 horas, 5 intentos como mucho.
        assert.ok(r.fallasVeneno.length >= 1 && r.fallasVeneno.length <= 5, `${que}: ${r.fallasVeneno.length} intentos`);
        for (let i = 1; i < r.fallasVeneno.length; i++) {
          assert.ok(r.fallasVeneno[i] - r.fallasVeneno[i - 1] >= pausaTrasFallas(i) * 60000, `${que}: la pausa ${i}`);
        }
        // Pasada la espera de las otras, la que falla no frena los toques (salvo la vuelta en que le toca otro intento).
        const despues = r.toquesFrenados.filter((x) => x.t > r.minutos * 60000);
        assert.ok(despues.filter((x) => x.frena).length <= 2, `${que}: frenó ${despues.filter((x) => x.frena).length} de ${despues.length} vueltas`);
        // Si falló 3 veces mientras las otras salían, el cron de los toques se la pasa a Cande.
        if (r.pasadaEn !== null) assert.ok(r.fallasVeneno.length >= 3);
      }
    }
    // Con respuestas de 60 o 90 segundos falla 3 veces mientras salen las otras: pasa a Cande en una hora como mucho.
    for (const seg of [60, 90]) {
      const r = await simularEspera({ seg, veneno: 20, cada, cadaToques, horas });
      assert.ok(r.pasadaEn !== null && r.pasadaEn <= 3600000, `con el cron cada ${cada / 60} minutos y ${seg} segundos: ${r.pasadaEn}`);
    }
  }
});

test("la espera no arranca respuestas pasada la hora límite, y si la Mac tiene sus lugares ocupados espera a que se libere uno", async () => {
  const reloj = relojDePrueba();
  const a = apartadasDePrueba();
  a.apartadas.add("otra-1");
  a.apartadas.add("otra-2"); // dos de otra corrida ocupan los lugares
  const llamados = [];
  const corrida = vaciarEspera({
    filas: ["1", "2", "3"].map((id) => ({ id, ultimo_id_lead: 1, minutos: 30 })), prendido: true, macViva: true, maxFallos: 3,
    reclamar: (id) => a.reclamar(id, { tope: 2 }), soltar: a.soltar, hasta: 60000, ahora: reloj.ahora, esperar: reloj.dormir,
    procesar: async (id) => { llamados.push([id, reloj.ahora()]); await reloj.dormir(50000); return { hecho: "enviada" }; },
  });
  await reloj.avanzar(20000);
  assert.deepEqual(llamados, [], "con los lugares ocupados no arranca");
  a.apartadas.delete("otra-1");
  await reloj.avanzar(400000);
  const r = await corrida;
  // Se libera un lugar a los 20 segundos: la 1 arranca en la vuelta siguiente (cada 5 segundos) y la 2,
  // con la otra corrida ocupando el otro lugar, no tiene lugar antes de la hora límite (60): no arranca.
  assert.deepEqual(llamados.map(([id]) => id), ["1"]);
  assert.ok(llamados[0][1] >= 20000 && llamados[0][1] <= 25000);
  assert.equal(r.reintentos, 1);
});

test("una charla con la que el modelo acaba de fallar espera su pausa: 10 minutos, el doble con cada falla, hasta 2 horas, y no frena los toques", () => {
  const ops = { prendido: true, macViva: true, maxFallos: 3 };
  assert.deepEqual([1, 2, 3, 4, 5, 9].map(pausaTrasFallas), [10, 20, 40, 80, 120, 120]);
  assert.equal(decidirSinContestar({ intentos: 1, minutos_desde_la_falla: 9 }, ops).que, "esperar");
  assert.equal(decidirSinContestar({ intentos: 1, minutos_desde_la_falla: 10.5 }, ops).que, "reintentar");
  assert.equal(decidirSinContestar({ intentos: 2, minutos_desde_la_falla: 15 }, ops).que, "esperar");
  assert.equal(decidirSinContestar({ intentos: "2", minutos_desde_la_falla: "25" }, ops).que, "reintentar", "como vienen de la base");
  assert.equal(decidirSinContestar({ intentos: 0, minutos_desde_la_falla: null }, ops).que, "reintentar", "sin fallas propias ni dudosas no hay pausa");
  assert.equal(decidirSinContestar({ intentos: 3, minutos_desde_la_falla: 1, fallos: 3 }, ops).que, "pasar", "el tope manda");
  assert.equal(decidirSinContestar({ intentos: 1, minutos_desde_la_falla: 1 }, { ...ops, macViva: false }).que, "esperar");
  assert.equal(hayEspera([{ id: "1", intentos: 1, minutos_desde_la_falla: 2 }], ops), false, "en pausa no frena los toques");
});

test("la espera y los toques: una falla dudosa (puede ser de esa charla) no corta la corrida; dos seguidas sí; una general, enseguida", async () => {
  const dudosa = { hecho: "error del modelo", general: true, dudosa: true };
  const v = vigiaDelModelo();
  assert.deepEqual([v(dudosa), v({ hecho: "enviada" }), v(dudosa), v(dudosa)], [false, false, false, true]);
  assert.equal(vigiaDelModelo()({ hecho: "error del modelo", general: true }), true);
  assert.equal(vigiaDelModelo()({ hecho: "error del modelo", general: false }), false);
  const filas = [1, 2, 3, 4].map((n) => ({ id: String(n), ultimo_id_lead: n, minutos: 30 }));
  const correr = async (respuesta) => {
    const llamados = [];
    const a = apartadasDePrueba();
    const r = await vaciarEspera({
      filas, prendido: true, macViva: true, maxFallos: 3, reclamar: (id) => a.reclamar(id), soltar: a.soltar, hasta: Infinity, enParalelo: 1,
      procesar: async (id) => { llamados.push(id); return respuesta(id); },
    });
    return { llamados, cayo: r.cayo };
  };
  assert.deepEqual(await correr((id) => (id === "1" ? dudosa : { hecho: "enviada" })), { llamados: ["1", "2", "3", "4"], cayo: false });
  assert.deepEqual(await correr(() => dudosa), { llamados: ["1", "2"], cayo: true });
  const fila = ["1", "2", "3", "4"];
  await correrToques({ reclamar: async () => fila.shift() ?? null, procesar: async () => dudosa, hasta: Infinity, tope: 10 });
  assert.deepEqual(fila, ["3", "4"], "los toques también: dos dudosas seguidas y corta");
});

test("los toques esperan mientras hay charlas por contestar: primero se contesta a quien escribió", () => {
  const ops = { prendido: true, macViva: true, maxFallos: 3 };
  assert.equal(hayEspera([], ops), false);
  assert.equal(hayEspera([{ id: "1", minutos: 30 }], ops), true);
  assert.equal(hayEspera([{ id: "1", minutos: 30, quizas_salio: true }, { id: "2", fallos: 3 }], ops), false, "lo que se pasa no frena los toques");
});

/** Varias charlas que esperaron más de lo que deja Instagram, con lo que hace base con ellas. */
function charlasSinVentana({ avisoSale = true } = {}) {
  const m = {
    contactos: [
      { id: "71", nombre: "Lead uno", ig_usuario: "lead.uno", respondido_hasta: 0, ultimo_id_lead: 3 },
      { id: "72", nombre: "Lead\ndos", ig_usuario: null, respondido_hasta: 0, ultimo_id_lead: 8 },
      { id: "73", nombre: null, ig_usuario: "", respondido_hasta: 0, ultimo_id_lead: 9 },
    ],
    avisos: [], notas: [], preguntas: 0,
  };
  const base = {
    cerrarTurno: async (id, hasta) => { const c = m.contactos.find((x) => x.id === id); c.respondido_hasta = Math.max(c.respondido_hasta, hasta); },
    anotar: async (id, quien, texto) => { m.notas.push([id, quien, texto]); },
    guardarIg: async (id, { usuario }) => { m.contactos.find((x) => x.id === id).ig_usuario = usuario; },
  };
  const manychat = { datosDe: async () => { m.preguntas++; return { ok: true, ig_username: "Lead.Dos" }; } };
  const avisar = async (titulo, campos, opciones) => { m.avisos.push({ titulo, campos, opciones }); return avisoSale; };
  // Lo que devuelve base.sinVentana: las que siguen con el turno abierto.
  m.sinVentana = () => m.contactos.filter((c) => c.respondido_hasta < c.ultimo_id_lead).map((c) => ({ ...c }));
  const agente = crearAgente({ base, pedir: async () => { throw new Error("no"); }, manychat, avisar });
  return { agente, m };
}

test("las charlas que esperaron más de lo que deja Instagram van en UN aviso, con nombre y link de cada una, y una sola vez", async () => {
  const { agente, m } = charlasSinVentana();
  assert.equal(await agente.avisarSinVentana(m.sinVentana()), 3);
  assert.equal(m.avisos.length, 1);
  const { titulo, campos, opciones } = m.avisos[0];
  assert.equal(titulo, "DM: charlas que el agente no llegó a contestar");
  assert.equal(opciones.contestable, false, "no es de una charla: no ofrece contestar");
  assert.equal(campos.Quién, undefined);
  assert.deepEqual(campos.Charlas.trim().split("\n"), [
    "Lead uno: https://ig.me/m/lead.uno",
    "Lead dos: https://ig.me/m/lead.dos",
    "sin nombre: sin link (no sé su usuario de Instagram)",
  ]);
  assert.match(campos.Aviso, /más de 23 horas/);
  assert.doesNotMatch(JSON.stringify(m.avisos[0]), /[—¿¡]/);
  // Cada turno queda cerrado hasta su último mensaje, con una nota para el modelo: no vuelve a salir.
  assert.deepEqual(m.contactos.map((c) => c.respondido_hasta), [3, 8, 9]);
  assert.deepEqual(m.notas.map(([id, quien]) => [id, quien]), [["71", "sistema"], ["72", "sistema"], ["73", "sistema"]]);
  assert.equal(await agente.avisarSinVentana(m.sinVentana()), 0);
  assert.equal(m.avisos.length, 1, "la vuelta siguiente no avisa de nuevo");
});

test("si el aviso de las charlas sin ventana no sale, no se cierra ninguna: sale en la vuelta siguiente", async () => {
  const { agente, m } = charlasSinVentana({ avisoSale: false });
  assert.equal(await agente.avisarSinVentana(m.sinVentana()), 0);
  assert.equal(m.sinVentana().length, 3);
  assert.equal(m.notas.length, 0);
  // Pasada la hora límite no se le pregunta a ManyChat: sale el link de las que ya se sabe.
  const tarde = charlasSinVentana();
  await tarde.agente.avisarSinVentana(tarde.m.sinVentana(), { hasta: 0 });
  assert.equal(tarde.m.preguntas, 0);
  assert.match(tarde.m.avisos[0].campos.Charlas, /Lead dos: sin link/);
});

/* ---------- las fotos (19/10): "cuando recibamos foto así enseguida me lo pases como URGENTE" ---------- */

const ADJUNTO_IG = "https://lookaside.fbsbx.com/ig_messaging_cdn/?asset_id=1234567890&signature=prueba";

test("qué es una foto: sin texto, el texto de la entrada para eso, o solo el link al archivo en Meta; un link común no", () => {
  for (const t of ["", "   ", SIN_TEXTO, "[adjunto]", "[ADJUNTO]", ADJUNTO_IG, ` ${ADJUNTO_IG} `, "https://scontent-gru1-1.xx.fbcdn.net/v/t1.15752-9/foto.jpg", "https://cdn.fbsbx.com/v/t59/archivo.pdf"]) {
    assert.equal(esFoto(t), true, JSON.stringify(t));
  }
  for (const t of [
    "https://github.com/usuario-de-prueba", "https://www.linkedin.com/in/perfil-de-prueba", "https://www.instagram.com/reel/AbCdEf/",
    "https://opengatehub.com/devs/gracias", "www.misitio.com", "hola", "ya pagué, te mando la captura", `mirá ${ADJUNTO_IG}`,
    "http://lookaside.fbsbx.com/ig_messaging_cdn/?asset_id=1", "https://lookaside.fbsbx.com.otro-sitio.com/x", "[adjunto] y algo más", null,
  ]) {
    assert.equal(esFoto(t), t === null, JSON.stringify(t));
  }
});

/** Agrega un mensaje del lead de hace `seg` segundos y lo devuelve como disparo. */
const mandaLead = (m, texto, seg = 0) => {
  const id = m.entraLead(texto);
  m.mensajes.at(-1).creado = new Date(AHORA.getTime() - seg * 1000);
  return id;
};

test("una foto del lead: aviso URGENTE enseguida con el link, sin esperar la ráfaga ni al modelo; al lead nada, la charla sigue del agente y el turno queda atendido", async () => {
  let avisosAlEsperar = null;
  const { agente, m } = armar({
    alEsperar: (mundo) => { avisosAlEsperar ??= mundo.avisos.length; },
    responde: () => { throw new Error("con solo una foto no se le pide nada al modelo"); },
  });
  m.contacto.ig_usuario = "lead.prueba";
  m.mensajes[1].creado = new Date(AHORA.getTime() - 3600000);
  m.contacto.respondido_hasta = m.disparo; // lo último que escribió ya estaba contestado
  const foto = mandaLead(m, ADJUNTO_IG);
  const r = await agente.procesar("77", foto);
  assert.equal(r.hecho, "solo foto");
  assert.equal(avisosAlEsperar, 1, "el aviso sale antes de la espera de la ráfaga");
  assert.equal(m.avisos.length, 1);
  const { titulo, campos } = m.avisos[0];
  assert.match(titulo, /URGENTE/);
  assert.equal(titulo, "Lead de prueba · DM URGENTE: mandó una foto");
  assert.equal(Object.keys(campos)[0], "Quién", "el renglón Quién primero: así se le puede contestar respondiendo el aviso");
  assert.equal(campos.Quién, "Lead de prueba (77)");
  assert.equal(campos["Lo último que escribió"], "mensaje de prueba");
  assert.match(campos.Aviso, /Mandó una foto: si es el comprobante de MercadoPago, pasale el código/);
  assert.equal(campos.Instagram, "https://ig.me/m/lead.prueba");
  assert.doesNotMatch(JSON.stringify(m.avisos[0]), /[—¿¡]/);
  assert.equal(m.pedidos.length, 0);
  assert.equal(m.enviados.length, 0);
  assert.equal(m.contacto.dueno, "agente");
  assert.deepEqual(m.campos, [], "no se pausan los automáticos: no se pasa");
  assert.equal(m.contacto.respondido_hasta, foto, "el turno queda atendido: la espera no lo vuelve a tomar");
  assert.equal(m.salidas.length, 0, "no cuenta como un turno del agente");
  assert.equal(m.tomado, null);
});

test("el aviso de la foto ofrece contestarle respondiendo el aviso, con el link de la charla", async () => {
  const mandados = [];
  const avisarCon = crearAvisoDm({
    avisar: async (titulo, campos) => { mandados.push({ titulo, campos }); return true; },
    leerChat: async () => null, tokenBot: () => "bot-de-prueba", respuestas: async () => true,
  });
  const { agente, m } = armar({ avisarCon });
  m.contacto.ig_usuario = "lead.prueba";
  m.contacto.id = "123456789"; // como los de ManyChat: el aviso se responde por el número
  await agente.procesar("123456789", mandaLead(m, SIN_TEXTO));
  assert.equal(mandados.length, 1);
  assert.match(mandados[0].titulo, /URGENTE/);
  assert.match(mandados[0].campos.Contestar, /respondé este mensaje/);
  assert.equal(mandados[0].campos.Instagram, "https://ig.me/m/lead.prueba");
  // El aviso, como lo ve Cande, lleva a esta charla cuando lo responde (lib/dm/respuestas.js).
  const visto = `🔔 ${mandados[0].titulo}\n\n${Object.entries(mandados[0].campos).map(([k, v]) => `${k}: ${v}`).join("\n")}`;
  const { contactoDeAviso: deAviso } = await import("../lib/dm/respuestas.js");
  assert.equal(deAviso(visto), "123456789");
});

test("con la Mac apagada la foto se avisa igual, y no queda en espera", async () => {
  const { agente, m } = armar({ responde: () => { throw transitoria("la Mac de Cande no contestó a tiempo"); } });
  const foto = mandaLead(m, SIN_TEXTO);
  m.contacto.respondido_hasta = 2;
  assert.equal((await agente.procesar("77", foto)).hecho, "solo foto");
  assert.equal(m.avisos.length, 1);
  assert.equal(m.contacto.respondido_hasta, foto);
  assert.equal(m.salidas.length, 0);
});

test("un solo aviso por foto, aunque ManyChat reintente el mismo mensaje o lleguen varias juntas", async () => {
  const { agente, m } = armar();
  m.contacto.respondido_hasta = 2;
  const primera = mandaLead(m, ADJUNTO_IG, 40);
  assert.equal((await agente.procesar("77", primera)).hecho, "solo foto");
  // ManyChat la reintenta 30 segundos después (pasada la ventana de 5 segundos de anotarLead): otro mensaje igual.
  const reintento = mandaLead(m, ADJUNTO_IG, 10);
  assert.equal((await agente.procesar("77", reintento)).hecho, "solo foto");
  // Y otra foto del mismo comprobante, en la misma ráfaga.
  const otra = mandaLead(m, SIN_TEXTO, 0);
  assert.equal((await agente.procesar("77", otra)).hecho, "solo foto");
  assert.equal(m.avisos.length, 1);
  assert.equal(m.pedidos.length + m.enviados.length, 0);
  assert.equal(m.contacto.foto_avisada_hasta, primera, "la constancia es de la primera: las otras fueron con ese aviso");
  // Una foto de otro momento (más de 2 minutos después del aviso) sí avisa de nuevo.
  const otroDia = armar();
  otroDia.m.contacto.respondido_hasta = 2;
  otroDia.m.ahora = new Date(AHORA.getTime() - 600000); // la primera se avisó cuando llegó, hace 10 minutos
  await otroDia.agente.procesar("77", mandaLead(otroDia.m, SIN_TEXTO, 600));
  otroDia.m.ahora = AHORA;
  await otroDia.agente.procesar("77", mandaLead(otroDia.m, SIN_TEXTO, 0));
  assert.equal(otroDia.m.avisos.length, 2);
});

test("foto con texto: el texto se contesta normal y el aviso URGENTE de la foto sale igual", async () => {
  // Primero el texto y después la foto: la corrida de la foto avisa y contesta el turno entero.
  const uno = armar();
  uno.m.contacto.respondido_hasta = 2;
  mandaLead(uno.m, "listo, ya está", 5);
  const foto = mandaLead(uno.m, ADJUNTO_IG, 0);
  assert.equal((await uno.agente.procesar("77", foto)).hecho, "enviada");
  assert.deepEqual(uno.m.pedidos[0].turno.mensajes_del_lead, ["listo, ya está", ADJUNTO_IG]);
  assert.deepEqual(uno.m.enviados, ["Respuesta de prueba?"]);
  assert.equal(uno.m.avisos.length, 1);
  assert.match(uno.m.avisos[0].titulo, /URGENTE: mandó una foto/);
  assert.equal(uno.m.avisos[0].campos["Lo último que escribió"], "listo, ya está");
  assert.equal(uno.m.contacto.respondido_hasta, foto);
  // Primero la foto y después el texto: la corrida de la foto avisa y le deja el turno a la del texto.
  const dos = armar();
  dos.m.contacto.respondido_hasta = 2;
  const laFoto = mandaLead(dos.m, SIN_TEXTO, 5);
  const texto = mandaLead(dos.m, "te mandé la captura", 0);
  assert.equal((await dos.agente.procesar("77", laFoto)).hecho, "llegó otro mensaje");
  assert.equal(dos.m.avisos.length, 1);
  assert.equal((await dos.agente.procesar("77", texto)).hecho, "enviada");
  assert.deepEqual(dos.m.pedidos[0].turno.mensajes_del_lead, [SIN_TEXTO, "te mandé la captura"]);
  assert.equal(dos.m.avisos.length, 1, "el texto no vuelve a avisar la foto");
});

test("un turno de solo fotos que quedó abierto: la espera lo cierra sin otro aviso si el suyo ya salió, y si no salió nunca lo avisa", async () => {
  // Con su aviso ya dado (la constancia está): la espera solo cierra el turno, sin modelo ni otro aviso.
  const ya = armar();
  ya.m.contacto.respondido_hasta = 2;
  const foto = mandaLead(ya.m, SIN_TEXTO, 600);
  Object.assign(ya.m.contacto, { foto_avisada_hasta: foto, foto_avisada_en: new Date(AHORA.getTime() - 600000) });
  assert.equal((await ya.agente.procesar("77", foto, { tarde: true })).hecho, "solo foto");
  assert.equal(ya.m.avisos.length + ya.m.pedidos.length + ya.m.enviados.length, 0);
  assert.equal(ya.m.contacto.respondido_hasta, foto);
  // La corrida de la entrada se cortó antes de avisar (la base falló al leer los ajustes; entrada.js solo lo
  // registra): el turno sigue abierto y la espera, que lo toma, manda el aviso URGENTE antes de cerrarlo.
  const corte = armar();
  corte.m.contacto.respondido_hasta = 2;
  const laFoto = mandaLead(corte.m, ADJUNTO_IG, 400);
  corte.m.fallarAjustes = 1;
  await assert.rejects(corte.agente.procesar("77", laFoto), /base caída/);
  assert.equal(corte.m.avisos.length, 0);
  assert.equal(corte.m.contacto.respondido_hasta, 2, "el turno sigue abierto: lo toma la espera");
  assert.equal((await corte.agente.procesar("77", laFoto, { tarde: true })).hecho, "solo foto");
  assert.equal(corte.m.avisos.length, 1);
  assert.match(corte.m.avisos[0].titulo, /URGENTE: mandó una foto/);
  assert.equal(corte.m.contacto.respondido_hasta, laFoto);
  assert.equal(corte.m.pedidos.length + corte.m.enviados.length, 0);
});

/** Un agente con un Telegram que anda o no según `anda.si`, y que anota cada intento de aviso. */
function armarConTelegram(opciones = {}) {
  const anda = { si: false };
  const intentos = [];
  const mundo = armar({ ...opciones, avisarCon: async (titulo, campos) => { intentos.push({ titulo, campos }); return anda.si; } });
  mundo.m.contacto.respondido_hasta = 2;
  return { ...mundo, anda, intentos };
}
const urgentes = (intentos) => intentos.filter((a) => /URGENTE: mandó una foto/.test(a.titulo));

test("si el aviso de la foto no sale, el turno no se cierra ni la charla pasa: lo reintenta la espera, y sale una sola vez", async () => {
  const { agente, m, anda, intentos } = armarConTelegram();
  const foto = mandaLead(m, ADJUNTO_IG, 0);
  assert.equal((await agente.procesar("77", foto)).hecho, "foto sin avisar");
  assert.equal(urgentes(intentos).length, 1, "lo intenta al llegar: enseguida fallaría igual");
  assert.equal(m.contacto.respondido_hasta, 2, "el turno sigue abierto");
  assert.equal(m.contacto.dueno, "agente");
  assert.deepEqual(m.campos, []);
  assert.equal(m.pedidos.length + m.enviados.length, 0);
  assert.equal(m.contacto.foto_avisada_hasta, 0, "la constancia se devolvió: la foto sigue sin aviso");
  assert.deepEqual(m.salidas.map((x) => x.estado), ["aviso_fallido"], "queda anotado que no salió");
  // La espera lo vuelve a tomar: con Telegram andando, el aviso sale y el turno queda atendido.
  anda.si = true;
  m.ahora = new Date(AHORA.getTime() + 5 * 60000);
  assert.equal((await agente.procesar("77", foto, { tarde: true })).hecho, "solo foto");
  assert.equal(urgentes(intentos).length, 2);
  assert.equal(intentos.at(-1).campos.Aviso, "Mandó una foto: si es el comprobante de MercadoPago, pasale el código");
  assert.equal(m.contacto.respondido_hasta, foto);
  assert.equal(m.contacto.foto_avisada_hasta, foto);
  // Nadie la vuelve a avisar: ni el cron de los toques ni otra vuelta de la espera.
  m.ahora = new Date(AHORA.getTime() + 20 * 60000);
  assert.equal(await agente.avisarFotosPendientes(["77"]), 0);
  assert.equal((await agente.procesar("77", foto, { tarde: true })).hecho, "ya estaba atendido");
  assert.equal(urgentes(intentos).length, 2);
});

test("con la Mac apagada (sin espera), la foto cuyo aviso no salió la avisa el cron de los toques, una vez", async () => {
  const { agente, m, anda, intentos } = armarConTelegram({ responde: () => { throw transitoria("la Mac de Cande no contestó a tiempo"); } });
  const foto = mandaLead(m, SIN_TEXTO, 0);
  assert.equal((await agente.procesar("77", foto)).hecho, "foto sin avisar");
  anda.si = true;
  m.ahora = new Date(AHORA.getTime() + 10 * 60000);
  assert.equal(await agente.avisarFotosPendientes(["77"]), 1);
  assert.equal(urgentes(intentos).length, 2);
  assert.equal(intentos.at(-1).campos.Instagram, undefined, "sin usuario guardado sale sin link (con usuario, con link: ver arriba)");
  m.ahora = new Date(AHORA.getTime() + 20 * 60000);
  assert.equal(await agente.avisarFotosPendientes(["77"]), 0);
  // Cuando la Mac vuelve, la espera cierra el turno sin otro aviso y sin pedirle nada al modelo.
  assert.equal((await agente.procesar("77", foto, { tarde: true })).hecho, "solo foto");
  assert.equal(urgentes(intentos).length, 2);
  assert.equal(m.pedidos.length, 0);
  assert.equal(m.contacto.dueno, "agente");
});

test("si el aviso de una foto no salió, la que llega enseguida sí avisa (con las dos): no la tapa la que no se avisó", async () => {
  const { agente, m, anda, intentos } = armarConTelegram();
  m.contacto.respondido_hasta = mandaLead(m, "te paso el comprobante", 60); // ya contestado
  const primera = mandaLead(m, SIN_TEXTO, 30);
  m.ahora = new Date(AHORA.getTime() - 30000);
  assert.equal((await agente.procesar("77", primera)).hecho, "foto sin avisar");
  anda.si = true;
  m.ahora = AHORA;
  const segunda = mandaLead(m, SIN_TEXTO, 0);
  assert.equal((await agente.procesar("77", segunda)).hecho, "solo foto");
  assert.equal(urgentes(intentos).length, 2);
  assert.equal(intentos.at(-1).campos["Lo último que escribió"], "te paso el comprobante");
  assert.equal(m.contacto.foto_avisada_hasta, segunda, "un aviso para las dos");
});

test("dos fotos a la vez: un solo aviso; y si el de la primera no sale, la foto no se pierde: la avisa el cron", async () => {
  for (const sale of [true, false]) {
    const enVuelo = diferida();
    const intentos = [];
    const { agente, m } = armar({
      avisarCon: async (titulo) => { intentos.push(titulo); return intentos.length === 1 ? enVuelo.promesa : true; },
    });
    m.contacto.respondido_hasta = 2;
    const f1 = mandaLead(m, SIN_TEXTO, 1);
    const c1 = agente.procesar("77", f1);
    await hasta(() => intentos.length === 1);
    const f2 = mandaLead(m, SIN_TEXTO, 0);
    // La segunda ve el aviso de la primera saliendo: no manda otro, y su turno (las dos fotos) queda atendido.
    assert.equal((await agente.procesar("77", f2)).hecho, "solo foto");
    assert.equal(intentos.length, 1);
    enVuelo.resolver(sale);
    assert.equal((await c1).hecho, "llegó otro mensaje");
    assert.equal(m.contacto.respondido_hasta, f2);
    if (sale) {
      assert.equal(m.contacto.foto_avisada_hasta, f1);
      m.ahora = new Date(AHORA.getTime() + 10 * 60000);
      assert.equal(await agente.avisarFotosPendientes(["77"]), 0, "la segunda fue con ese aviso");
      assert.equal(intentos.length, 1);
    } else {
      assert.equal(m.contacto.foto_avisada_hasta || 0, 0, "se devolvió la constancia");
      m.ahora = new Date(AHORA.getTime() + 10 * 60000);
      assert.equal(await agente.avisarFotosPendientes(["77"]), 1);
      assert.equal(intentos.length, 2);
      assert.equal(m.contacto.foto_avisada_hasta, f2, "un aviso para las dos");
    }
  }
});

test("una foto que entró con el agente apagado y lo prendieron antes del cron: la espera la avisa URGENTE", async () => {
  const { agente, m } = armar({ modo: "apagado" });
  m.contacto.respondido_hasta = 2;
  const foto = mandaLead(m, SIN_TEXTO, 300);
  assert.equal((await agente.procesar("77", foto)).hecho, "apagado");
  assert.equal(m.avisos.length, 0);
  m.ajustes.modo = "auto";
  assert.equal((await agente.procesar("77", foto, { tarde: true })).hecho, "solo foto");
  assert.equal(m.avisos.length, 1);
  assert.match(m.avisos[0].titulo, /URGENTE: mandó una foto/);
  assert.equal(m.contacto.respondido_hasta, foto);
});

test("foto con texto cuyo aviso no salió: el texto se contesta y la foto la avisa después el cron de los toques", async () => {
  const { agente, m, anda, intentos } = armarConTelegram();
  mandaLead(m, "listo, ya está", 5);
  const foto = mandaLead(m, ADJUNTO_IG, 0);
  assert.equal((await agente.procesar("77", foto)).hecho, "enviada");
  assert.deepEqual(m.enviados, ["Respuesta de prueba?"]);
  assert.equal(m.contacto.respondido_hasta, foto);
  assert.equal(urgentes(intentos).length, 1);
  anda.si = true;
  m.ahora = new Date(AHORA.getTime() + 10 * 60000);
  assert.equal(await agente.avisarFotosPendientes(["77"]), 1);
  assert.equal(urgentes(intentos).length, 2);
  assert.equal(intentos.at(-1).campos["Lo último que escribió"], "listo, ya está");
  assert.equal(await agente.avisarFotosPendientes(["77"]), 0);
});

test("un link común no es una foto: no avisa y el agente contesta", async () => {
  const { agente, m } = armar();
  m.contacto.respondido_hasta = 2;
  const link = mandaLead(m, "https://github.com/usuario-de-prueba");
  assert.equal((await agente.procesar("77", link)).hecho, "enviada");
  assert.equal(m.avisos.length, 0);
  assert.deepEqual(m.enviados, ["Respuesta de prueba?"]);
});

test("una foto en una charla de Cande, o con el agente apagado, no avisa: el agente no está ahí", async () => {
  const deCande = armar({ dueno: "cande" });
  assert.equal((await deCande.agente.procesar("77", mandaLead(deCande.m, SIN_TEXTO))).hecho, "no es del agente");
  assert.equal(deCande.m.avisos.length, 0);
  const apagado = armar({ modo: "apagado" });
  assert.equal((await apagado.agente.procesar("77", mandaLead(apagado.m, SIN_TEXTO))).hecho, "apagado");
  assert.equal(apagado.m.avisos.length, 0);
});

/* ---------- menos avisos a Telegram (20/10) ---------- */
// Cande, 20/10: "la mayoría de los mensajes que me pasás por telegram son re resolvibles por vos". Lo que el agente
// puede resolver solo no le llega al toque: se reescribe lo frenado, se arreglan solos los signos, un toque no suena,
// y una respuesta que ManyChat no retiró sale por la API.

const { sinSignos } = await import("../lib/dm/frenos.js");
const { comoNota } = await import("../lib/dm/agente.js");

test("empresa: construir algo propio o preguntar por una asesoría no es señal; contratar o pedir un presupuesto sí", () => {
  const empresa = (t) => senales([t]).empresa;
  for (const t of ["estoy construyendo un sitio raro de prueba", "ando lanzando una app propia de prueba", "sigo emprendiendo con algo de prueba", "ofrecés alguna asesoría?", "hacés asesorías?", "como es el plan de asesoría que brindas?", "tu asesoría es para el CV?", "la asesoría que das incluye LinkedIn?", "no tengo presupuesto", "no tengo mucho presupuesto", "creo que el presupuesto no convenció pero aprendí mucho", "les pasé un presupuesto a un cliente y no le cerró", "gracias, pero no ando buscando devs", "ya pagué una asesoría acá en mi país", "entiendo que ofrecés algún tipo de asesoría, no?", "estuve atendiendo a mis clientes de entrenamiento", "con la cotización del dólar no me da"]) {
    assert.equal(empresa(t), false, t);
  }
  for (const t of ["estoy contratando devs", "estamos reclutando", "necesito un presupuesto", "me pasás una cotización?", "quiero una asesoría para mi equipo", "cuánto me sale cotizar una app", "quisiera un presupuesto para una app de prueba", "me podrías pasar un presupuesto?", "busco asesoría", "necesito tu asesoría para contratar devs", "tu asesoría es para empresas también? necesito armar un equipo de 3 devs", "la asesoría que ofrecés para reclutar programadores en mi empresa", "Tus asesorías son también para startups?", "le pasé el presupuesto a mi socio y quieren avanzar con 2 devs", "me pasás una cotización en pesos?", "el presupuesto no nos alcanzó para la agencia", "necesito devs para mis clientes"]) {
    assert.equal(empresa(t), true, t);
  }
});

test("quien está construyendo su portfolio puede recibir la lista: el freno de empresa ya no lo para", () => {
  const charlaDelLead = ["estoy construyendo un sitio raro de prueba", "dale"];
  pasa(revisar(salida(["La lista de prueba\nopengatehub.com/devs"]), { charlaDelLead, textosDelLead: ["dale"] }), "la lista");
});

test("preventa: no sale como urgencia, salvo que la haya traído el lead", () => {
  assert.equal(revisar(salida(["Está en preventa de prueba"])).motivo, "urgencia que no es cierta");
  pasa(revisar(salida(["Y cómo va esa preventa?"]), { charlaDelLead: ["trabajo en la preventa de una app de prueba"] }), "la preventa del lead");
});

test("spam: cuenta como pedido de baja, menos negado o hablando del spam de su mail", () => {
  const baja = (t) => senales([t]).baja;
  for (const t of ["esto es spam", "me hacés spam", "es spam", "basta de spam", "esto parece spam", "no quiero más spam", "spam"]) {
    assert.equal(baja(t), true, t);
  }
  for (const t of ["no es spam, tranqui", "ni spam ni nada", "me llegó tu mail a la carpeta de spam", "tengo el spam lleno", "me llegó al spam", "revisá en spam", "el spam del mail de prueba"]) {
    assert.equal(baja(t), false, t);
  }
});

test("los signos de apertura y el guion largo se arreglan solos antes de los frenos, sin frenar", async () => {
  assert.equal(sinSignos("¿Pregunta de prueba?"), "Pregunta de prueba?");
  assert.equal(sinSignos("¡Hola! Prueba — con guion"), "Hola! Prueba, con guion");
  assert.equal(sinSignos("— Renglón de prueba\nOtro –"), "Renglón de prueba\nOtro");
  const { agente, m } = armar({ responde: () => salida(["¿Pregunta de prueba — con guion?"]) });
  assert.equal((await agente.procesar("77", m.disparo)).hecho, "enviada");
  assert.deepEqual(m.enviados, ["Pregunta de prueba, con guion?"]);
  assert.equal(m.pedidos.length, 1);
  assert.equal(m.avisos.length, 0);
});

test("si lo que redactó pisa un freno, tiene una vuelta más: la nueva sale por la API y la charla sigue del agente", async () => {
  const { agente, m } = armar({
    envio: "campo", responde: (p, mundo) => (mundo.pedidos.length === 1 ? salida(["Mañana te escribo"]) : salida(["Pregunta de prueba?"])),
  });
  assert.equal((await agente.procesar("77", m.disparo)).hecho, "enviada");
  assert.equal(m.pedidos.length, 2);
  assert.match(m.pedidos[1].turno.contexto, /no sale \(promete avisar o escribir después\)/);
  assert.deepEqual(m.pedidos[1].turno.mensajes_del_lead, ["mensaje de prueba"]);
  assert.deepEqual(m.enviados, ["Pregunta de prueba?"], "por la API: el retiro de ManyChat ya pasó");
  assert.equal(m.salidas.at(-1).estado, "enviada");
  assert.equal(m.contacto.dueno, "agente");
  assert.equal(m.contacto.respondido_hasta, m.disparo);
  assert.equal(m.avisos.length, 0);
  assert.equal(m.tomado, null);
});

test("si la vuelta de más también se frena, la charla pasa a Cande como siempre; un toque no tiene vuelta de más", async () => {
  const { agente, m } = armar({ responde: () => salida(["Mañana te escribo"]) });
  assert.equal((await agente.procesar("77", m.disparo)).hecho, "frenada");
  assert.equal(m.pedidos.length, 2);
  assert.equal(m.enviados.length, 0);
  assert.equal(m.contacto.dueno, "cande");
  assert.equal(m.avisos.length, 1);
  const t = armarToque({ responde: () => salida(["Mañana te escribo?"]) });
  assert.equal((await toque(t.agente)).hecho, "frenada");
  assert.equal(t.m.pedidos.length, 1);
});

test("la primera respuesta frenada queda guardada con su motivo antes de la vuelta de más", async () => {
  const { agente, m } = armar({ responde: (p, mundo) => (mundo.pedidos.length === 1 ? salida(["Mañana te escribo"]) : salida(["Pregunta de prueba?"])) });
  assert.equal((await agente.procesar("77", m.disparo)).hecho, "enviada");
  assert.equal(m.salidas[0].estado, "frenada");
  assert.deepEqual(m.salidas[0].mensajes, ["Mañana te escribo"]);
  assert.match(m.salidas[0].detalle, /^promete avisar o escribir después \(tuvo otra vuelta\)$/);
});

test("con una crisis, un pedido de baja o una señal de empresa en la charla, lo frenado no tiene otra vuelta: pasa a Cande al toque", async () => {
  // Lo que es de Cande (crisis, baja, empresas) no puede terminar callado o en un mensaje sin venta que no se frena.
  for (const [caso, lead, motivo] of [
    ["crisis", "estoy con depresión, igual pasame lo tuyo", /crisis/],
    ["baja", "no me escribas más", /no le escriban/],
    ["empresa", "estoy contratando devs para mi startup de prueba", /señal de empresa/],
  ]) {
    const { agente, m } = armar({
      responde: (p, mundo) => (mundo.pedidos.length === 1 ? salida(["La lista de prueba\nopengatehub.com/devs"]) : salida([], { accion: "callar", aviso_para_cande: "NOTA: prueba" })),
    });
    m.mensajes.find((x) => x.id === m.disparo).texto = lead;
    assert.equal((await agente.procesar("77", m.disparo)).hecho, "frenada", caso);
    assert.equal(m.pedidos.length, 1, `${caso}: sin vuelta de más`);
    assert.equal(m.salidas.length, 1, caso);
    assert.match(m.salidas[0].detalle, motivo, caso);
    assert.equal(m.contacto.dueno, "cande", caso);
    assert.equal(m.avisos.length, 1, caso);
  }
});

test("\"ambas\" sin decir que contrata no frena: la lista sale y la charla sigue del agente (21/10)", async () => {
  const { agente, m } = armar({ responde: () => salida(["La lista de prueba\nopengatehub.com/devs"]) });
  m.mensajes.find((x) => x.id === m.disparo).texto = "ambas cosas de prueba";
  assert.equal((await agente.procesar("77", m.disparo)).hecho, "enviada");
  assert.equal(m.salidas[0].estado, "enviada");
  assert.notEqual(m.contacto.dueno, "cande");
});

test("un pase frenado no tiene vuelta de más: pasa como siempre", async () => {
  const { agente, m } = armar({ responde: () => salida(["Mañana te escribo"], { accion: "pasar_a_cande", aviso_para_cande: "HOY: algo de prueba" }) });
  assert.equal((await agente.procesar("77", m.disparo)).hecho, "frenada");
  assert.equal(m.pedidos.length, 1);
  assert.equal(m.contacto.dueno, "cande");
  assert.equal(m.avisos.length, 1);
});

test("si el lead escribe mientras se reescribe, la respuesta no sale: contesta la corrida de su mensaje", async () => {
  const { agente, m } = armar({
    responde: (p, mundo) => {
      if (mundo.pedidos.length === 2) mundo.entraLead("otro mensaje de prueba");
      return mundo.pedidos.length === 1 ? salida(["Mañana te escribo"]) : salida(["Pregunta de prueba?"]);
    },
  });
  assert.equal((await agente.procesar("77", m.disparo)).hecho, "llegó otro mensaje durante la generación");
  assert.equal(m.enviados.length, 0);
  assert.equal(m.contacto.dueno, "agente");
  assert.equal(m.avisos.length, 0);
});

test("un toque que el modelo quería pasar con HOY: no sale, no suena y su aviso queda como NOTA: para el resumen", async () => {
  const { agente, m } = armarToque({ responde: () => salida(["Mensaje de seguimiento?"], { accion: "pasar_a_cande", aviso_para_cande: "HOY: nota de prueba" }) });
  assert.equal((await toque(agente)).hecho, "calló");
  assert.equal(m.avisos.length, 0);
  assert.equal(m.salidas.at(-1).aviso, "NOTA: nota de prueba");
  assert.equal(m.contacto.dueno, "agente");
  assert.equal(comoNota("YA: riesgo de prueba"), "YA: riesgo de prueba", "un YA: no se toca");
});

test("una respuesta que ManyChat no retiró sale por la API si todavía corresponde; si no, la charla pasa a Cande", async () => {
  const fila = (extra = {}) => ({
    id: "77", nombre: "Lead de prueba", dueno: "agente", ultimo_lead: new Date(AHORA - HORA), salida: 1, accion: "responder",
    mensajes: ["Pregunta de prueba?"], hasta_lead: 2, escribio_despues: false, charla_cambio: false, ...extra,
  });
  const sale = armar();
  sale.m.salidas.push({ accion: "responder", estado: "vencida" });
  assert.equal(await sale.agente.rescatarVencida(fila()), "reenviada");
  assert.deepEqual(sale.m.enviados, ["Pregunta de prueba?"]);
  assert.equal(sale.m.salidas[0].estado, "enviada");
  assert.deepEqual(sale.m.mensajes.at(-1), { id: 3, quien: "agente", texto: "Pregunta de prueba?" });
  assert.equal(sale.m.contacto.respondido_hasta, 2);
  assert.equal(sale.m.avisos.length, 0);
  for (const [caso, extra, opciones] of [
    ["escribió después", { escribio_despues: true }, {}],
    ["pasó el día", { ultimo_lead: new Date(AHORA - 25 * HORA) }, {}],
    ["en sombra", {}, { modo: "sombra" }],
    ["la charla ya es de Cande", { dueno: "cande" }, {}],
    ["ManyChat no la manda", {}, { mandar: async () => ({ ok: false, error: "error de prueba" }) }],
  ]) {
    const { agente, m } = armar(opciones);
    m.salidas.push({ accion: "responder", estado: "vencida" });
    assert.equal(await agente.rescatarVencida(fila(extra)), "pasada a Cande", caso);
    assert.equal(m.contacto.dueno, "cande", caso);
    assert.equal(m.avisos.length, 1, caso);
    assert.match(m.avisos[0].campos.Aviso, /ManyChat no la vino a retirar/, caso);
  }
});

test("un error de la revisión de la Mac es de esa charla: el turno se reintenta y cuenta para su tope", () => {
  assert.deepEqual(fallaDeLaMac("revisión: sigue marcado freno del sitio: promete un plazo"), { transitorio: false, general: false, dudosa: false });
});

/* ---------- revisión del PR de los avisos (20/10): ante la duda, que suene ---------- */
// Es preferible un aviso de más a un lead de Cande sin respuesta. La vuelta de más vale solo si sale un mensaje que
// pasa todos los frenos; lo que es de Cande (plata, empresas, un aviso que ya suena) pasa al toque, como antes.

const { puedeReescribir, porQueNoSirve } = await import("../lib/dm/agente.js");
const { FRENOS_DE_CANDE, MOTIVO_EMPRESA, MOTIVO_SENAL_EMPRESA } = await import("../lib/dm/frenos.js");

/** La charla pasó a Cande al toque, sin mandarle nada al lead, con lo primero que redactó en el aviso y con HOY:. */
function pasoConLaPrimera(m, { primera, queHizo }) {
  assert.equal(m.enviados.length, 0, "al lead no le sale nada");
  assert.equal(m.contacto.dueno, "cande");
  assert.equal(m.contacto.respondido_hasta, m.disparo, "el turno queda atendido: lo tiene Cande");
  assert.equal(m.avisos.length, 1, "a Cande le suena el pase");
  assert.match(m.avisos[0].titulo, /DM URGENTE: te paso una charla$/);
  assert.ok(m.avisos[0].campos.Aviso.startsWith(`HOY: Frené lo que iba a mandar (promete avisar o escribir después): ${primera}`), m.avisos[0].campos.Aviso);
  assert.match(m.avisos[0].campos.Aviso, queHizo);
  assert.equal(m.salidas.filter((x) => x.estado === "frenada").length, 1);
  assert.deepEqual(m.salidas.at(-1).mensajes, [primera]);
  assert.match(m.salidas.at(-1).detalle, /otra vuelta/);
}

test("A: si la vuelta de más calla (con NOTA o sin aviso), pasa sin escribir o el modelo no contesta, la charla pasa al toque con lo primero", async () => {
  for (const [caso, segunda, queHizo] of [
    ["calla con NOTA", () => salida([], { accion: "callar", aviso_para_cande: "NOTA: no supe qué contestar de prueba" }), /prefirió callar/],
    ["calla sin aviso", () => salida([], { accion: "callar", aviso_para_cande: "" }), /prefirió callar/],
    ["pasa sin escribir", () => salida([], { accion: "pasar_a_cande", aviso_para_cande: "NOTA: prueba" }), /pasarte la charla sin escribirle/],
    ["el modelo no contesta", () => { throw propia("se negó de prueba"); }, /el modelo no contestó/],
  ]) {
    const { agente, m } = armar({ responde: (p, mundo) => (mundo.pedidos.length === 1 ? salida(["Mañana te escribo"]) : segunda()) });
    assert.equal((await agente.procesar("77", m.disparo)).hecho, "frenada", caso);
    assert.equal(m.pedidos.length, 2, `${caso}: tuvo su vuelta de más`);
    pasoConLaPrimera(m, { primera: "Mañana te escribo", queHizo });
  }
});

test("A: lo de la vuelta de más que también se frena, o que dice que construye o contrata, no sale: pasa con lo primero", async () => {
  for (const [caso, segunda, queHizo] of [
    ["otro freno", () => salida(["Te escribo mañana de nuevo"]), /también se frenó \(promete avisar o escribir después\)/],
    ["dice empresa", () => salida(["Contame más de lo que armás?"], { ...como("empresa") }), /construye algo o contrata/],
  ]) {
    const { agente, m } = armar({ responde: (p, mundo) => (mundo.pedidos.length === 1 ? salida(["Mañana te escribo"]) : segunda()) });
    assert.equal((await agente.procesar("77", m.disparo)).hecho, "frenada", caso);
    pasoConLaPrimera(m, { primera: "Mañana te escribo", queHizo });
  }
  assert.equal(porQueNoSirve(salida(["Pregunta de prueba?"]), { ok: true }), null, "un mensaje que pasa los frenos sirve");
});

test("B: con plata o un acceso en lo que escribió el lead, lo frenado no tiene otra vuelta: pasa a Cande al toque", async () => {
  const conPlata = [
    "quiero que me devuelvan la plata del curso de prueba", "me podés devolver lo que pagué?", "quiero un reembolso", "quiero el reintegro",
    "ya pagué", "pagué y no puedo entrar", "compré el programa ayer", "hice el pago y no me llega nada",
    "no me llegó el acceso", "no me llegó el código", "no me llegó el mail de prueba", "no puedo ingresar a la plataforma",
    "me podés hacer factura?", "me cobraron dos veces", "te transferí recién", "te mando el comprobante",
  ];
  for (const t of conPlata) assert.equal(senales([t]).pagos, true, t);
  for (const t of ["cuánto cobrás?", "voy a pagar la semana que viene", "me llegó al spam", "puedo entrar a la página del video?", "sigo con la búsqueda de prueba"]) {
    assert.equal(senales([t]).pagos, false, t);
  }
  for (const lead of ["quiero que me devuelvan la plata del curso de prueba", "pagué y no puedo entrar", "compré y no me llegó el acceso"]) {
    const { agente, m } = armar({
      responde: (p, mundo) => (mundo.pedidos.length === 1 ? salida(["Dale, te hago el reembolso"]) : salida(["Dale, ahora lo veo?"])),
    });
    m.mensajes.find((x) => x.id === m.disparo).texto = lead;
    assert.equal((await agente.procesar("77", m.disparo)).hecho, "frenada", lead);
    assert.equal(m.pedidos.length, 1, `${lead}: sin vuelta de más`);
    assert.equal(m.enviados.length, 0, lead);
    assert.equal(m.contacto.dueno, "cande", lead);
    assert.equal(m.avisos.length, 1, lead);
    assert.match(m.avisos[0].campos.Aviso, /^Frené lo que iba a mandar \(regalo, devolución o transferencia\): Dale, te hago el reembolso$/, lead);
  }
});

test("F: si el modelo dice que construye o contrata, ahora o en un turno anterior, lo frenado no tiene otra vuelta", async () => {
  const estEmp = { ...estadoDev, quien: "empresa" };
  const ahora = armar({
    responde: (p, mundo) => (mundo.pedidos.length === 1 ? salida(["La lista de prueba\nopengatehub.com/devs"], { estado: estEmp }) : salida(["Contame más de lo que armás?"], { estado: estEmp })),
  });
  ahora.m.mensajes.find((x) => x.id === ahora.m.disparo).texto = "tengo un equipo chico y quiero ver opciones de prueba";
  assert.equal((await ahora.agente.procesar("77", ahora.m.disparo)).hecho, "frenada");
  assert.equal(ahora.m.pedidos.length, 1);
  assert.equal(ahora.m.enviados.length, 0);
  assert.equal(ahora.m.contacto.dueno, "cande");
  assert.equal(ahora.m.avisos.length, 1);
  assert.match(ahora.m.salidas[0].detalle, new RegExp(`^${MOTIVO_EMPRESA}$`));

  const antes = armar({
    responde: (p, mundo) => (mundo.pedidos.length === 1 ? salida(["Sale 27 dólares"]) : salida(["Qué estás armando?"])),
  });
  antes.m.contacto.estado = { ...estadoDev, quien: "construye" };
  assert.equal((await antes.agente.procesar("77", antes.m.disparo)).hecho, "frenada");
  assert.equal(antes.m.pedidos.length, 1);
  assert.equal(antes.m.enviados.length, 0);
  assert.equal(antes.m.contacto.dueno, "cande");

  // Lo mismo si lo frenó el freno de empresa, o si su aviso ya suena: es de Cande.
  const dev = salida(["Mañana te escribo"]);
  assert.equal(puedeReescribir(dev, ["mensaje de prueba"]), true);
  for (const motivo of [MOTIVO_EMPRESA, MOTIVO_SENAL_EMPRESA]) {
    assert.ok(FRENOS_DE_CANDE.has(motivo));
    assert.equal(puedeReescribir(dev, ["mensaje de prueba"], { motivo }), false, motivo);
  }
  assert.equal(puedeReescribir(dev, ["mensaje de prueba"], { estadoPrevio: { quien: "empresa" } }), false);
  // Quien busca devs dicho de otra forma: no frena nada, pero lo frenado no tiene otra vuelta.
  for (const t of ["busco devs para mi equipo de prueba", "necesito 2 devs react", "tenemos una software house de prueba"]) {
    assert.equal(senales([t]).empresa, false, `${t}: los frenos no cambian`);
    assert.equal(puedeReescribir(dev, [t]), false, t);
  }
  assert.equal(puedeReescribir(salida(["Mañana te escribo"], { aviso_para_cande: "HOY: algo de prueba" }), ["mensaje de prueba"]), false);
  assert.equal(puedeReescribir(salida(["Mañana te escribo"], { aviso_para_cande: "ya: algo de prueba" }), ["mensaje de prueba"]), false);
});

test("un aviso HOY: o YA: suena aunque venga en minúsculas o con espacios: es la misma definición que deja afuera del resumen", async () => {
  for (const aviso of ["hoy: preguntó si es un bot", " HOY : preguntó si es un bot", "Ya: preguntó si es un bot"]) {
    const { agente, m } = armar({ responde: () => salida(["Pregunta de prueba?"], { aviso_para_cande: aviso }) });
    assert.equal((await agente.procesar("77", m.disparo)).hecho, "enviada", aviso);
    assert.equal(m.avisos.length, 1, `${aviso}: tiene que sonar`);
    assert.match(m.avisos[0].titulo, /DM URGENTE: aviso del agente$/, aviso);
  }
  assert.equal(comoNota(" hoy : algo de prueba"), "NOTA: algo de prueba");
});

test("una respuesta vencida no sale por la API si se escribió en la charla después o si Cande está en la charla desde Instagram", async () => {
  const fila = (extra = {}) => ({
    id: "77", nombre: "Lead de prueba", dueno: "agente", ultimo_lead: new Date(AHORA - HORA), salida: 1, accion: "responder",
    mensajes: ["Pregunta de prueba?"], hasta_lead: 2, escribio_despues: false, charla_cambio: false, ...extra,
  });
  for (const [caso, extra, porIg] of [
    ["se escribió en la charla", { charla_cambio: true }, null],
    ["no se sabe si cambió", { charla_cambio: undefined }, null],
    ["Cande escribió -- en Instagram", {}, "escribiste -- en Instagram"],
    ["Cande la sigue", {}, "la seguís en Instagram"],
  ]) {
    const vistas = [];
    const instagram = { conApi: true, porQueSale: async (c) => { vistas.push(c.id); return porIg; }, sacar: async () => {} };
    const { agente, m } = armar({ instagram });
    m.ajustes.instagram = true;
    m.salidas.push({ accion: "responder", estado: "vencida" });
    assert.equal(await agente.rescatarVencida(fila(extra)), "pasada a Cande", caso);
    assert.equal(m.enviados.length, 0, caso);
    assert.equal(m.salidas[0].estado, "vencida", `${caso}: no figura enviada`);
    assert.equal(m.contacto.dueno, "cande", caso);
    assert.equal(m.avisos.length, 1, caso);
    if (porIg) assert.match(m.avisos[0].campos.Motivo, new RegExp(porIg), caso);
  }
  // Sin nada de eso, sale como antes.
  const instagram = { conApi: true, porQueSale: async () => null, sacar: async () => {} };
  const sale = armar({ instagram });
  sale.m.ajustes.instagram = true;
  sale.m.salidas.push({ accion: "responder", estado: "vencida" });
  assert.equal(await sale.agente.rescatarVencida(fila()), "reenviada");
  assert.deepEqual(sale.m.enviados, ["Pregunta de prueba?"]);
});

/* ---------- charlas retomadas (20/10): lo que Cande escribe a mano no saca al agente (lib/dm/instagram.js) ---------- */

const A_MANO = "Texto de prueba que Cande escribió a mano";

/** Lo que hace la mirada en una charla retomada: anota lo de Cande y deja contestado lo del lead hasta `hasta`. */
const anotaACande = (mundo, hasta) => () => {
  const { m } = mundo();
  m.mensajes.push({ id: m.mensajes.length + 1, quien: "cande", texto: A_MANO });
  if (hasta !== undefined) m.contacto.respondido_hasta = hasta;
  return null;
};

test("charla retomada: si la mirada anota que Cande ya contestó lo del lead, el agente no le contesta encima ni le pide nada al modelo", async () => {
  let mundo;
  const ig = reglasFalsas([anotaACande(() => mundo, 2), null], () => mundo.m, { retomada: true });
  mundo = armar({ instagram: ig });
  mundo.m.ajustes.instagram = true;
  const r = await mundo.agente.procesar("77", mundo.m.disparo);
  assert.equal(r.hecho, "ya estaba atendido");
  assert.equal(mundo.m.pedidos.length, 0);
  assert.equal(mundo.m.enviados.length, 0);
  assert.equal(mundo.m.contacto.dueno, "agente");
  assert.deepEqual(ig.sacadas, []);
  assert.equal(mundo.m.tomado, null);
});

test("charla retomada: si el lead le contestó a lo que Cande escribió a mano, contesta el agente con lo de ella en el historial", async () => {
  let mundo;
  const ig = reglasFalsas([anotaACande(() => mundo, 2), null], () => mundo.m, { retomada: true });
  mundo = armar({ instagram: ig });
  mundo.m.ajustes.instagram = true;
  // El lead le contestó a Cande; la mirada anota lo de ella después (lo vio recién), con el turno contestado hasta lo de antes.
  const id = mundo.m.entraLead("respuesta de prueba del lead");
  const r = await mundo.agente.procesar("77", id);
  assert.equal(r.hecho, "enviada");
  const { turno } = mundo.m.pedidos[0];
  assert.deepEqual(turno.mensajes_del_lead, ["respuesta de prueba del lead"]);
  assert.deepEqual(turno.historial.at(-1), { quien: "cande", texto: A_MANO });
  assert.equal(mundo.m.contacto.dueno, "agente");
  assert.equal(mundo.m.contacto.respondido_hasta, id);
});

test("charla retomada: un toque no sale detrás de lo que Cande acaba de escribir a mano", async () => {
  let mundo;
  const ig = reglasFalsas([anotaACande(() => mundo), null], () => mundo.m, { retomada: true });
  mundo = armarToque({ instagram: ig });
  mundo.m.ajustes.instagram = true;
  const r = await toque(mundo.agente);
  assert.equal(r.hecho, "le escribió Cande");
  assert.equal(mundo.m.pedidos.length, 0);
  assert.equal(mundo.m.enviados.length, 0);
  assert.equal(mundo.m.contacto.dueno, "agente");
});

test("charla retomada: lo de Cande que se anotó tarde pero lo escribió antes que el lead no hace que el reintento tarde le pase la charla", async () => {
  const minAntes = (min) => new Date(AHORA.getTime() - min * 60000);
  const armarTarde = (candeHace) => {
    const w = armar({ envio: "campo", ultimoLeadHace: 2, instagram: { retomada: async () => true } });
    w.m.mensajes[1].creado = minAntes(180);
    w.m.contacto.respondido_hasta = 2;
    w.m.mensajes.push({ id: 3, quien: "lead", texto: "respuesta de prueba del lead", creado: minAntes(60) });
    w.m.mensajes.push({ id: 4, quien: "cande", texto: A_MANO, creado: minAntes(candeHace) });
    return w;
  };
  const antes = armarTarde(90);
  const r = await antes.agente.procesar("77", 3, { tarde: true });
  assert.equal(r.hecho, "enviada");
  assert.deepEqual(antes.m.pedidos[0].turno.mensajes_del_lead, ["respuesta de prueba del lead"]);
  assert.equal(antes.m.contacto.dueno, "agente");
  // Si escribió después de lo del lead, como siempre: está metida ahí y la charla pasa a ella.
  const despues = armarTarde(30);
  assert.equal((await despues.agente.procesar("77", 3, { tarde: true })).hecho, "pasada a Cande");
  assert.equal(despues.m.pedidos.length, 0);
});

/* ---------- revisión de las charlas retomadas (21/10) ---------- */

const { NO_AHORA } = await import("../lib/dm/instagram.js");
const { MIRAR_DE_NUEVO } = await import("../lib/dm/agente.js");
const aLos = (min) => new Date(AHORA.getTime() + min * 60000);

/** La fila de una respuesta que ManyChat no retiró y contestaba el mensaje 2 del lead (escrito hace 10 minutos). */
const vencida = (extra = {}) => ({
  id: "77", nombre: "Lead de prueba", dueno: "agente", ultimo_lead: aLos(-10), salida: 1, accion: "responder",
  mensajes: ["Pregunta de prueba?"], hasta_lead: 2, escribio_despues: false, charla_cambio: false, ...extra,
});

/** Un mundo con esa respuesta vencida y una mirada de Instagram de mentira (`mirada(m)`), en una charla retomada o no. */
function armarRescate({ mirada = async () => null, retomada = true } = {}) {
  const vistas = [];
  const instagram = { conApi: true, retomada: async () => retomada, sacar: async () => {} };
  const w = armar({ instagram });
  instagram.porQueSale = async (c) => { vistas.push(c.id); return mirada(w.m); };
  w.m.ajustes.instagram = true;
  w.m.mensajes[1].creado = aLos(-10);
  w.m.salidas.push({ accion: "responder", estado: "vencida" });
  return { ...w, vistas };
}
/** Lo que Cande escribió a mano, anotado como lo anota la base (con la hora de Instagram). */
const escribioCande = (m, min) => m.mensajes.push({ id: m.mensajes.length + 1, quien: "cande", texto: A_MANO, creado: aLos(min) });

test("rescate en una charla retomada: si la mirada anota que Cande le escribió después del lead, la respuesta vencida no sale y la charla sigue del agente sin aviso", async () => {
  const w = armarRescate({ mirada: async (m) => { escribioCande(m, -2); return null; } });
  assert.equal(await w.agente.rescatarVencida(vencida()), "descartada");
  assert.equal(w.vistas.length, 1, "miró Instagram");
  assert.deepEqual(w.m.enviados, []);
  assert.equal(w.m.salidas[0].estado, "descartada");
  assert.match(w.m.salidas[0].detalle, /Cande le escribió a mano/);
  assert.equal(w.m.contacto.dueno, "agente");
  assert.equal(w.m.avisos.length, 0);
  assert.deepEqual(w.m.mensajes.map((x) => x.quien), ["agente", "lead", "cande"], "lo vencido no queda anotado como dicho");
  // Si la charla no está retomada (lo de Cande lo anotó ella desde Telegram), como en main: la mirada no la saca y la
  // respuesta sale (revisión del 21/10, tercera vuelta: en una charla sin marca el rescate no mira el historial).
  const sin = armarRescate({ retomada: false, mirada: async (m) => { escribioCande(m, -2); return null; } });
  assert.equal(await sin.agente.rescatarVencida(vencida()), "reenviada");
  assert.deepEqual(sin.m.enviados, ["Pregunta de prueba?"]);
  assert.equal(sin.m.contacto.dueno, "agente");
  assert.equal(sin.m.avisos.length, 0);
  // Lo de Cande de antes del mensaje del lead (el lead le contestó a eso) no frena la respuesta.
  const antes = armarRescate({ mirada: async (m) => { escribioCande(m, -20); return null; } });
  assert.equal(await antes.agente.rescatarVencida(vencida()), "reenviada");
  assert.deepEqual(antes.m.enviados, ["Pregunta de prueba?"]);
});

test("rescate en una charla retomada: si lo que cambió después de la respuesta es solo lo que Cande escribió a mano (ya lo anotó el cron), se descarta sin pasarle la charla", async () => {
  const w = armarRescate();
  escribioCande(w.m, -1);
  assert.equal(await w.agente.rescatarVencida(vencida({ charla_cambio: true })), "descartada");
  assert.deepEqual(w.m.enviados, []);
  assert.equal(w.m.salidas[0].estado, "descartada");
  assert.equal(w.m.contacto.dueno, "agente");
  assert.equal(w.m.avisos.length, 0);
  // Si además hay otra cosa (una nota), o la charla no está retomada, pasa a Cande como siempre.
  for (const [caso, retomada, extra] of [["con una nota", true, true], ["sin la marca", false, false]]) {
    const x = armarRescate({ retomada });
    escribioCande(x.m, -1);
    if (extra) x.m.mensajes.push({ id: x.m.mensajes.length + 1, quien: "sistema", texto: "nota de prueba", creado: aLos(-1) });
    assert.equal(await x.agente.rescatarVencida(vencida({ charla_cambio: true })), "pasada a Cande", caso);
    assert.equal(x.m.contacto.dueno, "cande", caso);
    assert.equal(x.m.avisos.length, 1, caso);
  }
});

test("rescate: si la mirada no pudo anotar lo que Cande escribió a mano (NO_AHORA), la respuesta no sale ni pasa la charla: queda el turno abierto para la espera", async () => {
  const w = armarRescate({ mirada: async () => NO_AHORA });
  assert.equal(await w.agente.rescatarVencida(vencida()), "descartada");
  assert.deepEqual(w.m.enviados, []);
  assert.equal(w.m.salidas[0].estado, "descartada");
  assert.equal(w.m.contacto.dueno, "agente");
  assert.equal(w.m.contacto.respondido_hasta, 0, "el turno sigue abierto");
  assert.equal(w.m.avisos.length, 0);
});

test("si la mirada no pudo anotar lo que Cande escribió a mano (NO_AHORA), el agente no le contesta encima ni sale de la charla: el turno queda abierto", async () => {
  let a;
  const igA = reglasFalsas([NO_AHORA], () => a.m, { retomada: true });
  a = armar({ instagram: igA });
  a.m.ajustes.instagram = true;
  const r = await a.agente.procesar("77", a.m.disparo);
  assert.equal(r.hecho, MIRAR_DE_NUEVO);
  assert.equal(a.m.pedidos.length, 0);
  assert.equal(a.m.enviados.length, 0);
  assert.deepEqual(igA.sacadas, []);
  assert.equal(a.m.contacto.dueno, "agente");
  assert.equal(a.m.contacto.respondido_hasta, 0, "el turno sigue abierto: lo mira la espera");
  assert.equal(a.m.avisos.length, 0);
  assert.equal(a.m.tomado, null);
  // Un toque tampoco sale.
  let t;
  const igT = reglasFalsas([NO_AHORA], () => t.m, { retomada: true });
  t = armarToque({ instagram: igT });
  t.m.ajustes.instagram = true;
  assert.equal((await toque(t.agente)).hecho, MIRAR_DE_NUEVO);
  assert.equal(t.m.pedidos.length, 0);
  assert.equal(t.m.enviados.length, 0);
  // En la mirada de antes de mandar: lo redactado no sale y el turno queda abierto.
  let d;
  const igD = reglasFalsas([null, NO_AHORA], () => d.m, { retomada: true });
  d = armar({ instagram: igD });
  d.m.ajustes.instagram = true;
  assert.equal((await d.agente.procesar("77", d.m.disparo)).hecho, MIRAR_DE_NUEVO);
  assert.equal(d.m.pedidos.length, 1);
  assert.equal(d.m.enviados.length, 0);
  assert.equal(d.m.salidas.at(-1).estado, "descartada");
  assert.equal(d.m.contacto.respondido_hasta, 0);
  assert.deepEqual(igD.sacadas, []);
});

test("charla retomada: lo que Cande escribió antes que el lead y se anotó después, el modelo lo ve en el orden en que se escribió, también en el turno siguiente", async () => {
  let mundo;
  // La mirada del primer turno anota lo de Cande (escrito antes de la respuesta del lead, visto recién ahora).
  const ig = reglasFalsas([() => { escribioCande(mundo.m, -2); mundo.m.contacto.respondido_hasta = 2; return null; }, null], () => mundo.m, { retomada: true });
  mundo = armar({ instagram: ig });
  mundo.m.ajustes.instagram = true;
  mundo.m.mensajes[0].creado = aLos(-120);
  mundo.m.mensajes[1].creado = aLos(-60);
  mundo.m.contacto.respondido_hasta = 2;
  const l1 = mundo.m.entraLead("respuesta de prueba a lo de Cande");
  mundo.m.mensajes.at(-1).creado = aLos(-1);
  assert.equal((await mundo.agente.procesar("77", l1)).hecho, "enviada");
  assert.deepEqual(mundo.m.pedidos[0].turno.historial.map((x) => x.texto), [AVISO, "mensaje de prueba", A_MANO]);
  assert.deepEqual(mundo.m.pedidos[0].turno.mensajes_del_lead, ["respuesta de prueba a lo de Cande"]);
  mundo.m.mensajes.at(-1).creado = AHORA; // lo que contestó el agente
  const l2 = mundo.m.entraLead("otro mensaje de prueba del lead");
  mundo.m.mensajes.at(-1).creado = aLos(1);
  assert.equal((await mundo.agente.procesar("77", l2)).hecho, "enviada");
  assert.deepEqual(mundo.m.pedidos[1].turno.historial.map((x) => x.texto), [
    AVISO, "mensaje de prueba", A_MANO, "respuesta de prueba a lo de Cande", "Respuesta de prueba?",
  ]);
  assert.deepEqual(mundo.m.pedidos[1].turno.mensajes_del_lead, ["otro mensaje de prueba del lead"]);
  assert.deepEqual(mundo.m.mensajes.map((x) => x.quien), ["agente", "lead", "lead", "cande", "agente", "lead", "agente"], "en la base no se toca nada");
});

/* ---------- segunda revisión de las charlas retomadas (21/10) ---------- */

test("charla retomada: lo de Cande que se anotó tarde pero lo escribió antes que el lead no frena el seguimiento que el agente agendó para esa respuesta", async () => {
  const hora = (h) => new Date(AHORA.getTime() - h * HORA);
  const armarCon = (candeHace) => {
    const w = armarToque({ instagram: { retomada: async () => true } });
    w.m.mensajes[0].creado = hora(7);
    w.m.mensajes[1].creado = hora(6); // la respuesta del lead, que el agente atendió callando con un seguimiento
    // Lo de Cande lo vio recién la mirada: quedó con un id más alto, con la hora en que lo escribió.
    w.m.mensajes.push({ id: 3, quien: "cande", texto: A_MANO, creado: hora(candeHace) });
    return w;
  };
  const antes = armarCon(6.1);
  assert.equal((await toque(antes.agente)).hecho, "enviada");
  assert.deepEqual(antes.m.enviados, ["Mensaje de seguimiento?"]);
  // Si lo de ella es lo último que se escribió, el toque no sale detrás.
  const despues = armarCon(1);
  assert.equal((await toque(despues.agente)).hecho, "le escribió Cande");
  assert.deepEqual(despues.m.enviados, []);
});

test("rescate en una charla retomada: después de la mirada la marca ya está usada y la charla sigue contando como retomada", async () => {
  // Las reglas de verdad: retomada mira que la marca esté vigente, aunque ya se haya usado (lib/dm/instagram.js).
  const { crearReglasInstagram } = await import("../lib/dm/instagram.js");
  let marcas = { 77: { hasta: AHORA.getTime() + 86400000 } };
  const reglas = crearReglasInstagram({ base: { leerConfig: async () => marcas }, manychat: {}, avisar: async () => true, reloj: () => AHORA });
  const instagram = { conApi: true, retomada: reglas.retomada, sacar: async () => {} };
  const w = armar({ instagram });
  // La mirada anota lo que Cande escribió después del lead, y con eso la marca queda usada (base.anotarCandeDesdeIg).
  instagram.porQueSale = async () => {
    escribioCande(w.m, -2);
    marcas = { 77: { ...marcas[77], usada: aLos(-2).getTime() } };
    return null;
  };
  w.m.ajustes.instagram = true;
  w.m.mensajes[1].creado = aLos(-10);
  w.m.salidas.push({ accion: "responder", estado: "vencida" });
  assert.equal(await w.agente.rescatarVencida(vencida()), "descartada");
  assert.deepEqual(w.m.enviados, []);
  assert.equal(w.m.contacto.dueno, "agente");
  assert.equal(w.m.avisos.length, 0);
});

/* ---------- tercera revisión de las charlas retomadas (21/10): sin la marca, todo como en main ---------- */

// Las pruebas que empiezan con "como en main" pasan también con el código de origin/main (se corrieron contra una copia
// de origin/main con este mismo archivo): en una charla sin la marca de retomada, o si la base no deja leer la marca,
// el agente hace exactamente lo mismo que antes de las charlas retomadas, avisos incluidos.

/** Las tres formas de que una charla no cuente como retomada: sin la marca, sin poder leerla, o sin las reglas de las retomadas. */
const SIN_MARCA = [
  ["sin la marca", { retomada: false }],
  ["sin poder leer la marca", { retomada: "falla" }],
  ["sin las reglas de las retomadas", {}],
];
/** Las reglas de Instagram de mentira de una charla sin la marca (ver SIN_MARCA), con la mirada que se diga. */
const reglasSinMarca = ({ retomada }, mirada = async () => null) => ({
  conApi: true, porQueSale: mirada, sacar: async () => {},
  ...(retomada === undefined ? {} : { retomada: async () => { if (retomada === "falla") throw new Error("base caída de prueba"); return retomada; } }),
});

test("como en main: rescate de una respuesta vencida en una charla sin la marca, con un mensaje de Cande (Telegram) después del lead: sale por la API", async () => {
  for (const [caso, opciones] of SIN_MARCA) {
    for (const fallaHistorial of [false, true]) {
      const w = armar({ instagram: reglasSinMarca(opciones) });
      w.m.ajustes.instagram = true;
      w.m.mensajes[1].creado = aLos(-10);
      w.m.salidas.push({ accion: "responder", estado: "vencida" });
      // Lo que Cande contestó desde Telegram a un aviso anterior, mientras se generaba esta respuesta.
      escribioCande(w.m, -2);
      w.m.fallaHistorial = fallaHistorial;
      const que = `${caso}${fallaHistorial ? ", sin poder leer la charla" : ""}`;
      assert.equal(await w.agente.rescatarVencida(vencida()), "reenviada", que);
      assert.deepEqual(w.m.enviados, ["Pregunta de prueba?"], que);
      assert.equal(w.m.contacto.dueno, "agente", que);
      assert.equal(w.m.avisos.length, 0, que);
    }
  }
});

test("como en main: en una respuesta tarde de una charla sin la marca, si Cande contesta por Telegram mientras se mira Instagram, la charla pasa a ella con el aviso", async () => {
  for (const [caso, opciones] of SIN_MARCA) {
    let w;
    // Mientras corre la mirada, un /textual de Cande: queda su mensaje y el turno contestado hasta lo del lead.
    const mirada = async () => {
      w.m.mensajes.push({ id: w.m.mensajes.length + 1, quien: "cande", texto: A_MANO });
      w.m.contacto.respondido_hasta = 2;
      return null;
    };
    w = armar({ instagram: reglasSinMarca(opciones, mirada), ultimoLeadHace: 2 });
    w.m.ajustes.instagram = true;
    const r = await w.agente.procesar("77", 2, { tarde: true });
    assert.equal(r.hecho, "pasada a Cande", caso);
    assert.equal(w.m.avisos.length, 1, caso);
    assert.match(w.m.avisos[0].campos.Aviso, /le escribiste mientras el agente no podía contestar/, caso);
    assert.equal(w.m.pedidos.length, 0, caso);
  }
});

test("como en main: un toque en una charla sin la marca sale aunque lo último de la charla sea de Cande", async () => {
  for (const [caso, opciones] of SIN_MARCA) {
    const w = armarToque({ instagram: reglasSinMarca(opciones) });
    w.m.ajustes.instagram = true;
    w.m.mensajes.push({ id: 3, quien: "cande", texto: A_MANO });
    assert.equal((await toque(w.agente)).hecho, "enviada", caso);
    assert.deepEqual(w.m.enviados, ["Mensaje de seguimiento?"], caso);
  }
});

test("como en main: en una charla sin la marca el modelo lee la charla en el orden de la base, aunque las horas digan otra cosa", async () => {
  for (const [caso, opciones] of SIN_MARCA) {
    const w = armar({ instagram: reglasSinMarca(opciones) });
    w.m.ajustes.instagram = true;
    w.m.mensajes[0].creado = aLos(-120);
    w.m.mensajes[1].creado = aLos(-60);
    // La respuesta del agente y un mensaje del lead que guardó tarde la red de la bandeja, con su hora de Instagram.
    w.m.mensajes.push({ id: 3, quien: "agente", texto: "Respuesta de prueba del agente", creado: aLos(-30) });
    w.m.mensajes.push({ id: 4, quien: "lead", texto: "mensaje de prueba que guardó la red", creado: aLos(-45) });
    w.m.contacto.respondido_hasta = 4;
    const id = w.m.entraLead("mensaje nuevo de prueba");
    w.m.mensajes.at(-1).creado = aLos(-1);
    assert.equal((await w.agente.procesar("77", id)).hecho, "enviada", caso);
    assert.deepEqual(w.m.pedidos[0].turno.historial.map((x) => x.texto),
      [AVISO, "mensaje de prueba", "Respuesta de prueba del agente", "mensaje de prueba que guardó la red"], caso);
  }
});

test("como en main: en una respuesta tarde de una charla sin la marca, lo de Cande anotado después del lead pasa la charla a ella aunque su hora sea anterior", async () => {
  for (const [caso, opciones] of SIN_MARCA) {
    const minAntes = (min) => new Date(AHORA.getTime() - min * 60000);
    const w = armar({ envio: "campo", ultimoLeadHace: 2, instagram: reglasSinMarca(opciones) });
    w.m.mensajes[1].creado = minAntes(180);
    w.m.contacto.respondido_hasta = 2;
    w.m.mensajes.push({ id: 3, quien: "lead", texto: "respuesta de prueba del lead", creado: minAntes(60) });
    w.m.mensajes.push({ id: 4, quien: "cande", texto: A_MANO, creado: minAntes(90) });
    assert.equal((await w.agente.procesar("77", 3, { tarde: true })).hecho, "pasada a Cande", caso);
    assert.equal(w.m.pedidos.length, 0, caso);
  }
});

test("charla retomada: si la primera mirada no vio lo que pegó Cande y la de antes de mandar lo anota, lo redactado sin eso no sale y el turno se rehace con lo suyo", async () => {
  // Cande pegó hace 2 minutos y el lead le contestó hace 1. La primera mirada no lo vio (Instagram tardó o falló); la
  // de antes de mandar lo anota con la hora de Instagram, sin dar por contestado lo del lead (es posterior).
  const armarCon = (retomada) => {
    let w;
    const anota = () => { escribioCande(w.m, -2); return null; };
    const ig = reglasFalsas([null, anota, null], () => w.m, { retomada });
    w = armar({ instagram: ig, ultimoLeadHace: 0 });
    w.m.ajustes.instagram = true;
    w.m.mensajes[0].creado = aLos(-120);
    w.m.mensajes[1].creado = aLos(-1);
    return { ...w, ig };
  };
  const w = armarCon(true);
  const r = await w.agente.procesar("77", 2);
  assert.equal(r.hecho, MIRAR_DE_NUEVO);
  assert.equal(w.m.pedidos.length, 1, "se redactó sin lo de ella");
  assert.deepEqual(w.m.enviados, [], "y no sale");
  assert.equal(w.m.salidas.at(-1).estado, "descartada");
  assert.match(w.m.salidas.at(-1).detalle, /lo que Cande escribió a mano/);
  assert.equal(w.m.contacto.respondido_hasta, 0, "el turno queda abierto");
  assert.equal(w.m.contacto.dueno, "agente");
  assert.equal(w.m.avisos.length, 0);
  assert.equal(w.m.tomado, null);
  // La espera lo rehace: el modelo lo lee con lo de ella.
  const otra = await w.agente.procesar("77", 2, { tarde: true });
  assert.equal(otra.hecho, "enviada");
  assert.deepEqual(w.m.pedidos[1].turno.historial.map((x) => x.texto), [AVISO, A_MANO]);
  assert.deepEqual(w.m.pedidos[1].turno.mensajes_del_lead, ["mensaje de prueba"]);
  assert.deepEqual(w.m.enviados, ["Respuesta de prueba?"]);
  // Si al principio la base no dejó leer la marca, se pregunta de nuevo antes de mandar.
  const tarde = armarCon(true);
  let veces = 0;
  tarde.ig.retomada = async () => { if (veces++ === 0) throw new Error("base caída de prueba"); return true; };
  assert.equal((await tarde.agente.procesar("77", 2)).hecho, MIRAR_DE_NUEVO);
  assert.deepEqual(tarde.m.enviados, []);
  // Sin la marca, como en main: sale lo redactado.
  const sin = armarCon(false);
  assert.equal((await sin.agente.procesar("77", 2)).hecho, "enviada");
  assert.deepEqual(sin.m.enviados, ["Respuesta de prueba?"]);
});

test("a una empresa el agente le cierra la reunión con la agenda de Cande; a un dev, nunca (21/10)", () => {
  const reunion = ["Genial! Lo vemos en una llamada corta de prueba?", "Te dejo acá para agendar\nstrategy.opengatehub.com"];
  pasa(revisar(salida(reunion, como("empresa"))), "empresa, respondiendo");
  pasa(revisar(salida(reunion, { ...como("empresa"), accion: "pasar_a_cande", aviso_para_cande: "HOY: prueba" })), "empresa, al pasar");
  pasa(revisar(salida(reunion), { charlaDelLead: ["tengo una agencia de prueba"] }), "señal de empresa del lead");
  pasa(revisar(salida(["Me dejás tu WhatsApp para coordinar la prueba?"], como("empresa"))), "pedir el WhatsApp");
  frena(revisar(salida(reunion)), "a un dev");
  frena(revisar(salida([...reunion, "Y te dejo la lista\nopengatehub.com/devs"], como("empresa"))), "con la lista de devs");
  frena(revisar(salida(["Te cuento del programa y agendamos una llamada"], como("empresa"))), "con el programa");
});

/* ---------- la página del video, del lado de la charla (lib/dm/pagina.js, 22/10) ---------- */

test("el país del formulario va en el contexto, solo el nombre del país", async () => {
  const { agente, m } = armar();
  m.formulario = { pais: "Argentina, Córdoba", compro: false };
  assert.equal((await agente.procesar("77", m.disparo)).hecho, "enviada");
  assert.match(m.pedidos[0].turno.contexto, /En el formulario puso que es de Argentina\./);
  const otro = armar();
  otro.m.formulario = { pais: "Madrid", compro: false };
  await otro.agente.procesar("77", otro.m.disparo);
  assert.match(otro.m.pedidos[0].turno.contexto, /puso que es de España\./);
  assert.doesNotMatch(otro.m.pedidos[0].turno.contexto, /Argentina/);
});

test("a quien ya tiene el programa no le sale un toque ni un turno inmediato, y si escribe el agente lo sabe", async () => {
  const { agente, m } = armarToque();
  m.formulario = { pais: "Argentina", compro: true };
  m.contacto.proximo_toque = new Date(AHORA);
  assert.equal((await toque(agente)).hecho, "ya tiene el programa");
  assert.equal(m.pedidos.length, 0);
  assert.equal(m.contacto.proximo_toque, null);
  assert.equal((await agente.procesar("77", null, { evento: "control", indicacion: "prueba" })).hecho, "ya tiene el programa");
  const escribe = armar();
  escribe.m.formulario = { pais: null, compro: true };
  assert.equal((await escribe.agente.procesar("77", escribe.m.disparo)).hecho, "enviada");
  assert.match(escribe.m.pedidos[0].turno.contexto, /Ya tiene el programa/);
});

test("al salir el link del formulario con el id de la charla se agenda el turno del link; si ya lo llenó, no", async () => {
  // El doble de la base no mira el id: con uno que vale (el "77" de las demás pruebas es corto), el link sale con él.
  const ID_LARGO = "1234567";
  const { agente, m } = armar({ responde: () => salida(["Dale te dejo el formulario de prueba\nopengatehub.com/devs"]) });
  assert.equal((await agente.procesar(ID_LARGO, m.disparo)).hecho, "enviada");
  assert.match(m.enviados.join(" "), /ig=1234567/);
  assert.deepEqual(m.calientes, [["link", 90]]);
  const lleno = armar({ responde: () => salida(["Te dejo el link de nuevo de prueba\nopengatehub.com/devs"]) });
  lleno.m.mensajes.splice(1, 0, { id: 99, quien: "sistema", texto: NOTA_FORMULARIO });
  await lleno.agente.procesar(ID_LARGO, lleno.m.disparo);
  assert.deepEqual(lleno.m.calientes, []);
  const sinLink = armar();
  await sinLink.agente.procesar("77", sinLink.m.disparo);
  assert.deepEqual(sinLink.m.calientes, []);
});

test("si el lead promete llenar el formulario ya, a la hora va el de unaa pudiste: se agenda calle o conteste el agente (24/10)", async () => {
  // 24/10, Cande: "poné que a los minutos diga: de unaa, pudiste?", "diría una hora después".
  const ID_LARGO = "1234567";
  const conLink = (m, texto) => m.mensajes.splice(0, m.mensajes.length,
    { id: 0, quien: "agente", texto: AVISO },
    { id: 1, quien: "agente", texto: "Te dejo el formulario de prueba\nopengatehub.com/devs?ig=1234567" },
    { id: 2, quien: "lead", texto });
  const calla = armar({ responde: () => salida([], { accion: "callar" }) });
  conLink(calla.m, "dale, ahi lo lleno");
  assert.equal((await calla.agente.procesar(ID_LARGO, calla.m.disparo)).hecho, "calló");
  assert.deepEqual(calla.m.calientes, [["promesa", 60]]);
  const contesta = armar({ responde: () => salida(["Respuesta de prueba?"]) });
  conLink(contesta.m, "Hola, horita lo lleno");
  assert.equal((await contesta.agente.procesar(ID_LARGO, contesta.m.disparo)).hecho, "enviada");
  assert.deepEqual(contesta.m.calientes, [["promesa", 60]]);
  const despues = armar({ responde: () => salida([], { accion: "callar" }) });
  conLink(despues.m, "lo lleno mañana de prueba");
  await despues.agente.procesar(ID_LARGO, despues.m.disparo);
  assert.deepEqual(despues.m.calientes, []);
  const sinLink = armar({ responde: () => salida([], { accion: "callar" }) });
  sinLink.m.mensajes.at(-1).texto = "ahi lo lleno";
  await sinLink.agente.procesar(ID_LARGO, sinLink.m.disparo);
  assert.deepEqual(sinLink.m.calientes, []);
  const lleno = armar({ responde: () => salida([], { accion: "callar" }) });
  conLink(lleno.m, "ahi lo lleno");
  lleno.m.mensajes.splice(2, 0, { id: 9, quien: "sistema", texto: NOTA_FORMULARIO });
  await lleno.agente.procesar(ID_LARGO, lleno.m.disparo);
  assert.deepEqual(lleno.m.calientes, []);
  assert.equal((await lleno.agente.turnoCaliente({ id: "77", motivo: "promesa", desde: new Date(AHORA) })).hecho, "ya llenó el formulario");
});

test("el turno inmediato sale como turno del controlador con su indicación y cuenta como toque", async () => {
  const { agente, m } = armarToque({ responde: () => salida(["Pregunta de prueba sobre el pago?"]) });
  const desde = new Date(AHORA - 30 * 60000);
  const r = await agente.turnoCaliente({ id: "77", motivo: "pago", desde });
  assert.equal(r.hecho, "enviada");
  assert.match(m.pedidos[0].turno.contexto, /INDICACIÓN DEL CONTROLADOR/);
  assert.match(m.pedidos[0].turno.contexto, /tocó el botón de pagar hace media hora/);
  assert.equal(m.contacto.toques, 1);
});

test("el turno inmediato no sale si el lead escribió después, si la charla no es del agente o si el link ya se llenó", async () => {
  const escribio = armarToque();
  escribio.m.contacto.ultimo_lead = new Date(AHORA - 5 * 60000);
  assert.equal((await escribio.agente.turnoCaliente({ id: "77", motivo: "formulario", desde: new Date(AHORA - 15 * 60000) })).hecho, "escribió después");
  assert.equal(escribio.m.pedidos.length, 0);
  const deCande = armarToque({ dueno: "cande" });
  assert.equal((await deCande.agente.turnoCaliente({ id: "77", motivo: "pago", desde: new Date(AHORA) })).hecho, "no es del agente");
  const lleno = armarToque();
  lleno.m.mensajes.push({ id: 50, quien: "sistema", texto: NOTA_FORMULARIO });
  assert.equal((await lleno.agente.turnoCaliente({ id: "77", motivo: "link", desde: new Date(AHORA) })).hecho, "ya llenó el formulario");
  assert.equal((await lleno.agente.turnoCaliente({ id: "77", motivo: "otro", desde: new Date(AHORA) })).hecho, "motivo desconocido");
  assert.equal(lleno.m.pedidos.length, 0);
});

test("el turno inmediato tiene las trabas de un toque: tope de dos, no insistir, y nada encima de la cuenta (22/10)", async () => {
  const tope = armarToque();
  tope.m.contacto.toques = 2;
  assert.equal((await tope.agente.turnoCaliente({ id: "77", motivo: "pago", desde: new Date(AHORA) })).hecho, "ya tuvo sus dos toques");
  const noInsistir = armarToque();
  noInsistir.m.contacto.estado = { ...estadoDev, link_formulario_enviado: true, etapa: "cerrada" };
  assert.equal((await noInsistir.agente.turnoCaliente({ id: "77", motivo: "pago", desde: new Date(AHORA) })).hecho, "toque cancelado");
  const cuenta = armarToque();
  cuenta.m.mensajes.push({ id: 60, quien: "agente", texto: "Toque de prueba?", creado: new Date(AHORA - 5 * 60000) });
  const r = await cuenta.agente.turnoCaliente({ id: "77", motivo: "formulario", desde: new Date(AHORA - 15 * 60000) });
  assert.equal(r.hecho, "la cuenta ya le escribió después");
  for (const w of [tope, noInsistir, cuenta]) assert.equal(w.m.pedidos.length, 0);
  // Una nota del sistema después (la del formulario, la del clic) no cuenta como que la cuenta le escribió.
  const nota = armarToque({ responde: () => salida(["Pregunta de prueba del video?"]) });
  nota.m.mensajes.push({ id: 61, quien: "sistema", texto: NOTA_FORMULARIO, creado: new Date(AHORA - 5 * 60000) });
  assert.equal((await nota.agente.turnoCaliente({ id: "77", motivo: "formulario", desde: new Date(AHORA - 15 * 60000) })).hecho, "enviada");
});

test("el turno del link se agenda solo al contestarle al lead, la primera vez que sale el link y si se le puede insistir", async () => {
  const ID_LARGO = "1234567";
  const conLink = () => salida(["Te dejo el formulario de prueba\nopengatehub.com/devs"]);
  // Ya le había salido el link antes: no se agenda otro.
  const yaSalio = armar({ responde: conLink });
  yaSalio.m.mensajes.splice(1, 0, { id: 90, quien: "agente", texto: `opengatehub.com/devs?ig=${ID_LARGO}` });
  await yaSalio.agente.procesar(ID_LARGO, yaSalio.m.disparo);
  assert.deepEqual(yaSalio.m.calientes, []);
  // En un toque que trae el link, tampoco.
  const enToque = armarToque({ responde: conLink });
  enToque.m.contacto.estado = { ...estadoDev, link_formulario_enviado: false, busca: "si" };
  await enToque.agente.procesar(ID_LARGO, null, { evento: "seguimiento" });
  assert.deepEqual(enToque.m.calientes, []);
  // A quien contó que no tiene plata no se le insiste: el link sale, el turno del link no se agenda.
  const sinPlata = armar({ responde: conLink });
  sinPlata.m.mensajes.find((x) => x.id === sinPlata.m.disparo).texto = "no tengo plata para nada ahora";
  await sinPlata.agente.procesar(ID_LARGO, sinPlata.m.disparo);
  assert.deepEqual(sinPlata.m.calientes, []);
});

test("quién redacta: la Mac si contesta, la API de respaldo si no contesta y hay clave, y si no nadie (23/10)", async () => {
  const { quienRedacta, MAC_VIVA_SEGUNDOS } = await import("../lib/dm/seguimientos.js");
  const local = { cerebro: "local" };
  assert.equal(quienRedacta(local, 30, true), "mac");
  assert.equal(quienRedacta(local, 30, false), "mac");
  assert.equal(quienRedacta(local, MAC_VIVA_SEGUNDOS + 1, true), "api");
  assert.equal(quienRedacta(local, null, true), "api");
  assert.equal(quienRedacta(local, MAC_VIVA_SEGUNDOS + 1, false), null);
  assert.equal(quienRedacta({ ...local, respaldo_api: false }, MAC_VIVA_SEGUNDOS + 1, true), null);
  assert.equal(quienRedacta({ cerebro: "api" }, null, false), "api");
});

test("un aviso que es solo comillas o espacios no le llega a Cande como nota en blanco (23/10)", () => {
  for (const vacio of ['""', "''", " \"\" ", "“”", "", "   "]) {
    assert.equal(normalizar({ accion: "responder", mensajes: ["Hola de prueba"], aviso_para_cande: vacio }).aviso_para_cande, "", JSON.stringify(vacio));
  }
  assert.equal(normalizar({ accion: "responder", mensajes: ["x"], aviso_para_cande: "NOTA: de prueba" }).aviso_para_cande, "NOTA: de prueba");
});
