// El pedido a Claude (lib/dm/modelo.js) y la salida por ManyChat (lib/dm/manychat.js), con el
// SDK real de Anthropic y un fetch de mentira: se mira lo que viaja y qué se hace con cada
// respuesta. Ninguna prueba sale a la red. Los textos son inventados.
//
// Lo que NO prueban: que Anthropic y ManyChat acepten de verdad estos pedidos. Eso se confirma
// con las claves cargadas, en la primera prueba real.
//
// Correr:  node --test tests/*.test.mjs
import "./dobles/preparar.mjs";
import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";

process.env.ANTHROPIC_API_KEY = "clave-de-prueba";
process.env.MANYCHAT_API_KEY = "clave-de-prueba";
delete process.env.DM_MODELO;
delete process.env.DM_ESFUERZO;

// preparar.mjs dejó un fetch que solo conoce a Telegram. Acá se le suman Anthropic y ManyChat
// de mentira: `contestar` decide qué responde cada pedido y `pedidos` guarda lo que viajó.
const pedidos = [];
let contestar = null;
const telegram = globalThis.fetch;
const json = (cuerpo, status = 200) => new Response(JSON.stringify(cuerpo), { status, headers: { "content-type": "application/json" } });
globalThis.fetch = async (url, opciones = {}) => {
  const destino = String(url);
  if (!destino.startsWith("https://api.anthropic.com/") && !destino.startsWith("https://api.manychat.com/")) {
    return telegram(url, opciones);
  }
  const p = { url: destino, cuerpo: JSON.parse(opciones.body), encabezados: new Headers(opciones.headers), signal: opciones.signal };
  pedidos.push(p);
  return contestar(p);
};

const { pedir, ModeloNoContesto, Salida } = await import("../lib/dm/modelo.js");
const { mandarTextos, ponerCampo } = await import("../lib/dm/manychat.js");

const buena = {
  accion: "responder", mensajes: ["Respuesta de prueba?"],
  estado: { quien: "dev", busca: "si", dolor: "de prueba", etapa: "como_va", link_formulario_enviado: false, precio_dicho: false },
  aviso_para_cande: "", seguimiento_en_horas: null, motivo: "motivo de prueba",
};
const mensaje = (texto, extra = {}) => json({
  id: "msg_prueba", type: "message", role: "assistant", model: "modelo-de-prueba", stop_reason: "end_turn", stop_sequence: null,
  content: [{ type: "text", text: texto }], usage: { input_tokens: 10, output_tokens: 5 }, ...extra,
});
const rechazo = (status, texto) => json({ type: "error", error: { type: "error_de_prueba", message: texto } }, status);
const turno = { contexto: null, historial: [], mensajes_del_lead: ["mensaje de prueba"] };
const pide = () => pedir({ prompt: "PROMPT DE PRUEBA", turno });
const falla = (motivo) => assert.rejects(pide, (e) => e instanceof ModeloNoContesto && motivo.test(e.message));

beforeEach(() => { pedidos.length = 0; contestar = null; });

/* ---------- lo que viaja ---------- */

test("el esquema viaja con las listas como enum y sin campos de más en ningún objeto", async () => {
  contestar = () => mensaje(JSON.stringify(buena));
  const r = await pide();
  assert.deepEqual({ ...r, _uso: undefined }, { ...buena, _uso: undefined });
  assert.equal(r._uso.input_tokens, 10);

  const { cuerpo, encabezados } = pedidos[0];
  const { schema, type } = cuerpo.output_config.format;
  assert.equal(type, "json_schema");
  assert.deepEqual(schema.properties.accion.enum, ["responder", "callar", "pasar_a_cande"]);
  assert.ok(schema.properties.estado.properties.quien.enum.includes("empresa"));
  assert.ok(schema.properties.estado.properties.busca.enum.includes("todavia_no"));
  assert.ok(schema.properties.estado.properties.etapa.enum.includes("de_cande"));
  assert.equal(schema.additionalProperties, false);
  assert.equal(schema.properties.estado.additionalProperties, false);
  assert.deepEqual(schema.required, Object.keys(Salida.shape));
  assert.equal("$schema" in schema, false);
  assert.doesNotMatch(JSON.stringify(schema), /"description"/); // así los mandaba el helper del SDK: como texto

  assert.equal(cuerpo.model, "claude-opus-5-5");
  assert.equal(cuerpo.output_config.effort, "medium");
  assert.equal(cuerpo.fallbacks, "default");
  assert.equal(cuerpo.system[0].text, "PROMPT DE PRUEBA");
  assert.deepEqual(JSON.parse(cuerpo.messages[0].content), turno);
  assert.match(encabezados.get("anthropic-beta"), /server-side-fallback/);
});

/* ---------- lo que vuelve ---------- */

test("si el modelo se niega o la respuesta se corta, el motivo que llega es ese y no un error de lectura", async () => {
  contestar = () => mensaje("", { stop_reason: "refusal" });
  await falla(/no quiso contestar/);
  contestar = () => mensaje('{"accion": "responder", "mensajes": ["Respuesta de pr', { stop_reason: "max_tokens" });
  await falla(/se cortó/);
});

test("una respuesta que no cumple el formato se informa por el campo que falla", async () => {
  contestar = () => mensaje(JSON.stringify({ ...buena, estado: { ...buena.estado, quien: "founder" } }));
  await falla(/no cumple el formato: estado\.quien/);
  contestar = () => mensaje(JSON.stringify({ ...buena, accion: "bailar", motivo: 7 }));
  await falla(/no cumple el formato: accion, motivo/);
  contestar = () => mensaje("esto no es un JSON");
  await falla(/no cumple el formato/);
});

test("los errores de Anthropic llegan con un motivo que se entiende", async () => {
  contestar = () => rechazo(401, "clave mala");
  await falla(/la clave de Anthropic no es válida/);
  contestar = () => rechazo(404, "no existe ese modelo");
  await falla(/Anthropic contestó 404/);
  assert.equal(pedidos.length, 2); // un 401 y un 404 no se reintentan
  pedidos.length = 0;
  contestar = () => { throw new TypeError("fetch failed"); }; // un corte de red: el SDK reintenta una vez
  await falla(/no se pudo conectar con Anthropic/);
  assert.equal(pedidos.length, 2);
});

test("un 400 no apaga el respaldo por rechazo salvo que el mismo pedido ande sin él", async () => {
  // 400 con y sin fallbacks (saldo agotado, modelo mal cargado): no era por el beta. Sigue prendido.
  contestar = () => rechazo(400, "error de prueba que no es del beta");
  await falla(/Anthropic contestó 400/);
  assert.deepEqual(pedidos.map((p) => p.cuerpo.fallbacks), ["default", undefined]);

  // 400 solo con fallbacks: era el beta. Ese pedido se contesta igual y recién ahí se apaga.
  pedidos.length = 0;
  contestar = (p) => (p.cuerpo.fallbacks ? rechazo(400, "no conozco fallbacks") : mensaje(JSON.stringify(buena)));
  assert.equal((await pide()).accion, "responder");
  assert.deepEqual(pedidos.map((p) => p.cuerpo.fallbacks), ["default", undefined]);
  pedidos.length = 0;
  await pide();
  assert.deepEqual(pedidos.map((p) => p.cuerpo.fallbacks), [undefined]);
});

/* ---------- ManyChat ---------- */

test("ManyChat: el id viaja como número, y un error llega con su código", async () => {
  contestar = () => json({ status: "success" });
  assert.deepEqual(await mandarTextos("12345678901234", ["uno", "dos"]), { ok: true });
  const { url, cuerpo, encabezados } = pedidos[0];
  assert.match(url, /\/fb\/sending\/sendContent$/);
  assert.equal(cuerpo.subscriber_id, 12345678901234);
  assert.deepEqual(cuerpo.data.content.messages, [{ type: "text", text: "uno" }, { type: "text", text: "dos" }]);
  assert.equal(encabezados.get("authorization"), "Bearer clave-de-prueba");

  assert.deepEqual(await ponerCampo("id-con-letras", "dm_dueno", "cande"), { ok: true });
  assert.equal(pedidos[1].cuerpo.subscriber_id, "id-con-letras");

  contestar = () => json({ status: "error", message: "mensaje de error de prueba", code: 3011 }, 400);
  const r = await mandarTextos("77", ["uno"]);
  assert.equal(r.ok, false);
  assert.equal(r.code, 3011);
  assert.match(r.error, /código 3011 \| mensaje de error de prueba/);
  assert.equal(r.incierto, undefined);
});

test("ManyChat: si se corta por tiempo no se da por no enviado, y sin clave no sale nada", async () => {
  contestar = () => { const e = new Error("cortado"); e.name = "AbortError"; throw e; };
  const r = await mandarTextos("77", ["uno"]);
  assert.equal(r.ok, false);
  assert.equal(r.incierto, true);

  contestar = () => { throw new TypeError("fetch failed"); };
  assert.equal((await mandarTextos("77", ["uno"])).incierto, undefined);

  delete process.env.MANYCHAT_API_KEY;
  pedidos.length = 0;
  assert.deepEqual(await mandarTextos("77", ["uno"]), { ok: false, error: "falta MANYCHAT_API_KEY" });
  assert.equal(pedidos.length, 0);
  process.env.MANYCHAT_API_KEY = "clave-de-prueba";
});
