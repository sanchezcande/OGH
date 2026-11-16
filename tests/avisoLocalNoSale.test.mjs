// El servidor de desarrollo no manda avisos de verdad.
//
// 16/11: Cande recibio en el Telegram de ventas "Alguien quiso pagar en pesos y no pudo / falta
// MP_ACCESS_TOKEN en Vercel" a las 18:28 WITA. En Vercel el MP_ACCESS_TOKEN estaba (alta del 19/10)
// y produccion cobraba bien: el mp_checkout de las 17:19 de ese dia entro, y la prueba contra
// produccion redirigio a mercadopago.com.ar. El aviso salia de una prueba LOCAL: `.env.local` tiene
// TELEGRAM_BOT_VENTAS y TELEGRAM_CHAT_VENTAS pero no tiene ningun MP_*, y el texto del aviso dice
// "en Vercel" porque el codigo no sabe donde esta corriendo.
import test from "node:test";
import assert from "node:assert/strict";

const cargar = async () => {
  const m = await import(`../lib/notificar.js?${Math.random()}`);
  return m.avisar;
};

test("con next dev el aviso se escribe en la consola y no sale a Telegram", async () => {
  const antesEnv = process.env.NODE_ENV;
  const antesFetch = global.fetch;
  const antesLog = console.log;
  let pedidos = 0;
  let escrito = "";
  global.fetch = async () => { pedidos += 1; return { ok: true, json: async () => ({ ok: true }) }; };
  console.log = (...a) => { escrito += a.map(String).join(" "); };
  process.env.NODE_ENV = "development";
  try {
    const avisar = await cargar();
    const salio = await avisar("Alguien quiso pagar en pesos y no pudo", { "Que paso": "falta MP_ACCESS_TOKEN en Vercel" }, { token: "123:abc", chat: "999" });
    assert.equal(salio, false, "no tiene que decir que salio");
    assert.equal(pedidos, 0, "no tiene que pegarle a la API de Telegram");
    assert.match(escrito, /NO sale a Telegram/);
  } finally {
    console.log = antesLog;
    global.fetch = antesFetch;
    if (antesEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = antesEnv;
  }
});

test("en produccion el aviso sale como siempre", async () => {
  const antesEnv = process.env.NODE_ENV;
  const antesFetch = global.fetch;
  let pedidos = 0;
  global.fetch = async () => { pedidos += 1; return { ok: true, json: async () => ({ ok: true }) }; };
  process.env.NODE_ENV = "production";
  try {
    const avisar = await cargar();
    const salio = await avisar("Compra nueva", { Quien: "alguien" }, { token: "123:abc", chat: "999" });
    assert.equal(salio, true);
    assert.equal(pedidos, 1);
  } finally {
    global.fetch = antesFetch;
    if (antesEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = antesEnv;
  }
});
