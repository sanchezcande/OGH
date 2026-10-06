// lib/mandarMail.js solo, con todo inyectado: un Resend de mentira, un reloj de mentira y
// esperas que no esperan. Acá se prueba lo que de punta a punta tardaría (pausas,
// reintentos, quedarse sin tiempo) y la cuenta de cuánto dura una corrida llena.
//
// Correr:  node --test tests/*.test.mjs
import "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { aceptado, rechazo } from "./dobles/resend.mjs";

const { mandarMail, correrGoteo } = await import("../lib/mandarMail.js");

const gente = (desde, cuantos) =>
  Array.from({ length: cuantos }, (_, i) => ({ id: desde + i, email: `p${desde + i}@example.com` }));

/**
 * Arma una corrida de mentira. `pendientes` es { toque: [filas] }, `responder` decide qué
 * contesta Resend, `tardaMs` cuánto tarda en contestar (adelanta el reloj de mentira) y
 * `fallaAnotar` es el id de una fila cuyo UPDATE revienta.
 */
function corrida({ pendientes, responder, tardaMs = 0, limite, fallaAnotar }) {
  const c = { reloj: 0, pedidos: [], anotados: [], esperas: [], avisos: [] };
  c.correr = () => correrGoteo({
    cadena: "prueba",
    toques: Object.keys(pendientes).map((col) => ({ col })),
    buscar: async (t) => pendientes[t.col],
    armar: (t, r) => ({ to: r.email, subject: t.col }),
    anotar: async (t, r) => {
      if (r.id === fallaAnotar) throw new Error("se cayó la base");
      c.anotados.push(`${t.col}:${r.id}`);
    },
    resend: {
      emails: {
        send: async (m) => {
          c.pedidos.push(`${m.subject}:${m.to}`);
          c.reloj += tardaMs;
          return responder ? responder(m, c.pedidos.length) : aceptado(c.pedidos.length);
        },
      },
    },
    avisar: async (titulo, campos) => { c.avisos.push({ titulo, campos }); return true; },
    esperar: async (ms) => { c.esperas.push(ms); c.reloj += ms; },
    ahora: () => c.reloj,
    limite,
  });
  return c;
}

test("entre un envío y el siguiente hay una pausa: nunca más de 8 por segundo", async () => {
  const c = corrida({ pendientes: { drip_d1: gente(1, 10) } });
  const r = await c.correr();

  assert.equal(r.salieron, 10);
  assert.equal(c.esperas.length, 9);
  assert.ok(c.esperas.every((ms) => ms >= 1000 / 8), c.esperas.join(","));
});

test("velocidad: reintenta 2 veces; si sigue rechazando queda pendiente y la corrida sigue", async () => {
  const c = corrida({
    pendientes: { drip_d1: gente(1, 2) },
    responder: (m, n) => (m.to === "p1@example.com" ? rechazo("rate_limit_exceeded") : aceptado(n)),
  });
  const r = await c.correr();

  assert.deepEqual(c.pedidos, ["drip_d1:p1@example.com", "drip_d1:p1@example.com", "drip_d1:p1@example.com", "drip_d1:p2@example.com"]);
  assert.deepEqual(c.anotados, ["drip_d1:2"]);
  assert.deepEqual(r.fallaron, { rate_limit_exceeded: 1 });
  assert.equal(r.cortado, null);
  assert.equal(c.avisos.length, 0);
  // Antes de cada reintento esperó (1 y 2 segundos), además de la pausa de siempre.
  assert.deepEqual(c.esperas, [1000, 2000, 125]);
});

test("el cupo del mes corta igual que el del día", async () => {
  const c = corrida({
    pendientes: { drip_d1: gente(1, 4) },
    responder: () => rechazo("monthly_quota_exceeded"),
  });
  const r = await c.correr();

  assert.equal(c.pedidos.length, 1);
  assert.deepEqual(c.anotados, []);
  assert.deepEqual({ salieron: r.salieron, cortado: r.cortado, sinIntentar: r.sinIntentar }, { salieron: 0, cortado: "cupo", sinIntentar: 3 });
  assert.equal(c.avisos.length, 1);
  assert.match(c.avisos[0].campos.Motivo, /cupo de mails del mes/);
});

test("una persona, un intento por corrida: si su mail falla no se le prueba el toque siguiente", async () => {
  const [ana, beto] = gente(1, 2);
  const c = corrida({
    pendientes: { drip_d1: [ana], drip_d2: [ana, beto] },
    responder: (m, n) => (m.to === ana.email ? rechazo("validation_error", 422) : aceptado(n)),
  });
  const r = await c.correr();

  assert.deepEqual(c.pedidos, ["drip_d1:p1@example.com", "drip_d2:p2@example.com"]);
  assert.deepEqual(c.anotados, ["drip_d2:2"]);
  assert.deepEqual(r.enviados, { drip_d1: 0, drip_d2: 1 });
});

test("si falla el UPDATE de una fila, la corrida sigue con el resto", async () => {
  const c = corrida({ pendientes: { drip_d1: gente(1, 3) }, fallaAnotar: 2 });
  const r = await c.correr();

  assert.equal(c.pedidos.length, 3);
  assert.deepEqual(c.anotados, ["drip_d1:1", "drip_d1:3"]);
  assert.equal(r.salieron, 2);
  assert.deepEqual(r.fallaron, { excepcion: 1 });
  assert.equal(r.cortado, null);
  assert.equal(c.avisos.length, 0);
});

test("sin tiempo: no arranca ningún envío pasado el límite, avisa y dice cuántos faltaron", async () => {
  const c = corrida({ pendientes: { drip_d1: gente(1, 6) }, tardaMs: 300, limite: 1000 });
  const r = await c.correr();

  // 300 ms por envío y 125 de pausa: el tercero termina en 1150 ms, ya pasado el límite.
  assert.equal(c.pedidos.length, 3);
  assert.deepEqual(c.anotados, ["drip_d1:1", "drip_d1:2", "drip_d1:3"]);
  assert.deepEqual({ salieron: r.salieron, cortado: r.cortado, sinIntentar: r.sinIntentar }, { salieron: 3, cortado: "tiempo", sinIntentar: 3 });
  assert.equal(c.avisos.length, 1);
  assert.match(c.avisos[0].campos.Motivo, /tiempo/);
  assert.doesNotMatch(JSON.stringify(c.avisos[0]), /[—¿¡]/);
});

// La cuenta de tiempo. Los crons declaran maxDuration: 300 y le pasan a la corrida un
// límite 20 segundos antes (280 s). Una corrida llena son 6 toques de 40 = 240 mails.
const LLENA = () => Object.fromEntries(
  ["drip_d1", "drip_d2", "drip_d3", "drip_d7", "drip_d12", "drip_d17"].map((col, i) => [col, gente(i * 40 + 1, 40)]));
const LIMITE_MS = 280000;
const MAX_DURATION_MS = 300000;

test("corrida llena (240 mails) con Resend rápido: salen todos en menos de un minuto", async () => {
  const c = corrida({ pendientes: LLENA(), tardaMs: 75, limite: LIMITE_MS });
  const r = await c.correr();

  assert.equal(r.salieron, 240);
  assert.equal(r.cortado, null);
  assert.ok(c.reloj < 60000, `tardó ${c.reloj} ms`);
});

test("corrida llena con Resend lento (1 s por mail): también entra en el tiempo de la función", async () => {
  const c = corrida({ pendientes: LLENA(), tardaMs: 1000, limite: LIMITE_MS });
  const r = await c.correr();

  assert.equal(r.salieron, 240);
  assert.ok(c.reloj < LIMITE_MS, `tardó ${c.reloj} ms`);
});

test("corrida llena con Resend muy lento (3 s por mail): corta antes de que Vercel mate la función", async () => {
  const c = corrida({ pendientes: LLENA(), tardaMs: 3000, limite: LIMITE_MS });
  const r = await c.correr();

  assert.equal(r.cortado, "tiempo");
  assert.equal(r.salieron + r.sinIntentar, 240);
  assert.ok(r.salieron > 0 && r.sinIntentar > 0);
  assert.ok(c.reloj < MAX_DURATION_MS, `terminó a los ${c.reloj} ms`);
  assert.equal(c.avisos.length, 1);
});

test("mandarMail: sin error pero sin id no cuenta como aceptado", async () => {
  const resend = { emails: { send: async () => ({ data: {}, error: null, headers: {} }) } };

  assert.deepEqual(await mandarMail(resend, {}), { ok: false, motivo: "otro", error: "respuesta_inesperada" });
});

test("mandarMail: si el SDK tira una excepción, tampoco cuenta como mandado", async () => {
  const resend = { emails: { send: async () => { throw new Error("se cortó la conexión"); } } };

  assert.deepEqual(await mandarMail(resend, {}), { ok: false, motivo: "otro", error: "excepcion" });
});

test("mandarMail: aceptado devuelve el id que dio Resend", async () => {
  const resend = { emails: { send: async () => aceptado(7) } };

  assert.deepEqual(await mandarMail(resend, {}), { ok: true, id: "mail-7" });
});

test("si había mails y no salió ninguno por un error que no es cupo, avisa una vez y no anota nada", async () => {
  const c = corrida({
    pendientes: { drip_d1: gente(1, 3), drip_d2: gente(10, 2) },
    responder: () => rechazo("invalid_api_key", 401),
  });
  const r = await c.correr();

  assert.equal(r.salieron, 0);
  assert.equal(r.cortado, null);
  assert.deepEqual(c.anotados, []);
  assert.equal(c.pedidos.length, 5, "la corrida sigue: se intenta a todos");
  assert.equal(c.avisos.length, 1);
  assert.match(c.avisos[0].titulo, /No salió ningún mail/);
  assert.match(String(c.avisos[0].campos.Motivo), /invalid_api_key/);
  assert.equal(c.avisos[0].campos.Intentados, 5);
});

test("si salió al menos uno y no se cortó, no hay aviso", async () => {
  const c = corrida({
    pendientes: { drip_d1: gente(1, 3) },
    responder: (_m, n) => (n === 2 ? rechazo("validation_error", 422) : aceptado(n)),
  });
  const r = await c.correr();

  assert.equal(r.salieron, 2);
  assert.equal(c.avisos.length, 0);
});

test("el aviso por cupo no promete un orden que el código no cumple", async () => {
  const c = corrida({
    pendientes: { drip_d1: gente(1, 3) },
    responder: (_m, n) => (n === 2 ? rechazo("daily_quota_exceeded", 429) : aceptado(n)),
  });
  await c.correr();

  assert.equal(c.avisos.length, 1);
  const sigue = c.avisos[0].campos["Qué sigue"];
  assert.doesNotMatch(sigue, /primero los que más esperan/);
  assert.match(sigue, /sin anotar/);
  assert.ok(!/[\u2014\u00bf\u00a1]/.test(JSON.stringify(c.avisos[0])), "el aviso rompe las reglas de escritura");
});
