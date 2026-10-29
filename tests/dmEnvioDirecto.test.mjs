// Por dónde sale lo que escribe el agente (lib/dm/envio.js).
//
// Lo que no puede fallar: que se use Instagram cuando se puede (ManyChat cobra por contacto y está
// contra el techo), que nadie se quede sin respuesta si Instagram no anda, y sobre todo que un
// mensaje no salga DOS veces porque Instagram mandó la mitad y después se reintentó por ManyChat.
import "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
const { crearEnvio } = await import("../lib/dm/envio.js");

const baseCon = (contacto) => ({ contacto: async () => contacto });
const igQue = (resultado, visto = []) => ({
  mandarTextos: async (igId, textos) => {
    visto.push({ igId, textos });
    return resultado;
  },
});
const mcQue = (resultado, visto = []) => ({
  hayManyChat: () => true,
  mandarTextos: async (id, textos) => {
    visto.push({ id, textos });
    return resultado;
  },
});

test("con ig_id manda por Instagram y ManyChat ni se entera", async () => {
  const porIg = [];
  const porMc = [];
  const envio = crearEnvio({
    manychat: mcQue({ ok: true }, porMc),
    ig: igQue({ ok: true, mando: 1 }, porIg),
    base: baseCon({ id: "77", ig_id: "17841400000000001" }),
    hayIg: () => true,
  });

  const r = await envio.mandarTextos("77", ["hola"]);

  assert.equal(r.ok, true);
  assert.equal(r.por, "instagram");
  assert.deepEqual(porIg, [{ igId: "17841400000000001", textos: ["hola"] }]);
  assert.deepEqual(porMc, [], "si sale por Instagram, ManyChat no tiene que sumar un contacto");
});

test("sin ig_id sale por ManyChat: nadie se queda sin respuesta", async () => {
  const porMc = [];
  const envio = crearEnvio({
    manychat: mcQue({ ok: true }, porMc),
    ig: igQue({ ok: true }),
    base: baseCon({ id: "77", ig_id: null }),
    hayIg: () => true,
  });

  const r = await envio.mandarTextos("77", ["hola"]);

  assert.equal(r.ok, true);
  assert.equal(r.por, "manychat");
  assert.deepEqual(porMc, [{ id: "77", textos: ["hola"] }]);
});

test("sin token de Instagram no se intenta por ahí", async () => {
  const porIg = [];
  const envio = crearEnvio({
    manychat: mcQue({ ok: true }),
    ig: igQue({ ok: true }, porIg),
    base: baseCon({ id: "77", ig_id: "17841400000000001" }),
    hayIg: () => false,
  });

  const r = await envio.mandarTextos("77", ["hola"]);

  assert.equal(r.por, "manychat");
  assert.deepEqual(porIg, []);
});

test("si Instagram falla sin mandar nada, lo reintenta ManyChat", async () => {
  const porMc = [];
  const envio = crearEnvio({
    manychat: mcQue({ ok: true }, porMc),
    ig: igQue({ ok: false, error: "Instagram contestó 500", mando: 0 }),
    base: baseCon({ id: "77", ig_id: "17841400000000001" }),
    hayIg: () => true,
  });

  const r = await envio.mandarTextos("77", ["hola"]);

  assert.equal(r.ok, true);
  assert.equal(r.por, "manychat");
  assert.deepEqual(porMc, [{ id: "77", textos: ["hola"] }]);
});

test("si Instagram ya mandó alguno y falla el siguiente, NO se reintenta por ManyChat", async () => {
  const porMc = [];
  const envio = crearEnvio({
    manychat: mcQue({ ok: true }, porMc),
    ig: igQue({ ok: false, error: "se cayó en el segundo", mando: 1 }),
    base: baseCon({ id: "77", ig_id: "17841400000000001" }),
    hayIg: () => true,
  });

  const r = await envio.mandarTextos("77", ["uno", "dos"]);

  assert.equal(r.ok, false);
  assert.equal(r.por, "instagram");
  assert.deepEqual(porMc, [], "reintentar por ManyChat le mandaría el primer mensaje dos veces");
});

test("un envío incierto por Instagram tampoco se reintenta", async () => {
  const porMc = [];
  const envio = crearEnvio({
    manychat: mcQue({ ok: true }, porMc),
    ig: igQue({ ok: false, incierto: true, error: "tardó más de 12 segundos", mando: 0 }),
    base: baseCon({ id: "77", ig_id: "17841400000000001" }),
    hayIg: () => true,
  });

  const r = await envio.mandarTextos("77", ["hola"]);

  assert.equal(r.incierto, true);
  assert.deepEqual(porMc, [], "pudo haber salido igual: reintentarlo lo manda dos veces");
});

test("si la base no contesta, sale por ManyChat en vez de romperse", async () => {
  const porMc = [];
  const envio = crearEnvio({
    manychat: mcQue({ ok: true }, porMc),
    ig: igQue({ ok: true }),
    base: { contacto: async () => { throw new Error("base caída"); } },
    hayIg: () => true,
  });

  const r = await envio.mandarTextos("77", ["hola"]);

  assert.equal(r.ok, true);
  assert.equal(r.por, "manychat");
});

test("un ig_id que no es un id de Instagram no se usa", async () => {
  const porIg = [];
  const envio = crearEnvio({
    manychat: mcQue({ ok: true }),
    ig: igQue({ ok: true }, porIg),
    base: baseCon({ id: "77", ig_id: "sin_id" }),
    hayIg: () => true,
  });

  const r = await envio.mandarTextos("77", ["hola"]);

  assert.equal(r.por, "manychat");
  assert.deepEqual(porIg, []);
});

test("hayManyChat sigue estando: el agente lo mira antes de un toque", async () => {
  const envio = crearEnvio({
    manychat: mcQue({ ok: true }),
    ig: igQue({ ok: true }),
    base: baseCon(null),
  });
  assert.equal(typeof envio.hayManyChat, "function");
  assert.equal(envio.hayManyChat(), true);
});

// ── El POST a Instagram (lib/dm/instagram.js, mandar / mandarTextos) ──
const { crearInstagram } = await import("../lib/dm/instagram.js");

const clienteIg = (respuestas, visto = []) => crearInstagram({
  pedir: async (url, init) => {
    visto.push({ url, init });
    const r = respuestas.shift() ?? { ok: true, json: { recipient_id: "1", message_id: "m1" } };
    return { ok: r.ok !== false, status: r.status ?? 200, json: async () => r.json ?? {} };
  },
  leerConfig: async () => null,
  guardarConfig: async () => {},
  tokenEnv: () => "TOKEN_DE_PRUEBA",
});

test("manda a /me/messages con el id de la persona en Instagram", async () => {
  const visto = [];
  const ig = clienteIg([], visto);

  const r = await ig.mandarTextos("17841400000000001", ["hola"]);

  assert.equal(r.ok, true);
  assert.equal(visto.length, 1);
  assert.match(visto[0].url, /graph\.instagram\.com\/v\d+\.\d+\/me\/messages/);
  assert.equal(visto[0].init.method, "POST");
  assert.deepEqual(JSON.parse(visto[0].init.body), {
    recipient: { id: "17841400000000001" },
    message: { text: "hola" },
  });
});

test("los textos salen de a uno y en orden", async () => {
  const visto = [];
  const ig = clienteIg([], visto);

  await ig.mandarTextos("17841400000000001", ["uno", "dos", "tres"]);

  assert.deepEqual(visto.map((v) => JSON.parse(v.init.body).message.text), ["uno", "dos", "tres"]);
});

test("si Instagram rechaza, dice cuántos alcanzaron a salir", async () => {
  const ig = clienteIg([
    { ok: true },
    { ok: false, status: 400, json: { error: { message: "fuera de las 24 horas", code: 10 } } },
  ]);

  const r = await ig.mandarTextos("17841400000000001", ["uno", "dos"]);

  assert.equal(r.ok, false);
  assert.equal(r.mando, 1, "sin esto, quien llama no sabe que el primero ya salió y lo repite");
  assert.match(r.error, /24 horas/);
});

test("el token no viaja en el mensaje de error", async () => {
  const ig = clienteIg([
    { ok: false, status: 400, json: { error: { message: "mal access_token=TOKEN_DE_PRUEBA acá", code: 190 } } },
  ]);

  const r = await ig.mandarTextos("17841400000000001", ["hola"]);

  assert.equal(r.ok, false);
  assert.ok(!r.error.includes("TOKEN_DE_PRUEBA"), "el token no se registra nunca");
});
