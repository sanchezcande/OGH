// El resumen de las notas del agente de DM (lib/dm/resumen.js) y cómo se contesta desde Telegram
// (lib/dm/respuestas.js). 20/10, Cande: "la mayoría de los mensajes que me pasás por telegram son re resolvibles
// por vos". Lo que no necesita nada de ella ya (las NOTA: del agente) le llega junto, dos veces por día y sin sonido.
//
// Todos los textos de este archivo son inventados para la prueba. Este repo es público: acá no va ninguna frase de
// una charla real ni del prompt del agente.
//
// Lo que estas pruebas NO cubren: las consultas de lib/dm/base.js (reclamarResumen, soltarResumen, la de
// vencerPendientes con la respuesta vencida, y lo que hace Postgres con notasParaResumen). cerrarResumen y
// numeroDeResumen sí, con un dm_config que ordena las claves como jsonb; de notasParaResumen, qué deja afuera y con qué
// patrón. Lo demás se prueba a mano contra un Postgres de verdad antes de subir: que reclamarResumen devuelva una fila
// una sola vez por franja aunque corran dos a la vez (y ninguna para una franja vieja), que soltarResumen la deje
// libre, que notasParaResumen no traiga lo frenado, lo descartado ni el borrador del código y que su patrón (~*) deje
// afuera "hoy:" y " HOY :", y que vencerPendientes diga bien si el lead escribió después de la respuesta
// (escribio_despues) y si alguien escribió en la charla después (charla_cambio).
//
// Correr:  node --test tests/*.test.mjs
import "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

const { franjaDeResumen, etiquetaDe, agrupar, armarPartes, corteDe, crearResumen, TOPE_TEXTO, TOPE_PARTES, TOPE_FILAS } = await import("../lib/dm/resumen.js");
const { leerRespuesta, crearRespuestaTelegram, etiquetaDeResumen, contactoDeAviso, porNumero, AYUDA_RESUMEN } = await import("../lib/dm/respuestas.js");
const { avisar } = await import("../lib/notificar.js");
const { crearAvisoDm } = await import("../lib/dm/armado.js");

const HORA = 3600000;
const AHORA = new Date("2026-10-20T10:05:00Z"); // las 18:05 en Bali
const AVISO_RESUMEN = "🔔 DM: notas del agente · 20/10 18 h\n\nNotas: \n1. Lead uno: algo de prueba (quedan 20 h para escribirle por acá)";

/** Una base de mentira para el resumen: lo que guardaría dm_config. */
function baseDeResumen({ notas = [], previo = null } = {}) {
  const b = {
    resumen: previo, listas: {}, cerrados: [], soltados: 0, pedidas: null,
    reclamarResumen: async (franja) => {
      const v = b.resumen;
      if (v && (v.franja || "") >= franja) return null;
      const r = { desde: v?.hasta ?? null, franja_previa: v?.franja ?? null };
      b.resumen = { ...(v || {}), franja };
      return r;
    },
    soltarResumen: async (franja, previa) => {
      if (b.resumen?.franja !== franja) return;
      b.soltados++;
      b.resumen = { ...b.resumen, franja: previa };
    },
    cerrarResumen: async (franja, hasta, lista) => {
      b.resumen = { ...b.resumen, hasta: hasta.toISOString() };
      b.cerrados.push(franja);
      if (lista) b.listas[lista.etiqueta] = lista.mapa;
    },
    notasParaResumen: async (desde, hasta) => {
      b.pedidas = [desde, hasta];
      return notas;
    },
    numeroDeResumen: async (etiqueta, n) => b.listas[etiqueta]?.[String(n)] ?? null,
    guardarIg: async () => {},
  };
  return b;
}

/** Una respuesta de Cande en su chat con el bot, respondiendo `aviso`. */
const novedad = (texto, aviso, { bot = true, id = 7 } = {}) => ({
  update_id: id,
  message: { chat: { id: 42, type: "private" }, from: { id: 42 }, text: texto, reply_to_message: { from: { is_bot: bot }, text: aviso, date: 1760950000 } },
});

/* ---------- cuándo y qué ---------- */

test("el resumen sale a las 9 y a las 18 de Bali: la franja es la última de esas horas que ya pasó", () => {
  const f = (iso) => franjaDeResumen(new Date(iso)).toISOString();
  assert.equal(f("2026-10-20T00:59:00Z"), "2026-10-19T10:00:00.000Z");
  assert.equal(f("2026-10-20T01:00:00Z"), "2026-10-20T01:00:00.000Z");
  assert.equal(f("2026-10-20T09:59:00Z"), "2026-10-20T01:00:00.000Z");
  assert.equal(f("2026-10-20T23:00:00Z"), "2026-10-20T10:00:00.000Z");
  assert.equal(etiquetaDe(new Date("2026-10-20T01:00:00Z")), "20/10 9 h");
  assert.equal(etiquetaDe(new Date("2026-10-20T10:00:00Z")), "20/10 18 h");
});

test("las notas van por charla, sin repetir, con su número, cuánto queda para escribirle y el link", () => {
  const filas = [
    { contacto: "11", nombre: "Lead uno", aviso: "NOTA: preguntó algo de prueba", ultimo_lead: new Date(AHORA - 3 * HORA) },
    { contacto: "22", nombre: "Lead dos", aviso: "NOTA: ofrece algo de prueba", ultimo_lead: new Date(AHORA - 30 * HORA) },
    { contacto: "11", nombre: "Lead uno", aviso: "NOTA: preguntó algo de prueba", ultimo_lead: new Date(AHORA - 3 * HORA) },
    { contacto: "11", nombre: "Lead uno", aviso: "NOTA: otra cosa de prueba", ultimo_lead: new Date(AHORA - 2 * HORA) },
  ];
  const charlas = agrupar(filas);
  assert.deepEqual(charlas.map((c) => [c.contacto, c.notas]), [["11", ["preguntó algo de prueba", "otra cosa de prueba"]], ["22", ["ofrece algo de prueba"]]]);
  const { partes, afuera } = armarPartes(charlas, { ahora: AHORA, links: { 11: "https://ig.me/m/usuario_de_prueba" } });
  assert.equal(partes.length, 1);
  assert.deepEqual(partes[0].numeros, { 1: "11", 2: "22" });
  assert.equal(afuera, 0);
  assert.equal(partes[0].renglones[0], "1. Lead uno: otra cosa de prueba (+1 nota antes) (quedan 21 h para escribirle por acá) https://ig.me/m/usuario_de_prueba");
  assert.equal(partes[0].renglones[1], "2. Lead dos: ofrece algo de prueba (pasó el día: escribile desde la app)");
});

test("una nota sin el prefijo exacto también va: Nota:, nota: o sin nada", () => {
  const charlas = agrupar([
    { contacto: "11", nombre: "Lead uno", aviso: "Nota: algo de prueba" },
    { contacto: "22", nombre: "Lead dos", aviso: "nota - otra cosa de prueba" },
    { contacto: "33", nombre: "Lead tres", aviso: "Ojo: una más de prueba" },
  ]);
  assert.deepEqual(charlas.map((c) => c.notas[0]), ["algo de prueba", "otra cosa de prueba", "Ojo: una más de prueba"]);
});

test("muchas charlas van en varios mensajes, con la numeración seguida: ninguna queda afuera", () => {
  const muchas = Array.from({ length: 30 }, (_, i) => ({
    contacto: String(100 + i), nombre: `Lead de prueba ${i}`, notas: ["x".repeat(220)], ultimo_lead: AHORA,
    primera: new Date(AHORA - (40 - i) * 60000),
  }));
  const { partes, afuera } = armarPartes(muchas, { ahora: AHORA, links: Object.fromEntries(muchas.map((c) => [c.contacto, "https://ig.me/m/usuario_de_prueba"])) });
  assert.equal(afuera, 0);
  assert.ok(partes.length > 1);
  const numeros = Object.assign({}, ...partes.map((p) => p.numeros));
  assert.deepEqual(Object.keys(numeros).map(Number), Array.from({ length: 30 }, (_, i) => i + 1));
  assert.deepEqual(Object.values(numeros), muchas.map((c) => c.contacto));
  for (const p of partes) assert.ok(p.renglones.join("\n").length <= TOPE_TEXTO);
  // Más de lo que entra en TOPE_PARTES mensajes: lo que sobra queda afuera y el corte se queda antes de su primera nota.
  const demasiadas = Array.from({ length: TOPE_PARTES * 20 }, (_, i) => ({ ...muchas[0], contacto: String(1000 + i), primera: new Date(AHORA - 1000 * 60000 + i * 60000) }));
  const r = armarPartes(demasiadas, { ahora: AHORA });
  assert.equal(r.partes.length, TOPE_PARTES);
  assert.ok(r.afuera > 0);
  const salieron = new Set(r.partes.flatMap((p) => Object.values(p.numeros)));
  const quedaron = demasiadas.filter((c) => !salieron.has(c.contacto));
  assert.equal(corteDe({ ahora: AHORA, quedaron }).getTime(), quedaron[0].primera.getTime() - 1);
  assert.equal(corteDe({ ahora: AHORA }).getTime(), AHORA.getTime());
  assert.equal(corteDe({ ahora: AHORA, ultimaLeida: "2026-10-20T09:00:00Z" }).toISOString(), "2026-10-20T09:00:00.000Z");
});

test("con 30 charlas el resumen sale en varios mensajes y ninguna nota se pierde; si uno no sale, lo que faltó vuelve en el siguiente", async () => {
  const notas = Array.from({ length: 30 }, (_, i) => ({
    contacto: String(100 + i), nombre: `Lead de prueba ${i}`, ig_usuario: "usuario_de_prueba", aviso: `NOTA: ${"y".repeat(200)} ${i}`,
    ultimo_lead: new Date("2026-10-20T09:00:00Z"), creado: new Date(Date.parse("2026-10-20T02:00:00Z") + i * 60000).toISOString(),
  }));
  const base = baseDeResumen({ notas });
  const mandados = [];
  const mandar = crearResumen({ base, avisar: async (titulo, campos) => { mandados.push({ titulo, campos }); return true; }, reloj: () => AHORA });
  assert.deepEqual(await mandar(), { hecho: "enviado", charlas: 30 });
  assert.ok(mandados.length > 1);
  assert.match(mandados[0].titulo, /^DM: notas del agente · 20\/10 18 h \(1\/\d\)$/);
  assert.equal(etiquetaDeResumen(`🔔 ${mandados[1].titulo}\n\nNotas: algo`), "20/10 18 h", "cada mensaje se puede responder");
  assert.equal(mandados.filter((x) => x.campos.Contestar).length, 1, "la ayuda para contestar va en el último");
  assert.equal(Object.keys(base.listas["20/10 18 h"]).length, 30);
  assert.equal(base.resumen.hasta, AHORA.toISOString());
  // El segundo mensaje no sale: el corte queda antes de la primera nota de lo que no salió.
  const otra = baseDeResumen({ notas });
  let n = 0;
  const corta = crearResumen({ base: otra, avisar: async () => ++n === 1, reloj: () => AHORA });
  const r = await corta();
  assert.equal(r.hecho, "enviado");
  assert.ok(r.charlas > 0 && r.charlas < 30);
  const primeraQueFalto = notas[r.charlas];
  assert.equal(otra.resumen.hasta, new Date(Date.parse(primeraQueFalto.creado) - 1).toISOString());
  assert.equal(Object.keys(otra.listas["20/10 18 h"]).length, r.charlas);
});

test("si la consulta de notas llega a su tope, el corte queda en la última leída", async () => {
  const notas = Array.from({ length: TOPE_FILAS }, (_, i) => ({
    contacto: String(100 + (i % 3)), nombre: "Lead de prueba", aviso: "NOTA: algo de prueba", ultimo_lead: null,
    creado: new Date(Date.parse("2026-10-20T02:00:00Z") + i * 1000).toISOString(),
  }));
  const base = baseDeResumen({ notas });
  const mandar = crearResumen({ base, avisar: async () => true, reloj: () => AHORA });
  assert.equal((await mandar()).hecho, "enviado");
  assert.equal(base.resumen.hasta, new Date(notas.at(-1).creado).toISOString());
});

test("el resumen sale una sola vez por franja, sin sonido, y guarda qué charla es cada número", async () => {
  const base = baseDeResumen({
    notas: [{ contacto: "11", nombre: "Lead uno", ig_usuario: "usuario_de_prueba", aviso: "NOTA: preguntó algo de prueba", ultimo_lead: new Date("2026-10-20T09:00:00Z") }],
  });
  const mandados = [];
  const mandar = crearResumen({ base, avisar: async (titulo, campos, opciones) => { mandados.push({ titulo, campos, opciones }); return true; }, reloj: () => AHORA });
  assert.deepEqual(await mandar(), { hecho: "enviado", charlas: 1 });
  assert.equal(mandados.length, 1);
  assert.equal(mandados[0].titulo, "DM: notas del agente · 20/10 18 h");
  assert.deepEqual(mandados[0].opciones, { contestable: false, silencioso: true });
  assert.equal(mandados[0].campos.Notas, "\n1. Lead uno: preguntó algo de prueba (quedan 22 h para escribirle por acá) https://ig.me/m/usuario_de_prueba");
  assert.match(mandados[0].campos.Contestar, /2: decile/);
  assert.deepEqual(base.listas, { "20/10 18 h": { 1: "11" } });
  assert.equal(base.pedidas[0].toISOString(), "2026-10-20T01:00:00.000Z", "el primero arranca desde la franja de antes");
  assert.deepEqual(await mandar(), { hecho: "no toca", charlas: 0 });
  assert.equal(mandados.length, 1);
});

test("si el resumen no sale, la franja queda libre y la próxima vuelta lo intenta con las mismas notas; sin notas, no manda nada", async () => {
  const base = baseDeResumen({
    notas: [{ contacto: "11", nombre: "Lead uno", ig_usuario: "", aviso: "NOTA: algo de prueba", ultimo_lead: null }],
    previo: { franja: "2026-10-20T01:00:00.000Z", hasta: "2026-10-20T01:03:00.000Z" },
  });
  let anda = false;
  const mandar = crearResumen({ base, avisar: async () => anda, reloj: () => AHORA });
  assert.equal((await mandar()).hecho, "no salió");
  assert.equal(base.soltados, 1);
  assert.equal(base.resumen.franja, "2026-10-20T01:00:00.000Z");
  anda = true;
  assert.equal((await mandar()).hecho, "enviado");
  assert.equal(base.pedidas[0].toISOString(), "2026-10-20T01:03:00.000Z", "desde el corte del anterior");
  const vacia = baseDeResumen();
  const mandados = [];
  const sinNotas = crearResumen({ base: vacia, avisar: async (...a) => { mandados.push(a); return true; }, reloj: () => AHORA });
  assert.equal((await sinNotas()).hecho, "sin notas");
  assert.equal(mandados.length, 0);
  assert.deepEqual(vacia.cerrados, ["2026-10-20T10:00:00.000Z"]);
});

test("el resumen llega sin sonido (disable_notification); los demás avisos suenan como siempre", async () => {
  const antes = globalThis.fetch;
  const cuerpos = [];
  globalThis.fetch = async (url, o) => {
    cuerpos.push(JSON.parse(o.body));
    return { ok: true, status: 200, text: async () => "" };
  };
  try {
    await avisar("DM: notas del agente · 20/10 18 h", { Notas: "prueba" }, { silencioso: true });
    await avisar("DM: aviso de prueba", { Aviso: "prueba" });
    assert.equal(cuerpos[0].disable_notification, true);
    assert.equal("disable_notification" in cuerpos[1], false);
  } finally {
    globalThis.fetch = antes;
  }
  const opciones = [];
  const avisarDm = crearAvisoDm({ avisar: async (t, c, o) => { opciones.push(o); return true; }, leerChat: async () => null, tokenBot: () => "bot-de-prueba" });
  await avisarDm("DM: notas del agente · 20/10 18 h", { Notas: "prueba" }, { contestable: false, silencioso: true });
  assert.deepEqual(opciones, [{ token: "bot-de-prueba", silencioso: true }]);
});

/* ---------- contestar desde el resumen ---------- */

test("respondiendo el resumen con el número, es como responder el aviso de esa charla", () => {
  const leer = (texto, opciones) => leerRespuesta(novedad(texto, AVISO_RESUMEN, opciones), { duena: "42" });
  assert.equal(etiquetaDeResumen(AVISO_RESUMEN), "20/10 18 h");
  assert.equal(contactoDeAviso(AVISO_RESUMEN), null, "el resumen no es el aviso de una charla");
  const r = leer("2: decile algo de prueba");
  assert.equal(r.resumen, "20/10 18 h");
  assert.equal(r.numero, 2);
  assert.equal(r.accion, "indicacion");
  assert.equal(r.texto, "decile algo de prueba");
  assert.equal(r.contacto, null, "el contacto sale de la lista guardada, no del texto");
  assert.equal(leer("1) /textual Texto de prueba").accion, "mandar");
  assert.equal(leer("1: /textual Texto de prueba").texto, "Texto de prueba");
  assert.equal(leer("3: --").accion, "cande");
  assert.equal(leer("3: /agente").accion, "agente");
  assert.deepEqual(leer("decile algo de prueba"), { ayuda: AYUDA_RESUMEN });
  assert.deepEqual(leer("2: decile algo", { bot: false }), { ayuda: "Para contestarle a alguien, respondé (deslizá) el aviso de su charla." });
  // Un nombre de lead no puede hacerse pasar por el título: cuenta solo el primer renglón.
  assert.equal(etiquetaDeResumen("🔔 DM: aviso de prueba\n\n🔔 DM: notas del agente · 20/10 18 h"), null);
});

test("varias respuestas en un mensaje, una por renglón: cada una va a su charla", async () => {
  assert.deepEqual(porNumero("1: decile algo de prueba\n2: --"), [{ numero: 1, texto: "decile algo de prueba" }, { numero: 2, texto: "--" }]);
  assert.deepEqual(porNumero("2: decile algo\nque siga en otro renglón"), [{ numero: 2, texto: "decile algo\nque siga en otro renglón" }]);
  assert.deepEqual(porNumero("2:\ndecile algo de prueba"), [{ numero: 2, texto: "decile algo de prueba" }]);
  assert.equal(porNumero("decile algo\n2: otra"), null);
  assert.deepEqual(porNumero("2: algo\n2: otra"), { repetido: 2 });
  const leer = (texto) => leerRespuesta(novedad(texto, AVISO_RESUMEN), { duena: "42" });
  const r = leer("1: decile que sirve de prueba\n2: decile que no de prueba\n3: --");
  assert.deepEqual(r.varias.map((x) => [x.numero, x.accion, x.texto ?? null]), [
    [1, "indicacion", "decile que sirve de prueba"], [2, "indicacion", "decile que no de prueba"], [3, "cande", null],
  ]);
  assert.match(leer("2: algo\n2: otra").ayuda, /dos veces/);
  assert.match(leer("1: algo de prueba\n2: /textual").ayuda, /^El 2: .*No mandé nada\.$/);
  const base = {
    reclamarNovedad: async () => true,
    numeroDeResumen: async (e, n) => ({ 1: "11", 2: "22", 3: "33" })[n] ?? null,
    contacto: async (id) => ({ id, nombre: `Lead ${id}`, dueno: "agente" }),
    ponerDueno: async (id, d) => { duenos.push([id, d]); },
    descartarPendientes: async () => {},
  };
  const duenos = [];
  const pedidos = [];
  const dichos = [];
  const agente = { procesar: async (id, _, op) => { pedidos.push([id, op.indicacion]); return { hecho: "enviada", enviado: ["Mensaje de prueba"] }; } };
  const manychat = { ponerCampo: async () => ({ ok: true }) };
  const responder = crearRespuestaTelegram({ base, manychat, decir: async (t) => { dichos.push(t); }, agente });
  assert.equal(await responder(r, { updateId: 9 }), "indicacion enviada, indicacion enviada, cande");
  assert.deepEqual(pedidos, [["11", "decile que sirve de prueba"], ["22", "decile que no de prueba"]]);
  assert.deepEqual(duenos, [["33", "cande"]]);
  assert.equal(dichos.length, 3);
});

test("el número del resumen se busca en la lista guardada: a esa charla le escribe el agente", async () => {
  const base = {
    reclamarNovedad: async () => true,
    numeroDeResumen: async (e, n) => (e === "20/10 18 h" && n === 2 ? "22" : null),
    contacto: async (id) => ({ id, nombre: "Lead dos", dueno: "agente" }),
  };
  const dichos = [];
  const pedidos = [];
  const agente = { procesar: async (id, _, op) => { pedidos.push([id, op]); return { hecho: "enviada", enviado: ["Mensaje de prueba"] }; } };
  const responder = crearRespuestaTelegram({ base, manychat: {}, decir: async (t) => { dichos.push(t); }, agente });
  const r = leerRespuesta(novedad("2: decile algo de prueba", AVISO_RESUMEN), { duena: "42" });
  assert.equal(await responder(r, { updateId: 7 }), "indicacion enviada");
  assert.deepEqual(pedidos, [["22", { evento: "indicacion", indicacion: "decile algo de prueba" }]]);
  assert.match(dichos.at(-1), /^✓ Le mandé a Lead dos/);
  const otro = leerRespuesta(novedad("9: decile algo", AVISO_RESUMEN, { id: 8 }), { duena: "42" });
  assert.equal(await responder(otro, { updateId: 8 }), "sin contacto");
  assert.match(dichos.at(-1), /No encuentro el 9/);
  assert.equal(pedidos.length, 1);
});

/* ---------- revisión del PR de los avisos (20/10) ---------- */

const resumenJs = await import("../lib/dm/resumen.js");
const respuestasJs = await import("../lib/dm/respuestas.js");
const baseJs = await import("../lib/dm/base.js");
const { base: pg } = await import("./dobles/postgres.mjs");

test("E: de cada charla va la nota más nueva entera (hasta 600) y cuántas hubo antes; lo que no entra va en otro mensaje", () => {
  const vieja = `NOTA: ${"vieja de prueba ".repeat(10).trim()}`;
  const nueva = `NOTA: ${"nueva de prueba ".repeat(37).trim()}`; // 591 caracteres sin el NOTA:
  assert.ok(nueva.length - 6 > 220 && nueva.length - 6 <= 600);
  const charlas = agrupar([
    { contacto: "11", nombre: "Lead uno", aviso: vieja, creado: "2026-10-20T02:00:00Z", ultimo_lead: new Date(AHORA - HORA) },
    { contacto: "11", nombre: "Lead uno", aviso: "NOTA: otra de prueba", creado: "2026-10-20T03:00:00Z", ultimo_lead: new Date(AHORA - HORA) },
    { contacto: "11", nombre: "Lead uno", aviso: nueva, creado: "2026-10-20T04:00:00Z", ultimo_lead: new Date(AHORA - HORA) },
  ]);
  const { partes } = armarPartes(charlas, { ahora: AHORA });
  const renglon = partes[0].renglones[0];
  assert.ok(renglon.includes(nueva.slice(6)), "la nota más nueva va entera");
  assert.ok(!renglon.includes("vieja de prueba"), "las de antes no van");
  assert.match(renglon, /\(\+2 notas antes\) \(quedan 22 h para escribirle por acá\)$/);
  // Una nota que volvió a llegar es la más nueva.
  assert.deepEqual(agrupar([
    { contacto: "11", aviso: "NOTA: a de prueba" }, { contacto: "11", aviso: "NOTA: b de prueba" }, { contacto: "11", aviso: "NOTA: a de prueba" },
  ])[0].notas, ["b de prueba", "a de prueba"]);
  // Muchas charlas con notas largas: van en varios mensajes y ninguna se recorta.
  const largas = Array.from({ length: 20 }, (_, i) => ({ contacto: String(100 + i), nombre: `Lead ${i}`, notas: [`${"z".repeat(590)} ${i}`], ultimo_lead: AHORA }));
  const r = armarPartes(largas, { ahora: AHORA });
  assert.equal(r.afuera, 0);
  assert.ok(r.partes.length > 1);
  for (const p of r.partes) assert.ok(p.renglones.join("\n").length <= TOPE_TEXTO);
  largas.forEach((c, i) => assert.ok(r.partes.flatMap((p) => p.renglones).some((x) => x.includes(c.notas[0])), `la ${i} va entera`));
});

test("G: una lista dentro de una indicación es una sola indicación para el primer número; varias solo con N: en cada renglón", () => {
  const { porNumero: pn, AYUDA_DE_A_UNO, AYUDA_AMBIGUA } = respuestasJs;
  const lista = "5: decile que antes haga dos cosas de prueba:\n1. que mande el CV\n2. que llene el formulario";
  assert.deepEqual(pn(lista), [{ numero: 5, texto: "decile que antes haga dos cosas de prueba:\n1. que mande el CV\n2. que llene el formulario" }]);
  assert.deepEqual(pn("4: decile que tiene 3 partes de prueba:\n- una\n- otra"), [{ numero: 4, texto: "decile que tiene 3 partes de prueba:\n- una\n- otra" }]);
  assert.deepEqual(pn("5: decile algo de prueba:\n1) una cosa\notra línea"), [{ numero: 5, texto: "decile algo de prueba:\n1) una cosa\notra línea" }]);
  for (const t of ["2-3: decile que sí", "2 y 3: decile que sí", "2, 3: decile que sí", "1: decile algo\n2-4: decile otra"]) {
    assert.deepEqual(pn(t), { ayuda: AYUDA_DE_A_UNO }, t);
  }
  assert.deepEqual(pn("1. decile algo de prueba\n2. decile otra cosa"), { ayuda: AYUDA_AMBIGUA });
  // "N:" mezclados con un renglón suelto: lo del 2 iría al 1. No sale nada.
  assert.deepEqual(pn("1: decile algo de prueba\n2: decile otra cosa\nque siga en otro renglón"), { ayuda: AYUDA_AMBIGUA });
  // "10:30" es una hora, no la charla 10.
  assert.deepEqual(pn("5: decile que la llamada de prueba es a las\n10:30"), [{ numero: 5, texto: "decile que la llamada de prueba es a las\n10:30" }]);
  assert.deepEqual(pn("1: decile algo de prueba\n2: 3 veces de prueba"), [{ numero: 1, texto: "decile algo de prueba" }, { numero: 2, texto: "3 veces de prueba" }]);
  assert.deepEqual(pn("1: decile algo de prueba\n\n3: --"), [{ numero: 1, texto: "decile algo de prueba" }, { numero: 3, texto: "--" }]);
  const leer = (texto) => leerRespuesta(novedad(texto, AVISO_RESUMEN), { duena: "42" });
  const r = leer(lista);
  assert.equal(r.varias, undefined, "no se reparte");
  assert.equal(r.numero, 5);
  assert.equal(r.texto, "decile que antes haga dos cosas de prueba:\n1. que mande el CV\n2. que llene el formulario");
  assert.deepEqual(leer("2-3: decile que sí"), { ayuda: AYUDA_DE_A_UNO });
});

test("G: con varias, si un número no está en ese resumen no sale ninguna; nunca a una charla que no sea la del número", async () => {
  const pedidos = [];
  const dichos = [];
  const base = {
    reclamarNovedad: async () => true,
    numeroDeResumen: async (e, n) => ({ 1: "11", 3: "33" })[n] ?? null,
    contacto: async (id) => ({ id, nombre: `Lead ${id}`, dueno: "agente" }),
  };
  const agente = { procesar: async (id, _, op) => { pedidos.push([id, op.indicacion]); return { hecho: "enviada", enviado: ["Mensaje de prueba"] }; } };
  const responder = crearRespuestaTelegram({ base, manychat: {}, decir: async (t) => { dichos.push(t); }, agente });
  const r = leerRespuesta(novedad("1: decile algo de prueba\n7: decile otra cosa", AVISO_RESUMEN), { duena: "42" });
  assert.equal(await responder(r, { updateId: 11 }), "sin contacto");
  assert.deepEqual(pedidos, []);
  assert.match(dichos.at(-1), /^No mandé nada: no encuentro el 7 en ese resumen/);
});

test("más de 4 en un mensaje: salen las primeras 4 y a Cande se le dice cuáles no, para que las mande aparte", async () => {
  const pedidos = [];
  const dichos = [];
  const base = {
    reclamarNovedad: async () => true,
    numeroDeResumen: async (e, n) => String(10 + n),
    contacto: async (id) => ({ id, nombre: `Lead ${id}`, dueno: "agente" }),
  };
  const agente = { procesar: async (id, _, op) => { pedidos.push([id, op.indicacion]); return { hecho: "enviada", enviado: ["Mensaje de prueba"] }; } };
  const responder = crearRespuestaTelegram({ base, manychat: {}, decir: async (t) => { dichos.push(t); }, agente });
  const texto = Array.from({ length: 6 }, (_, i) => `${i + 1}: decile algo de prueba ${i + 1}`).join("\n");
  const r = leerRespuesta(novedad(texto, AVISO_RESUMEN), { duena: "42" });
  assert.equal(r.varias.length, 6);
  const hecho = await responder(r, { updateId: 12 });
  assert.equal(respuestasJs.MAX_POR_MENSAJE, 4);
  assert.deepEqual(pedidos.map((x) => x[0]), ["11", "12", "13", "14"]);
  assert.match(dichos[0], /No mandé las del 5, 6: mandámelas aparte/);
  assert.match(hecho, /sin mandar: 5, 6$/);
});

/** dm_config como la guarda Postgres: jsonb ordena las claves de un objeto (primero las cortas) y no guarda el orden. */
function configComoJsonb() {
  const guardado = {};
  const jsonb = (v) => (Array.isArray(v) ? v.map(jsonb) : v && typeof v === "object"
    ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.length - b.length || (a < b ? -1 : a > b ? 1 : 0)).map(([k, x]) => [k, jsonb(x)]))
    : v);
  pg.otras = (t, params) => {
    if (t.startsWith("UPDATE dm_config SET valor = valor || jsonb_build_object('hasta'")) return { rows: [] };
    if (t.startsWith("SELECT valor FROM dm_config WHERE clave =")) return { rows: params[0] in guardado ? [{ valor: structuredClone(guardado[params[0]]) }] : [] };
    if (t.startsWith("INSERT INTO dm_config (clave, valor)")) {
      guardado[params[0]] = jsonb(JSON.parse(params[1]));
      return { rows: [] };
    }
    return undefined;
  };
  return guardado;
}

test("H: el número se encuentra en el resumen que respondió aunque ya haya salido el siguiente, también al cambiar de mes", async () => {
  configComoJsonb();
  try {
    const franjas = [];
    for (let d = Date.parse("2026-10-20T01:00:00Z"); d <= Date.parse("2026-11-03T10:00:00Z"); d += 12 * HORA) {
      franjas.push(new Date(d), new Date(d + 9 * HORA));
    }
    let previa = null;
    for (const f of franjas.filter((x, i, a) => a.findIndex((y) => y.getTime() === x.getTime()) === i).sort((a, b) => a - b)) {
      const etiqueta = etiquetaDe(f);
      await baseJs.cerrarResumen(f.toISOString(), f, { etiqueta, en: f.toISOString(), mapa: { 1: `id ${etiqueta}`, 12: `doce ${etiqueta}` } });
      assert.equal(await baseJs.numeroDeResumen(etiqueta, 1), `id ${etiqueta}`, etiqueta);
      if (previa) assert.equal(await baseJs.numeroDeResumen(previa, 12), `doce ${previa}`, `al guardar ${etiqueta} sigue ${previa}`);
      previa = etiqueta;
    }
    // Quedan los de las últimas 72 horas (con el de hace justo 72, 7): uno más viejo ya no, y nunca se busca el número
    // en otro resumen.
    assert.equal(await baseJs.numeroDeResumen("31/10 18 h", 1), "id 31/10 18 h");
    assert.equal(await baseJs.numeroDeResumen("31/10 9 h", 1), null);
    assert.equal(await baseJs.numeroDeResumen("20/10 9 h", 1), null);
    assert.equal(await baseJs.numeroDeResumen("03/11 18 h", 99), null);
  } finally {
    pg.otras = null;
  }
  const lista = resumenJs.conResumen(null, { etiqueta: "20/10 9 h", en: "2026-10-20T01:00:00.000Z", mapa: { 1: "11" } });
  assert.deepEqual(lista, [{ etiqueta: "20/10 9 h", en: "2026-10-20T01:00:00.000Z", mapa: { 1: "11" } }]);
  assert.equal(resumenJs.numeroEn({ "20/10 9 h": { 1: "11" } }, "20/10 9 h", 1), null, "una lista vieja (objeto) no vale");
});

test("las notas del resumen no traen el borrador del código y dejan afuera lo urgente con la misma definición que el agente", async () => {
  const consultas = [];
  pg.otras = (t, params) => {
    if (t.includes("FROM dm_salidas s JOIN dm_contactos c")) {
      consultas.push({ t, params });
      return { rows: [] };
    }
    return undefined;
  };
  try {
    await baseJs.notasParaResumen(new Date("2026-10-20T01:00:00Z"), new Date("2026-10-20T10:00:00Z"));
  } finally {
    pg.otras = null;
  }
  assert.equal(consultas.length, 1);
  assert.match(consultas[0].t, /s\.accion NOT IN \('pasar_a_cande', 'codigo_mp'\)/);
  assert.match(consultas[0].t, /s\.aviso !~\* \?/, "el patrón va como parámetro: el mismo de resumen.URGENTE");
  const patron = consultas[0].params.find((p) => p === resumenJs.URGENTE);
  assert.ok(patron, "usa resumen.URGENTE");
  const comoPostgres = new RegExp(patron, "i");
  for (const aviso of ["HOY: algo", "hoy: algo", " HOY : algo", "YA: algo", "Ya:algo", "NOTA: algo", "algo HOY: no", "Hoy no: algo", ""]) {
    assert.equal(comoPostgres.test(aviso), resumenJs.esUrgente(aviso), aviso);
  }
  assert.equal(resumenJs.esUrgente("hoy: algo"), true);
  assert.equal(resumenJs.esUrgente("NOTA: algo"), false);
});
