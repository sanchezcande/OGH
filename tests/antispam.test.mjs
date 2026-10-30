// Lo que para los envíos automáticos en los formularios (lib/antispam.js).
//
// Lo que no puede fallar: que un dev de verdad entre igual. Un formulario que rebota a quien se
// anota cuesta más que todo el spam junto, así que cada prueba de "esto se corta" tiene al lado su
// prueba de "esto pasa".
import "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
const { revisar, crearGuardia, ipDe, verificarCaptcha } = await import("../lib/antispam.js");

const pedido = (body = {}, ip = "1.2.3.4") => ({ headers: { "x-forwarded-for": ip }, body });
/** Un guardia nuevo por prueba: si no, las cuentas de una se le suman a la otra. */
const guardia = (opciones) => crearGuardia(opciones);

test("un envío normal pasa", async () => {
  const r = await revisar(pedido({ nombre: "Ezequiel", t0: Date.now() - 90_000 }), { guardia: guardia() });
  assert.equal(r.ok, true);
});

test("sin t0 pasa: una página vieja en caché no puede dejar afuera a un dev", async () => {
  const r = await revisar(pedido({ nombre: "Ezequiel" }), { guardia: guardia() });
  assert.equal(r.ok, true);
});

test("el que llena la trampa no pasa, y se le contesta como si todo saliera bien", async () => {
  const r = await revisar(pedido({ nombre: "x", web: "http://casino.example" }), { guardia: guardia() });
  assert.equal(r.ok, false);
  assert.equal(r.callar, true, "si le contestamos un error, el que escribió el script lo corrige");
});

test("la trampa vacía es lo normal: no la cuenta como llena", async () => {
  const r = await revisar(pedido({ nombre: "x", web: "   " }), { guardia: guardia() });
  assert.equal(r.ok, true);
});

test("un formulario de 15 campos llenado en un segundo no lo llenó una persona", async () => {
  const r = await revisar(pedido({ t0: Date.now() - 1000 }), { segundos: 3, guardia: guardia() });
  assert.equal(r.ok, false);
  assert.equal(r.callar, true);
});

test("el reloj no se pasa de estricto: a los 3 segundos ya pasa", async () => {
  const r = await revisar(pedido({ t0: Date.now() - 3200 }), { segundos: 3, guardia: guardia() });
  assert.equal(r.ok, true);
});

test("un t0 inventado no rompe nada", async () => {
  for (const t0 of ["mañana", null, 0, -5, NaN]) {
    const r = await revisar(pedido({ t0 }), { guardia: guardia() });
    assert.equal(r.ok, true, `con t0=${String(t0)} tendría que dejar pasar`);
  }
});

test("la misma IP no puede mandar diez: al séptimo se corta", async () => {
  const g = guardia({ porIp: 6 });
  const salidas = [];
  for (let i = 0; i < 8; i++) salidas.push(await revisar(pedido({ n: i }), { guardia: g }));
  assert.deepEqual(salidas.slice(0, 6).map((s) => s.ok), [true, true, true, true, true, true]);
  assert.equal(salidas[6].ok, false);
  assert.equal(salidas[6].codigo, 429);
  assert.match(salidas[6].error, /de nuevo/i);
});

test("el tope es por IP: el que manda de otra no paga el ajeno", async () => {
  const g = guardia({ porIp: 2 });
  await revisar(pedido({}, "9.9.9.9"), { guardia: g });
  await revisar(pedido({}, "9.9.9.9"), { guardia: g });
  assert.equal((await revisar(pedido({}, "9.9.9.9"), { guardia: g })).ok, false);
  assert.equal((await revisar(pedido({}, "8.8.8.8"), { guardia: g })).ok, true);
});

test("y hay un tope total, para el que manda desde mil IP distintas", async () => {
  const g = guardia({ porIp: 100, enTotal: 5 });
  for (let i = 0; i < 5; i++) {
    assert.equal((await revisar(pedido({}, `10.0.0.${i}`), { guardia: g })).ok, true);
  }
  const r = await revisar(pedido({}, "10.0.0.99"), { guardia: g });
  assert.equal(r.ok, false);
  assert.equal(r.codigo, 429);
});

test("la cuenta es de la última hora: lo de ayer no bloquea a nadie", async () => {
  let t = Date.parse("2026-10-30T10:00:00Z");
  const g = crearGuardia({ ahora: () => t, porIp: 2 });
  await revisar(pedido(), { guardia: g });
  await revisar(pedido(), { guardia: g });
  assert.equal((await revisar(pedido(), { guardia: g })).ok, false);
  t += 61 * 60 * 1000;
  assert.equal((await revisar(pedido(), { guardia: g })).ok, true, "pasó la hora, la cuenta arranca de nuevo");
});

test("la trampa y el reloj cortan antes del tope: un bot no gasta el cupo de nadie", async () => {
  const g = guardia({ porIp: 1 });
  await revisar(pedido({ web: "spam" }), { guardia: g });
  await revisar(pedido({ t0: Date.now() }), { segundos: 3, guardia: g });
  assert.equal((await revisar(pedido({}), { guardia: g })).ok, true);
});

test("la IP sale del primer valor de x-forwarded-for", () => {
  assert.equal(ipDe({ headers: { "x-forwarded-for": "200.1.2.3, 10.0.0.1, 10.0.0.2" } }), "200.1.2.3");
  assert.equal(ipDe({ headers: { "x-real-ip": "200.1.2.3" } }), "200.1.2.3");
  assert.equal(ipDe({ headers: {} }), null, "sin esos encabezados el pedido no entró por internet");
});

test("lo que no entró por internet no tiene tope: ella prueba el formulario en su Mac", async () => {
  const g = guardia({ porIp: 2, enTotal: 2 });
  const local = { headers: {}, body: {} };
  for (let i = 0; i < 10; i++) {
    assert.equal((await revisar(local, { guardia: g })).ok, true);
  }
});

// ── El captcha ──
// Sin RECAPTCHA_SECRET en Vercel el captcha no se puede verificar: el formulario queda con las otras
// tres capas y no se rechaza a nadie por eso (era lo que pasaba hasta el 30/10, con el widget puesto
// en la página y el token sin viajar).
test("sin la clave de Google, el captcha no se exige", async () => {
  delete process.env.RECAPTCHA_SECRET;
  const r = await revisar(pedido({ nombre: "x" }), { captcha: true, guardia: guardia() });
  assert.equal(r.ok, true);
});

test("con la clave puesta, sin token no se guarda nada", async () => {
  process.env.RECAPTCHA_SECRET = "secreto-de-prueba";
  try {
    const r = await revisar(pedido({ nombre: "x" }), { captcha: true, guardia: guardia() });
    assert.equal(r.ok, false);
    assert.equal(r.codigo, 400);
  } finally {
    delete process.env.RECAPTCHA_SECRET;
  }
});

test("con la clave puesta y el token bueno, pasa", async () => {
  process.env.RECAPTCHA_SECRET = "secreto-de-prueba";
  try {
    const visto = [];
    const pedir = async (url, init) => {
      visto.push({ url, body: init.body });
      return { json: async () => ({ success: true }) };
    };
    const r = await revisar(pedido({ captcha: "token-bueno" }), { captcha: true, guardia: guardia(), pedir });
    assert.equal(r.ok, true);
    assert.match(visto[0].url, /recaptcha\/api\/siteverify/);
    assert.match(visto[0].body, /response=token-bueno/);
    assert.ok(!visto[0].body.includes("secreto-de-prueba&secret"), "la clave va una sola vez");
    assert.match(visto[0].body, /secret=secreto-de-prueba/);
  } finally {
    delete process.env.RECAPTCHA_SECRET;
  }
});

test("si Google dice que el token no sirve, no pasa", async () => {
  process.env.RECAPTCHA_SECRET = "secreto-de-prueba";
  try {
    const pedir = async () => ({ json: async () => ({ success: false, "error-codes": ["timeout-or-duplicate"] }) });
    const r = await revisar(pedido({ captcha: "viejo" }), { captcha: true, guardia: guardia(), pedir });
    assert.equal(r.ok, false);
    assert.equal(r.codigo, 400);
    assert.match(r.motivo, /timeout-or-duplicate/);
  } finally {
    delete process.env.RECAPTCHA_SECRET;
  }
});

test("si el que se cae es Google, el founder manda igual", async () => {
  process.env.RECAPTCHA_SECRET = "secreto-de-prueba";
  try {
    const pedir = async () => { throw new Error("se cayó Google"); };
    const r = await verificarCaptcha("token", "1.2.3.4", pedir);
    assert.equal(r.ok, true, "es peor perder al que escribió de verdad que dejar pasar un bot");
  } finally {
    delete process.env.RECAPTCHA_SECRET;
  }
});
