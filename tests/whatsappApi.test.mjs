// Mandar por WhatsApp (lib/whatsapp/api.js).
//
// Lo que no puede fallar:
//   1. Que sin el número dado de alta esto quede inerte y no explote: al 10/11 las dos variables no
//      están, porque el alta espera un chip argentino.
//   2. Que el pedido sea el que pide Meta (POST a /v23.0/<phone_number_id>/messages con el token
//      de portador), y al número que corresponde.
//   3. Que "pasó la ventana de 24 horas" (131047) se reconozca como tal y no como un error
//      cualquiera: de eso depende que el bot le explique a Cande por qué no salió.
//
// Correr:  node --test tests/*.test.mjs
import "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

const { TOPE_TEXTO, hayWhatsapp, mandarTexto } = await import("../lib/whatsapp/api.js");

const NUMERO = "5491122334455";

/** Corre `f` con las variables puestas y un fetch de mentira que devuelve `respuesta`. */
async function con(respuesta, f) {
  const pedidos = [];
  const previo = globalThis.fetch;
  process.env.WHATSAPP_TOKEN = "token-de-prueba";
  process.env.WHATSAPP_PHONE_NUMBER_ID = "77001";
  globalThis.fetch = async (url, opciones) => {
    pedidos.push({ url: String(url), opciones });
    return { ok: respuesta.ok !== false, status: respuesta.status || 200, json: async () => respuesta.cuerpo };
  };
  try {
    return { pedidos, salida: await f() };
  } finally {
    globalThis.fetch = previo;
    delete process.env.WHATSAPP_TOKEN;
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;
  }
}

test("sin el número dado de alta no se intenta nada y no se cae", async () => {
  assert.equal(hayWhatsapp(), false);
  assert.deepEqual(await mandarTexto(NUMERO, "hola"), { ok: false, sinConfigurar: true });
});

test("el pedido es el que pide Meta: v23.0, el id del número y el token de portador", async () => {
  const { pedidos, salida } = await con({ cuerpo: { messages: [{ id: "wamid.SALIDA" }] } }, () => mandarTexto(`+54 9 11 2233-4455`, "Buenas! Te llamo mañana"));
  assert.deepEqual(salida, { ok: true, id: "wamid.SALIDA" });
  assert.equal(pedidos.length, 1);
  assert.equal(pedidos[0].url, "https://graph.facebook.com/v23.0/77001/messages");
  assert.equal(pedidos[0].opciones.headers.Authorization, "Bearer token-de-prueba");
  assert.deepEqual(JSON.parse(pedidos[0].opciones.body), {
    messaging_product: "whatsapp", recipient_type: "individual", to: NUMERO,
    type: "text", text: { preview_url: false, body: "Buenas! Te llamo mañana" },
  });
});

test("131047 es la ventana de 24 horas cerrada, no un error cualquiera", async () => {
  const { salida } = await con({ ok: false, status: 400, cuerpo: { error: { code: 131047, message: "Re-engagement message" } } }, () => mandarTexto(NUMERO, "hola"));
  assert.deepEqual(salida, { ok: false, fueraDeVentana: true, code: 131047 });
  // El mismo caso como lo devolvía la versión vieja de la API.
  const viejo = await con({ ok: false, status: 400, cuerpo: { error: { code: 470 } } }, () => mandarTexto(NUMERO, "hola"));
  assert.equal(viejo.salida.fueraDeVentana, true);
});

test("un número que no recibe, y cualquier otro error, se distinguen", async () => {
  const no = await con({ ok: false, status: 400, cuerpo: { error: { code: 131026, message: "Message undeliverable" } } }, () => mandarTexto(NUMERO, "hola"));
  assert.equal(no.salida.noLlega, true);
  const otro = await con({ ok: false, status: 400, cuerpo: { error: { code: 100, message: "Invalid parameter" } } }, () => mandarTexto(NUMERO, "hola"));
  assert.deepEqual(otro.salida, { ok: false, code: 100, error: "Invalid parameter" });
  // Un 200 sin el id del mensaje no es un envío: no se puede decir que salió.
  const raro = await con({ cuerpo: { messages: [] } }, () => mandarTexto(NUMERO, "hola"));
  assert.equal(raro.salida.ok, false);
});

test("un corte por tiempo queda incierto: pudo haber salido, no se repite solo", async () => {
  const previo = globalThis.fetch;
  process.env.WHATSAPP_TOKEN = "t";
  process.env.WHATSAPP_PHONE_NUMBER_ID = "77001";
  globalThis.fetch = async () => { throw Object.assign(new Error("abortado"), { name: "AbortError" }); };
  try {
    const r = await mandarTexto(NUMERO, "hola");
    assert.equal(r.incierto, true);
    assert.match(r.error, /se cortó por tiempo/);
  } finally {
    globalThis.fetch = previo;
    delete process.env.WHATSAPP_TOKEN;
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;
  }
});

test("sin número, sin texto o con un texto que pasa el tope de WhatsApp, no se intenta", async () => {
  const sinRed = async (f) => {
    const previo = globalThis.fetch;
    process.env.WHATSAPP_TOKEN = "t";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "77001";
    globalThis.fetch = async () => { throw new Error("no tenía que pedir nada"); };
    try {
      return await f();
    } finally {
      globalThis.fetch = previo;
      delete process.env.WHATSAPP_TOKEN;
      delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    }
  };
  assert.equal(TOPE_TEXTO, 4096);
  assert.match((await sinRed(() => mandarTexto("", "hola"))).error, /sin número/);
  assert.match((await sinRed(() => mandarTexto(NUMERO, "   "))).error, /sin texto/);
  assert.match((await sinRed(() => mandarTexto(NUMERO, "a".repeat(TOPE_TEXTO + 1)))).error, /pasa los 4096/);
});
