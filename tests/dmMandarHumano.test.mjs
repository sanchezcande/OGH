// Mandar como persona (HUMAN_AGENT): solo para mensajes de Cande, hasta 7 días (20/10).
import "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const { mandarTextos } = await import("../lib/dm/manychat.js");

test("mandarTextos con humano agrega la etiqueta HUMAN_AGENT y sin humano no", async () => {
  const cuerpos = [];
  const antes = globalThis.fetch;
  process.env.MANYCHAT_API_KEY = "clave-de-prueba";
  globalThis.fetch = async (url, op) => { cuerpos.push(JSON.parse(op.body)); return { ok: true, status: 200, json: async () => ({ status: "success" }) }; };
  try {
    await mandarTextos("123", ["hola de prueba"], { humano: true });
    await mandarTextos("123", ["hola de prueba"]);
  } finally {
    globalThis.fetch = antes;
    delete process.env.MANYCHAT_API_KEY;
  }
  assert.equal(cuerpos[0].message_tag, "HUMAN_AGENT");
  assert.equal(cuerpos[1].message_tag, undefined);
  assert.deepEqual(cuerpos[0].data.content.messages, [{ type: "text", text: "hola de prueba" }]);
});

test("la acción mandar_humano valida los textos, frena el código y anota como de Cande", async () => {
  const src = await readFile(new URL("../pages/api/dm/config.js", import.meta.url), "utf8");
  const i = src.indexOf('b.accion === "mandar_humano"');
  assert.ok(i > -1);
  const cuerpo = src.slice(i, i + 1600);
  assert.match(cuerpo, /textos\.length > 3/);
  assert.match(cuerpo, /frenoDelCodigo\(/);
  assert.match(cuerpo, /mandarTextos\(id, textos, \{ humano: true \}\)/);
  assert.match(cuerpo, /anotarAMano\(id, "cande"/);
});
