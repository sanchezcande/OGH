// El resumen de las notas del agente de DM (lib/dm/resumen.js) y cómo se contesta desde Telegram
// (lib/dm/respuestas.js). 20/10, Cande: "la mayoría de los mensajes que me pasás por telegram son re resolvibles
// por vos". Lo que no necesita nada de ella ya (las NOTA: del agente) le llega junto, dos veces por día y sin sonido.
//
// Todos los textos de este archivo son inventados para la prueba. Este repo es público: acá no va ninguna frase de
// una charla real ni del prompt del agente.
//
// Lo que estas pruebas NO cubren: las consultas de lib/dm/base.js (notasParaResumen, reclamarResumen, soltarResumen,
// cerrarResumen, numeroDeResumen y la de vencerPendientes con la respuesta vencida). Se prueban a mano contra un
// Postgres de verdad antes de subir: que reclamarResumen devuelva una fila una sola vez por franja aunque corran dos
// a la vez (y ninguna para una franja vieja), que soltarResumen la deje libre, que notasParaResumen no traiga lo
// frenado ni lo descartado, y que vencerPendientes diga bien si el lead escribió después de la respuesta.
//
// Correr:  node --test tests/*.test.mjs
import "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

const { franjaDeResumen, etiquetaDe, agrupar, armarRenglones, crearResumen, TOPE_CHARLAS } = await import("../lib/dm/resumen.js");
const { leerRespuesta, crearRespuestaTelegram, etiquetaDeResumen, contactoDeAviso, AYUDA_RESUMEN } = await import("../lib/dm/respuestas.js");
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
  const { renglones, mapa, afuera } = armarRenglones(charlas, { ahora: AHORA, links: { 11: "https://ig.me/m/usuario_de_prueba" } });
  assert.deepEqual(mapa, { 1: "11", 2: "22" });
  assert.equal(afuera, 0);
  assert.equal(renglones[0], "1. Lead uno: preguntó algo de prueba / otra cosa de prueba (quedan 21 h para escribirle por acá) https://ig.me/m/usuario_de_prueba");
  assert.equal(renglones[1], "2. Lead dos: ofrece algo de prueba (pasó el día: escribile desde la app)");
  const muchas = Array.from({ length: TOPE_CHARLAS + 5 }, (_, i) => ({ contacto: String(100 + i), nombre: `Lead ${i}`, notas: ["nota de prueba"], ultimo_lead: AHORA }));
  const tope = armarRenglones(muchas, { ahora: AHORA });
  assert.equal(tope.renglones.length, TOPE_CHARLAS);
  assert.equal(tope.afuera, 5);
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
